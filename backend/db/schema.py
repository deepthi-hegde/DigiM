from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, create_engine, DateTime
from sqlalchemy.orm import declarative_base, relationship
import datetime

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

    # Brand identity (captured during onboarding Step 1)
    brand_url = Column(String, nullable=True)              # Optional website/social URL
    brand_color_primary = Column(String, nullable=True)    # Hex colour e.g. #52B788
    brand_color_secondary = Column(String, nullable=True)  # Hex colour
    business_description = Column(String, nullable=True)   # Free-text tagline / description
    industry = Column(String, nullable=True)               # e.g. Clothing & Apparel
    category = Column(String, nullable=True)               # e.g. Textile Readymade

    # Audience targeting (captured during onboarding Step 2)
    target_locations = Column(String, nullable=True)       # Comma-separated city names
    timezone = Column(String, default="Asia/Kolkata", nullable=True) # Timezone name e.g. Asia/Kolkata
    target_gender = Column(String, default="All")          # All | Female | Male
    target_age_min = Column(Integer, default=18)
    target_age_max = Column(Integer, default=35)
    persona_tone = Column(String, default="casual")        # casual | formal | elaborate | shorten

    # WhatsApp Integration details
    whatsapp_phone_number_id = Column(String, nullable=True)
    whatsapp_access_token = Column(String, nullable=True)

    # Relationships
    meta_accounts = relationship("MetaAccount", back_populates="tenant")
    campaigns = relationship("Campaign", back_populates="tenant")
    users = relationship("User", back_populates="tenant")


class User(Base):
    """
    User account with RBAC (Role-Based Access Control) support.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), index=True)
    email = Column(String, unique=True, index=True)
    role = Column(String, default="editor")  # admin, editor, viewer
    
    # Relationships
    tenant = relationship("Tenant", back_populates="users")


class AuditLog(Base):
    """
    Keeps track of critical actions for compliance and admin oversight.
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, index=True)
    user_email = Column(String, index=True)
    action = Column(String)
    details = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)


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
    ig_user_id = Column(String, nullable=True) # Linked Instagram account

    # Relationships
    tenant = relationship("Tenant", back_populates="meta_accounts")

class Campaign(Base):
    """
    Stores generated AI campaigns for caching and history.
    """
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), index=True)
    prompt = Column(String)
    category = Column(String)
    min_age = Column(Integer)
    max_age = Column(Integer)
    gender = Column(String)
    generated_text = Column(String)
    visual_suggestion = Column(String, nullable=True)
    
    # Scheduling & tones
    tone = Column(String, default="casual")
    is_liked = Column(Boolean, default=False)
    scheduled_time = Column(DateTime, nullable=True)
    status = Column(String, default="draft")  # draft, scheduled, published, failed
    
    # Relationships
    tenant = relationship("Tenant", back_populates="campaigns")


# Example of how to initialize the engine for SQLite for local dev
# engine = create_engine("sqlite:///./marketflow.db", connect_args={"check_same_thread": False})
# Base.metadata.create_all(bind=engine)
