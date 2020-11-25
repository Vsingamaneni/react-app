const path = require('path');
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mysql = require('mysql');
var crypto = require('crypto');
var schedule = require('./schedule');
const urlencodedParser = bodyParser.urlencoded({ extended: false })

const { check, validationResult } = require('express-validator')

const app = express();

var cryptPass = require('./password');

// dev config
const connection=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'',
    database:'react'
});



// MySQL GOOGLE CLOUD  config
// const connection=mysql.createConnection({
//     host:'34.71.143.66',
//     user:'root',
//     password:'',
//     port:3306,
//     socketPath:'/cloudsql/myreact-295818:us-central1:react-app',
//     database:'EmployeeDB'
// });


module.exports = app;

connection.connect(function(error){
    if(!!error) console.log(error);
    else console.log('Database Connected!');
}); 

//set views file
app.set('views',path.join(__dirname,'views'));
			
//set view engine
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(__dirname + '/public'));
app.use('/public', express.static('public'));


// Schedule routes
app.get('/schedule', schedule.view);

app.get('/',(req, res) => {
    //res.send('Hello There');
    let sql = "SELECT * FROM users";
    let query = connection.query(sql, (err, rows) => {
        if(err) throw err;
        res.render('user_index', {
            title : 'DB Operations',
            users : rows
        });
    });
});


app.get('/add',(req, res) => {
    res.render('user_add', {
        title : 'DB Operations'
    });
});

app.get('/login',(req, res) => {
    res.render('login', {
        title : 'Scoreboard'
    });
});

app.get('/register',(req, res) => {
    res.render('register', {
        title : 'Register'
    });
});

app.post('/registerSave',urlencodedParser, [
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
        res.render('register', {
            alert
        })
    } else {
    
    var jsonObj = cryptPass.encryptPassword(req.body.password);
        
    let data = {fname: req.body.fname,lname: req.body.lname, email: req.body.email, phoneNumber: req.body.phoneNumber, 
        country: req.body.country, securityQuestion: req.body.question, securityAnswer: req.body.securityAnswer, role: req.body.role,
        encryptedPass: jsonObj.passCrypto, salt: jsonObj.saltKey, isActive: 'N', isAdminActivated: 'N', paymentPref: req.body.preference
    };
    let sql = "INSERT INTO REGISTER SET ?";
    let query = connection.query(sql, data,(err, results) => {
      if(err) throw err;
      res.redirect('/login');
      
    });}
});

app.post('/userLogin',urlencodedParser, [
    check('email', 'Email is not valid')
        .isEmail()
        .normalizeEmail({ gmail_remove_dots: false }),     
    check('password')
        .exists(),
    check('password', 'Incorrect Email or Password')
        .custom(async(value, { req }) => {
            var loginDetails = await cryptPass.loginUser(connection, req);
            console.log("receving salt" ,loginDetails.saltKey);
            console.log("receving pass" ,loginDetails.encryptedPass);
            var encryptedPass =  cryptPass.validatePassword(req.body.password, loginDetails.encryptedPass, loginDetails.saltKey);
        if (!encryptedPass) { 
            throw new Error('Incorrect Email or Password');
        }   
        return true;
      })
], (req, res)=> {
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
        // return res.status(422).jsonp(errors.array())
        const alert = errors.array()
        res.render('login', {
            alert
        })
    } else {
      res.redirect('/');      
    }
});

app.post('/save',(req, res) => { 
    let data = {name: req.body.name, email: req.body.email, phone_no: req.body.phone_no};
    let sql = "INSERT INTO users SET ?";
    let query = connection.query(sql, data,(err, results) => {
      if(err) throw err;
      res.redirect('/');
    });
});

app.get('/edit/:userId',(req, res) => {
    const userId = req.params.userId;
    let sql = `Select * from users where id = ${userId}`;
    let query = connection.query(sql,(err, result) => {
        if(err) throw err;
        res.render('user_edit', {
            title : 'DB Operations',
            user : result[0]
        });
    });
});


app.post('/update',(req, res) => {
    const userId = req.body.id;
    let sql = "update users SET name='"+req.body.name+"',  email='"+req.body.email+"',  phone_no='"+req.body.phone_no+"' where id ="+userId;
    let query = connection.query(sql,(err, results) => {
      if(err) throw err;
      res.redirect('/');
    });
});


app.get('/delete/:userId',(req, res) => {
    const userId = req.params.userId;
    let sql = `DELETE from users where id = ${userId}`;
    let query = connection.query(sql,(err, result) => {
        if(err) throw err;
        res.redirect('/');
    });
});


// Server Listening
app.listen(8080, () => {
    console.log('Server is running at port 8080');
});