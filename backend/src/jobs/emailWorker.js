require('dotenv').config();
const { emailQueue } = require('./emailQueue');
const { sendEmailImmediate } = require('../utils/email');

if (!emailQueue) {
    console.error('Email queue not available. Ensure Redis is running and REDIS_URL is set.');
    process.exit(1);
}

emailQueue.process(async (job) => {
    const payload = job.data;
    try {
        await sendEmailImmediate(payload);
        return Promise.resolve();
    } catch (err) {
        console.error('Email job failed:', err && err.message ? err.message : err);
        throw err;
    }
});

emailQueue.on('completed', (job) => {
    console.log('Email job completed:', job.id);
});

emailQueue.on('failed', (job, err) => {
    console.warn('Email job failed:', job.id, err && err.message ? err.message : err);
});

console.log('Email worker started. Listening for jobs...');
