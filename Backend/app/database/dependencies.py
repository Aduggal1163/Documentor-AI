from fastapi import Depends, HTTPException 
from fastapi.security import OAuth2PasswordBearer
#Extract the JWT token from the request header
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.database.database import sessionLocal
from app.core.auth import SECRET_KEY, ALGORITHM
from app.models.models import User

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/auth/signin"
)
#“Expect a JWT token in the Authorization header using Bearer scheme.”
#The endpoint where the client can obtain a token is /login

def get_db():
    db = sessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
# This means:
# Get token from Authorization header
# Get DB session
# Then execute function

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Could not validate token")

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user