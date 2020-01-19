// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();
var randomstring = require("randomstring");

var http = require('https')

const util = require('util');
var moment = require('moment');
const nodeRequest = require('request');

const bodyParser = require('body-parser');

const client_id = process.env.OAUTH_CLIENT_ID
const client_secret = process.env.OAUTH_CLIENT_SECRET

var states = { };

var users = [];

var taken = { };


// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));


// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get("/library", function (request, response) {
  response.sendFile(__dirname + '/views/library.html');
});

app.get("/oauth/authorise", function(request, response) {
  var state = randomstring.generate();
  states[state] = moment();
  var url = util.format('https://uclapi.com/oauth/authorise?client_id=%s&state=%s', client_id, state);
  response.redirect(url);
});

app.get("/oauth/complete", (request, response) => response.sendFile(__dirname + '/views/oauth/complete.html'));

app.get("/oauth/callback", function(request, response) {
  var timeNow = moment();
  if (request.query.state in states) {
    if (moment(states[request.query.state]).add(300, 'seconds') > timeNow) {
      if (request.query.result == "denied") {
        var deniedText = util.format('The login operation for state %s was denied', request.query.state);
        response.send(deniedText);
      } else {
        // Successful login
        var tokenUrl = util.format('https://uclapi.com/oauth/token?client_id=%s&client_secret=%s&code=%s', client_id, client_secret, request.query.code);
        console.log("Token URL: " + tokenUrl);
        var token = "";
        var name = "";
        nodeRequest(tokenUrl, { json: true }, (err, res, body) => {
          if (err) { return console.log(err); }
          token = body.token;
          console.log("Got token: " + token);
          var userDataUrl = util.format('https://uclapi.com/oauth/user/data?client_secret=%s&token=%s', client_secret, token);
          nodeRequest(userDataUrl, {json: true}, (err, res, body) => {
            if (err) { return console.log(err); }
            name = body.full_name;
            var protectionKey = randomstring.generate();
            var user = {
              "name": body.full_name,
              "department": body.department,
              "token": token,
              "auth_key": protectionKey
            }
            users.push(user);
            var userId = users.length - 1;
            var redirectUrl = util.format('/library?id=%s&key=%s', userId, protectionKey);
            response.redirect(redirectUrl);
          });
        });
      }
    } else {
      response.send("Authorisation took more than 5 minutes, so it has failed");
    }
  } else {
    response.send("state does not exist");
  }
});

app.get("/oauth/userdata/:id/:key", function(request, response) {
  var users_clean = Object.assign(users);
  if (users[request.params.id]["auth_key"] == request.params.key) {
    response.send(JSON.stringify(
    {
      "ok": true,
      "name": users[request.params.id]["name"],
      "department": users[request.params.id]["department"],
      "users":users_clean
    }));
  }
  else {
    response.send(JSON.stringify(
    {
      "ok": false
    }))
  }
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});


app.get("/user/:name", function(request, response) {
  
})

app.get("/timetable/:id/:key", function(request, response) {
  if (users[request.params.id]["auth_key"] == request.params.key) {
    var location = "https://uclapi.com/timetable/personal?token="
    location+=users[request.params.id]["token"] ;
    location+="&client_secret=";
    location+=process.env.OAUTH_CLIENT_SECRET;
    console.log(location)
    http.request(location, function(res) {
          res.pipe(response);
        }).on('error', function(e) {
          response.sendStatus(500);
        }).end();
    
       };   
});

app.get("/map", function(request, response) {
    var location = "https://uclapi.com/workspaces/images/map/live?token=uclapi-7d9ecf41de7f31-8da5522e8e5e9f-55d74c0f158113-d82a35c576f65e&survey_id=38&map_id=105"
    http.request(location, function(res) {
          res.pipe(response);
        }).on('error', function(e) {
          response.sendStatus(500);
        }).end();
       
});


app.get("/map/people/", function(request, response) {
         response.send(taken)
});

app.post("/map/add/", function(request, response) {
         taken[request.body.name] = request.body.id;
         console.log(taken)
});



function getTimeTableI(token){
    var location = "https://uclapi.com/timetable/personal?token="
    location+=token;
    location+="&secret=";
    location+=process.env.OAUTH_CLIENT_SECRET;
    return $.ajax({url: location});
}