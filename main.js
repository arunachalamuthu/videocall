let localStream
let remoteStream
let peerConnection = new RTCPeerConnection()
let cameramute = true

let uid = String(Math.floor(Math.random()*10000))
let token = null
let client;

let AppId = '57fcd09053784c5eb292891e2030cdb5'
// const server = {
//     iceServer:[
//         {
//             urls:['stun:stun1.1.google.com:1992','stun:stun2.1.google.com:19302']
//         }
//     ]
// }

const init=async ()=>{

    client = await AgoraRTM.createInstance(AppId)
    await client.login({uid,token})

    const channel = client.createChannel('main')
    channel.join()
    
    const handler = (MemberID) =>{
        console.log('join',MemberID)

        createoffer(MemberID)
      }
      const handlerOffer = (data,MemberID) =>{
       let message = JSON.parse(data.text)
       if(message.type == 'offer'){
        document.querySelector('#offer-sdp').value = JSON.stringify(message.offer)
        createanswer(MemberID)
       }
       if(message.type == "answer"){
        if(peerConnection){
        document.querySelector('#answer-sdp').value = JSON.stringify(message.answer)
        addAnswer()
       }
    }
      }




    localStream = await navigator.mediaDevices.getUserMedia({video:cameramute,audio:false})
  
    remoteStream = new MediaStream()

    document.getElementById('user-1').srcObject = localStream
    document.getElementById('user-2').srcObject = remoteStream


    
    localStream.getTracks().forEach((track)=>{
        console.log(track)
        console.log(localStream)
        peerConnection.addTrack(track,localStream)
     })

    
     channel.on('MemberJoined',handler)
     client.on('MessageFromPeer',handlerOffer)
   

}


peerConnection.ontrack = async (event)=>{
    console.log("peerconnection.ontrack call")
           event.streams[0].getTracks().forEach((track)=>{
            remoteStream.addTrack(track)
           })
 }


async function createoffer (MemberID){

 

     peerConnection.onicecandidate = async (event)=>{
        if(event.candidate){
            document.querySelector('#offer-sdp').value = JSON.stringify(peerConnection.localDescription)
            client.sendMessageToPeer({text:JSON.stringify({"type":"offer","offer":peerConnection.localDescription})},MemberID)
        }
     }

     
    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)



 
}
async function createanswer (MemberID){
 
   let offer = JSON.parse(document.querySelector('#offer-sdp').value)

 peerConnection.onicecandidate = async (event)=> {
 
    if(event.candidate){
        document.querySelector('#answer-sdp').value = JSON.stringify(peerConnection.localDescription)
        client.sendMessageToPeer({text:JSON.stringify({"type":"answer","answer":answer})},MemberID)
    }
 }

   await peerConnection.setRemoteDescription(offer)

    let answer = await peerConnection.createAnswer()
 
    peerConnection.setLocalDescription(answer)

   

}

let addAnswer = async () => {
    console.log('Add answer triggerd')
    console.log(peerConnection);
    let answer = JSON.parse(document.getElementById('answer-sdp').value)

    console.log('answer:', answer)
    

    if (!peerConnection.currentRemoteDescription){
        peerConnection.setRemoteDescription(answer);
    }
}

init()



document.querySelector('.createoffer').addEventListener('click',createoffer)
document.querySelector('.createanswer').addEventListener('click',createanswer)
document.getElementById('add-answer').addEventListener('click', addAnswer)