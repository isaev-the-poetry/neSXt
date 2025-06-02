import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Cookies from 'js-cookie';

export default function TestAuth() {
  const { user, isAuthenticated, isLoading, logout, availableProviders } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [apiTestResult, setApiTestResult] = useState<string>('');

  useEffect(() => {
    const updateDebugInfo = () => {
      const token = Cookies.get('auth-token');
      
      setDebugInfo({
        cookieToken: token ? '***' + token.slice(-10) : 'none',
        isAuthenticated,
        userEmail: user?.email || 'none',
        userRoles: user?.roles || [],
        isLoading,
        timestamp: new Date().toLocaleTimeString(),
      });
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user, isLoading]);

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:4000/auth/google';
  };

  const handleTestGetAuthStatus = async () => {
    try {
      const token = Cookies.get('auth-token');
      const response = await fetch('http://localhost:4000/trpc/auth.getAuthStatus', {
        method: 'GET',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      setApiTestResult(`✅ getAuthStatus: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      setApiTestResult(`❌ getAuthStatus Error: ${error.message}`);
    }
  };

  const handleTestGetCurrentUser = async () => {
    try {
      const token = Cookies.get('auth-token');
      if (!token) {
        setApiTestResult('❌ No token available');
        return;
      }

      const response = await fetch('http://localhost:4000/trpc/auth.getCurrentUser', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      setApiTestResult(`✅ getCurrentUser: ${JSON.stringify(result, null, 2)}`);
    } catch (error: any) {
      setApiTestResult(`❌ getCurrentUser Error: ${error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>🔄 Loading...</h1>
        <p>Checking authentication status...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>🧪 Authentication Test Page</h1>
      
      <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h2>🔍 Debug Information</h2>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      {!isAuthenticated ? (
        <div style={{ marginBottom: '30px' }}>
          <h2>🔐 Not Authenticated</h2>
          <p>Please log in to test the authentication system.</p>
          
          <h3>Available Providers:</h3>
          {availableProviders.map(provider => (
            <div key={provider.name} style={{ marginBottom: '10px' }}>
              <button 
                onClick={handleGoogleLogin}
                disabled={!provider.isActive}
                style={{
                  padding: '10px 15px',
                  backgroundColor: provider.isActive ? '#4285f4' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: provider.isActive ? 'pointer' : 'not-allowed'
                }}
              >
                {provider.isActive ? `Login with ${provider.displayName}` : `${provider.displayName} (Not Available)`}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ marginBottom: '30px' }}>
          <h2>✅ Authenticated as {user?.email}</h2>
          <p><strong>Roles:</strong> {user?.roles?.join(', ') || 'Loading...'}</p>
          
          <div style={{ marginTop: '20px' }}>
            <h3>🧪 Test API Endpoints</h3>
            
            <div style={{ marginBottom: '10px' }}>
              <button 
                onClick={handleTestGetAuthStatus}
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                Test getAuthStatus
              </button>
              <span style={{ fontSize: '12px', color: '#666' }}>
                Public endpoint
              </span>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <button 
                onClick={handleTestGetCurrentUser}
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                Test getCurrentUser
              </button>
              <span style={{ fontSize: '12px', color: '#666' }}>
                Requires authentication
              </span>
            </div>

            <div style={{ marginTop: '20px' }}>
              <button 
                onClick={logout}
                style={{
                  padding: '10px 15px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {apiTestResult && (
        <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
          <h3>🔬 API Test Result</h3>
          <pre style={{ fontSize: '12px', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
            {apiTestResult}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p><strong>Backend:</strong> http://localhost:4000</p>
        <p><strong>TRPC:</strong> http://localhost:4000/trpc</p>
        <p><strong>Google OAuth:</strong> http://localhost:4000/auth/google</p>
      </div>
    </div>
  );
} 