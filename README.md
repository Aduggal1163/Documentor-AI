# 📄 Documentor-AI

Documentor-AI is an advanced, full-stack AI-powered document analysis platform. By combining a modern **React 19 + Vite** frontend with a robust **FastAPI + LangChain + Ollama** backend, Documentor-AI enables users to upload documents (PDFs, TXT, DOCX), automatically extract and summarize text locally, chat with documents, and generate dynamic visual representations (Flowcharts, Mind Maps, and Sequence Diagrams) using Mermaid.js.

---

## ✨ Features

- **🔐 Secure Authentication:** Complete JWT-based signup and login system for users.
- **📄 Document Upload & Parsing:** Support for `.pdf`, `.txt`, and `.docx` files (up to 10MB) using LangChain loaders (`PyPDFLoader`, `TextLoader`, `Docx2txtLoader`).
- **📝 Automated Summarization:** Quick, local text summaries generated via Ollama (`llama3.2:1b`).
- **💬 Conversational RAG Chat:** Ask questions and extract specific insights from uploaded documents using a retrieval QA interface.
- **📊 AI-Generated Diagrams:** Create visual flowcharts, mindmaps, and sequence diagrams directly from your document's summary using LangChain and Mermaid.js.
- **🛡️ Admin Dashboard:** Complete admin workspace to manage users, inspect uploaded documents, and audit chat histories.
- **🎨 Premium Dark UI:** Responsively designed tabs for Summaries, Contents, Chats, and Interactive Diagrams with sleek micro-animations and custom styling.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 (Vite)
- **Routing:** React Router v7
- **HTTP Client:** Axios
- **Visualization:** Mermaid.js (Dynamic ESM Rendering)
- **Styling:** Vanilla CSS with HSL variables for dark/glassmorphic theme

### Backend
- **Framework:** FastAPI (Python)
- **LLM Orchestration:** LangChain / LangChain Ollama
- **Local Model:** Ollama (`llama3.2:1b`)
- **Database ORM:** SQLAlchemy with PyMySQL (MySQL dialect)
- **Security:** JWT (python-jose), bcrypt (passlib)
- **Parsing:** PyPDF, python-docx, docx2txt

---

## 📁 Repository Structure

```directory
Documentor-AI/
├── Backend/                 # FastAPI server, database models, routers, schemas & utils
│   ├── app/
│   │   ├── core/            # Security and configurations
│   │   ├── database/        # Session and dependency management
│   │   ├── models/          # SQLAlchemy Database Models (User, Document, Chat, Diagram)
│   │   ├── routers/         # API endpoints (Auth, Document, Chat, Admin, Diagram)
│   │   ├── schemas/         # Pydantic validation schemas
│   │   └── utils/           # LangChain text-extraction and LLM helpers
│   ├── uploads/             # Locally stored uploaded files (Gitignored)
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Environment secrets (Gitignored)
│
├── Frontend/                # Vite + React 19 Frontend
│   ├── src/
│   │   ├── assets/          # Icons and images
│   │   ├── components/      # Shared components (Layout, ProtectedRoute)
│   │   ├── context/         # Auth contexts
│   │   ├── pages/           # Pages (Landing, SignIn, SignUp, Dashboard, DocumentView, Admin)
│   │   └── services/        # Axios API services
│   └── package.json         # Node.js dependencies
│
└── documento-AI files/      # Sample input files (.pdf, .txt, .docx) & demo video
```

---

## 🚀 Setup & Installation

### Prerequisites
1. **Ollama:** Download and install [Ollama](https://ollama.com/). Pull the default model:
   ```bash
   ollama pull llama3.2:1b
   ```
2. **MySQL Database:** Running instance of MySQL.
3. **Node.js & Python 3.10+**

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd Backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `Backend/` directory and configure your variables:
   ```ini
   DATABASE_URL=mysql+pymysql://<user>:<password>@localhost:3306/<database_name>
   SECRET_KEY=your-custom-jwt-secret-key
   OLLAMA_MODEL=llama3.2:1b
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your_admin_password
   ```
5. Run the FastAPI development server:
   ```bash
   python -m app.main
   ```
   The backend will run on `http://localhost:8000`.

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../Frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`.

---