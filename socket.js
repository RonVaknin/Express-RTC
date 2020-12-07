const socketio = require('socket.io');

//Server Socket managment

module.exports = function(server){
    io = socketio(server)
//Set or enter a chat room ========================================================================
    io.on('connection', (socket) => {
        socket.on('join', (roomId) => {
            // These events are emitted only to the sender socket.
            if (!io.sockets.adapter.rooms.has(roomId)) {
                console.log(`Creating room ${roomId} and emitting room_created socket event`);
                socket.data={room:roomId, userName:"Guest1"};
                socket.join(roomId);
                socket.emit('room_created', roomId);
            } else if(io.sockets.adapter.rooms.get(roomId).size == 1){
                console.log(`Joining room ${roomId} and emitting room_joined socket event`);
                socket.data={room:roomId, userName:"Guest2"};
                socket.join(roomId);
                socket.emit('room_joined', roomId);
            } 
            else {
                socket.emit('full_room', roomId);
            }
            console.info(io.sockets.adapter.rooms.get(roomId).size);
          });
        
//Video call event =================================================================================
        // These events are emitted to all the sockets connected to the same room except the sender.
        socket.on('start_call', (roomId) => {
            console.log(`Broadcasting start_call event to peers in room ${roomId}`)
            socket.broadcast.to(roomId).emit('start_call')
        })
        socket.on('webrtc_offer', (event) => {
            console.log(`Broadcasting webrtc_offer event to peers in room ${event.roomId}`)
            socket.broadcast.to(event.roomId).emit('webrtc_offer', event.sdp)
        })
        socket.on('webrtc_answer', (event) => {
            console.log(`Broadcasting webrtc_answer event to peers in room ${event.roomId}`)
            socket.broadcast.to(event.roomId).emit('webrtc_answer', event.sdp)
        })
        socket.on('webrtc_ice_candidate', (event) => {
            console.log(`Broadcasting webrtc_ice_candidate event to peers in room ${event.roomId}`)
            socket.broadcast.to(event.roomId).emit('webrtc_ice_candidate', event)
        })
//Text chat events ======================================================================
        socket.on('message', data => {
            let text = `${socket.data.userName}: ${data.text}`
            io.in(data.roomId).emit('message', text);
        });

        socket.on('userName', data => {
            socket.data.userName = data;
            console.info(socket.data);
        });
    });
}

  