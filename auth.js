const express = require('express');
const bcrypt = require('bcryptjs');
const SecurityService = require('../services/SecurityService');
const DatabaseService = require('../services/DatabaseService');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Username, email, and password are required'
      });
    }

    // Check if user already exists
    const existingUser = await DatabaseService.get(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await DatabaseService.run(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      [username, email, passwordHash, 'user']
    );

    await SecurityService.logSecurityEvent(
      'user_registered',
      'low',
      `New user registered: ${username}`,
      result.id,
      req.ip
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: result.id,
        username,
        email,
        role: 'user'
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed'
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required'
      });
    }

    // Verify request through security service
    const verification = await SecurityService.verifyRequest(req);
    if (!verification.passed) {
      return res.status(403).json({
        error: 'Security verification failed',
        details: verification.checks
      });
    }

    // Authenticate user
    const authResult = await SecurityService.authenticateUser(username, password);
    
    if (!authResult.success) {
      return res.status(401).json({
        error: authResult.error
      });
    }

    res.json({
      message: 'Login successful',
      token: authResult.token,
      user: authResult.user
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed'
    });
  }
});

// Verify token
router.post('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(400).json({
        error: 'Token is required'
      });
    }

    const verification = await SecurityService.verifyJWT(token);
    
    if (!verification.valid) {
      return res.status(401).json({
        error: 'Invalid token',
        details: verification.error
      });
    }

    res.json({
      valid: true,
      user: verification.user
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      error: 'Verification failed'
    });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    const verification = await SecurityService.verifyJWT(token);
    
    if (!verification.valid) {
      return res.status(401).json({
        error: 'Invalid token'
      });
    }

    const user = await DatabaseService.get(
      'SELECT id, username, email, role, created_at, last_login FROM users WHERE id = ?',
      [verification.user.userId]
    );

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile'
    });
  }
});

// Logout (invalidate token - in a real app, you'd maintain a blacklist)
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const verification = await SecurityService.verifyJWT(token);
      if (verification.valid) {
        await SecurityService.logSecurityEvent(
          'user_logout',
          'low',
          `User logged out: ${verification.user.username}`,
          verification.user.userId,
          req.ip
        );
      }
    }

    res.json({
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Logout failed'
    });
  }
});

// Middleware to authenticate requests
const authenticateToken = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      error: 'Authentication required'
    });
  }

  try {
    const verification = await SecurityService.verifyJWT(token);
    
    if (!verification.valid) {
      return res.status(401).json({
        error: 'Invalid token'
      });
    }

    req.user = verification.user;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Authentication failed'
    });
  }
};

module.exports = { router, authenticateToken };