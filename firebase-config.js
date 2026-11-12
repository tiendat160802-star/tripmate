// Cấu hình Firebase Web App của dự án tripmate-93041.
// Đây là cấu hình phía client (không phải khóa quản trị).
// Đừng đưa mật khẩu hoặc service-account JSON vào file này.
window.TRIPMATE_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBO_YSa9ggOrngs66aAvVexNQIzkTQXfKk",
  authDomain: "tripmate-93041.firebaseapp.com",
  projectId: "tripmate-93041",
  storageBucket: "tripmate-93041.firebasestorage.app",
  messagingSenderId: "159200616719",
  appId: "1:159200616719:web:8a8cbf730d589b22b11e7a",
  measurementId: "G-7HJE45GQ5W"
};

// Dán khóa Web Push PUBLIC VAPID ở đây (Project settings > Cloud Messaging > Web Push certificates).
// Chỉ khóa công khai. TUYỆT ĐỐI không dán VAPID private key hay Firebase service-account.
window.TRIPMATE_VAPID_PUBLIC_KEY = 'BPe8yl5CTprKOlaLhhwE6Mmynw_ipGQIViLet8s0cFrw_qM97vF2WtFjEifa26KGk79Naic1mhbAdE2i21zhJI4';
