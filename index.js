const express = require('express');
const dbFunctions = require('./functions/db-functions');
const llm = require('./functions/llm-functions');
const Ollama = require("ollama");
const llweb = require("./functions/llama-web");
const cors = require('cors');
const ngrok = require('ngrok');

const app = express();


async function run() {
  var url = "";
  const ollama = new Ollama.Ollama();
  dbFunctions.initializeDB();
  dbFunctions.updateModelList();
  const data = await llweb.loadConfig();
  console.log("functions initialized");
  const port = process.env.port;

  // START SERVICE
  app.listen(port?port:2077, '0.0.0.0', async () => {
    console.log("Server started on port 2077 with IPv4")
  })
  app.listen(port?port:2077, '::', async () => {
    console.log("Server started on port 2077 with IPv6")
  })

  if (process.env.custom?true:false) {
    console.log("Custom port detected");
    const port = process.env.port;
    app.listen(port, async () => {
      console.log("Server started on port 2077 with IPv4")
    })
    return "http://localhost:"+port;
  } else {
    console.log("No custom port detected");
    url = await ngrok.connect({proto: 'http', addr: 2077});
  }


  // CHECK IF ALREADY REGISTERED
  // if (!data.api.accessToken) {
  //   const token = await llweb.register(data.server.url,"root@root.com","root@root.com", url);
  // } else {
  //   console.log(data.api.accessToken);
  //   console.log("Already registered");
  //   // create and add update functions
  // }

  // TEMP DEBUGGING LINE
  const token = await llweb.register(data.server.url,"root@root.com","root@root.com", url);
  console.log("url: "+url);
  return url;
}

async function confirmAccess(token) {
  const data = llweb.loadConfig();
  if (data.api.accessToken == token) {
    return true;
  } else {
    return false;
  }
}

app.use(express.json());

// Add CORS middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
  credentials: true,
}));


app.post('/', (req, res) => {
  console.log("GET request received");
  console.log(req.body);
  if (req.body.accessToken && confirmAccess(req.body.accessToken)) {
    res.json({success: true});
  } else {
    res.json({success: false});
  }
})

// app startup
run()