from motor.motor_asyncio import AsyncIOMotorDatabase
import asyncio
import schemas
from auth import get_password_hash
from ml_model import create_profile_text, generate_embedding

async def get_user_by_email(db: AsyncIOMotorDatabase, email: str):
    user = await db["users"].find_one({"email": email})
    return user

async def get_user_by_google_id(db: AsyncIOMotorDatabase, google_id: str):
    user = await db["users"].find_one({"google_id": google_id})
    return user

async def create_user_from_google(db: AsyncIOMotorDatabase, user_info: dict):
    new_user = {
        "email": user_info.get("email"),
        "first_name": user_info.get("given_name"),
        "last_name": user_info.get("family_name"),
        # Google v1 userinfo returns 'id' (not 'sub')
        "google_id": user_info.get("id") or user_info.get("sub"),
        "is_active": True,
        "skills": [],
        "interests": [],
        "profile_complete": False,
        "embedding": None,
    }
    await db["users"].insert_one(new_user)
    created_user = await get_user_by_email(db, new_user["email"])
    return created_user

# New function for manual sign-up
async def create_user(db: AsyncIOMotorDatabase, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    new_user = {
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "hashed_password": hashed_password,
        "is_active": True,
        "skills": [],
        "interests": [],
        "profile_complete": False,
        "embedding": None,
    }
    await db["users"].insert_one(new_user)
    created_user = await get_user_by_email(db, new_user["email"])
    return created_user

async def _store_embedding(db: AsyncIOMotorDatabase, email: str, profile_data: schemas.ProfileUpdate):
    """Generate and store embedding without blocking profile save."""
    try:
        profile_text = create_profile_text(profile_data)
        embedding = await asyncio.to_thread(generate_embedding, profile_text)
        await db["users"].update_one({"email": email}, {"$set": {"embedding": embedding}})
    except Exception as exc:
        print(f"Embedding generation failed for {email}: {exc}")

async def update_user_profile(db: AsyncIOMotorDatabase, email: str, profile_data: schemas.ProfileUpdate, *, defer_embedding: bool = False):
    update_data = profile_data.model_dump()
    update_data["profile_complete"] = True

    # Persist profile immediately so onboarding is not blocked by ML model load
    await db["users"].update_one(
        {"email": email},
        {"$set": update_data}
    )

    if not defer_embedding:
        await _store_embedding(db, email, profile_data)

    updated_user = await get_user_by_email(db, email)
    return updated_user


async def generate_user_embedding(db: AsyncIOMotorDatabase, email: str, profile_data: schemas.ProfileUpdate):
    await _store_embedding(db, email, profile_data)
