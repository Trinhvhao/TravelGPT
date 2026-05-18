"""
Knowledge Base Service
CRUD operations for travel knowledge stored in database
"""
from typing import List, Optional, Dict, Any
from prisma import Prisma


class KnowledgeService:
    """Service for managing travel knowledge base in database"""

    def __init__(self, db: Prisma):
        self.db = db

    # ============================================
    # DESTINATIONS
    # ============================================

    async def get_destinations(self, include_inactive: bool = False) -> List[Dict]:
        """Get all destinations"""
        where = {} if include_inactive else {"isActive": True}
        destinations = await self.db.knowledgedestination.find_many(where=where)
        return [self._format_destination(d) for d in destinations]

    async def get_destination_by_name(self, name: str) -> Optional[Dict]:
        """Get destination by name (case-insensitive)"""
        dest = await self.db.knowledgedestination.find_first(
            where={"name": {"equals": name, "mode": "insensitive"}}
        )
        return self._format_destination(dest) if dest else None

    async def get_destination_by_slug(self, slug: str) -> Optional[Dict]:
        """Get destination by slug"""
        dest = await self.db.knowledgedestination.find_unique(where={"slug": slug})
        return self._format_destination(dest) if dest else None

    async def create_destination(self, data: Dict) -> Dict:
        """Create a new destination"""
        dest = await self.db.knowledgedestination.create(data=data)
        return self._format_destination(dest)

    async def update_destination(self, name: str, data: Dict) -> Optional[Dict]:
        """Update destination by name"""
        dest = await self.db.knowledgedestination.update(
            where={"name": name},
            data=data
        )
        return self._format_destination(dest) if dest else None

    async def delete_destination(self, name: str) -> bool:
        """Soft delete destination"""
        dest = await self.db.knowledgedestination.update(
            where={"name": name},
            data={"isActive": False}
        )
        return dest is not None

    def _format_destination(self, dest) -> Dict:
        """Format destination for response"""
        return {
            "id": dest.id,
            "name": dest.name,
            "slug": dest.slug,
            "region": dest.region,
            "description": dest.description,
            "bestTime": dest.bestTime,
            "highlights": dest.highlights or [],
            "priceRange": dest.priceRange,
            "weather": dest.weather or {},
            "transport": dest.transport or {},
            "culture": dest.culture or {},
            "images": dest.images or [],
        }

    # ============================================
    # SAFETY TIPS
    # ============================================

    async def get_safety_tips(self, destination: Optional[str] = None, category: Optional[str] = None) -> List[Dict]:
        """Get safety tips, optionally filtered by destination or category"""
        where: Dict[str, Any] = {"isActive": True}
        if destination:
            where["destination"] = {"equals": destination, "mode": "insensitive"}
        if category:
            where["category"] = category

        tips = await self.db.safetytip.find_many(where=where)
        return [self._format_safety_tip(t) for t in tips]

    async def create_safety_tip(self, data: Dict) -> Dict:
        """Create a new safety tip"""
        tip = await self.db.safetytip.create(data=data)
        return self._format_safety_tip(tip)

    async def update_safety_tip(self, id: str, data: Dict) -> Optional[Dict]:
        """Update safety tip"""
        tip = await self.db.safetytip.update(where={"id": id}, data=data)
        return self._format_safety_tip(tip) if tip else None

    async def delete_safety_tip(self, id: str) -> bool:
        """Soft delete safety tip"""
        tip = await self.db.safetytip.update(where={"id": id}, data={"isActive": False})
        return tip is not None

    def _format_safety_tip(self, tip) -> Dict:
        """Format safety tip for response"""
        return {
            "id": tip.id,
            "destination": tip.destination,
            "category": tip.category,
            "title": tip.title,
            "content": tip.content,
            "severity": tip.severity,
        }

    # ============================================
    # EMERGENCY CONTACTS
    # ============================================

    async def get_emergency_contacts(self, destination: Optional[str] = None, contact_type: Optional[str] = None) -> List[Dict]:
        """Get emergency contacts"""
        where: Dict[str, Any] = {"isActive": True}
        if destination:
            where["destination"] = {"equals": destination, "mode": "insensitive"}
        if contact_type:
            where["type"] = contact_type

        contacts = await self.db.emergencycontact.find_many(where=where)
        return [self._format_emergency_contact(c) for c in contacts]

    async def create_emergency_contact(self, data: Dict) -> Dict:
        """Create a new emergency contact"""
        contact = await self.db.emergencycontact.create(data=data)
        return self._format_emergency_contact(contact)

    async def update_emergency_contact(self, id: str, data: Dict) -> Optional[Dict]:
        """Update emergency contact"""
        contact = await self.db.emergencycontact.update(where={"id": id}, data=data)
        return self._format_emergency_contact(contact) if contact else None

    async def delete_emergency_contact(self, id: str) -> bool:
        """Soft delete emergency contact"""
        contact = await self.db.emergencycontact.update(where={"id": id}, data={"isActive": False})
        return contact is not None

    def _format_emergency_contact(self, contact) -> Dict:
        """Format emergency contact for response"""
        return {
            "id": contact.id,
            "destination": contact.destination,
            "type": contact.type,
            "name": contact.name,
            "phone": contact.phone,
            "address": contact.address,
            "note": contact.note,
        }

    # ============================================
    # POLICIES
    # ============================================

    async def get_policies(self, include_inactive: bool = False) -> List[Dict]:
        """Get all policies"""
        where = {} if include_inactive else {"isActive": True}
        policies = await self.db.policy.find_many(
            where=where,
            order=[{"priority": "desc"}]
        )
        return [self._format_policy(p) for p in policies]

    async def get_policy_by_code(self, code: str) -> Optional[Dict]:
        """Get policy by code"""
        policy = await self.db.policy.find_unique(where={"code": code})
        return self._format_policy(policy) if policy else None

    async def create_policy(self, data: Dict) -> Dict:
        """Create a new policy"""
        policy = await self.db.policy.create(data=data)
        return self._format_policy(policy)

    async def update_policy(self, code: str, data: Dict) -> Optional[Dict]:
        """Update policy"""
        policy = await self.db.policy.update(where={"code": code}, data=data)
        return self._format_policy(policy) if policy else None

    async def delete_policy(self, code: str) -> bool:
        """Soft delete policy"""
        policy = await self.db.policy.update(where={"code": code}, data={"isActive": False})
        return policy is not None

    def _format_policy(self, policy) -> Dict:
        """Format policy for response"""
        return {
            "code": policy.code,
            "name": policy.name,
            "title": policy.title,
            "content": policy.content,
            "rules": policy.rules or [],
        }

    # ============================================
    # FAQs
    # ============================================

    async def get_faqs(self, category: Optional[str] = None, include_inactive: bool = False) -> List[Dict]:
        """Get FAQs, optionally filtered by category"""
        where: Dict[str, Any] = {} if include_inactive else {"isActive": True}
        if category:
            where["category"] = category

        faqs = await self.db.faq.find_many(
            where=where,
            order=[{"priority": "desc"}]
        )
        return [self._format_faq(f) for f in faqs]

    async def get_faq_by_code(self, code: str) -> Optional[Dict]:
        """Get FAQ by code"""
        faq = await self.db.faq.find_unique(where={"code": code})
        return self._format_faq(faq) if faq else None

    async def create_faq(self, data: Dict) -> Dict:
        """Create a new FAQ"""
        from prisma import Json
        # Convert tags to Json if present
        if "tags" in data:
            data["tags"] = Json(data["tags"])
        faq = await self.db.faq.create(data=data)
        return self._format_faq(faq)

    async def update_faq(self, code: str, data: Dict) -> Optional[Dict]:
        """Update FAQ"""
        faq = await self.db.faq.update(where={"code": code}, data=data)
        return self._format_faq(faq) if faq else None

    async def delete_faq(self, code: str) -> bool:
        """Soft delete FAQ"""
        faq = await self.db.faq.update(where={"code": code}, data={"isActive": False})
        return faq is not None

    def _format_faq(self, faq) -> Dict:
        """Format FAQ for response"""
        return {
            "code": faq.code,
            "question": faq.question,
            "answer": faq.answer,
            "category": faq.category,
            "tags": faq.tags or [],
        }

    # ============================================
    # TRAVEL TIPS
    # ============================================

    async def get_travel_tips(self, destination: Optional[str] = None, category: Optional[str] = None) -> List[Dict]:
        """Get travel tips"""
        where: Dict[str, Any] = {"isActive": True}
        if destination:
            where["destination"] = {"equals": destination, "mode": "insensitive"}
        if category:
            where["category"] = category

        tips = await self.db.traveltip.find_many(
            where=where,
            order=[{"priority": "desc"}]
        )
        return [self._format_travel_tip(t) for t in tips]

    async def create_travel_tip(self, data: Dict) -> Dict:
        """Create a new travel tip"""
        from prisma import Json
        # Convert tags to Json if present
        if "tags" in data:
            data["tags"] = Json(data["tags"])
        tip = await self.db.traveltip.create(data=data)
        return self._format_travel_tip(tip)

    async def update_travel_tip(self, id: str, data: Dict) -> Optional[Dict]:
        """Update travel tip"""
        tip = await self.db.traveltip.update(where={"id": id}, data=data)
        return self._format_travel_tip(tip) if tip else None

    async def delete_travel_tip(self, id: str) -> bool:
        """Soft delete travel tip"""
        tip = await self.db.traveltip.update(where={"id": id}, data={"isActive": False})
        return tip is not None

    def _format_travel_tip(self, tip) -> Dict:
        """Format travel tip for response"""
        return {
            "id": tip.id,
            "title": tip.title,
            "content": tip.content,
            "category": tip.category,
            "destination": tip.destination,
            "tags": tip.tags or [],
        }

    # ============================================
    # VISA REQUIREMENTS
    # ============================================

    async def get_visa_requirements(self, country_code: Optional[str] = None) -> List[Dict]:
        """Get visa requirements"""
        where = {"isActive": True}
        if country_code:
            where["countryCode"] = country_code.upper()

        visas = await self.db.visarequirement.find_many(where=where)
        return [self._format_visa(v) for v in visas]

    async def create_visa_requirement(self, data: Dict) -> Dict:
        """Create a new visa requirement"""
        visa = await self.db.visarequirement.create(data=data)
        return self._format_visa(visa)

    async def update_visa_requirement(self, country_code: str, data: Dict) -> Optional[Dict]:
        """Update visa requirement"""
        visa = await self.db.visarequirement.update(
            where={"countryCode": country_code.upper()},
            data=data
        )
        return self._format_visa(visa) if visa else None

    def _format_visa(self, visa) -> Dict:
        """Format visa requirement for response"""
        return {
            "countryCode": visa.countryCode,
            "countryName": visa.countryName,
            "visaRequired": visa.visaRequired,
            "visaType": visa.visaType,
            "processingTime": visa.processingTime,
            "validity": visa.validity,
            "maxStay": visa.maxStay,
            "requirements": visa.requirements or [],
            "notes": visa.notes,
        }

    # ============================================
    # COMPREHENSIVE DESTINATION INFO
    # ============================================

    async def get_full_destination_info(self, name: str) -> Optional[Dict]:
        """Get comprehensive info about a destination including safety, emergency, tips"""
        dest = await self.get_destination_by_name(name)
        if not dest:
            return None

        # Get related data
        safety_tips = await self.get_safety_tips(destination=name)
        emergency_contacts = await self.get_emergency_contacts(destination=name)
        travel_tips = await self.get_travel_tips(destination=name)

        return {
            **dest,
            "safetyTips": safety_tips,
            "emergencyContacts": emergency_contacts,
            "travelTips": travel_tips,
        }

    # ============================================
    # SEARCH / QUERY
    # ============================================

    async def search_knowledge(self, query: str, limit: int = 10) -> Dict[str, List]:
        """
        Search across all knowledge bases
        Returns dict with categorized results
        """
        query_lower = query.lower()

        # Search destinations
        all_dests = await self.get_destinations()
        matched_dests = [
            d for d in all_dests
            if query_lower in d["name"].lower()
            or (d.get("description") and query_lower in d["description"].lower())
        ]

        # Search FAQs
        all_faqs = await self.get_faqs()
        matched_faqs = [
            f for f in all_faqs
            if query_lower in f["question"].lower()
            or query_lower in f["answer"].lower()
        ]

        # Search safety tips
        all_safety = await self.get_safety_tips()
        matched_safety = [
            s for s in all_safety
            if query_lower in s["title"].lower()
            or query_lower in s["content"].lower()
        ]

        # Search travel tips
        all_tips = await self.get_travel_tips()
        matched_tips = [
            t for t in all_tips
            if query_lower in t["title"].lower()
            or query_lower in t["content"].lower()
        ]

        return {
            "destinations": matched_dests[:limit],
            "faqs": matched_faqs[:limit],
            "safetyTips": matched_safety[:limit],
            "travelTips": matched_tips[:limit],
        }
