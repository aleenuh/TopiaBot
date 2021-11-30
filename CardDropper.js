const Discord = require('discord.js'); //importing discord.js
const mongoDB = require('./MongoDB.js');
const main = require('./index.js');

const MessageEmbed = Discord.MessageEmbed;

// In minutes
var minTime = 15;
var maxTime = 45;
// In Seconds
var timeVisible = 15;

var tiers = [];
var timers = [];
var droppedCardData = [];

module.exports = {
    StartDroppingCards: function () {
        GetTiers();
        mongoDB.GetAllDropChannels(function (channels) {
            for (const channelID of channels) {
                SetTimer(channelID);
            }
        });
    },
    StartDroppingCardsInChannel: function(channelID) {
        SetTimer(channelID);
    },
    StopDroppingCards: function() {
        for (const timer of timers) {
            clearTimeout(timer);
        }
    },
    ClaimCard: function(msg, claimCode) {
        var channelID = msg.channel.id;
        var cardData = droppedCardData.find(data => data.ClaimCode === claimCode && data.ChannelID === channelID);
        if(cardData !== undefined)
            PickupPhotoCard(msg, cardData);
    },
};

function GetTiers() {
    mongoDB.GetTiers( function (result) {
        tiers = result.reverse();
    });
}

function SetTimer(channelID) {
    var miliseconds = RandomRangeInt(minTime * 60 * 1000, maxTime * 60 * 1000);
    var time = miliseconds / 1000;
    console.log("Card will drop in " + time + " seconds which is " + (time / 60) + " minutes")
    var id;
    if(timers.length == 0)
        id = 0;
    else
        id = timers[timers.length - 1].ID;

    var timer = { ID: id, TimeOut: setTimeout(function() {
        DropCard(channelID, id);
    }, miliseconds) }
    timers.push(timer);
}

function DropCard(channelID, id) {
    timers = timers.filter(data => data.ID !== id)

    //TODO check special channel for extra tier drop

    mongoDB.GetCardFromDatabase(GetTier(), function(codename, tier, url, ownedCopies) {
        if (typeof tier === 'string' || tier instanceof String) {
            return;
        }
        const number = Number(ownedCopies) + 1;

        var claimCode = codename + "#" + number;
        var cardData = { ClaimCode: claimCode, ChannelID: channelID, msg: {} }
        droppedCardData.push(cardData)

        var embed = new MessageEmbed()
            .setTitle(codename)
        .setDescription("Tier: " + tier + "\r\n" +
             "Copy Number: " + number + "\r\n" +
             "> Type !claim " + claimCode)
        .setImage(url);

        main.GetChannel(channelID, function (channel) {
            channel.send({ embeds: [embed]}).then( msg => {
                var cardDataInList = droppedCardData.find(data => data === cardData);
                cardDataInList.msg = msg;
                let time = timeVisible * 1000;
                setTimeout(function () {
                    EraseMessage(msg, claimCode);
                }, time);
            }).catch(function(err){
                console.log(err.message);
                return;
            });
            return;
        });
    });    
}

function EraseMessage(msg, claimCode) {
    cardData = droppedCardData.find(data => data.ClaimCode === claimCode);
    if(cardData === undefined)
        return;
    droppedCardData = droppedCardData.filter(data => data !== cardData);
    console.log(droppedCardData);
    msg.delete(0);
    SetTimer(cardData.ChannelID);
}

function PickupPhotoCard(msg, cardData)
{
    const claimCode = cardData.ClaimCode;
    var data = cardData.ClaimCode.split('#');
    mongoDB.AddCardToUser(msg.author.id, data[0], data[1], function (succeeded){
        if(succeeded)
        {
            EraseMessage(cardData.msg, claimCode);
            msg.reply("You succesfully claimed " + claimCode);
        } else{
            msg.reply("Ohno...  our database... it's broken...");
        }
    });
}

function GetTier() {
    var chance = RandomRangeFloat(0, 100);
    console.log("Chance: " + chance);
    var chanceMax = 0;
    var chanceMin = 0;
    var index = -1;
    for(let i = 0; i < tiers.length; i++) {
        var tier = tiers[i];
        chanceMin = chanceMax;
        chanceMax += tier.Chance;
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