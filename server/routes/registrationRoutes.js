const express = require('express');
const {
  registerForEvent,
  getMyRegistrations,
  getEventRegistrations,
  exportEventRegistrationsCsv,
  markAttendanceByQr
} = require('../controllers/registrationController');
const { protect, allowRoles } = require('../middleware/authMiddleware');
const {
  validateBody,
  validateObjectIdParam,
  isNonEmptyString,
  isObjectId
} = require('../middleware/validate');

const router = express.Router();

router.post(
  '/events/:eventId/register',
  protect,
  allowRoles('student'),
  validateObjectIdParam('eventId'),
  registerForEvent
);
router.get('/my', protect, allowRoles('student'), getMyRegistrations);
router.get(
  '/events/:eventId',
  protect,
  allowRoles('organizer'),
  validateObjectIdParam('eventId'),
  getEventRegistrations
);
router.get(
  '/events/:eventId/export-csv',
  protect,
  allowRoles('organizer'),
  validateObjectIdParam('eventId'),
  exportEventRegistrationsCsv
);
router.post(
  '/attendance/scan',
  protect,
  allowRoles('organizer'),
  validateBody({
    qrToken: (v) => (isNonEmptyString(v) ? true : 'qrToken is required'),
    eventId: (v) => (isObjectId(v) ? true : 'eventId must be a valid ObjectId')
  }),
  markAttendanceByQr
);

module.exports = router;
