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
import { useGroupData } from '../../contextData/groupData'
const ChatList = () => {
    const [plus, setPlus] = useState(false);
    const [chats, setChats] = useState([]);
    const [groups, setGroups] = useState([])
    const [search, setSearch] = useState('');
    const { currentUser } = useUserData();
    const { changeChat,isCurrentUserBlocked, resetChat } = useChatData();
    const { changeGroup, resetGroup } = useGroupData();
    const [activeTab,setActiveTab] = useState("Chats")
    useEffect(() => {
        const unSub = onSnapshot(doc(database, "userChats", currentUser.id), async (res) => {
          if(res.exists()){
                const items = res.data().chats;
                const promises = items.map(async (item) => {
                    const userDocSnap = await getDoc(doc(database, "users", item.receiverId));
                    const user = userDocSnap.data();
                    return {...item, user}; 
                });
                
                const chatData = await Promise.all(promises);
                setChats(chatData.sort((a,b)=> b.updatedAt - a.updatedAt));       
          }
        });

        return () => unSub();

    }, [currentUser.id]);
    useEffect(() => {
        const unSub = onSnapshot(doc(database, "userGroups", currentUser.id), async (res) => {
          if(res.exists()){
                const items = res.data().groups;
                setGroups(items.sort((a,b)=> b.createdAt - a.createdAt));
          }
                      
        });

        return () => unSub();

    }, [currentUser.id]);

    const handleChatSelect = async (chat) => {
      resetGroup();
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
    const handleGroupSelect = async (group) => {
      resetChat();
      const userGroups = groups.map(item=>{
        return item;
        })
        const groupIndex = userGroups.findIndex(g=> g.groupId === group.groupId);
        userGroups[groupIndex].isSeen = true;
        const userGroupsRef = doc(database, "userGroups", currentUser.id);

        try{
          await updateDoc(userGroupsRef,{
            groups:userGroups,
          }) 
          changeGroup(group.groupId,group.groupName,group.avatar)
        }catch(err){
          console.log(err)
        }

    }

      const filteredChats = chats.filter((chat) =>chat.user.username.toLowerCase().includes(search.toLowerCase()));
      const filteredGroups = groups.filter((group) =>group.groupName.toLowerCase().includes(search.toLowerCase()));

    return (
      <div className='chatList'>
        <div className="search">
          <div className="searchInput">
              <img src={Search} alt=""  />
              <input type="text" placeholder="Search or start new chat" onChange={(e)=>setSearch(e.target.value)} value={search} />
          </div>
          <img src={plus ? Minus : Plus} alt="" onClick={()=>setPlus((prev) => !prev)} />
        </div>
        <div className="button-options">
          <button className={activeTab==="Chats" ? 'active' : ''} onClick={()=>setActiveTab("Chats")}>Chats</button>
          <button className={activeTab==="Groups" ? 'active' : ''} onClick={()=>setActiveTab("Groups")}>Groups</button>
        </div>
        {activeTab==="Chats" && filteredChats && filteredChats.map((chat) => (            
          <div className="chat-box" key={chat.chatId} onClick={()=>handleChatSelect(chat)} >
            {!chat?.isSeen && <span>New</span>}
              <img src={isCurrentUserBlocked ? Avatar :  chat.user.avatar || Avatar} alt="" />
              <div className="chatInfo">
                  <h2>{chat.user.username}</h2>
                  <p>{isCurrentUserBlocked ? "" :  chat.lastMessage}</p>
              </div>    
          </div>
          ))}

        {activeTab==="Groups" && filteredGroups && filteredGroups.map((group) => (            
          <div className="chat-box" key={group.groupId} onClick={()=>handleGroupSelect(group)} >
            {!group?.isSeen && <span>New</span>}
              <img src={group.avatar || Avatar} alt="" />
              <div className="chatInfo">
                  <h2>{group.groupName}</h2>
                  <p>{group.lastMessage}</p>
              </div>    
          </div>
          ))  }
          
          {plus && <AddUser/>}
          
      </div>
  )
}

export default ChatList