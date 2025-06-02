import { useRouter } from 'next/router';
import Link from 'next/link';

export default function AuthError() {
  const router = useRouter();
  const { message } = router.query;

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column',
      gap: '20px',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{ fontSize: '4rem' }}>❌</div>
      <h1>Authentication Error</h1>
      <p style={{ color: '#666', maxWidth: '400px' }}>
        {message || 'An error occurred during authentication. Please try again.'}
      </p>
      <div style={{ display: 'flex', gap: '15px' }}>
        <Link href="/" style={{
          padding: '10px 20px',
          backgroundColor: '#0070f3',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '5px'
        }}>
          Go Home
        </Link>
        <button 
          onClick={() => router.back()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
} 