import { useState, useEffect } from 'react';
import './ApiTest.css';

function ApiTest() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tools, setTools] = useState();

  useEffect(() => {
    // Test API connection
    fetch('http://localhost:5000/api/v1/api/hello')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setMessage(data.message);
        setTools(data.tools);
        setLoading(false);
      })
      .catch((err) => {
        console.error('API Error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setMessage('');

    fetch('http://localhost:5000/api/v1/api/hello')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setMessage(data.message);
        setLoading(false);
      })
      .catch((err) => {
        console.error('API Error:', err);
        setError(err.message);
        setLoading(false);
      });
  };

  return (
    <div className="api-test">
      <h2>API Connection Test</h2>
      <div className="api-test-content">
        {loading && <p className="loading">Testing API connection...</p>}
        {error && (
          <div className="error">
            <p>Error: {error}</p>
            <button onClick={handleRetry} className="retry-btn">
              Retry
            </button>
          </div>
        )}
        {message && !loading && !error && (
          <div className="success">
            <h2 style={{ textAlign: 'left' }}>API Response: </h2>
            <p style={{ width: '50%', margin: '1rem auto', textAlign: 'left' }}>
              {message}
            </p>
            <h2 style={{ textAlign: 'left' }}>Available Tools: </h2>
            <ul
              style={{ width: '50%', margin: '1rem auto', textAlign: 'left' }}
            >
              {tools.map((tool) => (
                <li key={tool.name}>{tool.name}</li>
              ))}
            </ul>
            <button onClick={handleRetry} className="retry-btn">
              Test Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ApiTest;
