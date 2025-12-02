const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Sequelize, DataTypes } = require('sequelize');

// Mock database setup for testing
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false
});

const JWT_SECRET = 'test-secret-key';

// Define User model for tests
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

// Create test app
const app = express();
app.use(express.json());

// Define routes for testing
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      name: name || null
    });

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
    res.status(500).json({ message: 'Failed to create user' });
  }
});

app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

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
    res.status(500).json({ message: 'Failed to sign in' });
  }
});

// Test suite
describe('Authentication API Tests', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await User.destroy({ where: {}, truncate: true });
  });

  describe('POST /api/auth/signup', () => {
    test('should create a new user', async () => {
      const newUser = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      const response = await request(app)
        .post('/api/auth/signup')
        .send(newUser);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).toHaveProperty('name', 'Test User');
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('should hash the password', async () => {
      const newUser = {
        email: 'test@example.com',
        password: 'password123'
      };

      await request(app)
        .post('/api/auth/signup')
        .send(newUser);
      
      const user = await User.findOne({ where: { email: 'test@example.com' } });
      expect(user.password).not.toBe('password123');
      expect(user.password.length).toBeGreaterThan(20);
    });

    test('should return 400 if email already exists', async () => {
      const user = {
        email: 'test@example.com',
        password: 'password123'
      };

      // Create user first time
      await request(app)
        .post('/api/auth/signup')
        .send(user);

      // Try to create same user again
      const response = await request(app)
        .post('/api/auth/signup')
        .send(user);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'User with this email already exists');
    });

    test('should return 400 if email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          password: 'password123'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Email and password are required');
    });

    test('should return 400 if password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Email and password are required');
    });
  });

  describe('POST /api/auth/signin', () => {
    beforeEach(async () => {
      // Create a test user
      const hashedPassword = await bcrypt.hash('password123', 10);
      await User.create({
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User'
      });
    });

    test('should sign in with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.user).not.toHaveProperty('password');
    });

    test('should return valid JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      const decoded = jwt.verify(response.body.token, JWT_SECRET);
      expect(decoded).toHaveProperty('userId');
      expect(decoded).toHaveProperty('email', 'test@example.com');
    });

    test('should return 401 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'wrong@example.com',
          password: 'password123'
        });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid email or password');
    });

    test('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Invalid email or password');
    });

    test('should return 400 if email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          password: 'password123'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Email and password are required');
    });

    test('should return 400 if password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/signin')
        .send({
          email: 'test@example.com'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Email and password are required');
    });
  });
});

