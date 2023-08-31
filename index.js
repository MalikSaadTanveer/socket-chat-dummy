const express = require("express");
const app = express();
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const base_url  = require('./baseUrl')


app.use(cors());
const server = http.createServer(app);
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
const upload = multer({ storage: storage });

const io = new Server(server, {
  cors: {
    origin: `${base_url}:3000`,
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
    const { filename, size } = data;
    const fullname = `${Date.now()}-${filename}`
    const filePath = `uploads/${fullname}`;
    
    socket.on('chunk', (chunk) => {
      fs.appendFileSync(filePath, chunk);
      const uploadedBytes = fs.statSync(filePath).size;
      const progress = (uploadedBytes / size) * 100;
      socket.emit('uploadProgress', progress.toFixed(2));
    });

    socket.on('fileEnd', () => {
      console.log(`File ${filename} received`);
      socket.broadcast.emit('fileAvailable', {
        filename:fullname
      });
    });
  });
});

app.get('/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);

  if (fs.existsSync(filePath)) {
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(500).send('Error downloading the file');
      }
    });
  } else {
    res.status(404).send('File not found');
  }
});

server.listen(3001, () => {
  console.log(`server is running on ${base_url}:${3000}`);
});
