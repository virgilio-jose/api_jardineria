from sqlalchemy import Column, Integer, String, Boolean
from .database import Base

class ClienteModel(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    telefono = Column(String(20), nullable=True)
    direccion = Column(String(200), nullable=True)
    email = Column(String(100), unique=True, index=True, nullable=True)
    activo = Column(Boolean, default=True)