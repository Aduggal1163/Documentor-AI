import { Link } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  const features = [
    {
      icon: '📄',
      title: 'Smart Document Upload',
      description: 'Upload PDF, DOCX, or TXT files and get instant text extraction with AI-powered analysis.'
    },
    {
      icon: '📝',
      title: 'Automatic Summaries',
      description: 'Get concise summaries of your documents instantly using advanced AI algorithms.'
    },
    {
      icon: '💬',
      title: 'Chat with Documents',
      description: 'Ask questions about your documents and get accurate answers powered by AI.'
    },
    {
      icon: '📊',
      title: 'Visual Diagrams',
      description: 'Automatically generate flowcharts, mind maps, and sequence diagrams from your documents.'
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'Your documents are encrypted and stored securely. Only you can access them.'
    },
    {
      icon: '⚡',
      title: 'Lightning Fast',
      description: 'Process documents in seconds with our optimized AI pipeline.'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Upload Document',
      description: 'Simply drag and drop your PDF, DOCX, or TXT file.'
    },
    {
      number: '02',
      title: 'AI Processing',
      description: 'Our AI extracts text, creates summaries, and analyzes content.'
    },
    {
      number: '03',
      title: 'Interact & Visualize',
      description: 'Chat with your document and generate visual diagrams.'
    }
  ];

  return (
    <div className="landing">
      {/* Header */}
      <header className="landing-header">
        <div className="landing-header-content">
          <Link to="/" className="landing-logo">
            <img src="/favicon.svg" alt="Documentor AI Logo" className="landing-logo-img" />
            <span>Documentor AI</span>
          </Link>
          <nav className="landing-nav">
            <Link to="/signin" className="landing-nav-link">Sign In</Link>
            <Link to="/signup" className="landing-cta-btn">Get Started</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <div className="hero-gradient"></div>
          <div className="hero-pattern"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">✨</span>
            AI-Powered Document Intelligence
          </div>
          <h1 className="hero-title">
            Transform Your Documents into
            <span className="hero-highlight"> Intelligent Conversations</span>
          </h1>
          <p className="hero-subtitle">
            Upload any document and instantly get summaries, generate diagrams, 
            and chat with your content using cutting-edge AI technology.
          </p>
          <div className="hero-buttons">
            <Link to="/signup" className="hero-primary-btn">
              Start Free Trial
              <span className="btn-arrow">→</span>
            </Link>
            <Link to="/signin" className="hero-secondary-btn">
              Sign In
            </Link>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">50K+</span>
              <span className="stat-label">Documents Processed</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">99.9%</span>
              <span className="stat-label">Uptime</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">4.9/5</span>
              <span className="stat-label">User Rating</span>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card">
            <div className="hero-card-header">
              <div className="hero-card-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
            <div className="hero-card-content">
              <div className="hero-card-icon">📄</div>
              <div className="hero-card-text">
                <div className="hero-card-line"></div>
                <div className="hero-card-line short"></div>
                <div className="hero-card-line medium"></div>
              </div>
              <div className="hero-card-badge">
                <span>✓</span> Summary Generated
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">Features</span>
            <h2 className="section-title">Everything You Need</h2>
            <p className="section-subtitle">
              Powerful AI tools to make your documents smarter, more accessible, and easier to understand.
            </p>
          </div>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div className="feature-card" key={index}>
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <div className="section-container">
          <div className="section-header">
            <span className="section-tag">How It Works</span>
            <h2 className="section-title">Three Simple Steps</h2>
            <p className="section-subtitle">
              Get started in seconds with our streamlined process.
            </p>
          </div>
          <div className="steps-container">
            {steps.map((step, index) => (
              <div className="step-item" key={index}>
                <div className="step-number">{step.number}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
                {index < steps.length - 1 && <div className="step-connector"></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Get Started?</h2>
            <p className="cta-subtitle">
              Join thousands of users who are already using Documentor AI to transform their documents.
            </p>
            <Link to="/signup" className="cta-button">
              Create Free Account
              <span className="cta-arrow">→</span>
            </Link>
          </div>
          <div className="cta-decoration">
            <div className="cta-circle cta-circle-1"></div>
            <div className="cta-circle cta-circle-2"></div>
            <div className="cta-circle cta-circle-3"></div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="footer-logo">
              <img src="/favicon.svg" alt="Documentor AI Logo" className="footer-logo-img" />
              <span>Documentor AI</span>
            </span>
            <p className="footer-tagline">Transforming documents with AI</p>
          </div>
          <div className="footer-copyright">
            © {new Date().getFullYear()} Documentor AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

