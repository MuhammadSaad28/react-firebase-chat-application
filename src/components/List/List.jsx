import React from 'react'
import './List.css'
import UserInfo from '../UserInfo/UserInfo'
import ChatList from '../ChatList/ChatList'
const List = ({onChatSelect,setDetails}) => {
  return (
    <div className='list'> 
      <UserInfo/>
      <ChatList onChatSelect={onChatSelect} setDetails={setDetails}/>
    </div>
  )
}

export default List
