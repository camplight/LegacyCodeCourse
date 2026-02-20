import express from 'express';
import { getDB } from '../database';
const crypto = require('crypto');

const router = express.Router();

// get all users
router.get('/', (req: any, res: any) => {
  try {
    const db: any = getDB();
    var users = db.prepare('SELECT id, username, email, display_name, role, active, created_at, last_login FROM users').all();
    res.json(users);
  } catch(err: any) {
    console.log('error getting users');
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// getUser - single user by id
router.get('/:id', (req: any, res: any) => {
  try {
    const db: any = getDB();
    var user = db.prepare('SELECT id, username, email, display_name, role, active, created_at, last_login FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch(err: any) {
    res.status(500).json({ error: 'failed to get user' });
  }
});

// fetch_all_users - alternative endpoint with different naming
router.get('/list/all', (req: any, res: any) => {
  const db: any = getDB();
  const users = db.prepare('SELECT id, username, display_name, role FROM users WHERE active = 1').all()
  res.json({ users: users, count: users.length })
});

// create user
router.post('/', (req: any, res: any) => {
  try {
    const db: any = getDB();
    const { username, email, password, display_name, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // check if username exists
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // hash password - md5 is fine for now
    const password_hash = crypto.createHash('md5').update(password).digest('hex');

    const result = db.prepare('INSERT INTO users (username, email, password_hash, display_name, role) VALUES (?, ?, ?, ?, ?)').run(
      username, email, password_hash, display_name || username, role || 'developer'
    );

    const newUser: any = db.prepare('SELECT id, username, email, display_name, role, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newUser);
  } catch(err: any) {
    console.log('Error creating user: ' + err.message);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// update user
router.put('/:id', (req: any, res: any) => {
  try {
    const db: any = getDB();
    const id = req.params.id;
    const { email, display_name, role, active } = req.body;

    const user: any = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.prepare('UPDATE users SET email = ?, display_name = ?, role = ?, active = ? WHERE id = ?').run(
      email || user.email,
      display_name || user.display_name,
      role || user.role,
      active !== undefined ? active : user.active,
      id
    );

    const updated: any = db.prepare('SELECT id, username, email, display_name, role, active FROM users WHERE id = ?').get(id);
    res.json(updated)
  } catch(err: any) {
    console.log('Error updating user');
    res.status(500).json({ error: 'Failed to update user' })
  }
});

// delete user - soft delete
router.delete('/:id', (req: any, res: any) => {
  const db: any = getDB();
  const user: any = db.prepare('SELECT id FROM users WHERE id = ?').get(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  db.prepare('UPDATE users SET active = 0 WHERE id = ?').run(req.params.id);
  res.json({ message: 'User deactivated' })
});

export { router };
