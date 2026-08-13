# backend/database.py
import motor.motor_asyncio
from config import settings

# Create a client to connect to your MongoDB server
client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGO_DATABASE_URL)

# Get a reference to your database
# FastAPI will create this database if it doesn't exist when you first write to it
database = client.skillzydb

# Get a reference to your collection (like a table in SQL)
user_collection = database.get_collection("users")

# Dependency to get the database connection
async def get_db():
    yield database