const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { addEmailJob, queueAvailable } = (() => {
    try {
        // require lazily to avoid hard failure if Bull not installed or Redis not configured
        return require('../jobs/emailQueue');
    } catch (err) {
        return { addEmailJob: null, queueAvailable: false };
    }
})();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const _logEmail = async (entry) => {
    if (!process.env.EMAIL_LOG_FILE) return;
    const logPath = path.resolve(process.env.EMAIL_LOG_FILE);
    try {
        let logs = [];
        if (fs.existsSync(logPath)) {
            const content = fs.readFileSync(logPath, 'utf-8');
            logs = JSON.parse(content || '[]');
        }
        logs.push(entry);
        fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
    } catch (err) {
        console.warn('Failed to write email log:', err.message);
    }
};

const sendEmailImmediate = async ({ to, subject, text, html }) => {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, to, subject, text: text || '', html: html || '' };
    await _logEmail(logEntry);

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('SMTP credentials not set - skipping sending email');
        return null;
    }

    const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
        html
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent:', info && info.messageId ? info.messageId : '(no id)');
        return info;
    } catch (error) {
        console.error('Error sending email:', error && error.message ? error.message : error);
        throw error;
    }
};

const enqueueEmail = async (payload) => {
    // If queue explicitly enabled and available, add job
    const enabled = (process.env.EMAIL_QUEUE_ENABLED || '').toLowerCase() === 'true';
    if (enabled && addEmailJob && queueAvailable) {
        try {
            await addEmailJob(payload);
            return { queued: true };
        } catch (err) {
            console.warn('Failed to enqueue email job, falling back to immediate send:', err.message);
            return sendEmailImmediate(payload);
        }
    }

    // Fallback to immediate send
    return sendEmailImmediate(payload);
};

module.exports = { sendEmailImmediate, enqueueEmail, transporter };