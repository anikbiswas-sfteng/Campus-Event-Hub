const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const { createObjectCsvStringifier } = require('csv-writer');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

const registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const existing = await Registration.findOne({ userId: req.user.id, eventId });
    if (existing) {
      return res.status(409).json({ message: 'Already registered for this event' });
    }

    const currentCount = await Registration.countDocuments({ eventId });
    if (currentCount >= event.maxParticipants) {
      return res.status(400).json({ message: 'Registration full' });
    }

    const qrToken = jwt.sign({ userId: req.user.id, eventId }, process.env.JWT_SECRET, { expiresIn: '90d' });
    const qrCode = await QRCode.toDataURL(qrToken);

    const registration = await Registration.create({
      userId: req.user.id,
      eventId,
      qrCode,
      qrToken,
      attendance: false
    });

    return res.status(201).json(registration);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Already registered for this event' });
    }
    return res.status(500).json({ message: error.message || 'Registration failed' });
  }
};

const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ userId: req.user.id })
      .populate('eventId')
      .sort({ createdAt: -1 });

    return res.json(registrations);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch registrations' });
  }
};

const getEventRegistrations = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only creator can view registrations' });
    }

    const registrations = await Registration.find({ eventId: req.params.eventId })
      .populate('userId', 'name email studentId')
      .sort({ createdAt: -1 });

    return res.json(registrations);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch event registrations' });
  }
};

const exportEventRegistrationsCsv = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only creator can export registrations' });
    }

    const registrations = await Registration.find({ eventId: req.params.eventId }).populate(
      'userId',
      'name email studentId'
    );

    const csvWriter = createObjectCsvStringifier({
      header: [
        { id: 'name', title: 'Name' },
        { id: 'email', title: 'Email' },
        { id: 'studentId', title: 'Student ID' },
        { id: 'attendance', title: 'Attendance' },
        { id: 'registeredAt', title: 'Registered At' }
      ]
    });

    const records = registrations.map((reg) => ({
      name: reg.userId?.name || '',
      email: reg.userId?.email || '',
      studentId: reg.userId?.studentId || '',
      attendance: reg.attendance ? 'Present' : 'Absent',
      registeredAt: reg.createdAt.toISOString()
    }));

    const csv = csvWriter.getHeaderString() + csvWriter.stringifyRecords(records);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${event.title.replace(/\s+/g, '_')}_registrations.csv"`);
    return res.status(200).send(csv);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to export CSV' });
  }
};

const markAttendanceByQr = async (req, res) => {
  try {
    const { qrToken, eventId } = req.body;

    if (!qrToken || !eventId) {
      return res.status(400).json({ message: 'qrToken and eventId are required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only creator can mark attendance for this event' });
    }

    const decoded = jwt.verify(qrToken, process.env.JWT_SECRET);

    if (decoded.eventId !== eventId) {
      return res.status(400).json({ message: 'QR code does not belong to this event' });
    }

    const registration = await Registration.findOne({
      userId: decoded.userId,
      eventId,
      qrToken
    }).populate('userId', 'name studentId email');

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found for scanned QR' });
    }

    if (registration.attendance) {
      return res.status(200).json({ message: 'Attendance already marked', registration });
    }

    registration.attendance = true;
    await registration.save();

    return res.json({ message: 'Attendance marked successfully', registration });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Invalid QR token' });
  }
};

module.exports = {
  registerForEvent,
  getMyRegistrations,
  getEventRegistrations,
  exportEventRegistrationsCsv,
  markAttendanceByQr
};
