import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { documentsAPI } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    filterAndSortDocuments();
  }, [documents, searchQuery, sortBy, filterType]);

  const fetchDocuments = async () => {
    try {
      const response = await documentsAPI.getAll();
      setDocuments(response.data);
    } catch {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortDocuments = () => {
    let filtered = [...documents];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.file_name.toLowerCase().includes(query) ||
        (doc.summary_text && doc.summary_text.toLowerCase().includes(query))
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(doc => {
        const ext = doc.file_name.split('.').pop().toLowerCase();
        return ext === filterType;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    setFilteredDocs(filtered);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedExtensions = ['.txt', '.pdf', '.docx'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!allowedExtensions.includes(fileExt)) {
      setError('Invalid file type. Allowed: .txt, .pdf, .docx');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Max 10MB');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      await documentsAPI.upload(file);
      setSuccess('Document uploaded successfully!');
      fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload document');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await documentsAPI.delete(id);
      setDocuments(documents.filter(doc => doc.id !== id));
      setSuccess('Document deleted successfully');
    } catch {
      setError('Failed to delete document');
    }
  };

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
      case 'pdf':
        return '📕';
      case 'docx':
      case 'doc':
        return '📘';
      case 'txt':
        return '📄';
      default:
        return '📄';
    }
  };

  // Calculate stats
  const totalDocs = documents.length;
  const recentDocs = documents.filter(doc => {
    const docDate = new Date(doc.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return docDate > weekAgo;
  }).length;
  const docsWithSummary = documents.filter(doc => doc.summary_text).length;

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading your documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-content">
            <span className="stat-value">{totalDocs}</span>
            <span className="stat-label">Total Documents</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <span className="stat-value">{recentDocs}</span>
            <span className="stat-label">This Week</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <span className="stat-value">{docsWithSummary}</span>
            <span className="stat-label">Summarized</span>
          </div>
        </div>
      </div>

      <div className="dashboard-header">
        <h1>My Documents</h1>
        <label className="upload-btn">
          <input
            type="file"
            accept=".txt,.pdf,.docx"
            onChange={handleFileUpload}
            disabled={uploading}
            hidden
          />
          {uploading ? (
            <>
              <span className="btn-spinner"></span>
              Uploading...
            </>
          ) : (
            <>
              <span className="upload-icon">+</span>
              Upload Document
            </>
          )}
        </label>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          {error}
          <button className="alert-close" onClick={() => setError('')}>×</button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✓</span>
          {success}
          <button className="alert-close" onClick={() => setSuccess('')}>×</button>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="filter-bar">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>×</button>
          )}
        </div>
        <div className="filter-group">
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            <option value="pdf">PDF</option>
            <option value="docx">DOCX</option>
            <option value="txt">TXT</option>
          </select>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {filteredDocs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            {searchQuery || filterType !== 'all' ? '🔍' : '📄'}
          </div>
          <h3>
            {searchQuery || filterType !== 'all' 
              ? 'No documents found' 
              : 'No documents yet'
            }
          </h3>
          <p>
            {searchQuery || filterType !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Upload your first document to get started'
            }
          </p>
          {!searchQuery && filterType === 'all' && (
            <label className="upload-btn upload-btn-outline">
              <input
                type="file"
                accept=".txt,.pdf,.docx"
                onChange={handleFileUpload}
                hidden
              />
              + Upload Document
            </label>
          )}
        </div>
      ) : (
        <div className="documents-grid">
          {filteredDocs.map((doc) => (
            <Link to={`/dashboard/documents/${doc.id}`} key={doc.id} className="document-card">
              <div className="document-icon-wrapper">
                <span className="document-type-icon">{getFileIcon(doc.file_name)}</span>
                <span className="document-type-badge">
                  {doc.file_name.split('.').pop().toUpperCase()}
                </span>
              </div>
              <div className="document-info">
                <h3 className="document-name" title={doc.file_name}>{doc.file_name}</h3>
                <p className="document-date">
                  <span className="date-icon">📅</span>
                  {formatDate(doc.created_at)}
                </p>
                {doc.summary_text && (
                  <p className="document-summary">
                    {doc.summary_text.substring(0, 100)}...
                  </p>
                )}
              </div>
              <div className="document-actions">
                <button 
                  className="action-btn view-btn"
                  title="View document"
                >
                  👁️
                </button>
                <button 
                  className="action-btn delete-btn"
                  onClick={(e) => handleDelete(doc.id, e)}
                  title="Delete document"
                >
                  🗑️
                </button>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Results count */}
      {filteredDocs.length > 0 && (
        <div className="results-info">
          Showing {filteredDocs.length} of {documents.length} documents
        </div>
      )}
    </div>
  );
};

export default Dashboard;

