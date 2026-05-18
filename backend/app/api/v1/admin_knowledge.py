"""
Admin API for Knowledge Base Management
CRUD operations for destinations, policies, FAQs, safety tips, etc.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from prisma import Prisma

from app.core.prisma import get_db

router = APIRouter(prefix="/admin/knowledge", tags=["Admin Knowledge"])


# ============================================
# REQUEST/RESPONSE MODELS
# ============================================

class DestinationCreate(BaseModel):
    name: str
    slug: str
    region: str
    description: Optional[str] = None
    bestTime: Optional[str] = None
    highlights: List[str] = []
    priceRange: Optional[str] = None
    weather: Optional[dict] = {}
    transport: Optional[dict] = {}
    culture: Optional[dict] = {}
    images: Optional[List[str]] = []


class SafetyTipCreate(BaseModel):
    destination: str
    category: str
    title: str
    content: str
    severity: str = "info"


class EmergencyContactCreate(BaseModel):
    destination: str
    type: str
    name: str
    phone: str
    address: Optional[str] = None
    note: Optional[str] = None


class PolicyCreate(BaseModel):
    code: str
    name: str
    title: str
    content: str
    rules: Optional[List[dict]] = []
    priority: int = 0


class FAQCreate(BaseModel):
    code: Optional[str] = None
    question: str
    answer: str
    category: str = "general"
    tags: List[str] = []
    priority: int = 0


class TravelTipCreate(BaseModel):
    title: str
    content: str
    category: str
    destination: Optional[str] = None
    tags: List[str] = []
    priority: int = 0


class VisaRequirementCreate(BaseModel):
    countryCode: str
    countryName: str
    visaRequired: bool = True
    visaType: Optional[str] = None
    processingTime: Optional[str] = None
    validity: Optional[str] = None
    maxStay: Optional[str] = None
    requirements: List[str] = []
    notes: Optional[str] = None


# ============================================
# DESTINATIONS
# ============================================

@router.get("/destinations", response_model=List[dict])
async def list_destinations(
    include_inactive: bool = False,
    db: Prisma = Depends(get_db)
):
    """List all destinations"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    return await service.get_destinations(include_inactive)


@router.get("/destinations/{name}")
async def get_destination(
    name: str,
    db: Prisma = Depends(get_db)
):
    """Get destination by name"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    dest = await service.get_destination_by_name(name)
    if not dest:
        raise HTTPException(status_code=404, detail="Destination not found")
    return dest


@router.post("/destinations")
async def create_destination(
    data: DestinationCreate,
    db: Prisma = Depends(get_db)
):
    """Create a new destination"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    
    # Check if exists
    existing = await service.get_destination_by_name(data.name)
    if existing:
        raise HTTPException(status_code=400, detail="Destination already exists")
    
    return await service.create_destination(data.model_dump())


@router.put("/destinations/{name}")
async def update_destination(
    name: str,
    data: DestinationCreate,
    db: Prisma = Depends(get_db)
):
    """Update destination"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    dest = await service.update_destination(name, data.model_dump(exclude_unset=True))
    if not dest:
        raise HTTPException(status_code=404, detail="Destination not found")
    return dest


@router.delete("/destinations/{name}")
async def delete_destination(
    name: str,
    db: Prisma = Depends(get_db)
):
    """Delete (soft) destination"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    success = await service.delete_destination(name)
    if not success:
        raise HTTPException(status_code=404, detail="Destination not found")
    return {"success": True}


# ============================================
# SAFETY TIPS
# ============================================

@router.get("/safety-tips", response_model=List[dict])
async def list_safety_tips(
    destination: Optional[str] = None,
    category: Optional[str] = None,
    db: Prisma = Depends(get_db)
):
    """List safety tips"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    return await service.get_safety_tips(destination, category)


@router.post("/safety-tips")
async def create_safety_tip(
    data: SafetyTipCreate,
    db: Prisma = Depends(get_db)
):
    """Create a new safety tip"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    return await service.create_safety_tip(data.model_dump())


@router.put("/safety-tips/{id}")
async def update_safety_tip(
    id: str,
    data: SafetyTipCreate,
    db: Prisma = Depends(get_db)
):
    """Update safety tip"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    tip = await service.update_safety_tip(id, data.model_dump(exclude_unset=True))
    if not tip:
        raise HTTPException(status_code=404, detail="Safety tip not found")
    return tip


@router.delete("/safety-tips/{id}")
async def delete_safety_tip(
    id: str,
    db: Prisma = Depends(get_db)
):
    """Delete (soft) safety tip"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    success = await service.delete_safety_tip(id)
    if not success:
        raise HTTPException(status_code=404, detail="Safety tip not found")
    return {"success": True}


# ============================================
# EMERGENCY CONTACTS
# ============================================

@router.get("/emergency-contacts", response_model=List[dict])
async def list_emergency_contacts(
    destination: Optional[str] = None,
    type: Optional[str] = None,
    db: Prisma = Depends(get_db)
):
    """List emergency contacts"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    return await service.get_emergency_contacts(destination, type)


@router.post("/emergency-contacts")
async def create_emergency_contact(
    data: EmergencyContactCreate,
    db: Prisma = Depends(get_db)
):
    """Create a new emergency contact"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    return await service.create_emergency_contact(data.model_dump())


