const path = require('path');
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mysqlConn = require('mysql');
const app = express();

// dev config
// const connection=mysql.createConnection({
//     host:'localhost',
//     user:'root',
//     password:'',
//     database:'EmployeeDB'
// });


// prod config
const connection=mysqlConn.createConnection({
    host:'34.71.143.66',
    user:'root',
    password:'',
    port:3306,
    socketPath:'/cloudsql/myreact-295818:us-central1:react-app',
    database:'EmployeeDB'
});

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
    res.render('login', {
        title : 'Register'
    });
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