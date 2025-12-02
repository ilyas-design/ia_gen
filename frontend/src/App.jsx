import './App.css';
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Badge,
  Box,
  Button,
  Container,
  CssBaseline,
  IconButton,
  TextField,
  Toolbar,
  Typography,
  InputAdornment,
  Divider,
  Drawer,
  useMediaQuery,
  useTheme
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PersonIcon from '@mui/icons-material/Person';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import SettingsIcon from '@mui/icons-material/Settings';
import { Menu, MenuItem } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider, useCart } from './contexts/CartContext';
import ProductList from './components/ProductList.jsx';
import SignIn from './components/SignIn.jsx';
import SignUp from './components/SignUp.jsx';
import Cart from './components/Cart.jsx';
import Footer from './components/Footer.jsx';
import Checkout from './components/Checkout.jsx';
import OrderHistory from './components/OrderHistory.jsx';
import Settings from './components/Settings.jsx';

const SearchBar = ({ mobile = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <Box 
      component="form" 
      onSubmit={handleSearch} 
      sx={{ 
        flexGrow: 1, 
        maxWidth: mobile ? '100%' : 600, 
        mx: mobile ? 0 : 2,
        width: mobile ? '100%' : 'auto'
      }}
    >
      <TextField
        fullWidth
        size="small"
        placeholder="Search products..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton type="submit" edge="end" size="small">
                <SearchIcon />
              </IconButton>
            </InputAdornment>
          )
        }}
        sx={{
          backgroundColor: 'white',
          borderRadius: 1,
          '& .MuiOutlinedInput-root': {
            borderRadius: 1
          }
        }}
      />
    </Box>
  );
};

