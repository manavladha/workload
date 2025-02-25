from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3, random, datetime

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    conn = sqlite3.connect("workload.db", check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

# Database Initialization
def init_db():
    conn = get_db()
    cursor = conn.cursor()
    # Users table with new fields (including password)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT,
            orgId INTEGER,
            emailVerified INTEGER DEFAULT 0,
            accessRole TEXT DEFAULT 'member'
        )
    ''')
    # Organizations table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS organizations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
        )
    ''')
    # orgMembers table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orgMembers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            orgId INTEGER NOT NULL,
            userId INTEGER NOT NULL,
            role TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL,
            FOREIGN KEY(orgId) REFERENCES organizations(id),
            FOREIGN KEY(userId) REFERENCES users(id)
        )
    ''')
    # Tasks table now stores org_member_id instead of user_id
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            org_member_id INTEGER NOT NULL,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            description TEXT,
            FOREIGN KEY(org_member_id) REFERENCES orgMembers(id)
        )
    ''')
    # OTPs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS otps (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER NOT NULL,
            otp TEXT NOT NULL,
            createdAt TEXT NOT NULL,
            expiresAt TEXT NOT NULL,
            FOREIGN KEY(userId) REFERENCES users(id)
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# ---------------------------
# Pydantic Models
# ---------------------------
class UserCreate(BaseModel):
    name: str
    email: str

class TaskCreate(BaseModel):
    name: str
    org_member_id: int
    start_date: datetime.date
    end_date: datetime.date
    description: str = ""

class SignupRequest(BaseModel):
    name: str
    email: str

class OTPVerifyRequest(BaseModel):
    user_id: int
    otp: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

# ---------------------------
# Endpoints
# ---------------------------

# Login endpoint verifies that the email exists and the password matches.
@app.post("/login/")
def login(request: LoginRequest):
    conn = get_db()
    cursor = conn.cursor()
    user = cursor.execute("SELECT * FROM users WHERE email = ?", (request.email,)).fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=400, detail="Email not found")
    if user["password"] != request.password:
        conn.close()
        raise HTTPException(status_code=400, detail="Incorrect password")
    conn.close()
    return {
        "user_id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "orgId": user["orgId"],
        "accessRole": user["accessRole"]
    }

# GET users filtered by orgId
@app.get("/users/")
def get_users(orgId: int = Query(None)):
    conn = get_db()
    cursor = conn.cursor()
    if orgId:
        users = cursor.execute("SELECT * FROM users WHERE orgId = ?", (orgId,)).fetchall()
    else:
        users = cursor.execute("SELECT * FROM users").fetchall()
    conn.close()
    return [dict(user) for user in users]

# Create task: now expects org_member_id instead of user_id
@app.post("/tasks/")
def create_task(task: TaskCreate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO tasks (name, org_member_id, start_date, end_date, description) VALUES (?, ?, ?, ?, ?)",
        (task.name, task.org_member_id, str(task.start_date), str(task.end_date), task.description)
    )
    conn.commit()
    task_id = cursor.lastrowid
    conn.close()
    return {"id": task_id, **task.dict()}

# GET tasks filtered by orgId via a join with orgMembers
@app.get("/tasks/")
def get_tasks(orgId: int = Query(None)):
    conn = get_db()
    cursor = conn.cursor()
    if orgId:
        tasks = cursor.execute(
            "SELECT tasks.* FROM tasks JOIN orgMembers ON tasks.org_member_id = orgMembers.id WHERE orgMembers.orgId = ?",
            (orgId,)
        ).fetchall()
    else:
        tasks = cursor.execute("SELECT * FROM tasks").fetchall()
    conn.close()
    return [dict(task) for task in tasks]

# New endpoint: Get orgMember by user id.
@app.get("/orgmember/byuser/")
def get_org_member_by_user(userId: int = Query(...)):
    conn = get_db()
    cursor = conn.cursor()
    org_member = cursor.execute("SELECT * FROM orgMembers WHERE userId = ?", (userId,)).fetchone()
    conn.close()
    if org_member:
         return dict(org_member)
    else:
         raise HTTPException(status_code=404, detail="OrgMember not found for the given user")

@app.post("/signup/")
def signup(request: SignupRequest):
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.datetime.utcnow().isoformat()
    # 1. Create a new organization for the user
    org_name = f"{request.name}'s Organization"
    cursor.execute(
        "INSERT INTO organizations (name, createdAt, updatedAt) VALUES (?, ?, ?)",
        (org_name, now, now)
    )
    org_id = cursor.lastrowid

    # 2. Create the user (admin role, no password yet)
    try:
        cursor.execute(
            "INSERT INTO users (name, email, orgId, emailVerified, accessRole) VALUES (?, ?, ?, ?, ?)",
            (request.name, request.email, org_id, 0, 'admin')
        )
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Email already exists")
    user_id = cursor.lastrowid

    # 3. Create an orgMembers entry for the user
    cursor.execute(
        "INSERT INTO orgMembers (orgId, userId, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
        (org_id, user_id, 'admin', now, now)
    )

    # 4. Generate a 6-digit OTP (valid 2 minutes)
    otp_code = str(random.randint(100000, 999999))
    expires_at = (datetime.datetime.utcnow() + datetime.timedelta(minutes=2)).isoformat()
    cursor.execute(
        "INSERT INTO otps (userId, otp, createdAt, expiresAt) VALUES (?, ?, ?, ?)",
        (user_id, otp_code, now, expires_at)
    )
    conn.commit()
    conn.close()

    return {
        "message": "Signup successful. Use the OTP to verify and set your password.",
        "user_id": user_id,
        "otp": otp_code
    }

@app.post("/verify-otp/")
def verify_otp(data: OTPVerifyRequest):
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.datetime.utcnow().isoformat()
    record = cursor.execute("SELECT * FROM otps WHERE userId=? AND otp=?", (data.user_id, data.otp)).fetchone()
    if record:
        if record["expiresAt"] > now:
            cursor.execute("UPDATE users SET emailVerified=1, password=? WHERE id=?", (data.password, data.user_id))
            conn.commit()
            conn.close()
            return {"message": "OTP verified and password set successfully."}
        else:
            conn.close()
            raise HTTPException(status_code=400, detail="OTP expired.")
    conn.close()
    raise HTTPException(status_code=400, detail="Invalid OTP.")
