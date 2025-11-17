const app = require('./src/app');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { initializeSocket } = require('./src/sockets/chatSocket');
const client = require('prom-client');
const logger = require('./src/utils/logger');
require('dotenv').config();

const port = process.env.PORT || 3000;
const server = createServer(app);

// Prometheus metrics: collect default metrics
client.collectDefaultMetrics();

// Health endpoint
app.get('/health', async (req, res) => {
    const mongoState = mongoose.connection.readyState; // 1 = connected
    const healthy = mongoState === 1;
    res.json({ status: healthy ? 'ok' : 'unhealthy', mongoState });
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
    try {
        res.set('Content-Type', client.register.contentType);
        res.end(await client.register.metrics());
    } catch (err) {
        logger.error({ err }, 'Failed to collect metrics');
        res.status(500).end();
    }
});

// Initialize socket.io
initializeSocket(server);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        logger.info('Connected to MongoDB');
        server.listen(port, () => {
            logger.info({ port }, 'Server is running');
        });
    })
    .catch((error) => {
        logger.error({ error }, 'Error connecting to MongoDB');
        process.exit(1);
    });