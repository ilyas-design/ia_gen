const request = require('supertest');
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');

// Mock database setup for testing
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false
});

// Define models for tests
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
      allowNull: false
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false
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
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    }
  },
  {
    tableName: 'cart_items',
    timestamps: true
  }
);

Product.hasMany(CartItem, { foreignKey: 'productId' });
CartItem.belongsTo(Product, { foreignKey: 'productId' });

// Create test app
const app = express();
app.use(express.json());

// Define routes for testing
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
    res.status(500).json({ message: 'Failed to add item to cart' });
  }
});

app.get('/api/cart', async (req, res) => {
  try {
    const items = await CartItem.findAll({ include: Product });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch cart' });
  }
});

// Test suite
describe('Cart API Tests', () => {
  let testProduct;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await CartItem.destroy({ where: {}, truncate: true });
    await Product.destroy({ where: {}, truncate: true });
    
    // Create a test product
    testProduct = await Product.create({
      name: 'Test Product',
      description: 'Test Description',
      price: 29.99,
      stock: 10
    });
  });

  describe('POST /api/cart/add', () => {
    test('should add a product to cart', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .send({
          productId: testProduct.id,
          quantity: 2
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('productId', testProduct.id);
      expect(response.body).toHaveProperty('quantity', 2);
    });

    test('should increment quantity if product already in cart', async () => {
      // Add product first time
      await request(app)
        .post('/api/cart/add')
        .send({
          productId: testProduct.id,
          quantity: 1
        });

      // Add same product again
      const response = await request(app)
        .post('/api/cart/add')
        .send({
          productId: testProduct.id,
          quantity: 2
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('quantity', 3);
    });

    test('should return 400 for invalid cart payload', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .send({
          quantity: 1
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid cart payload');
    });

    test('should return 400 for negative quantity', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .send({
          productId: testProduct.id,
          quantity: -1
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid cart payload');
    });

    test('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .send({
          productId: 9999,
          quantity: 1
        });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Product not found');
    });
  });

  describe('GET /api/cart', () => {
    test('should return empty array when cart is empty', async () => {
      const response = await request(app).get('/api/cart');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('should return all cart items', async () => {
      // Add items to cart
      await request(app)
        .post('/api/cart/add')
        .send({
          productId: testProduct.id,
          quantity: 2
        });

      const response = await request(app).get('/api/cart');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(1);
      expect(response.body[0]).toHaveProperty('productId', testProduct.id);
      expect(response.body[0]).toHaveProperty('quantity', 2);
      expect(response.body[0]).toHaveProperty('Product');
    });
  });
});