@router.put("/emergency-contacts/{id}")
async def update_emergency_contact(
    id: str,
    data: EmergencyContactCreate,
    db: Prisma = Depends(get_db)
):
    """Update emergency contact"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    contact = await service.update_emergency_contact(id, data.model_dump(exclude_unset=True))
    if not contact:
        raise HTTPException(status_code=404, detail="Emergency contact not found")
    return contact


@router.delete("/emergency-contacts/{id}")
async def delete_emergency_contact(
    id: str,
    db: Prisma = Depends(get_db)
):
    """Delete (soft) emergency contact"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    success = await service.delete_emergency_contact(id)
    if not success:
        raise HTTPException(status_code=404, detail="Emergency contact not found")
    return {"success": True}


# ============================================
# POLICIES
# ============================================

@router.get("/policies", response_model=List[dict])
async def list_policies(
    include_inactive: bool = False,
    db: Prisma = Depends(get_db)
):
    """List all policies"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    return await service.get_policies(include_inactive)


@router.get("/policies/{code}")
async def get_policy(
    code: str,
    db: Prisma = Depends(get_db)
):
    """Get policy by code"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    policy = await service.get_policy_by_code(code)
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy


@router.post("/policies")
async def create_policy(
    data: PolicyCreate,
    db: Prisma = Depends(get_db)
):
    """Create a new policy"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    
    existing = await service.get_policy_by_code(data.code)
    if existing:
        raise HTTPException(status_code=400, detail="Policy code already exists")
    
    return await service.create_policy(data.model_dump())


@router.put("/policies/{code}")
async def update_policy(
    code: str,
    data: PolicyCreate,
    db: Prisma = Depends(get_db)
):
    """Update policy"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    policy = await service.update_policy(code, data.model_dump(exclude_unset=True))
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy


@router.delete("/policies/{code}")
async def delete_policy(
    code: str,
    db: Prisma = Depends(get_db)
):
    """Delete (soft) policy"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    success = await service.delete_policy(code)
    if not success:
        raise HTTPException(status_code=404, detail="Policy not found")
    return {"success": True}


# ============================================
# FAQs
# ============================================

@router.get("/faqs", response_model=List[dict])
async def list_faqs(
    category: Optional[str] = None,
    include_inactive: bool = False,
    db: Prisma = Depends(get_db)
):
    """List FAQs"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    return await service.get_faqs(category, include_inactive)


@router.post("/faqs")
async def create_faq(
    data: FAQCreate,
    db: Prisma = Depends(get_db)
):
    """Create a new FAQ"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    return await service.create_faq(data.model_dump())


@router.put("/faqs/{code}")
async def update_faq(
    code: str,
    data: FAQCreate,
    db: Prisma = Depends(get_db)
):
    """Update FAQ"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    faq = await service.update_faq(code, data.model_dump(exclude_unset=True))
    if not faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return faq


@router.delete("/faqs/{code}")
async def delete_faq(
    code: str,
    db: Prisma = Depends(get_db)
):
    """Delete (soft) FAQ"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    success = await service.delete_faq(code)
    if not success:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return {"success": True}


# ============================================
# TRAVEL TIPS
# ============================================

@router.get("/travel-tips", response_model=List[dict])
async def list_travel_tips(
    destination: Optional[str] = None,
    category: Optional[str] = None,
    db: Prisma = Depends(get_db)
):
    """List travel tips"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    return await service.get_travel_tips(destination, category)


@router.post("/travel-tips")
async def create_travel_tip(
    data: TravelTipCreate,
    db: Prisma = Depends(get_db)
):
    """Create a new travel tip"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    return await service.create_travel_tip(data.model_dump())


@router.put("/travel-tips/{id}")
async def update_travel_tip(
    id: str,
    data: TravelTipCreate,
    db: Prisma = Depends(get_db)
):
    """Update travel tip"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    tip = await service.update_travel_tip(id, data.model_dump(exclude_unset=True))
    if not tip:
        raise HTTPException(status_code=404, detail="Travel tip not found")
    return tip


@router.delete("/travel-tips/{id}")
async def delete_travel_tip(
    id: str,
    db: Prisma = Depends(get_db)
):
    """Delete (soft) travel tip"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    success = await service.delete_travel_tip(id)
    if not success:
        raise HTTPException(status_code=404, detail="Travel tip not found")
    return {"success": True}


# ============================================
# VISA REQUIREMENTS
# ============================================

@router.get("/visa-requirements", response_model=List[dict])
async def list_visa_requirements(
    country_code: Optional[str] = None,
    db: Prisma = Depends(get_db)
):
    """List visa requirements"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    return await service.get_visa_requirements(country_code)


@router.post("/visa-requirements")
async def create_visa_requirement(
    data: VisaRequirementCreate,
    db: Prisma = Depends(get_db)
):
    """Create a new visa requirement"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    return await service.create_visa_requirement(data.model_dump())


@router.put("/visa-requirements/{country_code}")
async def update_visa_requirement(
    country_code: str,
    data: VisaRequirementCreate,
    db: Prisma = Depends(get_db)
):
    """Update visa requirement"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    visa = await service.update_visa_requirement(country_code, data.model_dump(exclude_unset=True))
    if not visa:
        raise HTTPException(status_code=404, detail="Visa requirement not found")
    return visa


# ============================================
# SEARCH & UTILS
# ============================================

@router.get("/search")
async def search_knowledge(
    q: str = Query(..., min_length=2),
    db: Prisma = Depends(get_db)
):
    """Search across all knowledge bases"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    return await service.search_knowledge(q)


@router.get("/destination/{name}/full")
async def get_full_destination(
    name: str,
    db: Prisma = Depends(get_db)
):
    """Get comprehensive info about a destination"""
    from app.services.knowledge_service import KnowledgeService
    service = KnowledgeService(db)
    info = await service.get_full_destination_info(name)
    if not info:
        raise HTTPException(status_code=404, detail="Destination not found")
    return info
