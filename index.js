const express = require('express');
const dbFunctions = require('./functions/db-functions');
const llm = require('./functions/llm-functions');
const Ollama = require("ollama");
const llweb = require("./functions/llama-web");
const cors = require('cors');
const https = require('https');
const fs = require('fs');

const app = express();
const port = 2077;
let registered = false;


async function run() {
  if (registered) return;
  registered = true;
  const ollama = new Ollama.Ollama();
  dbFunctions.initializeDB();
  dbFunctions.updateModelList();
  const data = await llweb.loadConfig();
  await llweb.register(data.api.url,"root@root.com","root@root.com")
  console.log(`Example app listening on port 2077`)
}

async function confirmAccess(token) {
  const data = llweb.loadConfig();
  if (data.api.accessToken == token) {
    return true;
  } else {
    return false;
  }
}

// app.all('/', function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "X-Requested-With");
//   next();
// });

app.use(express.json());

// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*"); // or specific domain
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
//   // express.json();
// });

// Add CORS middleware
app.use(cors({
  origin: 'https://your-vercel-app.vercel.app', // Replace with your Vercel app URL
  methods: ['GET', 'POST'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
  credentials: true, // If you need to allow cookies or authorization headers
}));

const options = {
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
};

// https.createServer(options, app).listen(port, () => {
//   console.log("Server running on https://localhost:2077");
// });

app.post('/', (req, res) => {
  console.log("GET request received");
  console.log(req.body);
  if (req.body.accessToken && confirmAccess(req.body.accessToken)) {
    res.json({success: true});
  } else {
    res.json({success: false});
  }
})

// app.post('/create', async (req, res) => {
//   try {
//     var modelname = req.body.modelname;
//     var chatname = await llm.createChat(modelname);
//     res.send(chatname);
//   } catch (e) {
//     res.send("error: "+e)
//   }
// })

// app.post('/chat', async (req, res) => {
//   try {
//     var chatname = req.body.chatname;
//     var message = req.body.message;
//     var response = await llm.chat(chatname, message);
//     res.send(response);
//   } catch (e) {
//     res.send("error: "+e)
//   }
// })

// app.post('/getmodellist', async (req, res) => {
//   try {
//     var modelList = await llm.getModelList();
//     res.send(modelList);
//   } catch (e) {
//     res.send("error: "+e)
//   }
// });

app.post('/getchatlist', async (req,res) => {
  try {
    if (confirmAccess(req.body.accessToken)) {
      var output = await llm.getChatList();;
      res.json({
        success: true,
        chatList: output
      });
    } else {
      res.json({success: false, message: "Access denied"});
    }
  } catch (e) {
    res.status(500).json({success: false, message: e});
  }
})

// app.post('/getchathistory', async (req,res) => {
//   try {
//     console.log(req.body.chatname)
//     output = await llm.getChatHistory(req.body.chatname);
//     res.send(output);
//   } catch (e) {
//     res.send("error: "+e)
//   }
// })

run()
.then(() => {

  console.log(1);

  // app.listen(port, '0.0.0.0', async () => {
  //   console.log("Server started on port 2077 with IPv4")
  // })

  console.log(2);

  // app.listen(port, '::', async () => {
  //   console.log("Server started on port 2077 with IPv6")
  // })

  console.log(3);

  https.createServer(options, app).listen(port, '0.0.0.0', () => {
    console.log("Server running on https://localhost:2077 (IPv4)");
  });
  
  console.log(4);
  
  https.createServer(options, app).listen(port, '::', () => {
    console.log("Server running on https://localhost:2077 (IPv6)");
  });
})