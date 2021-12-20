const Discord = require('discord.js'); //importing discord.js
const mongoDB = require('./MongoDB.js');
const main = require('./index.js');
const helper = require('./Helper.js');
const commands = require('./Commands');

const MessageEmbed = Discord.MessageEmbed;

// In minutes
var minTime = 15;
var maxTime = 45;

// In Seconds
var timeVisible = 30;

var tiers = [];
var timers = [];
var droppedCardData = [];

module.exports = {
    StartDroppingCards: async function () {
        await GetTiers();
        await mongoDB.GetAllDropChannels(function (channels) {
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
    ClaimCard: async function(msg, claimCode) {
        var channelID = msg.channel.id;
        var cardData = droppedCardData.find(data => data.ClaimCode === claimCode && data.ChannelID === channelID);
        if(cardData !== undefined)
            await PickupPhotoCard(msg, cardData);
    },
};

async function GetTiers() {
    await mongoDB.GetTiers( function (result) {
        tiers = result.reverse();
    });
}

function SetTimer(channelID) {
    var miliseconds = helper.RandomRangeInt(minTime * 60 * 1000, maxTime * 60 * 1000);
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

    let tierNumber = GetTier();
    let tier = tiers.find(tier => tier.Tier === tierNumber);
    mongoDB.GetCardFromDatabaseTier(tier.Tier, tier.MaxCopies, function(card) {
        if (card === null) {
            console.log("No card available");
            return;
        }

        var claimCode = card.CodeName + "#" + card.CopyNumber;
        var cardData = { ClaimCode: claimCode, ChannelID: channelID, msg: {} }
        droppedCardData.push(cardData)

        var tierString = "";
        for(var i = 0; i < card.Tier; i++)
        {
            tierString += "★";
        }

        var viewing =  "Dropping " + claimCode;
        tierString = "**" + tierString + "**";

        var embed = new MessageEmbed()
            .setAuthor(viewing, main.GetAvatarURL())
            .setDescription("A card just dropped!" + "\r\n" +
                            "Type " + commands.Prefix() + "claim CODE")
            .addFields({name: 'Tier: ', value: tierString})
            .setImage(card.Url);

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
    msg.delete(0);
    SetTimer(cardData.ChannelID);
}

async function PickupPhotoCard(msg, cardData)
{
    const claimCode = cardData.ClaimCode;
    var data = cardData.ClaimCode.split('#');
    await mongoDB.AddCardToUser(msg.author.id, data[0], data[1], function (succeeded){
        if(succeeded)
        {
            EraseMessage(cardData.msg, claimCode);
            msg.reply("You succesfully claimed " + claimCode + "\r\n" +
            "> Type " + commands.Prefix() + "view " + claimCode + " to view your card");
        } else{
            msg.reply("Ohno...  our database... it's broken...");
        }
    });
}

function GetTier() {
    var chance = helper.RandomRangeFloat(0, 100);
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