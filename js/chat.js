// chat.js

// firebase setup

import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { auth, db, setupGlobalAuth, signInWithGoogle, signOutUser } from "./auth.js";


const replyTag    = document.getElementById("reply-tag");
const replyTagId  = document.getElementById("reply-tag-id");
const clearReply  = document.getElementById("clear-reply");


let currentChatCollectionRef = null;
let unsubscribeChat = null;
let replyToId = null;

let currentUsername = localStorage.getItem("chatUsername") || "anon";

let currentUsernameColour =
    localStorage.getItem("chatColour") ||
    ["#d590b7", "#d5bc90", "#d5d090", "#90d5ae", "#90d5d1", "#9095d5", "#ae90d5"]
        [Math.floor(Math.random() * 4)];

// send a chat message using the current chat collection reference
async function sendMessage(messageText, replyTo = null) {

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
            replyTo,
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
            const raw = chatInput.value.trim();
            if (!raw) return;

            // send using the replyToId we set on “Reply”
            sendMessage(raw, replyToId);

            // clear input + reply UI
            replyToId = null;
            chatInput.value = "";
            chatInput.style.height = "";
            replyTag.style.display = "none";
        });

        // pressing enter
        chatInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                sendBtn.click();
            }
        });

        // add this inside setupSendListeners(), to let the user cancel a reply
        clearReply.addEventListener("click", () => {
            replyToId = null;
            replyTag.style.display = "none";
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

// helper to build one message element (with indent, controls & handlers)
function createMsgElement(data, indent, postId, chatInput) {
    const msgDiv = document.createElement("div");
    msgDiv.style.marginLeft = indent + "px";
    msgDiv.dataset.id = data.id;
    msgDiv.classList.add("chat-msg");

    // username
    const usernameElem = document.createElement("strong");
    usernameElem.textContent = data.username + ":";
    usernameElem.style.color = data.colour || "#fff";
    msgDiv.appendChild(usernameElem);

    // message text
    msgDiv.appendChild(document.createTextNode(" " + data.message));

    // controls container
    const ctl = document.createElement("span");
    ctl.className = "msg-controls";

    // build (reply/delete) markup
    const parts = [];

    // only top‐level messages get reply
    if (!data.replyTo) {
        parts.push(`<span class="reply-btn">reply</span>`);
    }
    // only your own messages get delete
    if (data.userId === auth.currentUser.uid) {
        parts.push(`<span class="delete-btn">delete</span>`);
    }
    ctl.innerHTML = "(" + parts.join("/") + ")";

    ctl.style.display = "none";
    msgDiv.appendChild(ctl);

    // show controls on hover
    msgDiv.addEventListener("mouseenter", () => (ctl.style.display = "inline"));
    msgDiv.addEventListener("mouseleave", () => (ctl.style.display = "none"));

    // reply handler
    const rbtn = ctl.querySelector(".reply-btn");
    if (rbtn) {
        rbtn.addEventListener("click", () => {
            // set the replyToId and show the little tag
            replyToId = data.id;
            replyTagId.textContent = data.id;
            replyTag.style.display = "block";
            chatInput.focus();
            });
        }

    // delete handler (your own messages)
    const delBtn = ctl.querySelector(".delete-btn");
    if (delBtn) {
        delBtn.addEventListener("click", async () => {
            if (!confirm("delete this message?")) return;
            await deleteDoc(doc(db, "posts", postId, "chat", data.id));
        });
    }

    return msgDiv;
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
    const chatMessages = document.getElementById("chat-messages");
    const chatInput    = document.getElementById("chat-input");

    unsubscribeChat = onSnapshot(q, (snapshot) => {
        if (!chatMessages) {
            console.error("chat messages element not found");
            return;
        }

        // gather all docs into an array
        const all = snapshot.docs.map((ds) => ({
            id:   ds.id,
            ...ds.data(),
        }));

        // partition top-level vs replies
        const repliesMap = {};
        const topLevel   = [];
        all.forEach((m) => {
            if (m.replyTo) {
                ;(repliesMap[m.replyTo] ||= []).push(m);
            } else {
                topLevel.push(m);
            }
        });

        // clear & render
        chatMessages.innerHTML = "";
        topLevel.forEach((m) => {
            chatMessages.appendChild(
                createMsgElement(m, 0, postId, chatInput)
            );
            ;(repliesMap[m.id] || []).forEach((r) => {
                chatMessages.appendChild(
                    createMsgElement(r, 24, postId, chatInput)
                );
            });
        });

        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}

window.addEventListener("DOMContentLoaded", () => {
    initChatListener();
    setupSendListeners();
    setupInlineUserInfo();
    playChatInfoAnim1();
});

window.addEventListener("hashchange", () => {
    initChatListener();
});

setupGlobalAuth({
    onLogin: async (user) => {
        document.getElementById("login-prompt").style.display  = "none";
        document.getElementById("chat-controls").style.display = "flex";
        document.getElementById("chat-input").disabled = false;
        document.getElementById("send-btn" ).disabled = false;
        document.getElementById("chat-user-info").style.display = "flex";

        // load colour
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.chatColour) {
                currentUsernameColour = data.chatColour;
                localStorage.setItem("chatColour", data.chatColour);
            }
        }
    },
    onLogout: () => {
        document.getElementById("login-prompt").style.display  = "flex";
        document.getElementById("chat-controls").style.display = "none";
        document.getElementById("chat-input").disabled = true;
        document.getElementById("send-btn" ).disabled = true;
        document.getElementById("chat-user-info").style.display = "none";
    }
});

// set up login/logout button
document.getElementById("google-login-btn")
    .addEventListener("click", () => signInWithGoogle().catch(console.error));


document.getElementById("logout-btn")
    .addEventListener("click", () => {
        signOutUser()
            .catch(err => console.error("Logout failed:", err));
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
        console.error('could not load ASCII animation:', err);
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


