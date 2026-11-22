from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from .database import Base

class OrdenModel(Base):
    __tablename__ = "ordenes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    cliente_id = Column(Integer, nullable=False, index=True)
    empleado_id = Column(Integer, nullable=True, index=True)
    servicio_id = Column(Integer, nullable=False, index=True)
    fecha_programada = Column(DateTime, nullable=False)
    estado = Column(String(40), default="Pendiente")
    total = Column(Float, nullable=True)
    notas = Column(String(300), nullable=True)
    creada_en = Column(DateTime, default=datetime.utcnow)