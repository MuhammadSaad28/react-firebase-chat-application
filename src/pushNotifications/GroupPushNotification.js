import { collection, onSnapshot } from "firebase/firestore";
import { useEffect } from "react";
import { database } from "../firebase/firebase";

export const GroupPushNotification = () => {
  

  useEffect(() => {
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
  }, []);

  return null;
};
