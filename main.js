const APP_ID = "914f7af2b652488db4a7c6998460136a";
const FRAME_RATE = 20;

let token = null;
let uid = String(Math.floor(Math.random() * 10000));

let client;
let channel;

let localStream;
let remoteStream;
let stenStream;
let peerConnection;

let inputBuffer;
let outputBuffer;
const servers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
};
let init = async () => {
  client = await AgoraRTM.createInstance(APP_ID);
  await client.login({ uid, token });

  channel = client.createChannel("main");
  await channel.join();

  channel.on("MemberJoined", handleUserJoined);

  client.on("MessageFromPeer", handleMessageFromPeer);
  localStream = await navigator.mediaDevices.getUserMedia({
    video: {
      frameRate: { exact: 20 },
    },
    audio: false,
  });

  document.getElementById("user-1").srcObject = localStream;
  document.getElementById("user-1").onclick = grabFrame;

  document.getElementById("edited-stream").srcObject = canvas2.captureStream();
  stenStream = canvas2.captureStream();
};

let grabFrame = () => {
  let imageCap = new ImageCapture(remoteStream.getVideoTracks()[0]);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  imageCap.grabFrame().then((imageBitmap) => {
    console.log("Grabbed frame: ", imageBitmap);
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    context.drawImage(imageBitmap, 0, 0);
    const data = context.getImageData(0, 0, 50, 50).data;
    const rgbaArr = [];
    for (let i = 0; i < data.length; i += 4) {
      const rgba = {
        r: data[i],
        g: data[i + 1],
        b: data[i + 2],
        a: data[i + 3],
      };
      rgbaArr.push(rgba);
    }
    console.log(rgbaArr);
  });
};
let handleMessageFromPeer = async (message, MemberId) => {
  message = JSON.parse(message.text);
  if (message.type === "offer") {
    createAnswer(MemberId, message.offer);
  }
  if (message.type === "answer") {
    addAnswer(message.answer);
  }
  if (message.type === "candidate") {
    if (peerConnection) {
      peerConnection.addIceCandidate(message.candidate);
    }
  }
};
let handleUserJoined = async (MemberId) => {
  console.log("A new user joined the channel: ", MemberId);
  createOffer(MemberId);
};

let createPeerConnection = async (MemberId) => {
  peerConnection = new RTCPeerConnection(servers);

  remoteStream = new MediaStream();
  document.getElementById("user-2").srcObject = remoteStream;

  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });

    document.getElementById("user-1").srcObject = localStream;
  }

  stenStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, stenStream);
  });

  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      client.sendMessageToPeer(
        {
          text: JSON.stringify({
            type: "candidate",
            candidate: event.candidate,
          }),
        },
        MemberId
      );
    }
  };

  /*
  setInterval(() => {
    grabFrame();
  }, 50);
  */
};

let createOffer = async (MemberId) => {
  await createPeerConnection(MemberId);
  let offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);

  client.sendMessageToPeer(
    { text: JSON.stringify({ type: "offer", offer: offer }) },
    MemberId
  );
};

let createAnswer = async (MemberId, offer) => {
  await createPeerConnection(MemberId);

  await peerConnection.setRemoteDescription(offer);

  let answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);

  client.sendMessageToPeer(
    { text: JSON.stringify({ type: "answer", answer: answer }) },
    MemberId
  );
};

let addAnswer = async (answer) => {
  if (!peerConnection.currentRemoteDescription) {
    peerConnection.setRemoteDescription(answer);
  }
};

let sendSten = async () => {
  alert(document.getElementById("myTextarea").value);
};
const canvas1 = document.createElement("canvas");
const canvas2 = document.createElement("canvas");
let inputCtx = canvas1.getContext("2d");
let outputCtx = canvas2.getContext("2d");
let CameraStreamToBmpStream = () => {
  /* if (!localStream || !peerConnection) return;
  let imageCap = new ImageCapture(localStream.getVideoTracks()[0]);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  imageCap.grabFrame().then((imageBitmap) => {
    canvas.width = imageBitmap.width;
    canvas.height = imageBitmap.height;
    context.drawImage(imageBitmap, 0, 0);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] -= 1;
    }
    context.putImageData(imageData, 0, 0);

    stenStream = canvas.captureStream(20);
    document.getElementById("edited-stream").srcObject = stenStream;
    requestAnimationFrame(CameraStreamToBmpStream);
  
  });
  */
  const width = 300;
  const height = 225;

  inputCtx.drawImage(document.getElementById("user-1"), 0, 0, width, height);
  outputCtx.drawImage(document.getElementById("user-1"), 0, 0, width, height);
  const pixelData = inputCtx.getImageData(0, 0, width, height);
  const arr = pixelData.data;

  // Iterate through every pixel, calculate x,y coordinates
  for (let i = 0; i < arr.length; i += 4) {
    arr[i] = 30;
  }

  // write the manipulated pixel data to the second canvas
  outputCtx.putImageData(pixelData, 0, 0);
};

init();

setInterval(() => {
  CameraStreamToBmpStream();
}, 10);
