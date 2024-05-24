import React, { useEffect, useRef, useState } from "react";
import "./Chat.css";
import Avatar from "../../assets/images/avatar.png";
import Info from "../../assets/images/info.png";
import Img from "../../assets/images/img.png";
import Emoji from "../../assets/images/emoji.png";
import EmojiPicker from "emoji-picker-react";
import BackArrow from "../../assets/images/back-arrow.png";  // Add the back arrow image
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { database } from "../../firebase/firebase";
import { useChatData } from "../../contextData/chatData";
import { useUserData } from "../../contextData/userData";
import upload from "../../firebase/upload";
import { useMediaQuery } from "react-responsive";

const Chat = ({ setDetails, setShowChat,details }) => {  
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState();
  const [editMessage, setEditMessage] = useState("");
  const [senderId, setSenderId] = useState();
  const [currentId, setCurrentId] = useState();
  const [img, setImg] = useState({
    image: null,
    url: "",
  });
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked,resetChat } =
    useChatData();
  const { currentUser } = useUserData();
  const endRef = useRef(null);
  const [editIndex, setEditIndex] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const isSmallScreen = useMediaQuery({ query: '(max-width: 768px)' });

  // useEffect(() => {
  //   endRef.current.scrollIntoView({ behavior: "smooth" });
  // }, [chatId, chat?.messages]);

  useEffect(() => {
    const unSub = onSnapshot(doc(database, "chats", chatId), (res) => {
      setChat(res.data());
    });

    return () => unSub();
  }, [chatId]);

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

    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
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
        await updateDoc(doc(database, "chats", chatId), {
            messages: arrayUnion({
                senderId: currentUser.id,
                ...(message && { text: message.trim() }),
                createdAt: new Date(),
                ...(imgUrl && { img: imgUrl }),
                isSeen: false,
            }),
        });
        const userIds = [currentUser.id, user.id];
        userIds.forEach(async (id) => {
            const userChatRef = doc(database, "userChats", id);
            const userChatSnapshot = await getDoc(userChatRef);
            if (userChatSnapshot.exists()) {
                const userChatsData = userChatSnapshot.data();
                const chatIndex = userChatsData.chats.findIndex(
                    (c) => c.chatId === chatId
                );
                if (chatIndex !== -1) {
                    userChatsData.chats[chatIndex].lastMessage = message || "Image";
                    userChatsData.chats[chatIndex].isSeen = 
                        id === currentUser.id ? true : false;
                    userChatsData.chats[chatIndex].updatedAt = Date.now();

                    await updateDoc(userChatRef, {
                        chats: userChatsData.chats,
                    });
                }
            }
        });
        setImg({ image: null, url: "" });
        setViewportHeight();
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
      const newMessages = [...chat.messages];
      newMessages[deleteIndex].deletedBy = currentUser.id;
      newMessages[deleteIndex].deletedForMe = true;
      await updateDoc(doc(database, "chats", chatId), {
        messages: newMessages,
      });
      setDeleteIndex(null);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleDeleteForEveryone = async () => {
    try {
      const newMessages = [...chat.messages];
      newMessages[deleteIndex].deletedForEveryone = true;
      newMessages[deleteIndex].deletedBy = currentUser.id;
      await updateDoc(doc(database, "chats", chatId), {
        messages: newMessages,
      });
      setDeleteIndex(null);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const handleEditSubmit = async (index) => {
    try {
      const newMessages = [...chat.messages];
      newMessages[index].text = editMessage;
      await updateDoc(doc(database, "chats", chatId), {
        messages: newMessages,
      });
      setEditIndex(null);
      setEditMessage("");
    } catch (error) {
      console.error("Error editing message:", error);
    }
  };

  return (
    <div className={`chat ${isSmallScreen && details ? "noChat" : ""}`}>
      <div className="top" onClick={showDetails}>
        <div className="user" >
        {isSmallScreen && (
          <img src={BackArrow} alt="Back" className="back-arrow" onClick={()=>{
            setShowChat(false);
            resetChat()

          }} />
        )}
          <img
            src={isCurrentUserBlocked ? Avatar : user.avatar || Avatar}
            alt="Avatar"
            className="avatar"
          />
          <div className="user-detail">
            <h2>{user.username || "User"}</h2>
            <p>Lorem ipsum dolor sit, amet.</p>
          </div>
        </div>
        <div className="icons">
          <img src={Info} alt="Info" />
        </div>
      </div>
      <div className="center">
        {chat?.messages?.map((msg, index, messages) => {
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
                                    setEditMessage(e.target.value)}
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
        {/* <div ref={endRef}></div> */}
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
            placeholder={
              isCurrentUserBlocked || isReceiverBlocked
                ? "You Cannot Send a Message"
                : "Type a message"
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={isCurrentUserBlocked || isReceiverBlocked}
          />
          <button
            className="send-button"
            disabled={isCurrentUserBlocked || isReceiverBlocked}
          >
            Send
          </button>
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

export default Chat;
