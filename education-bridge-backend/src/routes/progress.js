const express = require('express');
const supabase = require('../db/supabase');
const authenticate = require('../middleware/auth');
const router = express.Router();

// POST /api/progress/complete – record lesson completion
router.post('/complete', authenticate, async (req, res) => {
  const { lesson_id, progress_percent, completed_at, started_at } = req.body;
  const student_id = req.user.id;

  const status = progress_percent === 100 ? 'completed' : 'started';

  // Upsert progress
  const { data, error } = await supabase
    .from('progress')
    .upsert({
      student_id,
      lesson_id,
      status,
      progress_percent,
      completed_at: status === 'completed' ? completed_at || new Date() : null,
      started_at,
      last_accessed: new Date()
    }, { onConflict: 'student_id, lesson_id' })
    .select();

  if (error) return res.status(400).json({ error: error.message });

  res.json(data[0]);
});

// GET /api/progress/teacher/:classId – teacher dashboard
router.get('/teacher/:classId', authenticate, async (req, res) => {
  const { classId } = req.params;
  const teacher_id = req.user.id;

  // Verify teacher owns this class
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('teacher_id, name')
    .eq('id', classId)
    .single();

  if (classError || classData.teacher_id !== teacher_id) {
    return res.status(403).json({ error: 'Not authorized' });
  }

  // Get all students in this class (need student_classes table)

  const { data: students, error: studentsError } = await supabase
    .from('users')
    .select('id, name')
    .eq('class_id', classId)
    .eq('role', 'student');

  if (studentsError) return res.status(500).json({ error: studentsError.message });

  // Get progress for each student
  const studentIds = students.map(s => s.id);
  const { data: progress, error: progressError } = await supabase
    .from('progress')
    .select('*, lessons(title)')
    .in('student_id', studentIds);

  if (progressError) return res.status(500).json({ error: progressError.message });

  // Aggregate stats
  const totalStudents = students.length;
  const completedLessons = progress.filter(p => p.status === 'completed').length;
  const completionRate = totalStudents > 0 ? (completedLessons / (totalStudents * lessonsCount)) : 0; // Need lessonsCount

  // Find students at risk (e.g., less than 30% progress on assigned lessons)
  const studentsAtRisk = students.map(s => {
    const studentProgress = progress.filter(p => p.student_id === s.id);
    const avgProgress = studentProgress.reduce((acc, p) => acc + p.progress_percent, 0) / (studentProgress.length || 1);
    if (avgProgress < 30) {
      return { student_id: s.id, name: s.name, progress: avgProgress };
    }
    return null;
  }).filter(Boolean);

  res.json({
    class_name: classData.name,
    total_students: totalStudents,
    completion_rate: completionRate,
    students_at_risk: studentsAtRisk
  });
});

module.exports = router;