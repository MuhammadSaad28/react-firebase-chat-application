import React, { useEffect, useState } from "react";
import { useMediaQuery } from 'react-responsive';
import "./App.css";
import Chat from "./components/Chat/Chat";
import List from "./components/List/List";
import Details from "./components/Details/Details";
import Login from "./components/Login/Login";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
import Title from "./assets/images/title.png";
import Logout from "./assets/images/logout.png";
import MobileLogin from "./components/Login/MobileLogin";

function App() {
  const { currentUser, isLoading, userInfo } = useUserData();
  const { chatId, resetChat } = useChatData();
  const { groupId, resetGroup } = useGroupData();
  const [details, setDetails] = useState(false);
  const [groupDetails, setGroupDetails] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const isSmallScreen = useMediaQuery({ query: '(max-width: 768px)' });

  useEffect(() => {
    const unSub = onAuthStateChanged(auth, (user) => {
      userInfo(user?.uid);
    });
    return () => unSub();
  }, [userInfo]);

  useEffect(() => {
    if (chatId || groupId) {
      setShowChat(true);
    }
  }, [chatId, groupId]);

  useEffect(() => {
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setViewportHeight();
    window.addEventListener('resize', setViewportHeight);
    return () => {
      window.removeEventListener('resize', setViewportHeight);
    };
  }, [chatId, groupId]);

  

  if (isLoading) {
    return (
      <div className="chat-container" style={{maxHeight:'100vh',height:'100vh'}}>
        <div className="Loading-container">
          <img src={Loader} alt="Loading..." className="Loading" />
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="full-container">
      <div className="app-title">
      <img src={Title} alt="QuickTals" className="logo"/>
      <h1 className="title">QuickTalk</h1>
      </div>
      {currentUser && (
      <button className="logout"  onClick={()=>{
        resetChat();
        resetGroup();
        auth.signOut()
        }}>
        <img src={Logout} alt="" />
      </button>
      )}
    </div>
    <div className="chat-container">
      {currentUser ? (
        <>
          {isSmallScreen ? (
            showChat ? (
              <>
                {chatId ? <Chat details={details} setDetails={setDetails} setShowChat={setShowChat} /> : groupId ? <Group details={groupDetails} setDetails={setGroupDetails} setShowChat={setShowChat} /> : <NoChat/>}
                {chatId ? <Details details={details} setDetails={setDetails} />  : groupId ? <GroupDetails details={groupDetails} setDetails={setGroupDetails} /> : null}
              </>
            ) : (
              <List onChatSelect={() => setShowChat(true)} />
            )
          ) : (
            <>
              <List />
              {chatId ? <Chat details={details}  setDetails={setDetails} /> : groupId ? <Group setDetails={setGroupDetails}/> : <NoChat/>}
              {chatId ? <Details  details={details} setDetails={setDetails} />  : groupId ? <GroupDetails details={groupDetails} setDetails={setGroupDetails} /> : null}
            </>
          )}
          <ChatPushNotification />
          <GroupPushNotification />
        </>
      ) : (
        <>
        {isSmallScreen ? (
          <MobileLogin/>
        ) : (
          <Login />
        )}
        </>
      )}
      <ToastContainer position="bottom-right" />
    </div>
    
    </>
  );
}

export default App;
