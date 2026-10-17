import React, { useCallback, useEffect, useRef, useState } from 'react'
import { dummyRemoteParticipants } from '../assets/asset'
import toast from 'react-hot-toast'

const useWebRTC = (_roomId, user, onMeetingEnded, _enabled = true) => {

    const [localStream, setLocalStream] = useState(null)
    const [remoteUsers, setRemoteUsers] = useState(dummyRemoteParticipants)
    const [audioEnabled, setAudioEnabled] = useState(true)
    const [videoEnabled, setVideoEnabled] = useState(true)

    const localStreamRef = useRef(null)

    // Initialize local camera stream if available in browser
    const initLocalStream = useCallback(async ()=>{
      try {
        if(navigator?.mediaDevices?.getUserMedia){
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          })
          localStreamRef.current = stream;
          setLocalStream(stream)
          return stream;
        }
      } catch (_error) {
          console.log("Mock WebRTC: Running in camera preview fallback mode");
      }
      return null;
    }, [])

    useEffect(()=>{
      initLocalStream()

      return ()=>{
        if(localStreamRef.current){
          localStreamRef.current.getTracks().forEach((track)=>track.stop())
        }
      }
    },[initLocalStream])


    // Toggle local mic
    const toggleAudio = () => {
      const newState = !audioEnabled;
      setAudioEnabled(newState);
      if(localStreamRef.current){
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) audioTrack.enable = newState;
      }
      toast(newState ? "Microphone turned on" : "Microphone muted", {
        icon: newState ? "🎙️" : "🔇",
      })
    }

    // Toggle local camera 
    const toggleVideo = () => {
      const newState = !videoEnabled;
      setVideoEnabled(newState);
      if(localStreamRef.current){
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) videoTrack.enable = newState;
      }
      toast(newState ? "Camera turned on" : "Camera turned off", {
        icon: newState ? "📹" : "📸",
      })
    }

    // End meeting for everyone
    const endMeeting = useCallback(()=>{
      if(onMeetingEnded){
        onMeetingEnded("Meeting ended");
      }
    },[onMeetingEnded])

  return {
    localStream,
    remoteUsers,
    audioEnabled,
    videoEnabled,
    toggleAudio,
    toggleVideo,
    endMeeting
  }
}

export default useWebRTC