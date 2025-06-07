// guestbook.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    setDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// firebase setup
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

// cache dom elements
const loginPromptGB = document.getElementById("guestbook-login-prompt");
const loginBtnGB    = document.getElementById("guestbook-google-login-btn");
const guestbookUI   = document.getElementById("guestbook-ui");

const nameInput     = document.getElementById("guest-name");
const textInput     = document.getElementById("guest-text");
const iconsContainer= document.getElementById("guestbook-icons");
const dropzone      = document.getElementById("guestbook-dropzone");

// tooltip (unchanged)
const tooltipDiv    = document.createElement("div");
tooltipDiv.classList.add("guest-tooltip");
document.body.appendChild(tooltipDiv);

const hoverTooltip = document.querySelector(".hover-tooltip");
const bubbleContent = hoverTooltip.querySelector(".bubble-content");

// helper to read hash
function getCurrentPostId() {
    return window.location.hash.slice(1) || "nyan";
}

let currentEntryDocId = null;

// auth listener (unchanged)
function setupAuthListener() {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            loginPromptGB.style.display = "none";
            guestbookUI.style.display  = "block";
        } else {
            loginPromptGB.style.display = "block";
            guestbookUI.style.display   = "none";
        }
    });

    loginBtnGB.addEventListener("click", () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        signInWithPopup(auth, provider).catch((err) => {
            console.error("Google sign-in error (guestbook):", err);
        });
    });
}

// drag and drop logic
function setupDragAndDrop() {
    // mark icons as draggable
    iconsContainer.querySelectorAll(".guestbook-icon").forEach((iconEl) => {
        iconEl.addEventListener("dragstart", (ev) => {
            // store icon name
            ev.dataTransfer.setData("iconType", iconEl.dataset.icon);
            // store docid
            const docId = iconEl.dataset.docId || "";
            ev.dataTransfer.setData("docId", docId);
        });
    });

    // allow drop on dropzone
    dropzone.addEventListener("dragover", (ev) => {
        ev.preventDefault();
    });

    dropzone.addEventListener("drop", async (ev) => {
        ev.preventDefault();

        const rect = dropzone.getBoundingClientRect();
        const rawX = ev.clientX - rect.left;
        const rawY = ev.clientY - rect.top;
        const centeredX = rawX - 20; // TODO: adjust for new icon sizes
        const centeredY = rawY - 20;

        const user = auth.currentUser;
        if (!user) {
            console.error("Non‐authenticated drop attempt.");
            return;
        }
        const uid = user.uid;
        const postId = getCurrentPostId();
        const guestbookColRef = collection(db, "posts", postId, "guestbook");

        // dragged existing entry
        const draggedDocId = ev.dataTransfer.getData("docId");
        if (draggedDocId) {
            try {
                const docRef = doc(db, "posts", postId, "guestbook", draggedDocId);
                // update coordinates
                await setDoc(
                    docRef,
                    {
                        x: centeredX,
                        y: centeredY,
                        createdAt: serverTimestamp()
                    },
                    { merge: true }
                );
            } catch (err) {
                console.error("Error updating existing entry:", err);
            }
        } else {
            // new drop or attempt at repeated drop
            if (currentEntryDocId) {
                // repeated drop - update coords/message/icon
                try {
                    const docRef = doc(db, "posts", postId, "guestbook", currentEntryDocId);
                    await setDoc(
                        docRef,
                        {
                            iconType: ev.dataTransfer.getData("iconType"),
                            name:     nameInput.value.trim() || "anon",
                            message:  textInput.value.trim(),
                            userId:   uid,
                            x:        centeredX,
                            y:        centeredY,
                            createdAt: serverTimestamp()
                        },
                        { merge: true }
                    );

                    textInput.value = "";

                } catch (err) {
                    console.error("Error updating existing entry:", err);
                }
            } else {
                // new drop
                const iconType = ev.dataTransfer.getData("iconType");
                if (!iconType) return;

                const nameVal = nameInput.value.trim() || "anon";
                const msgVal = textInput.value.trim();
                if (!msgVal) {
                    alert("Please write a short message before dropping your icon.");
                    return;
                }

                try {
                    const ref = await addDoc(guestbookColRef, {
                        iconType,
                        name:     nameVal,
                        message:  msgVal,
                        userId:   uid,
                        x:        centeredX,
                        y:        centeredY,
                        createdAt: serverTimestamp()
                    });
                    currentEntryDocId = ref.id;
                    textInput.value = "";
                } catch (err) {
                    console.error("Error creating guestbook entry:", err);
                }
            }
        }
    })
}

// render/delete listener
let unsubscribeGuestbook = null;

