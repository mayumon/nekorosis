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


// avatar cache + helpers

const chatUserPrefsCache = new Map(); // uid -> prefs|null|PENDING
const chatUserListeners  = new Map(); // uid -> unsubscribe
const CHAT_PENDING = Symbol('pending');

function chatDefaultPrefs() {
    // not used to render; we keep spinner until real prefs exist
    return {
        mainColour:'#e7dee3', accent1Colour:'#373335', accent1Letter:'none',
        accent2Colour:'#e7a457', accent2Letter:'none', emotionLetter:'a',
        accessoryLetter:'none'
    };
}

async function chatGetUserPrefs(uid) {
    if (!uid) return null;
    const cached = chatUserPrefsCache.get(uid);
    if (cached && cached !== CHAT_PENDING) return cached;
    if (cached === CHAT_PENDING) return null;

    chatUserPrefsCache.set(uid, CHAT_PENDING);
    try {
        const snap = await getDoc(doc(db, "users", uid));
        if (!snap.exists() || !snap.data()?.customization) {
            chatUserPrefsCache.set(uid, null);
            return null;
        }
        const prefs = snap.data().customization;
        chatUserPrefsCache.set(uid, prefs);
        return prefs;
    } catch (e) {
        console.warn("chatGetUserPrefs error:", e);
        chatUserPrefsCache.delete(uid);
        return null;
    }
}

function chatRenderMiniAvatar(container, prefs) {
    container.classList.remove('loading');
    container.innerHTML = "";

    const layers = [
        { type:'main',      key:'base',              color:prefs.mainColour },
        { type:'accent',    key:prefs.accent1Letter, color:prefs.accent1Colour },
        { type:'accent',    key:prefs.accent2Letter, color:prefs.accent2Colour },
        { type:'emotion',   key:prefs.emotionLetter, color:null },
        { type:'accessory', key:prefs.accessoryLetter, color:null },
    ];

    layers.forEach(({type,key,color}) => {
        if (!key || key === 'none') return;
        const folder = (type === 'accent') ? 'accent' : type;
        const src = `assets/avatar/${folder}/${key}.png`;

        if (type === 'emotion' || type === 'accessory') {
            const img = document.createElement('img');
            img.className = 'mini-avatar-layer';
            img.src = src;
            container.appendChild(img);
        } else {
            const div = document.createElement('div');
            div.className = 'mini-avatar-layer masked';
            div.style.color = color;
            div.style.maskImage = `url("${src}")`;
            div.style.webkitMaskImage = div.style.maskImage;
            container.appendChild(div);
        }
    });
}

function chatEnsureUserListener(uid) {
    if (!uid || chatUserListeners.has(uid)) return;
    const ref = doc(db, "users", uid);
    const unsub = onSnapshot(ref, snap => {
        if (!snap.exists() || !snap.data()?.customization) return;
        const prefs = snap.data().customization;
        chatUserPrefsCache.set(uid, prefs);
        document
            .querySelectorAll(`.mini-avatar[data-uid="${uid}"]`)
            .forEach(el => chatRenderMiniAvatar(el, prefs));
    }, err => console.warn("user listener error", uid, err));
    chatUserListeners.set(uid, unsub);
}

async function chatHydrateAvatar(uid) {
    const prefs = await chatGetUserPrefs(uid);
    if (!prefs) return;
    document
        .querySelectorAll(`.mini-avatar[data-uid="${uid}"]`)
        .forEach(el => chatRenderMiniAvatar(el, prefs));
}


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

            // send
            sendMessage(raw, replyToId);

            // clear input + reply ui
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

        // cancel reply
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
    const currentUid = auth.currentUser?.uid || null;

    const row = document.createElement("div");
    row.style.marginLeft = indent + "px";
    row.dataset.id = data.id;
    row.classList.add("chat-msg");

    // avatar
    const avatar = document.createElement("span");
    avatar.className = "mini-avatar loading";
    avatar.dataset.uid = data.userId || "";
    avatar.innerHTML = '<span class="avatar-spinner" aria-hidden="true"></span>';
    row.appendChild(avatar);

    // body
    const body = document.createElement("div");
    body.className = "msg-body";
    row.appendChild(body);

    // username
    const usernameElem = document.createElement("strong");
    usernameElem.textContent = (data.username || "anon") + ":";
    usernameElem.style.color = data.colour || "#fff";
    body.appendChild(usernameElem);

    // message text
    body.appendChild(document.createTextNode(" " + (data.message || "")));

    // controls container
    const ctl = document.createElement("span");
    ctl.className = "msg-controls";

    const parts = [];
    // only top-level messages get reply
    if (!data.replyTo && currentUid) parts.push(`<span class="reply-btn">reply</span>`);

    // only your own messages get delete
    if (data.userId === currentUid)   parts.push(`<span class="delete-btn">delete</span>`);
    if (parts.length) ctl.innerHTML = "(" + parts.join("/") + ")";

    ctl.style.display = "none";
    body.appendChild(ctl);

    //  controls on hover
    row.addEventListener("mouseenter", () => (ctl.style.display = "inline"));
    row.addEventListener("mouseleave", () => (ctl.style.display = "none"));

    // reply handler
    const rbtn = ctl.querySelector(".reply-btn");
    if (rbtn) {
        rbtn.addEventListener("click", () => {
            replyToId = data.id;
            replyTagId.textContent = data.id;
            replyTag.style.display = "block";
            chatInput.focus();
        });
    }

    // delete handler
    const delBtn = ctl.querySelector(".delete-btn");
    if (delBtn) {
        delBtn.addEventListener("click", async () => {
            if (!confirm("delete this message?")) return;
            await deleteDoc(doc(db, "posts", postId, "chat", data.id));
        });
    }

    // avatar hydration setup
    if (data.userId) {
        chatEnsureUserListener(data.userId);
        chatHydrateAvatar(data.userId);
        setTimeout(() => chatHydrateAvatar(data.userId), 1200);
    } else {
        avatar.classList.remove('loading');
        avatar.innerHTML = "";
    }

    return row;
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

        // hydrate avatars
        const uids = [...new Set(all.map(m => m.userId).filter(Boolean))];
        uids.forEach(uid => {
            chatEnsureUserListener(uid);
            chatHydrateAvatar(uid);
        });

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
        document.getElementById("chat-controls").style.display = "none";
        document.getElementById("chat-input").disabled = true;
        document.getElementById("send-btn" ).disabled = true;
        document.getElementById("chat-user-info").style.display = "none";
    }
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


