const express = require('express');
const app = express();
const mysql = require('mysql2');
const ejs = require('ejs');
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded());
app.use(express.static(__dirname + '/public/'));
const server = require('http').createServer(app);
const items = require('./assets/items.js');
const users=require('./assets/users');
const { maxHeaderSize } = require('http');
const port = process.env.PORT || 8080;
server.listen(port, ()=>{
    console.log('Server running on port 3000...');
});



//Database stuff

var con = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || "3306",
    user: process.env.DB_USER || "username",
    password: process.env.DB_PASSSWORD || "password",
    database: process.env.DB_DATABASE || "database"
  });

//Create table for storing answers and response times
var dbSchema =`CREATE TABLE IF NOT EXISTS trials (
    participant INT,
    item int,
    answer varchar(255),
    time int,
    k varchar(255)
    );`
con.connect((err)=>{
    if(err) throw err;
    con.query(dbSchema, function(err) {
        if (err) {
          return console.log(err)
        }
        console.log("table trials were added")
    });
})


app.get('/', (req, res)=>{
    res.render('pages/home',{
        errmessage: ""
    });
});

app.post('/login', (req,res)=>{
    var username = req.body.username;
	var item = 0;
    if (username != undefined && username.length > 0){
        if (users.indexOf(username)>-1){
           var sql = `select max(item) as item from trials where participant = ?`;
			con.query(sql, [username], (err, result, fields)=>{
                    if (result[0].item != null){
                        item = result[0].item;
                        item++;                    
                    }
                    if (item == items.length){
                        return res.redirect('/end');
                    }
                    let sentence = items[item].replace(/#.+#/, '###');
                    res.render('pages/trial', {
                        username: username,
                        item: item,
                        sentence: sentence,
                        totalItems: items.length
                    })
                })
        }
        else{
            res.render('pages/home', {errmessage: "This user does not exist."});
        }
    }
    else{
        res.render('pages/home',{errmessage: "Not found"});
    }
})

app.get('/end', (req, res)=>{
    res.render('pages/end');
});
app.get('/:id', (req, res)=>{

    var username = req.params.id;
    var item = 0;
    if (username != undefined && username.length > 0){
        if (users.indexOf(username)>-1){
            var sql = `select max(item) as item from trials where participant = ?`;
                con.query(sql,[username], (err, result, fields)=>{
                    if (result[0].item != null){
                        item = result[0].item;
                        item++;                    
                    }
                    if (item == items.length){
                        console.log(result[0].item);
                        return res.redirect('/end');
                    }
                    let sentence = items[item].replace(/#.+#/, '###');
                    res.render('pages/trial', {
                        username: username,
                        item: item,
                        sentence: sentence,
                        totalItems: items.length
                    })
                })
            
        }
        else{
            res.render("pages/notfound");
        }
    }
    else{
        res.render("pages/notfound");
    }
});

app.post('/addResponse', (req, res)=>{
    var key = items[req.body.item].split('#');
    key = key[1];
    var sql ='insert into trials (participant, item, answer, time,k) values (?, ?, ?, ?, ?)';
    let qvals = req.body;
    let values = [qvals.username, qvals.item, qvals.answer, qvals.time, qvals.key]

    var item = ++req.body.item;

        con.query(sql,values, function(err) {
            if (err) {
                console.log(err);
                return res.json({"result": "error"});
            }        
            if (item == items.length){
                return res.json({"result": "end"});
            }else{
                let nextSentence = items[item].replace(/#.+#/, '###');
                res.json({
                    "result": "success",
                    item: item,
                    sentence: nextSentence
                });
            }
        });   
});



app.use((req, res, next) => {
    res.render("pages/notfound");
});

