require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Event = require('../models/Event');

const organizerSeed = {
  name: 'Event Organizer',
  email: 'organizer@college.edu',
  studentId: 'ORG-001',
  role: 'organizer',
  password: 'Organizer@123'
};

const studentSeed = {
  name: 'Test Student',
  email: 'student@college.edu',
  studentId: 'STU-001',
  role: 'student',
  password: 'Student@123'
};

const eventsSeed = [
  {
    title: 'Tech Fest 2026',
    description: 'Hands-on coding, AI demos, and project showcase.',
    date: '2026-03-15',
    time: '10:00',
    venue: 'Main Auditorium',
    maxParticipants: 200
  },
  {
    title: 'Career Guidance Seminar',
    description: 'Resume, interviews, internships, and networking tips.',
    date: '2026-03-22',
    time: '14:00',
    venue: 'Seminar Hall B',
    maxParticipants: 120
  }
];

const upsertUser = async (seed) => {
  const existing = await User.findOne({ email: seed.email.toLowerCase() });
  const hashedPassword = await bcrypt.hash(seed.password, 10);

  if (!existing) {
    return User.create({
      name: seed.name,
      email: seed.email,
      studentId: seed.studentId,
      role: seed.role,
      password: hashedPassword
    });
  }

  existing.name = seed.name;
  existing.studentId = seed.studentId;
  existing.role = seed.role;
  existing.password = hashedPassword;
  await existing.save();
  return existing;
};

const upsertEvent = async (eventSeed, organizerId) => {
  const existing = await Event.findOne({
    title: eventSeed.title,
    date: eventSeed.date,
    createdBy: organizerId
  });

  if (!existing) {
    return Event.create({ ...eventSeed, createdBy: organizerId });
  }

  Object.assign(existing, eventSeed);
  existing.createdBy = organizerId;
  await existing.save();
  return existing;
};

const run = async () => {
  await connectDB();

  const organizer = await upsertUser(organizerSeed);
  await upsertUser(studentSeed);

  for (const eventSeed of eventsSeed) {
    await upsertEvent(eventSeed, organizer._id);
  }

  console.log('Seed completed successfully.');
  console.log('Organizer login: organizer@college.edu / Organizer@123');
  console.log('Student login: student@college.edu / Student@123');

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error('Seed failed:', error.message);
  await mongoose.disconnect();
  process.exit(1);
});
