import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

export async function login({ email, password }) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const profil = await ambilProfil(cred.user.uid);

  if (!profil || profil.role !== "staf") {
    await signOut(auth);
    throw { code: "auth/bukan-staf" };
  }
  return { user: cred.user, profil };
}

export function logout() {
  return signOut(auth);
}

export async function ambilProfil(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data();
}

export function proteksiHalamanStaf(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }
    const profil = await ambilProfil(user.uid);
    if (!profil || profil.role !== "staf") {
      await signOut(auth);
      window.location.href = "login.html";
      return;
    }
    callback(user, profil);
  });
}

export function kirimResetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

export function terjemahkanErrorFirebase(kode) {
  const peta = {
    "auth/invalid-email": "Format email tidak valid.",
    "auth/user-not-found": "Akun dengan email ini tidak ditemukan.",
    "auth/wrong-password": "Password yang Anda masukkan salah.",
    "auth/invalid-credential": "Email atau password salah.",
    "auth/too-many-requests": "Terlalu banyak percobaan. Coba lagi beberapa saat.",
    "auth/bukan-staf": "Akun ini tidak memiliki akses admin."
  };
  return peta[kode] || "Terjadi kesalahan. Silakan coba lagi.";
}
