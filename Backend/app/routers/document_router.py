from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
import app.models.models as models
import os
from app.database.dependencies import get_db, get_current_user
from sqlalchemy.orm import Session
from typing import Annotated
from app.schemas.schema import DocumentOut
import uuid
from app.utils.document_utils import extract_text, summary

router = APIRouter(prefix="/api/documents", tags=["documents"])

db_dependency = Annotated[Session, Depends(get_db)]

@router.post("/upload", response_model=DocumentOut)
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
    file.file.seek(0, 2) #seek() moves the cursor (pointer) inside a file. o beginning and 2 end of file 
    # file.seek(position, reference_point)
    file_size = file.file.tell() #tell() returns the current cursor position in bytes.
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

    # Extract text using LangChain loaders
    try:
        extracted_text = extract_text(file_path)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Unsupported or corrupted file",
        )

    # Generate summary using LangChain
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


@router.get('', response_model=list[DocumentOut])
def get_all_documents(db: db_dependency, current_user: models.User = Depends(get_current_user)):
    documents = (
        db.query(models.Document).filter(models.Document.user_id == current_user.id).all()
    )
    return documents


@router.get("/{document_id}", response_model=DocumentOut)
def get_single_document(document_id: int, db: db_dependency, current_user: models.User = Depends(get_current_user)):
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='Document Not Found'
        )
    if document.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return document


@router.delete('/{document_id}', status_code=204)
def delete_document(document_id: int, db: db_dependency, current_user: models.User = Depends(get_current_user)):
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
