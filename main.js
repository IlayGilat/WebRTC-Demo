import {test1} from './test.js'
import {encode as encode_arr, insertflag, decode as decode_arr,next_signed,next,distance} from './sten.js' 
const APP_ID = "914f7af2b652488db4a7c6998460136a";
const FRAME_RATE = 20;

let remote_track

//test
let receivingM = ""
let receivingStr = ""
let isReceivingFrame = false
let ascii_buffer = 10000
let m_text = ""
let temp_text = ""
let sender_obj
let dataChannel;
let isDataChannelOpen = false;
const width = 300;
const height = 225;
//end test


let token = null;
let uid = String(Math.floor(Math.random() * 10000));

let client;
let channel;

let queryString = window.location.search;
let urlParams = new URLSearchParams(queryString);
let roomID = "123"//urlParams.get("room");

if (!roomID) {
  window.location = "lobby.html";
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
  stenStream = localStream//canvas2.captureStream();


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
    isDataChannelOpen = false
  }

  dataChannel.onmessage = (event) => {
    /*//console.log("Got Data Channel Message:",String(event.data).charAt(0));
    console.log("Got Data Channel Message:",String(event.data).charAt(0));
    //if(event.data==="start"){
    //  isReceivingFrame = true;

    //}
    //if(event.data === "end")

    if(event.data==="start"){
      isReceivingFrame = true;

    }
    else if(event.data === "end"){
      isReceivingFrame = false;
      let arr = str2arr(receivingStr);
      console.log(arr.data)
    }
    else if(isReceivingFrame){
      receivingStr = receivingStr + event.data;
    }*/
    onmessageHandler(event)
  



  }
  dataChannel.onopen = () => {
    dataChannel.send("Hello World! ");
    isDataChannelOpen = true;
  }
  dataChannel.onclose = () => {
    console.log("The Data Channel is Closed");
    isDataChannelOpen - false;
  }
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
  peerConnection.ondatachannel = event => {
    dataChannel = event.channel;
    dataChannel.onmessage = event => {
      /*console.log("Got Data Channel Massage2:",event.data.charAt(0))
      if(event.data==="start"){
        isReceivingFrame = true;
  
      }
      else if(event.data === "end"){
        isReceivingFrame = false;
        let arr = str2arr(receivingStr);
        console.log(arr)
      }
      else if(isReceivingFrame){
        receivingStr = receivingStr + event.data;
      }*/
      onmessageHandler(event)
    };
    dataChannel.onclose = () => {
      console.log("The Data Channel is Closed");
      isDataChannelOpen = false;
    }
    dataChannel.onerror = (error) => {
      console.log("Data Channel Error:", error);
      isDataChannelOpen = false;
    }
    isDataChannelOpen = true;
    dataChannel.send("what")
  }
  
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
let onmessageHandler = (event) => {//dfgsdaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
  //console.log("event: ", event.toString())


  //console.log("Got Data Channel Massage2:",event.data.charAt(0))
  switch(event.data){
    case "start-frame":
      isReceivingFrame = true;
      break;
    case "end-frame":
      if(beforeFirstTime){
        document.getElementById("sten-remote").srcObject = canvas3.captureStream()
        beforeFirstTime=false;
      }
  
      isReceivingFrame = false;
      let frameData =  str2frame(receivingStr);
      //console.log(frameData)
      let arr = frameData.data
      let return_obj = decode_arr(arr);
      if(return_obj == "-1"){
        console.log("return_obj error")
        return -1
      }
      //console.log("output:", return_obj.str)
      remoteCtx.putImageData(frameData,0,0);
      receivingM +=return_obj.str
      receivingStr = ""
      break;
    case "end-message":
      console.log("final message:",receivingM) 



      ///here need to take the massage from recieveingM before its gone
      let convoTextarea = document.getElementById("callTextarea")
      convoTextarea.value += 'RemoteSrc:\n'+receivingM +'\n'


      receivingM = ""
      break;

    default:
      if(isReceivingFrame){
        receivingStr = receivingStr + event.data;
      }
      break;



  }



 /* if(event.data==="start-frame"){
    isReceivingFrame = true;

  }
  else if(event.data === "end-frame"){
    if(beforeFirstTime){
      document.getElementById("sten-remote").srcObject = canvas3.captureStream()
      beforeFirstTime=false;
    }

    isReceivingFrame = false;
    let frameData =  str2frame(receivingStr);
    console.log(frameData)
    let arr = frameData.data
    let return_obj = decode_arr(arr);
    console.log("output:", return_obj.str)
    remoteCtx.putImageData(frameData,0,0);
    receivingStr = ""
    
  }
  
  else if(isReceivingFrame){
    receivingStr = receivingStr + event.data;
  }*/
} 



