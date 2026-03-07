from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.database.dependencies import  get_current_user
from app.schemas.schema import DiagramCreate, DiagramOut
from app.utils.document_utils import generate_diagram
import app.models.models as models
from typing import Annotated
from app.database.dependencies import get_db

router = APIRouter(prefix="/api/documents", tags=["diagrams"])
db_dependency = Annotated[Session, Depends(get_db)]

@router.post("/{document_id}/generate-diagram", response_model=DiagramOut)
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
        # Use LangChain tool for diagram generation
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


@router.get("/{document_id}/diagrams", response_model=list[DiagramOut])
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

