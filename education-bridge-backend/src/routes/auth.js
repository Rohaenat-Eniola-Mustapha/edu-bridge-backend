const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

const supabase = require('../db/supabase');

// Sign Up
router.post('/signup', async (req, res) => {
  const { email, password, name, role, language, phone } = req.body;

  // Basic validation
  if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
  }

  // Use Supabase Auth to create user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role, language, phone, status: 'active' }
    }
  });

  if (error) return res.status(400).json({ error: error.message });

  // User will be inserted into public.users by trigger
  res.status(201).json({
    message: 'User created successfully. Please check email for confirmation.', user: data.user, session: data.session
  });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) return res.status(401).json({ error: error.message });

  // Fetch additional user info from public.users
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (userError) return res.status(500).json({ error: userError.message });

  res.json({
    token: data.session.access_token,
    user: userData
  });
});

// Get current user (protected)
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'No token provided' });

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error) return res.status(401).json({ error: error.message });

  // Fetch from public.users
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (userError) return res.status(500).json({ error: userError.message });

  res.json(userData);
});

module.exports = router;