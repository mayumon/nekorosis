// chat.js

// firebase setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBEsyRw_-yN0TuRdWMQ_oJIQr2IBwcQhis",
    authDomain: "nekorosis.firebaseapp.com",
    projectId: "nekorosis",
    storageBucket: "nekorosis.appspot.com",
    messagingSenderId: "1029151428629",
    appId: "1:1029151428629:web:aea428725d6d2ffdb83e1c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentChatCollectionRef = null;
let unsubscribeChat = null;
let currentUsername = "anon";

// sets up the chat for the current post
function initChat() {

    // determine post id from the URL hash, default is "nyan"
    const postId = window.location.hash.slice(1) || "nyan";
    console.log("Initializing chat for post:", postId);

    // if a previous listener exists, unsubscribe from it
    if (unsubscribeChat) {
        unsubscribeChat();
        unsubscribeChat = null;
    }

    currentChatCollectionRef = collection(db, "posts", postId, "chat");
    subscribeToChat();
}

// subscribes to the chat messages for the current post,

function subscribeToChat() {

    // order chat messages by creation time
    const q = query(currentChatCollectionRef, orderBy("createdAt", "asc"));

    unsubscribeChat = onSnapshot(q, (snapshot) => {

        console.log("received snapshot with", snapshot.size, "documents");

        const chatMessages = document.getElementById("chat-messages");

        if (!chatMessages) {
            console.error("chat messages element not found");
            return;
        }

        // update the chat UI
        chatMessages.innerHTML = ""; // clear previous messages

        snapshot.forEach((doc) => {
            const data = doc.data();
            const msgDiv = document.createElement("div");

            const usernameElem = document.createElement("strong");

            usernameElem.textContent = data.username + ":";

            msgDiv.appendChild(usernameElem);

            msgDiv.appendChild(document.createTextNode(" " + data.message));

            chatMessages.appendChild(msgDiv);
        });

        // auto-scroll to bottom of the chat container
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}

// send a chat message using the current chat collection reference
async function sendMessage(messageText) {

    if (!currentChatCollectionRef) {
        console.error("chat not initialized.");
        return;
    }

    try {
        await addDoc(currentChatCollectionRef, {
            username: currentUsername,
            message: messageText,
            createdAt: serverTimestamp()
        });

        console.log("message sent successfully");
    }

    catch (error) {
        console.error("error sending message:", error);
    }
}

// set up event listeners for the send button/msg input field (constant)
function setupSendListeners() {
    const sendBtn = document.getElementById("send-btn");
    const chatInput = document.getElementById("chat-input");
    if (sendBtn && chatInput) {

        // clicking send
        sendBtn.addEventListener("click", () => {

            const messageText = chatInput.value.trim();

            if (messageText) {
                sendMessage(messageText);
                chatInput.value = "";
            }
        });

        // pressing enter
        chatInput.addEventListener("keydown", (e) => {

            if (e.key === "Enter") {
                e.preventDefault();
                sendBtn.click();
            }
        });
    }

    else {
        console.error("chat input or send button not found");
    }
}

function setupProfilePopup(){
    const profileBtn = document.getElementById("profile-btn");
    const profilePopup = document.getElementById("profile-popup");
    const usernameInput = document.getElementById("username-input");
    const profileOk = document.getElementById("profile-ok");
    const profileCancel = document.getElementById("profile-cancel");

    if (!profileBtn || !profilePopup || !usernameInput || !profileOk) {
        console.error("profile popup elements not found");
        return;
    }

    profileBtn.addEventListener("click", () => {
        profilePopup.style.display = "block";
        usernameInput.value = currentUsername;
    })

    profileOk.addEventListener("click", () => {
        let newUsername = usernameInput.value.trim();
        currentUsername = newUsername !== "" ? newUsername : "anon";
        profilePopup.style.display = "none";
    })

    profileCancel.addEventListener("click", () => {
        profilePopup.style.display = "none";
    })
}

// call setup functions
setupSendListeners();
setupProfilePopup();

// reinitialize chat on hashchange
window.addEventListener("hashchange", () => {
    initChat();
});

// sign in anonymously and initialize chat
signInAnonymously(auth)
    .then(() => {
        console.log("signed in anonymously");
        initChat();
    })
    .catch((error) => {
        console.error("anonymous sign-in error:", error);
    });
