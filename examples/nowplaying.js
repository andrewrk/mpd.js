var mpd = require('../'),
    cmd = mpd.cmd
var client = mpd.connect({
  host: 'localhost',
  port: 6600,
  password: ''
});
client.on('ready', function() {
  console.log("ready");
});
client.on('system', function(name) {
  console.log("update", name);
});
client.on('system-player', function() {
  client.sendCommand(cmd("status", []), function(err, msg) {
    if (err) throw err;
    console.log(msg);
  });
});
