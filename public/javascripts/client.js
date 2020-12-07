// Free public STUN servers provided by Google.
const iceServers = {
iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
],
}
//settings
    const socket = io();
    const mediaConstraints = {
        'video':true,
        'audio':true
    };
    let roomId;
    let rtcPeerConnection;
    let isRoomCreator;
//get DOM elements
    const videoChatContainer = document.getElementById('video-chat-container');
    const localVideoComponent = document.getElementById('local-video');
    const remoteVideoComponent = document.getElementById('remote-video');
    const events = document.getElementById('events');

    joinRoom(room);

//Text chat events ========================================================
    socket.on('message', data => {
        events.appendChild(newItem(`${data}`));
        $('[data-spy="scroll"]').each(function () {
            var $spy = $(this).scrollspy('refresh');
        });
    });
    socket.on('alert', data =>{
        events.appendChild(newAlertItem('connected'));
        $('[data-spy="scroll"]').each(function () {
            var $spy = $(this).scrollspy('refresh')
        });
    });

    function sendGlobalMessage(text){
        const data = {roomId,text};
        socket.emit("message", data);
    };

//enter or create chat room ================================================
    socket.on('room_created', async () => {
        console.log('Socket event callback: room_created');
        await setLocalStream(mediaConstraints);
        isRoomCreator = true;
        setName();
    });

    socket.on('room_joined', async () => {
        console.log('Socket event callback: room_joined');
        await setLocalStream(mediaConstraints);
        socket.emit('start_call', roomId);
        setName();
    });

    socket.on('full_room', () => {
        console.log('Socket event callback: full_room');
        window.alert('The room is full, please try another one');
        window.location.href='./';
    });

//DOM manipulation ==========================================================================    
//send message button
    $("#send-message").click(function(event){
        event.preventDefault();
        sendGlobalMessage($("#text-message").val());
        $("#text-message").val("");
    });
//new text message element
    const newItem = (content) => {
        const item = document.createElement('li');
        item.classList.add("list-group-item");
        item.innerText = content;
        return item;
    };
//new text message element (red)
    const newAlertItem = (content) =>{
        const item = document.createElement('li');
        item.style.color="red";
        item.classList.add("list-group-item");
        item.innerText = content;
        
        item.innerText = content;
        return item;
    };
//add video element (on new client join)
    const newVideoItem = (content) => {
        // console.info(content);
        const item = document.createElement('video');  
        item.srcObject=content;
        item.onloadedmetadata = function(e) {
            item.play();
        };
        return item;
    };

//Call socket events ================================================================
    socket.on('start_call', async () => {
        console.log('Socket event callback: start_call')
        if (isRoomCreator) {
            rtcPeerConnection = new RTCPeerConnection(iceServers)
            addLocalTracks(rtcPeerConnection)
            rtcPeerConnection.ontrack = setRemoteStream
            rtcPeerConnection.onicecandidate = sendIceCandidate
            await createOffer(rtcPeerConnection)
        }
    })

    socket.on('webrtc_offer', async (event) => {
        console.log('Socket event callback: webrtc_offer')

        if (!isRoomCreator) {
            rtcPeerConnection = new RTCPeerConnection(iceServers)
            addLocalTracks(rtcPeerConnection)
            rtcPeerConnection.ontrack = setRemoteStream
            rtcPeerConnection.onicecandidate = sendIceCandidate
            rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event))
            await createAnswer(rtcPeerConnection)
        }
    })

    socket.on('webrtc_answer', (event) => {
        console.log('Socket event callback: webrtc_answer');
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
    });

    socket.on('webrtc_ice_candidate', (event) => {
    // ICE candidate configuration.
        var candidate = new RTCIceCandidate({
            sdpMLineIndex: event.label,
            candidate: event.candidate,
        })
        rtcPeerConnection.addIceCandidate(candidate)
    });

// FUNCTIONS ==================================================================
    function joinRoom(room) {
        roomId = room;
        socket.emit('join', room);
    };
    async function setName(){
        let person = prompt("Please enter your name:", "Guest");
        if (person != null && person != "" && person != "Guest") {
            socket.emit('userName',person);
        }
    }
    async function setLocalStream(mediaConstraints) {
        let stream
        try {
            stream = await navigator.mediaDevices.getUserMedia(mediaConstraints)
        } catch (error) {
            console.error('Could not get user media', error)
        }

        localStream = stream
        localVideoComponent.srcObject = stream
        localVideoComponent.muted = true;
    };

    function addLocalTracks(rtcPeerConnection) {
    localStream.getTracks().forEach((track) => {
        rtcPeerConnection.addTrack(track, localStream)
        console.info(track)

    })
    }

    async function createOffer(rtcPeerConnection) {
        let sessionDescription
        try {
            sessionDescription = await rtcPeerConnection.createOffer()
            rtcPeerConnection.setLocalDescription(sessionDescription)
        } catch (error) {
            console.error(error)
        }

        socket.emit('webrtc_offer', {
        type: 'webrtc_offer',
        sdp: sessionDescription,
        roomId,
    })
    }

    async function createAnswer(rtcPeerConnection) {
        let sessionDescription
        try {
            sessionDescription = await rtcPeerConnection.createAnswer()
            rtcPeerConnection.setLocalDescription(sessionDescription)
        } catch (error) {
            console.error(error)
        }

        socket.emit('webrtc_answer', {
            type: 'webrtc_answer',
            sdp: sessionDescription,
            roomId,
        })
    }

    function setRemoteStream(event) {
        remoteVideoComponent.srcObject = event.streams[0]
        remoteStream = event.stream
    }

    function sendIceCandidate(event) {
        if (event.candidate) {
            socket.emit('webrtc_ice_candidate', {
                roomId,
                label: event.candidate.sdpMLineIndex,
                candidate: event.candidate.candidate,
            })
        }
    }

