require('dotenv').config(); // initialize dotenv
const Discord = require('discord.js'); //importing discord.js
const CardDropper = require('./CardDropper.js'); //importing CardDropper.js

const commandHandler = require('./Commands.js');
const client = new Discord.Client({ intents: ['GUILDS', 'GUILD_MESSAGES'] }) // create new client (intents req.);

process.stdin.resume(); // Makes sure the application doesn't quit immeadiatly

client.on('ready', () => { // On discord client ready
    console.log(`${client.user.tag} is online! ✦`);
    CardDropper.StartDroppingCards();
});

client.on('messageCreate', commandHandler.HandleCommands);
client.login(process.env.CLIENT_TOKEN); // Login bot using token (.env file)


process.on('SIGINT', function() { // Catches Ctrl + C Exit and sends it to normal exit down below
    process.exit(2);
});
process.on('exit', function() { // On Exit
    console.log(`${client.user.tag} is shutting down! ✦`);
    CardDropper.StopDroppingCards();
});

module.exports.GetChannel = async (channelID, callback) => {
    return callback(client.channels.cache.get(channelID));
}

module.exports.GetAvatarURL = () => {
    return client.user.avatarURL();
}