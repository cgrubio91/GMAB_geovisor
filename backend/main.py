from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.api import api_router
from app import models

app = FastAPI(
    title="Geovisor API",
    description="API for managing projects, layers and measurements in a web geovisor",
    version="1.0.0"
)

# CORS configuration
origins = [
    "http://localhost:4200",
    "http://127.0.0.1:4200",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Range", "Accept-Ranges", "Content-Length"],
)

app.include_router(api_router, prefix="/api/v1")

# Mount static directories
from fastapi.staticfiles import StaticFiles
import os

# Ensure directories exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("Datos", exist_ok=True)

app.mount("/static/uploads", StaticFiles(directory=os.path.abspath("uploads")), name="uploads")

# Support both local Datos and parent Datos
paths_to_mount = [
    os.path.abspath("Datos"),
    os.path.abspath("../Datos")
]

for p in paths_to_mount:
    if os.path.exists(p):
        print(f"Mounting {p} to /static/datos")
        # We only mount one to /static/datos, but we could mount multiple if needed.
        # For now, let's prioritize the one that actually has files.
        if os.listdir(p):
             app.mount("/static/datos", StaticFiles(directory=p), name="datos")
             mounted_datos = True
             break

if not mounted_datos:
    app.mount("/static/datos", StaticFiles(directory=os.path.abspath("Datos")), name="datos")

@app.get("/")
def root():
    return {"message": "Welcome to Geovisor API"}
