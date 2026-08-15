// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD4XPM4QcdPmISFIzInRaFRGlTrF4dC6SI",
  authDomain: "utube-17f84.firebaseapp.com",
  projectId: "utube-17f84",
  storageBucket: "utube-17f84.firebasestorage.app",
  messagingSenderId: "222769421459",
  appId: "1:222769421459:web:0014834cfeae7e6e18c166"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
export { auth, provider };
