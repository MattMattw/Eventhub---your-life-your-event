const axios = require('axios');
require('dotenv').config();

const api = axios.create({ baseURL: process.env.API_URL || 'http://localhost:3000/api', timeout: 10000 });

async function run() {
  try {
    console.log('Logging in as admin:', process.env.AUDIT_ADMIN_EMAIL);
    const loginRes = await api.post('/users/login', {
      email: process.env.AUDIT_ADMIN_EMAIL,
      password: process.env.AUDIT_ADMIN_PASSWORD
    });

    const token = loginRes.data.token;
    console.log('Admin token received, now calling admin endpoints...');

    const headers = { Authorization: `Bearer ${token}` };

    const stats = await api.get('/admin/stats', { headers }).catch(e => e.response ? e.response.data : e.message);
    console.log('GET /admin/stats ->', stats);

    const events = await api.get('/admin/events', { headers }).catch(e => e.response ? e.response.data : e.message);
    console.log('GET /admin/events ->', Array.isArray(events) ? 'array' : events);

    const users = await api.get('/admin/users', { headers }).catch(e => e.response ? e.response.data : e.message);
    console.log('GET /admin/users ->', Array.isArray(users) ? 'array' : users);

    const reports = await api.get('/admin/reports', { headers }).catch(e => e.response ? e.response.data : e.message);
    console.log('GET /admin/reports ->', Array.isArray(reports) ? 'array' : reports);

  } catch (err) {
    console.error('Admin smoke error:', err.response ? err.response.data : err.message);
  }
}

run();
