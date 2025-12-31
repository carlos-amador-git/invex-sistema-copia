import React, { useState } from 'react';
import { Lock, User, AlertTriangle, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
  const { loginWithCredentials } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await loginWithCredentials(username, password);
      if (!result.success) {
        setError(result.error);
      }
    } catch (err) {
      setError('Error de conexión. Verifique que el servidor esté activo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="bg-pattern"></div>
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <div className="logo-brand">
              <span className="logo-invex">invex</span>
              <span className="logo-banco">Banco</span>
            </div>
          </div>
          <div className="login-title-section">
            <h2>Sistema de Inventario</h2>
            <p>Control de Tarjetas Bancarias</p>
          </div>
        </div>

        {error && (
          <div className="login-error">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handlePasswordLogin} className="login-form">
          <div className="form-group">
            <label>Usuario</label>
            <div className="input-wrapper">
              <User size={18} className="input-icon" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingrese su usuario"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <div className="input-wrapper">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese su contraseña"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader size={18} className="spinning" />
                Verificando...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div className="demo-credentials">
          <p>📋 Credenciales de demostración:</p>
          <div className="credentials-list">
            <span><strong>Admin:</strong> admin / admin123</span>
            <span><strong>TSYS:</strong> tsys_user / tsys123</span>
            <span><strong>Distribución:</strong> dist_user / dist123</span>
            <span><strong>Módulos:</strong> mod_user / mod123</span>
            <span><strong>Director:</strong> director / dir123</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
