from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

from typing import List
from datetime import date, timedelta
import sqlite3

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to your frontend domain for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    conn = sqlite3.connect("database.db")
    conn.row_factory = sqlite3.Row
    return conn

# Database Initialization
def init_db():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        email TEXT UNIQUE NOT NULL)
                   ''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS tasks (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        user_id INTEGER NOT NULL,
                        start_date TEXT NOT NULL,
                        end_date TEXT NOT NULL,
                        description TEXT,
                        FOREIGN KEY(user_id) REFERENCES users(id))
                   ''')
    conn.commit()
    conn.close()

init_db()

# Pydantic Models
class UserCreate(BaseModel):
    name: str
    email: str

class TaskCreate(BaseModel):
    name: str
    user_id: int
    start_date: date
    end_date: date
    description: str = ""

class UserResponse(UserCreate):
    id: int

class TaskResponse(TaskCreate):
    id: int

# Routes
@app.post("/users/", response_model=UserResponse)
def create_user(user: UserCreate):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO users (name, email) VALUES (?, ?)", (user.name, user.email))
        conn.commit()
        user_id = cursor.lastrowid
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=400, detail="Email already exists")
    return {"id": user_id, **user.dict()}

@app.get("/users/", response_model=List[UserResponse])
def get_users():
    conn = get_db()
    cursor = conn.cursor()
    users = cursor.execute("SELECT * FROM users").fetchall()
    return [{"id": user["id"], "name": user["name"], "email": user["email"]} for user in users]

@app.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user: UserCreate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET name = ?, email = ? WHERE id = ?", (user.name, user.email, user_id))
    conn.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": user_id, **user.dict()}

@app.delete("/users/{user_id}")
def delete_user(user_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

@app.post("/tasks/", response_model=TaskResponse)
def create_task(task: TaskCreate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO tasks (name, user_id, start_date, end_date, description) VALUES (?, ?, ?, ?, ?)",
                   (task.name, task.user_id, task.start_date, task.end_date, task.description))
    conn.commit()
    task_id = cursor.lastrowid
    return {"id": task_id, **task.dict()}

@app.get("/tasks/", response_model=List[TaskResponse])
def get_tasks():
    conn = get_db()
    cursor = conn.cursor()
    tasks = cursor.execute("SELECT * FROM tasks").fetchall()
    return [{"id": task["id"], "name": task["name"], "user_id": task["user_id"],
             "start_date": task["start_date"], "end_date": task["end_date"], "description": task["description"]} for task in tasks]

@app.put("/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, task: TaskCreate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE tasks SET name = ?, user_id = ?, start_date = ?, end_date = ?, description = ? WHERE id = ?",
                   (task.name, task.user_id, task.start_date, task.end_date, task.description, task_id))
    conn.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"id": task_id, **task.dict()}

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    conn.commit()
    if cursor.rowcount == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}