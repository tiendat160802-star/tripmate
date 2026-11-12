// Firebase Web SDK v13.2.0 — chỉ được tải khi firebase-config.js đã được cấu hình.
// Dữ liệu được lưu thành nhiều document nhỏ, tránh việc ghi đè cả chuyến đi.
import {initializeApp} from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js';
import {getAuth,signInAnonymously} from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js';
import {initializeFirestore,persistentLocalCache,persistentMultipleTabManager,getFirestore,
  doc,collection,getDoc,setDoc,addDoc,updateDoc,deleteDoc,onSnapshot,serverTimestamp,runTransaction,query,where,writeBatch
} from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js';

const collections=['members','activities','expenses','settlements','checklist','links'];
export async function createLiveAdapter(config){
  const fireApp=initializeApp(config);
  const auth=getAuth(fireApp);
  await auth.authStateReady();
  const current=auth.currentUser||(await signInAnonymously(auth)).user;
  let db;
  try{db=initializeFirestore(fireApp,{localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})})}
  catch(err){console.warn('Không thể khởi tạo bộ nhớ offline lâu dài:',err);db=getFirestore(fireApp)}
  const uid=current.uid;
  let unsubs=[];
  let notificationStop=null;
  const tripRef=code=>doc(db,'trips',code);
  const memberRef=code=>doc(db,'trips',code,'members',uid);
  function unsubscribe(){for(const fn of unsubs)fn();unsubs=[]}
  async function createTrip(code,data,name){
    const ref=tripRef(code);
    await runTransaction(db,async tx=>{
      const prev=await tx.get(ref);
      if(prev.exists())throw Error('Mã chuyến đi đã tồn tại. Hãy thử tạo lại.');
      tx.set(ref,{code,...data,ownerUid:uid,createdByName:name,createdAt:serverTimestamp(),updatedAt:serverTimestamp(),updatedByName:name});
    });
    await setDoc(memberRef(code),{name,role:'owner',joinedAt:serverTimestamp()});
  }
  async function joinTrip(code,name){
    const s=await getDoc(tripRef(code));
    if(!s.exists())throw Error('Không tìm thấy chuyến đi. Kiểm tra lại mã nhóm.');
    const m=memberRef(code);
    const existed=await getDoc(m).catch(()=>null);
    if(existed?.exists())await updateDoc(m,{name});
    else await setDoc(m,{name,role:'member',joinedAt:serverTimestamp()});
  }
  function subscribe(code,onChange,onError){
    unsubscribe();
    const state={meta:null,members:[],activities:[],expenses:[],settlements:[],checklist:[],links:[]};
    const ready=new Set();
    const publish=()=>{
      if(ready.size<collections.length+1||!state.meta)return;
      const all=[...metadata.values()];
      const pending=all.some(x=>x.hasPendingWrites);
      const cached=all.some(x=>x.fromCache);
      const status=pending?'Đang đồng bộ':cached?'Dữ liệu offline':'Đã đồng bộ';
      onChange({...state.meta,code,...Object.fromEntries(collections.map(k=>[k,state[k]]))},status);
    };
    unsubs.push(onSnapshot(tripRef(code),{includeMetadataChanges:true},snap=>{
      if(!snap.exists()){onError(Error('Chuyến đi đã bị xóa.'));return}
      state.meta=snap.data();ready.add('trip');metadata.set('trip',snap.metadata);publish();
    },onError));
    for(const kind of collections){
      unsubs.push(onSnapshot(collection(db,'trips',code,kind),{includeMetadataChanges:true},snap=>{
        state[kind]=snap.docs.map(x=>({id:x.id,...x.data()}));
        ready.add(kind);metadata.set(kind,snap.metadata);publish();
      },onError));
    }
  }
  // Giữ metadata cho từng listener để trạng thái "đã đồng bộ" không bị kẹt ở cache.
  const metadata=new Map();
  function subscribeSafe(code,onChange,onError){metadata.clear();return subscribe(code,onChange,onError)}
  function mutate(code,kind,op,data,id,name){
    if(kind==='trip'){
      if(op!=='update')throw Error('Thao tác không hợp lệ');
      return updateDoc(tripRef(code),{...data,updatedAt:serverTimestamp(),updatedByName:name});
    }
    if(!collections.includes(kind)||kind==='members')throw Error('Loại dữ liệu không hợp lệ');
    const coll=collection(db,'trips',code,kind);
    if(op==='create')return addDoc(coll,{...data,createdBy:uid,updatedBy:uid,updatedByName:name,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
    if(op==='update')return updateDoc(doc(db,'trips',code,kind,id),{...data,updatedBy:uid,updatedByName:name,updatedAt:serverTimestamp()});
    if(op==='delete')return deleteDoc(doc(db,'trips',code,kind,id));
    throw Error('Thao tác không hợp lệ');
  }
  async function rename(code,name){return updateDoc(memberRef(code),{name})}
  function listenNotifications(code,onChange,onError){
    if(notificationStop){notificationStop();notificationStop=null}
    const found=query(collection(db,'trips',code,'notifications'),where('targetUid','==',uid));
    notificationStop=onSnapshot(found,snap=>{
      const items=snap.docs.map(x=>({id:x.id,...x.data()}));
      items.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
      onChange(items.slice(0,70));
    },onError);
    return ()=>{if(notificationStop){notificationStop();notificationStop=null}};
  }
  async function notifyOthers(code,members,name,type,title,body){
    const recipients=members.filter(m=>m.id!==uid).slice(0,199);
    if(!recipients.length)return;
    const batch=writeBatch(db);
    for(const member of recipients){
      const ref=doc(collection(db,'trips',code,'notifications'));
      batch.set(ref,{targetUid:member.id,actorUid:uid,actorName:String(name).slice(0,32),
        title:String(title).slice(0,90),body:String(body).slice(0,240),type,read:false,createdAt:serverTimestamp()});
    }
    await batch.commit();
  }
  async function sendPersonal(code,targetUid,name,body){
    return addDoc(collection(db,'trips',code,'notifications'),{
      targetUid,actorUid:uid,actorName:String(name).slice(0,32),
      title:'Lời nhắc riêng',body:String(body).slice(0,240),type:'personal',read:false,createdAt:serverTimestamp()
    });
  }
  function markNotice(code,id){
    return updateDoc(doc(db,'trips',code,'notifications',id),{read:true});
  }
  async function registerPushToken(code,vapidKey){
    if(!('serviceWorker' in navigator)||!('Notification' in window))throw Error('Thiết bị chưa hỗ trợ Web Push');
    if(!vapidKey)throw Error('Chưa cấu hình VAPID public key');
    const {getMessaging,getToken,isSupported,onMessage}=await import('https://www.gstatic.com/firebasejs/13.2.0/firebase-messaging.js');
    if(!(await isSupported()))throw Error('Trình duyệt này chưa hỗ trợ Firebase Messaging');
    const registration=await navigator.serviceWorker.register('./sw.js',{scope:'./'});
    await navigator.serviceWorker.ready;
    const messaging=getMessaging(fireApp);
    const token=await getToken(messaging,{vapidKey,serviceWorkerRegistration:registration});
    if(!token)throw Error('Không lấy được mã nhận thông báo');
    const ref=doc(db,'trips',code,'pushTokens',uid);
    const old=await getDoc(ref);
    if(old.exists())await updateDoc(ref,{token,updatedAt:serverTimestamp()});
    else await setDoc(ref,{uid,token,updatedAt:serverTimestamp(),createdAt:serverTimestamp()});
    return {token,onForeground:(fn)=>onMessage(messaging,fn)};
  }
  async function clearPushToken(code){
    return deleteDoc(doc(db,'trips',code,'pushTokens',uid));
  }
  return {uid,createTrip,joinTrip,subscribe:subscribeSafe,unsubscribe,mutate,rename,
    listenNotifications,notifyOthers,sendPersonal,markNotice,registerPushToken,clearPushToken};
}
