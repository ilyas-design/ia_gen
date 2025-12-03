import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const Settings = () => {
  const { user, token, signIn } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Email est obligatoire.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name, email })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Échec de la mise à jour du profil');
      }

      // Mettre à jour le contexte d'auth avec le nouvel utilisateur
      signIn(token, data.user);
      setSuccess('Profil mis à jour avec succès.');
    } catch (err) {
      setError(err.message || 'Échec de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <button
        type="button"
        onClick={() => navigate(-1)}
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          border: 'none',
          background: 'rgba(15, 23, 42, 0.7)',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          padding: '6px 10px',
          borderRadius: '999px',
          fontSize: '0.85rem',
          zIndex: 2
        }}
      >
        <span style={{ fontSize: '1.2rem', marginRight: '4px' }}>←</span> Back
      </button>
      <div className="auth-container">
        <div className="auth-paper">
          <h1 className="auth-title">Paramètres du compte</h1>
          <p className="auth-subtitle">Modifiez votre nom et votre adresse e-mail.</p>

          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              id="name"
              label="Nom"
              name="name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <TextField
              required
              fullWidth
              id="email"
              label="Adresse e-mail"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;


