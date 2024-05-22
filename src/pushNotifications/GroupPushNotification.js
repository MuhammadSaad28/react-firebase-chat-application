import { collection, doc, getDoc, getDocs, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { database } from "../firebase/firebase";
import { useUserData } from "../contextData/userData";
import Avatar from "../assets/images/avatar.png";

export const GroupPushNotification = () => {
    const [lastMessage, setLastMessage] = useState();
    const [senderId, setSenderId] = useState();
    const { currentUser } = useUserData();
  useEffect(() => {
    if(currentUser) {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications");
      return;
    }

    const permission = Notification.permission;
    if (permission !== "granted") {
      Notification.requestPermission();
    }

    if (permission === "granted") {
      const fetchGroups = async () => {
        const querySnapshot = await getDocs(collection(database, "groups"));
        querySnapshot.forEach((res) => {
          const groupData = res.data();
            const newGroupId = res.id;
          const lastMsg = groupData.lastMessage;
          setLastMessage(lastMsg);
          const senderId = groupData.lastMessageSender;
            setSenderId(senderId);
          const groupMembers = groupData.members;

          if (senderId) {
            groupMembers.forEach(async (member) => {
              const userDoc = await getDoc(doc(database, "users", member));
              const senderDoc = await getDoc(doc(database, "users", senderId));
                const senderData = senderDoc.data();
              if (userDoc.exists()) {
                const usersData = userDoc.data();

                if (senderId !== currentUser?.id) {
                  const checkDoc = await getDoc(doc(database, "userGroups", member));
                  if (checkDoc.exists()) {
                    const userGroupsData = checkDoc.data();
                    const userGroups = userGroupsData.groups;

                    userGroups.forEach(async (userGroup) => {
                        if(userGroup.isSeen === false) {
                      if (userGroup.groupId === newGroupId) {
                        const group = { user: usersData, ...userGroup };

                        if (lastMsg) {
                          const notification = new Notification(`${group.groupName}`, {
                            body: `${senderData.username}: ${lastMsg}`,
                            icon: `${userGroup.avatar || Avatar}`,
                            tag: senderData.id,
                          });

                          notification.onclick = () => {
                            window.focus();
                            notification.close();
                          };
                        }
                      }
                    }
                    });
                  }
                }
              }
            });
          }
        });
      };

      fetchGroups();

      // Subscribe to new messages
      const unsubscribe = onSnapshot(collection(database, "groups"), () => {
        fetchGroups();
      });

      return () => {
        unsubscribe();
      };
    }
    }
  }, []);

  return null;
};
