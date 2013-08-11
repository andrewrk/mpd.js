var EventEmitter = require('events').EventEmitter
  , util = require('util')
  , assert = require('assert')
  , net = require('net')
  , MPD_SENTINEL = /^(OK|ACK|list_OK)(.*)$/m
  , OK_MPD = /^OK MPD /

module.exports = MpdClient;
MpdClient.Command = Command
MpdClient.cmd = cmd;

function MpdClient() {
  EventEmitter.call(this);

  this.buffer = "";
  this.msgHandlerQueue = [];
  this.idling = false;
}
util.inherits(MpdClient, EventEmitter);

MpdClient.connect = function(options) {
  var client = new MpdClient();
  client.socket = net.connect(options, function() {
    client.emit('connect');
  });
  client.socket.setEncoding('utf8');
  client.socket.on('data', function(data) {
    client.receive(data);
  });
  client.socket.on('close', function() {
    client.emit('end');
  });
  client.socket.on('error', function(err) {
    client.emit('error', err);
  });
  return client;
}

MpdClient.prototype.receive = function(data) {
  var m;
  this.buffer += data;
  while (m = this.buffer.match(MPD_SENTINEL)) {
    var msg = this.buffer.substring(0, m.index)
      , line = m[0]
      , code = m[1]
      , str = m[2]
    if (code === "ACK") {
      var err = new Error(str);
      this.handleMessage(err);
    } else if (OK_MPD.test(line)) {
      this.setupIdling();
    } else {
      this.handleMessage(null, msg);
    }

    this.buffer = this.buffer.substring(msg.length + line.length + 1);
  }
};

MpdClient.prototype.handleMessage = function(err, msg) {
  var handler = this.msgHandlerQueue.shift();
  handler(err, msg);
};

MpdClient.prototype.setupIdling = function() {
  var self = this;
  self.sendWithCallback("idle", function(err, msg) {
    self.handleIdleResultsLoop(err, msg);
  });
  self.idling = true;
  self.emit('ready');
};

MpdClient.prototype.sendCommand = function(command, callback) {
  var self = this;
  callback = callback || noop.bind(this);
  assert.ok(self.idling);
  self.send("noidle\n");
  self.sendWithCallback(command, callback);
  self.sendWithCallback("idle", function(err, msg) {
    self.handleIdleResultsLoop(err, msg);
  });
};

MpdClient.prototype.sendCommands = function(commandList, callback) {
  var fullCmd = "command_list_begin\n" + commandList.join("\n") + "\ncommand_list_end";
  this.sendCommand(fullCmd, callback || noop.bind(this));
};

MpdClient.prototype.handleIdleResultsLoop = function(err, msg) {
  var self = this;
  if (err) {
    self.emit('error', err);
    return;
  }
  self.handleIdleResults(msg);
  if (self.msgHandlerQueue.length === 0) {
    self.sendWithCallback("idle", function(err, msg) {
      self.handleIdleResultsLoop(err, msg);
    });
  }
};

MpdClient.prototype.handleIdleResults = function(msg) {
  var self = this;
  msg.split("\n").forEach(function(system) {
    if (system.length > 0) {
      var name = system.substring(9);
      self.emit('system-' + name);
      self.emit('system', name);
    }
  });
};

MpdClient.prototype.sendWithCallback = function(cmd, cb) {
  cb = cb || noop.bind(this);
  this.msgHandlerQueue.push(cb);
  this.send(cmd + "\n");
};

MpdClient.prototype.send = function(data) {
  this.socket.write(data);
};

function Command(name, args) {
  this.name = name;
  this.args = args;
}

Command.prototype.toString = function() {
  return this.name + " " + this.args.map(argEscape).join(" ");
};

function argEscape(arg){
  // replace all " with \"
  return '"' + arg.toString().replace(/"/g, '\\"') + '"';
}

function noop(err) {
  if (err) this.emit('error', err);
}

// convenience
function cmd(name, args) {
  return new Command(name, args);
}

