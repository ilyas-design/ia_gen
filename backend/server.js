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

app.post('/api/cart/add', async (req, res) => {
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

app.get('/api/cart', async (req, res) => {
  try {
    const items = await CartItem.findAll({ include: Product });
    res.json(items);
  } catch (error) {
    console.error('Failed to fetch cart', error);
    res.status(500).json({ message: 'Failed to fetch cart' });
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

async function initializeDatabase() {
  await sequelize.sync();

  const count = await Product.count();
  if (count === 0) {
    const products = [
      {
        name: 'Starter Tee',
        description: 'Soft cotton t-shirt for everyday wear.',
        price: 19.99,
        stock: 50
      },
      {
        name: 'Commuter Backpack',
        description: 'Durable backpack with padded laptop sleeve.',
        price: 79.99,
        stock: 20
      },
      {
        name: 'Classic Sneakers',
        description: 'Comfortable and stylish sneakers for all occasions.',
        price: 89.99,
        stock: 30
      },
      {
        name: 'Wireless Headphones',
        description: 'Premium sound quality with noise cancellation.',
        price: 149.99,
        stock: 15
      },
      {
        name: 'Smart Watch',
        description: 'Track your fitness and stay connected on the go.',
        price: 199.99,
        stock: 25
      },
      {
        name: 'Leather Wallet',
        description: 'Sleek and durable leather wallet with RFID protection.',
        price: 49.99,
        stock: 40
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

