const { createClient } = require('@supabase/supabase-js');
const supabase = require('../db/supabase');

const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error) return res.status(401).json({ error: error.message });

  req.user = user;
  next();
};

module.exports = authenticate;