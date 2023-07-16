let APP_ID = "57fcd09053784c5eb292891e2030cdb5"


let peerConnection;
let localStream;
let remoteStream;

let queryString = window.location.search
let urlParams = new URLSearchParams(queryString)
let room_id = urlParams.get('room')
if(!room_id){
    window.location = 'home.html'
}

let uid = String(Math.floor(Math.random() * 10000))
let token = null;
let client;

let servers = {
    iceServers:[
        {
            urls:['stun:stun1.1.google.com:19302', 'stun:stun2.1.google.com:19302']
        }
    ]
}


let init = async () => {

    client = await AgoraRTM.createInstance(APP_ID)
    await client.login({uid, token})
    const channel = client.createChannel(room_id)
    channel.join()

    channel.on('MemberJoined', handlePeerJoined)
    client.on('MessageFromPeer', handleMessageFromPeer)

   localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:true})
   document.getElementById('user-1').srcObject = localStream
}

let handlePeerJoined = async (MemberId) => {
    console.log('A new peer has joined this room:', MemberId)
    createOffer(MemberId)
}

let handleMessageFromPeer = async (message, MemberId) => {
    message = JSON.parse(message.text)
    console.log('Message:', message.type)

    if(message.type === 'offer'){
        if(!localStream){
            localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false})
            document.getElementById('user-1').srcObject = localStream
        }

        document.getElementById('offer-sdp').value = JSON.stringify(message.offer)
        createAnswer(MemberId)
    }

    if(message.type === 'answer'){

        document.getElementById('answer-sdp').value = JSON.stringify(message.answer)
        addAnswer()
    }

    if(message.type === 'candidate'){
        
        if(peerConnection){
            peerConnection.addIceCandidate(message.candidate)
        }
    }
}

let createPeerConnection = async (sdpType, MemberId) => {
    peerConnection = new RTCPeerConnection(servers)

    remoteStream = new MediaStream()
    document.getElementById('user-2').srcObject = remoteStream

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream)
    })

    peerConnection.ontrack = async (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track)
        })
    }

    peerConnection.onicecandidate = async (event) => {
        if(event.candidate){
            document.getElementById(sdpType).value = JSON.stringify(peerConnection.localDescription)
            client.sendMessageToPeer({text:JSON.stringify({'type':'candidate', 'candidate':event.candidate})}, MemberId)
        }
    }
}

let createOffer = async (MemberId) => {
    
    createPeerConnection('offer-sdp', MemberId)

    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    document.getElementById('offer-sdp').value = JSON.stringify(offer)
    client.sendMessageToPeer({text:JSON.stringify({'type':'offer', 'offer':offer})}, MemberId)
}

let createAnswer = async (MemberId) => {
    createPeerConnection('answer-sdp', MemberId)

    let offer = document.getElementById('offer-sdp').value
    if(!offer) return alert('Retrieve offer from peer first...')

    offer = JSON.parse(offer)
    await peerConnection.setRemoteDescription(offer)
    
    let answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)

    document.getElementById('answer-sdp').value  = JSON.stringify(answer)
    client.sendMessageToPeer({text:JSON.stringify({'type':'answer', 'answer':answer})}, MemberId)
}

let addAnswer = async () => {
    let answer = document.getElementById('answer-sdp').value
    if(!answer) return alert('Retrieve answer from peer first...')

    answer = JSON.parse(answer)

    if(!peerConnection.currentRemoteDescription){
        peerConnection.setRemoteDescription(answer)
    }

}
let cameratoggle =async ()=>{

    let videoCheck = localStream.getTracks().find(track => track.kind == 'video')
    if(videoCheck.enabled){
        videoCheck.enabled = false
    }
    else{
        videoCheck.enabled = true
    }
}

let audiotoggle =async ()=>{

    let audioCheck = localStream.getTracks().find(track => track.kind == 'audio')
    if(audioCheck.enabled){
        audioCheck.enabled = false
    }
    else{
        audioCheck.enabled = true
 }
}

document.querySelector('.camera-btn').addEventListener('click',cameratoggle)
document.querySelector('.audio-btn').addEventListener('click',audiotoggle)

init()

