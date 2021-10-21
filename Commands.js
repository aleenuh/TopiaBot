const Discord = require('discord.js'); //importing discord.js
const mysqlDB = require('./MysqlDB.js');
const fs = require('fs');
const path = require('path');
const { stringify } = require('querystring');

const prefix = '!';
const MessageEmbed = Discord.MessageEmbed;

module.exports = async function(msg) {
    if(msg.author.bot)
        return;

    if (msg.content === "HI TOPIABOT") {
        msg.reply('hello! ✦');
        return;
    }

    if(!msg.content.startsWith(prefix))
        return;

    const args = msg.content.slice(prefix.length).trim().split(/ +/);
    if(args.length <= 0)
        return;
    
    switch (args[0].toLowerCase()) {
        case 'showrandomcard':
            ShowRandomCard(msg, args)
            break;
        case 'test':
            Test(msg, args)
            break;
        default:
            console.log('No Command found');
    }
};

function Test(msg, args) {
    var embed = new MessageEmbed()
                    .setTitle("Test Command")
                    .setDescription("Test")
                    .setImage('https://i.pinimg.com/564x/83/9a/08/839a0809148a30d5ac5a835dd90cb79f.jpg');
    msg.channel.send({ embeds: [embed]});
}

function ShowRandomCard(msg, args) {
    if(args.length < 2) {
        console.log('No tier number found');
        return;
    }

    var tier = args[1];

    if (!isNaN(parseInt(tier))) {
        tier = parseInt(tier);
        mysqlDB.GetCardFromDatabase(tier, function (codename, tier, blob, extension) {
            if (typeof tier === 'string' || tier instanceof String) {
                msg.reply(tier);
                return;
            }
    
            var path = saveImage('temp', blob, extension, function (path) {
                if(path == null)
                    return;

                
                var embed = new MessageEmbed()
                    .setTitle(codename)
                    .setDescription("Tier: " + tier)
                    .setImage('attachment://temp.' + extension);

                msg.channel.send({ embeds: [embed], files: [path]});
            });
        });
        return;
    }
    console.log('Arg is not a number');
}

function saveImage(filename, blob, extension, callback){
    var myBuffer = new Buffer.from(blob);
    for (var i = 0; i < blob.length; i++) {
        myBuffer[i] = blob[i];
    }
    var path = './temp/'+filename + extension;
    fs.writeFile(path, myBuffer, function(err) {
        if(err) {
            console.log(err);
            return null;
        } else {
            console.log("The file was saved!");
            return callback(path);
        }
    });
  };