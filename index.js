require('dotenv').config(); // initialize dotenv
const Discord = require('discord.js'); //importing discord.js

const commandHandler = require('./Commands.js');
const client = new Discord.Client({ intents: ['GUILDS', 'GUILD_MESSAGES'] }); // create new client (intents req.)

client.on('ready', () => { // when bot is ready do this.. (no parameters)
    console.log(`${client.user.tag} is online! ✦`);
});

client.on('messageCreate', commandHandler);
client.login(process.env.CLIENT_TOKEN); // login bot using token (.env file)
