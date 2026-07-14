from pydantic import BaseModel
from typing import Optional

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    deadline: Optional[str] = None
    is_completed: bool = False

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[str] = None
    is_completed: Optional[bool] = None

class Task(TaskBase):
    id: int

    class Config:
        from_attributes = True
