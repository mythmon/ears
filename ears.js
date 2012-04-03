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
    data = data.replace(/^payload=/, '');
    data = decodeURIComponent(data);
    data = JSON.parse(data);

    handleHit(data, function (err) {
      if (err) {
        res.writeHead(500);
        console.log({"status": err});
        res.end(JSON.stringify({"status": err}));
      } else {
        res.writeHead(200);
        console.log({"status": "ok"});
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
  if (options.action === 'pull') {
    cp.exec('git pull', {cwd: options.path}, function (error, stdout, stderr) {
      if (error) {
        callback(stderr);
      } else {
        callback();
      }
    });
  }
}

server.listen(8080);

// EOF vim:ts=2:sw=2
