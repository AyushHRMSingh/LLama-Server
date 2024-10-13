const crypto = require('crypto');
const fs = require('fs');

// Path to the configuration file
const configPath = 'config.json';

// Function to load the configuration
function loadConfig() {
  const data = fs.readFileSync(configPath, 'utf8');
  return JSON.parse(data);
}

function updateAccessToken(token) {
  var data = fs.readFileSync(configPath, 'utf8');
  data = JSON.parse(data);
  data.api.accessToken = token;
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
};

// Function to generate a random access token for registration
function generateRandomToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Function to register with teh main web server as a client server
function register(url,email,password) {
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
        accessToken: token
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success == true) {
        console.log("registration successfull");
        updateAccessToken(token);
        return data,token;
      } else {
        console.log("registration unsuccessfull");
        updateAccessToken(token);
        return null;
      }
    })
  } catch (e) {
    console.log("errores");
    console.log(e);
  }
};

// Function to ping the main web server and update IP values every time it comes online
function update(url) {};

module.exports = { loadConfig, register, update, loadConfig, updateAccessToken };