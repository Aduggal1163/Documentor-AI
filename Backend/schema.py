from pydantic import BaseModel,EmailStr,ConfigDict
from datetime import datetime

class UserCreate(BaseModel):
    username : str
    email : EmailStr
    password : str

class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class DocumentOut(BaseModel):
    id: int
    file_name: str
    summary_text: str | None
    extracted_text: str | None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class ChatCreate(BaseModel):
    question: str

class ChatOut(BaseModel):
    id: int
    question: str
    answer: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
    #This tells Pydantic: "You are allowed to read data from ORM objects (like SQLAlchemy models), not just dictionaries.

class Token(BaseModel):
    access_token : str
    token_type : str

class DiagramCreate(BaseModel):
    diagram_type: str  # flowchart, mindmap, sequence


class DiagramOut(BaseModel):
    id: int
    diagram_type: str
    mermaid_code: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
# Create models are only needed when the client sends data to server.
# Out models are needed when we send data back to the client.