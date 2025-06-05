// chat.js

// firebase setup
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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
    ["#d590b7", "#d5bc90", "#d5d090", "#90d5ae", "#90d5d1", "#9095d5", "#ae90d5"][
        Math.floor(Math.random() * 4)
        ];

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({prompt: "select_account"})

// send a chat message using the current chat collection reference
async function sendMessage(messageText) {

    if (!currentChatCollectionRef) {
        console.error("chat not initialized.");
        return;
    }

    const uid = auth.currentUser?.uid;

    if (!uid) {
        console.error("Cannot send: user is not authenticated");
        return;
    }

    try {
        await addDoc(currentChatCollectionRef, {
            username: currentUsername,
            colour: currentUsernameColour,
            message: messageText,
            userId: uid,
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

        // auto-growing text box
        chatInput.style.overflowY = "hidden";

        chatInput.addEventListener("input", () => {
            chatInput.style.height = "";
            const needed = chatInput.scrollHeight;

            const current = chatInput.clientHeight;

            if (needed > current) {
                chatInput.style.height = needed + "px";
            }
        });

        // clicking send
        sendBtn.addEventListener("click", () => {
            const messageText = chatInput.value.trim();

            if (messageText) {
                sendMessage(messageText);
                chatInput.value = "";
                chatInput.style.height = "";
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

function setupInlineUserInfo() {
    const userInfoDiv = document.getElementById("chat-user-info");
    const usernameInput = document.getElementById("username-input");
    const colourOptionContainer = document.getElementById("colour-options");

    const colourOptionElements = document.querySelectorAll("#colour-options .colour-option");
    colourOptionElements.forEach(el => {
        el.style.backgroundColor = el.dataset.colour;
    });

    usernameInput.value = currentUsername;

    colourOptionElements.forEach(el => {
        const c = el.dataset.colour;
        if (c === currentUsernameColour) el.classList.add("selected");
    });

    // save username on change
    usernameInput.addEventListener("change", () => {
        const newUsername = usernameInput.value.trim() || "anon";
        currentUsername = newUsername;
        localStorage.setItem("chatUsername", currentUsername);
    });

    // save username colour on change
    colourOptionElements.forEach(option => {
        option.addEventListener("click", () => {

            colourOptionElements.forEach(opt => opt.classList.remove("selected"));
            option.classList.add("selected");

            currentUsernameColour = option.dataset.colour;
            localStorage.setItem("chatColour", currentUsernameColour);
        });
    });
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

        // update the chat ui
        chatMessages.innerHTML = ""; // clear previous messages

        snapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            const messageId = docSnapshot.id;
            const msgDiv = document.createElement("div");

            const usernameElem = document.createElement("strong");

            usernameElem.textContent = data.username + ":";
            usernameElem.style.color = data.colour || "#fff";

            msgDiv.appendChild(usernameElem);

            msgDiv.appendChild(document.createTextNode(" " + data.message));

            // make message deletable if it belongs to the user
            if (data.userId === auth.currentUser.uid) {
                msgDiv.classList.add("deletable");
                msgDiv.addEventListener("click", () => {

                    const ok = confirm("delete this message?");
                    if (!ok) return;

                    const docRef = doc(db, "posts", postId, "chat", messageId);
                    deleteDoc(docRef).catch((err) =>
                        console.error("couldn't delete message:", err)
                    );
                });
            }

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
    setupInlineUserInfo();
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


