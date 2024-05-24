import React, { useState } from 'react';
import './MobileLogin.css'; 
import { toast } from 'react-toastify';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, database } from '../../firebase/firebase';
import { doc, setDoc } from 'firebase/firestore';
import upload from '../../firebase/upload';
import Loader from '../../assets/gif/loader.gif';
import Avatar from '../../assets/images/avatar.png';


const MobileLogin = () => {
  const [isLoginActive, setIsLoginActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [avatar, setAvatar] = useState({
      image: null,
      url: ""
  });

  const handleAvatar = (e) => {
      if(e.target.files[0]) {
          setAvatar({
              image: e.target.files[0],
              url: URL.createObjectURL(e.target.files[0])
          });
      }
  }

  const handleRegister = async (e) => {
      e.preventDefault();
      setLoading(true);
      const formData = new FormData(e.target);
      const { signUpUsername, signUpEmail, signUpPassword } = Object.fromEntries(formData);
      try{
         const user = await createUserWithEmailAndPassword(auth, signUpEmail, signUpPassword);
         let imgUrl = "";
      if (avatar.image) {
          imgUrl = await upload(avatar.image);
      }

         
         await setDoc(doc(database, "users", user.user.uid), {
            username: signUpUsername,
              email: signUpEmail,
              avatar: imgUrl,
              id: user.user.uid,
              blocked: [],
         });
         await setDoc(doc(database, "userChats", user.user.uid), {
          createdAt: Date.now(),  
          chats: [],
         }); 
         await setDoc(doc(database, "userGroups", user.user.uid), {
            createdAt: Date.now(),
            groups: [],
         }); 
         toast.success("Account created successfully.");
      }catch(err){
          console.log(err);
          toast.error(err.message);
      }finally{
          setLoading(false);
      }
  }

  const handleLogIn = async (e) => {
      e.preventDefault();
      setLoading(true);
      const formData = new FormData(e.target);
      const { signInEmail, signInPassword } = Object.fromEntries(formData);
      try{
        await signInWithEmailAndPassword(auth, signInEmail, signInPassword);
        toast.success("Logged in successfully");
      }catch(err){
          console.log(err);
          toast.error(err.message);
      }finally{
          setLoading(false);
      }    
      
      
  }

  if(loading){
      return(
       <div className='chat-container'>
        <div className='Loading-container'> 
         <img src={Loader} alt='Loading...' className='Loading' />
         </div>
      </div>
      )
    }

  const handleLoginClick = () => {
    setIsLoginActive(true);
  };

  const handleSignupClick = () => {
    setIsLoginActive(false);
  };

  return (
    <div className="wrapper">
      <div className="title-text">
        <div className={`title login `}>{isLoginActive ? "Login" : "Create Account"}</div>
      </div>
      <div className="form-container">
        <div className="slide-controls">
          <input
            type="radio"
            name="slide"
            id="login"
            checked={isLoginActive}
            onChange={handleLoginClick}
          />
          <input
            type="radio"
            name="slide"
            id="signup"
            checked={!isLoginActive}
            onChange={handleSignupClick}
          />
          <label htmlFor="login" className={`slide login ${isLoginActive ? '' : 'inactive'}`}>
            Login
          </label>
          <label htmlFor="signup" className={`slide signup ${!isLoginActive ? '' : 'inactive'}`}>
            Signup
          </label>
          <div className="slider-tab"></div>
        </div>
        <div className="form-inner">
          <form action="#" className={`login ${isLoginActive ? 'show' : 'hidden'}`} onSubmit={handleLogIn}>
            <div className="field">
              <input type="text" placeholder="Email" name="signInEmail" />
            </div>
            <div className="field">
              <input type="password" placeholder="Password" name="signInPassword" />
            </div>
            <button disabled={loading}>{loading ? "Loading" : "Sign In"}</button>
          </form>
          <form action="#" className={`signup ${!isLoginActive ? 'show' : 'hidden'}`} onSubmit={handleRegister}>
          <img src={avatar.url || Avatar} alt="" />
                        <label htmlFor="image">Upload an Image</label>
                        <input type="file" accept="image/*" id="image" style={{display:'none'}} onChange={handleAvatar} />
            <div className="field">
              <input type="text" placeholder="Username" name="signUpUsername" />
            </div>
            <div className="field">
              <input type="email" placeholder="Email" name="signUpEmail" />
            </div>
            <div className="field">
              <input type="password" placeholder="Password" name="signUpPassword" />
            </div>
            <button disabled={loading}>{loading ? "Loading" : "Sign Up"}</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MobileLogin;
