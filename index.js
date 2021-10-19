require('dotenv').config(); // initialize dotenv
const Discord = require('discord.js'); //importing discord.js

const mysqlDB = require('./MysqlDB.js');
const commandHandler = require('./Commands.js');
const client = new Discord.Client({ intents: ['GUILDS', 'GUILD_MESSAGES'] }); // create new client (intents req.)

client.on('ready', () => { // when bot is ready do this.. (no parameters)
    console.log(`${client.user.tag} is online! ✦`);
});

client.on('messageCreate', commandHandler);

function saveImage(filename, data){
    var myBuffer = new Buffer.from(data.length);
    for (var i = 0; i < data.length; i++) {
        myBuffer[i] = data[i];
    }
    fs.writeFile('./'+filename, myBuffer, function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("The file was saved!");
        }
    });
  };

client.login(process.env.CLIENT_TOKEN); // login bot using token (.env file)
