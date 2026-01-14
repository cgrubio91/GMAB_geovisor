from sqlalchemy import Column, Integer, String, ForeignKey, JSON, Index
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Layer(Base):
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    layer_type = Column(String) # vector, raster, dem, pointcloud
    format = Column(String) # geojson, kml, shapefile, etc
    file_path = Column(String)
    metadata_info = Column(JSON, nullable=True)
    project_id = Column(Integer, ForeignKey("project.id"), index=True)
    
    project = relationship("Project", back_populates="layers")
    
    # Índices para queries frecuentes
    __table_args__ = (
        Index('idx_layer_project_type', 'project_id', 'layer_type'),
    )
