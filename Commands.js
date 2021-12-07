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
    mongoDB.CheckUserInDatabase(msg.author.id, function (userExists) {
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
                Register(msg, args);
                break;
            case 'test':
                Test(msg, args);
                break;
            case 'showrandomcard':
                ShowRandomCard(msg, args);
                break;
            case 'showrandomcardmongo':
                ShowRandomCardMongo(msg, args);
                break;
            case 'claim':
                cardDropper.ClaimCard(msg, args[1]);
                break;
            case 'drophere':
                SetDropChannel(msg, args);
                break;
            case 'view':
                ViewCard(msg, args);
                break;
            default:
                console.log('No Command found called ' + command);
        }
    })
};

function Register(msg, args) { 
    mongoDB.InsertUserinDatabase(msg.author.id, msg.author.tag,
         function (insertSucceeded) {
            if(insertSucceeded)
                msg.channel.send("Successfully registered!");
            else
                msg.channel.send(databaseErrorMsg)
        }
    );
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
        mongoDB.GetCardFromDatabaseTier(tier, function (codename, tier, url, ownedCopies) {
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

function SetDropChannel(msg, args) {
    //TODO check if channel is already set
    mongoDB.AddOrUpdateChannel(msg, args, function (succeeded) {
        if(!succeeded) {
            msg.reply(databaseErrorMsg);
        }
        else {
            
            cardDropper.StartDroppingCardsInChannel(msg.channel.id);
            msg.reply("This channel will now be used to drop cards. :ok_hand:");
        }
    });
}

function ViewCard(msg, args) {
    if(args.length <= 1)
        return;
    const cardData = args[1].split('#');
    if(cardData.length <= 1)
        return;

    const discordID = msg.author.id;
    const photoCardID = cardData[0];
    const copyNumber = cardData[1];
    mongoDB.CheckIfCardOwned(discordID, photoCardID, copyNumber, function (owned){
        if(!owned)
        {
            msg.reply("You do not own " + args[1]);
            return;
        }
        mongoDB.GetCardWithID(photoCardID, function (photoCard) {
            if(photoCard === null)
            return;

            var embed = new MessageEmbed()
                .setTitle(args[1])
            .setDescription("Tier: " + photoCard.Tier + "\r\n" + "Copy Number: " + copyNumber + "\r\n" + "Owned by " + msg.author.tag)
            .setImage(photoCard.Url);

            msg.channel.send({ embeds: [embed]});
        });
    });
    
}