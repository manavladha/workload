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
    # Organizations table – the "name" field is used as the org name.
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
    orgId: int

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

# Login endpoint: verifies email exists and password matches.
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

# Get org members by orgId
@app.get("/orgmembers/")
def get_org_members(orgId: int = Query(None)):
    conn = get_db()
    cursor = conn.cursor()
    if orgId is not None:
        rows = cursor.execute("SELECT * FROM orgMembers WHERE orgId = ?", (orgId,)).fetchall()
    else:
        rows = cursor.execute("SELECT * FROM orgMembers").fetchall()
    conn.close()
    return [dict(row) for row in rows]

# GET users filtered by orgId
@app.get("/users/")
def get_users(orgId: int = Query(None)):
    conn = get_db()
    cursor = conn.cursor()
    if orgId:
        # Fetch users who are members of the given org (via orgMembers join)
        users = cursor.execute(
            "SELECT DISTINCT u.* FROM users u JOIN orgMembers om ON u.id = om.userId WHERE om.orgId = ?",
            (orgId,)
        ).fetchall()
    else:
        users = cursor.execute("SELECT * FROM users").fetchall()
    conn.close()
    return [dict(user) for user in users]

# get user organizations
@app.get("/user-organizations/")
def get_user_organizations(userId: int = Query(...)):
    conn = get_db()
    cursor = conn.cursor()
    orgs = cursor.execute("""
      SELECT o.* 
      FROM organizations o 
      JOIN orgMembers om ON o.id = om.orgId 
      WHERE om.userId = ?
    """, (userId,)).fetchall()
    conn.close()
    return [dict(o) for o in orgs]


# POST user call – modified to add an org member if the email already exists.
@app.post("/users/")
def create_user(user: UserCreate):
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.datetime.utcnow().isoformat()
    # Check if a user with this email already exists.
    cursor.execute("SELECT * FROM users WHERE email = ?", (user.email,))
    existing_user = cursor.fetchone()
    if existing_user:
        user_id = existing_user["id"]
        # If the user is not already a member of this organization, add them.
        cursor.execute("SELECT * FROM orgMembers WHERE orgId = ? AND userId = ?", (user.orgId, user_id))
        if not cursor.fetchone():
            cursor.execute(
                "INSERT INTO orgMembers (orgId, userId, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
                (user.orgId, user_id, 'member', now, now)
            )
            conn.commit()
        conn.close()
        return {
            "id": user_id,
            "name": existing_user["name"],
            "email": existing_user["email"],
            "orgId": user.orgId
        }
    else:
        # Create a new user.
        cursor.execute(
            "INSERT INTO users (name, email, orgId, emailVerified, accessRole) VALUES (?, ?, ?, ?, ?)",
            (user.name, user.email, user.orgId, 0, 'member')
        )
        conn.commit()
        user_id = cursor.lastrowid
        # Create an orgMembers entry for the new user.
        cursor.execute(
            "INSERT INTO orgMembers (orgId, userId, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
            (user.orgId, user_id, 'member', now, now)
        )
        conn.commit()
        conn.close()
        return {
            "id": user_id,
            "name": user.name,
            "email": user.email,
            "orgId": user.orgId
        }

@app.put("/users/{user_id}")
def update_user(user_id: int, user: UserCreate):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE users SET name = ?, email = ?, orgId = ? WHERE id = ?",
            (user.name, user.email, user.orgId, user_id)
        )
        conn.commit()
        if cursor.rowcount == 0:
            conn.close()
            raise HTTPException(status_code=404, detail="User not found")
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Email already exists")
    conn.close()
    return {"id": user_id, "name": user.name, "email": user.email, "orgId": user.orgId}

@app.delete("/users/{user_id}")
def delete_user(user_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="User not found")
    conn.close()
    return {"message": "User deleted successfully"}

@app.put("/tasks/{task_id}")
def update_task(task_id: int, task: TaskCreate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE tasks SET name = ?, org_member_id = ?, start_date = ?, end_date = ?, description = ? WHERE id = ?",
        (task.name, task.org_member_id, str(task.start_date), str(task.end_date), task.description, task_id)
    )
    conn.commit()
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")
    conn.close()
    return {"id": task_id, **task.dict()}

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")
    conn.close()
    return {"message": "Task deleted successfully"}

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

# New endpoint: Get orgMember by user id and organization id.
@app.get("/orgmember/byuserorg/")
def get_org_member_by_user_and_org(userId: int, orgId: int):
    conn = get_db()
    cursor = conn.cursor()
    org_member = cursor.execute("SELECT * FROM orgMembers WHERE userId = ? AND orgId = ?", (userId, orgId)).fetchone()
    conn.close()
    if org_member:
         return dict(org_member)
    else:
         raise HTTPException(status_code=404, detail="OrgMember not found for the given user and org")

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
