const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/user');
const Event = require('../src/models/event');
const Registration = require('../src/models/registration');
const Message = require('../src/models/message');
const Report = require('../src/models/report');

const MONGO = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/eventhub';

async function seed() {
  console.log('Connecting to', MONGO);
  await mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  // Clean slate for demo
  await Promise.all([
    User.deleteMany({}),
    Event.deleteMany({}),
    Registration.deleteMany({}),
    Message.deleteMany({}),
    Report.deleteMany({})
  ]);

  // Create users
  const admin = new User({
    username: 'admin',
    email: 'admin@example.com',
    password: 'AdminPass123!',
    firstName: 'Site',
    lastName: 'Admin',
    role: 'admin',
    isVerified: true
  });
  await admin.save();

  const organizer = new User({
    username: 'organizer1',
    email: 'organizer@example.com',
    password: 'OrganizerPass123!',
    firstName: 'Event',
    lastName: 'Organizer',
    role: 'user',
    isVerified: true
  });
  await organizer.save();

  const attendee = new User({
    username: 'jdoe',
    email: 'jdoe@example.com',
    password: 'UserPass123!',
    firstName: 'John',
    lastName: 'Doe',
    role: 'user',
    isVerified: true
  });
  await attendee.save();

  // Create an event by organizer
  const eventDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // one week from now
  const event = new Event({
    title: 'Community Concert',
    description: 'Open-air community concert with local bands.',
    date: eventDate,
    location: 'Central Park',
    category: 'music',
    organizer: organizer._id,
    capacity: 100,
    price: 10,
    image: '',
    status: 'published',
    availableSpots: 100,
    isPrivate: false,
    tags: ['music', 'outdoor']
  });
  await event.save();

  // Create a confirmed registration for attendee
  const registration = new Registration({
    event: event._id,
    user: attendee._id,
    status: 'confirmed',
    ticketQuantity: 2,
    totalPrice: 20,
    paymentStatus: 'completed'
  });
  await registration.save();

  // Decrement available spots on event
  event.availableSpots = Math.max(0, event.availableSpots - registration.ticketQuantity);
  await event.save();

  // Add chat messages
  const msg1 = new Message({
    event: event._id,
    user: attendee._id,
    username: `${attendee.firstName} ${attendee.lastName}`,
    text: 'Looking forward to this event!'
  });
  await msg1.save();

  const msg2 = new Message({
    event: event._id,
    user: organizer._id,
    username: `${organizer.firstName} ${organizer.lastName}`,
    text: 'Thanks for registering — see you there!'
  });
  await msg2.save();

  // Create a report (event type) from attendee
  const report = new Report({
    type: 'event',
    reporter: attendee._id,
    event: event._id,
    reason: 'inappropriate content',
    description: 'The event description contains misleading information.'
  });
  await report.save();

  console.log('Seeding complete. Created:');
  console.log(' - admin:', admin.email);
  console.log(' - organizer:', organizer.email);
  console.log(' - attendee:', attendee.email);
  console.log(' - event:', event.title, event._id.toString());
  console.log(' - registration:', registration._id.toString());
  console.log(' - messages:', [msg1._id.toString(), msg2._id.toString()]);
  console.log(' - report:', report._id.toString());

  await mongoose.disconnect();
  console.log('Disconnected. Bye.');
}

seed().catch(err => {
  console.error('Seeding error', err);
  process.exit(1);
});
