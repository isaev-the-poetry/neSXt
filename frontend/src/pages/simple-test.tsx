import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function SimpleTest() {
  const [googleAuthUrl, setGoogleAuthUrl] = useState<string>('');
  const [status, setStatus] = useState('Загрузка...');

  useEffect(() => {
    // Получаем Google Auth URL напрямую через fetch
    fetch('http://localhost:4000/trpc/auth.getGoogleAuthUrl?batch=1&input=%7B%220%22%3A%7B%7D%7D')
      .then(response => response.json())
      .then(data => {
        console.log('Response:', data);
        if (data[0]?.result?.data) {
          setGoogleAuthUrl(data[0].result.data);
          setStatus('Готово к входу');
        } else {
          setStatus('Ошибка получения URL');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        setStatus('Ошибка: ' + error.message);
      });
  }, []);

  const handleGoogleSignIn = () => {
    if (googleAuthUrl) {
      console.log('Redirecting to:', googleAuthUrl);
      window.location.href = googleAuthUrl;
    } else {
      alert('Google Auth URL не загружен');
    }
  };

  return (
    <>
      <Head>
        <title>Simple Google Login Test</title>
      </Head>

      <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
        <h1>🧪 Простой тест Google входа</h1>
        
        <div style={{ marginBottom: '2rem' }}>
          <p><strong>Статус:</strong> {status}</p>
          <p><strong>Google Auth URL:</strong> {googleAuthUrl || 'Загрузка...'}</p>
        </div>

        <button 
          onClick={handleGoogleSignIn}
          disabled={!googleAuthUrl}
          style={{
            padding: '15px 30px',
            backgroundColor: googleAuthUrl ? '#4285f4' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: googleAuthUrl ? 'pointer' : 'not-allowed',
            fontSize: '18px',
            fontWeight: 'bold'
          }}
        >
          🔍 Войти через Google
        </button>

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
          <h3>Отладочная информация:</h3>
          <p>Backend URL: http://localhost:4000</p>
          <p>Frontend URL: {typeof window !== 'undefined' ? window.location.origin : 'SSR'}</p>
          <p>Google Auth URL: {googleAuthUrl}</p>
        </div>
      </main>
    </>
  );
} 