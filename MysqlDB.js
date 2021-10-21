var mysql = require('mysql2');
require('dotenv').config(); // initialize dotenv
var FileReader = require('filereader');

var con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    database: process.env.DB_DATABASE
});

module.exports = {
    TestConnection: function () {
        return con.connect(function(err) {
            if (err) {
                console.log(err.sqlMessage);
                throw new err;
            }
            return con.query("SELECT * FROM DropChance" , function (err, result, fields) {
                if (err) {
                    console.log(err.sqlMessage);
                    throw new err;
                }
                console.log(result);
            });
        });
    },
    GetCardFromDatabase: function (tier, callback) {
        return con.query("SELECT p.CodeName, p.Tier, p.FileBlob, f.Extension FROM PhotoCard p, FileExtension f WHERE Tier = ? AND p.FileExtensionID = f.ID;", [tier],
        function (err, result, fields) {
            if (err) {
                throw new err;
            }
            if(result.length > 0) {
                var index = Math.floor(Math.random() * (result.length - 0) + 0);
                return callback(result[index].CodeName,result[index].Tier, result[index].FileBlob, result[index].Extension);
            }
            return callback("", "No cards found :sob:" , "");
        });
    }
};