var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

var clients = 0;
var roomno = 1;
var users = [];
io.on('connection', function(socket) {
  clients++;

  // To check number of clients connected
  socket.emit('test', {
    desc: 'SIMPLE CHAT APPLICATION',
    clientsCount: clients + 'connected'
  });

  // welcome a new connection
  socket.emit('new-connection', {
    text: 'Welcome to a simple chat application using Socket.IO'
  });

  // broadcast
  io.sockets.emit('broadcast', { clientsCount: clients + ' connected' });
  socket.on('clientEvent', function(data) {});

  //broadcast on disconnection
  socket.on('disconnect', function() {
    clients--;
    io.sockets.emit('broadcast', { clientsCount: clients + ' disconnected' });
  });

  // To implement room, allow max of 2 members in the room
  if (
    io.nsps['/'].adapter.rooms['room-' + roomno] &&
    io.nsps['/'].adapter.rooms['room-' + roomno].length > 1
  )
    roomno++;

  socket.join('room-' + roomno);

  //Send this event to everyone in the room.
  io.sockets
    .in('room-' + roomno)
    .emit('connectToRoom', '(You are in chat room no. ' + roomno + ')');
  socket.leave('room-' + roomno);

  // Invites a user, incluedes in list if it does not exist else throws error
  socket.on('setUsername', function(data) {
    if (!users.includes(data)) {
      users.push(data);
      socket.user = data;
      users[socket.user] = socket;
      socket.emit('userSet', { username: data });
    } else {
      socket.emit(
        'userExists',
        data + ' username is taken! Try some other username.'
      );
    }
  });
  socket.on('msg', function(data) {
    //Send message to everyone
    io.sockets.emit('newmsg', data);
  });

  // To show if user is typing a message
  socket.on('typing', function(data) {
    io.sockets.emit('user-typing', data);
  });
  socket.on('notTyping', function(data) {
    io.sockets.emit('user-typing-stopped', data);
  });

  // Remove user from chat list if browser tab is closed
  socket.on('disconnect', function(data) {
    io.sockets.emit('user-left', socket.user);
    delete users[socket.user];
  });
});

http.listen(3000, function() {
  console.log('listening on *:3000');
});
