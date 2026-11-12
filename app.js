(()=>{
'use strict';
const STORE='tripmate-v3-local', PROFILE='tripmate-v3-profile', KNOWN='tripmate-v3-known', ACTIVE='tripmate-v3-active';
const FIREBASE=window.TRIPMATE_FIREBASE_CONFIG;
const liveMode=!!(FIREBASE && FIREBASE.apiKey && FIREBASE.projectId && location.protocol!=='file:' && !['localhost','127.0.0.1'].includes(location.hostname));
const q=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>new Intl.NumberFormat('vi-VN').format(Math.round(Number(n)||0))+'đ';
const now=()=>new Date().toISOString();
const fmt=s=>s?new Date(String(s)+'T12:00:00').toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'}):'—';
const dow=s=>new Date(String(s)+'T12:00:00').toLocaleDateString('vi-VN',{weekday:'short'});
const symbol={plane:'<path d="M21.5 3.5 14 21l-3.5-7.5L3 10z"/><path d="m10.5 13.5 11-10"/>',home:'<path d="m3 10 9-7 9 7v11h-6v-7H9v7H3z"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',wallet:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 9h18m-4 6h2"/>',bag:'<rect x="3" y="7" width="18" height="14" rx="3"/><path d="M8 7V5a4 4 0 0 1 8 0v2"/>',user:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',users:'<path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 20v-2a4 4 0 0 0-3-3.87M16 3a4 4 0 0 1 0 8"/>',plus:'<path d="M12 5v14M5 12h14"/>',arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',chevron:'<path d="m9 6 6 6-6 6"/>',check:'<path d="m5 12 5 5L20 7"/>',pin:'<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',link:'<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7L12 6M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7L12 18"/>',edit:'<path d="m15 5 4 4M4 20l4-.8L20 7a2.8 2.8 0 0 0-4-4L3.8 15.2z"/>',copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.6 6.6-4.1m-6.6 7 6.6 4.1"/>',trash:'<path d="M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6M10 10v7m4-7v7"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M10 2h4l1 3 3 1 3 3-2 3 1 3-2 3-3 1-1 3h-4l-1-3-3-1-3-3 2-3-1-3 3-3 3-1z"/>',bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',receipt:'<path d="M5 3v18l3-2 4 2 4-2 3 2V3zM9 9h6m-6 4h6"/>',download:'<path d="M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4"/>',refresh:'<path d="M20 7V3l-3 3a8 8 0 1 0 2 9"/>'};
const ico=(id,size=21)=>`<svg width="${size}" height="${size}" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none" aria-hidden="true">${symbol[id]||symbol.check}</svg>`;
const randCode=()=>{const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',a=new Uint8Array(12);crypto.getRandomValues(a);return Array.from(a,x=>c[x%32]).join('')};
const uid=()=>crypto.randomUUID?crypto.randomUUID():randCode();
const localGet=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback}catch{return fallback}};
const localSet=(key,v)=>{try{localStorage.setItem(key,JSON.stringify(v))}catch{}};
const newEmpty=meta=>({...meta,activities:[],expenses:[],settlements:[],checklist:[],links:[],members:[]});
const sample=()=>({code:'DEMO-TRIP',name:'Hành trình Phan Thiết',destination:'Phan Thiết',start:'2026-11-19',end:'2026-11-22',budget:8000000,updatedAt:now(),members:[],activities:[{id:'a1',title:'Tập trung lên xe',date:'2026-11-19',time:'08:00',place:'Điểm hẹn nhóm',note:'Đến sớm 15 phút',updatedAt:now(),updatedByName:'Minh'},{id:'a2',title:'Check-in homestay',date:'2026-11-19',time:'14:00',place:'Mũi Né',note:'',updatedAt:now(),updatedByName:'Minh'},{id:'a3',title:'Khám phá đồi cát',date:'2026-11-20',time:'08:00',place:'Phan Thiết',note:'',updatedAt:now(),updatedByName:'Minh'}],expenses:[],settlements:[],checklist:[{id:'c1',title:'Áo khoác',done:false,updatedAt:now(),updatedByName:'Minh'},{id:'c2',title:'Sạc dự phòng',done:true,updatedAt:now(),updatedByName:'Minh'}],links:[]});
const app={profile:localGet(PROFILE,''),screen:'welcome',tab:'home',selectedDay:0,trip:null,live:liveMode,remote:null,backend:null,known:localGet(KNOWN,[]),active:localGet(ACTIVE,''),busy:false,status:liveMode?'Đang kết nối':'Bản dùng thử',pendingJoin:new URLSearchParams(location.search).get('join')||'',localId:localGet('tripmate-v3-local-id',''),notifications:[],notificationUnsub:null,pushActive:false};
if(!app.localId){app.localId=uid();localSet('tripmate-v3-local-id',app.localId)}
if(app.profile){app.screen='lobby';if(!liveMode){const saved=localGet(STORE,{});app.trip=saved[app.active]||Object.values(saved)[0]||null;if(app.trip)app.screen='app'}}
let msgTimer;
const toast=s=>{document.querySelector('#toast').innerHTML=`<div>${q(s)}</div>`;clearTimeout(msgTimer);msgTimer=setTimeout(()=>document.querySelector('#toast').innerHTML='',3100)};
const memberName=(id)=>app.trip?.members?.find(m=>m.id===id)?.name||'Thành viên';
const me=()=>app.live?app.remote?.uid:app.localId;
const days=t=>{let start=new Date(t.start+'T12:00:00'),end=new Date(t.end+'T12:00:00'),r=[];if(Number.isNaN(+start))return [];while(start<=end&&r.length<31){r.push(`${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}-${String(start.getDate()).padStart(2,'0')}`);start.setDate(start.getDate()+1)}return r};
const spent=t=>t.expenses.reduce((s,x)=>s+(Number(x.amount)||0),0);
function balances(t){const b=Object.fromEntries(t.members.map(x=>[x.id,0]));for(const e of t.expenses){if(!(e.payerId in b)||!e.participantIds.length)continue;b[e.payerId]+=e.amount;let each=Math.floor(e.amount/e.participantIds.length),rem=e.amount%e.participantIds.length;e.participantIds.forEach((id,i)=>{if(id in b)b[id]-=each+(i<rem?1:0)})}for(const s of t.settlements){if(s.from in b)b[s.from]+=s.amount;if(s.to in b)b[s.to]-=s.amount}return b}
function debts(t){const b=balances(t),cred=Object.entries(b).filter(([,a])=>a>0).sort((x,y)=>y[1]-x[1]),debt=Object.entries(b).filter(([,a])=>a<0).sort((x,y)=>x[1]-y[1]),ret=[];let i=0,j=0;while(i<debt.length&&j<cred.length){const n=Math.min(-debt[i][1],cred[j][1]);if(n>0)ret.push({from:debt[i][0],to:cred[j][0],amount:n});debt[i][1]+=n;cred[j][1]-=n;if(!debt[i][1])i++;if(!cred[j][1])j++}return ret}

// Photos are real Commons photographs for matching destinations only.
// Photos fail gracefully to a premium gradient while offline or if CDN unavailable.
const DESTINATION_PHOTOS = {"phanthiet":[{"url":"https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/M%C5%A9i_N%C3%A9_th7n2023%2C_Khu_ND_(bi%E1%BB%83n_Phan_Thi%E1%BA%BFt_M%C5%A9i_N%C3%A9%2C_b%C3%A3i_bi%E1%BB%83n_b%E1%BA%A7u_tr%E1%BB%9Di_xanh)_(19).jpg/960px-M%C5%A9i_N%C3%A9_th7n2023%2C_Khu_ND_(bi%E1%BB%83n_Phan_Thi%E1%BA%BFt_M%C5%A9i_N%C3%A9%2C_b%C3%A3i_bi%E1%BB%83n_b%E1%BA%A7u_tr%E1%BB%9Di_xanh)_(19).jpg","label":"Bãi biển","source":"https://commons.wikimedia.org/wiki/File:M%C5%A9i_N%C3%A9_th7n2023%2C_Khu_ND_%28bi%E1%BB%83n_Phan_Thi%E1%BA%BFt_M%C5%A9i_N%C3%A9%2C_b%C3%A3i_bi%E1%BB%83n_b%E1%BA%A7u_tr%E1%BB%9Di_xanh%29_%2819%29.jpg","by":"Phương Huy"},{"url":"https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Vietnam%2C_Mui_Ne_sand_dunes.jpg/960px-Vietnam%2C_Mui_Ne_sand_dunes.jpg","label":"Đồi cát","source":"https://commons.wikimedia.org/wiki/File:Vietnam%2C_Mui_Ne_sand_dunes.jpg","by":"Vyacheslav Argenberg"},{"url":"https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Fresh_live_sea-food_sold_in_Mui_Ne.JPG/960px-Fresh_live_sea-food_sold_in_Mui_Ne.JPG","label":"Hải sản","source":"https://commons.wikimedia.org/wiki/File:Fresh_live_sea-food_sold_in_Mui_Ne.JPG","by":"Rudolph.A.Furtado"}],"dalat":[{"url":"https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Da_Lat_-_Xuan_Huong_Lake.jpg/960px-Da_Lat_-_Xuan_Huong_Lake.jpg","label":"Hồ Xuân Hương","source":"https://commons.wikimedia.org/wiki/File:Da_Lat_-_Xuan_Huong_Lake.jpg","by":"P. Hughes"},{"url":"https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Red_flowers_Da_Lat.jpg/960px-Red_flowers_Da_Lat.jpg","label":"Sắc hoa","source":"https://commons.wikimedia.org/wiki/File:Red_flowers_Da_Lat.jpg","by":"Dinkum"},{"url":"https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Blue_flowers_Da_Lat.jpg/960px-Blue_flowers_Da_Lat.jpg","label":"Mùa hoa","source":"https://commons.wikimedia.org/wiki/File:Blue_flowers_Da_Lat.jpg","by":"Dinkum"}],"vungtau":[{"url":"https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/%E1%BA%A2nh_%C4%91%E1%BA%B9p_V%C5%A9ng_T%C3%A0u_-_Bi%E1%BB%83n_b%C3%A3i_sau_-_G%E1%BA%A7n_H%C3%B2n_B%C3%A0.jpg/960px-%E1%BA%A2nh_%C4%91%E1%BA%B9p_V%C5%A9ng_T%C3%A0u_-_Bi%E1%BB%83n_b%C3%A3i_sau_-_G%E1%BA%A7n_H%C3%B2n_B%C3%A0.jpg","label":"Bãi Sau","source":"https://commons.wikimedia.org/wiki/File:%E1%BA%A2nh_%C4%91%E1%BA%B9p_V%C5%A9ng_T%C3%A0u_-_Bi%E1%BB%83n_b%C3%A3i_sau_-_G%E1%BA%A7n_H%C3%B2n_B%C3%A0.jpg","by":"Willyvu"}],"nhatrang":[{"url":"https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Beach_at_Nha_Trang%2C_Vietnam.jpg/960px-Beach_at_Nha_Trang%2C_Vietnam.jpg","label":"Bờ biển","source":"https://commons.wikimedia.org/wiki/File:Beach_at_Nha_Trang%2C_Vietnam.jpg","by":"Bruce Tuten"}],"phuquoc":[{"url":"https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Phu_Quoc_Beach.jpg/960px-Phu_Quoc_Beach.jpg","label":"Bãi biển","source":"https://commons.wikimedia.org/wiki/File:Phu_Quoc_Beach.jpg","by":"FrogsLegs71"}],"hoian":[{"url":"https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Du-lich-hoi-an.jpg/960px-Du-lich-hoi-an.jpg","label":"Phố cổ","source":"https://commons.wikimedia.org/wiki/File:Du-lich-hoi-an.jpg","by":"Wikimedia Commons"}],"hue":[{"url":"https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Hue_-_Imperial_City.jpg/960px-Hue_-_Imperial_City.jpg","label":"Đại Nội","source":"https://commons.wikimedia.org/wiki/File:Hue_-_Imperial_City.jpg","by":"P. Hughes"}],"sapa":[{"url":"https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Sa_Pa_Rice_Terrace_I.jpg/960px-Sa_Pa_Rice_Terrace_I.jpg","label":"Ruộng bậc thang","source":"https://commons.wikimedia.org/wiki/File:Sa_Pa_Rice_Terrace_I.jpg","by":"Ekrem Canli"}]};
const normalDestination=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/đ/g,'d').replace(/[^a-z0-9]/g,'');
function photosFor(destination){
 const key=normalDestination(destination);
 if(/phanthiet|muine|binhthuan/.test(key))return DESTINATION_PHOTOS.phanthiet;
 if(/dalat|lamdong/.test(key))return DESTINATION_PHOTOS.dalat;
 if(/vungtau|bariavungtau/.test(key))return DESTINATION_PHOTOS.vungtau;
 if(/nhatrang|khanhhoa/.test(key))return DESTINATION_PHOTOS.nhatrang;
 if(/phuquoc/.test(key))return DESTINATION_PHOTOS.phuquoc;
 if(/hoian/.test(key))return DESTINATION_PHOTOS.hoian;
 if(/hue|thuathien/.test(key))return DESTINATION_PHOTOS.hue;
 if(/sapa|laocai/.test(key))return DESTINATION_PHOTOS.sapa;
 return [];
}
const photoImg=(p,cls,loading='lazy')=>p?`<img class="${cls}" src="${q(p.url)}" alt="${q(p.label)}" loading="${loading}" decoding="async" onerror="if(!this.dataset.retry){this.dataset.retry='1';this.src=this.src.replace('upload.wikimedia.org','thumb.wikimedia.org')}else{this.hidden=true}">`:'';

