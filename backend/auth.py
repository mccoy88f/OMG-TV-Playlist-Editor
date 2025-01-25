from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from database import verify_password, get_db
from models import TokenData, User
import os

# Configurazione sicurezza
SECRET_KEY = os.getenv('JWT_SECRET_KEY', os.urandom(32).hex())
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 1 ora
REFRESH_TOKEN_EXPIRE_DAYS = 7

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def authenticate_user(username: str, password: str) -> Optional[User]:
    try:
        if verify_password(username, password):
            with get_db() as db:
                user_data = db.execute(
                    "SELECT * FROM users WHERE username = ?",
                    (username,)
                ).fetchone()
                if user_data:
                    return User(**user_data)
    except Exception as e:
        print(f"Authentication error: {str(e)}")
    return None

def create_token(data: dict, expires_delta: Optional[timedelta] = None, is_refresh: bool = False):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({
        "exp": expire,
        "type": "refresh" if is_refresh else "access"
    })
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def create_access_token(data: dict):
    return create_token(
        data,
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

def create_refresh_token(data: dict):
    return create_token(
        data,
        timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        is_refresh=True
    )

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        token_type: str = payload.get("type", "access")
        
        if not username or token_type != "access":
            raise credentials_exception
            
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception

    try:
        with get_db() as db:
            user_data = db.execute(
                "SELECT * FROM users WHERE username = ?",
                (token_data.username,)
            ).fetchone()
            
            if user_data is None:
                raise credentials_exception
                
            return User(**user_data)
    except Exception as e:
        print(f"Database error in get_current_user: {str(e)}")
        raise credentials_exception

async def get_current_user_id(current_user: User = Depends(get_current_user)) -> int:
    return current_user.id

def verify_refresh_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        token_type: str = payload.get("type")
        
        if not username or token_type != "refresh":
            return None
            
        return username
    except JWTError:
        return None