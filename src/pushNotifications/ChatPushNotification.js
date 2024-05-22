import { collection, doc, getDoc, getDocs, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { database } from "../firebase/firebase";
import Avatar from "../assets/images/avatar.png";
import { useUserData } from "../contextData/userData";

export const ChatPushNotification = () => {
  const { currentUser } = useUserData();
  const [lastMessage, setLastMessage] = useState();

  useEffect(() => {
    if (currentUser) {
      if (!("Notification" in window)) {
        alert("This browser does not support desktop notifications");
        return;
      }
      
      const permission = Notification.permission;
      if (permission !== "granted") {
        Notification.requestPermission();
      }

      if (permission === "granted") {
        const fetchChats = async () => {
          const chatArray = [];
          const querySnapshot = await getDocs(collection(database, "chats"));
          querySnapshot.forEach((doc) => {
            const chatData = doc.data();
            const newChatId = doc.id;
            chatData.chatId = newChatId;
            chatArray.push(chatData);
          });

          chatArray.forEach(async (chat) => {
            const newChatId = chat.chatId;
            const lastMsg = chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].text : "";
            setLastMessage(lastMsg);
            const senderId = chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].senderId : "";
          
            if (senderId) {
              // Ensure senderId is defined before proceeding
              const userChatsDoc = await getDoc(doc(database, "userChats", senderId));
              if (userChatsDoc.exists()) {
                const userChatsData = userChatsDoc.data();
                const chats = userChatsData.chats;
          
                const userDoc = await getDoc(doc(database, "users", senderId));
                if (userDoc.exists()) {
                  const usersData = userDoc.data();
                  
                  chats.forEach(async (userChat) => {
                    if (userChat.chatId === newChatId) {
                      if (senderId !== currentUser?.id) {
                        const chat = { user: usersData, ...userChat };
          
                        const checkDoc = await getDoc(doc(database, "userChats", userChat.receiverId));
                        if (checkDoc.exists()) {
                          const receiverChatsData = checkDoc.data();
                          const receiverChats = receiverChatsData.chats;
          
                          const receiverChat = receiverChats.find((receiverChat) => receiverChat.chatId === newChatId);
                          if (receiverChat) {
                            const isSeen = receiverChat.isSeen;          
                            if (userChat.ownUserId === currentUser?.id || userChat.receiverId === currentUser?.id) {
                              let displayedMessage = "";
                              if (isSeen === false && displayedMessage !== lastMsg) {
                                displayedMessage = lastMsg;
                                const tag = `${newChatId}-${lastMsg}`;
                                new Notification(
                                  `New Message from ${chat.user.username || "Unknown"}`,
                                  {
                                    body: lastMsg || "New Message",
                                    icon: chat.user.avatar || Avatar,
                                    tag: tag,
                                  }
                                );
                              }
                            }
                          }
                        }
                      }
                    }
                  });
                }
              }
            }
          });
        };

        fetchChats();

        // Subscribe to new messages
        const unsubscribe = onSnapshot(collection(database, "chats"), () => {
          fetchChats();
        });

        return () => {
          unsubscribe();
        };
      }
    }
  }, [lastMessage, currentUser]);

  return null;
};
