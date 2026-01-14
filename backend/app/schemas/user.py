from pydantic import BaseModel
from typing import Optional, List


class UserBase(BaseModel):
    full_name: str
    email: Optional[str] = None
    is_active: Optional[bool] = True
    is_admin: Optional[bool] = False


class UserCreate(UserBase):
    access_code: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = "user"
    project_ids: Optional[List[int]] = []


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    access_code: Optional[str] = None
    is_active: Optional[bool] = None
    is_admin: Optional[bool] = None
    role: Optional[str] = None
    project_ids: Optional[List[int]] = None


class User(UserBase):
    id: int
    access_code: Optional[str] = None
    role: Optional[str] = "user"

    class Config:
        from_attributes = True
