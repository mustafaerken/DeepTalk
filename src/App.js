import {useState} from 'react';
import logo from './logo.png';
import {db,storage} from './firebase';
import {ref,doc,collection,setDoc,getDoc,deleteDoc,getDocs,query,where} from "firebase/firestore";
import {ref as storageRef,deleteObject} from "firebase/storage";
import {getAuth,signInWithEmailAndPassword,deleteUser} from "firebase/auth";


function App(){

  const [reason,setReason]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [loading,setLoading]=useState(false);
  const [rejected,setRejected]=useState('none');
  const auth = getAuth();

  function send(){
    setLoading(true);
    setTimeout(function(){
      signIn()
    },1000)
  }

  function signIn(){
    signInWithEmailAndPassword(auth,email,password).then((e)=>{
      getDoc(doc(db,'users',auth.currentUser.uid)).then((doc)=>{
        const user={...doc.data(),id:doc.id};
        getAndDelete(user);
      })

    }).catch(()=>{
      setRejected(true);
      setLoading(false);
    })
  }


  function getAndDelete(user){

    deleteDoc(doc(db,'users',user.id)).then(()=>{
      setTimeout(function(){
        setLoading(false);
        setRejected(false);
      },1000)
      console.log('deleted user')
    }).catch((e)=>{
      setLoading(false);
      setRejected(true);
      setDoc(doc(db,"errorDeletedUser",user.id),{
        uid:user.id,
        name:user.name,
        email:user.email,
        millisecond:Date.now(),
        error:e,
      })
    })
    if(user.photoUrlLow){
      deleteObject(storageRef(storage,'ProfilePictures/'+user.id+'/High'))
      deleteObject(storageRef(storage,'ProfilePictures/'+user.id+'/Low'))
    }
    const q = query(collection(db,'posts'),where("uid","==",user.id))
    getDocs(q).then((doc)=>{
    doc.forEach((item)=>{
      const post={...item.data(),id:item.id};
      deletePost(post);
      })
    }).catch((e)=>{console.log('Profile Get Error: '+e);})
    deleteUser(auth.currentUser);
    setDoc(doc(db,"deletedUsers",user.id),{
      uid:user.id,
      name:user.name,
      email:user.email,
      millisecond:Date.now(),
      reason:reason,
    })

  }


    function deletePost(i){
      const thisPostAudio=i.assets?.audio?.audioFirebaseLocation;
      const thisPostImage=i.assets?.image?.imageFirebaseLocation;
      deleteDoc(doc(db,'posts',i.id)).then(()=>{console.log('deleted post');}).catch((e)=>{console.log(e);})
      if(thisPostAudio){
        deleteObject(storageRef(storage,thisPostAudio)).then(()=>{console.log('deleted audioFirebaseLocation.')}).catch((e)=>{console.log('Error audioFirebaseLocation.'+e)})
      }
      if(thisPostImage){
        deleteObject(storageRef(storage,thisPostImage)).then(()=>{console.log('deleted imageFirebaseLocation')}).catch((e)=>{console.log('Error imageFirebaseLocation.'+e)})
      }
    }

  return(
    <div className="App">
      <header className="App-header">

        <div style={{paddingBottom:'7vh'}}>
          <img src={logo} class="logo"/>
          <div style={{fontSize:15,fontWeight:'bold',color:'white'}}>DeepTalk</div>
        </div>

        <div style={{fontSize:15,paddingBottom:'7vh',color:'white'}}>Delete your account</div>

        <div style={{fontSize:15}}>Account Email</div>
        <input
        value={email}
        type="text"
        onChange={(e)=>{setEmail(e.target.value)}}
        onClick={()=>{setRejected('none')}}/>

        <div style={{fontSize:15}}>Account Password</div>
        <input
        value={password}
        type="password"
        onChange={(e)=>{setPassword(e.target.value)}}
        onClick={()=>{setRejected('none')}}/>

        <div style={{fontSize:15}}>Why you want to delete?</div>
        <input
        className="reason"
        value={reason}
        type="text"
        onChange={(e)=>{setReason(e.target.value)}}
        />

        {loading?
        <div style={{height:'7vh'}}>
          <div class="loader"></div>
        </div>
        :
        <div style={{height:'7vh',width:'100%'}}>
          <button disabled={email&&password.length>5?false:true} className="button"onClick={()=>{send()}}>Send</button>
        </div>
        }
        <div style={{height:'3vh'}}>
        {rejected=='none'?null:
        rejected?
          <div style={{color:'tomato',fontWeight:'bold',fontSize:15}}>Email or Password wrong.</div>
          :
          <div style={{color:'lawngreen',fontWeight:'bold',fontSize:15}}>Successfully deleted.</div>
        }
        </div>


        <br/>
        <div style={{fontSize:13,fontWeight:'bold'}}>What will be deleted?</div>
        <div style={{fontSize:12}}>Your account.</div>
        <div style={{fontSize:12}}>Profile picture.</div>
        <div style={{fontSize:12}}>Post that you shared.</div>

      </header>
    </div>
  );
}

export default App;
