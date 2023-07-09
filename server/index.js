const path = require('path');
const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Serve static files from the "public" directory
app.use('/', express.static(path.resolve(path.join(__dirname, '/../dist/'))));

// Route for the homepage
app.get('/', (req, res) => {
  res.sendFile('index.html');
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle socket events
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Start the server
const port = 3000;
http.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
