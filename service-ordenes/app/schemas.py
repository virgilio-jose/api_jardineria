from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class OrdenBase(BaseModel):
    cliente_id: int
    empleado_id: Optional[int] = None
    servicio_id: int
    fecha_programada: datetime
    estado: Optional[str] = "Pendiente"
    total: Optional[float] = None
    notas: Optional[str] = None

class OrdenCreate(OrdenBase):
    pass

class OrdenUpdate(BaseModel):
    empleado_id: Optional[int] = None
    servicio_id: Optional[int] = None
    fecha_programada: Optional[datetime] = None
    estado: Optional[str] = None
    total: Optional[float] = None
    notas: Optional[str] = None

class OrdenResponse(OrdenBase):
    id: int
    creada_en: datetime

    class Config:
        from_attributes = True