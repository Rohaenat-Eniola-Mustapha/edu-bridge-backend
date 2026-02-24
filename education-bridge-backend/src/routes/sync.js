const express = require('express');
const supabase = require('../db/supabase');
const authenticate = require('../middleware/auth');
const router = express.Router();

router.post('/', authenticate, async (req, res) => {
  const { last_sync, changes } = req.body;
  const user_id = req.user.id;

  // Process incoming changes (e.g., progress updates)
  const results = [];
  for (const change of changes) {
    if (change.entity === 'progress') {
      // Upsert progress
      const { data, error } = await supabase
        .from('progress')
        .upsert({
          student_id: user_id, // ensure only own progress
          lesson_id: change.data.lesson_id,
          progress_percent: change.data.progress_percent,
          status: change.data.progress_percent === 100 ? 'completed' : 'started',
          last_accessed: new Date(),
          sync_token: change.timestamp
        }, { onConflict: 'student_id, lesson_id' })
        .select();

      if (!error) results.push({ entity: 'progress', id: data[0].id, status: 'synced' });
    }
    // Add more entity types as needed
  }

  // Fetch server changes since last_sync (e.g., new assignments, lessons)
  const { data: newAssignments, error: assignError } = await supabase
    .from('assignments')
    .select('*, lessons(*)')
    .gte('assigned_at', last_sync || '1970-01-01')
    .order('assigned_at', { ascending: true });

  const serverChanges = (newAssignments || []).map(a => ({
    entity: 'assignment',
    id: a.id,
    data: a,
    timestamp: a.assigned_at
  }));

  res.json({
    sync_token: new Date().toISOString(),
    changes: serverChanges,
    conflicts: [] // For now, no conflict detection
  });
});

module.exports = router;