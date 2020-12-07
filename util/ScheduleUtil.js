const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();

//set views file
app.set('views',path.join(__dirname,'views'));

//set view engine
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(__dirname + '/public'));
app.use('/public', express.static('public'));


exports.matchDetails = async function getMatchDetails(connection){
    let sql = `Select * from SCHEDULE where isActive=true`;
    return await new Promise( (resolve,reject) => {
        var result = connection.query(sql, function(err, results) {

            if(err){
                reject(err);
            } else {
                var schedule = [];
                if (results.length > 0){
                    results.forEach(function(item) {
                        schedule.push(item);
                    });
                    resolve(schedule);
                } else {
                    resolve(schedule);
                }
            }
        });
    });
}