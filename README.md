# Geovisor Web Pro

Este proyecto es un geovisor avanzado desarrollado con **FastAPI (Python)** y **Angular**. Permite la gestión de proyectos técnicos con visualización de datos geoespaciales en 2D y 3D.

## Características

- Autenticación mediante códigos de acceso.
- Panel de proyectos con diseño premium (basado en Figma).
- Visor 2D con OpenLayers.
- Visor 3D con CesiumJS.
- Herramientas de medición (Distancia, Área, Volumen).
- Base de datos espacial con PostgreSQL + PostGIS.

## Tecnologías

- **Backend:** Python 3.11+, FastAPI, SQLAlchemy, GeoAlchemy2.
- **Frontend:** Angular 19+, OpenLayers, CesiumJS.
- **Base de datos:** PostgreSQL 15+ con extensión PostGIS.

## Colores del Sistema

- **Primario (Cyan):** `rgb(0, 193, 210)` (#00C1D2)
- **Secundario (Navy):** `rgb(22, 50, 85)` (#163255)
- **Acento (Naranja):** `rgb(255, 103, 28)` (#FF671C)

## Instalación y Ejecución

### Base de Datos

Si tienes Docker, puedes iniciar la base de datos con:

```bash
docker-compose up -d
```

**IMPORTANTE (migraciones y cambios en esquema)**

En esta versión se añadieron campos nuevos al modelo `User` (`password_hash`, `role`, `reset_code`, `reset_code_expires`). Estos cambios requieren que la base de datos del entorno donde vayas a ejecutar la aplicación también tenga esas columnas.

Tienes dos formas seguras de aplicar el cambio en la base de datos de otros equipos:

- Opción A (recomendada — Alembic): aplicar la migración incluida en el repositorio:

```bash
# Desde la carpeta backend
set PYTHONPATH=backend
.venv\Scripts\python.exe -m alembic -c alembic.ini upgrade head
```

Esto aplica la migración registrada en `backend/alembic/versions/0001_add_user_columns.py` y deja el historial de migraciones en el repositorio.

- Opción B (rápida, idempotente): ejecutar el script que añade las columnas si faltan:

```bash
set PYTHONPATH=backend
.venv\Scripts\python.exe backend\app\db\ensure_user_columns.py
```

El script `ensure_user_columns.py` comprobará las columnas antes de hacer `ALTER TABLE` y solo añadirá las que falten.

Notas:
- Las migraciones (Alembic) son la forma recomendada para mantener coherencia entre entornos.
- Si tu entorno de despliegue automatizado usa CI/CD, incorpora `alembic upgrade head` en el pipeline antes de reiniciar la app.
- El repositorio contiene ambos: la migración en `backend/alembic/versions/` y el script de emergencia en `backend/app/db/`.

### Backend

1. Entra a la carpeta `backend`.
2. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```
3. Inicia la base de datos y los datos iniciales:
   ```bash
   python -m app.db.init_db
   ```
4. Ejecuta el servidor:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend

1. Entra a la carpeta `frontend`.
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Ejecuta el servidor de desarrollo:
   ```bash
   ng serve
   ```
4. Accede a `http://localhost:4200`.