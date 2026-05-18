import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { documentsAPI, chatAPI, diagramAPI } from '../services/api';
import './DocumentView.css';

const DocumentView = () => {
  const { id } = useParams();
  const chatEndRef = useRef(null);
  const mermaidRef = useRef(null);
  
  const [document, setDocument] = useState(null);
  const [chats, setChats] = useState([]);
  const [diagrams, setDiagrams] = useState([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedDiagramType, setSelectedDiagramType] = useState('flowchart');



  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchDocument = useCallback(async () => {
    try {
      const response = await documentsAPI.getOne(id);
      setDocument(response.data);
    } catch {
      setError('Failed to load document');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchChats = useCallback(async () => {
    try {
      const response = await chatAPI.getHistory(id);
      setChats(response.data);
    } catch {
      console.error('Failed to load chat history');
    }
  }, [id]);

  const fetchDiagrams = useCallback(async () => {
    try {
      const response = await diagramAPI.getAll(id);
      setDiagrams(response.data);
    } catch {
      console.error('Failed to load diagrams');
    }
  }, [id]);

  const handleSendQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim() || sending) return;

    setSending(true);
    setError('');

    try {
      const response = await chatAPI.ask(id, question);
      setChats([...chats, response.data]);
      setQuestion('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send question');
    } finally {
      setSending(false);
    }
  };

  const handleGenerateDiagram = async () => {
    setGenerating(true);
    setError('');

    try {
      const response = await diagramAPI.generate(id, selectedDiagramType);
      setDiagrams([...diagrams, response.data]);
      setActiveTab('diagram');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate diagram');
    } finally {
      setGenerating(false);
    }
  };

  const renderMermaidDiagram = useCallback(() => {
    if (!mermaidRef.current || diagrams.length === 0) return;

    const latestDiagram = diagrams[diagrams.length - 1];
    if (!latestDiagram?.mermaid_code) return;

    // Clean the mermaid code - remove markdown code blocks
    let cleanCode = latestDiagram.mermaid_code;
    const diagramType = latestDiagram.diagram_type;
    
    // Remove ```mermaid and ``` wrapper
    cleanCode = cleanCode.replace(/```mermaid/g, '').replace(/```/g, '').trim();

    // ── Safety guards: ensure the correct header is present ──────────────────
    const firstLine = cleanCode.split('\n')[0].trim().toLowerCase();

    if (diagramType === 'mindmap' && firstLine !== 'mindmap') {
      // Missing mindmap header — prepend it
      cleanCode = 'mindmap\n' + cleanCode;
    } else if (diagramType === 'sequence' && firstLine !== 'sequencediagram') {
      cleanCode = 'sequenceDiagram\n' + cleanCode;
    } else if (diagramType === 'flowchart' && !firstLine.startsWith('flowchart')) {
      cleanCode = 'flowchart TD\n' + cleanCode;
    }

    // ── Mindmap: strip any lines with forbidden characters ───────────────────
    if (diagramType === 'mindmap') {
      const lines = cleanCode.split('\n');
      const safe = lines.filter((line, idx) => {
        if (idx === 0) return true; // keep 'mindmap'
        const stripped = line.trim();
        if (!stripped) return false;
        if (stripped.startsWith('root((')) return true;
        // Allow only letters, numbers and spaces in labels
        return !/[():\-[\]{}]/.test(stripped);
      });
      cleanCode = safe.join('\n');
    }

    // ── Sequence: fix invalid arrow syntax ──────────────────────────────────
    if (diagramType === 'sequence') {
      cleanCode = cleanCode
        .replace(/-{1,3}>{3,}/g, '->>')     // ->>> → ->>
        .replace(/([^-])->{1}([^>])/g, '$1->>$2'); // -> → ->>
    }

    // Use mermaid.render to generate SVG
    const renderWithMermaid = async () => {
      if (!window.mermaid) {
        // Load mermaid dynamically
        window.mermaid = await import('https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs');
        await window.mermaid.default.initialize({ 
          startOnLoad: false, 
          theme: 'dark',
          securityLevel: 'loose'
        });
      }
      
      try {
        const mermaidId = 'mermaid-' + Date.now();
        const { svg } = await window.mermaid.default.render(mermaidId, cleanCode);
        mermaidRef.current.innerHTML = svg;
      } catch (err) {
        console.error('Mermaid render error:', err);
        // Fallback: show code
        mermaidRef.current.innerHTML = `<pre style="color: #8b949e; text-align: left; font-size: 12px; overflow-x: auto; background: #21262d; padding: 1rem; border-radius: 8px; white-space: pre-wrap;">${cleanCode}</pre>`;
      }
    };

    renderWithMermaid();
  }, [diagrams]);

  useEffect(() => {
    fetchDocument();
    fetchChats();
    fetchDiagrams();
  }, [fetchDocument, fetchChats, fetchDiagrams]);

  useEffect(() => {
    scrollToBottom();
  }, [chats]);

  useEffect(() => {
    if (activeTab === 'diagram' && diagrams.length > 0) {
      renderMermaidDiagram();
    }
  }, [activeTab, diagrams, renderMermaidDiagram]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf': return '📕';
      case 'docx':
      case 'doc': return '📘';
      case 'txt': return '📄';
      default: return '📄';
    }
  };

  if (loading) {
    return (
      <div className="document-view-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading document...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="document-view-container">
        <div className="error-state">
          <h2>Document not found</h2>
          <Link to="/dashboard" className="btn-primary">Back to Documents</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="document-view-container">
      <div className="document-view-header">
        <Link to="/dashboard" className="back-link">
          <span>←</span> Back to Documents
        </Link>
      </div>

      {/* Document Info Card */}
      <div className="document-info-card">
        <div className="document-icon-large">
          {getFileIcon(document.file_name)}
        </div>
        <div className="document-info-content">
          <h1>{document.file_name}</h1>
          <div className="document-meta">
            <span className="meta-item">
              <span>📅</span> {formatDate(document.created_at)}
            </span>
            <span className="meta-item">
              <span>📊</span> {diagrams.length} Diagrams
            </span>
            <span className="meta-item">
              <span>💬</span> {chats.length} Messages
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="view-tabs">
        <button 
          className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          <span>📝</span> Summary
        </button>
        <button 
          className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          <span>📄</span> Content
        </button>
        <button 
          className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <span>💬</span> Chat
          {chats.length > 0 && <span className="badge">{chats.length}</span>}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'diagram' ? 'active' : ''}`}
          onClick={() => setActiveTab('diagram')}
        >
          <span>📊</span> Diagrams
          {diagrams.length > 0 && <span className="badge">{diagrams.length}</span>}
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="summary-panel">
            <div className="panel-header">
              <h2>Document Summary</h2>
            </div>
            <div className="summary-content">
              {document.summary_text ? (
                <p>{document.summary_text}</p>
              ) : (
                <div className="empty-panel">
                  <p>No summary available for this document.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Tab */}
        {activeTab === 'content' && (
          <div className="content-panel">
            <div className="panel-header">
              <h2>Extracted Text</h2>
            </div>
            <div className="extracted-text">
              {document.extracted_text || 'No content available.'}
            </div>
          </div>
        )}

        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="chat-panel">
            <div className="chat-messages">
              {chats.length === 0 ? (
                <div className="chat-empty">
                  <div className="empty-icon">💬</div>
                  <h3>Start a conversation</h3>
                  <p>Ask questions about this document and get AI-powered answers.</p>
                </div>
              ) : (
                chats.map((chat) => (
                  <div key={chat.id} className="chat-message">
                    <div className="message question-message">
                      <div className="message-avatar">👤</div>
                      <div className="message-content">
                        <p>{chat.question}</p>
                      </div>
                    </div>
                    <div className="message answer-message">
                      <div className="message-avatar">🤖</div>
                      <div className="message-content">
                        <p>{chat.answer}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {error && <div className="chat-error">{error}</div>}

            <form onSubmit={handleSendQuestion} className="chat-input-form">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question about this document..."
                disabled={sending}
              />
              <button type="submit" disabled={sending || !question.trim()}>
                {sending ? '...' : 'Send'}
              </button>
            </form>
          </div>
        )}

        {/* Diagram Tab */}
        {activeTab === 'diagram' && (
          <div className="diagram-panel">
            <div className="diagram-controls">
              <div className="diagram-type-selector">
                <label>Diagram Type:</label>
                <select 
                  value={selectedDiagramType}
                  onChange={(e) => setSelectedDiagramType(e.target.value)}
                >
                  <option value="flowchart">Flowchart</option>
                  <option value="mindmap">Mind Map</option>
                  <option value="sequence">Sequence Diagram</option>
                </select>
              </div>
              <button 
                className="generate-btn"
                onClick={handleGenerateDiagram}
                disabled={generating || !document.summary_text}
              >
                {generating ? (
                  <>
                    <span className="btn-spinner"></span>
                    Generating...
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    Generate Diagram
                  </>
                )}
              </button>
            </div>

            {error && <div className="diagram-error">{error}</div>}

            {diagrams.length === 0 ? (
              <div className="diagram-empty">
                <div className="empty-icon">📊</div>
                <h3>No diagrams yet</h3>
                <p>Generate a diagram to visualize your document.</p>
              </div>
            ) : (
              <div className="diagram-container">
                <div className="diagram-preview">
                  <div ref={mermaidRef}></div>
                </div>
                <div className="diagram-info">
                  <span className="diagram-type-badge">
                    {diagrams[diagrams.length - 1]?.diagram_type}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentView;

