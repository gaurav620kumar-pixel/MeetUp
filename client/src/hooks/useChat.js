import { useCallback, useState } from "react"
import { dummyInitialChatMessages } from "../assets/asset"

export const useChat = (_roomId, user)=>{
    const [messages, setMessages] = useState(dummyInitialChatMessages)
    const [unreadCount, setUnreadCount] = useState(0);
    const [isChatOpen, setIsChatOpen] = useState(false)

    const sendMessage = useCallback(
        (text)=>{
            if(!Text.trim() || !user) return;

            const message = {
                id: Date.now().toString(),
                text: text.trim(),
                senderName: user.name || user.fullName || "You",
                senderId: user.id,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            }

            setMessages((prev)=> [...prev, message]);
        },
        [user]
    );

    const toggleChat = useCallback(()=>{
        setIsChatOpen((prev)=>{
            if(!prev) setUnreadCount(0);
            return !prev;
        })
    },[])

    return {
        messages,
        sendMessage,
        unreadCount,
        isChatOpen,
        toggleChat
    }
}