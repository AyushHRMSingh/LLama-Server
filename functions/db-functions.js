import { configDotenv } from "dotenv";
import sqlite3 from "sqlite3";
import { Ollama } from "ollama";

configDotenv();
const db = new sqlite3.Database('./SelhoLLama.db');
const ollama = new Ollama();

// Variables that stores all the base tables along with their sql create command
let ideal = {
    "Models": "CREATE TABLE Models (Name TEXT PRIMARY KEY, Model TEXT)", // List of Models
    "Chats": "CREATE TABLE Chats (ChatId TEXT, Title TEXT, Model TEXT)" // List of Chats
};

// Start function to initialize the database
async function initializeDB() {
    try {
        // Get list of all tables inside the DB
        let tablelist = await new Promise((resolve, reject) => {
            db.all("SELECT name FROM sqlite_master WHERE type='table';", [], (err, rows) => {
                if (err) {
                    reject(err);
                }
                resolve(rows.map(row => row.name));
            });
        });

        // Create a shallow copy to be edited
        let idealcopy = {...ideal};
        tablelist.forEach(table => {
            if (table in idealcopy) {
                delete idealcopy[table];
            }
        });
        
        // Check if table missing, if true, create table
        if (Object.entries(idealcopy).length != 0) {
            for (let key in idealcopy) {
                await new Promise((resolve, reject) => {
                    db.exec(idealcopy[key], (err) => {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });
                });
            }
        }

        // Update model list
        await updateModelList();

        // Cross-check chats
        await checkChats();
        
        return {
            success: true,
            output: "Database initialized successfully"
        };
    } catch (e) {
        return {
            success: false,
            output: "Initialization error: " + e
        };
    }
}

