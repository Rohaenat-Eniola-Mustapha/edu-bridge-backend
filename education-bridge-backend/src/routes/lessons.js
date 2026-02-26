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

  // Check if user is a teacher
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', teacher_id)
    .single();

  if (userError || user.role !== 'teacher') {
    return res.status(403).json({ error: 'Only teachers can assign lessons' });
  }

  // Insert the assignment
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

  // Get student's class_id
  const { data: student, error: studentError } = await supabase
    .from('users')
    .select('class_id')
    .eq('id', student_id)
    .single();

  if (studentError) return res.status(500).json({ error: studentError.message });

  if (!student.class_id) {
    return res.json([]); // no class assigned yet
  }

  // Get assignments for that class
  const { data: assignments, error: assignError } = await supabase
    .from('assignments')
    .select('lesson_id')
    .eq('class_id', student.class_id);

  if (assignError) return res.status(500).json({ error: assignError.message });

  const lessonIds = assignments.map(a => a.lesson_id);

  // Fetch those lessons
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('*')
    .in('id', lessonIds);

  if (lessonsError) return res.status(500).json({ error: lessonsError.message });

  // Transform multilingual fields (optional)
  const lang = req.query.lang || 'en';
  const transformed = lessons.map(lesson => ({
    ...lesson,
    title: lesson.title[lang] || lesson.title.en,
    description: lesson.description?.[lang] || lesson.description?.en,
    content_url: lesson.content_url?.[lang] || lesson.content_url?.en
  }));

  res.json(transformed);
});

module.exports = router;