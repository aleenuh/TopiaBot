const Discord = require('discord.js'); //importing discord.js
const mysqlDB = require('./MysqlDB.js');
const mongoDB = require('./MongoDB.js');
const cardDropper = require('./CardDropper.js');

const prefix = '!';
const databaseErrorMsg = "Oh no...  Our Database... It's broken";
const MessageEmbed = Discord.MessageEmbed;

module.exports = async function(msg) {
    if(msg.author.bot) //Message was sent by bot
        return;

    if (msg.content === "HI TOPIABOT") { //Cute lil interaction
        msg.reply('hello! ✦');
        return;
    }

    if(!msg.content.startsWith(prefix)) //Check if message was sent with the bot's prefix
        return;

    const args = msg.content.slice(prefix.length).trim().split(/ +/);
    if(args.length <= 0) //Check the arguments. if 0 then the message was '!'
        return;
    
    const command = args[0].toLowerCase();
    await mongoDB.CheckUserInDatabase(msg.author.id, async function (userExists) {
        if(userExists)
        {
            if(command == 'begin') //If user exists and types !begin do nothing
            {
                msg.reply("You are already registered with this Bot :upside_down:");
                return;
            }
        }
        else {
            if(command != 'begin') //If user does not exists and does not type !begin send a reply
            {
                msg.reply("Please type '!begin' to start using the Topia Bot");
                return;
            }
        }

        switch (command) { // Command handling
            case 'begin': // !begin command - creates a user account, adds to db
                await Register(msg);
                break;
            case 'showrandomcard':
                await ShowRandomCard(msg, args);
                break;
            case 'claim':
                await cardDropper.ClaimCard(msg, args[1]);
                break;
            case 'drophere':
                //TODO check roll
                await SetDropChannel(msg, args);
                break;
            case 'view':
                await ViewCard(msg, args);
                break;
            case 'test':
                Test(msg);
                break;
            case 'addmodrole':
                await AddModRoles(msg);
                break;
            case 'removemodrole':
                await RemoveModRoles(msg);
                break;
            default:
                console.log('No Command found called ' + command);
        }
    })
};

async function Register(msg) { 
    await mongoDB.InsertUserinDatabase(msg.author.id, msg.author.tag,
         function (insertSucceeded) {
            if(insertSucceeded)
                msg.channel.send("Successfully registered!");
            else
                msg.channel.send(databaseErrorMsg)
        }
    );
}

function Test(msg) {
    var embed = new MessageEmbed()
                    .setTitle("Test Command")
                    .setDescription("Test")
                    .setImage('https://i.pinimg.com/564x/83/9a/08/839a0809148a30d5ac5a835dd90cb79f.jpg');
    msg.channel.send({ embeds: [embed]});
}

async function ShowRandomCard(msg, args) {
    if(args.length < 2) {
        console.log('No tier number found');
        return;
    }

    var tier = args[1];

    if (!isNaN(parseInt(tier))) {
        tier = parseInt(tier);
        await mongoDB.GetCardFromDatabaseTier(tier, function (codename, tier, url, ownedCopies) {
            if (typeof tier === 'string' || tier instanceof String) {
                msg.reply(tier);
                return;
            }              
            var embed = new MessageEmbed()
                .setTitle(codename)
            .setDescription("Tier: " + tier + "\r\n" + "Owned Copies: " + ownedCopies)
            .setImage(url);

            msg.channel.send({ embeds: [embed]});
            return;
        });
        return;
    }
    console.log('Argument is not a number');
    return;
}

async function SetDropChannel(msg, args) {
    await mongoDB.CheckDropChannel(msg.guild.id, msg.channel.id, async function (exists) {
        if(exists) //Channel has already been set
        {
            msg.reply("This channel has already been set as a drop channel");
        } else {
            const specialChannel = args.length > 1 && args[1].toLowerCase() === "boost";
            await mongoDB.AddOrUpdateChannel(msg, args, specialChannel, function (succeeded) {
                if(!succeeded) {
                    msg.reply(databaseErrorMsg);
                }
                else {
                    cardDropper.StartDroppingCardsInChannel(msg.channel.id);
                    var specialString = " ";
                    if(specialChannel)
                        specialString = " special ";
                    msg.reply("This channel will now be used to drop" + specialString + "cards. :ok_hand:");
                }
            });
        }
    });
}

async function ViewCard(msg, args) {
    if(args.length <= 1)
        return;
    const cardData = args[1].split('#');
    if(cardData.length <= 1)
        return;

    const discordID = msg.author.id;
    const photoCardID = cardData[0];
    const copyNumber = cardData[1];
    await mongoDB.CheckIfCardOwned(discordID, photoCardID, copyNumber, async function (owned){
        if(!owned)
        {
            msg.reply("You do not own " + args[1]);
            return;
        }

        await mongoDB.GetCardWithID(photoCardID, function (photoCard) {
            if(photoCard === null)
            return;
            var tier = "";
            for(var i = 0; i < photoCard.Tier; i++)
            {
                tier += "★";
            }

            var viewing =  "Viewing " + args[1];
            tier = "**" + tier + "**";

            var embed = new MessageEmbed()
                .setAuthor(viewing, msg.author.avatarURL())
                .addFields( {name: 'Tier: ', value: tier} )
                .setImage(photoCard.Url);

            msg.channel.send({ embeds: [embed]});
        });
    });
    
}

async function AddModRoles(msg) {
    await mongoDB.AddModRoles(msg.guild.id, GetRoles(msg), function (succeeded) {
        if(succeeded)
            msg.reply("The roles have been added.");
        else
            msg.reply(databaseErrorMsg);
    });
}

async function RemoveModRoles(msg) {
    await mongoDB.RemoveModRoles(msg.guild.id, GetRoles(msg), function (succeeded) {
        if(succeeded)
            msg.reply("The roles have been removed.");
        else
            msg.reply(databaseErrorMsg);
    });
}

function GetRoles(msg) {
    const roles = msg.mentions.roles;
    var roleIDs = [];
    roles.forEach((role) => {roleIDs.push(role.id)});
    return roleIDs
}