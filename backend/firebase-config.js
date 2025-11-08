import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyCfXzCwqEmdSKapKu_c4K0csNthqnTmCbk",
  authDomain: "ukbrumbotv2.firebaseapp.com",
  projectId: "ukbrumbotv2",
  storageBucket: "ukbrumbotv2.firebasestorage.app",
  messagingSenderId: "94139896331",
  appId: "1:94139896331:web:c51a036eb328ac3556ad0e",
  measurementId: "G-FQR0Q23MCM"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };