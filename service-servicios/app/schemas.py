from pydantic import BaseModel
from typing import Optional

class ServicioBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    precio_base: float
    activo: Optional[bool] = True

class ServicioCreate(ServicioBase):
    pass

class ServicioUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio_base: Optional[float] = None
    activo: Optional[bool] = None

class ServicioResponse(ServicioBase):
    id: int

    class Config:
        from_attributes = True