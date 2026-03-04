from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta, timezone
import os

SECRET_KEY = os.environ.get('SECRET_KEY', 'fallback-dev-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=['bcrypt'],deprecated='auto')

def get_password_hash(password : str):
    # Truncate password to 72 bytes (bcrypt limitation)
    return pwd_context.hash(password[:72])

def verify_password(plain_password : str, hashed_password: str):
    return pwd_context.verify(plain_password[:72],hashed_password)

def create_access_token(data : dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({'exp':expire})
    encoded_jwt = jwt.encode(to_encode,SECRET_KEY,algorithm=ALGORITHM)
    return encoded_jwt