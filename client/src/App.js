import "./App.css";
import React, { useEffect, useState } from "react";
import axios from "axios";
import io from "socket.io-client";

function App() {
  const [socket, setSocket] = useState(null);
  const [receivedMessages, setReceivedMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [downfiles, setDownFiles] = useState([]);

  useEffect(() => {
    // Connect to the WebSocket server
    const newSocket = io("http://192.168.18.105:3001");
    newSocket.on("connect", () => {
      console.log("Connected to the server");
    });

    newSocket.on("send_message", (data) => {
      // Update the received messages
      setReceivedMessages((prevMessages) => [...prevMessages, data.message]);
    });
    newSocket.on("file", (data) => {
      setDownFiles((prevFiles) => [...prevFiles, data]);
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

  const handleUpload = () => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = {
          filename: file.name,
          content: event.target.result,
        };
        console.log("file-data", data);
        socket.emit("file", data);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleDownload = (fileData) => {
    const blob = new Blob([new Uint8Array(fileData.content)]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileData.filename;
    link.click();
    window.URL.revokeObjectURL(url);
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
        <button onClick={handleUpload}>Upload</button>
      </div>
      {receivedMessages.length > 0 &&
        receivedMessages?.map((item, ind) => <div key={ind}> {item} </div>)}

      <ul>
        {downfiles.map((fileData, index) => (
          <>
            <span key={index}>{fileData.filename}</span>
            <button
              onClick={() => handleDownload(fileData)}
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
          </>
        ))}
      </ul>
    </div>
  );
}

export default App;
