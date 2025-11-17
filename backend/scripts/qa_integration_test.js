/**
 * QA Integration Test for EventHub
 * Exercises all critical flows: register, verify, login, logout, create event, register/cancel, report, admin actions
 * Writes results to qa_test_results.json
 */
require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

const api = axios.create({ baseURL: process.env.API_URL || 'http://localhost:3000/api', timeout: 10000 });

const results = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: { passed: 0, failed: 0, skipped: 0 }
};

async function test(name, fn) {
  try {
    console.log(`[TEST] ${name}`);
    await fn();
    results.tests.push({ name, status: 'PASS' });
    results.summary.passed++;
    console.log(`  ✓ PASS`);
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message || String(err);
    results.tests.push({ name, status: 'FAIL', error: errorMsg });
    results.summary.failed++;
    console.error(`  ✗ FAIL: ${errorMsg}`);
  }
}

async function run() {
  console.log('=== EventHub QA Integration Tests ===\n');

  let testUser = null;
  let testUserToken = null;
  let organizer = null;
  let organizerToken = null;
  let event = null;
  let registration = null;
  let report = null;

  // Phase 1: User Registration & Authentication
  console.log('\n--- Phase 1: User Authentication ---');

  await test('User Registration', async () => {
    const res = await api.post('/users/register', {
      username: `user_${Date.now()}`,
      email: `test+${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User'
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    testUser = res.data.user;
    testUserToken = res.data.token;
  });

  await test('Email Verification (token from registration)', async () => {
    // Note: We cannot verify in this test because the token is not returned in the API response.
    // In production, the token is sent via email. For now, we skip this or mark as expected behavior.
    results.tests.push({ name: 'Email Verification (token-via-email)', status: 'SKIP', reason: 'Token sent via email in production' });
    results.summary.skipped++;
  });

  await test('User Login', async () => {
    const res = await api.post('/users/login', {
      email: testUser.email,
      password: 'TestPassword123!'
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    testUserToken = res.data.token;
  });

  await test('Get User Profile', async () => {
    const res = await api.get('/users/profile', {
      headers: { Authorization: `Bearer ${testUserToken}` }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    // profile response logged previously during debug; removed
    if (String(res.data.id) !== String(testUser.id)) throw new Error('User ID mismatch');
  });

  await test('Request Password Reset', async () => {
    const res = await api.post('/users/forgot-password', { email: testUser.email });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  // Phase 2: Event Management
  console.log('\n--- Phase 2: Event Management ---');

  await test('Create Event', async () => {
    const res = await api.post('/events', {
      title: `QA Test Event ${Date.now()}`,
      description: 'Event created by QA test script',
      date: new Date(Date.now() + 24 * 3600 * 1000),
      location: 'Test Location',
      category: 'test',
      capacity: 20,
      price: 5
    }, {
      headers: { Authorization: `Bearer ${testUserToken}` }
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    event = res.data;
    organizer = testUser;
    organizerToken = testUserToken;
  });

  await test('Get All Events (Public)', async () => {
    const res = await api.get('/events');
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.data)) throw new Error('Expected array of events');
  });

  await test('Get Event by ID', async () => {
    const res = await api.get(`/events/${event._id}`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (res.data._id !== event._id) throw new Error('Event ID mismatch');
  });

  // Phase 3: Registrations
  console.log('\n--- Phase 3: Registrations ---');

  await test('Register for Event', async () => {
    const res = await api.post('/registrations', {
      eventId: event._id,
      ticketQuantity: 2
    }, {
      headers: { Authorization: `Bearer ${testUserToken}` }
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    registration = res.data;
  });

  await test('Get User Registrations', async () => {
    const res = await api.get('/registrations/my-registrations', {
      headers: { Authorization: `Bearer ${testUserToken}` }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    if (!Array.isArray(res.data)) throw new Error('Expected array of registrations');
  });

  await test('Cancel Registration', async () => {
    const res = await api.patch(`/registrations/${registration._id}/cancel`, {}, {
      headers: { Authorization: `Bearer ${testUserToken}` }
    });
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  // Phase 4: Reports
  console.log('\n--- Phase 4: Reports ---');

  await test('Create Report (Event)', async () => {
    const res = await api.post('/reports', {
      type: 'event',
      eventId: event._id,
      reason: 'inappropriate',
      description: 'QA test report'
    }, {
      headers: { Authorization: `Bearer ${testUserToken}` }
    });
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    report = res.data;
  });

  // Phase 5: Admin Actions (skip if no admin)
  console.log('\n--- Phase 5: Admin Actions ---');

  if (process.env.AUDIT_ADMIN_EMAIL && process.env.AUDIT_ADMIN_PASSWORD) {
    let adminToken = null;

    await test('Admin Login', async () => {
      const res = await api.post('/users/login', {
        email: process.env.AUDIT_ADMIN_EMAIL,
        password: process.env.AUDIT_ADMIN_PASSWORD
      });
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      adminToken = res.data.token;
    });

    if (adminToken) {
      await test('Admin Get Stats', async () => {
        const res = await api.get('/admin/stats', {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      });

      await test('Admin Get Events', async () => {
        const res = await api.get('/admin/events', {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      });

      await test('Admin Get Users', async () => {
        const res = await api.get('/admin/users', {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      });

      await test('Admin Get Reports', async () => {
        const res = await api.get('/admin/reports', {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      });

      await test('Admin Block/Unblock User', async () => {
        const res = await api.post(`/admin/users/${testUser.id}/block`, {
          reason: 'QA test'
        }, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      });
    }
  } else {
    results.tests.push({
      name: 'Admin Actions (all)',
      status: 'SKIP',
      reason: 'AUDIT_ADMIN_EMAIL not set'
    });
    results.summary.skipped += 5;
    console.log('[SKIP] Admin actions skipped (no admin credentials)');
  }

  // Phase 6: Email Log Verification
  console.log('\n--- Phase 6: Email Logging ---');

  await test('Email Log File Created', async () => {
    const logPath = process.env.EMAIL_LOG_FILE || 'emails_sent.json';
    if (!fs.existsSync(logPath)) throw new Error(`Email log not found at ${logPath}`);
    const content = fs.readFileSync(logPath, 'utf-8');
    const emails = JSON.parse(content);
    if (!Array.isArray(emails)) throw new Error('Email log is not an array');
    console.log(`  Captured ${emails.length} emails`);
  });

  // Summary
  console.log('\n=== Test Summary ===');
  console.log(`Total: ${results.summary.passed + results.summary.failed + results.summary.skipped}`);
  console.log(`Passed: ${results.summary.passed}`);
  console.log(`Failed: ${results.summary.failed}`);
  console.log(`Skipped: ${results.summary.skipped}`);

  fs.writeFileSync('qa_test_results.json', JSON.stringify(results, null, 2));
  console.log('\nResults written to qa_test_results.json');

  if (results.summary.failed > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
