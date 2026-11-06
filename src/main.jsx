import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ELZOGHBI Error Caught:', error, errorInfo);
  }

  handleReset = () => {
    try {
      const keysToClear = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && (k.startsWith('elzoghbi_') )) keysToClear.push(k);
      }
      keysToClear.forEach(k => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0d151c',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          fontFamily: 'Cairo, sans-serif',
          direction: 'rtl'
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            backgroundColor: '#1e293b',
            borderRadius: '24px',
            padding: '32px',
            border: '1px solid #334155',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>
              مرحباً بك في ELZOGHBI
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '24px' }}>
              تم رصد خطأ أثناء تحميل الذاكرة المحلية أو الكاش القديم. اضغط على الزر أدناه لتنظيف الذاكرة المؤقتة وتشغيل الموقع فوراً.
            </p>
            <div style={{
              backgroundColor: '#0f172a',
              padding: '12px',
              borderRadius: '12px',
              fontSize: '11px',
              color: '#f87171',
              fontFamily: 'monospace',
              marginBottom: '24px',
              textAlign: 'left',
              direction: 'ltr',
              wordBreak: 'break-all'
            }}>
              {String(this.state.error?.message || this.state.error || 'React render error')}
            </div>
            <button
              onClick={this.handleReset}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                fontSize: '14px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              🔄 إعادة تهيئة الذاكرة وتشغيل منصة ELZOGHBI الآن
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
