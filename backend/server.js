const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Sequelize, DataTypes } = require('sequelize');

const PORT = process.env.PORT || 4000;

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_PATH || 'database.sqlite',
  logging: false
});

const Product = sequelize.define(
  'Product',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null
    }
  },
  {
    tableName: 'products',
    timestamps: true
  }
);

const CartItem = sequelize.define(
  'CartItem',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Product,
        key: 'id'
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      }
    }
  },
  {
    tableName: 'cart_items',
    timestamps: true
  }
);

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    tableName: 'users',
    timestamps: true
  }
);

Product.hasMany(CartItem, { foreignKey: 'productId' });
CartItem.belongsTo(Product, { foreignKey: 'productId' });

// Order models
const Order = sequelize.define(
  'Order',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    totalAmount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'PAID' // since payment is simulated
    },
    paymentMethod: {
      type: DataTypes.STRING,
      allowNull: false
    },
    cardLast4: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    tableName: 'orders',
    timestamps: true
  }
);

const OrderItem = sequelize.define(
  'OrderItem',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    unitPrice: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0
      }
    }
  },
  {
    tableName: 'order_items',
    timestamps: true
  }
);

User.hasMany(Order, { foreignKey: 'userId' });
Order.belongsTo(User, { foreignKey: 'userId' });

Order.belongsToMany(Product, { through: OrderItem, foreignKey: 'orderId' });
Product.belongsToMany(Order, { through: OrderItem, foreignKey: 'productId' });

// Comments model
const Comment = sequelize.define(
  'Comment',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      }
    }
  },
  {
    tableName: 'comments',
    timestamps: true
  }
);

User.hasMany(Comment, { foreignKey: 'userId' });
Comment.belongsTo(User, { foreignKey: 'userId' });

Product.hasMany(Comment, { foreignKey: 'productId' });
Comment.belongsTo(Product, { foreignKey: 'productId' });

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const app = express();
app.use(cors());
app.use(express.json());

// Helper function to fetch random image from external API
async function fetchRandomImage() {
  try {
    // Using Picsum Photos API - free, no API key required
    const imageId = Math.floor(Math.random() * 1000) + 1;
    return `https://picsum.photos/400/300?random=${imageId}`;
  } catch (error) {
    console.error('Failed to fetch image URL:', error);
    return 'https://via.placeholder.com/400x300?text=Product+Image';
  }
}

app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (error) {
    console.error('Failed to fetch products', error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({ 
      message: 'Failed to fetch products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Failed to fetch product', error);
    res.status(500).json({ message: 'Failed to fetch product' });
  }
});

// Product comments
app.get('/api/products/:id/comments', async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const comments = await Comment.findAll({
      where: { productId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json(comments);
  } catch (error) {
    console.error('Failed to fetch comments', error);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
});

app.post('/api/products/:id/comments', authenticateToken, async (req, res) => {
  try {
    const productId = req.params.id;
    const { content, rating } = req.body;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ message: 'Comment content is required' });
    }

    let parsedRating = rating;
    if (parsedRating !== undefined && parsedRating !== null) {
      parsedRating = Number(parsedRating);
      if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }
    } else {
      parsedRating = null;
    }

    const comment = await Comment.create({
      content: content.trim(),
      rating: parsedRating,
      productId,
      userId: req.user.userId
    });

    const createdComment = await Comment.findByPk(comment.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json(createdComment);
  } catch (error) {
    console.error('Failed to create comment', error);
    res.status(500).json({ message: 'Failed to create comment' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, description, price, stock } = req.body;
    if (
      !name ||
      !description ||
      typeof price !== 'number' ||
      typeof stock !== 'number'
    ) {
      return res.status(400).json({ message: 'Invalid product payload' });
    }
    const product = await Product.create({ name, description, price, stock });
    res.status(201).json(product);
  } catch (error) {
    console.error('Failed to create product', error);
    res.status(500).json({ message: 'Failed to create product' });
  }
});

