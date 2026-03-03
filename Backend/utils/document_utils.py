import ollama
from pypdf import PdfReader
from docx import Document

def extract_text(file_path):
    if file_path.endswith('.txt'):
        with open(file_path,'r',encoding='utf-8') as f:
            return f.read()
    elif file_path.endswith('.pdf'):
        reader = PdfReader(file_path)
        return "\n".join([page.extract_text() for page in reader.pages])
    elif file_path.endswith(".docx"):
        doc = Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])
    else:
        raise ValueError("Unsupported file type")
    
def summary(text):
    prompt = f'Summarize this document: \n{text}'
    response = ollama.chat(
        model='llama3.2:1b',
        messages=[
            {
                'role':'user',
                'content':prompt
            }
        ]
    )
    return response['message']['content']

def ask_question(text, question):
    prompt = f"DOCUMENT:\n{text}\nQUESTION:\n{question}"
    response = ollama.chat(model="llama3.2:1b", messages=[{"role": "user", "content": prompt}])
    return response["message"]["content"]

