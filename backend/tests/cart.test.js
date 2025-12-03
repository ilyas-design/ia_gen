const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Test database path
const TEST_DB_PATH = path.join(__dirname, 'test-cart-database.json');

// Simple test database class
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

  getCartItems() {
    return this.data.cartItems.map(item => ({
      ...item,
      Product: this.getProductById(item.productId)
    }));
  }

  getCartItemByProductId(productId) {
    return this.data.cartItems.find(c => c.productId === productId);
  }

  addCartItem(item) {
    const existing = this.getCartItemByProductId(item.productId);
    if (existing) {
      existing.quantity += item.quantity || 1;
      existing.updatedAt = new Date().toISOString();
      this.save();
      return { ...existing, Product: this.getProductById(existing.productId) };
    }
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
app.post('/api/cart/add', async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId || quantity <= 0) {
      return res.status(400).json({ message: 'Invalid cart payload' });
    }

    const product = db.getProductById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const cartItem = db.addCartItem({ productId, quantity });
    res.status(201).json(cartItem);
  } catch (error) {
    res.status(500).json({ message: 'Failed to add item to cart' });
  }
});

app.get('/api/cart', async (req, res) => {
  try {
    const items = db.getCartItems();
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch cart' });
  }
});

// Test suite
describe('Cart API Tests', () => {
  let testProduct;

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
    // Create a test product
    testProduct = db.createProduct({
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
          productId: 'non-existent-id',
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
