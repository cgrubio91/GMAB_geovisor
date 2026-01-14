from fastapi import APIRouter, Depends, HTTPException, Header
from typing import List, Any, Optional
from app import schemas
from app.api.deps import get_db
from sqlalchemy.orm import Session
from app.models.project import Project
from app.models.user import User
from app.crud import crud_project

router = APIRouter()

@router.get("/", response_model=List[schemas.Project])
def read_projects(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = "created_at"
) -> Any:
    """
    Obtener proyectos con búsqueda y filtrado avanzado.
    
    Parámetros:
    - search: búsqueda por nombre o descripción (full-text)
    - status: filtrar por estado (Activo, Completado, En pausa)
    - sort_by: ordenar por (name, created_at, updated_at)
    - skip: offset para paginación
    - limit: cantidad máxima de resultados
    """
    query = db.query(Project)
    
    # Búsqueda full-text
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Project.name.ilike(search_term)) | 
            (Project.description.ilike(search_term))
        )
    
    # Filtrar por estado
    if status:
        query = query.filter(Project.status == status)
    
    # Ordenamiento
    if sort_by == "name":
        query = query.order_by(Project.name)
    elif sort_by == "updated_at":
        query = query.order_by(Project.updated_at.desc())
    else:  # created_at por defecto
        query = query.order_by(Project.created_at.desc())
    
    return query.offset(skip).limit(limit).all()

@router.get("/{project_id}", response_model=schemas.Project)
def read_project(
    project_id: int,
    db: Session = Depends(get_db)
) -> Any:
    project = crud_project.get_project(db, project_id=project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

@router.post("/", response_model=schemas.Project)
def create_project(
    project_in: schemas.ProjectCreate,
    db: Session = Depends(get_db)
) -> Any:
    return crud_project.create_project(db, project=project_in)

@router.put("/{project_id}", response_model=schemas.Project)
def update_project(
    project_id: int,
    project_in: schemas.ProjectUpdate,
    db: Session = Depends(get_db)
) -> Any:
    project = crud_project.get_project(db, project_id=project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
        
    return crud_project.update_project(db, project_id=project_id, project=project_in)

@router.post("/{project_id}/toggle-status", response_model=schemas.Project)
def toggle_project_status(
    project_id: int,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Any:
    """
    Activar o desactivar un proyecto toggling su estado.
    SOLO ADMINISTRADORES pueden ejecutar esta acción.
    active → inactive
    inactive → active
    """
    # Debug: imprimir el header recibido
    print(f"DEBUG: Authorization header recibido: {authorization}")
    
    # Obtener token del header
    if not authorization:
        raise HTTPException(status_code=401, detail="No autorizado - Token requerido")
    
    token = authorization.split(" ")[1] if " " in authorization else authorization
    print(f"DEBUG: Token extraído: {token[:20]}...")  # Imprimir solo los primeros 20 chars
    
    # Verificar que el token corresponde a un admin
    from app.api.v1.endpoints.login import active_sessions
    print(f"DEBUG: Active sessions: {len(active_sessions)} sesiones")
    
    if token not in active_sessions:
        print(f"DEBUG: Token NO está en active_sessions")
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    
    print(f"DEBUG: Token válido, user_id: {active_sessions[token]}")
    
    # Obtener user_id del token
    user_id = active_sessions[token]
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Permiso denegado - Solo administradores pueden cambiar el estado de proyectos")
    
    project = crud_project.get_project(db, project_id=project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Toggle status
    project.status = "inactive" if project.status == "active" else "active"
    db.add(project)
    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}", response_model=schemas.Project)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db)
) -> Any:
    project = crud_project.delete_project(db, project_id=project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project
