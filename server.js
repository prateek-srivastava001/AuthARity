const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const port = 3000;
const os = require('os');
const fs = require('fs');

let collectedKeystrokes = [];
let latitude, longitude, mean, variance;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "views")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.post("/keystrokes", (req, res) => {
  const durations = req.body.durations;
  const location = req.body.location;
  latitude = location ? location.latitude : null;
  longitude = location ? location.longitude : null;
  calculateMeanVariance(durations);
  console.log("Data Received");
  console.log();
  res.sendStatus(200);
  ipAddr(); 
});

function calculateMeanVariance(values) {
  const sum = values.reduce((acc, val) => acc + val, 0);
  mean = sum / values.length;

  const squaredDifferences = values.map((val) => Math.pow(val - mean, 2));
  variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / values.length;
}

app.get("/keystrokes", (req, res) => {
  res.json(collectedKeystrokes);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});


function convertIpToNumber(ipAddress) {
    const ipParts = ipAddress.split('.');
    let convertedIp = '';
  
    ipParts.forEach((part) => {
      convertedIp += part;
    });
  
    return parseInt(convertedIp, 10);
  }
  
  
    
async function ipAddr() {
  try {
    const response = await fetch("https://api.ipify.org/?format=json");
    const data = await response.json();
    const ipAddress = data.ip;
    const ipNumber = convertIpToNumber(ipAddress);
    const jsonData = JSON.stringify(
        [
          latitude,
          longitude,
          mean,
          variance,
          ipNumber
        ],
        null,
        2
      );
      

    fs.writeFile('./json-files/combinedData.json', jsonData, 'utf8', (err) => {
      if (err) {
        console.error('Error writing JSON file:', err);
      } else {
        console.log('Combined JSON file created successfully.');
      }
    });
  } catch (error) {
    console.error("Error:", error);
  }
}
