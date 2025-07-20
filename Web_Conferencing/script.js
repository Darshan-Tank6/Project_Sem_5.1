// const socket = io();
// const roomId = "defaultRoom";
// const peers = {};
// const localVideos = document.getElementById("videos");
// let localStream = null;

// document.getElementById("start").onclick = async () => {
//   localStream = await navigator.mediaDevices.getUserMedia({
//     video: true,
//     audio: true,
//   });
//   addVideoStream("local", localStream);

//   socket.emit("join", roomId);
// };

// document.getElementById("share").onclick = async () => {
//   const screenStream = await navigator.mediaDevices.getDisplayMedia({
//     video: true,
//   });
//   // Replace video track in all peers
//   for (const id in peers) {
//     const sender = peers[id].getSenders().find((s) => s.track.kind === "video");
//     sender.replaceTrack(screenStream.getVideoTracks()[0]);
//   }
// };

// socket.on("new-user", (id) => {
//   const peer = createPeer(id);
//   peers[id] = peer;
// });

// socket.on("signal", async ({ from, signal }) => {
//   let peer = peers[from];
//   if (!peer) {
//     peer = createPeer(from);
//     peers[from] = peer;
//   }
//   await peer.signal(signal);
// });

// socket.on("user-disconnected", (id) => {
//   if (peers[id]) {
//     peers[id].destroy();
//     document.getElementById(id)?.remove();
//     delete peers[id];
//   }
// });

// function createPeer(remoteId) {
//   const peer = new SimplePeer({
//     initiator: true,
//     trickle: false,
//     stream: localStream,
//   });

//   peer.on("signal", (data) => {
//     socket.emit("signal", { to: remoteId, signal: data });
//   });

//   peer.on("stream", (stream) => {
//     addVideoStream(remoteId, stream);
//   });

//   return peer;
// }

// function addVideoStream(id, stream) {
//   let video = document.getElementById(id);
//   if (!video) {
//     video = document.createElement("video");
//     video.id = id;
//     video.autoplay = true;
//     video.playsInline = true;
//     localVideos.appendChild(video);
//   }
//   video.srcObject = stream;
// }

const socket = io();
const peers = {}; // key: socketId, value: RTCPeerConnection
const videoContainer = document.getElementById("videos");
let localStream = null;
let room = null;

// Buttons
document.getElementById("create").onclick = createRoom;
document.getElementById("join").onclick = joinRoom;

document.getElementById("share").onclick = async () => {
  const screenStream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
  });
  const screenTrack = screenStream.getVideoTracks()[0];

  // Replace the video track in each RTCPeerConnection
  Object.values(peers).forEach((pc) => {
    const sender = pc.getSenders().find((s) => s.track.kind === "video");
    if (sender) {
      sender.replaceTrack(screenTrack);
    }
  });

  // Replace local video preview
  const localVideo = document.getElementById("local");
  localVideo.srcObject = screenStream;

  // When screen sharing stops, go back to camera
  screenTrack.onended = () => {
    Object.values(peers).forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track.kind === "video");
      if (sender) {
        sender.replaceTrack(localStream.getVideoTracks()[0]);
      }
    });
    localVideo.srcObject = localStream;
  };
};

async function createRoom() {
  room = Math.random().toString(36).substring(2, 8);
  document.getElementById("roomCode").textContent = `Room Code: ${room}`;
  await start();
}

async function joinRoom() {
  room = document.getElementById("roomInput").value.trim();
  if (room) {
    document.getElementById("roomCode").textContent = `Joined Room: ${room}`;
    await start();
  }
}

async function start() {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });
  //   const screenStream = await navigator.mediaDevices.getDisplayMedia({
  //     video: true,
  //   });
  // Replace tracks or add them to RTCPeerConnection

  addVideo("local", localStream);
  socket.emit("join", room);
}

// When a new user joins
socket.on("user-joined", async (id) => {
  console.log("User joined:", id);
  const pc = createPeerConnection(id);
  peers[id] = pc;

  // Create offer
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  socket.emit("signal", { to: id, data: { sdp: pc.localDescription } });
});

// When receiving a signal
socket.on("signal", async ({ from, data }) => {
  let pc = peers[from];
  if (!pc) {
    pc = createPeerConnection(from);
    peers[from] = pc;
  }

  if (data.sdp) {
    await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
    if (data.sdp.type === "offer") {
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("signal", { to: from, data: { sdp: pc.localDescription } });
    }
  }

  if (data.candidate) {
    await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
});

// Handle user leaving
socket.on("user-left", (id) => {
  console.log("User left:", id);
  if (peers[id]) {
    peers[id].close();
    delete peers[id];
    document.getElementById(id)?.remove();
  }
});

// Create RTCPeerConnection
function createPeerConnection(id) {
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  // Add local tracks
  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

  // Send ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("signal", { to: id, data: { candidate: event.candidate } });
    }
  };

  // Remote stream
  pc.ontrack = (event) => {
    const [stream] = event.streams;
    addVideo(id, stream);
  };

  return pc;
}

// Add video element
function addVideo(id, stream) {
  let video = document.getElementById(id);
  if (!video) {
    video = document.createElement("video");
    video.id = id;
    video.autoplay = true;
    video.playsInline = true;
    videoContainer.appendChild(video);
  }
  video.srcObject = stream;
}
