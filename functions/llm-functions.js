const dbFunctions = require('./db-functions');
const Ollama = require("ollama")
const uuid = require("uuid");

const ollama = new Ollama.Ollama();

async function chat(chatName, message) {
  try {
    if (await dbFunctions.checkIfChatExists(chatName)) {
      const result = await dbFunctions.getModelFromChat(chatName);
      if (result.success == false) {
        return {
          success:false,
          output:result.output,
        }
      } else {
        var model = result.output;
      }
      var colhistory = []
      colhistory = await dbFunctions.getChatHistory(chatName);
      console.log("type offff")
      console.log(colhistory)
      
      colhistory.push({
        role:"user",
        content:message,
      })
      console.log("colhistory");
      console.log(colhistory);
      var response = await ollama.chat({
        model: model,
        messages: colhistory,
        stream:false,
      });
      console.log("colhistory2");
      console.log(response);
      response = response.message.content;
      colhistory.push({
        role:"system",
        content:response,
      })
      console.log(colhistory);
      await dbFunctions.addConversation(chatName, message, response);
      return {
        success:true,
        output:response,
      }
    } else {
      return {
        success:false,
        output:"Chat does not exist",
      }
    }
  } catch (e) {
    console.log(e)
    return {
      success:false,
      output:"Function Error: "+e,
    }
  }
}

async function createChat(modelName) {
  try {
    var chatName = uuid.v4();
    if (dbFunctions.checkIfChatExists(chatName)) {
      var output = await dbFunctions.createChat(modelName, chatName);
      if (output.success == false) {
        return {
          success:false,
          output:output.output,
        }
      }
      return {
        success:true,
        id:chatName,
      }
    } else {
      return {
        success:false,
        output:"Chat already exists",
      }
    }
  } catch (e) {
    console.log(e)
    return {
      success:false,
      output:"Function Error: "+e,
    }
  }
};

async function getModelList() {
  data = await ollama.list();
  modelarr = []
  console.log(data);
  for (var i in data["models"]) {
    modelarr.push({
      Name:data["models"][i]["name"],
      Model:data["models"][i]["model"],
    })
  }
  dbFunctions.updateModelList();
  return modelarr;
}

async function getChatList() {
  try {
    var chatList = await dbFunctions.getChatList();
    return chatList;
  } catch (e) {
    console.log(e)
    return {
      success:false,
      output:"Function Error: "+e,
    }
  }
}

async function getChatHistory(chatname) {
  try {
    var chatHistory = await dbFunctions.getChatHistory(chatname);
    return chatHistory;
  } catch (e) {
    console.log(e)
    return {
      success:false,
      output:"Function Error: "+e,
    }
  }
}

module.exports = { createChat, chat, getModelList, getChatList, getChatHistory };


