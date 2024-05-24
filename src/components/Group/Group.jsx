import React, { useEffect, useRef, useState } from "react";
import "./Group.css";
import Avatar from "../../assets/images/avatar.png";
import Info from "../../assets/images/info.png";
import Img from "../../assets/images/img.png";
import Emoji from "../../assets/images/emoji.png";
import EmojiPicker from "emoji-picker-react";
import BackArrow from "../../assets/images/back-arrow.png"
import { useMediaQuery } from "react-responsive";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { database } from "../../firebase/firebase";
import { useUserData } from "../../contextData/userData";
import { useGroupData } from "../../contextData/groupData";
import upload from "../../firebase/upload";

const Group = ({ details,setDetails,setShowChat }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [group, setGroup] = useState();
  const [editMessage, setEditMessage] = useState("");
  const [senderId, setSenderId] = useState();
  const [currentId, setCurrentId] = useState();
  const isSmallScreen = useMediaQuery({ query: '(max-width: 768px)' });
  const [img, setImg] = useState({
    image: null,
    url: "",
  });
  const { currentUser } = useUserData();
  const { groupId, groupName, avatar, resetGroup } = useGroupData();
  const endRef = useRef(null);
  const [editIndex, setEditIndex] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);


  const [userAvatars, setUserAvatars] = useState({});
  const [usernames, setUsernames] = useState({});

  useEffect(() => {
    endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [groupId, group?.messages]);

  useEffect(() => {
    const unSub = onSnapshot(doc(database, "groups", groupId), (res) => {
      setGroup(res.data());
    });
    setDetails(false);
    return () => unSub();
  }, [groupId]);

  useEffect(() => {
    if (group?.messages) {
      group.messages.forEach((msg) => {
        if (msg.senderId !== currentUser?.id) {
          fetchUserAvatar(msg.senderId);
          fetchUsername(msg.senderId);
        }
      });
    }
  }, [group]);

  const fetchUserAvatar = async (userId) => {
    if (!userAvatars[userId]) {
      const userDoc = await getDoc(doc(database, "users", userId));
      if (userDoc.exists()) {
        setUserAvatars((prevAvatars) => ({
          ...prevAvatars,
          [userId]: userDoc.data().avatar,
        }));
      }
    }
  };

  const fetchUsername = async (userId) => {
    if (!usernames[userId]) {
      const userDoc = await getDoc(doc(database, "users", userId));
      if (userDoc.exists()) {
        setUsernames((prevUsernames) => ({
          ...prevUsernames,
          [userId]: userDoc.data().username,
        }));
      }
    }
  };

  const handleEmoji = (e) => {
    setMessage(message + e.emoji);
  };

  const handleImg = (e) => {
    if (e.target.files[0]) {
      setImg({
        image: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const formatDateLabel = (date) => {
    const today = new Date();
    const messageDate = date.toDate();
    if (today.toDateString() === messageDate.toDateString()) {
      return "Today";
    } else if (today.getDate() - 1 === messageDate.getDate()) {
      return "Yesterday";
    } else {
      return messageDate.toLocaleDateString();
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim() && !img.image) {
      return;
  }
    let imgUrl = null;
    try {
      if (img.image) {
        imgUrl = await upload(img.image);
      }
      await updateDoc(doc(database, "groups", groupId), {
        lastMessage: message,
        lastMessageSender: currentUser.id,
        messages: arrayUnion({
          senderId: currentUser.id,
          ...(message && { text: message.trim()}),
          createdAt: new Date(),
          ...(imgUrl && { img: imgUrl }),
        }),
      });

      const groupsDoc = doc(database, "groups", groupId);
      const groupSnapshot = await getDoc(groupsDoc);
      const groupData = groupSnapshot.data();
      const userIds = groupData.members;

      userIds.forEach(async (id) => {
      const userGroupRef = doc(database, "userGroups", id);
      const userGroupSnapshot = await getDoc(userGroupRef);
      if (userGroupSnapshot.exists()) {
        const userGroupsData = userGroupSnapshot.data();
        const groupIndex = userGroupsData.groups.findIndex(
          (g) => g.groupId === groupId
        );
        if (groupIndex !== -1) {
          userGroupsData.groups[groupIndex].lastMessage = message;
          userGroupsData.groups[groupIndex].lastMessageSender = currentUser.id;
          userGroupsData.groups[groupIndex].isSeen =
            id === currentUser.id ? true : false;
          userGroupsData.groups[groupIndex].updatedAt = Date.now();

          await updateDoc(userGroupRef, {
            groups: userGroupsData.groups,
          });
        }
      }
    });
      setImg({ image: null, url: "" });
      setMessage("");
    } catch (err) {
      console.log(err);
    }
  };

  const showDetails = () => {
    setDetails(true);
  };

  const handleEdit = (index, msg) => {
    setEditIndex(index);
    setEditMessage(msg.text);
  };

  const handleDelete = async (index, sender, currentUser) => {
    setDeleteIndex(index);
    setSenderId(sender);
    setCurrentId(currentUser);
  };

  const handleDeleteForMe = async () => {
    try {
      const newMessages = [...group.messages];
      newMessages[deleteIndex].deletedBy = currentUser.id;
      newMessages[deleteIndex].deletedForMe = true;
      await updateDoc(doc(database, "groups", groupId), {
        messages: newMessages,
      });
      setDeleteIndex(null);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleDeleteForEveryone = async () => {
    try {
      const newMessages = [...group.messages];
      newMessages[deleteIndex].deletedForEveryone = true;
      newMessages[deleteIndex].deletedBy = currentUser.id;
      await updateDoc(doc(database, "groups", groupId), {
        messages: newMessages,
      });
      setDeleteIndex(null);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleEditSubmit = async (index) => {
    try {
      const newMessages = [...group.messages];
      newMessages[index].text = editMessage;
      await updateDoc(doc(database, "groups", groupId), {
        messages: newMessages,
      });
      setEditIndex(null);
      setEditMessage("");
    } catch (error) {
      console.error("Error editing message:", error);
    }
  };

  return (
    <div className={`group ${details ? "noGroup" : ""}`}>
      <div className="top" onClick={showDetails}>
        <div className="user">
        {isSmallScreen && (
          <img src={BackArrow} alt="Back" className="back-arrow" onClick={()=>{
            setShowChat(false);
            setDetails(false);
            resetGroup();

          }} />
        )}
          <img src={avatar || Avatar} alt="Avatar" className="avatar" />
          <div className="user-detail">
            <h2>{groupName || "GroupName"}</h2>
            <p>Lorem ipsum dolor sit, amet.</p>
          </div>
        </div>
        <div className="icons">
          <img src={Info} alt="Info" />
        </div>
      </div>
      <div className="center">
        {group?.messages?.map((msg, index, messages) => {
          const currentDateLabel = formatDateLabel(msg.createdAt);
          const previousMessage = messages[index - 1];
          const previousDateLabel = previousMessage
            ? formatDateLabel(previousMessage.createdAt)
            : null;
          const showDateLabel = currentDateLabel !== previousDateLabel;
          return (
            <React.Fragment key={msg.createdAt}>
              {showDateLabel && (
                <div className="date-label">{currentDateLabel}</div>
              )}
              <div
                className={
                  msg.senderId === currentUser?.id
                    ? "message sent"
                    : "message received"
                }
              >
                {msg.senderId !== currentUser?.id && (
                  <>
                    <img
                      src={userAvatars[msg.senderId] || Avatar}
                      alt="Avatar"
                    />
                    <div className="title">
                      {usernames[msg.senderId] || "User"}
                    </div>
                  </>
                )}
                <div className="content">
                  {msg.deletedForEveryone ? (
                    <p>This message was deleted</p>
                  ) : (
                    <>
                      {msg.deletedForMe && msg.senderId === currentUser.id ? (
                        <p>This message was deleted</p>
                      ) : (
                        <>
                          <div key={index}>
                            {index === editIndex ? (
                              <div className="edit">
                                <input
                                  type="text"
                                  value={editMessage}
                                  onChange={(e) =>
                                    setEditMessage(e.target.value)
                                  }
                                  className="edit-input"
                                />
                                <button
                                  onClick={() => handleEditSubmit(index)}
                                  className="save-button"
                                >
                                  Save
                                </button>{" "}
                              </div>
                            ) : (
                              <>
                                <div className="message-options">
                                  {msg.senderId === currentUser.id ? (
                                    <>
                                      <button
                                        onClick={() => handleEdit(index, msg)}
                                      >
                                        ✏️
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleDelete(
                                            index,
                                            msg.senderId,
                                            currentUser.id
                                          )
                                        }
                                      >
                                        🗑️
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() =>
                                        handleDelete(
                                          index,
                                          msg.senderId,
                                          currentUser.id
                                        )
                                      }
                                    >
                                      🗑️
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                          {msg.img && <img src={msg.img} alt="" />}
                          <p>{msg.text && msg.text}</p>
                          <span>
                            {msg.createdAt &&
                              new Date(
                                msg.createdAt.seconds * 1000
                              ).toLocaleTimeString()}
                          </span>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}
        <div ref={endRef}></div>
      </div>
      <div className="bottom">
        <div className="previewImg">
          {img.url && <img src={img.url} alt="" />}
        </div>
        <div className="icons">
          <label htmlFor="img">
            <img src={Img} alt="" />
          </label>
          <input
            type="file"
            id="img"
            style={{ display: "none" }}
            onChange={handleImg}
          />
        </div>
        <div className="emoji">
          <img src={Emoji} alt="" onClick={() => setOpen((prev) => !prev)} />
          <div className="emoji-picker">
            <EmojiPicker open={open} onEmojiClick={handleEmoji} />
          </div>
        </div>
        <form onSubmit={handleSend}>
          <input
            type="text"
            placeholder={"Type a message"}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button className="send-button">Send</button>
        </form>
      </div>
      {deleteIndex !== null && (
        <div className="delete-popup">
          <p>Delete message for:</p>
          <button onClick={handleDeleteForMe}>Me</button>
          <button
            className={senderId !== currentId ? "d-none" : ""}
            onClick={handleDeleteForEveryone}
          >
            Everyone
          </button>
        </div>
      )}
    </div>
  );
};

export default Group;
