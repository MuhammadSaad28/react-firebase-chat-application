import React, { useEffect, useState } from 'react';
import './GroupDetails.css';
import Avatar from '../../assets/images/avatar.png';
import ArrowUp from '../../assets/images/arrowUp.png';
import ArrowDown from '../../assets/images/arrowDown.png';
import Download from '../../assets/images/download.png';
import {database } from '../../firebase/firebase';
import { useChatData } from '../../contextData/chatData';
import { useUserData } from '../../contextData/userData';
import { collection, doc, getDoc, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { saveAs } from 'file-saver';
import { useGroupData } from '../../contextData/groupData';
import Edit from '../../assets/images/edit.png';
import upload from '../../firebase/upload';
import Search from '../../assets/images/search.png';
import Plus from '../../assets/images/plus.png';
import { toast } from 'react-toastify';

const GroupDetails = ({ details, setDetails }) => {
  const { chatId } = useChatData();
  const { groupId, groupName, avatar, changeGroup } = useGroupData();
  const { currentUser } = useUserData();
  const [group, setGroup] = useState([]);
  const [up, setUp] = useState(false);
  const [membersUp, setMembersUp] = useState(false);
  const [members, setMembers] = useState([]);
  const [memberDetails, setMemberDetails] = useState([]);
  const [groupAdmin, setGroupAdmin] = useState("");
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState(groupName);
  const [newAvatar, setNewAvatar] = useState(avatar);
  const [addMemberPopup, setAddMemberPopup] = useState(false);
  const [user, setUser] = useState(null);
  const [addUserLoading, setAddUserLoading] = useState(false);

  useEffect(() => {
    const unSub = onSnapshot(doc(database, "groups", groupId), (res) => {
      const groupData = res.data();
      if (groupData && Array.isArray(groupData.messages)) {
        setGroup(groupData.messages);
        setGroupAdmin(groupData.createdBy);
        setMembers(groupData?.members);
      } else {
        setGroup([]);
      }
    });
    return () => unSub();
  }, [chatId, groupId]);

  useEffect(() => {
    const fetchMemberDetails = async () => {
      const memberDetailsPromises = members.map(async (member) => {
        const usersRef = doc(database, "users", member);
        const usersData = await getDoc(usersRef);
        return usersData.data();
      });

      const details = await Promise.all(memberDetailsPromises);
      setMemberDetails(details);
    };

    if (members.length > 0) {
      fetchMemberDetails();
    }
  }, [members]);

  const handleDownload = (imageUrl) => {
    saveAs(imageUrl, 'image.jpg');
  };

  const closeDetails = () => {
    setDetails(false);
  };

  const handleGroupEdit = () => {
    setIsEditingGroup(true);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    try {
      const url = await upload(file);
      setNewAvatar(url);
    } catch (error) {
      console.error('Error uploading avatar image:', error);
    }
  };

  const handleGroupEditSubmit = async () => {
    try {
      await updateDoc(doc(database, "groups", groupId), {
        groupName: newGroupName,
        avatar: newAvatar,
      });

      const groupsRef = doc(database, "groups", groupId);
      const groupData = await getDoc(groupsRef);
      const groupDataVal = groupData.data();
      const members = groupDataVal.members;
      members.forEach(async (member) => {
        const userGroupsRef = doc(database, "userGroups", member);
        const userGroupsData = await getDoc(userGroupsRef);
        const userGroupsDataVal = userGroupsData.data();
        const userGroups = userGroupsDataVal.groups;
        const groupIndex = userGroups.findIndex(g => g.groupId === groupId);
        userGroups[groupIndex].groupName = newGroupName;
        userGroups[groupIndex].avatar = newAvatar;
        await updateDoc(userGroupsRef, {
          groups: userGroups,
        });
      });

      changeGroup(groupId, newGroupName, newAvatar);
      setIsEditingGroup(false);
    } catch (error) {
      console.error("Error updating group:", error);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingGroup(false);
    setNewGroupName(groupName);
    setNewAvatar(avatar);
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");

    try {
      const userRef = collection(database, "users");
      const querySnapshot = await getDocs(
        query(userRef, where("username", "==", username))
      );
      if (!querySnapshot.empty) {
        setUser(querySnapshot.docs[0].data());
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleAdd = async () => {
    try {
      setAddUserLoading(true);
      const groupRef = doc(database, "groups", groupId);
      const groupData = await getDoc(groupRef);
      const groupDataVal = groupData.data();
      if (groupDataVal.members.includes(user.id)) {
        toast.error("User already in group");
        setAddUserLoading(false);
        return;
      }
      const members = groupDataVal.members;
      members.push(user.id);
      await updateDoc(groupRef, {
        members,
      });
      const userGroupsRef = doc(database, "userGroups", user.id);
      const userGroupsData = await getDoc(userGroupsRef);
      const userGroupsDataVal = userGroupsData.data();
      const userGroups = userGroupsDataVal.groups;
      userGroups.push({
        groupId: groupDataVal.groupId,
        groupName: groupDataVal.groupName,
        avatar: groupDataVal.avatar,
        isSeen: false,
        lastMessage: groupDataVal.lastMessage,
        lastMessageSender: groupDataVal.lastMessageSender,
        createdBy: groupDataVal.createdBy,
        members: members,
      });

      await updateDoc(userGroupsRef, {
        groups: userGroups,
      });

      members.forEach(async (member) => {
        if (member !== user.id) {
          const userGroupsRef = doc(database, "userGroups", member);
          const userGroupsData = await getDoc(userGroupsRef);
          const userGroupsDataVal = userGroupsData.data();
          const userGroups = userGroupsDataVal.groups;
          const groupIndex = userGroups.findIndex(
            (g) => g.groupId === groupDataVal.groupId
          );
          userGroups[groupIndex].members = members;
          await updateDoc(userGroupsRef, {
            groups: userGroups,
          });
        }
      });
      setUser(null);
      toast.success("User added to group successfully");
      setAddUserLoading(false);
    } catch (err) {
      console.log(err);
      toast.error("Error adding user");
    }
  };

  return (
    <>
      <div className={`groupDetails ${details ? "showDetails" : "hideDetails"}`}>
        <div className="user">
          <h1 onClick={closeDetails}>x</h1>
          <img src={newAvatar || avatar || Avatar} alt="" />
          <div className="user-info">
            {isEditingGroup ? (
              <div className="edit-group">
                <label htmlFor="newAvatar">Change Avatar</label>
                <input
                  type="file"
                  id='image'
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter new group name"
                />
                <div className='buttons'>
                  <button onClick={handleGroupEditSubmit}>Save</button>
                  <button onClick={handleCancelEdit}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="groupInfo">
                  <h3>{groupName}</h3>
                  {currentUser.id === groupAdmin && <img src={Edit} alt="Edit" onClick={handleGroupEdit} />}
                </div>
                {currentUser.id === groupAdmin && <span>Admin</span>}
              </>
            )}
          </div>
        </div>
        <div className="info">
          <div className="option">
            <div className="title">
              <span>Group Members ({members.length})</span>
              <img src={membersUp ? ArrowUp : ArrowDown} onClick={() => setMembersUp((prev) => !prev)} alt='' />
            </div>
            <div className={`photos ${membersUp ? "" : "hide"}`}>
              {currentUser.id === groupAdmin &&
                <h5 onClick={() => setAddMemberPopup(true)}>Add Member</h5>}
              {memberDetails && memberDetails.map((user, index) => (
                <React.Fragment key={index}>
                  <div className="photoItem">
                    <div className="photoDetail">
                      <img src={user.avatar || Avatar} alt="" />
                      <span>{`${user.username || "User"} ${user.id === currentUser?.id ? " (You)" : ""} ${user.id === groupAdmin ? " Admin" : ""} `}</span>
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div className="title">
              <span>Shared Photos</span>
              <img src={up ? ArrowUp : ArrowDown} onClick={() => setUp((prev) => !prev)} alt='' />
            </div>
            <div className={`photos ${up ? "" : "hide"}`}>
              {group && group.map((msg, index) => (
                <React.Fragment key={index}>
                  {msg.img && (
                    <div className="photoItem">
                      <div className="photoDetail">
                        <img src={msg.img} alt="" />
                        <span>{new Date(msg.createdAt.seconds * 1000).toLocaleDateString()}</span>
                      </div>
                      <img src={Download} alt="Download" onClick={() => handleDownload(msg.img)} />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
      {addMemberPopup && (
        <div className="addMemberPopup">
          <div className="popup">
            <div className="close" onClick={() => setAddMemberPopup(false)}>x</div>
            <h2>Add Member</h2>
            <form onSubmit={handleAddUserSubmit}>
              <input
                type="text"
                placeholder="Search Username"
                name="username"
              />
              <button>
                {" "}
                <img src={Search} alt="" />{" "}
              </button>
            </form>
            {user && (
              <div className="users">
                <div className="user">
                  <img src={user.avatar || Avatar} alt="" />
                  <span>{user.username}</span>
                </div>
                <button onClick={handleAdd} disabled={addUserLoading}>
                  {addUserLoading ? "Adding..." : <img src={Plus} alt="" />}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default GroupDetails;
