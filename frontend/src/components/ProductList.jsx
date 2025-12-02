import { useEffect, useState } from 'react';
import { CircularProgress, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useCart } from '../contexts/CartContext';
import './ProductList.css';

const FAKE_STORE_API = 'https://fakestoreapi.com/products';
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/400x300?text=No+Image+Available';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  const { addToCart } = useCart();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchProducts = async () => {
      try {
        const response = await fetch(FAKE_STORE_API);
        if (!response.ok) {
          throw new Error('Unable to load products.');
        }
        const data = await response.json();
        if (isMounted) {
          // Map Fake Store API data to our format
          const mappedProducts = data.map((product) => ({
            id: product.id,
            name: product.title,
            description: product.description,
            price: product.price,
            imageUrl: product.image,
            category: product.category,
            rating: product.rating?.rate || 0,
            reviewCount: product.rating?.count || 0,
            stock: 100 // Fake Store API doesn't provide stock, so we set a default
          }));
          setProducts(mappedProducts);
          setFilteredProducts(mappedProducts);
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
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const handleCardClick = (productId) => {
    console.log('Product clicked:', productId);
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
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
              const rating = product.rating || 0;
              const reviewCount = product.reviewCount || 0;
              const inStock = product.stock > 0;

              return (
                <div key={product.id} className="product-card" onClick={() => handleCardClick(product.id)}>
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
    </div>
  );
};

export default ProductList;
