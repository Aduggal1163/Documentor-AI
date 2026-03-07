from fastapi import FastAPI, HTTPException,  Depends

import Backend.app.models.models as models
from Backend.app.database.dependencies import get_db, get_current_user
from Backend.app.schemas.schema import ChatCreate, ChatOut
from typing import Annotated
from sqlalchemy.orm import Session
from utils.document_utils import ask_question
app = FastAPI()
db_dependency = Annotated[Session, Depends(get_db)]

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

    # Use LangChain RetrievalQA for question answering
    try:
        answer = ask_question(document.extracted_text, chat.question)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing question: {str(e)}")

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


@app.get("/api/chat/{document_id}", response_model=list[ChatOut])
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