const dateDisplay=t=>`${fmt(t.start)} – ${fmt(t.end)}`;
const section=(title,action,label)=>`<div class="section"><h2>${q(title)}</h2>${action?`<button class="textbtn" data-action="${action}">${ico(action==='share'?'share':'plus',15)} ${q(label||'Thêm')}</button>`:''}</div>`;
const empty=(icon,title,desc)=>`<div class="empty"><div class="emptyicon">${icon}</div><b>${title}</b><span>${desc}</span></div>`;
function header(){const status=app.live?(navigator.onLine?app.status:'Mất mạng'):'Demo trên máy';const color=app.live?(status==='Đã đồng bộ'?'live':'wait'):'';return `<header class="topbar"><button class="brand" data-action="switch-trip"><img src="./icon-192.png" alt=""><span>TripMate</span></button><div class="top-actions"><span class="status ${color}"><i></i>${q(status)}</span><button class="iconbtn notify-top" data-action="notifications" aria-label="Thông báo">${ico('bell',20)}${app.notifications.some(n=>!n.read)?'<span class="notif-badge" aria-label="Có thông báo chưa đọc"></span>':''}</button><button class="iconbtn" data-action="switch-trip" aria-label="Đổi chuyến đi">${ico('chevron',18)}</button></div></header>`}
function welcome(){return `<main class="welcome"><div class="welcome-top"><img src="./icon-512.png" class="welcome-logo" alt="Logo máy bay TripMate"><h1>TripMate</h1><p>Cùng nhau khám phá.</p><div class="welcome-art"><div class="plane">${ico('plane',120)}</div></div></div><div class="welcome-box"><h2>Xin chào! 👋</h2><p class="caption">Nhập tên của bạn để bắt đầu, không cần tài khoản.</p><form data-form="name"><div class="field"><label class="label" for="displayname">Tên hiển thị</label><input id="displayname" name="displayname" autocomplete="nickname" maxlength="32" placeholder="Ví dụ: Minh" required autofocus></div><button class="btn primary wide">Tiếp tục ${ico('arrow',18)}</button></form></div></main>`}
function lobby(){return `<div class="content" style="padding-top:calc(62px + env(safe-area-inset-top))"><div class="row between"><div><div class="eyebrow">CHÀO MỪNG BẠN</div><h1 class="title" style="margin-top:8px">Cùng đi đâu, ${q(app.profile)}?</h1><p class="subtitle">Một chuyến đi, cả nhóm cùng cập nhật.</p></div><img src="./icon-192.png" alt="Logo TripMate" style="width:58px;height:58px;border-radius:16px"></div><div class="vspace"></div><button class="lobby-card" data-action="new-trip"><span class="lobby-icon">${ico('plus',26)}</span><span class="grow"><strong>Tạo chuyến đi mới</strong><span>Đặt tên, chọn ngày và mời bạn bè</span></span>${ico('chevron',19)}</button><button class="lobby-card" data-action="join-trip"><span class="lobby-icon">${ico('users',26)}</span><span class="grow"><strong>Tham gia chuyến đi</strong><span>Nhập mã chuyến đi do bạn bè gửi</span></span>${ico('chevron',19)}</button>${!app.live?`<div class="notice warning"><b>Bản xem thử trên máy</b><br>Chưa nối Firebase. Tạo chuyến và chỉnh sửa để thử giao diện; mã nhóm chưa thể dùng để đồng bộ giữa các điện thoại.</div><button class="btn outline wide" data-action="sample">${ico('plane',18)} Xem chuyến đi mẫu</button>`:`<div class="notice">Dữ liệu được chia sẻ theo mã mời. Mỗi thành viên chỉ cần tên hiển thị, không cần đăng ký tài khoản.</div>`}${app.known.length?`${section('Chuyến đi đã tham gia')}<div class="card">${app.known.map(x=>`<button data-action="open-known" data-code="${q(x.code)}" class="lobby-card" style="box-shadow:none;margin-bottom:7px;padding:10px"><span class="lobby-icon">${ico('plane',18)}</span><span class="grow"><strong>${q(x.name)}</strong><span>${q(x.code)}</span></span>${ico('chevron',18)}</button>`).join('')}</div>`:''}<p class="footnote">TripMate • Không cần đăng nhập</p></div>`}
function home(t){
 const total=spent(t), pct=t.budget?Math.min(100,Math.round(total/t.budget*100)):0;
 const sorted=[...t.activities].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
 const recent=[...t.activities.map(x=>({...x,kind:'Lịch trình'})),...t.expenses.map(x=>({...x,kind:'Chi tiêu'})),...t.checklist.map(x=>({...x,kind:'Hành lý'}))].sort((a,b)=>timeVal(b.updatedAt)-timeVal(a.updatedAt)).slice(0,3);
 const photos=photosFor(t.destination),cover=photos[0];
 return `<div class="content view home-screen">
   <div class="trip-overview"><div class="trip-heading"><div><span class="overline">CHUYẾN ĐI CỦA NHÓM</span><h1 class="title">${q(t.name)}</h1></div><button class="iconbtn trip-edit" data-action="edit-trip" aria-label="Chỉnh sửa chuyến đi">${ico('edit',19)}</button></div></div>
   <section class="hero photo-hero" aria-label="Điểm đến ${q(t.destination)}">
     ${photoImg(cover,'cover-photo','eager')}<div class="hero-shade"></div>
     <div class="hero-top"><span class="hero-top-pill">${ico('pin',14)} Điểm đến</span>${cover?`<a class="hero-credit" href="${q(cover.source)}" title="Ảnh: ${q(cover.by)} · Wikimedia Commons" target="_blank" rel="noopener noreferrer">Ảnh ↗</a>`:''}</div>
     <div class="hero-content"><h2>${q(t.destination)}</h2><div class="hero-date">${ico('calendar',16)} ${dateDisplay(t)}</div><div class="hero-stats"><span>${ico('users',15)} ${t.members.length} người</span><span>${ico('calendar',15)} ${days(t).length} ngày</span><span>${ico('pin',15)} ${t.activities.length} điểm</span></div></div>
   </section>
   <div class="invite-card"><div class="grow"><span>Mã chuyến đi</span><b>${q(t.code)}</b></div><button class="btn primary invite-btn" data-action="share">${ico('share',17)} Mời bạn</button></div>
   ${section('Chi tiêu nhóm')}
   <div class="statgrid home-stats"><div class="stat"><span>Đã chi</span><b>${money(total)}</b></div><div class="stat"><span>Còn lại</span><b>${money(t.budget-total)}</b></div></div>
   <div class="budget-card"><div class="row between"><strong>Ngân sách</strong><b>${pct}%</b></div><div class="budgetbar"><span style="width:${pct}%"></span></div><small>${money(total)} / ${money(t.budget)}</small></div>
   ${section('Sắp tới','add-activity','Thêm')}
   <div class="upcoming-list">${sorted.length?sorted.slice(0,3).map(x=>`<div class="upcoming-card"><div class="upcoming-time"><strong>${q(x.time)}</strong><small>${fmt(x.date)}</small></div><span class="upcoming-icon">${ico('calendar',19)}</span><div class="grow"><strong>${q(x.title)}</strong><small>${q(x.place||'Chưa có địa điểm')}</small></div><button class="iconbtn" data-action="edit-activity" data-id="${q(x.id)}" aria-label="Sửa ${q(x.title)}">${ico('chevron',18)}</button></div>`).join(''):`<div class="card">${empty('🗓️','Chưa có lịch trình','Thêm hoạt động đầu tiên')}</div>`}</div>
   ${section('Cập nhật mới')}
   <div class="updates-card">${recent.length?recent.map(x=>`<div class="update-line"><span class="update-dot"></span><div class="grow"><strong>${q(x.title)}</strong><small>${q(x.updatedByName||'Thành viên')} · ${q(x.kind)}</small></div></div>`).join(''):empty('✨','Chưa có cập nhật','Mọi thay đổi sẽ hiện tại đây')}</div>
   </div>`;
}
const timeVal=x=>x&&typeof x.toMillis==='function'?x.toMillis():x?.seconds?x.seconds*1000:Number(new Date(x||0))||0;
function itinerary(t){
 const d=days(t);app.selectedDay=Math.min(app.selectedDay,Math.max(0,d.length-1));
 const selected=d[app.selectedDay]||t.start;
 const acts=[...t.activities].filter(x=>x.date===selected).sort((a,b)=>a.time.localeCompare(b.time));
 return `<div class="content view itinerary-screen"><div class="row between screen-heading"><div><h1 class="title">Lịch trình</h1><p class="subtitle">Kế hoạch từng ngày</p></div><button class="btn primary add-big" data-action="add-activity">${ico('plus',18)} Thêm</button></div>
  <div class="daybar">${d.map((x,i)=>`<button class="daypill ${i===app.selectedDay?'active':''}" data-action="day" data-index="${i}"><span>Ngày ${i+1}</span><b>${fmt(x).slice(0,2)}</b><span>Th${fmt(x).slice(3)}</span></button>`).join('')}</div>
  ${section(`Ngày ${app.selectedDay+1} · ${fmt(selected)}`)}
  <div class="modern-timeline">${acts.length?acts.map(a=>`<article class="activity-card"><div class="activity-hour">${q(a.time)}</div><div class="activity-marker"><span>${ico('pin',19)}</span></div><div class="activity-body"><h3>${q(a.title)}</h3>${a.place?`<p>${ico('pin',15)} ${q(a.place)}</p>`:''}${a.note?`<p class="activity-note">${q(a.note)}</p>`:''}<div class="actions"><button data-action="edit-activity" data-id="${q(a.id)}">${ico('edit',14)} Sửa</button>${a.place?`<button data-action="map" data-place="${q(a.place)}">${ico('pin',14)} Bản đồ</button>`:''}<button data-action="delete" data-kind="activities" data-id="${q(a.id)}">${ico('trash',14)} Xóa</button></div></div></article>`).join(''):`<div class="card">${empty('🗓️','Ngày này còn trống','Thêm điểm dừng đầu tiên')}</div>`}</div>
 </div>`;
}
let openExpenseId='';
function expenseCard(e,t){
 const personIds=Array.isArray(e.participantIds)?e.participantIds:[];
 const members=personIds.map(id=>t.members.find(m=>m.id===id)).filter(Boolean);
 const payer=t.members.find(m=>m.id===e.payerId);
 const participants=members.map(m=>`<span class="person-pill ${m.id===e.payerId?'paid':''}">${m.id===e.payerId?ico('check',13):''}${q(m.name)}</span>`).join('');
 const payerOutside=payer&&!personIds.includes(e.payerId)?`<span class="person-pill paid">${ico('check',13)}${q(payer.name)} trả</span>`:'';
 const open=e.id===openExpenseId;
 return `<div class="expense-swipe ${open?'is-open':''}" data-expense-row="${q(e.id)}">
   <div class="expense-reveal-actions"><button type="button" tabindex="${open?0:-1}" class="swipe-control swipe-edit" data-action="edit-expense" data-id="${q(e.id)}" aria-label="Sửa khoản ${q(e.title)}">${ico('edit',20)}<span>Sửa</span></button><button type="button" tabindex="${open?0:-1}" class="swipe-control swipe-delete" data-action="delete" data-kind="expenses" data-id="${q(e.id)}" aria-label="Xóa khoản ${q(e.title)}">${ico('trash',20)}<span>Xóa</span></button></div>
   <div class="expense-front" data-swipe-front="${q(e.id)}">
    <div class="expense-card-layout"><div class="expense-symbol">${ico('receipt',23)}</div><div class="expense-detail-col">
     <div class="expense-head"><h3 title="${q(e.title)}">${q(e.title)}</h3><strong class="expense-amount">${money(e.amount)}</strong></div>
     <div class="expense-people-label">Chia cho</div><div class="expense-people">${participants||'<span class="caption">Không có thành viên</span>'}${payerOutside}</div>
     <div class="expense-foot"><button type="button" class="btn detail-pill" data-action="expense-details" data-id="${q(e.id)}">Chi tiết ${ico('chevron',16)}</button><span class="expense-swipe-hint">${ico('chevron',13)} Vuốt trái</span></div>
    </div></div>
   </div></div>`;
}
function expenses(t){const b=balances(t),ds=debts(t),total=spent(t);return `<div class="content view expenses-screen"><div class="row between screen-heading"><div><h1 class="title">Chi tiêu</h1><p class="subtitle">Theo dõi và chia tiền</p></div><button class="btn primary add-big" data-action="add-expense">${ico('plus',19)} Thêm</button></div>
  <div class="statgrid expenses-stats"><div class="stat"><span>Tổng đã chi</span><b>${money(total)}</b></div><div class="stat"><span>Bình quân / người</span><b>${money(t.members.length?total/t.members.length:0)}</b></div></div>
  ${section('Các khoản chi')}<div class="expense-legend">${ico('check',14)} <span>Tên màu xanh là người đã thanh toán</span></div>
  <div class="expense-list">${t.expenses.length?[...t.expenses].reverse().map(e=>expenseCard(e,t)).join(''):`<div class="card">${empty('🧾','Chưa có khoản chi','Nhấn Thêm để ghi chi tiêu cho nhóm')}</div>`}</div>
  ${section('Ai cần chuyển tiền cho ai?')}<div class="card settlement-card">${ds.length?ds.map(d=>`<div class="debt"><div><b>${q(memberName(d.from))} ${ico('arrow',15)} ${q(memberName(d.to))}</b><div class="debt-value">${money(d.amount)}</div></div><button class="btn smallbtn outline" data-action="settle" data-from="${q(d.from)}" data-to="${q(d.to)}" data-amount="${d.amount}">${ico('check',15)} Đã trả</button></div>`).join(''):`<div class="settlement-empty"><div class="settle-success">${ico('check',24)}</div><strong>Đã cân bằng</strong><span>Hiện không có khoản cần tất toán</span></div>`}<button class="btn detail-pill settle-more" data-action="balance-details">Xem chi tiết ${ico('chevron',16)}</button></div>
  ${section('Số dư từng thành viên')}<div class="balance-list">${t.members.map(m=>`<div class="balance-card"><div class="avatar">${q(m.name.substring(0,2).toUpperCase())}</div><div class="grow"><strong>${q(m.name)}</strong><small>${m.id===me()?'Bạn · ':''}${(b[m.id]||0)>0?'Được nhận lại':(b[m.id]||0)<0?'Cần trả':'Đã cân bằng'}</small></div><b class="balance-amount ${(b[m.id]||0)<0?'negative':''}">${money(Math.abs(b[m.id]||0))}</b></div>`).join('')}</div>
  <div class="expense-footer-note">TripMate ghi nhận công nợ, không thực hiện chuyển tiền.</div></div>`;}
