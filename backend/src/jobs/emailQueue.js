const Queue = require('bull');
require('dotenv').config();

const REDIS_URL = process.env.REDIS_URL || process.env.REDIS_HOST || 'redis://127.0.0.1:6379';

let emailQueue;
try {
    emailQueue = new Queue('emailQueue', REDIS_URL, {
        // default settings; can be tuned via env
    });
} catch (err) {
    console.warn('Could not initialize Bull queue (missing redis or bull):', err.message || err);
    emailQueue = null;
}

const addEmailJob = async (payload) => {
    if (!emailQueue) throw new Error('Email queue not available');
    // Use basic options: 3 attempts, exponential backoff
    return emailQueue.add(payload, {
        attempts: Number(process.env.EMAIL_JOB_ATTEMPTS) || 3,
        backoff: {
            type: 'exponential',
            delay: 5000
        },
        removeOnComplete: true,
        removeOnFail: false
    });
};

module.exports = { addEmailJob, queueAvailable: !!emailQueue, emailQueue };
