import React, { useState } from 'react'
import './AddUser.css'
import Search from '../../assets/images/search.png'
import Plus from '../../assets/images/plus.png'
import Avatar from '../../assets/images/avatar.png'
import { arrayUnion, collection, doc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore'
import { database } from '../../firebase/firebase'
import { useUserData } from '../../contextData/userData'

const AddUser = () => {
  const [user, setUser] = useState(null); 
  const { currentUser } = useUserData();
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get('username');

    try{
       const userRef = collection(database, 'users');
       const querySnapshot = await getDocs(query(userRef, where('username', '==', username)));
       if(!querySnapshot.empty){
          setUser(querySnapshot.docs[0].data());
       }
    }catch(err){
      console.log(err);
    }
  }

  const handleAdd = async () => {
    try {
      const chatRef = collection(database, 'chats');
      const newChatRef = doc(chatRef); 
      
      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });
      
      const userChatsRef = doc(database, 'userChats', user.id); 
      const currentUserChatsRef = doc(database, 'userChats', currentUser.id); 
      
      await updateDoc(userChatsRef, {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: currentUser.id,
          ownUserId: user.id,
          updatedAt: Date.now()
        })
      });
      
      await updateDoc(currentUserChatsRef, {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: user.id,
          ownUserId: currentUser.id,
          updatedAt: Date.now()
        })
      });
    } catch (err) {
      console.log(err);
    }
  }
  

  return (
    <div className='addUser'>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder='Username' name='username'/>
        <button> <img src={Search} alt="" /> </button>
      </form>
      {user && <div className="users">
        <div className="user">
            <img src={user.avatar || Avatar} alt="" />
            <span>{user.username}</span>
        </div>
        <button onClick={handleAdd}><img src={Plus} alt="" /></button>
      </div>
      }
    </div>
  )
}

export default AddUser
