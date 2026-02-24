const express = require('express');
const supabase = require('../db/supabase');
const authenticate = require('../middleware/auth');
const router = express.Router();

// GET /api/lessons – list lessons (with optional lang filter)
router.get('/', authenticate, async (req, res) => {
  const { lang = 'en', subject } = req.query;

  let query = supabase.from('lessons').select('*');

  if (subject) {
    query = query.eq('subject', subject);
  }

  const { data, error } = await query;

  if (error) return res.status(500).json({ error: error.message });

  // Optionally transform to return only the requested language fields
  const lessons = data.map(lesson => ({
    ...lesson,
    title: lesson.title[lang] || lesson.title.en,
    description: lesson.description?.[lang] || lesson.description?.en,
    content_url: lesson.content_url?.[lang] || lesson.content_url?.en
  }));

  res.json(lessons);
});

// GET /api/lessons/:id – get single lesson
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { lang = 'en' } = req.query;

  const { data, error } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return res.status(404).json({ error: 'Lesson not found' });

  // Transform language fields
  const lesson = {
    ...data,
    title: data.title[lang] || data.title.en,
    description: data.description?.[lang] || data.description?.en,
    content_url: data.content_url?.[lang] || data.content_url?.en
  };

  res.json(lesson);
});

// POST /api/lessons/assign (teacher only)
router.post('/assign', authenticate, async (req, res) => {
  const { class_id, lesson_id } = req.body;
  const teacher_id = req.user.id;

  // Check if user is a teacher (you could add role check)
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', teacher_id)
    .single();

  if (userError || user.role !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can assign lessons' });
  }

  const { data, error } = await supabase
    .from('assignments')
    .insert([{ class_id, lesson_id, assigned_by: teacher_id }])
    .select();

  if (error) return res.status(400).json({ error: error.message });

  res.status(201).json(data[0]);
});

// GET /api/lessons/student – get lessons for the logged-in student
router.get('/student', authenticate, async (req, res) => {
  const student_id = req.user.id;

  // Get student's class(es) – assuming one class per student for simplicity
  const { data: student, error: studentError } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', student_id)
    .single();

  if (studentError) return res.status(500).json({ error: studentError.message });

  // Get classes in that school? Or a separate table student_classes? For MVP, assume classes have teacher and we need a student-class mapping.
  // This is simplified: we'll get assignments for the class the student belongs to. You'd need a student_classes table.
  // For now, let's assume the student's class is stored in users table (add class_id column to users).
  // I'll add a class_id column to users later. For this example, we'll skip and just return all lessons.
  // Better: add a student_classes junction table. But let's keep simple.

  // For the purpose of this guide, we'll return lessons from assignments where the class includes this student.
  // We'll need a student_classes table. I'll add SQL for that later.

  // Placeholder: return all lessons (not realistic)
  const { data, error } = await supabase.from('lessons').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

module.exports = router;