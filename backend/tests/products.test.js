const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Test database path
const TEST_DB_PATH = path.join(__dirname, 'test-database.json');

// Simple test database class (matching server.js structure)
class TestDatabase {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = { products: [], users: [], cartItems: [], orders: [], orderItems: [], comments: [] };
  }

  save() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
  }

  getAllProducts() {
    return this.data.products;
  }

  getProductById(id) {
    return this.data.products.find(p => p.id === id);
  }

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

  clear() {
    this.data = { products: [], users: [], cartItems: [], orders: [], orderItems: [], comments: [] };
    this.save();
  }
}

// Create test app
const app = express();
app.use(express.json());

const db = new TestDatabase(TEST_DB_PATH);

// Define routes for testing
app.get('/api/products', async (req, res) => {
  try {
    const products = db.getAllProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = db.getProductById(req.params.id);
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
    if (!name || !description || typeof price !== 'number' || typeof stock !== 'number') {
      return res.status(400).json({ message: 'Invalid product payload' });
    }
    if (price < 0) {
      return res.status(400).json({ message: 'Price cannot be negative' });
    }
    const product = db.createProduct({ name, description, price, stock });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create product' });
  }
});

// Test suite
describe('Product API Tests', () => {
  beforeAll(() => {
    db.clear();
  });

  afterAll(() => {
    // Clean up test database file
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  beforeEach(() => {
    db.clear();
  });

  describe('GET /api/products', () => {
    test('should return empty array when no products exist', async () => {
      const response = await request(app).get('/api/products');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('should return all products', async () => {
      // Create test products
      db.createProduct({
        name: 'Test Product 1',
        description: 'Description 1',
        price: 29.99,
        stock: 10
      });
      db.createProduct({
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
      const product = db.createProduct({
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
      const response = await request(app).get('/api/products/non-existent-id');
      
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
      
      expect(response.status).toBe(400);
    });
  });
});
