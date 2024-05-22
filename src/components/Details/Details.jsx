import React, { useEffect, useState } from 'react'
import './Details.css'
import Avatar from '../../assets/images/avatar.png'
import ArrowUp from '../../assets/images/arrowUp.png'
import ArrowDown from '../../assets/images/arrowDown.png'
import Download from '../../assets/images/download.png'
import { auth, database } from '../../firebase/firebase'
import { useChatData } from '../../contextData/chatData'
import { useUserData } from '../../contextData/userData'
import { arrayRemove, arrayUnion, doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { saveAs } from 'file-saver';

const Details = ({details,setDetails}) => {
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked, changeBlock, subscribeToUserChanges } = useChatData();
  const { currentUser } = useUserData();
  const [chat, setChat] = useState([]);
  const [up, setUp] = useState(false);

  useEffect(() => {
    if (user) {
        const unsubscribe = subscribeToUserChanges(user.id);
        return () => unsubscribe();
    }
}, [user]);

useEffect(() => {
  const unSub = onSnapshot(doc(database, "chats", chatId), (res) => {
    const chatData = res.data();
    if (chatData && Array.isArray(chatData.messages)) {
      setChat(chatData.messages);
    } else {
      setChat([]);
    }
  });
  return () => unSub();
}, [chatId]);

  const handleBlock = async () => {
    if(!user) return;

    const userDocRef = doc(database, "users", currentUser.id);

    try{
      await updateDoc(userDocRef,{
        blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id)
      });
      changeBlock();
    }catch(err){
      console.log(err)
    }
  }

  const handleDownload = (imageUrl) => {
    saveAs(imageUrl, 'image.jpg');
  };

  const closeDetails = () => {
    setDetails(false);
  }

  return (
    <div className={`details ${details ? "showDetails" : "hideDetails"}`}>
      <div className="user">
        <h1 onClick={closeDetails}>x</h1>
        <img src={isCurrentUserBlocked ? Avatar :  user?.avatar || Avatar} alt="" />
        <div className="user-info">
          <h3>{user?.username}</h3>
        </div>     
      </div>
      <div className="info">
        <div className="option">
          <div className="title">
            <span>Shared Photos</span>
            <img src={up ? ArrowUp : ArrowDown} onClick={()=>setUp((prev)=> !prev)}  />
          </div>
          <div className={`photos ${up ? "" : "hide"}`}>
           {chat && chat.map((msg, index) => (
            <>
            {msg.img && (
             <div className="photoItem" key={index}>
               <div className="photoDetail">
                 <img src={msg.img} alt="" />
                 <span>{new Date(msg.createdAt.seconds * 1000).toLocaleDateString()}</span>
               </div>
                <img src={Download} alt="" onClick={()=>handleDownload(msg.img)} />
             </div>
            )}
            </>
            ))}
            
          </div>
        </div>
        <button onClick={handleBlock}>
          {
            isCurrentUserBlocked ? "You are Blocked" : isReceiverBlocked ? "UnBlock User" : "Block User"
          }
        </button>
        <button className='logout' onClick={()=>auth.signOut()}>Logout</button>
      </div>
    </div>
  )
}

export default Details
