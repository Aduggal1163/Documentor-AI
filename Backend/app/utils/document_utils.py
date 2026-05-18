import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader, TextLoader, Docx2txtLoader
from langchain_ollama import OllamaLLM

load_dotenv()

# Initialize LLM — model name loaded from .env (default: llama3.2:1b)
_model = os.environ.get('OLLAMA_MODEL', 'llama3.2:1b')
llm = OllamaLLM(model=_model)


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
    import re

    if diagram_type == "flowchart":
        prompt = f"""Generate ONLY a Mermaid flowchart. No explanation, no markdown, no backticks.

OUTPUT FORMAT (copy exactly):
flowchart TD
    A[First Step] --> B[Second Step]
    B --> C[Third Step]
    C --> D[Result]

RULES:
- Start first line with exactly: flowchart TD
- Every node must have a short unique letter id followed by [Label in brackets]
- Labels: letters and numbers only, no colons, no parentheses, no quotes
- Use --> for arrows only
- 4 to 8 nodes maximum

Summary:
{summary_text[:800]}

flowchart TD"""

    elif diagram_type == "mindmap":
        prompt = f"""Generate ONLY a Mermaid mindmap diagram. No explanation, no markdown fences, no backticks. Output only the raw diagram code.

EXACT FORMAT TO FOLLOW:
mindmap
  root((Topic))
    Branch1
      Item1
      Item2
    Branch2
      Item3
      Item4

STRICT RULES:
- First line MUST be exactly the word: mindmap
- Second line MUST be: two spaces then root((ShortTopicName))
- Only ONE root is allowed
- Branch lines: exactly 4 spaces + plain text label
- Leaf lines: exactly 6 spaces + plain text label
- Labels: ONLY letters, numbers, spaces - NO parentheses, NO colons, NO dashes, NO brackets
- Keep all labels under 15 characters
- Maximum 3 levels deep

Summary to convert:
{summary_text[:600]}

Output the mindmap diagram now (start with the word mindmap):"""

    else:  # sequence
        prompt = f"""Generate ONLY a Mermaid sequence diagram. No explanation, no markdown, no backticks.

OUTPUT FORMAT (copy exactly):
sequenceDiagram
    participant A
    participant B
    participant C
    A->>B: DoSomething
    B->>C: DoNext
    C-->>A: Return

RULES:
- Line 1 must be exactly: sequenceDiagram
- Define ALL participants first using: participant Name
- Participant names: one word, letters only, no spaces
- Use ONLY ->> for requests and -->> for responses
- Message labels after colon: letters and numbers only, no special characters
- Maximum 3 participants, maximum 6 messages

Summary:
{summary_text[:800]}

sequenceDiagram"""

    try:
        response = llm.invoke(prompt)
        code = response.strip() if isinstance(response, str) else str(response)

        # Remove markdown code fences
        code = code.replace("```mermaid", "").replace("```", "").strip()

        # Find where the valid diagram starts
        lines = code.split('\n')
        valid_starters = {'flowchart', 'mindmap', 'sequencediagram'}
        start_idx = 0
        for i, line in enumerate(lines):
            if line.strip().lower() in valid_starters or \
               any(line.strip().lower().startswith(s) for s in valid_starters):
                start_idx = i
                break
        code = '\n'.join(lines[start_idx:]).strip()

        # ── Mindmap-specific cleanup ──────────────────────────────────────────
        if diagram_type == "mindmap":
            code = _clean_mindmap(code)

        # ── Sequence-specific cleanup ─────────────────────────────────────────
        elif diagram_type == "sequence":
            code = _clean_sequence(code)

        # Validate result has meaningful content
        if len(code.split('\n')) < 3:
            raise ValueError("Generated diagram too short")

        return code

    except Exception:
        # Reliable fallbacks
        if diagram_type == "flowchart":
            return "flowchart TD\n    A[Start] --> B[Process]\n    B --> C[Analyze]\n    C --> D[Result]"
        elif diagram_type == "mindmap":
            return "mindmap\n  root((Main Topic))\n    Key Point 1\n      Detail A\n      Detail B\n    Key Point 2\n      Detail C\n    Key Point 3\n      Detail D"
        else:  # sequence
            return "sequenceDiagram\n    participant User\n    participant System\n    participant Database\n    User->>System: SendRequest\n    System->>Database: QueryData\n    Database-->>System: ReturnData\n    System-->>User: ShowResult"


def _clean_mindmap(code: str) -> str:
    """Sanitize LLM-generated mindmap code to ensure valid Mermaid syntax."""
    import re
    lines = code.split('\n')
    result = []
    root_seen = False

    for line in lines:
        stripped = line.strip()

        # Always keep the mindmap header
        if stripped.lower() == 'mindmap':
            result.append('mindmap')
            continue

        # Skip empty lines at the top
        if not stripped and not result:
            continue

        # Handle root line
        if 'root((' in line:
            if root_seen:
                continue  # only one root allowed
            root_seen = True
            # Extract the topic from root((Topic))
            match = re.search(r'root\(\((.+?)\)\)', line)
            topic = match.group(1) if match else 'MainTopic'
            # Sanitize: letters, numbers, spaces only
            topic = re.sub(r'[^a-zA-Z0-9 ]', '', topic).strip()[:20] or 'MainTopic'
            result.append(f'  root(({topic}))')
            continue

        # Skip lines before root
        if not root_seen:
            continue

        # For branch/leaf lines: sanitize labels
        # Measure indent level
        indent = len(line) - len(line.lstrip())
        label = re.sub(r'[^a-zA-Z0-9 ]', '', stripped).strip()
        if not label:
            continue
        if len(label) > 20:
            label = label[:20].strip()

        # Normalize indent to multiples of 2 (min 4 for branches)
        if indent < 2:
            indent = 4
        elif indent < 4:
            indent = 4
        else:
            indent = min(indent, 6)

        result.append(' ' * indent + label)

    # If no root was found, add a default one
    if not root_seen and len(result) > 1:
        result.insert(1, '  root((MainTopic))')

    return '\n'.join(result)


def _clean_sequence(code: str) -> str:
    """Sanitize LLM-generated sequence diagram code."""
    import re
    lines = code.split('\n')
    result = []
    participants = set()

    for line in lines:
        stripped = line.strip()

        if not stripped:
            continue

        # Keep header
        if stripped.lower() == 'sequencediagram':
            result.append('sequenceDiagram')
            continue

        # Clean participant lines
        if stripped.lower().startswith('participant '):
            name = stripped[12:].strip()
            name = re.sub(r'[^a-zA-Z0-9]', '', name)[:15]
            if name and name not in participants:
                participants.add(name)
                result.append(f'    participant {name}')
            continue

        # Fix and keep arrow lines
        # Normalize arrow types: ->>>, ->>, --> and variants → ->> or -->>
        if re.search(r'[-]+>+', stripped):
            # Normalise all arrow variants
            fixed = re.sub(r'-{1,3}>{2,3}', '->>', stripped)   # request
            fixed = re.sub(r'-{2,3}>{1,2}(?!>)', '-->>', fixed) # response (if starts with --)
            # Sanitize message after colon
            if ':' in fixed:
                parts = fixed.split(':', 1)
                msg = re.sub(r'[^a-zA-Z0-9 ]', '', parts[1]).strip()[:40]
                fixed = parts[0] + ': ' + (msg or 'Message')
            result.append('    ' + fixed.strip())
            continue

        # Skip anything else (prose, explanations, etc.)

    return '\n'.join(result)




