// auth.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import {getFirestore, doc, setDoc, serverTimestamp} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBEsyRw_-yN0TuRdWMQ_oJIQr2IBwcQhis",
    authDomain: "nekorosis.firebaseapp.com",
    projectId: "nekorosis",
    storageBucket: "nekorosis.appspot.com",
    messagingSenderId: "1029151428629",
    appId: "1:1029151428629:web:aea428725d6d2ffdb83e1c"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db   = getFirestore(app);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

// call on page load to:
// show/hide ui based on login state
// write the user record into /users/{uid}

export function setupGlobalAuth({ onLogin, onLogout }) {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const chatColour = localStorage.getItem("chatColour") ||
                ["#d590b7", "#d5bc90", "#d5d090", "#90d5ae", "#90d5d1", "#9095d5", "#ae90d5"]
                    [Math.floor(Math.random() * 4)];

            // write/merge users/{uid} doc
            await setDoc(
                doc(db, "users", user.uid),
                {
                    uid:         user.uid,
                    name:        user.displayName || "anon",
                    email:       user.email,
                    lastLogin:   serverTimestamp(),
                    chatColour
                },
                { merge: true }
            );
            onLogin(user);
        } else {
            onLogout();
        }
    });
}

// convenience to pop the google sign-in
export function signInWithGoogle() {
    return signInWithPopup(auth, provider);
}

export function signOutUser() {
    return signOut(auth);
}
