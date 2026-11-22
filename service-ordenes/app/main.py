import os
import requests
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .database import engine, Base, get_db
from .models import OrdenModel
from .schemas import OrdenCreate, OrdenUpdate, OrdenResponse

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Microservicio de Órdenes - Jardinería", version="1.0")

# URL base del microservicio de clientes dentro de la red Docker
CLIENTES_SERVICE_URL = os.getenv("CLIENTES_SERVICE_URL")

# URL base del microservicio de empleados dentro de la red Docker
EMPLEADOS_SERVICE_URL = os.getenv("EMPLEADOS_SERVICE_URL")

# URL base del microservicio de servicios dentro de la red Docker
SERVICIOS_SERVICE_URL = os.getenv("SERVICIOS_SERVICE_URL")

if not all([CLIENTES_SERVICE_URL, EMPLEADOS_SERVICE_URL, SERVICIOS_SERVICE_URL]):
    raise RuntimeError("Faltan variables de entorno de URLs de microservicios.")

def _validar_recurso(url: str, nombre_recurso: str, recurso_id: int) -> dict:
    try:
        resp = requests.get(f"{url}/{recurso_id}", timeout=5.0)
    except requests.RequestException:
        raise HTTPException(
            status_code=503,
            detail=f"No se pudo comunicar con el servicio de {nombre_recurso}",
        )

    if resp.status_code == 404:
        raise HTTPException(
            status_code=400,
            detail=f"{nombre_recurso.capitalize()} con id {recurso_id} no existe",
        )

    if resp.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"Error al consultar {nombre_recurso} (código {resp.status_code})",
        )

    return resp.json()


@app.get("/")
def read_root():
    return {"mensaje": "Microservicio de Órdenes funcionando correctamente"}


@app.post("/ordenes", response_model=OrdenResponse, status_code=201)
def crear_orden(orden: OrdenCreate, db: Session = Depends(get_db)):
    _validar_recurso(f"{CLIENTES_SERVICE_URL}/clientes", "cliente", orden.cliente_id)
    servicio_data = _validar_recurso(f"{SERVICIOS_SERVICE_URL}/servicios", "servicio", orden.servicio_id)

    if orden.empleado_id is not None:
        _validar_recurso(f"{EMPLEADOS_SERVICE_URL}/empleados", "empleado", orden.empleado_id)

    datos_orden = orden.model_dump()
    if datos_orden.get("total") is None and "precio_base" in servicio_data:
        datos_orden["total"] = servicio_data["precio_base"]

    nueva_orden = OrdenModel(**datos_orden)
    db.add(nueva_orden)
    db.commit()
    db.refresh(nueva_orden)
    return nueva_orden


@app.get("/ordenes", response_model=List[OrdenResponse])
def listar_ordenes(db: Session = Depends(get_db)):
    return db.query(OrdenModel).all()


@app.get("/ordenes/{orden_id}", response_model=OrdenResponse)
def obtener_orden(orden_id: int, db: Session = Depends(get_db)):
    orden = db.query(OrdenModel).filter(OrdenModel.id == orden_id).first()
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    return orden


@app.put("/ordenes/{orden_id}", response_model=OrdenResponse)
def actualizar_orden(orden_id: int, datos: OrdenUpdate, db: Session = Depends(get_db)):
    orden = db.query(OrdenModel).filter(OrdenModel.id == orden_id).first()
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    cambios = datos.model_dump(exclude_unset=True)
    if "empleado_id" in cambios and cambios["empleado_id"] is not None:
        _validar_recurso(f"{EMPLEADOS_SERVICE_URL}/empleados", "empleado", cambios["empleado_id"])
    if "servicio_id" in cambios and cambios["servicio_id"] is not None:
        _validar_recurso(f"{SERVICIOS_SERVICE_URL}/servicios", "servicio", cambios["servicio_id"])

    for campo, valor in cambios.items():
        setattr(orden, campo, valor)

    db.commit()
    db.refresh(orden)
    return orden


@app.delete("/ordenes/{orden_id}")
def eliminar_orden(orden_id: int, db: Session = Depends(get_db)):
    orden = db.query(OrdenModel).filter(OrdenModel.id == orden_id).first()
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    db.delete(orden)
    db.commit()
    return {"mensaje": f"Orden {orden_id} eliminada correctamente"}