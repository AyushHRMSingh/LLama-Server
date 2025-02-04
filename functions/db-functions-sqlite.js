const Ollama = require("ollama")
const sqlite = require('sqlite3');

const ollama = new Ollama.Ollama();
const db = new sqlite.Database('./SelhoLLama.db');

// Database operations run on application or database startup
async function initializeDB() {

    // DEBUG TABLE CREATE COMMANDS
    // commandlist =[
    //     "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT UNIQUE);",
    //     "CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL);",
    //     "CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, total REAL);",
    //     "CREATE TABLE order_items (id INTEGER PRIMARY KEY, order_id INTEGER, product_id INTEGER, quantity INTEGER);",
    //     "CREATE TABLE reviews (id INTEGER PRIMARY KEY, user_id INTEGER, product_id INTEGER, rating INTEGER);",
    // ]
    // await commandlist.map(command => {
    //     console.log(command);
    //     db.exec(command, (err) => {
    //         if (err) {
    //             console.log(err);
    //         }
    //     })
    // })


    let tablelist = await new Promise((resolve, reject) => {
        // let list2 = []
        db.all("SELECT name FROM sqlite_master WHERE type='table';",[],(err, rows) => {
            if (err) {
                reject(err)
            }
            resolve(rows.map(row => row.name))
        })
    })
    console.log(tablelist);
    ideal = ['Chats', 'Models'];


}

// Function to check ollama and update the lsit of models in the database
async function updateModelList() {
    try{
        data = await ollama.list();
        console.log(data);
        for (var i in data["models"]) {
            // Name:data["models"][i]["name"],
            // Model:data["models"][i]["model"],
            
		}
		return
    } catch(e) {
        console.log(e)
    }
}

async function createChat(modelName, chatName) {}

async function checkChats() {}

async function deleteChat(chatName) {}

async function checkIfChatExists(chatName) {}

async function testFunction() {}

async function addConversation() {}

async function getChatList() {}

async function getChatHistory(chatName) {}

// module.exports = { testFunction, createChat, checkChats, deleteChat, initializeDB, updateModelList, checkIfChatExists, addConversation, db, getModelFromChat, getChatList, getChatHistory};

initializeDB()
// updateModelList()