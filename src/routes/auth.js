const express = require('express');
const router = express.Router();

// Simple in-memory admin. In production, use DB + hashing.
// const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || '12345';

router.get('/login', (req, res) => {
  if (req.session?.user) return res.redirect('/');
  res.render('auth/login');
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (["superAdmin", "admin"].includes(username) && password === ADMIN_PASS) {
    req.session.user = { username, role: (username === 'superAdmin') ? 'SUPER_ADMIN': 'ADMIN' };
    req.flash('success', 'Logged in');
    return res.redirect('/');
  }
  req.flash('error', 'Invalid credentials');
  return res.redirect('/login');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;