const AppBarWithAuth = ({ onCategoryChange }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuAnchor, setAccountMenuAnchor] = useState(null);
  const { isAuthenticated, user, signOut } = useAuth();
  const { getCartItemCount } = useCart();
  const cartCount = getCartItemCount();
  const navigate = useNavigate();

  const handleAccountClick = (event) => {
    setAccountMenuAnchor(event.currentTarget);
  };

  const handleCloseAccountMenu = () => {
    setAccountMenuAnchor(null);
  };

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}
      >
        <Toolbar sx={{ py: 1, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
          {/* Logo */}
          <Typography
            variant={isMobile ? 'h6' : 'h5'}
            component={Link}
            to="/"
            sx={{
              textDecoration: 'none',
              color: 'white',
              fontWeight: 700,
              mr: { xs: 1, md: 2 },
              flexShrink: 0,
              '&:hover': {
                opacity: 0.9
              }
            }}
          >
            ShopHub
          </Typography>

          {/* Search Bar - Hidden on mobile in header, shown in drawer */}
          {!isMobile && <SearchBar />}

          {/* Right Side Actions */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: { xs: 0.5, sm: 1 },
            ml: 'auto',
            flexShrink: 0
          }}>
            {isAuthenticated ? (
              <>
                {!isSmallMobile && (
                  <>
                    <Button
                      color="inherit"
                      startIcon={<PersonIcon />}
                      onClick={handleAccountClick}
                      sx={{
                        textTransform: 'none',
                        display: { xs: 'none', sm: 'flex' },
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)'
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', mr: 1 }}>
                        <Typography variant="caption" sx={{ lineHeight: 1, fontSize: '0.7rem' }}>
                          Bonjour, {user?.name || 'Utilisateur'}
                        </Typography>
                      </Box>
                    </Button>
                    <Divider 
                      orientation="vertical" 
                      flexItem 
                      sx={{ 
                        borderColor: 'rgba(255,255,255,0.2)', 
                        mx: { xs: 0.5, sm: 1 },
                        display: { xs: 'none', sm: 'block' }
                      }} 
                    />
                  </>
                )}
                <Button
                  color="inherit"
                  onClick={signOut}
                  sx={{
                    textTransform: 'none',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  {isSmallMobile ? 'Out' : 'Sign Out'}
                </Button>
              </>
            ) : (
              <Button
                color="inherit"
                component={Link}
                to="/signin"
                sx={{
                  textTransform: 'none',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                {isSmallMobile ? 'Sign In' : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Typography variant="caption" sx={{ lineHeight: 1, fontSize: '0.7rem' }}>
                      Hello, Sign in
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, lineHeight: 1, fontSize: '0.7rem' }}>
                      Account
                    </Typography>
                  </Box>
                )}
              </Button>
            )}

            {/* My Orders button (only when authenticated) */}
            {isAuthenticated && (
              <Button
                color="inherit"
                component={Link}
                to="/orders"
                startIcon={<ReceiptLongIcon />}
                sx={{
                  textTransform: 'none',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  display: { xs: 'none', sm: 'flex' },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                My Orders
              </Button>
            )}

            {/* Cart Icon */}
            <IconButton
              color="inherit"
              component={Link}
              to="/cart"
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <Badge badgeContent={cartCount} color="warning">
                <ShoppingCartIcon />
              </Badge>
              {!isSmallMobile && (
                <Typography variant="body2" sx={{ ml: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>
                  Cart
                </Typography>
              )}
            </IconButton>

            {/* Mobile Menu Button */}
            {isMobile && (
              <IconButton
                color="inherit"
                onClick={() => setMobileMenuOpen(true)}
                sx={{ ml: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>

        {/* Mobile Search Bar */}
        {isMobile && (
          <Box sx={{ px: 2, pb: 1, width: '100%' }}>
            <SearchBar mobile />
          </Box>
        )}
      </AppBar>

      {/* Account Menu */}
      <Menu
        anchorEl={accountMenuAnchor}
        open={Boolean(accountMenuAnchor)}
        onClose={handleCloseAccountMenu}
      >
        <MenuItem
          onClick={() => {
            handleCloseAccountMenu();
            navigate('/settings');
          }}
        >
          <SettingsIcon fontSize="small" style={{ marginRight: 8 }} /> Settings
        </MenuItem>
      </Menu>

      {/* Mobile Menu Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      >
        <Box sx={{ width: 250, p: 2 }}>
          {isAuthenticated ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                {user?.name || user?.email}
              </Typography>
              <Button fullWidth onClick={signOut} sx={{ mt: 2 }}>
                Sign Out
              </Button>
            </Box>
          ) : (
            <Box>
              <Button fullWidth component={Link} to="/signin" sx={{ mb: 1 }}>
                Sign In
              </Button>
              <Button fullWidth component={Link} to="/signup" variant="outlined">
                Sign Up
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>

      {/* Secondary Navigation Bar */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
          py: 0.5,
          px: { xs: 1, sm: 2 },
          overflowX: 'auto',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          '&::-webkit-scrollbar': {
            display: 'none'
          },
          scrollbarWidth: 'none'
        }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 0, sm: 2 } }}>
          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 1, sm: 2 }, 
            alignItems: 'center',
            minWidth: 'max-content'
          }}>
            <Button
              component={Link}
              to="/"
              color="inherit"
              sx={{
                textTransform: 'none',
                color: 'white',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                whiteSpace: 'nowrap',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
              onClick={() => onCategoryChange && onCategoryChange('All')}
            >
              All
            </Button>
            <Button
              color="inherit"
              sx={{
                textTransform: 'none',
                color: 'white',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                whiteSpace: 'nowrap',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
              onClick={() => onCategoryChange && onCategoryChange('Electronics')}
            >
              Electronics
            </Button>
            <Button
              color="inherit"
              sx={{
                textTransform: 'none',
                color: 'white',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                whiteSpace: 'nowrap',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
              onClick={() => onCategoryChange && onCategoryChange('Clothing')}
            >
              Clothing
            </Button>
            <Button
              color="inherit"
              sx={{
                textTransform: 'none',
                color: 'white',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                whiteSpace: 'nowrap',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
              onClick={() => onCategoryChange && onCategoryChange('Home & Kitchen')}
            >
              Home & Kitchen
            </Button>
            <Button
              color="inherit"
              sx={{
                textTransform: 'none',
                color: 'white',
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                whiteSpace: 'nowrap',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
              onClick={() => onCategoryChange && onCategoryChange('Sports')}
            >
              Sports
            </Button>
          </Box>
        </Container>
      </Box>
    </>
  );
};

const RequireAuth = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Pendant qu'on recharge le token depuis localStorage, on ne redirige pas
  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  return children;
};

const AppContent = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const location = useLocation();

  const hideLayout =
    location.pathname === '/signin' ||
    location.pathname === '/signup' ||
    location.pathname === '/checkout';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      {!hideLayout && <AppBarWithAuth onCategoryChange={setSelectedCategory} />}
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/cart"
            element={
              <RequireAuth>
                <Cart />
              </RequireAuth>
            }
          />
          <Route
            path="/checkout"
            element={
              <RequireAuth>
                <Checkout />
              </RequireAuth>
            }
          />
          <Route
            path="/orders"
            element={
              <RequireAuth>
                <OrderHistory />
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <Settings />
              </RequireAuth>
            }
          />
          <Route path="/" element={<ProductList selectedCategory={selectedCategory} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
      {!hideLayout && <Footer />}
    </Box>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <AppContent />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
