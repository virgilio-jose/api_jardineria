from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .database import engine, Base, get_db
from .models import EmpleadoModel
from .schemas import EmpleadoCreate, EmpleadoUpdate, EmpleadoResponse

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Microservicio de Empleados - Jardinería", version="1.0")

@app.get("/")
def read_root():
    return {"mensaje": "Microservicio de Empleados funcionando correctamente"}

@app.post("/empleados", response_model=EmpleadoResponse, status_code=201)
def crear_empleado(empleado: EmpleadoCreate, db: Session = Depends(get_db)):
    nuevo_empleado = EmpleadoModel(**empleado.model_dump())
    db.add(nuevo_empleado)
    db.commit()
    db.refresh(nuevo_empleado)
    return nuevo_empleado

@app.get("/empleados", response_model=List[EmpleadoResponse])
def listar_empleados(db: Session = Depends(get_db)):
    return db.query(EmpleadoModel).all()

@app.get("/empleados/{empleado_id}", response_model=EmpleadoResponse)
def obtener_empleado(empleado_id: int, db: Session = Depends(get_db)):
    empleado = db.query(EmpleadoModel).filter(EmpleadoModel.id == empleado_id).first()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
    return empleado

@app.put("/empleados/{empleado_id}", response_model=EmpleadoResponse)
def actualizar_empleado(empleado_id: int, datos: EmpleadoUpdate, db: Session = Depends(get_db)):
    empleado = db.query(EmpleadoModel).filter(EmpleadoModel.id == empleado_id).first()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(empleado, campo, valor)

    db.commit()
    db.refresh(empleado)
    return empleado

@app.delete("/empleados/{empleado_id}")
def eliminar_empleado(empleado_id: int, db: Session = Depends(get_db)):
    empleado = db.query(EmpleadoModel).filter(EmpleadoModel.id == empleado_id).first()
    if not empleado:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    db.delete(empleado)
    db.commit()
    return {"mensaje": f"Empleado {empleado_id} eliminado correctamente"}