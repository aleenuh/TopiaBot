require('dotenv').config(); // initialize dotenv
const Discord = require('discord.js'); //importing discord.js

const client = new Discord.Client({ intents: ['GUILDS', 'GUILD_MESSAGES'] }); // create new client (intents req.)

client.on('ready', () => { // when bot is ready do this.. (no parameters)
    console.log(`${client.user.tag} is online! ✦`);
});

client.on('message', msg => { // if user posts msg, reply with..
    if (msg.content === "HI TOPIABOT") {
        msg.reply('hello! ✦');
    }
});

client.login(process.env.CLIENT_TOKEN); // login bot using token (.env file)