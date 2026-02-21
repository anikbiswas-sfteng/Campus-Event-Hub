const Event = require('../models/Event');
const Registration = require('../models/Registration');

const createEvent = async (req, res) => {
  try {
    const { title, description, date, time, venue, maxParticipants } = req.body;

    if (!title || !description || !date || !time || !venue || !maxParticipants) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const event = await Event.create({
      title,
      description,
      date,
      time,
      venue,
      maxParticipants,
      createdBy: req.user.id
    });

    return res.status(201).json(event);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to create event' });
  }
};

const listEvents = async (req, res) => {
  try {
    const events = await Event.find().populate('createdBy', 'name email').sort({ date: 1, time: 1 });

    const eventIds = events.map((event) => event._id);
    const registrationCounts = await Registration.aggregate([
      { $match: { eventId: { $in: eventIds } } },
      { $group: { _id: '$eventId', count: { $sum: 1 } } }
    ]);

    const countMap = Object.fromEntries(registrationCounts.map((item) => [item._id.toString(), item.count]));

    let userRegistrations = [];
    if (req.user) {
      userRegistrations = await Registration.find({ userId: req.user.id }).select('eventId');
    }
    const userEventSet = new Set(userRegistrations.map((r) => r.eventId.toString()));

    const enriched = events.map((event) => ({
      ...event.toObject(),
      registeredCount: countMap[event._id.toString()] || 0,
      isRegistered: userEventSet.has(event._id.toString())
    }));

    return res.json(enriched);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch events' });
  }
};

const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name email');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const count = await Registration.countDocuments({ eventId: event._id });
    return res.json({ ...event.toObject(), registeredCount: count });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to fetch event' });
  }
};

const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only creator can edit this event' });
    }

    const fields = ['title', 'description', 'date', 'time', 'venue', 'maxParticipants'];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) event[field] = req.body[field];
    });

    await event.save();
    return res.json(event);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update event' });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only creator can delete this event' });
    }

    await Registration.deleteMany({ eventId: event._id });
    await event.deleteOne();
    return res.json({ message: 'Event deleted' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to delete event' });
  }
};

module.exports = { createEvent, listEvents, getEventById, updateEvent, deleteEvent };
