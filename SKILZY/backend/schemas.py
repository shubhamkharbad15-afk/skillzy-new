from typing import Any, List, Optional

from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field, GetJsonSchemaHandler
from pydantic.json_schema import JsonSchemaValue
from pydantic_core import core_schema


class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, _source_type: Any, _handler: Any
    ) -> core_schema.CoreSchema:
        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.union_schema([
                core_schema.is_instance_schema(ObjectId),
                core_schema.str_schema(),
            ]),
            serialization=core_schema.plain_serializer_function_ser_schema(
                lambda x: str(x)
            ),
        )

    @classmethod
    def __get_pydantic_json_schema__(
        cls, _core_schema: core_schema.CoreSchema, handler: GetJsonSchemaHandler
    ) -> JsonSchemaValue:
        return handler(_core_schema)

class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    google_id: Optional[str] = None
    is_active: bool = True
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    bio: Optional[str] = None
    careerGoals: Optional[str] = None
    skills: List[str] = []
    interests: List[str] = []
    profile_complete: bool = False
    embedding: Optional[List[float]] = None
    avatar_url: Optional[str] = None

class UserInDB(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    class Config:
        from_attributes = True
        populate_by_name = True
        json_encoders = {ObjectId: str}
        
class ProfileUpdate(BaseModel):
    title: str
    company: Optional[str] = None
    location: Optional[str] = None
    bio: str
    careerGoals: Optional[str] = None
    skills: List[str]
    interests: List[str]
    avatar_url: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# New class for manual user creation
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str