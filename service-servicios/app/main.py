from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .database import engine, Base, get_db
from .models import ServicioModel
from .schemas import ServicioCreate, ServicioUpdate, ServicioResponse

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Microservicio de Servicios - Jardinería", version="1.0")

@app.get("/")
def read_root():
    return {"mensaje": "Microservicio de Servicios funcionando correctamente"}

@app.post("/servicios", response_model=ServicioResponse, status_code=201)
def crear_servicio(servicio: ServicioCreate, db: Session = Depends(get_db)):
    nuevo_servicio = ServicioModel(**servicio.model_dump())
    db.add(nuevo_servicio)
    db.commit()
    db.refresh(nuevo_servicio)
    return nuevo_servicio

@app.get("/servicios", response_model=List[ServicioResponse])
def listar_servicios(db: Session = Depends(get_db)):
    return db.query(ServicioModel).all()

@app.get("/servicios/{servicio_id}", response_model=ServicioResponse)
def obtener_servicio(servicio_id: int, db: Session = Depends(get_db)):
    servicio = db.query(ServicioModel).filter(ServicioModel.id == servicio_id).first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    return servicio

@app.put("/servicios/{servicio_id}", response_model=ServicioResponse)
def actualizar_servicio(servicio_id: int, datos: ServicioUpdate, db: Session = Depends(get_db)):
    servicio = db.query(ServicioModel).filter(ServicioModel.id == servicio_id).first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(servicio, campo, valor)

    db.commit()
    db.refresh(servicio)
    return servicio

@app.delete("/servicios/{servicio_id}")
def eliminar_servicio(servicio_id: int, db: Session = Depends(get_db)):
    servicio = db.query(ServicioModel).filter(ServicioModel.id == servicio_id).first()
    if not servicio:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    db.delete(servicio)
    db.commit()
    return {"mensaje": f"Servicio {servicio_id} eliminado correctamente"}