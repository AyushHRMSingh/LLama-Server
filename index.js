const express = require('express');
const dbFunctions = require('./functions/db-functions');
const llm = require('./functions/llm-functions');
const Ollama = require("ollama");
const llweb = require("./functions/llama-web");

const app = express();
const port = 3000;

// const ollama = new Ollama.Ollama();
// dbFunctions.initializeDB();
// dbFunctions.updateModelList();

app.all('/', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

// app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // or specific domain
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
  express.json();
});


app.post('/', (req, res) => {
  console.log("GET request received");
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

// app.post('/getchatlist', async (req,res) => {
//   try {
//     var output = await llm.getChatList();
//     res.send(output);
//   } catch (e) {
//     res.send("error: "+e)
//   }
// })

// app.post('/getchathistory', async (req,res) => {
//   try {
//     console.log(req.body.chatname)
//     output = await llm.getChatHistory(req.body.chatname);
//     res.send(output);
//   } catch (e) {
//     res.send("error: "+e)
//   }
// })


app.listen(2077, '::', () => {
  const data = llweb.loadConfig();
  llweb.register(data.api.url,"root@root.com","root@root.com")
  console.log(`Example app listening on port 2077`)
})

async function confirmAccess(token) {
  const data = llweb.loadConfig();
  if (data.api.accessToken == token) {
    return true;
  } else {
    return false;
  }
}