 
require('dotenv').config(); // initialize dotenv
const CardDropper = require('./CardDropper.js'); //importing CardDropper.js
const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://topiabot:" + process.env.DB_PASSWORD + "@topia.ytiyn.mongodb.net/" + process.env.DB_DATABASE + "?retryWrites=true&w=majority";
const client = new MongoClient(uri);


module.exports = {
    GetCardFromDatabaseTier: async function (tier, callback) {
        try {
            await client.connect();
            const database = client.db(process.env.DB_DATABASE);
            const collection = database.collection("PhotoCard");
            const query = { Tier: { $eq: tier} };

            const options = {     
                sort: { _id: 1 },     
                projection: { _id: 0, CodeName: 1, Tier: 1, Url: 1, OwnedCopies: 1 }
            };

            const cursor = collection.find(query, options);
            
            if (await cursor.count() !== 0) {
                cursor.toArray(function (err, result) {
                    if (err != null)
                        throw err;

                    var index = Math.floor(Math.random() * (result.length));
                    console.log("OwnedCopies " + result[index].OwnedCopies);
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
        const query = { DiscordID: { $eq: discordID} };
        await CheckForRow("User", query, function (exists) {
            return callback(exists);
        });
    },
    InsertUserinDatabase: async function (id, tag, callback) {
        const user = { DiscordID: id, Description: tag, Coins: 0 };
        await InsertDocument ("User", user, function (succeeded) {
            return callback(succeeded);
        });
    },
    GetTiers: async function (callback) {
        const sort = { Tier: 1 };
        await GetCollection("DropChance", sort, function (tiers) {
            return callback(tiers);
        });
    },
    AddCardToUser: async function (discordID, photocardID, copyNumber, callback) {
        const userCard = { DiscordID: discordID, PhotoCardID: photocardID, CopyNumber: copyNumber };
        await InsertDocument ("UserCard", userCard, async function (succeeded) {
            if(!succeeded)
                return callback(succeeded);
            const query = { CodeName: photocardID }
            const update = { $set: { OwnedCopies: copyNumber }};
            const options = { upsert: false };
            await InsertOrUpdate("PhotoCard", query, update, options, function (updateSucceeded) {
                return callback(updateSucceeded);
            });
        });
    },
    AddOrUpdateChannel: async function (msg, args, callback) {
        const serverID = msg.guild.id;

        await CheckForDiscord(serverID, async function (exists) {
            const channelID = msg.channel.id;
            const specialChannel = args.length > 1;
            const query = { ServerID: serverID };
            var update;
            if(specialChannel)
                update = { $set: { ServerID: serverID, SpecialChannelID: channelID }};
            else
                update = { $set: { ServerID: serverID, ChannelID: channelID }};
            const options = { upsert: !exists };
            await InsertOrUpdate("DropChannel", query, update, options, function (succeeded){
                return callback(succeeded);
            })
        });
    },
    GetAllDropChannels: async function (callback) {
        await GetCollection("DropChannel", null, function (dropchannels) {
            var allChannels = [];
            for (const dropChannel of dropchannels) {
                if(dropChannel.ChannelID !== undefined)
                    allChannels.push(dropChannel.ChannelID);
                if(dropChannel.SpecialChannelID !== undefined)
                allChannels.push(dropChannel.SpecialChannelID);
            }
            return callback(allChannels);
        })
    },
    CheckIfCardOwned: async function (discordID, photoCardID, copyNumber, callback) {
        const query = { DiscordID: { $eq: discordID}, PhotoCardID: { $eq: photoCardID}, CopyNumber: { $eq: copyNumber}};
        await CheckForRow("UserCard", query, function (exists) {
            return callback(exists);
        });
    },
    GetCardWithID: async function (photocardID, callback) {
        try {
            await client.connect();
            const database = client.db(process.env.DB_DATABASE);
            const collection = database.collection("PhotoCard");
            const query = { CodeName: { $eq: photocardID} };

            const options = {
                projection: { _id: 0, CodeName: 1, Tier: 1, Url: 1, OwnedCopies: 1 }
            };

            collection.findOne(query, options, function(err, res) {
                if (err != null)
                        throw err;
                client.close;
                return callback(res);
            });
            return;
        } catch (err)
        {
            console.log(err);
            client.close;
        }
        return callback(null);
    }
};

async function CheckForDiscord (serverID, callback) {
    const query = { ServerID: { $eq: serverID} };
    await CheckForRow("DropChannel", query, function (exists) {
        return callback(exists);
    });
}

async function InsertDocument (collectionName, item, callback) {
    try {
        await client.connect();
        const database = client.db(process.env.DB_DATABASE);
        const collection = database.collection(collectionName);
        collection.insertOne(item, function(err, result) {
            if(err) {
                console.log(err.message);
                client.close;
                return callback(false);
            }
            client.close;
            return callback(true);
        })
    } catch (err) {
        console.log(err);
        client.close;
        return callback(false);
    }
}

async function CheckForRow (collectionName, query, callback) {
    try {
        await client.connect();
        const database = client.db(process.env.DB_DATABASE);
        const collection = database.collection(collectionName);
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
}

async function GetCollection (collectionName, sort, callback) {
    try {
        await client.connect();
        const database = client.db(process.env.DB_DATABASE);
        const collection = database.collection(collectionName);
        
        if(sort === null)
        {
            collection.find().toArray( function(err, result) {
                if(err) {
                    console.log(err.message);
                    client.close;
                    return callback(null);
                }
                client.close;
                return callback(result);
            })
        } else {
            collection.find().sort(sort).toArray( function(err, result) {
                if(err) {
                    console.log(err.message);
                    client.close;
                    return callback(null);
                }
                client.close;
                return callback(result);
            })
        }
    } catch (err) {
        console.log(err);
        client.close;
        return callback(null);
    }
}

async function InsertOrUpdate (collectionName, query, update, options, callback) {
    try {
        await client.connect();
        const database = client.db(process.env.DB_DATABASE);
        const collection = database.collection(collectionName);
        collection.updateOne(query, update, options, function (err, res) {
            if (err) {
                console.log(err);
                client.close;
                return callback(false);
            }
            client.close;
            return callback(true);
        });
    } catch (err) {
        console.log(err);
        client.close;
        return callback(false);
    }
}