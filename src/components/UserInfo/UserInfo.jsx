import React, { useState } from 'react';
import './UserInfo.css';
import Avatar from '../../assets/images/avatar.png';
import Edit from '../../assets/images/edit.png';
import { useUserData } from '../../contextData/userData';
import { doc, updateDoc } from "firebase/firestore";
import { database } from "../../firebase/firebase";
import upload from "../../firebase/upload";

const UserInfo = () => {
  const { currentUser } = useUserData();
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(currentUser.username);
  const [newAvatar, setNewAvatar] = useState(currentUser.avatar);

  const handleEditClick = () => {
    setEditing(true);
  };

  const handleSaveClick = async () => {
    try {
      // Update user data in the database
      await updateDoc(doc(database, 'users', currentUser.id), {
        username: newUsername,
        avatar: newAvatar
      });
      setEditing(false);
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    try {
      // Upload new avatar image to Firebase storage
      const url = await upload(file);
      setNewAvatar(url);
    } catch (error) {
      console.error('Error uploading avatar image:', error);
    }
  };

  return (
    <div className='userInfo'>
      <div className="user">
        <img src={newAvatar || Avatar} alt="Avatar" />
        {editing ? (
          <>
          <div style={{display:'flex', flexDirection:'column', gap:'5px'}}>
          <label htmlFor="image">Change Image</label>
            <input
              id='image'
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
            />
            </div>
          </>
        ) : (
          <h2>{newUsername}</h2>
        )}
      </div>
      <div className="icons">
        {editing ? (
          <button onClick={handleSaveClick}>Save</button>
        ) : (
          <img src={Edit} alt="Edit" onClick={handleEditClick} />
        )}
      </div>
    </div>
  );
};

export default UserInfo;
