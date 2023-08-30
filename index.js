const express = require("express");
const app = express();
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const multer = require('multer');



app.use(cors());
const server = http.createServer(app);
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const io = new Server(server, {
  cors: {
    origin: "http://192.168.18.105:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`Ids connected ${socket.id}`);                                                      
  socket.on("send_message",(data)=>{
    console.log(data)
    socket.broadcast.emit('send_message',data)
  })

  socket.on('file', (data) => {
    console.log('Received file:', data.filename);
    socket.broadcast.emit('file', data); // Broadcast the file to all connected clients
  });
});



server.listen(3001, () => {
  console.log(`server is running on http://localhost:${3001}`);
});
