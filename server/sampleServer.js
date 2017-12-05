var fs = require('fs');
var jwt = require('jsonwebtoken');
var https = require('https');
const uuidv4 = require('uuid/v4');

var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var http = require('http').createServer(app);
var versionRouter = express();


versionRouter.set('view engine', 'ejs');  //tell Express we're using EJS
versionRouter.use(bodyParser.json());
versionRouter.use(bodyParser.urlencoded({ extended: false }))
var versionBuildPath = "/";

/****************** Set your values ******************/
var keyFileName = ""; // Download from https://developer.apple.com/account/ios/authkey/
var keyId = ""; // Can be found at: https://developer.apple.com/account/ios/authkey/
var teamId = ""; // Can be found at: https://developer.apple.com/account/#/membership/

var port = 3000;

// Change this to true when you're app is on the App Store
var production = false;
/****************** End set your values ******************/

if(keyFileName == "") {
  console.log("Missing required parameters.");
  console.log("Make sure you've entered your keyFileName, keyId and teamId.");
  return;
}

var deviceCheckHost = production ? 'api.devicecheck.apple.com' : 'api.development.devicecheck.apple.com';
var cert = fs.readFileSync(keyFileName).toString();

versionRouter.post('/update_two_bits', function(req, response) {
  console.log("\n\n\n\n\n");
  var dctoken = req.body.token;
  var bit0 = req.body.bit0;
  var bit1 = req.body.bit1;

  console.log("Updating two bits to:");
  console.log("bit0: "+bit0);
  console.log("bit1: "+bit1);
  
  var jwToken = jwt.sign({}, cert, { algorithm: 'ES256', keyid: keyId, issuer: teamId});

  // Build the post string from an object
  var post_data = {
      'device_token' : dctoken,
      'transaction_id': uuidv4(),
      'timestamp': Date.now(),
      'bit0': bit0,
      'bit1': bit1
  }
  // An object of options to indicate where to post to
  var post_options = {
      host: deviceCheckHost,
      port: '443',
      path: '/v1/update_two_bits',
      method: 'POST',
      headers: {
          'Authorization': 'Bearer '+jwToken
      }
  };

  // Set up the request
  var post_req = https.request(post_options, function(res) {
      res.setEncoding('utf8');

      console.log(res.headers);
      console.log("statusCode: "+res.statusCode);

      var data = "";
      res.on('data', function (chunk) {
        data += chunk;
      });
      res.on('end', function() {
        console.log(data);
        response.send({"status": res.statusCode});
      });

      res.on('error', function(data) {
        console.log('error');
        console.log(data);
        response.send({"status": res.statusCode});
      });
  });

  // post the data
  post_req.write(new Buffer.from(JSON.stringify(post_data)));
  post_req.end();
});

versionRouter.post('/query_two_bits', function(req, response) {
  console.log("\n\n\n\n\n");
  console.log("Querying two bits");
  var dctoken = req.body.token;
  
  var jwToken = jwt.sign({}, cert, { algorithm: 'ES256', keyid: keyId, issuer: teamId});

  // Build the post string from an object
  var post_data = {
      'device_token' : dctoken,
      'transaction_id': uuidv4(),
      'timestamp': Date.now()
  }
  // An object of options to indicate where to post to
  var post_options = {
      host: deviceCheckHost,
      port: '443',
      path: '/v1/query_two_bits',
      method: 'POST',
      headers: {
          'Authorization': 'Bearer '+jwToken
      }
  };

  // Set up the request
  var post_req = https.request(post_options, function(res) {
      res.setEncoding('utf8');

      console.log(res.headers);
      console.log("statusCode: "+res.statusCode);

      var data = "";
      res.on('data', function (chunk) {
        data += chunk;
      });
      res.on('end', function() {
        try {
          var json = JSON.parse(data);
          console.log(json);
          response.send({"status": res.statusCode,
                         "bit0": json.bit0,
                         "bit1": json.bit1,
                         "lastUpdated": json.last_update_time});
        } catch (e) {
          console.log('error');
          console.log(data);
          response.send({"status": res.statusCode});
        }
      });

      res.on('error', function(data) {
        console.log('error');
        console.log(data);
        response.send({"status": res.statusCode});
      });
  });

  // post the data
  post_req.write(new Buffer.from(JSON.stringify(post_data)));
  post_req.end();
});

app.use(versionBuildPath, versionRouter);
// Start server on port 3000
http.listen(port);