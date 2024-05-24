QuickTalk - Chat with anyone, anytime

Table of Contents
Introduction
Features
Tech Stack
Installation
Usage
Push Notifications
Contributing
License
Acknowledgements
Introduction
QuickTalk is a modern and responsive chat application that allows users to communicate with each other in real-time. Designed with a user-friendly interface and rich features, QuickTalk ensures a seamless chat experience across all devices.

Features
Real-time messaging
Emoji support
Image sharing
Push notifications
Responsive design
User and group chats
Tech Stack
Frontend: React.js
Backend: Firebase Firestore
Hosting: Firebase Hosting
Installation
Prerequisites
Node.js
npm or yarn
Firebase account
Steps
Clone the repository

bash
Copy code
git clone https://github.com/MUHAMMADSAAD28/quicktalk.git
cd quicktalk
Install dependencies

bash
Copy code
npm install
# or
yarn install
Set up Firebase

Create a new Firebase project at Firebase Console
Enable Firestore Database
Enable Firebase Authentication
Configure environment variables

Create a .env file in the root directory and add your Firebase configuration:

env
Copy code
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-auth-domain
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-storage-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
Start the development server

bash
Copy code
npm start
# or
yarn start
Usage
Register or log in to the application.
Start chatting by selecting a user or group.
Send messages, emojis, and images.
Receive real-time notifications for new messages.
Push Notifications
Ensure your application has permission to show notifications. This is handled in your ChatPushNotification component.

Example Usage
javascript
Copy code
import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc, onSnapshot } from "firebase/firestore";
import { database } from "../firebase/firebase";
import { useUserData } from "../contextData/userData";
import Avatar from "../assets/images/avatar.png";

export const ChatPushNotification = () => {
  const { currentUser } = useUserData();
  const [lastMessage, setLastMessage] = useState();

  useEffect(() => {
    if (currentUser) {
      if (!("Notification" in window)) {
        alert("This browser does not support desktop notifications");
        return;
      }
      
      Notification.requestPermission().then(permission => {
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

          const unsubscribe = onSnapshot(collection(database, "chats"), () => {
            fetchChats();
          });

          return () => {
            unsubscribe();
          };
        }
      });
    }
  }, [lastMessage, currentUser]);

  return null;
};
Contributing
We welcome contributions from the community. If you’d like to contribute, please follow these steps:

Fork the repository.
Create a new branch (git checkout -b feature-branch).
Make your changes.
Commit your changes (git commit -m 'Add some feature').
Push to the branch (git push origin feature-branch).
Open a pull request.
License
This project is licensed under the MIT License - see the LICENSE file for details.

Acknowledgements
Thanks to the Firebase team for their awesome services.
Emoji support by Emoji Picker React.