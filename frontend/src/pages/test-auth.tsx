import { useAuth } from '../contexts/AuthContext';
import { trpc } from '../utils/trpc';

export default function TestAuth() {
  const { user, isAuthenticated, logout } = useAuth();
  const { data: googleAuthUrl } = trpc.auth.getGoogleAuthUrl.useQuery();

  const handleGoogleLogin = () => {
    if (googleAuthUrl?.authUrl) {
      window.location.href = googleAuthUrl.authUrl;
    }
  };

  return (
    <div style={{
      padding: '2rem',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '600px',
      margin: '0 auto'
    }}>
      <h1>🧪 Тест Google OAuth</h1>
      
      <div style={{
        padding: '1.5rem',
        border: '2px solid #333',
        borderRadius: '8px',
        marginBottom: '2rem'
      }}>
        <h2>Статус авторизации</h2>
        {isAuthenticated ? (
          <div style={{ color: 'green' }}>
            <p>✅ Авторизован как: <strong>{user?.name}</strong></p>
            <p>📧 Email: {user?.email}</p>
            <p>🆔 ID: {user?.id}</p>
            {user?.avatar && (
              <img 
                src={user.avatar} 
                alt="Avatar" 
                style={{ width: '50px', height: '50px', borderRadius: '50%' }}
              />
            )}
            <br />
            <button 
              onClick={logout}
              style={{
                marginTop: '1rem',
                padding: '10px 20px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Выйти
            </button>
          </div>
        ) : (
          <div style={{ color: 'red' }}>
            <p>❌ Не авторизован</p>
            <button 
              onClick={handleGoogleLogin}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4285f4',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              🔍 Войти через Google
            </button>
          </div>
        )}
      </div>

      <div style={{
        padding: '1rem',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px'
      }}>
        <h3>Инструкции по тестированию:</h3>
        <ol>
          <li>Нажмите "Войти через Google"</li>
          <li>Вы будете перенаправлены на Google</li>
          <li>Войдите в ваш Google аккаунт</li>
          <li>Google перенаправит вас обратно</li>
          <li>Вы увидите информацию о пользователе</li>
        </ol>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <a href="/" style={{ color: '#0070f3' }}>← Вернуться на главную</a>
      </div>
    </div>
  );
} 