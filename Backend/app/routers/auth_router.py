from fastapi import FastAPI, HTTPException, status, Depends
from Backend.app.schemas.schema import UserCreate, UserOut, Token
from Backend.app.database.dependencies import get_db, get_current_user
from Backend.app.core.auth import get_password_hash, verify_password, create_access_token
from sqlalchemy.orm import Session
from typing import Annotated
from fastapi.security import OAuth2PasswordRequestForm
import Backend.app.models.models as models

app = FastAPI()

db_dependency = Annotated[Session, Depends(get_db)]

@app.post("/api/auth/signup", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate, db: db_dependency):
    existing_user = db.query(models.User).filter(models.User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.post('/api/auth/signin', response_model=Token, status_code=status.HTTP_200_OK)
def signin(db: db_dependency, form_data: OAuth2PasswordRequestForm = Depends()):
    db_user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not db_user or not verify_password(form_data.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token(data={"sub": db_user.username})

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@app.get('/api/auth/me', response_model=UserOut, status_code=status.HTTP_200_OK)
def read_current_user(current_user: models.User = Depends(get_current_user)):
    return current_user
