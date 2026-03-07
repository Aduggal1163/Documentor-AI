from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from typing import Annotated
import app.models.models as models
from app.schemas.schema import AdminLogin
from app.database.dependencies import get_db
import os

router = APIRouter(prefix="/admin", tags=["admin"])
db_dependency = Annotated[Session, Depends(get_db)]

@router.get("/users")
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


@router.post('/login')
def admin_login(data: AdminLogin):
    username = os.getenv('ADMIN_USERNAME')
    password = os.getenv('ADMIN_PASSWORD')

    if data.username != username or data.password != password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Invalid admin credentials'
        )
    return {
        'message': "admin login successful"
    }

