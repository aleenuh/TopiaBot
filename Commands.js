const Discord = require('discord.js'); //importing discord.js
const mysqlDB = require('./MysqlDB.js');

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
        mysqlDB.GetCardFromDatabase(tier, function (codename, tier, url) {
            if (typeof tier === 'string' || tier instanceof String) {
                msg.reply(tier);
                return;
            }              
            var embed = new MessageEmbed()
                .setTitle(codename)
            .setDescription("Tier: " + tier)
            .setImage(url);

            msg.channel.send({ embeds: [embed]});
            return;
        });
        return;
    }
    console.log('Argument is not a number');
    return;
}