function initGuestbookListener() {
    if (unsubscribeGuestbook) unsubscribeGuestbook();

    const postId = getCurrentPostId();
    const guestbookQuery = query(
        collection(db, "posts", postId, "guestbook"),
        orderBy("createdAt", "asc")
    );

    unsubscribeGuestbook = onSnapshot(guestbookQuery, (snapshot) => {
        // clear previous entries
        dropzone.querySelectorAll(".guest-entry").forEach((el) => el.remove());

        const user = auth.currentUser;

        // reset local ID if their entry was deleted
        if (currentEntryDocId) {
            const stillExists = snapshot.docs.some(ds => ds.id === currentEntryDocId);
            if (!stillExists) {
                currentEntryDocId = null;
            }
        }

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const docId = docSnap.id;

            // create a new <div> for each saved icon
            const el = document.createElement("div");
            el.classList.add("guest-entry");
            el.dataset.docId = docId;
            el.dataset.userId = data.userId || "";

            el.style.width  = "40px";
            el.style.height = "40px";
            el.style.position = "absolute";
            el.style.left = `${data.x}px`;
            el.style.top  = `${data.y}px`;

            // draw its shape & color
            switch (data.iconType) {
                case "star":
                    el.style.background = "gold";
                    el.style.clipPath =
                        "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)";
                    break;
                case "heart":
                    el.style.background = "hotpink";
                    el.style.clipPath =
                        "polygon(50% 93%, 0% 46%, 12% 15%, 37% 15%, 50% 40%, 63% 15%, 88% 15%, 100% 46%)";
                    break;
                case "flower":
                    el.style.background = "lavender";
                    el.style.borderRadius = "50%";
                    el.style.boxShadow = "inset 0 0 0 2px purple";
                    break;
                default:
                    el.style.background = "#ccc";
            }

            // make it draggable iff it belongs to the user
            if (user && data.userId === user.uid) {
                el.draggable = true;
                el.dataset.docId = docId;

                el.addEventListener("dragstart", (ev) => {
                    ev.dataTransfer.setData("docId", docId);
                    ev.dataTransfer.setData("iconType", data.iconType);
                });

                el.style.cursor = "grab";
            }

            // make it deletable iff it belongs to the user
            if (user && data.userId === user.uid) {
                el.classList.add("deletable");
                el.title = "Click to delete your own entry";
            } else {
                el.title = "Click to view this message";
            }

            // click handler
            el.addEventListener("click", (ev) => {
                ev.stopPropagation();
                const isOwner = user && data.userId === user.uid;
                if (isOwner) {
                    if (confirm("Delete this entry?")) {
                        const docRef = doc(db, "posts", postId, "guestbook", docId);
                        deleteDoc(docRef).catch((err) => {
                            console.error("delete failed:", err);
                        });
                    }
                } else {
                    showTooltip(ev.clientX, ev.clientY, `${data.name}: ${data.message}`);
                }
            });

            // hover tooltip logic
            el.addEventListener("mouseenter", (ev) => {
                const html =
                    `Name:\u00A0${data.name}\n` +
                    `Message:\u00A0${data.message}`;
                hoverTooltip.textContent = html;

                // measure its true size
                hoverTooltip.style.display    = "block";
                hoverTooltip.style.visibility = "hidden";

                const tooltipW = hoverTooltip.offsetWidth;
                const tooltipH = hoverTooltip.offsetHeight;

                const entryRect = el.getBoundingClientRect();

                // calculate bottom‐center of tooltip from top-center of icon
                const tooltipX = entryRect.left + (entryRect.width / 2) - (tooltipW / 2);
                const tooltipY = entryRect.top  - tooltipH - 6;

                hoverTooltip.style.left = `${tooltipX}px`;
                hoverTooltip.style.top  = `${tooltipY}px`;

                hoverTooltip.style.visibility = "visible";
            });


            el.addEventListener("mouseleave", () => {
                hoverTooltip.style.display = "none";
            });

            dropzone.appendChild(el);

            // if this is the current user doc, remember id
            if (user && data.userId === user.uid) {
                currentEntryDocId = docId;
            }
        });
    });
}

// tooltip helper
function showTooltip(x, y, text) {
    tooltipDiv.textContent = text;
    tooltipDiv.style.left = `${x + 8}px`;
    tooltipDiv.style.top  = x`${y + 8}px`;
    tooltipDiv.classList.add("visible");
    setTimeout(() => {
        tooltipDiv.classList.remove("visible");
    }, 2000);
}

// react to hash changes
window.addEventListener("hashchange", () => {
    initGuestbookListener();
});

// on initial load
window.addEventListener("DOMContentLoaded", () => {
    setupAuthListener();
    setupDragAndDrop();
    initGuestbookListener();
});
