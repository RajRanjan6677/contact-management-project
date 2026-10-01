import express from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all contacts for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [contacts] = await pool.execute(
      'SELECT * FROM contacts WHERE user_id = ? ORDER BY name ASC',
      [req.user.userId]
    );
    res.json(contacts);
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Server error fetching contacts' });
  }
});

// Get single contact
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const [contacts] = await pool.execute(
      'SELECT * FROM contacts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (contacts.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(contacts[0]);
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({ error: 'Server error fetching contact' });
  }
});

// Create new contact
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO contacts (user_id, name, phone, email, address) VALUES (?, ?, ?, ?, ?)',
      [req.user.userId, name, phone, email || null, address || null]
    );

    const [newContact] = await pool.execute(
      'SELECT * FROM contacts WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json(newContact[0]);
  } catch (error) {
    console.error('Create contact error:', error);
    res.status(500).json({ error: 'Server error creating contact' });
  }
});

// Update contact
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    // Check if contact belongs to user
    const [existing] = await pool.execute(
      'SELECT id FROM contacts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    await pool.execute(
      'UPDATE contacts SET name = ?, phone = ?, email = ?, address = ? WHERE id = ? AND user_id = ?',
      [name, phone, email || null, address || null, req.params.id, req.user.userId]
    );

    const [updated] = await pool.execute(
      'SELECT * FROM contacts WHERE id = ?',
      [req.params.id]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Server error updating contact' });
  }
});

// Delete contact
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Check if contact belongs to user
    const [existing] = await pool.execute(
      'SELECT id FROM contacts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    await pool.execute(
      'DELETE FROM contacts WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Server error deleting contact' });
  }
});

export default router;






