import {
  sleep,
  makeid,
  str2frame,
  sendFrame,
  sendMessage,
} from "./lib/main_handler.js";
import {
  encode as encode_arr,
  insertflag,
  decode as decode_arr,
  next_signed,
  next,
  distance,
} from "./lib/sten.js";
import {
  generateRsaPair,
  exportCryptoKey,
  importCryptoKey,
  rsa_encrypt,
  rsa_decrypt,
} from "./lib/rsa_handler.js";
const APP_ID = "914f7af2b652488db4a7c6998460136a";
const FRAME_RATE = 20;

let remote_track;

//test

let current_hash_str = "";
let remote_hash_str = "";

let isRemotePublicKeyExists = false;
let remote_public_key;
const rsa_pair = await generateRsaPair();

let receivingM = "";
let receivingStr = "";
let isReceivingFrame = false;
let ascii_buffer = 10000;
let m_text = "";
let temp_text = "";
let sender_obj;
let dataChannel;
let isDataChannelOpen = false;
const width = 300;
const height = 225;

const canvas1 = document.createElement("canvas");
const canvas2 = document.createElement("canvas");
let inputCtx = canvas1.getContext("2d");
let outputCtx = canvas2.getContext("2d");

let token = null;
let uid = String(Math.floor(Math.random() * 10000));

let client;
let channel;

let queryString = window.location.search;
let urlParams = new URLSearchParams(queryString);
let roomID = urlParams.get("room");
console.log(roomID);
document.getElementById("title").innerHTML = `Room ${roomID}`; //urlParams.get("room");
if (!roomID) {
  window.location = "home.html";
}

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

  channel = client.createChannel(roomID);
  await channel.join();

  channel.on("MemberJoined", handleUserJoined);
  channel.on("MemberLeft", handleUserLeft);

  client.on("MessageFromPeer", handleMessageFromPeer);
  localStream = await navigator.mediaDevices.getUserMedia({
    video: {
      frameRate: { exact: 20 },
    },
    audio: false,
  });

  document.getElementById("user-1").srcObject = localStream;
  document.getElementById("user-1").onclick = grabFrame;

  /*document.getElementById("edited-stream").srcObject = canvas2.captureStream();*/
  stenStream = localStream; //canvas2.captureStream();
};

let handleUserLeft = (MemberId) => {
  //Handle When User left
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
    remote_track = true;
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

  //create data channel (initiator)
  dataChannel = peerConnection.createDataChannel("sten");

  dataChannel.onerror = (error) => {
    console.log("Data Channel Error:", error);
    isDataChannelOpen = false;
  };

  dataChannel.onmessage = (event) => {
    onmessageHandler(event);
  };
  dataChannel.onopen = async () => {
    dataChannel.send(await exportCryptoKey(rsa_pair.publicKey));
    isDataChannelOpen = true;
  };
  dataChannel.onclose = () => {
    console.log("The Data Channel is Closed");
    isDataChannelOpen - false;
  };
};

let createOffer = async (MemberId) => {
  await createPeerConnection(MemberId);
  let offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  client.sendMessageToPeer(
    { text: JSON.stringify({ type: "offer", offer: offer }) },
    MemberId
  );
  //second user (reciever)
  peerConnection.ondatachannel = async (event) => {
    dataChannel = event.channel;
    dataChannel.onmessage = (event) => {
      onmessageHandler(event);
    };
    dataChannel.onclose = () => {
      console.log("The Data Channel is Closed");
      isDataChannelOpen = false;
    };
    dataChannel.onerror = (error) => {
      console.log("Data Channel Error:", error);
      isDataChannelOpen = false;
    };
    isDataChannelOpen = true;
    dataChannel.send(await exportCryptoKey(rsa_pair.publicKey));
  };
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

let beforeFirstTime = true;
let onmessageHandler = async (event) => {
  switch (event.data) {
    case "start-frame":
      isReceivingFrame = true;
      break;
    case "end-frame":
      if (beforeFirstTime) {
        document.getElementById("sten-remote").srcObject =
          canvas3.captureStream();
        beforeFirstTime = false;
      }

      isReceivingFrame = false;
      let frameData = str2frame(receivingStr, width, height);
      let arr = frameData.data;
      let return_obj = decode_arr(arr, current_hash_str);
      if (return_obj == "-1") {
        console.log("return_obj error");
        return -1;
      }
      remoteCtx.putImageData(frameData, 0, 0);
      receivingM += return_obj.str;
      receivingStr = "";
      break;
    case "end-message":
      //console.log("final message:",receivingM)

      ///here need to take the massage from recieveingM before its gone
      let convoTextarea = document.getElementById("callTextarea");
      convoTextarea.value += "friend: " + receivingM + "\n";

      receivingM = "";
      break;

    default:
      //check remote public key
      if (
        /^(-----BEGIN PUBLIC KEY-----\n)/.test(event.data) &&
        /(\n-----END PUBLIC KEY-----)$/.test(event.data)
      ) {
        remote_public_key = await importCryptoKey(event.data);
        current_hash_str = makeid(16);
        await dataChannel.send(
          "---string---" +
            (await rsa_encrypt(remote_public_key, current_hash_str))
        );
        isRemotePublicKeyExists = true;
        break;
      }
      if (/^---string---/.test(event.data)) {
        remote_hash_str = await rsa_decrypt(
          rsa_pair.privateKey,
          event.data.substring(12, event.data.length)
        );
        //console.log("remote_hash_str", remote_hash_str)
      }

      if (isReceivingFrame) {
        receivingStr = receivingStr + event.data;
      }
      break;
  }
};

let leaveChannel = async () => {
  await channel.leave();
  await channel.logout();
};

const canvas3 = document.createElement("canvas");
let remoteCtx = canvas3.getContext("2d");

//obj{text, inputCtx,width,height,dataChannel,remote_hash_str}
//this is the sender, gets text and send the text via embedded frames to the user

let sendSten = async () => {
  let text = document.getElementById("myTextarea").value;
  if (text == "") {
    return;
  }

  if (
    !(isDataChannelOpen && isRemotePublicKeyExists && remote_hash_str != "")
  ) {
    return;
  }

  document.getElementById("myTextarea").value = "";
  document.getElementById("sendButton").disabled = true;
  await sendMessage(
    text,
    inputCtx,
    width,
    height,
    dataChannel,
    remote_hash_str
  );
  //.log("done here bro")
  document.getElementById("sendButton").disabled = false;
};
document.getElementById("sendButton").onclick = sendSten;
window.addEventListener("beforeunload", leaveChannel);
init();
