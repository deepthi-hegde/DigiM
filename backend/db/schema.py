from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, create_engine
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Tenant(Base):
    """
    Multi-tenant core table. Represents a single business or client.
    All data is scoped by tenant_id.
    """
    __tablename__ = "tenants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    google_sso_id = Column(String, unique=True, index=True, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    meta_accounts = relationship("MetaAccount", back_populates="tenant")


class MetaAccount(Base):
    """
    Stores Meta/Facebook page integration credentials per tenant.
    """
    __tablename__ = "meta_accounts"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), index=True)
    page_id = Column(String, index=True)
    access_token = Column(String)  # In a real app, this should be encrypted
    page_name = Column(String)

    # Relationships
    tenant = relationship("Tenant", back_populates="meta_accounts")

# Example of how to initialize the engine for SQLite for local dev
# engine = create_engine("sqlite:///./marketflow.db", connect_args={"check_same_thread": False})
# Base.metadata.create_all(bind=engine)
