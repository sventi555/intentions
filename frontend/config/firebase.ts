import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";

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
export const db = getFirestore(app);
export const functions = getFunctions(app, "northamerica-northeast2");

if (process.env.NODE_ENV !== "production") {
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}
