from datetime import datetime

from sqlalchemy import Boolean, Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.db.base_class import Base
from app.models.associations import user_project_association


class User(Base):
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    access_code = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=True)
    role = Column(String, default="user", index=True)
    is_active = Column(Boolean(), default=True)
    is_admin = Column(Boolean(), default=False)
    reset_code = Column(String, nullable=True, index=True)
    reset_code_expires = Column(DateTime, nullable=True)

    projects = relationship("Project", secondary=user_project_association, back_populates="users")
