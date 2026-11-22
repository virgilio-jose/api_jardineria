from sqlalchemy import Column, Integer, String, Float, Boolean
from .database import Base

class ServicioModel(Base):
    __tablename__ = "servicios"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(120), nullable=False)
    descripcion = Column(String(300), nullable=True)
    precio_base = Column(Float, nullable=False)
    activo = Column(Boolean, default=True)