//let isSent = false;

const canvas1 = document.createElement("canvas");
const canvas2 = document.createElement("canvas");
let inputCtx = canvas1.getContext("2d");
let outputCtx = canvas2.getContext("2d");
let CameraStreamToBmpStream = (text="") => {//////////////////sdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd
  //const width = 300;
  //const height = 225;
  inputCtx.drawImage(document.getElementById("user-1"), 0, 0, width, height);
  const pixelData = inputCtx.getImageData(0, 0, width, height);
  const arr = pixelData.data;
  /*if(isSent && isDataChannelOpen){
    
    console.log(arr[170000]) 
    let encoded = encode_arr(arr,text=temp_text)
    //let decoded = decode_arr(arr)
    //console.log("asdasd", decoded.str)
    
    sendFrame(arr);
    isSent = false;
  }*/

  // write the manipulated pixel data to the second canvas
  outputCtx.putImageData(pixelData, 0, 0);
};
let leaveChannel = async () => {
  await channel.leave();
  await channel.logout();
};


const canvas3 = document.createElement("canvas");
let remoteCtx = canvas3.getContext("2d");


let CameraStreamOfRemoteSource = async () => {
    //const width = 300;
    //const height = 225;
    //remoteCtx.drawImage(document.getElementById("user-2"),0,0,width,height);
    //const pixelData = remoteCtx.getImageData(0,0,width,height);
    //const arr = pixelData.data;
    //const sliced_arr = arr.slice(0,52)
    if(remote_track){
      remoteCtx.drawImage(document.getElementById("user-2"), 0,0,width,height)
      const pixelData = remoteCtx.getImageData(0,0,width,height)
      const arr = pixelData.data
      //console.log(arr[0],arr[1],arr[2])
    }
}



let sendFrame = async (arr) => {



  let ascii_str =String();
  for(let i = 0; i < arr.length; i++){
      ascii_str = ascii_str + String.fromCharCode(arr[i]);
      
  }

  //now we got a full ascii string that represents the pixelData array
  //we need to devide the string to a couple of massages  - will choose massages that less then 16kB
  let c=1;
  //console.log(ascii_str)
  dataChannel.send("start-frame");
  for(let i=0; i<ascii_str.length;i=i+ascii_buffer){
      await dataChannel.send(ascii_str.substring(i,i+ascii_buffer));
      c++;
  }
  dataChannel.send("end-frame");
  //console.log("end", --c);

}





let str2frame = (str) => {
  let frameData = new ImageData(width,height);
  let arr = new Uint8ClampedArray(width*height*4);
  for(let i=0;i<str.length;i++){
    arr[i] = str.charCodeAt(i)
    frameData.data[i] = arr[i]
  }
  //console.log(arr.length)
  return frameData
  
}
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

//this is the sender, gets text and send the text via embedded frames to the user
let sendMessage = async (text)=>{
  
  let index = 0
  let encode_res; 
  let temp_text = text; 
  let first_time = true
  let id=0
  let part=0;
  do{
    await sleep(60);
    inputCtx.drawImage(document.getElementById("user-1"), 0, 0, width, height);
    let pixelData = inputCtx.getImageData(0, 0, width, height);
    let arr = pixelData.data;
    encode_res = encode_arr(arr,temp_text,id,part,undefined)
    if(encode_res==-1){
      continue;
    }
    index++
    temp_text = encode_res.str
    part++;
    id = encode_res.id;
    await sendFrame(arr);
    
  }
  while(temp_text!="")

  await dataChannel.send("end-message")
  let convoTextarea = document.getElementById("callTextarea")


  //writes the user part
  convoTextarea.value +="me:\n"+text+'\n';

}

let sendSten = async () => {

  let text = document.getElementById("myTextarea").value
  if(text==""){
    return
  }
  document.getElementById("myTextarea").value = ""
  document.getElementById("sendButton").disabled = true
  await sendMessage(text)
  //.log("done here bro")
  document.getElementById("sendButton").disabled = false

};
document.getElementById("sendButton").onclick = sendSten

window.addEventListener("beforeunload", leaveChannel);
init();


setInterval(() => {
  //CameraStreamToBmpStream();
}, 100);
  


setInterval(() => {
  //CameraStreamOfRemoteSource();
},10);



