from sqlalchemy import Column, Integer, String
from .database import Base

class EmpleadoModel(Base):
    __tablename__ = "empleados"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    cargo = Column(String(100), nullable=False)
    telefono = Column(String(20), nullable=True)
    estado = Column(String(50), default="Disponible")