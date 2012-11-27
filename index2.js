var EventEmitter = require('events').EventEmitter
  , MPD_SENTINEL = /^(OK|ACK|list_OK)(.*)$/m;

module.exports = function MpdClient() {
  EventEmitter.call(this);
  this.buffer = "";
  this.msg_handler_queue = [];
  this.idling = false;
  return this;
}

MpdClient.Command = function Command(name, args) {
  this.name = name;
  this.args = args;

  this.computeToString();
}
Command.prototype.toString = function() {
  return this.to_string;
}
Command.prototype.computeToString = function() {
  this.escaped_args = [];
  for (var i = 0; i < this.args.length; ++i) {
    this.escaped_args.push(argEscape(this.args[i]));
  }
  this.to_string = this.name + " " + this.escaped_args.join(" ");
}

MpdClient.prototype.sendCommand = function(command, callback) {
  var self = this;
  callback = callback || noop;
  if (self.idling) self.send("noidle\n");
  self.sendWithCallback(command, callback);
  self.sendWithCallback("idle", function (msg) {
    self.handleIdleResultsLoop(msg);
  });
  self.idling = true;
}

MpdClient.prototype.sendCommands = function(command_list, callback) {
  
}

MpdClient.prototype.handleIdleResultsLoop = function(err, msg){
  var self = this;
  if (err) throw err;
  self.handleIdleResults(msg);
  if (self.msg_handler_queue.length === 0) {
    self.sendWithCallback("idle", function (err, msg) {
      self.handleIdleResultsLoop(err, msg);
    });
  }
};

MpdClient.prototype.handleIdleResults = function(msg){
  var events = msg.split("\n");
  for (var i = 0; i < 
  var i$, ref$, len$, system, ref1$, updateFunc;
  for (i$ = 0, len$ = (ref$ = trim(msg).split("\n")).length; i$ < len$; ++i$) {
    system = ref$[i$];
    if (system.length > 0) {
      updateFunc = (ref1$ = this.updateFuncs[system.substring(9)]) != null ? ref1$ : noop;
      updateFunc();
    }
  }
};

MpdClient.prototype.sendWithCallback = function(cmd, cb){
  cb = cb || noop;
  this.msg_handler_queue.push(cb);
  this.send(cmd + "\n");
};

MpdClient.prototype.send = function(data){
  this.emit('data', data);
};

function argEscape(thing){
  return thing.toString().replace(/"/g, '\\"');
}
function noop(err){
  if (err) throw err;
}
