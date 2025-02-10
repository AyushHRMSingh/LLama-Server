import { Ollama } from 'ollama';
import sqlite3 from "sqlite3";


const ollama = new Ollama()
const db = new sqlite3.Database('./SelhoLLama.db');
// const ollama = new Ollama()
// const db = new sqlite3.Database('./SelhoLLama.db');

// Variables that stores all the base tables along with their sql create command
let ideal = {
    "Models":"CREATE TABLE Models (Name TEXT PRIMARY KEY, Model TEXT)", //List of Models
    "Chats":"CREATE TABLE Chats (ChatId INT, Title TEXT, Model TEXT)" //List of Chats
};

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

    // Get list of all tables inside the DB
    
    let tablelist = await new Promise((resolve, reject) => {
        // let list2 = []
        db.all("SELECT name FROM sqlite_master WHERE type='table';",[],(err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows.map(row => row.name));
        })
    })

    // create a shallow copy to be edited
    let idealcopy = {...ideal};
    tablelist.forEach(table => {
        if (table in idealcopy) {
            delete idealcopy[table];
        }
    });
    
    // check if table missing, if true, create table
    if (Object.entries(idealcopy).length != 0) {
        console.log("following tables not found", idealcopy);
        for (let key in idealcopy) {
            db.exec(idealcopy[key], (err) => {
                if (err) {
                    console.log(err);
                }
            })
        }
    }

    // update model list
    updateModelList();

    // crosscheck chats
    checkChats();

}

// Function to check ollama and update the list of models in the database
async function updateModelList() {
    db.run("DELETE FROM Models");
    try{
        let data = await ollama.list();
        // console.log(data);
        for (let i in data["models"]) {
            let sql = "INSERT INTO Models (Name, Model) VALUES(?,?)"
            db.run(sql,data["models"][i]["name"], data["models"][i]["model"])
		}
		return
    } catch(e) {
        console.log(e)
    }
}

// Function to check that all the registered chat exist in the databse exist and vice versa
async function checkChats() {
    // Get list of all tables inside the DB
    let tablelist = await new Promise((resolve, reject) => {
        db.all("SELECT name FROM sqlite_master WHERE type='table';",[],(err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows.map(row => row.name));
        })
    })
    
    // remove base tables
    for (let table in ideal) {
        tablelist.splice(tablelist.indexOf(table),1);
    }

    // Get list of all chats from inside the DB
    let chatList = await new Promise((resolve,reject) => {
        db.all("SELECT * FROM Chats;",[],(err, rows) => {
            if (err) {
                reject(err);
            }
            resolve(rows.map(row => row.name));
        })
    })
    
    // iterate through chatlist and check if every chat history is in databse, if doesnt exist, remain in list for now
    for (let chat in chatList) {
        if (chat in tablelist) {
            console.log(chat," exists")
            tablelist.splice(tablelist.indexOf(chat),1);
            chatList.splice(chatList.indexOf(chat),1);
        } else {
            console.log(chat," doesnt exists")
        }
    }
    
    // delete for each non existent history in Chats table
    for (let chat in chatList) {
        try {
            db.run("DELETE * FROM Chats WHERE ChatId=?", chat);
        } catch(e) {
            console.log(e);
        }
    }

    // delete for each floating history (i.e. history exists but entry)
    let sql = "";
    for (let table in tablelist) {
        sql = `DROP TABLE ${table}`;
        db.exec(sql, (err) => {
            if (err) {
                console.log(err);
            }
        })
    }

}

// Function to create a chat with an LLM if doesn't already exist
async function createChat(modelName, chatId) {
    // Check if Chat exists
    let chatExists = await new Promise((resolve, reject)=> {
        db.all(`SELECT * FROM Chats WHERE ChatId=${chatId};`,[],(err, rows) => {
            if (err) {
                console.log("ERROR")
                console.log(err)
                reject(err);
            }
            console.log(rows.map(row=>row.Title))
            resolve(rows.map(row=>row.Title))
        });
    })
    
    // if chat exists
    if (chatExists.length != 0) {
        console.log("chat already exists");
        return {
            "success":false,
            "resons":"Chat exists"
        }
    }

    // if chat doesnt already exist, create new one
    // Add chat entry into Chats Table
    console.log("creating chat");
    console.log(chatId, modelName)
    db.exec(`INSERT INTO Chats (ChatId, Title, Model) VALUES ("${chatId}", "${chatId}", "${modelName}");`)
    // Adding 
    
}

async function deleteChat(chatName) {}

async function checkIfChatExists(chatName) {}

async function testFunction() {}

async function addConversation() {}

async function getChatList() {}

async function getChatHistory(chatName) {}

// module.exports = { testFunction, createChat, checkChats, deleteChat, initializeDB, updateModelList, checkIfChatExists, addConversation, db, getModelFromChat, getChatList, getChatHistory};

await initializeDB()
createChat("deepseek-r1:8b","578856446789088")