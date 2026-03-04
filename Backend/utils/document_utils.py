 
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

def generate_diagram(summary_text: str, diagram_type: str) -> str:
    # Detailed prompt with exact syntax examples
    if diagram_type == "flowchart":
        prompt = f"""Generate a Mermaid flowchart diagram from this summary. 

CRITICAL RULES:
1. Use ONLY this exact format: flowchart TD\n    A[Label] --> B[Label]
2. Node labels MUST be inside square brackets: [text]
3. Use --> for arrows between nodes
4. NO quotes, NO colons in labels, NO special characters like parentheses
5. Start with "flowchart TD" on first line
6. NO extra text, NO markdown, NO backticks

Example format:
flowchart TD
    A[Start] --> B[Process]
    B --> C[End]

Summary to convert:
{summary_text[:1000]}

Generate flowchart:"""
    
    elif diagram_type == "mindmap":
        prompt = f"""Generate a Mermaid mindmap diagram from this summary.

CRITICAL RULES - VERY IMPORTANT:
1. Root MUST be: root((MainTopic))
2. Each sub-topic is just plain text on a new line with 2 spaces indent per level
3. Use ONLY letters, numbers, and spaces in labels - NO parentheses, NO special chars like (), :, -, etc.
4. Keep labels SHORT - max 15 characters each
5. Start with "mindmap" on first line
6. NO extra text, NO markdown, NO backticks

Example:
mindmap
  root((Project))
    Planning
      Design
      Goals
    Build
      Frontend
      Backend
    Test
      Unit
      API

Summary to convert:
{summary_text[:800]}

Generate mindmap with simple short labels only:"""
    
    else:  # sequence
        prompt = f"""Generate a Mermaid sequence diagram from this summary.

CRITICAL RULES:
1. Use ONLY this exact format: sequenceDiagram\n    Actor->>Target: Message
2. Define participants first: participant A\n    participant B
3. Use ->> for arrows
4. Use ONLY letters and numbers in messages - NO special characters
5. Start with "sequenceDiagram" on first line
6. NO extra text, NO markdown, NO backticks

Example format:
sequenceDiagram
    participant User
    participant System
    User->>System: Request
    System-->>User: Response

Summary to convert:
{summary_text[:1000]}

Generate sequence diagram:"""

    try:
        response = ollama.chat(
            model="llama3.2:1b",
            messages=[{"role": "user", "content": prompt}],
        )
        code = response["message"]["content"].strip()
        
        # Clean up any markdown code blocks that might be present
        code = code.replace("```mermaid", "").replace("```", "").strip()
        
        # Additional cleanup - remove any leading/trailing text
        lines = code.split('\n')
        valid_diagrams = ['flowchart', 'mindmap', 'sequenceDiagram']
        
        # Find where valid diagram starts
        start_idx = 0
        for i, line in enumerate(lines):
            line_lower = line.strip().lower()
            if any(d in line_lower for d in valid_diagrams):
                start_idx = i
                break
        
        code = '\n'.join(lines[start_idx:])
        
        # For mindmap, clean up any remaining special characters
        if diagram_type == "mindmap":
            # Remove lines with special characters that mindmap doesn't support
            clean_lines = []
            for line in code.split('\n'):
                # Only keep lines with alphanumeric, spaces, and basic punctuation
                import re
                # Keep root(( lines and plain text lines
                if 'root((' in line or not re.search(r'[():\-\[\]]', line):
                    clean_lines.append(line)
                elif line.strip().startswith('root'):
                    clean_lines.append(line)
            code = '\n'.join(clean_lines)
        
        return code
    except Exception as e:
        # Fallback: generate a simple diagram based on diagram type
        if diagram_type == "flowchart":
            return "flowchart TD\n    A[Start] --> B[Process]\n    B --> C[End]"
        elif diagram_type == "mindmap":
            return "mindmap\n  root((Main))\n    Topic1\n      Item1\n    Topic2\n      Item2"
        elif diagram_type == "sequence":
            return "sequenceDiagram\n    participant A\n    participant B\n    A->>B: Message\n    B-->>A: Response"
        else:
            raise ValueError(f"Unknown diagram type: {diagram_type}")

