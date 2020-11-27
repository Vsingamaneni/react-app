const path = require('path');
const express = require('express');
const mysql = require('mysql');
var cryptPass = require('./password');
const bodyParser = require('body-parser');

const urlencodedParser = bodyParser.urlencoded({ extended: false })
const { check, validationResult } = require('express-validator')

const app = express();

//set views file
app.set('views',path.join(__dirname,'views'));
			
//set view engine
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(__dirname + '/public'));
app.use('/public', express.static('public'));

const connection=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'react'
});

function requireLogin(req, res, next) {
    if (req.cookies.loginDetails) {
        var loginDetails = JSON.parse(req.cookies.loginDetails);
        if (loginDetails.email) {
            return res.send(loginDetails.memberId + ", " +loginDetails.email + ", " + loginDetails.fName+ ", " + loginDetails.lName);
        }
        next();
    } else {
        res.redirect('/login');
    }
};


exports.login = app.get('/login', function(req, res){
    if (req.cookies.loginDetails) {
        res.redirect('/dashboard');
    }

    res.render('register/login', {
        title : 'Scoreboard'
    });
  });

exports.register = app.get('/register', function(req, res){
    if (req.cookies.loginDetails) {
        res.redirect('/dashboard');
    }
    res.render('register/register', {
        title : 'Register'
    });
});

exports.forgetPass = function(req, res){
    res.render('register/forgot', {
        title : 'Register'
    });
};

// Validates user login and password to reset
exports.retrieveUser = app.post('/retrieveUser', urlencodedParser, [
    check('email', 'Email is not valid')
        .isEmail()
        .normalizeEmail({ gmail_remove_dots: false })
], async(req, res)=> {
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
        const alert = errors.array()
        res.render('register/forgot', {
            alert
        })
    } else {
        const loginDetails = await cryptPass.loginUser(connection, req);
        req.session.email = loginDetails.email;
      res.render('register/reset', {
        title : 'Register',
        loginDetails : loginDetails.securityQuestion 
    });    
    }
});

// Validates user login and password to reset
exports.validateSecurityAnswer = app.post('/validateSecurity', urlencodedParser, [
    check('securityAnswer', 'Enter Valid Security Answer')
        .custom((value, { req }) => value != 'Security Answer'),  
    check('securityAnswer')
        .custom(async(value, { req }) => {
            req.body.email = req.session.email;
            var loginDetails = await cryptPass.loginUser(connection, req);
            if (value !== loginDetails.securityAnswer) { 
                throw new Error('Security Answer didnt match');
            }   
            return true;
        })
], async(req, res)=> {
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
        const alert = errors.array()
        res.render('register/forgot', {
            title : 'Forgot Password',
            alert
        })
    } else {
        req.session.emailId = req.session.email;
      res.render('register/updatePass', {
        title : 'Update Password'
    });    
    }
});

// Saves the user registration
exports.updatePassword = app.post('/updatePass',urlencodedParser, [      
    check('password')
        .exists(),
    check('cpassword', 'Passwords does not match')
        .exists()
        .custom((value, { req }) => value === req.body.password)
], (req, res)=> {
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
        const alert = errors.array()
        res.render('register/updatePass', {
            title : 'Update Password',
            alert
        })
    } else {
    
    var jsonObj = cryptPass.encryptPassword(req.body.password);

    let sql = "UPDATE REGISTER SET encryptedPass='"+jsonObj.passCrypto+"',  salt='"+jsonObj.saltKey+"' where email ='"+req.session.emailId+"'";
    let query = connection.query(sql, (err, results) => {
      if(err) throw err;
      res.redirect('/login');
      
    });}
});

