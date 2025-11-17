const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

const sendEmail = async ({ to, subject, text, html }) => {
    // Log email to file if EMAIL_LOG_FILE is set (useful for testing without SMTP)
    if (process.env.EMAIL_LOG_FILE) {
        const logPath = path.resolve(process.env.EMAIL_LOG_FILE);
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            to,
            subject,
            text: text || '',
            html: html || ''
        };

        try {
            let logs = [];
            if (fs.existsSync(logPath)) {
                const content = fs.readFileSync(logPath, 'utf-8');
                logs = JSON.parse(content);
            }
            logs.push(logEntry);
            fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));
            console.log(`Email logged to ${logPath}`);
        } catch (err) {
            console.warn('Failed to write email log:', err.message);
        }
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('SMTP credentials not set - skipping sending email');
        return;
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
        console.log('Email sent:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = { sendEmail, transporter };