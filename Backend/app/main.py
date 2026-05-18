from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from app.routers import auth_router, document_router, chat_router, admin_router, diagram_router

from app.database.database import engine, Base
from app.models import models

# Create database tables automatically
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(document_router.router)
app.include_router(chat_router.router)
app.include_router(admin_router.router)
app.include_router(diagram_router.router)


if __name__ == '__main__':
    uvicorn.run(app, host='localhost', port=8000)

