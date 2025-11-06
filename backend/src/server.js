const app = require('./app');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { initializeSocket } = require('./sockets/chatSocket');
require('dotenv').config();

const port = process.env.PORT || 3000;
const server = createServer(app);

// Initialize socket.io
initializeSocket(server);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        server.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    });