// Function to update the list of models in the database
async function updateModelList() {
    try {
        await new Promise((resolve, reject) => {
            db.run("DELETE FROM Models", [], (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });

        const data = await ollama.list();
        
        for (let i in data["models"]) {
            await new Promise((resolve, reject) => {
                let sql = "INSERT INTO Models (Name, Model) VALUES(?,?)";
                db.run(sql, [data["models"][i]["name"], data["models"][i]["model"]], (err) => {
                    if (err) {
                        reject(err);
                    }
                    resolve();
                });
            });
        }
        
        return {
            success: true,
            output: "Model list updated successfully"
        };
    } catch (e) {
        return {
            success: false,
            output: "Error updating model list: " + e
        };
    }
}

// Create a chat if doesn't already exist
async function createChat(modelName, chatName) {
    try {
        // Check for valid model name
        const modelExists = await new Promise((resolve, reject) => {
            db.all("SELECT * FROM Models WHERE Name = ?", [modelName], (err, rows) => {
                if (err) {
                    reject(err);
                }
                resolve(rows);
            });
        });

        if (modelExists.length == 0) {
            return {
                success: false,
                output: "Invalid model provided"
            };
        }

        // Check if chatname is unique
        const chatExists = await new Promise((resolve, reject) => {
            db.all("SELECT * FROM Chats WHERE Title = ?", [chatName], (err, rows) => {
                if (err) {
                    reject(err);
                }
                resolve(rows);
            });
        });

        if (chatExists.length != 0) {
            return {
                success: false,
                output: "Sorry Chat already exists"
            };
        }

        // Create chat table
        await new Promise((resolve, reject) => {
            const createTableSQL = `CREATE TABLE "${chatName}" (usertype TEXT, message TEXT)`;
            db.exec(createTableSQL, (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });

        // Insert chat info
        await new Promise((resolve, reject) => {
            const insertSQL = "INSERT INTO Chats (ChatId, Title, Model) VALUES (?, ?, ?)";
            db.run(insertSQL, [chatName, chatName, modelName], (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });

        return {
            success: true,
            output: "Chat Created Successfully"
        };
    } catch (e) {
        return {
            success: false,
            output: "Function Error: " + e
        };
    }
}

// Check validity for different chats and if they don't exist then delete entries
async function checkChats() {
    try {
        // Get list of all tables inside the DB
        const tablelist = await new Promise((resolve, reject) => {
            db.all("SELECT name FROM sqlite_master WHERE type='table';", [], (err, rows) => {
                if (err) {
                    reject(err);
                }
                resolve(rows.map(row => row.name));
            });
        });
        
        // Remove base tables
        const chatTables = tablelist.filter(table => !Object.keys(ideal).includes(table));
        
        // Get list of all chats from inside the DB
        const chatList = await new Promise((resolve, reject) => {
            db.all("SELECT Title FROM Chats", [], (err, rows) => {
                if (err) {
                    reject(err);
                }
                resolve(rows.map(row => row.Title));
            });
        });
        
        // Delete entries from Chats table if the corresponding table doesn't exist
        for (const chat of chatList) {
            if (!chatTables.includes(chat)) {
                await new Promise((resolve, reject) => {
                    db.run("DELETE FROM Chats WHERE Title = ?", [chat], (err) => {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });
                });
            }
        }
        
        // Delete chat tables that don't have entries in the Chats table
        for (const table of chatTables) {
            if (!chatList.includes(table)) {
                await new Promise((resolve, reject) => {
                    db.exec(`DROP TABLE "${table}"`, (err) => {
                        if (err) {
                            reject(err);
                        }
                        resolve();
                    });
                });
            }
        }
        
        return {
            success: true,
            output: "Chat Check Successful"
        };
    } catch (e) {
        return {
            success: false,
            output: "Function Error: " + e
        };
    }
}

// Function to delete a chat
async function deleteChat(chatName) {
    try {
        // Delete chat table
        await new Promise((resolve, reject) => {
            db.exec(`DROP TABLE IF EXISTS "${chatName}"`, (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
        
        // Delete chat from Chats table
        await new Promise((resolve, reject) => {
            db.run("DELETE FROM Chats WHERE Title = ?", [chatName], (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
        
        // Confirm chat deletion and confirm validity of all other chats
        await checkChats();
        
        return {
            success: true,
            output: "Chat Deleted Successfully"
        };
    } catch (e) {
        return {
            success: false,
            output: "Function Error: " + e
        };
    }
}

// Function to check if the specified chat exists
async function checkIfChatExists(chatName) {
    try {
        const chatExists = await new Promise((resolve, reject) => {
            db.all("SELECT * FROM Chats WHERE Title = ?", [chatName], (err, rows) => {
                if (err) {
                    reject(err);
                }
                resolve(rows);
            });
        });
        
        if (chatExists.length != 0) {
            const modelName = chatExists[0].Model;
            
            const modelExists = await new Promise((resolve, reject) => {
                db.all("SELECT * FROM Models WHERE Name = ?", [modelName], (err, rows) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(rows);
                });
            });
            
            if (modelExists.length != 0) {
                return true;
            }
        }
        
        return false;
    } catch (e) {
        return false;
    }
}

async function testFunction() {
    try {
        await initializeDB();
        await updateModelList();
        const createResult = await createChat("qwen2:0.5b", "uniqueapp");
        const chatExists = await checkIfChatExists("uniqueapp");
        const checkResult = await checkChats();
        const chatStillExists = await checkIfChatExists("uniqueapp");
        
        return {
            success: true,
            initialize: "Success",
            updateModelList: "Success",
            createChat: createResult,
            chatExists: chatExists,
            checkChats: checkResult,
            chatStillExists: chatStillExists
        };
    } catch (e) {
        return {
            success: false,
            output: "Test function error: " + e
        };
    }
}

// Function to add a conversation to the chatlist and the database
async function addConversation(chatName, prompt, response) {
    try {
        // Insert user message
        await new Promise((resolve, reject) => {
            const sql = `INSERT INTO "${chatName}" (usertype, message) VALUES (?, ?)`;
            db.run(sql, ["user", prompt], (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
        
        // Insert system response
        await new Promise((resolve, reject) => {
            const sql = `INSERT INTO "${chatName}" (usertype, message) VALUES (?, ?)`;
            db.run(sql, ["system", response], (err) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
        
        return {
            success: true,
            output: "Conversation Added Successfully"
        };
    } catch (e) {
        return {
            success: false,
            output: "Function Error: " + e
        };
    }
}

// Function to get the model name from the chat name
async function getModelFromChat(chatName) {
    try {
        const result = await new Promise((resolve, reject) => {
            db.all("SELECT Model FROM Chats WHERE Title = ?", [chatName], (err, rows) => {
                if (err) {
                    reject(err);
                }
                resolve(rows);
            });
        });
        
        if (result.length == 0) {
            return {
                success: false,
                output: "Chat does not exist"
            };
        }
        
        return {
            success: true,
            output: result[0].Model
        };
    } catch (e) {
        return {
            success: false,
            output: "Function Error: " + e
        };
    }
}

async function getChatList() {
    try {
        const chatList = await new Promise((resolve, reject) => {
            db.all("SELECT ChatId, Title, Model FROM Chats", [], (err, rows) => {
                if (err) {
                    reject(err);
                }
                resolve(rows);
            });
        });
        
        return chatList;
    } catch (e) {
        return [];
    }
}

async function getChatHistory(chatId) {
    try {
        const history = await new Promise((resolve, reject) => {
            db.all(`SELECT rowid, usertype, message FROM "${chatId}"`, [], (err, rows) => {
                if (err) {
                    reject(err);
                }
                resolve(rows);
            });
        });
        
        return history.map((item, index) => {
            return {
                id: index,
                sender: item.usertype,
                message: item.message
            };
        });
    } catch (e) {
        return [];
    }
}

export { 
    testFunction, 
    createChat, 
    checkChats, 
    deleteChat, 
    initializeDB, 
    updateModelList, 
    checkIfChatExists, 
    addConversation, 
    db, 
    getModelFromChat, 
    getChatList, 
    getChatHistory
};