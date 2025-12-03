import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CircularProgress,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import './ProductList.css';

// Utilise l'API de ton backend au lieu de la Fake Store API
const BACKEND_API = 'http://localhost:4000/api/products';
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/400x300?text=No+Image+Available';

const ProductList = ({ selectedCategory }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');
  const { addToCart } = useCart();
  const { isAuthenticated, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync search query from URL (?search=...) so the top search bar works
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search') || '';
    setSearchQuery(q);
  }, [location.search]);

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        const response = await fetch(BACKEND_API);
        if (!response.ok) {
          throw new Error('Unable to load products.');
        }
        const data = await response.json();
        if (isMounted) {
          // Les produits viennent directement de ton backend (id, name, description, price, stock, imageUrl)
          setProducts(data);
          setFilteredProducts(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to fetch products.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let base = products;

    // Filtre par catégorie si une catégorie est sélectionnée (et différente de "All")
    if (selectedCategory && selectedCategory !== 'All') {
      base = base.filter(
        (product) =>
          product.category &&
          product.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filtre par recherche texte
    if (searchQuery.trim() === '') {
      setFilteredProducts(base);
    } else {
      const filtered = base.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products, selectedCategory]);

  const fetchComments = async (productId) => {
    setCommentsLoading(true);
    setCommentError('');
    try {
      const response = await fetch(`http://localhost:4000/api/products/${productId}/comments`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to load comments.');
      }
      setComments(data);
    } catch (err) {
      setCommentError(err.message || 'Failed to load comments.');
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleCardClick = (product) => {
    setSelectedProduct(product);
    setDetailOpen(true);
    fetchComments(product.id);
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();

    // Si l'utilisateur n'est pas connecté, on le redirige vers la page de connexion
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }

    addToCart(product, 1);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <CircularProgress size={60} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div style={{ padding: '16px', backgroundColor: '#fed7d7', color: '#c53030', borderRadius: '8px' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="product-list-container">
      <div className="product-list-wrapper">
        {isMobile && (
          <div className="search-container">
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
              sx={{
                backgroundColor: 'white',
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  boxShadow: 1
                }
              }}
            />
          </div>
        )}

        <div className="results-count">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
        </div>

        {filteredProducts.length === 0 ? (
          <div className="no-results">
            <h3>No products found</h3>
            <p>Try adjusting your search terms</p>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => {
              // Si ton backend ne renvoie pas encore rating / reviewCount, on met des valeurs par défaut
              const rating = product.rating || 0;
              const reviewCount = product.reviewCount || 0;
              const inStock = product.stock > 0;

              return (
                <div key={product.id} className="product-card" onClick={() => handleCardClick(product)}>
                  <div className="product-image-container">
                    <img
                      className="product-image"
                      src={product.imageUrl || PLACEHOLDER_IMAGE}
                      alt={product.name}
                    />
                    {!inStock && (
                      <span className="out-of-stock-badge">Out of Stock</span>
                    )}
                  </div>
                  
                  <div className="product-content">
                    <div>
                      <h3 className="product-title">{product.name}</h3>

                      <div className="product-rating">
                        <span className="rating-stars">{'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}</span>
                        <span className="rating-count">({reviewCount})</span>
                      </div>

                      <div className="product-price">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                          minimumFractionDigits: 2
                        }).format(product.price)}
                      </div>

                      {product.category && (
                        <span className="category-badge">{product.category}</span>
                      )}
                    </div>
                  </div>

                  <div className="product-actions">
                    <button
                      className="add-to-cart-btn"
                      onClick={(e) => handleAddToCart(e, product)}
                      disabled={!inStock}
                    >
                      {inStock ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Product detail modal */}
      {selectedProduct && (
        <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>{selectedProduct.name}</DialogTitle>
          <DialogContent dividers>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: '0 0 260px' }}>
                <img
                  src={selectedProduct.imageUrl || PLACEHOLDER_IMAGE}
                  alt={selectedProduct.name}
                  style={{ width: '100%', borderRadius: '8px' }}
                />
              </div>
              <div style={{ flex: '1 1 200px' }}>
                <p style={{ marginBottom: '8px' }}>{selectedProduct.description}</p>
                <p style={{ fontWeight: 600, marginBottom: '4px' }}>
                  Price:{' '}
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(selectedProduct.price)}
                </p>
                {selectedProduct.category && (
                  <p style={{ fontSize: '0.9rem', color: '#4a5568', marginBottom: '4px' }}>
                    Category: {selectedProduct.category}
                  </p>
                )}
                <p style={{ fontSize: '0.9rem', color: '#4a5568' }}>
                  Stock: {selectedProduct.stock}
                </p>
              </div>
            </div>

            <div style={{ marginTop: '24px' }}>
              <h3 style={{ marginBottom: '8px' }}>Comments</h3>
              {commentsLoading ? (
                <div>Loading comments...</div>
              ) : comments.length === 0 ? (
                <p style={{ fontSize: '0.9rem', color: '#718096' }}>No comments yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        backgroundColor: '#f7fafc'
                      }}
                    >
                      <div style={{ fontSize: '0.85rem', color: '#4a5568', marginBottom: '4px' }}>
                        {comment.User?.name || comment.User?.email || 'User'}{' '}
                        {comment.rating ? `• ${'★'.repeat(comment.rating)}${'☆'.repeat(5 - comment.rating)}` : ''}
                      </div>
                      <div style={{ fontSize: '0.9rem' }}>{comment.content}</div>
                    </div>
                  ))}
                </div>
              )}

              {isAuthenticated ? (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setCommentError('');
                    if (!commentText.trim()) {
                      setCommentError('Le commentaire ne peut pas être vide.');
                      return;
                    }
                    try {
                      const response = await fetch(
                        `http://localhost:4000/api/products/${selectedProduct.id}/comments`,
                        {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                          },
                          body: JSON.stringify({ content: commentText })
                        }
                      );
                      const data = await response.json();
                      if (!response.ok) {
                        throw new Error(data.message || 'Failed to add comment.');
                      }
                      setComments((prev) => [data, ...prev]);
                      setCommentText('');
                    } catch (err) {
                      setCommentError(err.message || 'Failed to add comment.');
                    }
                  }}
                  style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}
                >
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    label="Votre commentaire"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />
                  {commentError && (
                    <div style={{ color: '#c53030', fontSize: '0.85rem' }}>{commentError}</div>
                  )}
                  <Button type="submit" variant="contained" sx={{ alignSelf: 'flex-end' }}>
                    Envoyer
                  </Button>
                </form>
              ) : (
                <p style={{ marginTop: '16px', fontSize: '0.9rem', color: '#718096' }}>
                  Connectez-vous pour laisser un commentaire.
                </p>
              )}
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailOpen(false)}>Fermer</Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
};

export default ProductList;
