const axios = require('axios');
const fs = require('fs');

const api = axios.create({ baseURL: process.env.API_URL || 'http://localhost:3000/api', timeout: 10000 });

async function run() {
  console.log('Starting email notification audit...');
  const results = [];

  try {
    // 1) Register a new user
    const username = `audituser_${Date.now()}`;
    const email = `audit+${Date.now()}@example.com`;
    const firstName = 'Audit';
    const lastName = 'User';
    const password = 'Password123!';

    console.log('Registering user:', username, email);
    const regRes = await api.post('/users/register', { username, email, password, firstName, lastName });
    results.push({ step: 'register', status: regRes.status, data: regRes.data });

    const token = regRes.data.token;

    // 2) Attempt to verify (call verify endpoint with token)
    console.log('Verifying email via API');
    try {
      const verifyRes = await api.post('/users/verify-email', { token });
      results.push({ step: 'verify', status: verifyRes.status, data: verifyRes.data });
    } catch (err) {
      results.push({ step: 'verify', error: err.response?.data || err.message });
    }

    // 3) Request password reset
    console.log('Requesting password reset');
    const resetReq = await api.post('/users/forgot-password', { email });
    results.push({ step: 'request-reset', status: resetReq.status, data: resetReq.data });

    // 4) Login to get bearer token for protected actions (some flows require auth)
    console.log('Logging in');
    const loginRes = await api.post('/users/login', { email, password });
    const authToken = loginRes.data.token;
    results.push({ step: 'login', status: loginRes.status, data: { user: loginRes.data.user?.id } });

    const auth = { headers: { Authorization: `Bearer ${authToken}` } };

    // 5) Create an event as this user
    console.log('Creating an event');
    const eventPayload = {
      title: 'Audit Event',
      description: 'Event created by audit script',
      date: new Date(Date.now() + 24 * 3600 * 1000),
      location: 'Online',
      category: 'audit',
      capacity: 10,
      price: 0,
      status: 'published'
    };

    const createEventRes = await api.post('/events', eventPayload, auth);
    results.push({ step: 'create-event', status: createEventRes.status, data: createEventRes.data });
    const eventId = createEventRes.data._id || createEventRes.data.id || (createEventRes.data.event && createEventRes.data.event._id);

    // 6) Register for the event
    console.log('Registering for the event');
    const regForEvent = await api.post('/registrations', { eventId, ticketQuantity: 1 }, auth);
    results.push({ step: 'register-event', status: regForEvent.status, data: regForEvent.data });

    // 7) Cancel registration
    console.log('Cancel registration');
    const cancelRes = await api.patch(`/registrations/${regForEvent.data._id}/cancel`, {}, auth).catch(e => e.response || { status: 'error', data: e.message });
    results.push({ step: 'cancel-registration', status: cancelRes.status, data: cancelRes.data || cancelRes });

    // 8) Create a report against the event
    console.log('Creating a report');
    const reportRes = await api.post('/reports', { type: 'event', eventId, reason: 'spam', description: 'Audit report' }, auth);
    results.push({ step: 'create-report', status: reportRes.status, data: reportRes.data });

    // 9) If admin exists, try to delete event (skip if no admin)
    // We will attempt to login as admin using environment variables if provided
    if (process.env.AUDIT_ADMIN_EMAIL && process.env.AUDIT_ADMIN_PASSWORD) {
      console.log('Logging in as admin');
      const adminLogin = await api.post('/users/login', { email: process.env.AUDIT_ADMIN_EMAIL, password: process.env.AUDIT_ADMIN_PASSWORD });
      const adminToken = adminLogin.data.token;
      const adminAuth = { headers: { Authorization: `Bearer ${adminToken}` } };
      console.log('Deleting event as admin');
      const delRes = await api.delete(`/admin/events/${eventId}`, adminAuth).catch(e => e.response || { status: 'error', data: e.message });
      results.push({ step: 'delete-event', status: delRes.status, data: delRes.data || delRes });
    } else {
      console.log('Skipping admin delete (AUDIT_ADMIN_EMAIL not set)');
      results.push({ step: 'delete-event', status: 'skipped', data: 'No admin credentials provided' });
    }

  } catch (error) {
    console.error('Audit script error:', error.response?.data || error.message || error);
    results.push({ step: 'error', error: error.response?.data || error.message });
  }

  fs.writeFileSync('email_audit_result.json', JSON.stringify(results, null, 2));
  console.log('Audit finished. Results written to email_audit_result.json');
}

run();
