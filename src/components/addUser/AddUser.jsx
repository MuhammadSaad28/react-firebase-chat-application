import React, { useState } from "react";
import "./AddUser.css";
import Search from "../../assets/images/search.png";
import Plus from "../../assets/images/plus.png";
import Avatar from "../../assets/images/avatar.png";
import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { database } from "../../firebase/firebase";
import { useUserData } from "../../contextData/userData";
import upload from "../../firebase/upload";
import { toast } from "react-toastify";

const AddUser = () => {
  const [group, setGroup] = useState(null);
  const [user, setUser] = useState(null);
  const { currentUser } = useUserData();
  const [addUser, setAddUser] = useState(true);
  const [createGroup, setCreateGroup] = useState(false);
  const [joinGroup, setJoinGroup] = useState(false);
  const [createGroupLoading, setCreateGroupLoading] = useState(false);
  const [joinGroupLoading, setJoinGroupLoading] = useState(false);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [avatar, setAvatar] = useState({
    groupImg: null,
    url: "",
  });

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

  const handleAvatar = (e) => {
    if (e.target.files[0]) {
      setAvatar({
        groupImg: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleCreateGroupSubmit = async (e) => {
    e.preventDefault();
    setCreateGroupLoading(true);
    const formData = new FormData(e.target);
    const groupName = formData.get("groupName");
    try {
      let groupImgUrl = "";
      if (avatar.groupImg) {
        groupImgUrl = await upload(avatar.groupImg);
      }
      const groupRef = collection(database, "groups");
      const newGroupRef = doc(groupRef);

      await setDoc(newGroupRef, {
        createdAt: serverTimestamp(),
        messages: [],
        groupId: newGroupRef.id,
        groupName: groupName,
        avatar: groupImgUrl,
        private: isPrivate,
        lastMessage: "",
        lastMessageSender: "",
        createdBy: currentUser.id,
        members: [currentUser.id],
        updatedAt: Date.now(),
      });

      const currentUserGroupsRef = doc(database, "userGroups", currentUser.id);

      await updateDoc(currentUserGroupsRef, {
        groups: arrayUnion({
          groupId: newGroupRef.id,
          groupName: groupName,
          avatar: groupImgUrl,
          private: isPrivate,
          lastMessage: "",
          lastMessageSender: "",
          createdBy: currentUser.id,
          members: [currentUser.id],
          updatedAt: Date.now(),
        }),
      });

      toast.success("Group created successfully");

      setAvatar({
        groupImg: null,
        url: "",
      });
      formData.set("groupName", "");
      setCreateGroupLoading(false);
    } catch (err) {
      console.log(err);
      toast.error("Error creating group");
    }
  };

  const handleJoinGroupSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const searchedGroupName = formData.get("searchedGroupName");

    try {
      const userGroupsRef = collection(database, "userGroups");
      const userDocs = await getDocs(userGroupsRef);
      const results = [];
      for (const userDoc of userDocs.docs) {
        const userGroupsData = userDoc.data();

        // Check if the groups array contains an object with the matching groupName
        const matchingGroups = userGroupsData.groups.filter(
          (group) => group.groupName === searchedGroupName
        );

        if (matchingGroups.length > 0) {
          results.push({
            matchingGroups: matchingGroups,
          });
        }
      }
      if (results.length === 0) {
        toast.error("Group not found");
        return;
      }
      setGroup(results[0].matchingGroups[0]);
    } catch (err) {
      console.log(err);
      toast.error("Error finding group");
    }
  };

  const handleAdd = async () => {
    try {
      setAddUserLoading(true);
      const chatRef = collection(database, "chats");
      const newChatRef = doc(chatRef);

      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      const userChatsRef = doc(database, "userChats", user.id);
      const currentUserChatsRef = doc(database, "userChats", currentUser.id);

      await updateDoc(userChatsRef, {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: currentUser.id,
          ownUserId: user.id,
          updatedAt: Date.now(),
          createdAt: new Date(),
        }),
      });

      await updateDoc(currentUserChatsRef, {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: user.id,
          ownUserId: currentUser.id,
          updatedAt: Date.now(),
          createdAt: new Date(),
        }),
      });
      setAddUserLoading(false);
    } catch (err) {
      console.log(err);
      toast.error("Error adding user");
    }
  };

  const handleJoinGroup = async () => {
    try {
      setJoinGroupLoading(true);
      if (group.members.includes(currentUser.id)) {
        toast.error("You are already a member of this group");
        setJoinGroupLoading(false);
        return;
      }
      if (group.private) {
        toast.error("This is a private group, you can't join it");
        setJoinGroupLoading(false);
        return;
      }

      const userGroupsRef = doc(database, "userGroups", currentUser.id);
      const groupRef = doc(database, "groups", group.groupId);

      await updateDoc(groupRef, {
        members: arrayUnion(currentUser.id),
      });

      await updateDoc(userGroupsRef, {
        groups: arrayUnion({
          groupId: group.groupId,
          groupName: group.groupName,
          avatar: group.avatar,
          private: group.private,
          lastMessage: "",
          lastMessageSender: "",
          createdBy: group.createdBy,
          members: [...group.members, currentUser.id],
          updatedAt: Date.now(),
        }),
      });

      for (const memberId of group.members) {
        const memberRef = doc(database, "userGroups", memberId);
        const memberSnap = await getDoc(memberRef);
        const memberData = memberSnap.data().groups || [];

        const groupIndex = memberData.findIndex(
          (g) => g.groupId === group.groupId
        );

        if (groupIndex !== -1) {
          const updatedGroups = [...memberData];
          updatedGroups[groupIndex] = {
            groupId: group.groupId,
            groupName: group.groupName,
            avatar: group.avatar,
            private: group.private,
            lastMessage: "",
            lastMessageSender: "",
            createdBy: group.createdBy,
            members: [...group.members, currentUser.id],
            updatedAt: Date.now(),
          };

          await updateDoc(memberRef, {
            groups: updatedGroups,
          });
        }
      }

      toast.success("Group joined successfully");
      setJoinGroupLoading(false);
    } catch (err) {
      console.log(err);
      toast.error("Error joining group");
    }
  };

  return (
    <>
      <div className="addUser">
        <div className="selection-buttons">
          <button
            onClick={() => {
              setAddUser(true);
              setCreateGroup(false);
              setJoinGroup(false);
            }}
            className={addUser ? "active" : ""}
          >
            Add User
          </button>
          <button
            onClick={() => {
              setAddUser(false);
              setCreateGroup(true);
              setJoinGroup(false);
            }}
            className={createGroup ? "active" : ""}
          >
            Create Group
          </button>
          <button
            onClick={() => {
              setAddUser(false);
              setCreateGroup(false);
              setJoinGroup(true);
            }}
            className={joinGroup ? "active" : ""}
          >
            Join Group
          </button>
        </div>
        {addUser && (
          <>
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
          </>
        )}
        {createGroup && (
          <>
            <div className="createGroup">
              <form onSubmit={handleCreateGroupSubmit}>
                <div className="uploadImg">
                  <img src={avatar.url || Avatar} alt="" />
                  <label htmlFor="groupImg">Choose Group Img</label>
                  <input
                    type="file"
                    id="groupImg"
                    style={{ display: "none" }}
                    onChange={handleAvatar}
                  />
                </div>
                <div className="groupDetails">
                  <div className="private-option">
                    <label htmlFor="private">Private</label>
                    <input
                      type="checkbox"
                      name="private"
                      id="private"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter Group Name"
                    name="groupName"
                  />
                  <button disabled={createGroupLoading}>
                    {createGroupLoading
                      ? "Creating Group...Please Wait"
                      : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
        {joinGroup && (
          <>
            <form onSubmit={handleJoinGroupSubmit}>
              <input
                type="text"
                placeholder="Search Group Name"
                name="searchedGroupName"
              />
              <button>
                {" "}
                <img src={Search} alt="" />{" "}
              </button>
            </form>
            {group && (
              <div className="users">
                <div className="user">
                  <img src={group.avatar || Avatar} alt="" />
                  <span>{group.groupName}</span>
                  <span>{group.private && " (Private)"}</span>
                </div>
                <button onClick={handleJoinGroup} disabled={joinGroupLoading}>
                  {joinGroupLoading ? "Joining" : "Join"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default AddUser;
