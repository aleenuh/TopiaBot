require('dotenv').config(); // initialize dotenv
const { Options } = require('discord.js');
const { MongoClient } = require('mongodb');
const { MessageEmbed } = require('discord.js');
const helper = require('./Helper.js');
const main = require('./index.js');

const uri = "mongodb+srv://topiabot:" + process.env.DB_PASSWORD + "@topia.ytiyn.mongodb.net/" + process.env.DB_DATABASE + "?retryWrites=true&w=majority";
const client = new MongoClient(uri);


module.exports.GetCardFromDatabaseTier = async (tier, maxCopies, callback) => {
    await GetCardWithTier(tier, maxCopies, function(card) {
        if(card === null)
            return callback(null)
        GetAvailableCopyNumber(card.CodeName, maxCopies, function (copyNumber) {
            return callback({ CodeName: card.CodeName, Tier: card.Tier, Url: card.Url, CopyNumber: copyNumber });
        });
    });
}
module.exports.CheckUserInDatabase = async (discordID, callback) => {
    const query = { DiscordID: { $eq: discordID} };
    await CheckForRow("User", query, function (exists) {
        return callback(exists);
    });
}
module.exports.InsertUserinDatabase = async (id, tag, callback) => {
    const user = { DiscordID: id, Description: tag, Coins: 0 };
    await InsertDocument ("User", user, function (succeeded) {
        return callback(succeeded);
    });
}
module.exports.GetTiers = async (callback) => {
    const sort = { Tier: 1 };
    await GetCollection("DropChance", {}, {}, sort, function (tiers) {
        return callback(tiers);
    });
}
module.exports.AddCardToUser = async (discordID, codeName, copyNumber, callback) => {
    const userCard = { DiscordID: discordID, CodeName: codeName, CopyNumber: copyNumber };
    await InsertDocument ("UserCard", userCard, async function (succeeded) {
        if(!succeeded)
            return callback(succeeded);
            
        var query = { CodeName: { $eq: codeName } };
        var options = { projection: { CopyNumber: 1 } };
        await GetCollection("UserCard", query, options, {}, async function(result) { 
            if(result === null)
                return callback(false);

            query = { CodeName: codeName }
            const update = { $set: { OwnedCopies: result.length + 1 }};
            options = { upsert: false };
            await InsertOrUpdate("PhotoCard", query, update, options, function (updateSucceeded) {
                return callback(updateSucceeded);
            });
        });
    });
}
module.exports.AddOrUpdateChannel = async (msg, specialChannel, callback) => {
    const serverID = msg.guild.id;
    await CheckForDiscord(serverID, async function (exists) {
        const channelID = msg.channel.id;
        const query = { ServerID: serverID };
        var update;
        if(specialChannel)
            update = { $set: { ServerID: serverID, SpecialChannelID: channelID }};
        else
            update = { $set: { ServerID: serverID, ChannelID: channelID }};
        const options = { upsert: !exists };
        await InsertOrUpdate("DropChannel", query, update, options, function (succeeded){
            return callback(succeeded);
        });
    });
}
module.exports.GetAllDropChannels = async (callback) => { 
    await GetCollection("DropChannel", {}, {}, {}, function (dropchannels) {
        var allChannels = [];
        for (const dropChannel of dropchannels) {
            if(dropChannel.ChannelID !== undefined)
                allChannels.push(dropChannel.ChannelID);
            if(dropChannel.SpecialChannelID !== undefined)
            allChannels.push(dropChannel.SpecialChannelID);
        }
        return callback(allChannels);
    });
}
module.exports.CheckIfCardOwned = async (discordID, codeName, copyNumber, callback) => { 
    const query = { DiscordID: { $eq: discordID}, CodeName: { $eq: codeName}, CopyNumber: { $eq: copyNumber}};
    await CheckForRow("UserCard", query, function (exists) {
        return callback(exists);
    });
}
module.exports.GetCardWithID = async (codeName, callback) => { 
    const query = { CodeName: { $eq: codeName} };
    const options = {
        projection: { _id: 0, CodeName: 1, Tier: 1, Url: 1, OwnedCopies: 1 }
    };
    await GetDocument("PhotoCard", query, options, function (result) {
        return callback(result);
    });
}
module.exports.CheckDropChannel = async (serverID, channelID, callback) => { 
    var query = { ServerID: { $eq: serverID }, ChannelID: { $eq: channelID } };
    await CheckForRow("DropChannel", query, async function (exists) {
        if(exists)
        {
            return callback(exists);
        } else
        {
            query = { ServerID: { $eq: serverID }, SpecialChannelID: { $eq: channelID } };
            await CheckForRow("DropChannel", query, function (specialExists) {
                return callback(specialExists);
            });
        }
    });
}
module.exports.AddModRoles = async (serverID, roles, callback) => { 
    var query = { ServerID: { $eq: serverID } };
    var options = {
        projection: { Roles: 1 }
    };
    await GetDocument("ModRoles", query, options, async function (result) {
        if(result !== null) {
            for(let i = 0; i < result.Roles.length; i++) {
                var role = result.Roles[i];
                if(roles.indexOf(role) === -1)
                    roles.push(role);
            }
        }

        query = { ServerID: serverID };
        update = { $set: { Roles: roles }};
        options = { upsert: result === null};
        await InsertOrUpdate("ModRoles", query, update, options, function (succeeded){
            return callback(succeeded);
        });
    });
}
module.exports.RemoveModRoles = async (serverID, roles, callback) => { 
    const query = { ServerID: { $eq: serverID } };
    await GetDocument("ModRoles", query, {}, async function(ModRoles) {
        if(ModRoles === null)
            return callback(false);
        for(let i = 0; i < roles.length; i++) {
            ModRoles.Roles = helper.ArrayRemove(ModRoles.Roles, roles[i]);
        }
        const update = { $set: { Roles: ModRoles.Roles }};
        const options = { upsert: true };
        await InsertOrUpdate("ModRoles", query, update, options, function(succeeded) {
            return callback(succeeded);
        });
    });
}
module.exports.CheckIfMod = async (msg, callback) => { 
    const query = { ServerID: { $eq: msg.guild.id } };
    const options = { projection: { Roles: 1 } };
    await GetDocument ("ModRoles", query, options, function (result) {
        if(result === null || result.Roles.length === 0)
            return callback(null);
        for(let i = 0; i < result.Roles.length; i++) {
            if(msg.member.roles.cache.find(r => r.id === result.Roles[i]))
                return callback(true);
        }
        return callback(false);
    });
}
module.exports.CheckDaily = async (msg, callback) => {
    query = { DiscordID: { $eq: msg.author.id } };
    await GetDocument("UserDaily", query, {}, async function (userDaily) {
        if(userDaily === null)
        {
            let daily = { DiscordID: msg.author.id, DateTime: new Date() };
            await InsertDocument("UserDaily", daily, async function (succeeded) {
                if(!succeeded)
                    return callback(null);
                return callback(true);
            });
            return;
        }

        let date = new Date();
        let difference = userDaily.DateTime.getTime() - date.getTime();
        let hours = difference / 1000 / 60 / 60;
        if(hours >= 24) {
            return callback(true)
        } else {
            return callback(false);
        }
    });
}
module.exports.ClaimDaily = async (msg, tier, callback) => {
    await GetCardWithTier(tier.Tier, tier.MaxCopies, async function (card){
        if(card === null)
            return callback(false);
        await GetAvailableCopyNumber(card.codeName, tier.MaxCopies, async function(copyNumber){
            await module.exports.AddCardToUser(msg.author.id, card.CodeName, copyNumber, async function (succeeded) {
                if(!succeeded)
                    return callback(false);
                await module.exports.AddCoins(msg.author.id, 150, async function(goldAdded) {
                    if(!goldAdded)
                        return callback(false);
    
                    var tierString = "";
                    for(var i = 0; i < card.Tier; i++) {
                        tierString += "★";
                    }
            
                    var viewing =  "Viewing Daily Rewards";
                    tierString = "**" + tierString + "**";
                    const codeName = card.CodeName + "#" + copyNumber;
            
                    const coinEmoji = "<:topiacoin:923637053709774888>";

                    var embed = new MessageEmbed()
                        .setAuthor(viewing, msg.author.avatarURL())
                        .addFields( { name: 'Card: ', value: codeName},
                                    {name: 'Tier: ', value: tierString},
                                    {name: 'Daily Gold: ', value: coinEmoji + " 150"})
                        .setImage(card.Url);
                    msg.channel.send({ embeds: [embed]});
                    return callback(true);
                });
            });            
        });
    });
}
module.exports.AddCoins = async (discordID, amount, callback) => {
    const query = { DiscordID: { $eq: discordID } };
    var options = {
        projection: { Coins: 1 }
    };
    await GetDocument("User", query, options, async function(user){
        if(user === null)
            return callback(false);
        const newCoins = user.Coins + amount;
        const update = { $set: { Coins: newCoins } };
        options = { upsert: true };
        await InsertOrUpdate("User", query, update, options, async function (succeeded) {
            return callback(succeeded);
        });
    });
}



