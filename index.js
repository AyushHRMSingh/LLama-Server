import express from "express"
import * as dbFunctions from './functions/db-functions.js';
import * as llm from './functions/llm-functions.js';
import { Ollama } from "ollama";
import * as llweb from "./functions/llama-web.js";
import cors from 'cors';
import ngrok from 'ngrok';

const app = express();


async function run() {
  var url = "";
  const ollama = new Ollama();
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

// Debugging ALL port
app.post('/', (req, res) => {
  console.log("GET request received");
  if (req.body.accessToken && confirmAccess(req.body.accessToken)) {
    res.json({success: true});
  } else {
    res.json({success: false});
  }
})

// Route to retrieve Model list
app.post('/modellist', async (req,res) => {
  console.log("retrieving model list")
  var modelList = await llm.getModelList();
  if (req.body.accessToken && confirmAccess(req.body.accessToken)) {
    res.json({
      success: true,
      list: modelList
    });
  } else {
    res.json({success: false});
  }
})

// Route to retrieve Chat List
app.post('/chatlist', async (req,res) => {
  console.log("retrieving chat list")
  var chatList = await llm.getChatList();
  if (req.body.accessToken && confirmAccess(req.body.accessToken)) {
    res.json({
      success: true,
      list: chatList
    });
  } else {
    res.json({success: false});
  }
})

// Route to create a new Chat
app.post('/createchat', async (req,res) => {
  console.log("creating new chat")
  if (req.body.accessToken && confirmAccess(req.body.accessToken)) {
    const response = await llm.createChat(req.body.model);
    if (response.success == true) {
      console.log({
        sucess:true,
        chatId:response.id
      })
      res.json({
        sucess:true,
        chatId:response.id
      });
    } else {
      console.log("failed for somereason")
      res.json({
        success: false
      });
    }
  } else {
    res.json({success: false});
  }
})

app.post('/chathistory', async (req, res) => {
  console.log('getting chat history');
  console.log(req.body.chatid);
  if (req.body.accessToken && confirmAccess(req.body.accessToken)) {
    const history = await llm.getChatHistory(req.body.chatid);
    const chathistory = history.output;
    if (history.success == true) {
      const returnval = {
        success: true,
        chathistory: chathistory
      }
      console.log(returnval.chathistory);
      res.json(returnval);
    } else {
      console.log("failed for somereason")
      res.json({})
    }
  } else {
    res.json({success: false});
  }
})

app.post('/chat', async (req,res) => {
  if (req.body.accessToken && confirmAccess(req.body.accessToken)) {
    
  } else {
    res.json({success: false});
  }
})

// app startup
run()