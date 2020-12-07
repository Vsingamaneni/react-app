const path = require('path');
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
var utils = require('./util/ScheduleUtil');

const urlencodedParser = bodyParser.urlencoded({extended: false})
const {check, validationResult} = require('express-validator')

const app = express();

//set views file
app.set('views', path.join(__dirname, 'views'));

//set view engine
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(express.static(__dirname + '/public'));
app.use('/public', express.static('public'));

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'react'
});

function requireLogin(req, res, next) {
    if (req.cookies && req.cookies.loginDetails) {
        var loginDetails = JSON.parse(req.cookies.loginDetails);
        if (loginDetails.email) {
            return res.send(loginDetails.memberId + ", " + loginDetails.email + ", " + loginDetails.fName + ", " + loginDetails.lName);
        }
        next();
    } else {
        res.redirect('/login');
    }

};

exports.dashboard = app.get('/dashboard', async (req, res) => {
    if (req.cookies.loginDetails) {
        var loginDetails = JSON.parse(req.cookies.loginDetails);

        var schedule = await utils.matchDetails(connection);

        res.render('schedule/dashboard', {
            title: 'Dashboard',
            team: loginDetails.team,
            dashboard: schedule[0],
            dashboard1: schedule[1]
        });
    }

    res.render('register/login', {
        title: 'Scoreboard'
    });
});

exports.schedule = app.get('/schedule', requireLogin, function (req, res) {
    if (!req.session.user) {
        res.redirect('/login');
    } else {
        res.render('schedule/schedule', {
            title: 'Viewing Schedule '
        });
    }
});


exports.setCookie = app.get('/setcookie', function (req, res) {
    // setting cookies
    var loginDetails = JSON.stringify({
        'username': 'vamsi',
        'email': 'v@gmail.com'
    });

    res.cookie('loginDetails', loginDetails, {maxAge: 60 * 60 * 24 * 30, httpOnly: true});
    return res.send('Cookie has been set');
});

exports.getCookie = app.get('/getcookie', function (req, res) {
    if (req.cookies.loginDetails) {
        var loginDetails = JSON.parse(req.cookies.loginDetails);
        if (loginDetails.email) {
            return res.send(loginDetails.memberId + ", " + loginDetails.email + ", " + loginDetails.fName + ", " + loginDetails.lName + ", " + loginDetails.team);
        }
    }

    return res.send('No cookie found');
});

exports.removeCookie = app.get('/logout', function (req, res) {
    res.cookie('loginDetails', '', {expires: new Date(0)});

    var username = req.cookies['loginDetails'];
    if (username) {
        req.cookies['loginDetails'] = null;
    }
    res.redirect('/login');
});