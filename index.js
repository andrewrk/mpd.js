  prototype.sendCommand = function(command, callback){
    callback == null && (callback = noop);
    if (this.idling) {
      this.send("noidle\n");
    }
    this.sendWithCallback(command, callback);
    this.sendWithCallback("idle", bind$(this, 'handleIdleResultsLoop'));
    this.idling = true;
  };
  prototype.sendCommands = function(command_list, callback){
    callback == null && (callback = noop);
    if (command_list.length === 0) {
      return;
    }
    this.sendCommand("command_list_begin\n" + command_list.join("\n") + "\ncommand_list_end", callback);
  };
  prototype.handleMessage = function(err, msg){
    var handler;
    handler = this.msg_handler_queue.shift();
    handler(err, msg);
  };
  prototype.receive = function(data){
    var m, msg, line, code, str, err;
    this.buffer += data;
    for (;;) {
      m = this.buffer.match(MPD_SENTINEL);
      if (m == null) {
        return;
      }
      msg = this.buffer.substring(0, m.index);
      line = m[0], code = m[1], str = m[2];
      if (code === "ACK") {
        this.emit('error', str);
        err = new Error(str);
        this.handleMessage(err);
      } else if (line.indexOf("OK MPD") === 0) {
        this.emit('connect');
      } else {
        this.handleMessage(null, msg);
      }
      this.buffer = this.buffer.substring(msg.length + line.length + 1);
    }
  };
  return Mpd;
}(EventEmitter));
function extend$(sub, sup){
  function fun(){} fun.prototype = (sub.superclass = sup).prototype;
  (sub.prototype = new fun).constructor = sub;
  if (typeof sup.extended == 'function') sup.extended(sub);
  return sub;
}
function bind$(obj, key){
  return function(){ return obj[key].apply(obj, arguments) };
}
