import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBpIB9oNdO15y23LI0zCld-FPCWIIiHteU",
  authDomain: "intentions-dbc94.firebaseapp.com",
  projectId: "intentions-dbc94",
  storageBucket: "intentions-dbc94.firebasestorage.app",
  messagingSenderId: "5182096725",
  appId: "1:5182096725:web:fe065b141e1a16e157dbdc",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
