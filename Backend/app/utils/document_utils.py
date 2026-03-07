from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
from langchain_ollama import OllamaLLM


# Initialize LLM
llm = OllamaLLM(model='llama3.2:1b')


def extract_text(file_path):
    """Extract text from PDF, TXT, or DOCX files using LangChain loaders."""
    if file_path.endswith('.pdf'):
        loader = PyPDFLoader(file_path)
    elif file_path.endswith('.txt'):
        loader = TextLoader(file_path)
    elif file_path.endswith('.docx'):
        loader = Docx2txtLoader(file_path)
    else:
        raise ValueError('Unsupported File Type')
    docs = loader.load()
    # docs returns a list of ducument objects and each document has page_content(extracted text) and metadata (pagenumebr,source etc)
    return '\n'.join([doc.page_content for doc in docs])


def summary(text):
    """Generate summary using LangChain OllamaLLM."""
    prompt = f"Summarize this document:\n{text}"
    response = llm.invoke(prompt)
    return response if isinstance(response, str) else str(response)
#it means if response is already a string then simply return that else convert that into string and then return that

def ask_question(text, question):
    """Answer questions about document content using LangChain with Ollama."""
    prompt = f"""You are a helpful assistant that answers questions about a document.
Document content:
{text[:5000]}
Question: {question}

Please provide a clear and accurate answer based only on the document content above.
If the answer is not in the document, say "I couldn't find the answer in the document."
"""
    response = llm.invoke(prompt)
    return response if isinstance(response, str) else str(response)


#Mermaid diagram: is a way to create diagrams using simple text code instead of drawing them manually
def generate_diagram(summary_text: str, diagram_type: str) -> str:
    """Generate Mermaid diagram from summary using LangChain."""
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

#mind map is a diagram used to organize ideas around a central topic 
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
        
#sequence diagram is a type of UML diagram used to show how different components interact with each other 

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
        response = llm.invoke(prompt)
        code = response.strip() if isinstance(response, str) else str(response)
        #strip() removes extra space

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
        
        code = '\n'.join(lines[start_idx:]) #this removes everything before the diagram
        
        # For mindmap, clean up any remaining special characters
        if diagram_type == "mindmap":
            import re #importing regex which allows pattern matching
            clean_lines = []
            for line in code.split('\n'):
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

