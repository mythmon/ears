var http = require('http');
var fs = require('fs');
var cp = require('child_process');

var config = {}

var configFile = fs.readFile('config.json', function (err, data) {
  if (err) throw err;
  config = JSON.parse(data);
  console.log(config);
});

var server = http.createServer(function (req, res) {
  console.log("Got %s request to %s.", req.method, req.url);
  var data = '';

  req.addListener('data', function (chunk) { data += chunk; });
  req.addListener('end', function () {
    if (req.method != 'POST' || !data) {
      res.writeHead(500);
      res.end(JSON.stringify({"status": "what?"}));
      return;
    }
    data = data.replace(/^payload=/, '');
    data = decodeURIComponent(data);
    data = JSON.parse(data);

    handleHit(data, function (err) {
      if (err) {
        res.writeHead(500);
        res.end(JSON.stringify({"status": err}));
      } else {
        res.writeHead(200);
        res.end(JSON.stringify({"status": "ok"}));
      }
    });
  });
});

function handleHit(data, callback) {
  var repo = data.repository.name;
  options = config.repositories[repo];
  if (options === undefined) {
    callback('no such repository "' + repo + '"');
    return;
  }
  cp.exec('git pull', {cwd: options.path}, function (error, stdout, stderr) {
    if (error) {
      callback(stderr);
    } else {
      scriptPath = options.script;
      if (options.script !== undefined) {
        cp.exec(scriptPath, {cwd: options.path},
          function(error, stdout, stderr) {
            if (err) {
              callback(stderr);
            } else {
              callback();
            }
          });
      } else {
        callback();
      }
    }
  });
}

server.listen(8080);

// EOF vim:ts=2:sw=2
