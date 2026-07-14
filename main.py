from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import os

import models
import schemas
from database import engine, get_db

# Buat tabel jika belum ada
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Daily Task CRUD API")

# CRUD API endpoints

@app.get("/api/tasks", response_model=List[schemas.Task])
def read_tasks(db: Session = Depends(get_db)):
    return db.query(models.Task).all()

@app.get("/api/tasks/{task_id}", response_model=schemas.Task)
def read_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return db_task

@app.post("/api/tasks", response_model=schemas.Task, status_code=status.HTTP_201_CREATED)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    db_task = models.Task(
        title=task.title,
        description=task.description,
        deadline=task.deadline,
        is_completed=task.is_completed
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.put("/api/tasks/{task_id}", response_model=schemas.Task)
def update_task(task_id: int, task: schemas.TaskUpdate, db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update field yang diberikan
    update_data = task.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)
        
    db.commit()
    db.refresh(db_task)
    return db_task

@app.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if db_task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(db_task)
    db.commit()
    return None

# Serve Static Files
# Pastikan folder static ada
os.makedirs("static", exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_index():
    response = FileResponse("static/index.html")
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

@app.get("/style.css")
def read_css():
    response = FileResponse("static/style.css")
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response

@app.get("/app.js")
def read_js():
    response = FileResponse("static/app.js")
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


