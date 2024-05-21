import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { create } from "zustand";
import { database } from "../firebase/firebase";
import { useUserData } from "./userData";

export const useChatData = create((set) => ({
    chatId: null,
    user: null,
    isCurrentUserBlocked: false,
    isReceiverBlocked: false,
    changeChat: (chatId, user) => {
        const currentUser = useUserData.getState().currentUser;

        // checking if current user is blocked
         if(user.blocked.includes(currentUser.id)){
            return set({
                chatId,
                user,
                isCurrentUserBlocked: true,
                isReceiverBlocked: false,
            });
         }

        //  checking if receiver is blocked
        else if(currentUser.blocked.includes(user.id)){
            return set({
                chatId,
                user,
                isCurrentUserBlocked: false,
                isReceiverBlocked: true,
            });
        }
        else{
        return set({
            chatId,
            user,
            isCurrentUserBlocked: false,
            isReceiverBlocked: false,
        })};
    },
    changeBlock: ()=>{
        set((state)=>({...state, isReceiverBlocked: !state.isReceiverBlocked}))
    },
    subscribeToUserChanges: (userId) => {
        const userDocRef = doc(database, "users", userId);
        const unsubscribe = onSnapshot(userDocRef, (doc) => {
            const currentUser = useUserData.getState().currentUser;
            const user = doc.data();
            if (user.blocked.includes(currentUser.id)) {
                set({ isReceiverBlocked: false,isCurrentUserBlocked: true, });
            }
            if(currentUser.blocked.includes(user.id)){
                set({ isReceiverBlocked: true,isCurrentUserBlocked: false, });
            }
            if(!user.blocked.includes(currentUser.id) && !currentUser.blocked.includes(user.id))
            {
                set({ isReceiverBlocked: false,isCurrentUserBlocked: false, });
            }

        });
        return unsubscribe;
    },
}));
