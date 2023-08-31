import "./App.css";
import React, { useEffect, useState } from "react";
import io from "socket.io-client";
import {base_url} from './baseUrl'
 
function App() {
  const [socket, setSocket] = useState(null);
  const [receivedMessages, setReceivedMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [downfiles, setDownFiles] = useState([]);
  const [progress,setProgress] = useState('0%')
  useEffect(() => {
    // Connect to the WebSocket server
    const newSocket = io(`${base_url}:3001`);
    newSocket.on("connect", () => {
      console.log("Connected to the server");
    });

    newSocket.on("send_message", (data) => {
      // Update the received messages
      setReceivedMessages((prevMessages) => [...prevMessages, data.message]);
    });
    // newSocket.on("file", (data) => {
    //   setDownFiles((prevFiles) => [...prevFiles, data]);
    // });
    newSocket.on("fileAvailable", (data) => {
      setDownFiles((prevFiles) => [...prevFiles, data]);
    });
    newSocket.on("uploadProgress", (data) => {
      setProgress(`${data}%`)
    });
    

    newSocket.on("disconnect", () => {
      console.log("Disconnected from the server");
    });

    setSocket(newSocket);

    // Clean up the WebSocket connection when the component unmounts
    return () => {
      if (newSocket) {
        newSocket.close();
      }
    };
  }, []);
  const sendMessage = () => {
    if (socket) {
      socket.emit("send_message", { message: text });
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) setFile(e.target.files[0]);
  };

  // const handleUpload = () => {
  //   if (file) {
  //     const reader = new FileReader();
  //     reader.onload = (event) => {
  //       const data = {
  //         filename: file.name,
  //         content: event.target.result,
  //       };
  //       console.log("file-data", data);
  //       socket.emit("file", data);
  //     };
  //     reader.readAsArrayBuffer(file);
  //   }
  // };

  // const handleDownload = (fileData) => {
  //   const blob = new Blob([new Uint8Array(fileData.content)]);
  //   const url = window.URL.createObjectURL(blob);
  //   const link = document.createElement("a");
  //   link.href = url;
  //   link.download = fileData.filename;
  //   link.click();
  //   window.URL.revokeObjectURL(url);
  // };

  const uploadFile = async () => {
    if (!file) return;
    setProgress(`${0}%`)
    const reader = new FileReader();
  
    reader.onload = async () => {
      const arrayBuffer = reader.result;
      const uint8Array = new Uint8Array(arrayBuffer);
  
      socket.emit('file', {
        filename: file.name,
        size: uint8Array.length,
      });
  
      const chunkSize = 16384;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        const chunk = uint8Array.subarray(i, i + chunkSize);
        socket.emit('chunk', chunk);
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
  
      socket.emit('fileEnd'); // Notify the server that the file upload is complete
    };
  
    reader.readAsArrayBuffer(file);
  };

  // const url = 'http://192.168.18.105:3001'
  const downloadFile = (filename) => {
    if (filename) {
      const downloadLink = document.createElement('a');
      
      downloadLink.href = `${base_url}:3001/uploads/${filename}`;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <div className="App">
      <input
        placeholder="Enter your message"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={sendMessage}>Send Message</button>
      <div>
        <input type="file" onChange={handleFileChange} />
        <button onClick={uploadFile}>Upload</button> <span>{progress}</span>
      </div>
      {receivedMessages.length > 0 &&
        receivedMessages?.map((item, ind) => <div key={ind}> {item} </div>)}

      <ul>
        {downfiles.map((fileData, index) => (
          <div>
            <span key={index}>{fileData.filename}</span>
            <button
              onClick={() => downloadFile(fileData.filename)}
              style={{
                backgroundColor: "green",
                color: "white",
                marginLeft: "10px",
                padding: "4px",
                cursor: "pointer",
              }}
            >
              Download
            </button>
          </div>
        ))}
      </ul>
    </div>
  );
}

export default App;
