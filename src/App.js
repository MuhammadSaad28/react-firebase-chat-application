import "./App.css";
import Chat from "./components/Chat/Chat";
import List from "./components/List/List";
import Details from "./components/Details/Details";
import Login from "./components/Login/Login";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useEffect, useState } from "react";
import { useUserData } from "./contextData/userData";
import { onAuthStateChanged } from "firebase/auth";
import { auth, database } from "./firebase/firebase";
import Loader from "./assets/gif/loader.gif";
import { useChatData } from "./contextData/chatData";
import NoChat from "./components/noChat/NoChat";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import Avatar from "./assets/images/avatar.png";

function App() {
  const { currentUser, isLoading, userInfo } = useUserData();
  const { chatId } = useChatData();
  const [details, setDetails] = useState(false);
  const [lastMessage, setLastMessage] = useState();

  useEffect(() => {
    if (currentUser) {
      if (!("Notification" in window)) {
        alert("This browser does not support desktop notifications");
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
            const lastMsg = chat.messages[chat.messages.length - 1].text;
            setLastMessage(lastMsg);
            const senderId = chat.messages[chat.messages.length - 1].senderId;

            const userChats = await getDoc(
              doc(database, "userChats", senderId)
            );
            const chats = userChats.data().chats;
            const users = await getDoc(doc(database, "users", senderId));
            chats.forEach(async (userChat) => {
              if (userChat.chatId === newChatId) {
                if (senderId !== currentUser?.id) {
                  const chat = { user: users.data(), ...userChat };
                  const check = await getDoc(
                      doc(database, "userChats", userChat.receiverId)
                    );
                    const receiverChats = check.data().chats;
                    const receiverChat = receiverChats.find(
                      (receiverChat) => receiverChat.chatId === newChatId
                    );
                    const isSeen = receiverChat.isSeen;
                    console.log("isSeen", isSeen);
                  if(userChat.ownUserId === currentUser?.id || userChat.receiverId === currentUser?.id){
                    let displayedMessage = "";
                    if(isSeen === false && displayedMessage !== lastMsg){
                      displayedMessage = lastMsg;
                    const tag = `${newChatId}-${lastMsg}`;
                    new Notification(
                      `New Message from ${chat.user.username || "Unknown"}`,
                      {
                        body: lastMsg || "New Message",
                        icon: chat.user.avatar || Avatar,
                        tag: tag,
                      }
                    );}
                  }
                }
              }
            });
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

  useEffect(() => {
    const unSub = onAuthStateChanged(auth, (user) => {
      userInfo(user?.uid);
    });
    return () => unSub();
  }, [userInfo]);

  if (isLoading) {
    return (
      <div className="chat-container">
        <div className="Loading-container">
          <img src={Loader} alt="Loading..." className="Loading" />
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {currentUser ? (
        <>
          <List />
          {chatId ? <Chat setDetails={setDetails} /> : <NoChat />}
          {chatId && <Details details={details} setDetails={setDetails} />}
        </>
      ) : (
        <Login />
      )}
      <ToastContainer position="bottom-right" />
    </div>
  );
}
export default App;
