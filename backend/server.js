// Backend server for e-commerce application
// Handles authentication, products, cart, orders, and comments

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { validateEmail, validatePassword, sanitizeString, sanitizeHTML, validateName, validateNumber, validateUUID } = require('./utils/security');
const { apiLimiter, authLimiter, commentLimiter } = require('./middleware/rateLimiter');

// Server configuration
const PORT = process.env.PORT || 4000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'database.json');

// Security: Enforce JWT_SECRET in production, warn in development
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: JWT_SECRET environment variable is required in production!');
    process.exit(1);
  } else {
    console.warn('WARNING: JWT_SECRET not set, using default. This is UNSAFE for production!');
    const defaultSecret = 'your-secret-key-change-in-production-DEV-ONLY';
    module.exports.JWT_SECRET = defaultSecret;
  }
} else {
  if (JWT_SECRET.length < 32) {
    console.warn('WARNING: JWT_SECRET should be at least 32 characters long for security!');
  }
  module.exports.JWT_SECRET = JWT_SECRET;
}

// Simple JSON file-based database class
// Stores data in a JSON file (products, users, cart items, orders, comments)
class Database {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = this.load(); // Load data from file on initialization
  }

  // Load database from JSON file, return empty structure if file doesn't exist
  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('Error loading database:', error);
    }
    // Return empty database structure if file doesn't exist
    return {
      products: [],
      users: [],
      cartItems: [],
      orders: [],
      orderItems: [],
      comments: []
    };
  }

  // Save current data to JSON file
  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving database:', error);
    }
  }

  // Product operations
  getAllProducts() {
    return this.data.products;
  }

  getProductById(id) {
    return this.data.products.find(p => p.id === id);
  }

  // Create new product with unique ID and timestamps
  createProduct(product) {
    const newProduct = {
      id: uuidv4(),
      ...product,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.products.push(newProduct);
    this.save();
    return newProduct;
  }

  // Update existing product by ID
  updateProduct(id, updates) {
    const index = this.data.products.findIndex(p => p.id === id);
    if (index === -1) return null;
    this.data.products[index] = {
      ...this.data.products[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.products[index];
  }

  // User operations
  getUserByEmail(email) {
    return this.data.users.find(u => u.email === email);
  }

  getUserById(id) {
    return this.data.users.find(u => u.id === id);
  }

  // Create new user with unique ID and timestamps
  createUser(user) {
    const newUser = {
      id: uuidv4(),
      ...user,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.save();
    return newUser;
  }

  // Update existing user by ID
  updateUser(id, updates) {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    this.data.users[index] = {
      ...this.data.users[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.users[index];
  }

  // Cart operations
  // Get all cart items with product details
  getCartItems() {
    return this.data.cartItems.map(item => ({
      ...item,
      Product: this.getProductById(item.productId)
    }));
  }

  getCartItemByProductId(productId) {
    return this.data.cartItems.find(c => c.productId === productId);
  }

  // Add item to cart, increment quantity if item already exists
  addCartItem(item) {
    const existing = this.getCartItemByProductId(item.productId);
    if (existing) {
      existing.quantity += item.quantity || 1;
      existing.updatedAt = new Date().toISOString();
      this.save();
      return { ...existing, Product: this.getProductById(existing.productId) };
    }
    // Create new cart item if product not in cart
    const newItem = {
      id: uuidv4(),
      productId: item.productId,
      quantity: item.quantity || 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.cartItems.push(newItem);
    this.save();
    return { ...newItem, Product: this.getProductById(newItem.productId) };
  }

  // Remove all items from cart
  clearCart() {
    this.data.cartItems = [];
    this.save();
  }

  // Order operations
  // Create new order with unique ID and timestamps
  createOrder(order) {
    const newOrder = {
      id: uuidv4(),
      ...order,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.orders.push(newOrder);
    this.save();
    return newOrder;
  }

  // Get all orders for a user, sorted by date (newest first), with product details
  getOrdersByUserId(userId) {
    return this.data.orders
      .filter(o => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(order => ({
        ...order,
        Products: this.data.orderItems
          .filter(oi => oi.orderId === order.id)
          .map(oi => ({
            ...this.getProductById(oi.productId),
            OrderItem: { quantity: oi.quantity, unitPrice: oi.unitPrice }
          }))
      }));
  }

  // Create order item (product in an order)
  createOrderItem(item) {
    const newItem = {
      id: uuidv4(),
      ...item,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.orderItems.push(newItem);
    this.save();
    return newItem;
  }

  // Comment operations
  // Get all comments for a product, sorted by date (newest first), with user info
  getCommentsByProductId(productId) {
    return this.data.comments
      .filter(c => c.productId === productId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(comment => ({
        ...comment,
        User: (() => {
          const user = this.getUserById(comment.userId);
          return user ? { id: user.id, name: user.name, email: user.email } : null;
        })()
      }));
  }

  // Create new comment with unique ID and timestamps
  createComment(comment) {
    const newComment = {
      id: uuidv4(),
      ...comment,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.comments.push(newComment);
    this.save();
    return newComment;
  }
}

// Initialize database instance
const db = new Database(DB_PATH);

// Middleware to verify JWT token from Authorization header
// Adds user info to request if token is valid
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, module.exports.JWT_SECRET || JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user; // Attach user info to request
    next();
  });
};

// Initialize Express app
const app = express();

// Security: Helmet.js for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "https:", "data:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow external images
}));

// CORS configuration - restrict to specific origins in production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:5173'])
    : ['http://localhost:5173', 'http://localhost:3000'], // Development origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply general rate limiting to all API routes
app.use('/api', apiLimiter);

// Helper function to generate random product image URL
function fetchRandomImage() {
  const imageId = Math.floor(Math.random() * 1000) + 1;
  return `https://picsum.photos/400/300?random=${imageId}`;
}

// ========== PRODUCT ROUTES ==========

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = db.getAllProducts();
    res.json(products);
  } catch (error) {
    console.error('Failed to fetch products', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// Get single product by ID (with UUID validation)
app.get('/api/products/:id', async (req, res) => {
  try {
    const uuidValidation = validateUUID(req.params.id);
    if (!uuidValidation.valid) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }
    
    const product = db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Failed to fetch product', error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

// Create new product (with input validation and sanitization)
app.post('/api/products', async (req, res) => {
  try {
    const { name, description, price, stock } = req.body;
    
    // Validate and sanitize name
    const nameSanitized = sanitizeString(name, 200);
    if (!nameSanitized || nameSanitized.length < 2) {
      return res.status(400).json({ message: 'Product name is required and must be at least 2 characters' });
    }
    
    // Validate and sanitize description
    const descSanitized = sanitizeString(description, 2000);
    if (!descSanitized || descSanitized.length < 10) {
      return res.status(400).json({ message: 'Product description is required and must be at least 10 characters' });
    }
    
    // Validate price
    const priceValidation = validateNumber(price, 0.01, 999999.99);
    if (!priceValidation.valid) {
      return res.status(400).json({ message: priceValidation.error });
    }
    
    // Validate stock
    const stockValidation = validateNumber(stock, 0, 999999);
    if (!stockValidation.valid) {
      return res.status(400).json({ message: stockValidation.error });
    }
    
    const product = db.createProduct({ 
      name: nameSanitized, 
      description: descSanitized, 
      price: priceValidation.value, 
      stock: Math.floor(stockValidation.value) 
    });
    res.status(201).json(product);
  } catch (error) {
    console.error('Failed to create product', error);
    res.status(500).json({ message: 'Failed to create product' });
  }
});

// Get all comments for a product (with UUID validation)
app.get('/api/products/:id/comments', async (req, res) => {
  try {
    const uuidValidation = validateUUID(req.params.id);
    if (!uuidValidation.valid) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }
    
    const product = db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const comments = db.getCommentsByProductId(req.params.id);
    res.json(comments);
  } catch (error) {
    console.error('Failed to fetch comments', error);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
});

// Create new comment for a product (requires authentication, with rate limiting and validation)
app.post('/api/products/:id/comments', commentLimiter, authenticateToken, async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Validate product ID
    const uuidValidation = validateUUID(productId);
    if (!uuidValidation.valid) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }
    
    const product = db.getProductById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { content, rating } = req.body;

    // Validate and sanitize comment content
    const contentSanitized = sanitizeString(content, 1000);
    if (!contentSanitized || contentSanitized.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    
    if (contentSanitized.length < 3) {
      return res.status(400).json({ message: 'Comment must be at least 3 characters long' });
    }

    // Validate rating
    let parsedRating = null;
    if (rating !== undefined && rating !== null) {
      const ratingValidation = validateNumber(rating, 1, 5);
      if (!ratingValidation.valid) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }
      parsedRating = Math.round(ratingValidation.value);
    }

    const comment = db.createComment({
      content: contentSanitized.trim(),
      rating: parsedRating,
      productId,
      userId: req.user.userId
    });

    const user = db.getUserById(req.user.userId);
    res.status(201).json({
      ...comment,
      User: user ? { id: user.id, name: user.name, email: user.email } : null
    });
  } catch (error) {
    console.error('Failed to create comment', error);
    res.status(500).json({ message: 'Failed to create comment' });
  }
});

// ========== CART ROUTES ==========

// Add item to cart (requires authentication, with validation)
app.post('/api/cart/add', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    
    // Validate product ID
    const uuidValidation = validateUUID(productId);
    if (!uuidValidation.valid) {
      return res.status(400).json({ message: 'Invalid product ID format' });
    }
    
    // Validate quantity
    const quantityValidation = validateNumber(quantity, 1, 100);
    if (!quantityValidation.valid) {
      return res.status(400).json({ message: quantityValidation.error || 'Quantity must be between 1 and 100' });
    }

    const product = db.getProductById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const cartItem = db.addCartItem({ productId, quantity: Math.floor(quantityValidation.value) });
    res.status(201).json(cartItem);
  } catch (error) {
    console.error('Failed to add item to cart', error);
    res.status(500).json({ message: 'Failed to add item to cart' });
  }
});

// Get all cart items (requires authentication)
app.get('/api/cart', authenticateToken, async (req, res) => {
  try {
    const items = db.getCartItems();
    res.json(items);
  } catch (error) {
    console.error('Failed to fetch cart', error);
    res.status(500).json({ message: 'Failed to fetch cart' });
  }
});

// ========== ORDER ROUTES ==========

// Process checkout and create order (requires authentication)
// Validates payment info, checks stock, creates order, updates stock, clears cart
app.post('/api/orders/checkout', authenticateToken, async (req, res) => {
  try {
    const { items, paymentMethod, cardNumber, cardHolder, expiry, cvv } = req.body;

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    if (items.length > 50) {
      return res.status(400).json({ message: 'Too many items in cart (max 50)' });
    }

    // Validate payment method
    if (!paymentMethod || typeof paymentMethod !== 'string') {
      return res.status(400).json({ message: 'Payment method is required' });
    }

    // Validate and sanitize card holder name
    if (!cardHolder || typeof cardHolder !== 'string') {
      return res.status(400).json({ message: 'Card holder name is required' });
    }
    const cardHolderSanitized = sanitizeString(cardHolder, 100);
    if (cardHolderSanitized.length < 2) {
      return res.status(400).json({ message: 'Card holder name must be at least 2 characters' });
    }

    // Validate card number
    if (!cardNumber || typeof cardNumber !== 'string') {
      return res.status(400).json({ message: 'Card number is required' });
    }
    const digitsOnlyCard = String(cardNumber).replace(/\D/g, '');
    if (digitsOnlyCard.length !== 16) {
      return res.status(400).json({ message: 'Invalid card number. It must contain 16 digits.' });
    }

    // Validate CVV
    if (!cvv || typeof cvv !== 'string') {
      return res.status(400).json({ message: 'CVC is required' });
    }
    const digitsOnlyCvv = String(cvv).replace(/\D/g, '');
    if (digitsOnlyCvv.length !== 3) {
      return res.status(400).json({ message: 'Invalid CVC. It must contain 3 digits.' });
    }

    // Validate expiry date
    if (!expiry || typeof expiry !== 'string') {
      return res.status(400).json({ message: 'Expiry date is required' });
    }
    const expiryPattern = /^(0[1-9]|1[0-2])\/\d{2}$/;
    if (!expiryPattern.test(expiry)) {
      return res.status(400).json({ message: 'Invalid expiry date. Use format MM/YY.' });
    }

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Validate products, stock and compute total
    let totalAmount = 0;
    const orderItemsPayload = [];

    for (const item of items) {
      // Validate item structure
      if (!item.productId || !item.quantity) {
        return res.status(400).json({ message: 'Invalid item format. productId and quantity are required.' });
      }

      // Validate product ID format
      const uuidValidation = validateUUID(item.productId);
      if (!uuidValidation.valid) {
        return res.status(400).json({ message: 'Invalid product ID format' });
      }

      const product = db.getProductById(item.productId);
      if (!product) {
        return res.status(400).json({ message: `Product with id ${item.productId} not found` });
      }

      // Validate quantity
      const quantityValidation = validateNumber(item.quantity, 1, 100);
      if (!quantityValidation.valid) {
        return res.status(400).json({ message: 'Quantity must be between 1 and 100' });
      }
      const quantity = Math.floor(quantityValidation.value);

      // Check stock availability
      if (product.stock < quantity) {
        return res.status(400).json({
          message: `Not enough stock for product "${product.name}". Requested ${quantity}, available ${product.stock}.`
        });
      }
      
      const unitPrice = product.price;
      totalAmount += unitPrice * quantity;

      orderItemsPayload.push({
        productId: product.id,
        quantity,
        unitPrice
      });
    }

    // Only store last 4 digits of card for security
    const cardLast4 = digitsOnlyCard.slice(-4);

    // Validate total amount (prevent negative or zero amounts)
    if (totalAmount <= 0 || totalAmount > 999999.99) {
      return res.status(400).json({ message: 'Invalid order total' });
    }

    // Create order
    const order = db.createOrder({
      userId: req.user.userId,
      totalAmount: Math.round(totalAmount * 100) / 100, // Round to 2 decimal places
      status: 'PAID',
      paymentMethod: sanitizeString(paymentMethod, 50),
      cardLast4
    });

    // Create order items and update stock
    for (const item of orderItemsPayload) {
      db.createOrderItem({
        orderId: order.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      });

      // Update stock
      const product = db.getProductById(item.productId);
      db.updateProduct(item.productId, { stock: product.stock - item.quantity });
    }

    // Clear cart
    db.clearCart();

    res.status(201).json({
      message: 'Order created successfully (payment simulated)',
      order: {
        ...order,
        Products: orderItemsPayload.map(item => ({
          ...db.getProductById(item.productId),
          OrderItem: { quantity: item.quantity, unitPrice: item.unitPrice }
        }))
      }
    });
  } catch (error) {
    console.error('Failed to create order', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// Get all orders for current user (requires authentication)
app.get('/api/orders/my', authenticateToken, async (req, res) => {
  try {
    const orders = db.getOrdersByUserId(req.user.userId);
    res.json(orders);
  } catch (error) {
    console.error('Failed to fetch orders', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// ========== AUTH ROUTES ==========

// User registration - hash password and create user account (with rate limiting and validation)
app.post('/api/auth/signup', authLimiter, async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ message: emailValidation.error });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ message: passwordValidation.error });
    }

    // Validate and sanitize name (optional)
    let validatedName = null;
    if (name) {
      const nameValidation = validateName(name);
      if (!nameValidation.valid) {
        return res.status(400).json({ message: nameValidation.error });
      }
      validatedName = nameValidation.name;
    }

    // Check if user already exists
    const existingUser = db.getUserByEmail(emailValidation.email);
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password with bcrypt (10 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = db.createUser({
      email: emailValidation.email,
      password: hashedPassword,
      name: validatedName
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      module.exports.JWT_SECRET || JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Failed to create user', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
});

// User login - verify password and return JWT token (with rate limiting and validation)
app.post('/api/auth/signin', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate email format
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ message: 'Password is required' });
    }

    // Find user by normalized email
    const user = db.getUserByEmail(emailValidation.email);
    if (!user) {
      // Use generic error message to prevent user enumeration
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password with bcrypt
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      // Use generic error message to prevent user enumeration
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      module.exports.JWT_SECRET || JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Sign in successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Failed to sign in', error);
    res.status(500).json({ message: 'Failed to sign in' });
  }
});

// Get current user profile (requires authentication)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = db.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  } catch (error) {
    console.error('Failed to fetch user', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Update current user profile (requires authentication, with validation)
app.put('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return res.status(400).json({ message: emailValidation.error });
    }

    // Check if email is already in use by another user
    const existingUser = db.getUserByEmail(emailValidation.email);
    if (existingUser && existingUser.id !== req.user.userId) {
      return res.status(400).json({ message: 'Email is already in use by another account' });
    }

    // Validate and sanitize name (optional)
    let validatedName = null;
    if (name) {
      const nameValidation = validateName(name);
      if (!nameValidation.valid) {
        return res.status(400).json({ message: nameValidation.error });
      }
      validatedName = nameValidation.name;
    }

    const user = db.updateUser(req.user.userId, { 
      name: validatedName, 
      email: emailValidation.email 
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Failed to update user', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// ========== DATABASE INITIALIZATION ==========

// Seed database with sample products if empty
function initializeDatabase() {
  if (db.getAllProducts().length === 0) {
    const products = [
      { name: 'Starter Tee', description: 'Soft cotton t-shirt for everyday wear.', price: 19.99, stock: 50, category: 'Clothing' },
      { name: 'Commuter Backpack', description: 'Durable backpack with padded laptop sleeve.', price: 79.99, stock: 20, category: 'Accessories' },
      { name: 'Classic Sneakers', description: 'Comfortable and stylish sneakers for all occasions.', price: 89.99, stock: 30, category: 'Clothing' },
      { name: 'Wireless Headphones', description: 'Premium sound quality with noise cancellation.', price: 149.99, stock: 15, category: 'Electronics' },
      { name: 'Smart Watch', description: 'Track your fitness and stay connected on the go.', price: 199.99, stock: 25, category: 'Electronics' },
      { name: 'Leather Wallet', description: 'Sleek and durable leather wallet with RFID protection.', price: 49.99, stock: 40, category: 'Accessories' },
      { name: 'Gaming Mouse', description: 'High precision wireless gaming mouse with RGB lighting.', price: 59.99, stock: 35, category: 'Electronics' },
      { name: 'Office Chair', description: 'Ergonomic chair with lumbar support for long work sessions.', price: 229.99, stock: 12, category: 'Home & Kitchen' },
      { name: 'Stainless Steel Water Bottle', description: 'Insulated bottle keeps drinks cold for 24h, hot for 12h.', price: 24.99, stock: 80, category: 'Sports' },
      { name: 'Yoga Mat', description: 'Non-slip yoga mat with extra cushioning for comfort.', price: 39.99, stock: 60, category: 'Sports' },
      { name: 'Noise-Cancelling Earbuds', description: 'Compact earbuds with active noise cancellation and mic.', price: 129.99, stock: 40, category: 'Electronics' },
      { name: 'Denim Jacket', description: 'Classic denim jacket with modern slim fit.', price: 69.99, stock: 22, category: 'Clothing' },
      { name: 'Ceramic Coffee Mug Set', description: 'Set of 4 large ceramic mugs, dishwasher safe.', price: 34.99, stock: 55, category: 'Home & Kitchen' },
      { name: 'Bluetooth Speaker', description: 'Portable Bluetooth speaker with deep bass and 12h battery.', price: 89.99, stock: 28, category: 'Electronics' },
      { name: 'Running Shorts', description: 'Lightweight running shorts with breathable fabric.', price: 29.99, stock: 70, category: 'Clothing' }
    ];

    products.forEach(product => {
      db.createProduct({
        ...product,
        imageUrl: fetchRandomImage()
      });
    });

    console.log('Products seeded with images');
  }
}

// Start server and initialize database
function start() {
  try {
    initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server', error);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = { app, db };
