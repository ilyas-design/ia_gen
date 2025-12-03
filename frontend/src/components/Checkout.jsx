import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField } from '@mui/material';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const Checkout = () => {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [cardHolder, setCardHolder] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (cartItems.length === 0) {
      setError('Votre panier est vide.');
      return;
    }

    if (!cardHolder || !cardNumber || !expiry || !cvv) {
      setError('Veuillez remplir tous les champs de paiement.');
      return;
    }

    const digitsOnlyCard = cardNumber.replace(/\D/g, '');
    const digitsOnlyCvv = cvv.replace(/\D/g, '');
    const expiryPattern = /^(0[1-9]|1[0-2])\/\d{2}$/;

    if (digitsOnlyCard.length !== 16) {
      setError('Le numéro de carte doit contenir exactement 16 chiffres.');
      return;
    }

    if (digitsOnlyCvv.length !== 3) {
      setError('Le CVC doit contenir exactement 3 chiffres.');
      return;
    }

    if (!expiryPattern.test(expiry)) {
      setError("La date d'expiration doit être au format MM/AA (ex: 03/27).");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            productId: item.id,
            quantity: item.quantity
          })),
          paymentMethod: 'CARD',
          cardNumber,
          cardHolder,
          expiry,
          cvv
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Le paiement a échoué.');
      }

      clearCart();
      setSuccess('Paiement réussi ! Votre commande a été créée.');

      setTimeout(() => {
        navigate('/orders');
      }, 1000);
    } catch (err) {
      setError(err.message || 'Le traitement du paiement a échoué.');
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
          <h1 className="auth-title">Paiement</h1>
          <p className="auth-subtitle">
            Ceci est un paiement simulé. Ne saisissez jamais de vraies informations bancaires.
          </p>

          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}

          <div style={{ marginBottom: '16px', fontSize: '0.9rem', color: '#4a5568' }}>
            <div>
              Articles dans le panier : <strong>{cartItems.length}</strong>
            </div>
            <div>
              Total :{' '}
              <strong>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD'
                }).format(getCartTotal())}
              </strong>
            </div>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <TextField
              required
              fullWidth
              label="Nom du titulaire de la carte"
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value)}
            />
            <TextField
              required
              fullWidth
              label="Numéro de carte (16 chiffres)"
              value={cardNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                setCardNumber(value);
              }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <TextField
                required
                fullWidth
                label="Date d'expiration (MM/AA)"
                value={expiry}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  if (value.length >= 3) {
                    value = `${value.slice(0, 2)}/${value.slice(2)}`;
                  }
                  setExpiry(value);
                }}
              />
              <TextField
                required
                fullWidth
                label="CVC (3 chiffres)"
                value={cvv}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                  setCvv(value);
                }}
              />
            </div>

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Traitement en cours...' : 'Payer (simulation)'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;


