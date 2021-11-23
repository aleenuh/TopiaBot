const Discord = require('discord.js'); //importing discord.js
const mongoDB = require('./MongoDB.js');
const main = require('./index.js');

const prefix = '!';
const MessageEmbed = Discord.MessageEmbed;

// In minutes
var minTime = 0.5;
var maxTime = 1;
// In Seconds
var timeVisible = 15;

var timer;
var tiers;
var droppedCardData;

module.exports = {
    StartDroppingCards: function(channelID) {
        GetTiers();
        SetTimer(channelID);
    },
    StopDroppingCards: function() {
        if(timer !== null)
            clearTimeout(timer);
    },
    ClaimCard: function(msg, claimCode) {
        var channelID = message.guild.channels.cache.get(channelid);
        var cardData = droppedCardData.find(data => data.ClaimCode === claimCode && data.ChannelID === channelID);
        if(cardData === null)
            return;

        PickupPhotoCard(msg, cardData);
    },
};

function GetTiers() {
    mongoDB.GetTiers( function (result) {
        tiers = result;
    });
}

function SetTimer(channelID) {
    var miliseconds = RandomRangeInt(minTime * 60 * 1000, maxTime * 60 * 1000);
    var time = miliseconds / 1000;
    console.log("Card will drop in " + time + " seconds which is " + (time / 60) + " minutes")
    timer = setTimeout(DropCard, miliseconds, channelID);
}

function DropCard(channelID) {
    mongoDB.GetCardFromDatabase(GetTier(), function(codename, tier, url, ownedCopies) {
        if (typeof tier === 'string' || tier instanceof String) {
            return;
        }
        var claimcode = codename + "#" + ownedCopies + 1;
        var cardData = { ClaimCode: claimcode, ChannelID: channelID, Timeout: null, msg: null }
        droppedCardData.Add(cardData)

        var embed = new MessageEmbed()
            .setTitle(codename)
        .setDescription("Tier: " + tier + "\r\n" +
             "Copy Number: " + ownedCopies + 1 + "\r\n" +
             "> Type !claim " + claimCode)
        .setImage(url);

        var channel = main.client.channels.get(channelID);
        channel.send({ embeds: [embed]}).then(msg => {
            var cardDataInList = droppedCardData.find(cardData);
            cardDataInList.Timeout = setTimeout(EraseMessage, timeVisible, msg, cardData.ClaimCode);
            cardDataInList.msg = msg;
        }).catch(function(err){
            console.log(err.message);
            return;
        });
        return;
    });    
}

function EraseMessage(msg, claimCode) {
    droppedCardData.remove(data => data.ClaimCode === claimCode);
    msg.delete(0);
}

function PickupPhotoCard(msg, cardData)
{
    var data = cardData.ClaimCode.split('#');
    mongoDB.AddCardToUser(msg.author.id, data[0], data[1], function (succeeded){
        if(succeeded)
        {
            removeTimeout(cardData.Timeout);
            droppedCardData.remove(cardData);
            cardData.msg.delete(0);
        } else{
            msg.reply("Ohno...  our database... it's broken...");
        }
    });
}

function GetTier() {
    var chance = RandomRangeFloat(0, 1);
    tiers.reverse();
    var chanceMax = 0;
    var index = -1;
    for(let i = 0; i < tiers.length; i++) {
        var tier = tiers[i];
        chanceMin = chanceMax;
        chanceMax += tier.Chance;
        console.log("Min: " + chanceMin + " Max: " + chanceMax);
        if(chance > chanceMin && chance <= chanceMax) {
            index = i;
            break;
        }
    }

    if(index == -1)
        index = tiers.length -1;
    
    return tiers[index].Tier;
}

function RandomRangeInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); //The maximum and minimum are inclusive
}

function RandomRangeFloat(min, max) {
    return min + (max - min) * ((1 + 10E-16) * Math.random()); //The maximum is inclusive and the minimum is inclusive
}
  