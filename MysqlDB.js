var mysql = require('mysql2');
require('dotenv').config(); // initialize dotenv

var con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    database: process.env.DB_DATABASE
});

module.exports = {
    CheckUserInDatabase: function (discordID, callback) {
        return con.query("SELECT * FROM User WHERE DiscordID = ?;", [discordID],
        function (err, result) {
            if (err) {
                console.log(err.message);
            } else if (result && result.length > 0)
            {
                return callback(true);
            }
            return callback(false);
        });
    },
    GetCardFromDatabase: function (tier, callback) {
        return con.query("SELECT CodeName, Tier, URL FROM PhotoCard WHERE Tier = ?;", [tier],
        function (err, result, fields) {
            if (err) {
                throw new err;
            }
            if (result.length > 0) {
                var index = Math.floor(Math.random() * (result.length - 0) + 0);
                return callback(result[index].CodeName,result[index].Tier, result[index].URL);
            }
            con.end();
            return callback("", "No cards found :sob:" , "");
        });
    },
    InsertUserinDatabase: function (id, tag, callback) {
        return con.query("INSERT INTO User(DiscordID, Description, Coins) VALUES (?, ?, ?);", [id, tag, 0],
        function(err, result) {
            if (err) { // check for query errors
                console.log(err.message);
                return callback(false);
            }
            console.log("New User added! - " + result.affectedRows);
            return callback(true);
        });
    },
}
