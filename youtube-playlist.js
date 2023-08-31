const express = require('express');
const { google } = require('googleapis');
const cors = require("cors");

const app = express();
const port = process.env.PORT || 4000;
app.use(cors());
app.use(express.json())
const apiKey = 'AIzaSyCjfnjimiT96yFr5BlbwurJ40_eMab9P6s'; // Replace with your API key

const youtube = google.youtube('v3');

app.get('/playlist-duration/:id', async (req, res) => {
    console.log("hello")
    try {
      const playlistId = req.params.id
    const totalDuration = await calculatePlaylistDuration(playlistId);
    const duration = formatDuration(totalDuration)
    res.json({ duration });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred' });
  }
});

app.get('/',async (req, res)=>{
    console.log("hell")
    res.json({ status:"Hello" })
})

async function getPlaylistItems(playlistId, pageToken) {
    const response = await youtube.playlistItems.list({
      auth: apiKey,
      part: 'contentDetails',
      maxResults: 50,
      playlistId: playlistId,
      pageToken: pageToken,
    });
  
    return {
      items: response.data.items,
      nextPageToken: response.data.nextPageToken,
    };
  }
  
  async function getVideoDetails(videoId) {
    const response = await youtube.videos.list({
      auth: apiKey,
      part: 'contentDetails',
      id: videoId,
    });
  
    return response.data.items[0].contentDetails;
  }
  
  async function calculatePlaylistDuration(playlistId) {
    let totalDuration = 0;
    let nextPageToken = null;
  
    do {
      const { items, nextPageToken: newPageToken } = await getPlaylistItems(
        playlistId,
        nextPageToken
      );
  
      for (const item of items) {
        const videoId = item.contentDetails.videoId;
        const videoDetails = await getVideoDetails(videoId);
        const videoDuration = videoDetails.duration;
        const durationInSeconds = parseDurationToSeconds(videoDuration);
        totalDuration += durationInSeconds;
      }
  
      nextPageToken = newPageToken;
    } while (nextPageToken);
  
    return totalDuration;
  }
  
  function parseDurationToSeconds(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = (parseInt(match[1]) || 0);
    const minutes = (parseInt(match[2]) || 0);
    const seconds = (parseInt(match[3]) || 0);
    return hours * 3600 + minutes * 60 + seconds;
  }

  function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
  
    const formatted = `${hours}h ${minutes}m ${remainingSeconds}s`;
  
    return formatted;
  }
  

app.listen(4000, () => {
  console.log(`API server is running on port ${4000}`);
});
