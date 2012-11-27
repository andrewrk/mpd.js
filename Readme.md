Protocol parser for [music player daemon](http://musicpd.org).
Works in node.js and the browser via [component](https://github.com/component/component/).

Usage:
------

node.js example
===============

```javascript
var MpdClient = require('mpdclient')
  , net = require("net")
  , socket = net.connect({port: 6600})
  , mpd_client = new MpdClient();

// hook up the data flow
socket.setEncoding('utf8');
mpd_client.on('send', function (data) {
  socket.write(data);
});
socket.on('data', function (data) {
  mpd_client.receive(data);
});

// listen to events
mpd_client.on('event_playlist', function() {
  // do something
});
/* events:
  === events from mpd ===
  'event_database': the song database has been modified after update.
  'event_update': a database update has started or finished. If the database
    was modified during the update, the database event is also emitted.
  'event_stored_playlist': a stored playlist has been modified, renamed, created or
    deleted
  'event_playlist': the current playlist has been modified
  'event_player': the player has been started, stopped or seeked
  'event_mixer': the volume has been changed
  'event_output': an audio output has been enabled or disabled
  'event_options': options like repeat, random, crossfade, replay gain
  'event_sticker': the sticker database has been modified.
  'event_subscription': a client has subscribed or unsubscribed to a channel
  'event_message': a message was received on a channel this client is subscribed to;
    this event is only emitted when the queue is empty

  === other ===
  'error': function (code, message) {} // mpd returned an error in response to a command.
*/
// there is also a generic event with the system name as a parameter:
mpd_client.on('event', function(name) {
  // `name` contains one of the events above, minus the `event_` part.
});
```