app.post('/api/cart/add', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId || quantity <= 0) {
      return res.status(400).json({ message: 'Invalid cart payload' });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const [cartItem, created] = await CartItem.findOrCreate({
      where: { productId },
      defaults: { quantity }
    });

    if (!created) {
      cartItem.quantity += quantity;
      await cartItem.save();
    }

    await cartItem.reload({ include: Product });
    res.status(201).json(cartItem);
  } catch (error) {
    console.error('Failed to add item to cart', error);
    res.status(500).json({ message: 'Failed to add item to cart' });
  }
});

app.get('/api/cart', authenticateToken, async (req, res) => {
  try {
    const items = await CartItem.findAll({ include: Product });
    res.json(items);
  } catch (error) {
    console.error('Failed to fetch cart', error);
    res.status(500).json({ message: 'Failed to fetch cart' });
  }
});

// Orders / Checkout routes
app.post('/api/orders/checkout', authenticateToken, async (req, res) => {
  try {
    const { items, paymentMethod, cardNumber, cardHolder, expiry, cvv } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    if (!paymentMethod || !cardNumber || !cardHolder || !expiry || !cvv) {
      return res.status(400).json({ message: 'Payment information is incomplete' });
    }

    // Basic fake validation for payment fields
    const digitsOnlyCard = String(cardNumber).replace(/\D/g, '');
    const digitsOnlyCvv = String(cvv).replace(/\D/g, '');
    const expiryPattern = /^(0[1-9]|1[0-2])\/\d{2}$/;

    if (digitsOnlyCard.length !== 16) {
      return res.status(400).json({ message: 'Invalid card number. It must contain 16 digits.' });
    }

    if (digitsOnlyCvv.length !== 3) {
      return res.status(400).json({ message: 'Invalid CVC. It must contain 3 digits.' });
    }

    if (!expiryPattern.test(expiry)) {
      return res.status(400).json({ message: 'Invalid expiry date. Use format MM/YY.' });
    }

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Validate products, stock and compute total
    let totalAmount = 0;
    const orderItemsPayload = [];
    const stockUpdates = [];

    for (const item of items) {
      const product = await Product.findByPk(item.productId);
      if (!product) {
        return res.status(400).json({ message: `Product with id ${item.productId} not found` });
      }

      const quantity = item.quantity || 1;

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

      stockUpdates.push({ product, quantity });
    }

    const cardLast4 = cardNumber.slice(-4);

    // Use a transaction so order, items and stock updates are consistent
    const result = await sequelize.transaction(async (t) => {
      // Create order first
      const order = await Order.create(
        {
          userId: req.user.userId,
          totalAmount,
          status: 'PAID',
          paymentMethod,
          cardLast4
        },
        { transaction: t }
      );

      // Then create order items linked to this order
      const orderItemsWithOrderId = orderItemsPayload.map((item) => ({
        ...item,
        orderId: order.id
      }));

      await OrderItem.bulkCreate(orderItemsWithOrderId, { transaction: t });

      // Decrement stock for each product
      for (const { product, quantity } of stockUpdates) {
        await product.decrement('stock', { by: quantity, transaction: t });
      }

      const createdOrder = await Order.findByPk(order.id, {
        transaction: t,
        include: [
          {
            model: Product,
            through: {
              attributes: ['quantity', 'unitPrice']
            }
          }
        ]
      });

      return createdOrder;
    });

    res.status(201).json({
      message: 'Order created successfully (payment simulated)',
      order: result
    });
  } catch (error) {
    console.error('Failed to create order', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

app.get('/api/orders/my', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.userId },
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Product,
          through: {
            attributes: ['quantity', 'unitPrice']
          }
        }
      ]
    });

    res.json(orders);
  } catch (error) {
    console.error('Failed to fetch orders', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      name: name || null
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
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

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
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

// Protected route example (get current user)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: { exclude: ['password'] }
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Failed to fetch user', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Update current user profile
app.put('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ message: 'Email is required' });
    }

    const existingUser = await User.findOne({
      where: { email },
      attributes: ['id']
    });

    if (existingUser && existingUser.id !== req.user.userId) {
      return res.status(400).json({ message: 'Email is already in use by another account' });
    }

    const user = await User.findByPk(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name || null;
    user.email = email;
    await user.save();

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name
    };

    res.json({
      message: 'Profile updated successfully',
      user: safeUser
    });
  } catch (error) {
    console.error('Failed to update user', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

async function initializeDatabase() {
  await sequelize.sync();

  const count = await Product.count();
  if (count === 0) {
    const products = [
      {
        name: 'Starter Tee',
        description: 'Soft cotton t-shirt for everyday wear.',
        price: 19.99,
        stock: 50,
        category: 'Clothing'
      },
      {
        name: 'Commuter Backpack',
        description: 'Durable backpack with padded laptop sleeve.',
        price: 79.99,
        stock: 20,
        category: 'Accessories'
      },
      {
        name: 'Classic Sneakers',
        description: 'Comfortable and stylish sneakers for all occasions.',
        price: 89.99,
        stock: 30,
        category: 'Clothing'
      },
      {
        name: 'Wireless Headphones',
        description: 'Premium sound quality with noise cancellation.',
        price: 149.99,
        stock: 15,
        category: 'Electronics'
      },
      {
        name: 'Smart Watch',
        description: 'Track your fitness and stay connected on the go.',
        price: 199.99,
        stock: 25,
        category: 'Electronics'
      },
      {
        name: 'Leather Wallet',
        description: 'Sleek and durable leather wallet with RFID protection.',
        price: 49.99,
        stock: 40,
        category: 'Accessories'
      },
      {
        name: 'Gaming Mouse',
        description: 'High precision wireless gaming mouse with RGB lighting.',
        price: 59.99,
        stock: 35,
        category: 'Electronics'
      },
      {
        name: 'Office Chair',
        description: 'Ergonomic chair with lumbar support for long work sessions.',
        price: 229.99,
        stock: 12,
        category: 'Home & Kitchen'
      },
      {
        name: 'Stainless Steel Water Bottle',
        description: 'Insulated bottle keeps drinks cold for 24h, hot for 12h.',
        price: 24.99,
        stock: 80,
        category: 'Sports'
      },
      {
        name: 'Yoga Mat',
        description: 'Non-slip yoga mat with extra cushioning for comfort.',
        price: 39.99,
        stock: 60,
        category: 'Sports'
      },
      {
        name: 'Noise-Cancelling Earbuds',
        description: 'Compact earbuds with active noise cancellation and mic.',
        price: 129.99,
        stock: 40,
        category: 'Electronics'
      },
      {
        name: 'Denim Jacket',
        description: 'Classic denim jacket with modern slim fit.',
        price: 69.99,
        stock: 22,
        category: 'Clothing'
      },
      {
        name: 'Ceramic Coffee Mug Set',
        description: 'Set of 4 large ceramic mugs, dishwasher safe.',
        price: 34.99,
        stock: 55,
        category: 'Home & Kitchen'
      },
      {
        name: 'Bluetooth Speaker',
        description: 'Portable Bluetooth speaker with deep bass and 12h battery.',
        price: 89.99,
        stock: 28,
        category: 'Electronics'
      },
      {
        name: 'Running Shorts',
        description: 'Lightweight running shorts with breathable fabric.',
        price: 29.99,
        stock: 70,
        category: 'Clothing'
      }
    ];

    // Fetch images from external API for each product
    const productsWithImages = await Promise.all(
      products.map(async (product) => ({
        ...product,
        imageUrl: await fetchRandomImage()
      }))
    );

    await Product.bulkCreate(productsWithImages);
    console.log('Products seeded with images from external API');
  }
}

async function start() {
  try {
    await initializeDatabase();
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

module.exports = { app, sequelize, Product, CartItem, User };

