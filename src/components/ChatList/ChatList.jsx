import React,{useEffect, useState} from 'react'
import './ChatList.css'
import Search from '../../assets/images/search.png'
import Plus from '../../assets/images/plus.png'
import Minus from '../../assets/images/minus.png'
import Avatar from '../../assets/images/avatar.png'
import AddUser from '../addUser/AddUser'
import { useUserData } from '../../contextData/userData'
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import { database } from '../../firebase/firebase'
import { useChatData } from '../../contextData/chatData'
const ChatList = () => {
    const [plus, setPlus] = useState(false);
    const [chats, setChats] = useState([]);
    const [search, setSearch] = useState('');
    const { currentUser } = useUserData();
    const { changeChat,isCurrentUserBlocked } = useChatData();
    useEffect(() => {
        const unSub = onSnapshot(doc(database, "userChats", currentUser.id), async (res) => {
                const items = res.data().chats;
                const promises = items.map(async (item) => {
                    const userDocSnap = await getDoc(doc(database, "users", item.receiverId));
                    const user = userDocSnap.data();
                    return {...item, user}; 
                });
                
                const chatData = await Promise.all(promises);
                setChats(chatData.sort((a,b)=> b.updatedAt - a.updatedAt));       
        });

        return () => unSub();

    }, [currentUser.id]);

    const handleSelect = async (chat) => {
      const userChats = chats.map(item=>{
        const {user,...chats} = item;
        return chats
        })
        const chatIndex = userChats.findIndex(c=> c.chatId === chat.chatId);
        userChats[chatIndex].isSeen = true;
        const userChatsRef = doc(database, "userChats", currentUser.id);

        try{
          await updateDoc(userChatsRef,{
            chats:userChats,
          }) 
          changeChat(chat.chatId,chat.user)
        }catch(err){
          console.log(err)
        }

    }

      const filteredChats = chats.filter((chat) =>chat.user.username.toLowerCase().includes(search.toLowerCase()));


    return (
      <div className='chatList'>
        <div className="search">
          <div className="searchInput">
              <img src={Search} alt=""  />
              <input type="text" placeholder="Search or start new chat" onChange={(e)=>setSearch(e.target.value)} value={search} />
          </div>
          <img src={plus ? Minus : Plus} alt="" onClick={()=>setPlus((prev) => !prev)} />
        </div>
        {filteredChats.map((chat) => (            
          <div className="chat-box" key={chat.chatId} onClick={()=>handleSelect(chat)} >
            {!chat?.isSeen && <span>New</span>}
              <img src={isCurrentUserBlocked ? Avatar :  chat.user.avatar || Avatar} alt="" />
              <div className="chatInfo">
                  <h2>{chat.user.username}</h2>
                  <p>{isCurrentUserBlocked ? "" :  chat.lastMessage}</p>
              </div>    
          </div>
          ))}
          
          {plus && <AddUser/>}
          
      </div>
  )
}

export default ChatList