async function GetAvailableCopyNumber(codeName, maxCopies, callback){
    const query = { CodeName: { $eq: codeName } };
    const options = { projection: { CopyNumber: 1 } };
    await GetCollection("UserCard", query, options, {}, function(result) {
        if(result === null)
            return callback(null);
        let random = -1;
        while(random === -1 || result.find(usercard => usercard.CopyNumber === random) !== undefined)
        {
            random = helper.RandomRangeInt(1, maxCopies);
        }
        return callback(random);
    });
}

async function GetCardWithTier(tier, maxCopies, callback){
    try {
        await client.connect();
        const database = client.db(process.env.DB_DATABASE);
        const collection = database.collection("PhotoCard");
        const query = { Tier: { $eq: tier}, MaxCopies: { $ne: maxCopies } };

        const options = {     
            sort: { _id: 1 },     
            projection: { _id: 0, CodeName: 1, Tier: 1, Url: 1, OwnedCopies: 1 }
        };

        const cursor = collection.find(query, options);
        
        if (await cursor.count() !== 0) {
            cursor.toArray(function (err, result) {
                if (err != null)
                    throw err;

                var index = helper.RandomRangeInt(0, result.length - 1);
                client.close;
                return callback(result[index]);
            });
        }
        client.close;
        return;
    } catch (err)
    {
        console.log(err);
        client.close;
    }
    return callback(null);
}

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

async function GetCollection (collectionName, query, options, sort, callback) {
    try {
        await client.connect();
        const database = client.db(process.env.DB_DATABASE);
        const collection = database.collection(collectionName);
        collection.find(query, options).sort(sort).toArray( function(err, result) {
            if(err) {
                console.log(err.message);
                client.close;
                return callback(null);
            }
            client.close;
            return callback(result);
        });
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

async function GetDocument (collectionName, query, options, callback) {
    try {
        await client.connect();
        const database = client.db(process.env.DB_DATABASE);
        const collection = database.collection(collectionName);
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