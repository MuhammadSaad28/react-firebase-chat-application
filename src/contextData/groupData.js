import { create } from "zustand";

export const useGroupData = create((set) => ({
    groupId: null,
    groupName: "",
    avatar:"",
    changeGroup: (groupId,groupName,avatar) => {
        return set({ 
          groupId,
          groupName,
          avatar
     })},
    resetGroup: () => {return set({ groupId: null, groupName: "",avatar:"" })},
}));