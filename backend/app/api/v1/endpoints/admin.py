from fastapi import APIRouter, Depends, HTTPException, Header
from typing import List, Any, Optional

from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.api.auth_utils import get_current_user, require_admin
from app import schemas
from app.models.user import User
from app.models.project import Project
from app.models.layer import Layer
from app.crud import crud_user

router = APIRouter()


@router.get("/stats", response_model=Any)
def get_stats(db: Session = Depends(get_db)) -> Any:
    total_users = db.query(User).count()
    total_projects = db.query(Project).count()
    total_layers = db.query(Layer).count()
    admins_count = db.query(User).filter(User.is_admin == True).count()
    
    return {
        "active_users": total_users,
        "total_users": total_users,
        "total_projects": total_projects,
        "total_layers": total_layers,
        "avg_layers_per_project": round(total_layers / total_projects, 1) if total_projects > 0 else 0,
        "user_distribution": {
            "admins": admins_count,
            "regular": total_users - admins_count,
            "inactive": 0
        },
        "recent_activity": [
            {"type": "user", "text": f"Sincronizados {total_users} usuarios", "time": "Ahora"},
            {"type": "project", "text": f"Base de datos con {total_projects} proyectos", "time": "Ahora"}
        ]
    }

@router.get("/users", response_model=List[Any])
def list_users(db: Session = Depends(get_db)) -> Any:
    users = crud_user.get_users(db)
    result = []
    for user in users:
        result.append({
            "id": user.id,
            "full_name": user.full_name,
            "access_code": user.access_code,
            "role": "Admin" if user.is_admin else "User",
            "projects_count": len(user.projects),
            "is_active": user.is_active
        })
    return result

@router.post("/users", response_model=schemas.User)
def create_user(
    user_in: schemas.UserCreate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Any:
    # Validar que es admin
    current_user = get_current_user(authorization, db)
    require_admin(current_user)
    
    # Check if access code already exists
    user = crud_user.get_user_by_access_code(db, access_code=user_in.access_code)
    if user:
        raise HTTPException(status_code=400, detail="The user with this access code already exists")
    
    return crud_user.create_user(db, user=user_in)

@router.put("/users/{user_id}", response_model=schemas.User)
def update_user(
    user_id: int,
    user_in: schemas.UserUpdate,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Any:
    # Validar que es admin
    current_user = get_current_user(authorization, db)
    require_admin(current_user)
    
    user = crud_user.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user = crud_user.update_user(db, user_id=user_id, user_update=user_in)
    return user

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Any:
    # Validar que es admin
    current_user = get_current_user(authorization, db)
    require_admin(current_user)
    # Check if user exists
    user = crud_user.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Hard delete for now, or could toggle is_active
    crud_user.delete_user(db, user_id=user_id)
    return {"status": "success", "message": "User deleted"}

@router.get("/projects-summary", response_model=List[Any])
def list_projects_summary(db: Session = Depends(get_db)) -> Any:
    projects = db.query(Project).all()
    result = []
    for p in projects:
        result.append({
            "id": p.id,
            "name": p.name,
            "location": p.location,
            "status": p.status if hasattr(p, 'status') else "active",
            "stage": p.stage if hasattr(p, 'stage') else "Planificación",
            "users_count": len(p.users),
            "layers_count": len(p.layers)
        })
    return result
