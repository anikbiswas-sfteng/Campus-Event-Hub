const express = require('express');
const { register, login, me } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { validateBody, isEmail, isNonEmptyString, isRole } = require('../middleware/validate');

const router = express.Router();

router.post(
  '/register',
  validateBody({
    name: (v) => (isNonEmptyString(v) ? true : 'Name is required'),
    email: (v) => (isEmail(v) ? true : 'Valid email is required'),
    password: (v) => (isNonEmptyString(v) && v.length >= 6 ? true : 'Password must be at least 6 characters'),
    studentId: (v) => (isNonEmptyString(v) ? true : 'Student ID is required'),
    role: (v) => (isRole(String(v || '').toLowerCase()) ? true : 'Role must be student or organizer')
  }),
  register
);
router.post(
  '/login',
  validateBody({
    email: (v) => (isEmail(v) ? true : 'Valid email is required'),
    password: (v) => (isNonEmptyString(v) ? true : 'Password is required')
  }),
  login
);
router.get('/me', protect, me);

module.exports = router;
