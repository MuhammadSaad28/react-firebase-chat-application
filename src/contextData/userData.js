import { doc, getDoc } from "firebase/firestore";
import { create } from "zustand";
import { database } from "../firebase/firebase";

export const useUserData = create((set) => ({
    currentUser: "",
    isLoading: true,
    userInfo : async (uid)=>{
        if(!uid) return set({currentUser: null, isLoading: false});
        try{
            const currentUser = await getDoc(doc(database, "users", uid));
            if(currentUser.exists()){
                return set({currentUser: currentUser.data(), isLoading: false});
            }else{
                return set({currentUser: null, isLoading: false});
            } 
        }catch(err){
            console.log(err);
            return set({currentUser: null, isLoading: false});
        }
    }
}));
