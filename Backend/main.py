from fastapi import FastAPI,HTTPException,status,Depends,UploadFile,File
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session,joinedload
from typing import Annotated
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

import models
from dependencies import get_db,get_current_user
from schema import AdminLogin, UserCreate, UserOut, Token, DocumentOut, ChatCreate, ChatOut,DiagramCreate, DiagramOut
from auth import get_password_hash, verify_password, create_access_token
from database import Base,engine
import uvicorn
import uuid
from pathlib import Path
from utils.document_utils import extract_text,summary,ask_question,generate_diagram
app=FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=engine)
db_dependency= Annotated[Session,Depends(get_db)]
 #response_models tells FastAPI:“Only return fields defined in UserOut, even if the database model contains more fields.”

@app.post("/api/auth/signup",response_model=UserOut,status_code=status.HTTP_201_CREATED)
def signup(user:UserCreate, db:db_dependency):
    existing_user = db.query(models.User).filter(models.User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        username = user.username,
        email=user.email,
        hashed_password = hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@app.post('/api/auth/signin',response_model=Token,status_code=status.HTTP_200_OK)
def signin( db: db_dependency,form_data: OAuth2PasswordRequestForm = Depends()):
    db_user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not db_user or not verify_password(form_data.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(data={"sub": db_user.username})

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
    
@app.get('/api/auth/me',response_model=UserOut,status_code=status.HTTP_200_OK)
def read_current_user(current_user: models.User = Depends(get_current_user)):
    return current_user
    
@app.post("/api/documents/upload", response_model=DocumentOut)
def upload_document(
    db: db_dependency,
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
):
    # Validate file type
    allowed_extensions = {'.txt', '.pdf', '.docx'}
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type. Allowed: .txt, .pdf, .docx"
        )
    
    # Validate file size (max 10MB)
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 10MB")

    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)

    # Create unique filename
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(upload_dir, unique_filename)

    # Save file to disk
    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())

    # Extract text properly
    try:
        extracted_text = extract_text(file_path)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Unsupported or corrupted file",
        )

    # Generate summary (Phase 3)
    try:
        summary_text = summary(extracted_text)
    except Exception:
        summary_text = "Summary generation failed."

    # Store in DB
    new_document = models.Document(
        user_id=current_user.id,
        file_name=file.filename,
        file_path=file_path,
        extracted_text=extracted_text,
        summary_text=summary_text,
    )

    db.add(new_document)
    db.commit()
    db.refresh(new_document)

    return new_document
@app.get('/api/documents',response_model=list[DocumentOut])
def get_all_documents(db:db_dependency, current_user: models.User=Depends(get_current_user)):
    documents= (
        db.query(models.Document).filter(models.Document.user_id == current_user.id).all()
    )
    return documents

@app.get("/api/documents/{document_id}", response_model=DocumentOut)
def get_single_document(document_id : int, db:db_dependency, current_user: models.User = Depends(get_current_user)):
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Document Not Found'
        )
    if document.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return document

@app.delete('/api/documents/{document_id}',status_code=204)
def delete_document(document_id : int, db:db_dependency, current_user : models.User = Depends(get_current_user)):
    document = db.query(models.Document).filter(
        models.Document.id == document_id
    ).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    if document.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if os.path.exists(document.file_path):
        os.remove(document.file_path)
    db.delete(document)
    db.commit()
    return


@app.post("/api/chat/{document_id}", response_model=ChatOut)
def chat_with_document(
    document_id: int,
    chat: ChatCreate,
    db: db_dependency,
    current_user: models.User = Depends(get_current_user),
):
    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.user_id == current_user.id,
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    answer = ask_question(document.extracted_text, chat.question)

    new_chat = models.Chat(
        user_id=current_user.id,
        document_id=document_id,
        question=chat.question,
        answer=answer,
    )

    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)

    return new_chat

# @app.get("/api/chat/{document_id}", response_model=list[ChatOut])
def get_chat_history(
    document_id: int,
    db: db_dependency,
    current_user: models.User = Depends(get_current_user),
):
    chats = db.query(models.Chat).filter(
        models.Chat.document_id == document_id,
        models.Chat.user_id == current_user.id,
    ).order_by(models.Chat.created_at.asc()).all()

    return chats

@app.post("/api/documents/{document_id}/generate-diagram", response_model=DiagramOut)
def generate_document_diagram(
    document_id: int,
    diagram_data: DiagramCreate,
    db: db_dependency,
    current_user: models.User = Depends(get_current_user),
):
    # Fetch document
    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.user_id == current_user.id
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    if not document.summary_text:
        raise HTTPException(status_code=400, detail="Document has no summary")

    try:
        mermaid_code = generate_diagram(
            document.summary_text,
            diagram_data.diagram_type
        )
    except Exception:
        raise HTTPException(status_code=500, detail="Diagram generation failed")

    new_diagram = models.Diagram(
        document_id=document_id,
        diagram_type=diagram_data.diagram_type,
        mermaid_code=mermaid_code
    )

    db.add(new_diagram)
    db.commit()
    db.refresh(new_diagram)

    return new_diagram

@app.get("/api/documents/{document_id}/diagrams", response_model=list[DiagramOut])
def get_document_diagrams(
    document_id: int,
    db: db_dependency,
    current_user: models.User = Depends(get_current_user),
):
    # Verify ownership
    document = db.query(models.Document).filter(
        models.Document.id == document_id,
        models.Document.user_id == current_user.id
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    return document.diagrams


# ------------ADMIN---------------

@app.get("/admin/users")
async def get_users(db: db_dependency):

    users = (
        db.query(models.User)
        .options(
            joinedload(models.User.documents),
            joinedload(models.User.chats)
        )
        .all()
    )

    result = []

    for user in users:
        result.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "created_at": user.created_at,
            "documents": [
                {
                    "id": doc.id,
                    "file_name": doc.file_name,
                    "summary_text": doc.summary_text,
                    "created_at": doc.created_at
                }
                for doc in user.documents
            ],
            "chats": [
                {
                    "id": chat.id,
                    "question": chat.question,
                    "answer": chat.answer,
                    "created_at": chat.created_at
                }
                for chat in user.chats
            ]
        })

    return result

@app.post('/admin/login')
def admin_login(data : AdminLogin):
    username = os.getenv('ADMIN_USERNAME')
    password = os.getenv('ADMIN_PASSWORD')

    if data.username != username or data.password != password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid admin credentials'
        )
    return {
        'message':"admin login successful"
    }

if __name__=='__main__':
    uvicorn.run(app,host='localhost',port=8000)