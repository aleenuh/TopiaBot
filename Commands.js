const Discord = require('discord.js'); //importing discord.js
const mysqlDB = require('./MysqlDB.js');
const mongoDB = require('./MongoDB.js');
const { InsetUserinDatabase } = require('./MysqlDB.js');

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
            ShowRandomCard(msg, args);
            break;
        case 'test':
            Test(msg, args);
            break;
        case 'showrandomcardmongo':
            ShowRandomCardMongo(msg, args);
            break;
        case 'begin': // !begin command - creates a user account, adds to db
            Register(msg, args);
        default:
            console.log('No Command found');
    }
};

function Register(msg, args) { 
    // if user is not in the database, add them
    // if user is in the database, say you already have an account
    // if they arent on the database and try any other command, tell them to register.
    // msg.channel.send(msg.author.id + " " + msg.author.tag);
    // mysqlDB.InsertUserInDatabase(msg.author.id, msg.author.tag);
    // msg.channel.send("Successfully registered!")
    // {
        mysqlDB.InsertUserinDatabase(msg.author.id, msg.author.tag);
        msg.channel.send("Successfully registered!");
    //}
/*      catch (err) {
        if (err.code == 'ER_DUP_ENTRY') {
            msg.channel.send("You already have an account!");
        }
    } */
}

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

function ShowRandomCardMongo(msg, args) {
    if(args.length < 2) {
        console.log('No tier number found');
        return;
    }

    var tier = args[1];

    if (!isNaN(parseInt(tier))) {
        tier = parseInt(tier);
        mongoDB.GetCardFromDatabase(tier, function (codename, tier, url) {
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