function expenseDetails(id){
 const e=app.trip?.expenses.find(x=>x.id===id);if(!e)return toast('Khoản chi không còn tồn tại');
 const ids=e.participantIds||[],portion=Math.floor(e.amount/ids.length),remainder=e.amount%ids.length;
 const who=ids.map((id,i)=>`<div class="detail-member"><div class="detail-member-name"><div class="avatar mini-avatar">${q(memberName(id).substring(0,2).toUpperCase())}</div><b>${q(memberName(id))}</b>${e.payerId===id?'<span class="person-pill paid">Đã trả</span>':''}</div><b>${money(portion+(i<remainder?1:0))}</b></div>`).join('');
 const payer=app.trip.members.find(m=>m.id===e.payerId);
 sheet('Chi tiết khoản chi',`<div class="expense-detail-sheet"><div class="detail-total-label">${q(e.title)}</div><div class="detail-total">${money(e.amount)}</div><div class="detail-paid-by">${ico('check',16)} ${q(payer?.name||'Thành viên')} đã thanh toán</div><h3>Chi phí từng người</h3><div class="detail-member-list">${who}</div><div class="notice">Khoản chi chia đều cho ${ids.length} thành viên. Các khoản lẻ được phân bổ theo thứ tự thành viên.</div><button class="btn primary wide" data-action="edit-expense" data-id="${q(e.id)}">${ico('edit',18)} Sửa khoản chi</button></div>`);
}
function balanceDetails(){
 const t=app.trip,b=balances(t),ds=debts(t);
 sheet('Chi tiết công nợ',`<div class="expense-detail-sheet"><div class="detail-total-label">Tổng đã chi trong chuyến</div><div class="detail-total">${money(spent(t))}</div><h3>Số dư thành viên</h3><div class="detail-member-list">${t.members.map(m=>`<div class="detail-member"><div class="detail-member-name"><div class="avatar mini-avatar">${q(m.name.substring(0,2).toUpperCase())}</div><b>${q(m.name)}</b></div><b class="${b[m.id]>=0?'positive-value':'negative-value'}">${b[m.id]<0?'−':'+'}${money(Math.abs(b[m.id]))}</b></div>`).join('')}</div><h3>Các khoản cần chuyển</h3>${ds.length?ds.map(d=>`<div class="debt"><b>${q(memberName(d.from))} → ${q(memberName(d.to))}</b><strong>${money(d.amount)}</strong></div>`).join(''):`<div class="notice">Tất cả thành viên đã cân bằng.</div>`}<button class="btn outline wide" data-action="close">Đóng</button></div>`);
}
function notificationItems(){
  const list=app.notifications;
  return `<div class="notification-heading"><div><strong>Thông báo của bạn</strong><small>${list.filter(n=>!n.read).length} chưa đọc</small></div><button class="btn outline smallbtn" data-action="read-all-notifications">Đánh dấu đã đọc</button></div>
    <div class="notif-list">${list.length?list.map(n=>{
      let date='';try{const d=n.createdAt?.toDate?n.createdAt.toDate():new Date((n.createdAt?.seconds||0)*1000);date=(n.createdAt?.seconds||n.createdAt?.toDate)?d.toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'Vừa xong'}catch{}
      const label=n.type==='personal'?'Cá nhân':n.type==='expense'?'Chi tiêu':n.type==='activity'?'Lịch trình':'Nhóm';
      return `<button class="notif-entry ${n.read?'':'unread'}" data-action="read-notification" data-id="${q(n.id)}"><span class="notif-entry-icon">${ico(n.type==='expense'?'wallet':n.type==='activity'?'calendar':'bell',19)}</span><span class="notif-entry-body"><strong>${q(n.title)}</strong><span>${q(n.body)}</span><small>${q(label)} · ${q(date)}${n.actorName?' · '+q(n.actorName):''}</small></span>${n.read?'':'<i class="notif-dot"></i>'}</button>`
    }).join(''):'<div class="notif-empty">🔔<strong>Chưa có thông báo</strong><span>Các cập nhật của nhóm sẽ xuất hiện tại đây.</span></div>'}</div>
    <div class="notification-permission"><strong>Thông báo ngoài màn hình</strong><p>${!app.live?'Cần kết nối Firebase để bật push.':!window.TRIPMATE_VAPID_PUBLIC_KEY?'Cần thêm VAPID public key của Firebase để bật push.':typeof Notification==='undefined'?'Thiết bị chưa hỗ trợ thông báo.':Notification.permission==='denied'?'Bạn đã chặn quyền thông báo. Hãy bật lại trong Cài đặt của iPhone.':Notification.permission==='granted'?'Đã cấp quyền thông báo cho ứng dụng.':'Bật để nhận nhắc nhở khi TripMate đang đóng.'}</p><button class="btn primary wide" data-action="enable-push" ${!app.live||!window.TRIPMATE_VAPID_PUBLIC_KEY?'disabled':''}>${ico('bell',17)} ${typeof Notification!=='undefined'&&Notification.permission==='granted'?'Kết nối lại Push':'Bật Push Notification'}</button></div>`;
}
function openInbox(){sheet('Thông báo',`<div id="notification-feed">${notificationItems()}</div>`)}
function updateInbox(){const feed=document.querySelector('#notification-feed');if(feed)feed.innerHTML=notificationItems();const badge=document.querySelector('.notify-top .notif-badge');const unread=app.notifications.some(n=>!n.read);if(badge&&!unread)badge.remove();else if(!badge&&unread)document.querySelector('.notify-top')?.insertAdjacentHTML('beforeend','<span class="notif-badge"></span>');
 const quick=document.querySelector('.notif-quick[data-action="notifications"]');if(quick){const count=app.notifications.filter(n=>!n.read).length;const old=quick.querySelector('b');if(old)old.remove();if(count)quick.insertAdjacentHTML('beforeend',`<b>${count}</b>`)}
}
async function enablePush(){
  if(!app.live||!app.trip||!app.remote)return toast('Cần kết nối Firebase trước');
  if(!window.TRIPMATE_VAPID_PUBLIC_KEY)return toast('Thiếu VAPID public key');
  if(!('Notification' in window))return toast('Thiết bị chưa hỗ trợ push');
  // Must request permission directly inside the user click handler (required by iOS).
  const permission=await Notification.requestPermission();
  if(permission!=='granted'){toast('Bạn chưa cho phép nhận thông báo');updateInbox();return}
  try{
    await app.remote.registerPushToken(app.trip.code,window.TRIPMATE_VAPID_PUBLIC_KEY);
    app.pushActive=true;toast('Đã đăng ký nhận Push Notification');updateInbox();
  }catch(err){console.error('Push subscribe error',err);toast('Không bật được Push: '+(err.message||'Vui lòng thử lại'))}
}
function utilities(t){const done=t.checklist.filter(x=>x.done).length;return `<div class="content view"><div class="row between"><div><h1 class="title">Tiện ích</h1><p class="subtitle">Gọn gàng cho cả nhóm</p></div><button class="iconbtn" data-action="settings" aria-label="Cài đặt và dữ liệu">${ico('settings',19)}</button></div><div class="notif-quick-actions"><button class="notif-quick" data-action="notifications">${ico('bell',19)} Thông báo ${app.notifications.filter(n=>!n.read).length?`<b>${app.notifications.filter(n=>!n.read).length}</b>`:''}</button><button class="notif-quick" data-action="send-notification">${ico('share',19)} Nhắc riêng</button></div>${section(`Thành viên (${t.members.length})`,'share','Mời bạn')}<div class="card">${t.members.map((m,i)=>`<div class="item"><span class="avatar" style="background:${['#5e9bea','#31b99e','#e4aa63','#a08ce3'][i%4]}">${q(m.name.substring(0,2).toUpperCase())}</span><div class="grow"><strong>${q(m.name)}</strong><small>${m.id===me()?'Bạn':m.role==='owner'?'Người tạo chuyến đi':'Thành viên'}</small></div></div>`).join('')}</div>${section(`Checklist hành lý (${done}/${t.checklist.length})`,'add-checklist','Thêm')}<div class="card">${t.checklist.length?t.checklist.map(x=>`<div class="checkrow"><input type="checkbox" data-action="toggle-checklist" data-id="${q(x.id)}" ${x.done?'checked':''} aria-label="Đã chuẩn bị ${q(x.title)}"><div class="grow"><strong class="${x.done?'done':''}">${q(x.title)}</strong></div><button class="iconbtn" data-action="delete" data-kind="checklist" data-id="${q(x.id)}" aria-label="Xóa">${ico('trash',16)}</button></div>`).join(''):empty('🎒','Checklist còn trống','Liệt kê đồ cần mang chung')}</div>${section('Vé, khách sạn & liên kết','add-link','Thêm')}<div class="card">${t.links.length?t.links.map(x=>`<div class="item"><span class="itemicon">${ico('link',18)}</span><div class="grow"><strong>${q(x.title)}</strong>${x.note?`<small>${q(x.note)}</small>`:''}<a class="link" href="${q(x.url)}" target="_blank" rel="noopener noreferrer">${ico('chevron',14)} Mở liên kết</a></div><button class="iconbtn" data-action="delete" data-kind="links" data-id="${q(x.id)}" aria-label="Xóa">${ico('trash',16)}</button></div>`).join(''):empty('📁','Chưa có thông tin','Lưu link vé, homestay và ghi chú')}</div><div class="footnote">${app.live?'Firebase Firestore • Dữ liệu chuyến đi dùng chung':'Demo cục bộ • Chưa đồng bộ nhiều điện thoại'}</div></div>`}
function render(){const root=document.querySelector('#app');if(app.screen==='welcome'){root.innerHTML=welcome();return}if(app.screen==='lobby'){root.innerHTML=`<div class="view">${lobby()}</div>`;return}if(app.screen==='app'&&app.trip){const t=app.trip;const views={home,itinerary,expenses,utilities};root.innerHTML=header()+(views[app.tab]||home)(t)+`<nav class="bottom-nav" aria-label="Điều hướng">${[['home','home','Trang chủ'],['itinerary','calendar','Lịch trình'],['expenses','wallet','Chi tiêu'],['utilities','bag','Tiện ích']].map(([id,ic,label])=>`<button class="navbtn ${app.tab===id?'active':''}" data-tab="${id}" aria-current="${app.tab===id?'page':'false'}"><span class="nicon">${ico(ic,22)}</span>${label}</button>`).join('')}</nav>`;return}root.innerHTML=`<div class="content">${empty('☁️','Đang tải chuyến đi','Dữ liệu sẽ hiển thị khi kết nối thành công.')}<button class="btn wide" data-action="back-lobby">Quay lại</button></div>`}
function sheet(title,content){document.querySelector('#overlay').innerHTML=`<div class="modal-backdrop"><div class="sheet" role="dialog" aria-modal="true" aria-label="${q(title)}"><div class="grab"></div><div class="sheethead"><h2>${q(title)}</h2><button data-action="close" aria-label="Đóng">×</button></div>${content}</div></div>`;const first=document.querySelector('.sheet input:not([type="checkbox"])');if(first)setTimeout(()=>first.focus({preventScroll:true}),250)}
function closeSheet(){document.querySelector('#overlay').innerHTML=''}
const field=(name,label,type='text',extra='')=>`<div class="field"><label class="label" for="f_${name}">${label}</label><input id="f_${name}" name="${name}" type="${type}" ${extra}></div>`;
const actionButton=label=>`<button class="btn primary wide" type="submit">${label} ${ico('check',18)}</button>`;
function openForm(action,id=''){const t=app.trip;let record;
switch(action){
case 'new-trip':sheet('Tạo chuyến đi',`<form data-form="new-trip">${field('name','Tên chuyến đi','text','maxlength="64" required placeholder="Hội bạn đi Đà Lạt"')}${field('destination','Điểm đến','text','maxlength="64" required placeholder="Đà Lạt"')}<div class="fieldgrid">${field('start','Ngày đi','date','required')}${field('end','Ngày về','date','required')}</div>${field('budget','Ngân sách dự kiến (đ)','number','min="0" step="1000" value="5000000"')}${actionButton('Tạo chuyến đi')}</form>`);break;
case 'join-trip':sheet('Tham gia chuyến đi',`<form data-form="join-trip">${field('code','Mã chuyến đi','text',`maxlength="12" minlength="12" autocapitalize="characters" required value="${q(app.pendingJoin)}" placeholder="VD: R8K2M7Q9T4PA"`)}<div class="notice">Tên hiển thị: <b>${q(app.profile)}</b>. Người tạo chuyến đi sẽ gửi cho bạn mã gồm 12 ký tự.</div>${actionButton('Vào chuyến đi')}</form>`);break;
case 'edit-trip':sheet('Chỉnh sửa chuyến đi',`<form data-form="edit-trip">${field('name','Tên chuyến đi','text',`value="${q(t.name)}" maxlength="64" required`)}${field('destination','Điểm đến','text',`value="${q(t.destination)}" maxlength="64" required`)}<div class="fieldgrid">${field('start','Ngày đi','date',`value="${q(t.start)}" required`)}${field('end','Ngày về','date',`value="${q(t.end)}" required`)}</div>${field('budget','Ngân sách dự kiến','number',`min="0" step="1000" value="${t.budget}"`)}${actionButton('Lưu thay đổi')}</form>`);break;
case 'add-activity':case 'edit-activity':record=t.activities.find(x=>x.id===id)||{};sheet(record.id?'Sửa hoạt động':'Thêm hoạt động',`<form data-form="activity" data-id="${q(id)}">${field('title','Hoạt động','text',`maxlength="90" required value="${q(record.title||'')}" placeholder="Ăn tối, đi tham quan..."`)}<div class="fieldgrid">${field('date','Ngày','date',`min="${t.start}" max="${t.end}" value="${q(record.date||days(t)[app.selectedDay]||t.start)}" required`)}${field('time','Giờ','time',`value="${q(record.time||'09:00')}" required`)}</div>${field('place','Địa điểm','text',`value="${q(record.place||'')}" maxlength="150" placeholder="Tên địa điểm"`)}<div class="field"><label class="label" for="f_note">Ghi chú</label><textarea id="f_note" name="note" maxlength="500">${q(record.note||'')}</textarea></div>${actionButton(record.id?'Lưu hoạt động':'Thêm hoạt động')}</form>`);break;
case 'add-expense':case 'edit-expense':record=t.expenses.find(x=>x.id===id)||{};sheet(record.id?'Sửa khoản chi':'Thêm khoản chi',`<form data-form="expense" data-id="${q(id)}">${field('title','Khoản chi','text',`maxlength="90" value="${q(record.title||'')}" placeholder="Ăn trưa, taxi..." required`)}${field('amount','Số tiền (VND)','number',`min="1" step="1" value="${record.amount||''}" required`)}<div class="field"><label class="label" for="f_payer">Ai đã trả?</label><select name="payer" id="f_payer">${t.members.map(m=>`<option value="${q(m.id)}" ${record.payerId===m.id?'selected':''}>${q(m.name)}</option>`).join('')}</select></div><div class="label" style="margin:8px 0">Chia khoản này cho</div><div class="checkoptions">${t.members.map(m=>`<label class="checkopt"><input type="checkbox" name="participant" value="${q(m.id)}" ${!record.id||record.participantIds.includes(m.id)?'checked':''}>${q(m.name)}</label>`).join('')}</div>${actionButton(record.id?'Lưu khoản chi':'Ghi khoản chi')}</form>`);break;
case 'add-checklist':sheet('Thêm vào checklist',`<form data-form="checklist">${field('title','Vật dụng cần chuẩn bị','text','maxlength="90" required placeholder="Ví dụ: Sạc dự phòng"')}${actionButton('Thêm vật dụng')}</form>`);break;
case 'add-link':sheet('Lưu thông tin chung',`<form data-form="link">${field('title','Tên liên kết','text','maxlength="90" required placeholder="Vé xe, homestay..."')}${field('url','Đường link','url','required placeholder="https://..."')}<div class="field"><label class="label" for="f_note">Ghi chú</label><textarea id="f_note" name="note" maxlength="400"></textarea></div>${actionButton('Lưu liên kết')}</form>`);break;
case 'send-notification':sheet('Nhắc riêng thành viên',`<form data-form="personal-notification"><div class="field"><label class="label" for="f_target">Gửi đến ai?</label><select id="f_target" name="target">${t.members.filter(m=>m.id!==me()).map(m=>`<option value="${q(m.id)}">${q(m.name)}</option>`).join('')}</select></div><div class="field"><label class="label" for="f_message">Lời nhắn</label><textarea id="f_message" name="message" maxlength="240" required placeholder="Ví dụ: Nhớ mang theo giấy tờ nhé!"></textarea></div>${actionButton('Gửi lời nhắc')}</form>`);break;
case 'settings':sheet('Thông tin & dữ liệu',`<div class="notice">${app.live?'Đang dùng Firebase: dữ liệu nhóm đồng bộ giữa các điện thoại khi có Internet.':'Bản xem thử: dữ liệu chỉ lưu trên trình duyệt này, chưa thể đồng bộ với người khác.'}</div><div class="stack"><button class="btn outline wide" data-action="export">${ico('download',18)} Xuất dữ liệu chuyến đi (.json)</button><button class="btn outline wide" data-action="switch-trip">${ico('plane',18)} Đổi chuyến đi</button><button class="btn outline wide" data-action="rename">${ico('user',18)} Đổi tên hiển thị</button></div><div class="notice warning">Không có tài khoản đăng nhập: nếu xóa dữ liệu trình duyệt hoặc đổi điện thoại, bạn có thể phải nhập lại mã nhóm và tên. Không chia sẻ mã nhóm công khai.</div>`);break;
case 'rename':sheet('Đổi tên hiển thị',`<form data-form="rename">${field('displayname','Tên của bạn','text',`value="${q(app.profile)}" maxlength="32" required`)}${actionButton('Lưu tên')}</form>`);break;
}}
function validateTrip(x){const start=x.start,end=x.end,begin=Date.parse(start),finish=Date.parse(end);return x.name&&x.destination&&start&&end&&end>=start&&Number.isFinite(begin)&&Number.isFinite(finish)&&(finish-begin)/86400000<=30&&Number.isSafeInteger(x.budget)&&x.budget>=0}
function addKnown(trip){const k={code:trip.code,name:trip.name};app.known=[k,...app.known.filter(x=>x.code!==k.code)].slice(0,40);localSet(KNOWN,app.known)}
function persistDemo(){const all=localGet(STORE,{});all[app.trip.code]=app.trip;localSet(STORE,all);app.active=app.trip.code;localSet(ACTIVE,app.active);addKnown(app.trip)}
async function connectBackend(){if(app.remote)return app.remote;try{app.busy=true;const m=await import('./firebase-sync.js');const backend=await m.createLiveAdapter(FIREBASE);app.remote=backend;app.backend=backend;app.status='Đang đồng bộ';return backend}catch(err){toast('Lỗi kết nối Firebase: '+(err.message||'Kiểm tra cấu hình'));throw err}finally{app.busy=false}}
function receiveTrip(t,status='Đã đồng bộ'){if(!t)return;if(openExpenseId&&!t.expenses.some(x=>x.id===openExpenseId))openExpenseId='';app.trip=t;app.active=t.code;app.status=status;app.screen='app';addKnown(t);localSet(ACTIVE,t.code);render()}
async function openLive(code,createPayload=null){const r=await connectBackend();if(createPayload){await r.createTrip(code,createPayload,app.profile)}else{await r.joinTrip(code,app.profile)}app.active=code;app.screen='app';app.trip=null;render();r.subscribe(code,(data,status)=>receiveTrip(data,status),err=>{app.status='Lỗi đồng bộ';toast('Không thể đồng bộ. Kiểm tra Firebase Rules.');console.error(err)});
  if(app.notificationUnsub)app.notificationUnsub();app.notifications=[];
  app.notificationUnsub=r.listenNotifications(code,items=>{app.notifications=items;updateInbox();},err=>{console.warn('Chưa truy cập được hộp thư thông báo; cần cập nhật Firestore Rules',err)});
  if(typeof Notification!=='undefined'&&Notification.permission==='granted'&&window.TRIPMATE_VAPID_PUBLIC_KEY){r.registerPushToken(code,window.TRIPMATE_VAPID_PUBLIC_KEY).then(()=>{app.pushActive=true}).catch(err=>console.warn('Không thể tự kết nối lại Push:',err))}
}
async function handleForm(form){const fd=new FormData(form),val=n=>String(fd.get(n)||'').trim();const name=val('displayname');const action=form.dataset.form;try{
if(action==='name'){if(name.length<1||name.length>32)return toast('Nhập tên tối đa 32 ký tự');app.profile=name;localSet(PROFILE,name);app.screen='lobby';render();if(app.pendingJoin)openForm('join-trip');return}
if(action==='rename'){if(name.length<1||name.length>32)return toast('Nhập tên hợp lệ');app.profile=name;localSet(PROFILE,name);closeSheet();if(app.live&&app.trip){await app.remote.rename(app.trip.code,name)}else if(app.trip){const m=app.trip.members.find(x=>x.id===me());if(m)m.name=name;persistDemo()}render();return}
if(action==='join-trip'){if(!app.live)return toast('Cần cấu hình Firebase để tham gia nhóm');const code=val('code').toUpperCase().replace(/\s/g,'');if(!/^[A-HJ-NP-Z2-9]{12}$/.test(code))return toast('Mã chuyến đi phải gồm 12 ký tự');app.busy=true;closeSheet();await openLive(code);toast('Đã vào nhóm, đang tải dữ liệu');return}
if(action==='new-trip'){const data={name:val('name'),destination:val('destination'),start:val('start'),end:val('end'),budget:Number(val('budget')||0)};if(!validateTrip(data))return toast('Kiểm tra ngày đi (tối đa 31 ngày) và ngân sách');const code=app.live?randCode():'DEMO-'+randCode().slice(0,6);closeSheet();if(app.live){app.busy=true;await openLive(code,data)}else{app.trip=newEmpty({...data,code,updatedAt:now()});app.trip.members=[{id:me(),name:app.profile,role:'owner'}];app.screen='app';persistDemo();render()}toast('Đã tạo chuyến đi');return}
if(action==='edit-trip'){const data={name:val('name'),destination:val('destination'),start:val('start'),end:val('end'),budget:Number(val('budget')||0)};if(!validateTrip(data)||app.trip.activities.some(x=>x.date<data.start||x.date>data.end))return toast('Ngày đi không hợp lệ hoặc có hoạt động ngoài khoảng ngày mới');await mutate('trip','update',{...data,updatedByName:app.profile});closeSheet();render();return}
if(action==='activity'){const date=val('date'),time=val('time'),title=val('title');if(!title||!date||!time||date<app.trip.start||date>app.trip.end)return toast('Kiểm tra ngày và giờ hoạt động');await mutate('activities',form.dataset.id?'update':'create',{title,date,time,place:val('place'),note:val('note')},form.dataset.id);app.selectedDay=Math.max(0,days(app.trip).indexOf(date));closeSheet();render();return}
if(action==='expense'){const amount=Number(val('amount')),participants=fd.getAll('participant').map(String),payerId=val('payer');if(!val('title')||!Number.isSafeInteger(amount)||amount<=0||!participants.length||!app.trip.members.some(m=>m.id===payerId)||participants.some(id=>!app.trip.members.some(m=>m.id===id)))return toast('Nhập số tiền và chọn người chia hợp lệ');await mutate('expenses',form.dataset.id?'update':'create',{title:val('title'),amount,payerId,participantIds:participants},form.dataset.id);closeSheet();render();return}
if(action==='checklist'){if(!val('title'))return toast('Nhập tên vật dụng');await mutate('checklist','create',{title:val('title'),done:false});closeSheet();render();return}
if(action==='personal-notification'){const target=val('target'),body=val('message');if(!app.live)return toast('Tính năng này cần Firebase');if(!app.trip.members.some(m=>m.id===target&&target!==me())||!body||body.length>240)return toast('Chọn thành viên và nhập lời nhắn');await app.remote.sendPersonal(app.trip.code,target,app.profile,body);closeSheet();toast('Đã gửi lời nhắc cho thành viên');return}
if(action==='link'){let url;try{url=new URL(val('url'));if(!['https:','http:'].includes(url.protocol))throw Error('Invalid')}catch{return toast('Đường dẫn phải bắt đầu bằng https:// hoặc http://')}if(!val('title'))return toast('Nhập tên liên kết');await mutate('links','create',{title:val('title'),url:url.href,note:val('note')});closeSheet();render();return}
}catch(err){toast('Không thực hiện được: '+(err.code||err.message||'Lỗi'));console.error(err)}finally{app.busy=false}}
async function mutate(kind,op,data={},id=''){if(app.live){if(!app.remote||!app.trip)throw Error('Chưa kết nối chuyến đi');app.status=navigator.onLine?'Đang đồng bộ':'Chờ có mạng';const code=app.trip.code,members=[...app.trip.members],profile=app.profile;
const original=app.trip[kind]?.find?.(x=>x.id===id);
const p=app.remote.mutate(code,kind,op,data,id,profile);p.then(async()=>{
  if(['activities','expenses'].includes(kind)&&['create','update','delete'].includes(op)){
    const subject=kind==='activities'?'Lịch trình':'Khoản chi';
    const verb=op==='create'?'mới':op==='update'?'được cập nhật':'đã xóa';
    const label=(op==='delete'?original?.title:data.title)||'mục không tên';
    const details=kind==='activities'&&op==='create'?` lúc ${data.time}`:kind==='expenses'&&op==='create'?`: ${money(data.amount)}`:'';
    const body=`${profile} ${op==='create'?'thêm':op==='update'?'sửa':'xóa'} ${label}${details}.`;
    await app.remote.notifyOthers(code,members,profile,kind==='activities'?'activity':'expense',`${subject} ${verb}`,body);
  }
}).catch(err=>{app.status='Lỗi đồng bộ';toast('Lưu thay đổi hoặc gửi thông báo chưa thành công');console.error(err)});toast(navigator.onLine?'Đã gửi thay đổi, đang đồng bộ':'Đã ghi nhận, chờ có mạng');return}
const t=app.trip;if(kind==='trip'){Object.assign(t,data)}else if(op==='create'){t[kind].push({id:uid(),...data,updatedByName:app.profile,updatedAt:now()})}else if(op==='update'){const x=t[kind].find(x=>x.id===id);if(x)Object.assign(x,data,{updatedByName:app.profile,updatedAt:now()})}else if(op==='delete'){t[kind]=t[kind].filter(x=>x.id!==id)}persistDemo();render();toast('Đã lưu trên máy')}
async function shareCode(){if(!app.live){toast('Mã demo không dùng được trên điện thoại khác');return}const code=app.trip.code,base=location.href.split('?')[0].split('#')[0],link=base+'?join='+encodeURIComponent(code);try{if(navigator.share){await navigator.share({title:'Tham gia TripMate',text:'Nhập tên của bạn và tham gia chuyến đi của nhóm.',url:link})}else if(navigator.clipboard){await navigator.clipboard.writeText(link);toast('Đã sao chép link mời')}else{sheet('Mời thành viên',`<div class="codebox"><b>${q(code)}</b></div><p class="caption" style="word-break:break-all">${q(link)}</p>`)}}catch(err){if(err.name!=='AbortError')toast('Không thể chia sẻ, thử sao chép mã nhóm')}}
async function enterSample(){const prior=localGet(STORE,{})['DEMO-TRIP'];let s=prior||sample();if(!s.members.some(x=>x.id===me()))s.members.push({id:me(),name:app.profile,role:'owner'});if(s.members.length===1){s.members.push({id:'demo-an',name:'An',role:'member'},{id:'demo-binh',name:'Bình',role:'member'})}if(!prior){s.expenses=[{id:'demo-e1',title:'Ăn xế',amount:500000,payerId:me(),participantIds:s.members.map(m=>m.id),updatedAt:now(),updatedByName:app.profile}]}app.trip=s;app.screen='app';persistDemo();render()}
async function handleAction(el){const action=el.dataset.action,id=el.dataset.id,kind=el.dataset.kind;try{
switch(action){case 'close':closeSheet();break;case 'notifications':openInbox();break;case 'enable-push':await enablePush();break;case 'read-notification':{const notice=app.notifications.find(n=>n.id===id);if(notice&&!notice.read&&app.live){await app.remote.markNotice(app.trip.code,id)}break}case 'read-all-notifications':if(app.live){await Promise.all(app.notifications.filter(n=>!n.read).map(n=>app.remote.markNotice(app.trip.code,n.id)));toast('Đã đánh dấu đã đọc')}break;case 'new-trip':case 'join-trip':case 'add-activity':case 'add-expense':case 'add-checklist':case 'add-link':case 'edit-trip':case 'settings':case 'rename':case 'send-notification':openForm(action);break;
case 'edit-activity':case 'edit-expense':openExpenseId='';openForm(action,id);break;
case 'expense-details':expenseDetails(id);break;
case 'balance-details':balanceDetails();break;
case 'sample':await enterSample();break;
case 'day':app.selectedDay=Number(el.dataset.index)||0;render();break;
case 'share':await shareCode();break;
case 'switch-trip':closeSheet();app.screen='lobby';app.trip=null;if(app.remote)app.remote.unsubscribe();if(app.notificationUnsub){app.notificationUnsub();app.notificationUnsub=null}app.notifications=[];render();break;
case 'back-lobby':app.screen='lobby';if(app.notificationUnsub){app.notificationUnsub();app.notificationUnsub=null}app.notifications=[];render();break;
case 'open-known':{const code=el.dataset.code;if(app.live){app.busy=true;await openLive(code)}else{const saved=localGet(STORE,{})[code];if(saved){app.trip=saved;app.screen='app';app.active=code;localSet(ACTIVE,code);render()}else toast('Chuyến này không có dữ liệu cục bộ trên máy')}break}
case 'map':window.open('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent((el.dataset.place||'')+', '+app.trip.destination),'_blank','noopener');break;
case 'toggle-checklist':{const x=app.trip.checklist.find(x=>x.id===id);if(x)await mutate('checklist','update',{done:el.checked},id);break}
case 'delete':if(confirm('Xóa mục này khỏi chuyến đi của cả nhóm?')){openExpenseId='';await mutate(kind,'delete',{},id)}break;
case 'settle':{const from=el.dataset.from,to=el.dataset.to,amount=Number(el.dataset.amount);if(confirm(`Xác nhận ${memberName(from)} đã chuyển ${money(amount)} cho ${memberName(to)}?`))await mutate('settlements','create',{from,to,amount});break}
case 'export':{const t=app.trip;const blob=new Blob([JSON.stringify({app:'TripMate',version:4,exportedAt:now(),trip:t},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='tripmate-'+t.code+'-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Đã xuất bản sao dữ liệu');break}
}}
catch(err){console.error(err);toast('Lỗi thao tác: '+(err.message||'Vui lòng thử lại'))}finally{app.busy=false}}

// iOS-like swipe actions. Swipe card left to reveal controls; right to close.
// Only one expense stays open at a time. Pointer Events support touch, pen and mouse.
let expenseGesture=null;
let suppressSwipeClickUntil=0;
const SWIPE_WIDTH=148;
function setExpenseSwipe(id,open){
 document.querySelectorAll('.expense-swipe').forEach(row=>{
   const active=open&&row.dataset.expenseRow===id;
   row.classList.toggle('is-open',active);
   const front=row.querySelector('.expense-front');
   if(front){front.style.transform='';front.style.transition=''}
   row.querySelectorAll('.swipe-control').forEach(b=>b.tabIndex=active?0:-1);
 });
 openExpenseId=open?id:'';
}
document.addEventListener('pointerdown',e=>{
 const row=e.target.closest('.expense-swipe');
 if(!row||e.target.closest('.expense-reveal-actions'))return;
 expenseGesture={id:row.dataset.expenseRow,x:e.clientX,y:e.clientY,pointerId:e.pointerId,base:row.classList.contains('is-open')?-SWIPE_WIDTH:0,dragging:false,vertical:false,front:row.querySelector('.expense-front')};
},{passive:true});
document.addEventListener('pointermove',e=>{
 const g=expenseGesture;if(!g||g.pointerId!==e.pointerId)return;
 const dx=e.clientX-g.x,dy=e.clientY-g.y;
 if(!g.dragging){
   if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)){g.vertical=true;return}
   if(g.vertical||Math.abs(dx)<9||Math.abs(dx)<Math.abs(dy))return;
   g.dragging=true;g.front.style.transition='none';
 }
 const offset=Math.min(0,Math.max(-SWIPE_WIDTH,g.base+dx));
 g.front.style.transform=`translate3d(${offset}px,0,0)`;
},{passive:true});
function finishExpenseSwipe(e,cancelled=false){
 const g=expenseGesture;if(!g||g.pointerId!==e.pointerId)return;
 expenseGesture=null;
 if(!g.dragging){if(!e.target.closest('[data-action]')&&openExpenseId&&e.target.closest('.expense-swipe')?.dataset.expenseRow!==openExpenseId)setExpenseSwipe('',false);return}
 const dx=e.clientX-g.x;
 const left=g.base+dx;
 const open=!cancelled&&(dx < -38 || (g.base<0&&dx<42&&left< -SWIPE_WIDTH/2));
 g.front.style.transform='';g.front.style.transition='';
 setExpenseSwipe(g.id,open);
 suppressSwipeClickUntil=Date.now()+350;
}
document.addEventListener('pointerup',e=>finishExpenseSwipe(e),{passive:true});
document.addEventListener('pointercancel',e=>finishExpenseSwipe(e,true),{passive:true});
document.addEventListener('click',e=>{
 if(Date.now()<suppressSwipeClickUntil&&e.target.closest('.expense-swipe')){e.preventDefault();e.stopImmediatePropagation();return}
 if(openExpenseId&&!e.target.closest('.expense-swipe')&&!e.target.closest('.sheet'))setExpenseSwipe('',false);
},true);

document.addEventListener('click',e=>{const tab=e.target.closest('[data-tab]');if(tab){openExpenseId='';app.tab=tab.dataset.tab;render();scrollTo({top:0,behavior:'instant'});return}const act=e.target.closest('[data-action]');if(act&&act.tagName!=='INPUT'){e.preventDefault();handleAction(act);return}if(e.target.classList.contains('modal-backdrop'))closeSheet()});
document.addEventListener('change',e=>{if(e.target.matches('input[data-action]'))handleAction(e.target)});
document.addEventListener('submit',e=>{const form=e.target.closest('form[data-form]');if(form){e.preventDefault();handleForm(form)}});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSheet()});
window.addEventListener('online',()=>{if(app.live&&app.trip){app.status='Đang đồng bộ';render()}});
window.addEventListener('offline',()=>{if(app.live&&app.trip){app.status='Mất mạng';render()}});
window.addEventListener('storage',e=>{if(!app.live&&e.key===STORE&&app.trip){const t=localGet(STORE,{})[app.trip.code];if(t){app.trip=t;render()}}});
render();
if(app.live&&app.profile&&app.pendingJoin){openForm('join-trip')}else if(app.live&&app.profile&&app.active){openLive(app.active).catch(()=>{app.screen='lobby';render()})}
if(!app.profile&&app.pendingJoin){/* nhập tên trước khi tham gia theo mã */}
if('serviceWorker' in navigator&&['https:','http:'].includes(location.protocol)&&location.hostname!=='localhost'&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
})();
