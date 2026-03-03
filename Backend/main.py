from fastapi import FastAPI,HTTPException,status,Depends,UploadFile,File
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import Annotated
import models
from dependencies import get_db,get_current_user
from schema import UserCreate, UserOut, Token,DocumentOut
from auth import get_password_hash, verify_password, create_access_token
from database import Base,engine
import uvicorn
import os
from pathlib import Path
from utils.document_utils import extract_text,summary,ask_question
app=FastAPI()
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
    current_user: models.User = Depends(get_current_user)
):
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)

    file_path = os.path.join(upload_dir, file.filename)

    # Read file ONCE
    content = file.file.read()

    # Save to disk
    with open(file_path, "wb") as buffer:
        buffer.write(content)

    # Extract text (only works properly for .txt files for now)
    extracted_text = content.decode("utf-8", errors="ignore")

    new_document = models.Document(
        user_id=current_user.id,
        file_name=file.filename,
        file_path=file_path,
        extracted_text=extracted_text,
        summary_text=None
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

@app.post("/upload")
async def upload(file: UploadFile):
    content = await file.read()
    # save temp file if needed
    with open(file.filename, "wb") as f:
        f.write(content)
    text = extract_text(file.filename)
    summarize = summary(text)
    return {"summary": summarize}

@app.post("/chat")
async def chat(file: UploadFile, question: str):
    content = await file.read()
    with open(file.filename, "wb") as f:
        f.write(content)
    text = extract_text(file.filename)
    answer = ask_question(text, question)
    return {"answer": answer}



if __name__=='__main__':
    uvicorn.run(app,host='localhost',port=8000)