import React, { useState } from "react";
import "./Login.css";
import Avatar from "../../assets/images/avatar.png";
import { toast } from "react-toastify";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, database } from "../../firebase/firebase";
import { doc, setDoc } from "firebase/firestore";
import upload from "../../firebase/upload";
import Loader from "../../assets/gif/loader.gif";
// import { useUserData } from "../../userData/userData";


function Login() {
    const [signIn, toggle] = useState(true);
    const [loading, setLoading] = useState(false);
    // const { isLoading } = useUserData();
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
              chats: [],
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
    
    
    return (
        <div className="Container">
            <div className={`SignUpContainer ${signIn !== true ? 'active' : ''}`}>
                {!signIn && (
                    <form onSubmit={handleRegister}>
                        <h1>Create Account</h1>
                        <img src={avatar.url || Avatar} alt="" />
                        <label htmlFor="image">Upload an Image</label>
                        <input type="file" id="image" style={{display:'none'}} onChange={handleAvatar} />
                        <input type="text" placeholder="Username" name="signUpUsername" />
                        <input type="email" placeholder="Email" name="signUpEmail" />
                        <input type="password" placeholder="Password" name="signUpPassword" />
                        <button disabled={loading}>{loading ? "Loading" : "Sign Up"}</button>
                    </form>
                )}
            </div>
            <div className={`SignInContainer ${signIn !== true ? 'active1' : ''}`}>
                {signIn && (
                    <form onSubmit={handleLogIn}>
                        <h1>Sign in</h1>
                        <input type="email" placeholder="Email" name="signInEmail" />
                        <input type="password" placeholder="Password" name="signInPassword" />
                        {/* <a>Forgot your password?</a> */}
                        <button disabled={loading}>{loading ? "Loading" : "Sign In"}</button>
                    </form>
                )}
            </div>
            <div className={`OverlayContainer ${signIn !== true ? 'active2' : ''}`}>
                <div className={`Overlay ${signIn !== true ? 'active3' : ''}`} >
                    <div className={`LeftOverlayPanel ${signIn !== true ? 'active4' : ''}`}>
                        <h1>Welcome Back!</h1>
                        <p>
                            To keep connected with us please login with your personal info
                        </p>
                        <button onClick={() => toggle(true)}>
                            Sign In
                        </button>
                    </div>
                    <div className={`RightOverlayPanel ${signIn !== true ? 'active5' : ''}`}>
                        <h1>New User?</h1>
                        <p>
                            Enter your personal details and start journey with us
                        </p>
                        <button onClick={() => toggle(false)}>
                            Sign Up
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
