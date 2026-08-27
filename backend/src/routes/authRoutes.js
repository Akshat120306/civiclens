import express from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db/dbAdapter.js';
import { generateToken, authenticate } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const userRes = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
    if (!userRes.rows.length) {
      return res.status(401).json({ error: 'Invalid credentials. User not found.' });
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password.' });
    }

    const token = generateToken(user);

    // Fetch department name if applicable
    let department = null;
    if (user.department_id) {
      const deptRes = await query('SELECT id, name, code FROM departments WHERE id = $1', [user.department_id]);
      department = deptRes.rows[0] || null;
    }

    return res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department_id: user.department_id,
        department,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    let department = null;
    if (req.user.department_id) {
      const deptRes = await query('SELECT id, name, code FROM departments WHERE id = $1', [req.user.department_id]);
      department = deptRes.rows[0] || null;
    }

    return res.json({
      user: {
        ...req.user,
        department,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user profile.' });
  }
});

// GET /api/auth/demo-users
router.get('/demo-users', async (req, res) => {
  try {
    const usersRes = await query(`
      SELECT u.id, u.name, u.email, u.role, u.department_id, d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      ORDER BY u.id ASC
    `);

    return res.json({ users: usersRes.rows });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch demo user presets.' });
  }
});

export default router;
