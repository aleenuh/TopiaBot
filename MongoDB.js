 
require('dotenv').config(); // initialize dotenv

const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://topiabot:" + process.env.DB_PASSWORD + "@topia.ytiyn.mongodb.net/" + process.env.DB_DATABASE + "?retryWrites=true&w=majority";
const client = new MongoClient(uri);


module.exports = {
    GetCardFromDatabase: async function (tier, callback) {
        try {
            await client.connect();
            const database = client.db(process.env.DB_DATABASE);
            const collection = database.collection("PhotoCard");
            const query = { Tier: { $eq: tier} };

            const options = {     
                sort: { _id: 1 },     
                projection: { _id: 0, CodeName: 1, Tier: 1, Url: 1 }
            };

            const cursor = collection.find(query, options);
            
            if (await cursor.count() !== 0) {
                cursor.toArray(function (err, result) {
                    if (err != null)
                        throw err;

                    console.log(result);

                    var index = Math.floor(Math.random() * (result.length));
                    console.log(index + " " + result[index]);
                    client.close;
                    return callback(result[index].CodeName, result[index].Tier, result[index].Url, result[index].OwnedCopies);
                });
            }
            client.close;
            return;
        } catch (err)
        {
            console.log(err);
            client.close;
        }
        return callback("", "No cards found :sob:" , "");
    },
    CheckUserInDatabase: async function (discordID, callback) {
        try {
            await client.connect();
            const database = client.db(process.env.DB_DATABASE);
            const collection = database.collection("User");
            const query = { DiscordID: { $eq: discordID} };
            const cursor = collection.find(query);
            
            if (await cursor.count() > 0) {

                client.close;
                return callback(true);
            }
            else{
                client.close;
                return callback(false);
            }
        } catch (err) {
            console.log(err);
            client.close;
            return callback(false);
        }
    },
    InsertUserinDatabase: async function (id, tag, callback) {
        try {
            await client.connect();
            const database = client.db(process.env.DB_DATABASE);
            const collection = database.collection("User");

            var user = { DiscordID: id, Description: tag, Coins: 0 };

            collection.insertOne(user, function(err, result) {
                if(err) {
                    console.log(err.message);
                    client.close;
                    return callback(false);
                }
                client.close;
                console.log("New User added!");
                return callback(true);
            })
        } catch (err) {
            console.log(err);
            client.close;
            return callback(false);
        }
    },
    GetTiers: async function (callback) {
        try {
            await client.connect();
            const database = client.db(process.env.DB_DATABASE);
            const collection = database.collection("DropChance");
            collection.find().toArray( function(err, result) {
                if(err) {
                    console.log(err.message);
                    client.close;
                    return callback(null);
                }
                client.close;
                console.log(result);
                return callback(result);
            })
        } catch (err) {
            console.log(err);
            client.close;
            return callback(null);
        }
    },
};