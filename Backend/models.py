from sqlalchemy import Column,Integer,String, DateTime,ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index = True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(255),nullable=False)
    hashed_password = Column(String(255),nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    documents = relationship("Document",back_populates='user',cascade="all, delete-orphan")
    chats = relationship("Chat",back_populates="user",cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = 'documents'
    id = Column(Integer, primary_key=True, index = True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"),nullable=False)
    file_name = Column(String(255))
    file_path = Column(String(500))
    extracted_text = Column(Text)
    summary_text = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User",back_populates='documents')
    chats = relationship("Chat", back_populates="document", cascade="all, delete-orphan")
    diagrams = relationship("Diagram", back_populates="document", cascade="all, delete-orphan")

class Chat(Base):
    __tablename__ = 'chats'
    id = Column(Integer, primary_key=True, index = True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    document_id = Column(Integer, ForeignKey('documents.id', ondelete="CASCADE"),nullable=False)
    question = Column(Text)
    answer = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="chats")
    document = relationship("Document", back_populates="chats")

class Diagram(Base):
    __tablename__ = 'diagrams'

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey('documents.id', ondelete="CASCADE"), nullable=False)
    diagram_type = Column(String(50))  # flowchart, mindmap, sequence
    mermaid_code = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    document = relationship("Document", back_populates="diagrams")

# cascade="all, delete-orphan"
# If you delete:
# a user → all documents + chats auto delete
# a document → all related chats auto delete
# No manual cleanup needed