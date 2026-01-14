"""
Funciones de utilidad para validación de permisos y autenticación.
"""

from fastapi import HTTPException, Header
from typing import Optional
from sqlalchemy.orm import Session
from app.models.user import User
from app.api.v1.endpoints.login import active_sessions


def get_current_user(authorization: Optional[str] = None, db: Session = None) -> User:
    """
    Extrae el usuario actual del token.
    Retorna el objeto User si es válido.
    Levanta HTTPException si token es inválido.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="No autorizado - Token requerido")
    
    token = authorization.split(" ")[1] if " " in authorization else authorization
    
    if token not in active_sessions:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    
    user_id = active_sessions[token]
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Usuario inactivo o no encontrado")
    
    return user


def require_admin(user: User) -> User:
    """
    Verifica que el usuario sea administrador.
    Retorna el usuario si es admin.
    Levanta HTTPException si no es admin.
    """
    if not user.is_admin:
        raise HTTPException(
            status_code=403, 
            detail="Permiso denegado - Solo administradores pueden realizar esta acción"
        )
    return user


def require_active(user: User) -> User:
    """
    Verifica que el usuario esté activo.
    """
    if not user.is_active:
        raise HTTPException(
            status_code=403, 
            detail="Usuario inactivo"
        )
    return user