// Validates user login and password and opens a session
exports.userLogin = app.post('/userLogin', urlencodedParser, [
    check('email', 'Email is not valid')
        .isEmail()
        .normalizeEmail({ gmail_remove_dots: false }),     
    check('password')
        .exists(),
    check('password', 'Incorrect Email or Password')
        .custom(async(value, { req }) => {
            var loginDetails = await cryptPass.loginUser(connection, req);
            var encryptedPass =  cryptPass.validatePassword(req.body.password, loginDetails.encryptedPass, loginDetails.saltKey);
        if (!encryptedPass) { 
            throw new Error('Incorrect Email or Password');
        }
        req.session.loginDetails = loginDetails;
        return true;
      })
], (req, res)=> {
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
        // return res.status(422).jsonp(errors.array())
        const alert = errors.array()
        res.render('register/login', {
            alert
        })
    } else {
        //res.redirect('/users');
        var loginDetails = req.session.loginDetails;
        var login = JSON.stringify({
            'fName': loginDetails.fName,
            'lName': loginDetails.lName,
            'email': loginDetails.email,
            'role': loginDetails.role,
            'memberId': loginDetails.memberId,
            'team': loginDetails.selectedTeam
        });

        res.cookie('loginDetails', login, {maxAge: 60 * 60 * 24 * 30, httpOnly: true});
        /*res.render('schedule/test', {
            team : loginDetails.team
        });*/

        res.render('schedule/user_index_nav', {
            title : 'DB Operations',
            team : loginDetails.team
        });
    }
});

// Saves the user registration
exports.registerUser = app.post('/registerSave',urlencodedParser, [
    check('fname', 'Enter Valid First Name')
        .custom((value, { req }) => value != 'First Name'),  
    check('lname', 'Enter Valid Last Name')
        .custom((value, { req }) => value != 'Last Name'), 
    check('email', 'Email is not valid')
        .isEmail()
        .normalizeEmail({ gmail_remove_dots: false }),     
    check('cemail', 'Confirm Email is not valid')
        .isEmail()
        .normalizeEmail({ gmail_remove_dots: false }),     
    check('cemail', 'Emails Doesnt match')
        .exists()
        .custom((value, { req }) => value === req.body.email),       
    check('password')
        .exists(),
    check('cpassword', 'Passwords does not match')
        .exists()
        .custom((value, { req }) => value === req.body.password),
    check('country', 'Select Country')
        .custom((value, { req }) => value != '--- Select Country ---'),
    check('favTeam', 'Select Favourite Team')
        .custom((value, { req }) => value != '--- Select Favourite Team ---'),
    check('question', 'Select Security Question')
        .custom((value, { req }) => value != '--- Select Security Question ---'),     
    check('securityAnswer', 'Enter Valid Security Answer')
        .custom((value, { req }) => value != 'Security Answer'),  
    check('phoneNumber', 'Enter Valid Mobile Number')
        .custom((value, { req }) => value != 'Mobile Number'),   
    check('secretKey', 'Enter correct secret key')
        .custom((value, { req }) => value != 'Secret Key'),  
    check('secretKey', 'Wrong Secret Key')
        .custom(async(value, { req }) => {
        if (value !== await cryptPass.adminRules(connection)) { 
            throw new Error('Enter matching Secret Key');
        }   
        return true;
      })
        
], (req, res)=> {
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
        const alert = errors.array()
        res.render('register/register', {
            alert
        })
    } else {
    
    var jsonObj = cryptPass.encryptPassword(req.body.password);
        
    let data = { fname: req.body.fname,lname: req.body.lname, email: req.body.email, phoneNumber: req.body.phoneNumber,
        country: req.body.country, securityQuestion: req.body.question, securityAnswer: req.body.securityAnswer, role: req.body.role,
        encryptedPass: jsonObj.passCrypto, salt: jsonObj.saltKey, isActive: 'N', isAdminActivated: 'N', paymentPref: req.body.preference,
        selectedTeam: req.body.team };

    let sql = "INSERT INTO REGISTER SET ?";

    let query = connection.query(sql, data,(err, results) => {
      if(err) throw err;
      res.redirect('/login');
      
    });}
});