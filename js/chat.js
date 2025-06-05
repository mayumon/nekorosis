// chat.js

// firebase setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
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

let currentUsername = localStorage.getItem("chatUsername") || "anon";

let currentUsernameColour =
    localStorage.getItem("chatColour") ||
    ["#ff0091", "#c000ff", "#4a00ff", "#3fff00"][
        Math.floor(Math.random() * 4)
        ];

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({prompt: "select_account"})


// subscribes to the chat messages for the current post
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
            usernameElem.style.color = data.colour || "#000";

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
            colour: currentUsernameColour,
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
    const colourOptionContainer = document.getElementById("colour-options");

    if (!profileBtn || !profilePopup || !usernameInput || !profileOk) {
        console.error("profile popup elements not found");
        return;
    }

    let tempUsernameColour = currentUsernameColour;

    profileBtn.addEventListener("click", () => {
        profilePopup.style.display = "block";
        usernameInput.value = currentUsername;

        tempUsernameColour = currentUsernameColour;
        colourOptionElements.forEach(option => {
            option.style.border = "none";
            if(option.getAttribute("data-colour") === currentUsernameColour){
                option.style.border = "2px solid #000";
            }
        })
    })

    const colourOptionElements = colourOptionContainer.querySelectorAll(".colour-option");
    colourOptionElements.forEach(option => {
        option.addEventListener("click", () => {
            colourOptionElements.forEach(opt => opt.style.border = "none"); // test diff settings for these later
            option.style.border = "2px solid #000";
            tempUsernameColour = option.getAttribute("data-colour");
        })
    })

    profileOk.addEventListener("click", () => {
        let newUsername = usernameInput.value.trim();
        currentUsername = newUsername !== "" ? newUsername : "anon";
        currentUsernameColour = tempUsernameColour;

        localStorage.setItem("chatUsername", currentUsername);
        localStorage.setItem("chatColour", currentUsernameColour);

        profilePopup.style.display = "none";
    })

    profileCancel.addEventListener("click", () => {
        profilePopup.style.display = "none";
    })
}

// sets up the chat for the current post
function initChatListener() {

    // determine post id from the URL hash, default is "nyan"
    const postId = window.location.hash.slice(1) || "nyan";

    // if a previous listener exists, unsubscribe from it
    if (unsubscribeChat) {
        unsubscribeChat();
        unsubscribeChat = null;
    }
    currentChatCollectionRef = collection(db, "posts", postId, "chat");
    const q = query(currentChatCollectionRef, orderBy("createdAt", "asc"));

    unsubscribeChat = onSnapshot(q, (snapshot) => {
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
            usernameElem.style.color = data.colour || "#fff";

            msgDiv.appendChild(usernameElem);

            msgDiv.appendChild(document.createTextNode(" " + data.message));

            chatMessages.appendChild(msgDiv);
        });

        // auto-scroll to bottom of the chat container
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}

function setupAuthStateListener() {
    const loginPrompt = document.getElementById("login-prompt");
    const googleLoginBtn = document.getElementById("google-login-btn");
    const chatControls = document.getElementById("chat-controls");
    const chatInput = document.getElementById("chat-input");
    const sendBtn = document.getElementById("send-btn");

    onAuthStateChanged(auth, (user) => {
        if (user) {
            loginPrompt.style.display = "none";
            chatControls.style.display = "flex";
            chatInput.disabled = false;
            sendBtn.disabled = false;
        } else {
            loginPrompt.style.display = "flex";
            chatControls.style.display = "none";
            chatInput.disabled = true;
            sendBtn.disabled = true;
        }
    });

    googleLoginBtn.addEventListener("click", () => {
        signInWithPopup(auth, googleProvider).catch((err) => {
            console.error("Google sign-in error:", err);
        });
    });
}

window.addEventListener("DOMContentLoaded", () => {
    initChatListener();
    setupSendListeners();
    setupProfilePopup();
    setupAuthStateListener();
    playChatInfoAnim1();
});

window.addEventListener("hashchange", () => {
    initChatListener();
});

// ================================
// ascii animation
// ================================

async function loadAsciiFramesFromTxt(path, delimiter = '***FRAME***') {
    const resp = await fetch(path);
    if (!resp.ok) throw new Error(`Failed to fetch ${path}`);
    const text = await resp.text();

    return text
        .split(delimiter)
        .map(frame => frame.trim())
        .filter(frame => frame.length > 0);
}

function startAsciiLoop(containerEl, frames, intervalMs) {

    if (containerEl._asciiInterval) {
        clearInterval(containerEl._asciiInterval);
    }
    let idx = 0;

    containerEl.textContent = frames[idx];

    containerEl._asciiInterval = setInterval(() => {
        idx = (idx + 1) % frames.length;
        containerEl.textContent = frames[idx];
    }, intervalMs);
}

async function playChatInfoAnim1() {
    const chatInfo = document.getElementById('chat-info');
    if (!chatInfo) return;
    try {
        const frames = await loadAsciiFramesFromTxt('assets/ascii/anim1.txt');

        startAsciiLoop(chatInfo, frames, 200); // adjustable framerate
    } catch (err) {
        console.error('Could not load ASCII animation:', err);
    }
}

function stopChatInfoAnimation() {
    const chatInfo = document.getElementById('chat-info');
    if (chatInfo && chatInfo._asciiInterval) {
        clearInterval(chatInfo._asciiInterval);
        delete chatInfo._asciiInterval;
        chatInfo.textContent = '';
    }
}


