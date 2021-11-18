const Discord = require('discord.js'); //importing discord.js
const mongoDB = require('./MongoDB.js');

const prefix = '!';
const MessageEmbed = Discord.MessageEmbed;

// In minutes
var minTime = 0.5;
var maxTime = 1;
// In Seconds
var timeVisible = 15;

var timer;
var tiers;
var claimCode;
var cardToPickUp;

module.exports = {
    StartDroppingCards: function() {
        GetTiers();
        SetTimer();
    },
    StopDroppingCards: function() {
        if(timer !== null)
            clearTimeout(timer);
    },
    PickupCard: function(msg, claim) {
        if(claim !== claimCode && cardToPickUp == null)
            return;
        PickupPhotoCard(msg, cardToPickUp);
    },
};

function GetTiers() {
    mongoDB.GetTiers( function (result) {
        tiers = result;
    });
}

function SetTimer() {
    var miliseconds = RandomRangeInt(minTime * 60 * 1000, maxTime * 60 * 1000);
    var time = miliseconds / 1000;
    console.log("Card will drop in " + time + " seconds which is " + (time / 60) + " minutes")
    timer = setTimeout(DropCard, miliseconds);
}

function DropCard() {
    mongoDB.GetCardFromDatabase(GetTier(), function(codename, tier, url, ownedCopies) {
        if (typeof tier === 'string' || tier instanceof String) {
            msg.reply(tier);
            return;
        }
        claimCode = codename + "#" + ownedCopies + 1;
        var embed = new MessageEmbed()
            .setTitle(codename)
        .setDescription("Tier: " + tier + "\r\n" +
             "Copy Number: " + ownedCopies + 1 + "\r\n" +
             "> Type !claim " + claimCode)
        .setImage(url);

        msg.channel.send({ embeds: [embed]});
        return;
    });    
}

function PickupPhotoCard(msg, card)
{
    cardToPickUp == null;
    //TODO add card to user
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
  