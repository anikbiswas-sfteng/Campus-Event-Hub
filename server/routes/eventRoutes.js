const express = require('express');
const {
  createEvent,
  listEvents,
  getEventById,
  updateEvent,
  deleteEvent
} = require('../controllers/eventController');
const { protect, allowRoles } = require('../middleware/authMiddleware');
const {
  validateBody,
  validateOptionalBody,
  validateObjectIdParam,
  isNonEmptyString,
  isPositiveInt,
  isISODate,
  isTime
} = require('../middleware/validate');

const router = express.Router();

router.get('/', protect, listEvents);
router.get('/:id', protect, validateObjectIdParam('id'), getEventById);
router.post(
  '/',
  protect,
  allowRoles('organizer'),
  validateBody({
    title: (v) => (isNonEmptyString(v) ? true : 'Title is required'),
    description: (v) => (isNonEmptyString(v) ? true : 'Description is required'),
    date: (v) => (isISODate(v) ? true : 'Date must be in YYYY-MM-DD format'),
    time: (v) => (isTime(v) ? true : 'Time must be in HH:mm format'),
    venue: (v) => (isNonEmptyString(v) ? true : 'Venue is required'),
    maxParticipants: (v) =>
      (isPositiveInt(Number(v)) ? true : 'Max participants must be a positive integer')
  }),
  createEvent
);
router.put(
  '/:id',
  protect,
  allowRoles('organizer'),
  validateObjectIdParam('id'),
  validateOptionalBody({
    title: (v) => (isNonEmptyString(v) ? true : 'Title cannot be empty'),
    description: (v) => (isNonEmptyString(v) ? true : 'Description cannot be empty'),
    date: (v) => (isISODate(v) ? true : 'Date must be in YYYY-MM-DD format'),
    time: (v) => (isTime(v) ? true : 'Time must be in HH:mm format'),
    venue: (v) => (isNonEmptyString(v) ? true : 'Venue cannot be empty'),
    maxParticipants: (v) =>
      (isPositiveInt(Number(v)) ? true : 'Max participants must be a positive integer')
  }),
  updateEvent
);
router.delete('/:id', protect, allowRoles('organizer'), validateObjectIdParam('id'), deleteEvent);

module.exports = router;
