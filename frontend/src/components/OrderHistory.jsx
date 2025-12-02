import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Cart.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const OrderHistory = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      setError('');
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/orders/my`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to load orders');
        }
        setOrders(data);
      } catch (err) {
        setError(err.message || 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  if (loading) {
    return (
      <div className="cart-container">
        <div>Loading your orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cart-container">
        <div className="auth-error">{error}</div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="cart-container">
        <div className="empty-cart">
          <h2>No orders yet</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h1 className="cart-title">Your Orders</h1>
      <div className="cart-grid">
        <div className="cart-items">
          {orders.map((order) => (
            <div key={order.id} className="cart-item">
              <div className="cart-item-details" style={{ marginBottom: '8px' }}>
                <h3>Order #{order.id}</h3>
                <p style={{ fontSize: '0.85rem', color: '#718096' }}>
                  Placed on {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>

              {order.Products &&
                order.Products.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'center',
                      marginTop: '8px'
                    }}
                  >
                    <img
                      className="cart-item-image"
                      src={product.imageUrl || 'https://via.placeholder.com/150'}
                      alt={product.name}
                      style={{ flexShrink: 0, maxWidth: '100px' }}
                    />
                    <div>
                      <h3 style={{ marginBottom: '4px' }}>{product.name}</h3>
                      <div className="cart-item-price">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(product.OrderItem.unitPrice)}
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#718096' }}>
                        Quantity: {product.OrderItem.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              <div className="order-summary" style={{ marginTop: '8px' }}>
                <div className="summary-total">
                  <span className="summary-total-label">Order Total:</span>
                  <span className="summary-total-amount">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD'
                    }).format(order.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;


