const { configDotenv } = require("dotenv");
const { MongoClient } = require("mongodb");
const Ollama = require("ollama")

configDotenv();
connection_uri = process.env.CONNECTION_STRING;
const client = new MongoClient(connection_uri);
const db = client.db("llama-db");
const modelCollection = db.collection("modelCollection");
const chatCollection = db.collection("chatCollection");
const ollama = new Ollama.Ollama();

// Start function to initialize the database
async function initializeDB() {
	try {
		await client.connect();
		console.log("connection successful");
	} catch {
		console.log("Errored out");
	}
}

// function to update the list of models in the database
async function updateModelList() {
	try{
		modelCollection.deleteMany({});
		data = await ollama.list();
		console.log(data);
		for (var i in data["models"]) {
			modelCollection.insertOne({
				Name:data["models"][i]["name"],
				Model:data["models"][i]["model"],
			})
		}
		return
	} catch(e) {
		// error.log(e)
		console.log("Error encountered: ", e)
	}

}

// create a chat if doesnt already exist
async function createChat(modelName, chatName) {
	try {
		// check for valid modename
		console.log("modelcheck")
		modelExists = await modelCollection.find({
			Name : modelName,
		}).toArray();
		console.log("modelExists");
		console.log(modelExists.length);
		if (modelExists.length == 0) {
			return {
				success:false,
				output:"invalid model provided"
			}
		}

		console.log("chatcheck")
		// check if chatname is unique
		chatExists = await chatCollection.find({
			Title : chatName,
		}).toArray();
		if (chatExists.length != 0) {
			return {
				success:false,
				output:"Sorry Chat already exists"
			}
		}
		console.log("creating chat");
		console.log(chatName, modelName)
		await db.createCollection(chatName);
		await chatCollection.insertOne({
			ChatId: chatName, 
			Title : chatName,
			Model: modelName,
		})
		return {
			success:true,
			output:"Chat Created Successfully"
		}
	} catch (e) {
		// error.log(e)
		return {
			success:false,
			output:"Function Error: "+e,
		}
	}
}

async function checkChats() {
	try {
		const chatTableList = await chatCollection.find({}).project({Title:1, _id:0}).toArray();
		for (var i in chatTableList) {
			console.log(chatTableList[i] = chatTableList[i]["Title"])
		}
		console.log(chatTableList)
		// const chatDBList = await db.listCollections().toArray();
		const chatDBList = await db.runCursorCommand({listCollections:1, nameOnly:true}).toArray();
		for (var i in chatDBList) {
			console.log(chatDBList[i] = chatDBList[i]["name"])
		}
		console.log(chatDBList)
		for (var i in chatTableList) {
			console.log(chatDBList.includes(chatTableList[i]), chatTableList[i])
			if (chatDBList.includes(chatTableList[i]) == false) {
				console.log("deleting chat", chatTableList[i])
				await chatCollection.deleteOne({
					Title:chatTableList[i],
				})
			}
		}
		return {
			success:true,
			output:"Chat Check Successful"
		}
	} catch (e) {
		console.log(e)
		return {
			success:false,
			output:"Function Error: "+e,
		}
	}
}

// Function to delete a chat
async function deleteChat(chatName) {
	try {
		//  delete chat from chatCollection and db
		await db.collection(chatName).drop();
		// delete chat from chatCollection Collection
		await chatCollection.deleteOne({
			Title:chatName,
		})
		// confirm chat deletion and confirm validity of all other chats
		await checkChats();
		return {
			success:true,
			output:"Chat Deleted Successfully"
		}
	} catch (e) {
		// error
		console.log(e)
		return {
			success:false,
			output:"Function Error: "+e,
		}
	}
}

// Function to check if the specified chat exists
async function checkIfChatExists(chatName) {
	const chatExists = await chatCollection.find({
		Title : chatName,
	}).toArray();
	console.log(chatExists);
	if (chatExists.length != 0) {
		// return true;
		modelname = chatExists[0]["Model"];
		console.log(modelname);
		var output = await modelCollection.find({}).project({_id:0}).toArray();
		console.log("outttie");
		console.log(output);
		var output = await modelCollection.find({
			Name:"gemma2:2b"
		}).project({_id:0}).toArray();
		console.log("outttie");
		console.log(output);
		if (output != 0) {
			return true;
		} else {
			return false;
		}
	}
}

async function testFunction() {
	await initializeDB();
	console.log("yoo initialized")
	await updateModelList();
	console.log("yoo done");
	const val = await createChat("qwen2:0.5b", "uniqueapp");
	console.log(val);
	var stuff = await checkIfChatExists("uniqueapp");
	console.log(stuff);
	const val2 = await checkChats();
	console.log(val2);
	var stuff = await checkIfChatExists("uniqueapp");
	console.log(stuff);
}

// Function to add a conversation to the chatlist and the database
async function addConversation(chatName, prompt, response) {
	try {
		await db.collection(chatName).insertMany([
			{
				usertype:"user",
				message:prompt,
			},
			{
				usertype:"system",
				message:response,
			}
		])
		return {
			success:true,
			output:"Conversation Added Successfully"
		}
	} catch (e) {
		console.log(e)
		return {
			success:false,
			output:"Function Error: "+e,
		}
	}
};

// Function to get the model name from the chat name
async function getModelFromChat(chatName) {
	console.log(chatName)
	var modelname = await chatCollection.find({
		Title : chatName,
	}).project({_id:0}).toArray();
	if (modelname.length == 0) {
		return {
			success:false,
			output:"Chat does not exist",
		}
	}
	modelname = modelname[0]["Model"];
	console.log("modelnamea");
	console.log(modelname);
	return {
		success:true,
		output:modelname,
	}
}

async function getChatList() {
	const chatList = await chatCollection.find({}).project({_id:0}).toArray();
	return chatList;
}

async function getChatHistory(chatName) {
	var colhistory = []
	colhistory = (await db.collection(chatName).find({}).project({_id:0}).toArray()).map(i => {
		return {
			role:i["usertype"],
			content:i["message"],
		}
	})
	return colhistory
}

module.exports = { testFunction, createChat, checkChats, deleteChat, initializeDB, updateModelList, checkIfChatExists, addConversation, db, getModelFromChat, getChatList, getChatHistory};