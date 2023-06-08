const express = require("express");
const app = express();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const port = 3000;
const fs = require('fs');

mongoose.connect('mongodb://127.0.0.1:27017/AuthARity', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB', err);
  });

  // app.set('view engine', 'ejs');
  // app.set('views', path.join(__dirname, 'views'));
  

let collectedKeystrokes = [];
let latitude, longitude, mean, variance;
app.use(express.json());
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

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    let user = await User.findOne({ username });
    if (!user) {
      console.error('User not found', err);
      res.status(401).json({ error: 'User not found' });
      return;
    }
    if (user && password === user.password) {
      const payload = {
        userId: user._id
      };
      const token = jwt.sign(payload, 'abcdefgh');
      res.cookie('token', token, { httpOnly: true });
      return res.redirect('/dashboard');
    } 
    else 
    {
      return res.status(200).json({ error: 'Invalid Password' });
    }
  } catch (err) {
    console.error('Error authenticating user', err);
    return res.status(500).send('Internal Server Error');
  }
});

app.post('/register', async (req, res) => {
  const { name, username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    const newUser = new User({
      name,
      username,
      email,
      password
    });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Error registering user' });
  }
});
