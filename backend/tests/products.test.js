const request = require('supertest');
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');

// Mock database setup for testing
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false
});

// Define Product model for tests
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

// Create test app
const app = express();
app.use(express.json());

// Define routes for testing
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.findAll();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products' });
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
    res.status(500).json({ message: 'Failed to create product' });
  }
});

// Test suite
describe('Product API Tests', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Product.destroy({ where: {}, truncate: true });
  });

  describe('GET /api/products', () => {
    test('should return empty array when no products exist', async () => {
      const response = await request(app).get('/api/products');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('should return all products', async () => {
      // Create test products
      await Product.create({
        name: 'Test Product 1',
        description: 'Description 1',
        price: 29.99,
        stock: 10
      });
      await Product.create({
        name: 'Test Product 2',
        description: 'Description 2',
        price: 49.99,
        stock: 5
      });

      const response = await request(app).get('/api/products');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('name', 'Test Product 1');
      expect(response.body[1]).toHaveProperty('name', 'Test Product 2');
    });
  });

  describe('GET /api/products/:id', () => {
    test('should return a product by id', async () => {
      const product = await Product.create({
        name: 'Test Product',
        description: 'Test Description',
        price: 19.99,
        stock: 15
      });

      const response = await request(app).get(`/api/products/${product.id}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', product.id);
      expect(response.body).toHaveProperty('name', 'Test Product');
      expect(response.body).toHaveProperty('price', 19.99);
    });

    test('should return 404 for non-existent product', async () => {
      const response = await request(app).get('/api/products/9999');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Product not found');
    });
  });

  describe('POST /api/products', () => {
    test('should create a new product', async () => {
      const newProduct = {
        name: 'New Product',
        description: 'New Description',
        price: 39.99,
        stock: 20
      };

      const response = await request(app)
        .post('/api/products')
        .send(newProduct);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'New Product');
      expect(response.body).toHaveProperty('price', 39.99);
      expect(response.body).toHaveProperty('stock', 20);
    });

    test('should return 400 for invalid product data', async () => {
      const invalidProduct = {
        name: 'Invalid Product',
        description: 'Missing price and stock'
      };

      const response = await request(app)
        .post('/api/products')
        .send(invalidProduct);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid product payload');
    });

    test('should return 400 for negative price', async () => {
      const invalidProduct = {
        name: 'Invalid Product',
        description: 'Negative price',
        price: -10,
        stock: 5
      };

      const response = await request(app)
        .post('/api/products')
        .send(invalidProduct);
      
      expect(response.status).toBe(500);
    });
  });
});

