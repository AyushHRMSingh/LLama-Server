const crypto = require('crypto');
const fs = require('fs');

// Path to the configuration file
const configPath = 'config.json';

// Function to load the configuration
function loadConfig() {
  try {
    const data = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(data);
  } catch {
    console.log("Error reading config file");
    return null;
  }
}

// function to update the API's Access token used to interact with Resource Server
function updateApiAccessToken(token) {
  try {
    var data = fs.readFileSync(configPath, 'utf8');
    data = JSON.parse(data);
    data.api.accessToken = token;
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
  } catch {
    console.log("Error updating api access token");
    return null;
  }
};

// Function to update the SERVER's Access token used to interact with Firebase for authentication
function updateServerAccessToken(token) {
  try {
    var data = fs.readFileSync(configPath, 'utf8');
    data = JSON.parse(data);
    data.server.accessToken = token;
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
  } catch {
    console.log("Error updating server access token");
    return null;
  }
}

// Function to generate a random access token for registration
function generateRandomToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Function to register with teh main web server as a client server
function register(url,email,password, serverUrl) {
  try{
    const token  = generateRandomToken();
    fetch(url + '/api/registration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password,
        accessToken: token,
        serverUrl: serverUrl
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success == true) {
        console.log("registration successfull");
        updateServerAccessToken(data.details.stsTokenManager.refreshToken)
        updateApiAccessToken(token);
        return data,token;
      } else {
        console.log("registration unsuccessfull");
        updateApiAccessToken(token);
        return null;
      }
    })
  } catch (e) {
    console.log("errores");
    console.log(e);
  }
};

// Function to ping the main web server and update IP values every time it comes online
function update(url) {
  
};

module.exports = { loadConfig, register, update, loadConfig, updateApiAccessToken };