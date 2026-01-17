import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { planningCenterAuth } from '../services/planningCenterAuth.js';
import { planningCenterService } from '../services/planningCenterService.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    const existingUserResult = await pool.query(
      'SELECT * FROM "User" WHERE email = $1',
      [email]
    );

    if (existingUserResult.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const result = await pool.query(
      `INSERT INTO "User" (id, email, password, name, role, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [id, email, hashedPassword, name, role || 'VIEWER']
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, usePlanningCenter } = req.body;

    // If user wants to use Planning Center authentication
    if (usePlanningCenter) {
      // Check if user exists in Planning Center
      const planningCenterPerson = await planningCenterService.findPersonByEmail(email);
      
      if (!planningCenterPerson) {
        return res.status(401).json({ error: 'User not found in Planning Center' });
      }

      // For Planning Center, we'll use OAuth flow instead
      // This endpoint will redirect to Planning Center login
      return res.json({
        redirectToPlanningCenter: true,
        message: 'Please use Planning Center OAuth login'
      });
    }

    // Regular login with local credentials
    const userResult = await pool.query(
      'SELECT * FROM "User" WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      // Try to find user in Planning Center and create account
      const planningCenterPerson = await planningCenterService.findPersonByEmail(email);
      
      if (planningCenterPerson) {
        return res.status(401).json({ 
          error: 'User found in Planning Center. Please use Planning Center login or contact admin to set up account.',
          usePlanningCenterLogin: true
        });
      }
      
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // If user has no password (OAuth user), they need to use Planning Center login
    if (!user.password) {
      return res.status(401).json({ 
        error: 'Please use Planning Center login',
        usePlanningCenterLogin: true
      });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Planning Center OAuth - Get authorization URL
router.get('/planning-center/authorize', async (req, res) => {
  try {
    // Check if OAuth is configured
    if (!process.env.PLANNING_CENTER_CLIENT_ID || !process.env.PLANNING_CENTER_CLIENT_SECRET) {
      return res.status(500).json({ 
        error: 'Planning Center OAuth not configured. Please set PLANNING_CENTER_CLIENT_ID and PLANNING_CENTER_CLIENT_SECRET in your .env file.',
        configured: false
      });
    }

    const state = req.query.state as string || Math.random().toString(36).substring(7);
    const authUrl = await planningCenterAuth.getAuthorizationUrl(state);
    
    res.json({ 
      authUrl,
      state 
    });
  } catch (error: any) {
    console.error('Planning Center authorize error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get authorization URL',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Planning Center OAuth - Callback
router.post('/planning-center/callback', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    // Exchange code for token
    const tokenData = await planningCenterAuth.exchangeCodeForToken(code);
    
    // Get user info from Planning Center
    const userInfo = await planningCenterAuth.getUserInfo(tokenData.access_token);
    
    // Find or create user in our database
    const user = await planningCenterAuth.findOrCreateUser(userInfo);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      planningCenterToken: tokenData.access_token // Optional: store for API calls
    });
  } catch (error: any) {
    console.error('Planning Center OAuth error:', error);
    res.status(500).json({ error: error.message || 'Authentication failed' });
  }
});

// Get current user
router.get('/me', authenticate, async (req: any, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role FROM "User" WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
