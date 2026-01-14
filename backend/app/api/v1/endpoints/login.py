from fastapi import APIRouter, HTTPException, Body, Depends, Header
from typing import Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from app.api.deps import get_db
from app.models.user import User

router = APIRouter()

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not hashed_password:
        return False
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# Store active sessions (en producción usar Redis o JWT con tokens revocados)
# Diccionario que mapea token -> user_id para validar sesiones
active_sessions = {}

@router.post("/login/access-code")
def login_access_code(
    code: str = Body(..., embed=True),
    db: Session = Depends(get_db)
) -> Any:
    """
    Login with access code.
    Retorna un token de sesión.
    """
    # Normalizar el código (quitar espacios, convertir a mayúsculas)
    code = code.strip().upper()
    
    user = db.query(User).filter(
        User.access_code == code
    ).first()
    
    if not user:
        # Intenta con el código tal cual (sin normalizar)
        user = db.query(User).filter(
            User.access_code == code.strip()
        ).first()
    
    if user and user.is_active:
        # Generar un token de sesión único
        import secrets
        token = secrets.token_urlsafe(32)
        # Guardar token -> user_id para validación posterior
        active_sessions[token] = user.id
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "is_admin": user.is_admin
            }
        }
    else:
        if user and not user.is_active:
            raise HTTPException(
                status_code=403, detail="Usuario inactivo. Contacta al administrador."
            )
        else:
            raise HTTPException(
                status_code=401, detail="Código de acceso inválido"
            )

@router.post("/logout")
def logout(
    authorization: Optional[str] = Header(None)
) -> Any:
    """
    Logout - Revoca el token de sesión actual.
    """
    if not authorization:
        raise HTTPException(
            status_code=401, detail="No autorizado"
        )
    
    try:
        # Extraer token del header "Bearer <token>"
        token = authorization.split(" ")[1] if " " in authorization else authorization
        
        # Eliminar la sesión si existe
        if token in active_sessions:
            del active_sessions[token]
        
        return {"message": "Sesión cerrada correctamente"}
    except (IndexError, AttributeError):
        raise HTTPException(
            status_code=401, detail="Formato de autorización inválido"
        )


@router.post("/login/password")
def login_password(
    email: str = Body(..., embed=True),
    password: str = Body(..., embed=True),
    db: Session = Depends(get_db)
) -> Any:
    """
    Login with email + password.
    Returns a token on success.
    """
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Usuario no encontrado o inactivo")

    if not user.password_hash or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    import secrets
    token = secrets.token_urlsafe(32)
    active_sessions[token] = user.id

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": user.id, "full_name": user.full_name, "email": user.email, "is_admin": user.is_admin}
    }


@router.post("/password/change")
def change_password(
    current_password: str = Body(..., embed=True),
    new_password: str = Body(..., embed=True),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Any:
    """
    Change password for authenticated user.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="No autorizado")

    try:
        token = authorization.split(" ")[1] if " " in authorization else authorization
        if token not in active_sessions:
            raise HTTPException(status_code=401, detail="Token inválido o expirado")

        user_id = active_sessions[token]
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        if not user.password_hash or not verify_password(current_password, user.password_hash):
            raise HTTPException(status_code=401, detail="Contraseña actual incorrecta")

        user.password_hash = get_password_hash(new_password)
        db.add(user)
        db.commit()

        return {"message": "Contraseña actualizada correctamente"}

    except (IndexError, AttributeError):
        raise HTTPException(status_code=401, detail="Formato de autorización inválido")


@router.post("/password/recover")
def recover_password(
    email: str = Body(..., embed=True),
    db: Session = Depends(get_db)
) -> Any:
    """
    Inicia el proceso de recuperación de contraseña: genera un código temporal.
    (Simula envío por email devolviendo el código en la respuesta).
    """
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # No revelar existencia del usuario en producción
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    import secrets
    code = secrets.token_urlsafe(8)
    user.reset_code = code
    user.reset_code_expires = datetime.utcnow() + timedelta(hours=1)
    db.add(user)
    db.commit()

    # En producción enviar por email; aquí devolvemos el código para pruebas locales
    return {"message": "Código de recuperación generado", "reset_code": code}


@router.post("/password/reset")
def reset_password(
    reset_code: str = Body(..., embed=True),
    new_password: str = Body(..., embed=True),
    db: Session = Depends(get_db)
) -> Any:
    """
    Resetea la contraseña usando el `reset_code` válido.
    """
    user = db.query(User).filter(User.reset_code == reset_code).first()
    if not user:
        raise HTTPException(status_code=400, detail="Código de recuperación inválido")

    if not user.reset_code_expires or user.reset_code_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Código de recuperación expirado")

    user.password_hash = get_password_hash(new_password)
    user.reset_code = None
    user.reset_code_expires = None
    db.add(user)
    db.commit()

    return {"message": "Contraseña restablecida correctamente"}
    

@router.get("/me")
def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Any:
    """
    Obtener datos del usuario actual mediante el token.
    """
    if not authorization:
        raise HTTPException(
            status_code=401, detail="No autorizado"
        )
    
    try:
        token = authorization.split(" ")[1] if " " in authorization else authorization
        
        if token not in active_sessions:
            raise HTTPException(
                status_code=401, detail="Token inválido o expirado"
            )
        
        # Obtener user_id del token
        user_id = active_sessions[token]
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(
                status_code=404, detail="Usuario no encontrado"
            )
        
        return {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "is_admin": user.is_admin,
            "is_active": user.is_active
        }
    except (IndexError, AttributeError):
        raise HTTPException(
            status_code=401, detail="Formato de autorización inválido"
        )

@router.post("/change-access-code")
def change_access_code(
    current_code: str = Body(..., embed=True),
    new_code: str = Body(..., embed=True),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> Any:
    """
    Cambiar el código de acceso del usuario actual.
    Requiere validación del código actual.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="No autorizado")
    
    try:
        token = authorization.split(" ")[1] if " " in authorization else authorization
        
        if token not in active_sessions:
            raise HTTPException(status_code=401, detail="Token inválido o expirado")
        
        user_id = active_sessions[token]
        user = db.query(User).filter(User.id == user_id).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        # Validar código actual
        if user.access_code != current_code:
            raise HTTPException(status_code=401, detail="Código de acceso actual incorrecto")
        
        # Verificar que el nuevo código no existe
        existing_user = db.query(User).filter(User.access_code == new_code).first()
        if existing_user and existing_user.id != user_id:
            raise HTTPException(status_code=400, detail="El código de acceso ya existe")
        
        # Actualizar código
        user.access_code = new_code
        db.add(user)
        db.commit()
        
        return {"message": "Código de acceso actualizado correctamente"}
    
    except (IndexError, AttributeError):
        raise HTTPException(status_code=401, detail="Formato de autorización inválido")

