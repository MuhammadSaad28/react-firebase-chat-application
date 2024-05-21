import React from 'react'
import Robot from '../../assets/gif/robot.gif'
import './NoChat.css'
const NoChat = () => {
  return (
    <div className='noChat'>
      <img src={Robot} alt="" />
        <h1>Select a Chat to Start Chatting</h1>
    </div>
  )
}

export default NoChat
