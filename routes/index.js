var express = require('express');
var router = express.Router();
var path = require('path');
var request = require('request');
const readline = require('readline');
const fs = require('fs');
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.post('/output', function(req,res){
  var line_arr = [];
  var ext = path.extname(req.file.originalname).toLowerCase();
  var description = req.body.description;
  var counter = 0;
  var origin_pos = 0; // ORIGIN_HEADER position
  var client_ip_pos = 0; // CLIENT_IP position
  if(description.length > 0) {
    description = description.toLowerCase().split(" ");
    description.forEach(function(doc){
      if(doc == 'origin_header'){
        origin_pos = counter;
      }else if(doc == 'client_ip:port'){
        client_ip_pos = counter;
      }
      counter = counter + 1;
    });
  }else{
    res.render('output',{"message":"Description field is empty","success":false});
  }

  if(ext == '.txt'){
    var lineReader = readline.createInterface({
      input: fs.createReadStream(req.file.path)
    });
    lineReader.on('line', function (line) {
      var line_obj = {};
      if(line){
        // r1 = /(?:"[^"]*"|^[^"]*$)/;
        r1 =  line.match(/"(.*?)"/);
        // var reg = line.match(r1);
        console.log(r1);
        var line_split = line.split(" ");
        if(line_split[origin_pos].indexOf('.com') > -1){
          var ip_regex = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
          // var client_ip = line_split[client_ip_pos].split(":");
          var client_ip = line.match(ip_regex)[0];
          console.log(client_ip);
          var url_request = 'http://ipinfo.io/'+ client_ip;
          lineReader.pause();
          request(url_request,function(error, response, body){
            // console.log(response);
            if(response.statusCode == 200){
              lineReader.resume();
              var output = JSON.parse(body);
              if(output.country != 'IN'){
                line_obj.status = 'Yes';
                line_obj.line = line;
              }else{
                line_obj.status = 'No';
                line_obj.line = line;
              }
              line_arr.push(line_obj);

            }
          });
        }else{
          line_obj.status = 'Yes';
          line_obj.line = line;
          line_arr.push(line_obj);
        }
      }
    }).on('close',function(){
      res.render('output',{data:line_arr,success:true});
    });
  }else{
    res.render('output',{"message":"Not valid extension","success":false});
  }
});

module.exports = router;
