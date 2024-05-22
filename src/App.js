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
import { auth } from "./firebase/firebase";
import Loader from "./assets/gif/loader.gif";
import { useChatData } from "./contextData/chatData";
import { useGroupData } from "./contextData/groupData";
import NoChat from "./components/noChat/NoChat";
import Group from "./components/Group/Group";
import GroupDetails from "./components/GroupDetails/GroupDetails";
import { ChatPushNotification } from "./pushNotifications/ChatPushNotification";
import { GroupPushNotification } from "./pushNotifications/GroupPushNotification";

function App() {
  const { currentUser, isLoading, userInfo } = useUserData();
  const { chatId } = useChatData();
  const { groupId } = useGroupData();
  const [details, setDetails] = useState(false);
  const [groupDetails, setGroupDetails] = useState(false);

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
          {chatId ? <Chat setDetails={setDetails} /> : groupId ? <Group setDetails={setGroupDetails}/> : <NoChat/>} 
          {chatId ? <Details details={details} setDetails={setDetails} />  : groupId ? <GroupDetails details={groupDetails} setDetails={setGroupDetails} /> : null}
          <ChatPushNotification />
          <GroupPushNotification />
        </>
      ) : (
        <Login />
      )}
      <ToastContainer position="bottom-right" />
    </div>
  );
}

export default App;
