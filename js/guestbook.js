// guestbook.js

import { collection, addDoc, setDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { auth, db, setupGlobalAuth, signInWithGoogle } from "./auth.js";

// cache dom elements
const loginPromptGB = document.getElementById("guestbook-login-prompt");
const loginBtnGB    = document.getElementById("guestbook-google-login-btn");
const guestbookUI   = document.getElementById("guestbook-ui");

const nameInput     = document.getElementById("guest-name");
const textInput     = document.getElementById("guest-text");
const iconsContainer= document.getElementById("guestbook-icons");
const dropzone      = document.getElementById("guestbook-dropzone");

let selectedIconId = null; // will be set on click

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

async function saveEntry(x, y, iconId) {
    const path = ["posts", getCurrentPostId(), "guestbook"];
    const docData = {
        name:      nameInput.value.trim() || "anon",
        message:   textInput.value.trim(),
        userId:    auth.currentUser.uid,
        x, y,
        iconId,
        createdAt: serverTimestamp()
    };

    if (currentEntryDocId) {
        // update existing
        await setDoc(doc(db, ...path, currentEntryDocId), docData, { merge: true });

    } else {
        // new
        const ref = await addDoc(collection(db, ...path), docData);
        currentEntryDocId = ref.id;
    }

    // clear your text field if you like
    textInput.value = "";
}

// drag and drop logic
function setupDragAndDrop() {
    // mark icons as draggable
    iconsContainer.querySelectorAll(".guestbook-icon").forEach((iconEl) => {

        iconEl.addEventListener("dragstart", (ev) => {

            // store icon name
            ev.dataTransfer.setData("iconId", iconEl.dataset.icon);

            // store docid
            const docId = iconEl.dataset.docId || "";
            ev.dataTransfer.setData("docId", docId);
        });
    });

    // allow drop on dropzone
    dropzone.addEventListener("dragover", (ev) => {
        ev.preventDefault();
    });

    dropzone.addEventListener("drop", async ev => {
        ev.preventDefault();
        const rect = dropzone.getBoundingClientRect();
        const x = ev.clientX - rect.left - 20;
        const y = ev.clientY - rect.top  - 20;
        const user = auth.currentUser;
        if (!user) return console.error("not signed in");

        // try to get an iconId from the drag or from the picker
        const draggedIcon = ev.dataTransfer.getData("iconId");
        const iconId      = draggedIcon || selectedIconId;
        if (!iconId)     return alert("Pick an icon first!");

        await saveEntry(x, y, iconId);
    });
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

                const el = document.createElement('div');
                el.classList.add('guest-entry');
                el.style.position = 'absolute';
                el.style.left = data.x + 'px';
                el.style.top  = data.y + 'px';

                const iconImg = document.createElement('img');
                iconImg.src = `assets/icons/${data.iconId || 1}.gif`;
                iconImg.style.cssText = 'width:30px;height:30px;pointer-events:none;';
                el.appendChild(iconImg);

            // make it draggable iff it belongs to the user
            if (user && data.userId === user.uid) {
                el.draggable = true;
                el.dataset.docId = docId;

                el.addEventListener("dragstart", (ev) => {
                    ev.dataTransfer.setData("docId", docId);
                    ev.dataTransfer.setData("iconId", data.iconId);
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
    tooltipDiv.style.top  = `${y + 8}px`;
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
    setupDragAndDrop();
    initGuestbookListener();
});

setupGlobalAuth({
    onLogin:  () => { loginPromptGB.style.display = "none"; guestbookUI.style.display = "block"; },
    onLogout: () => { loginPromptGB.style.display = "block"; guestbookUI.style.display = "none"; }
});


// ================================
// icon-picker
// ================================

const openPickerBtn   = document.getElementById('open-icon-picker');
const closePickerBtn  = document.getElementById('close-icon-picker');
const overlay         = document.getElementById('icon-picker-overlay');
const grid            = document.getElementById('icon-grid');
const preview         = document.getElementById('selected-icon-preview');

// generate 144 icons
for (let i = 1; i <= 144; i++) {
    const img = document.createElement('img');
    img.src = `assets/icons/${i}.gif`;
    img.dataset.iconId = i;
    img.style.cssText = 'width:32px;height:32px;cursor:pointer;';

    img.addEventListener('click', () => {
        selectedIconId = img.dataset.iconId;
        preview.src = img.src;
        preview.style.visibility = 'visible';
        overlay.style.display = 'none';

        // make preview draggable from now on:
        preview.draggable = true;
        preview.dataset.iconId = selectedIconId;
        preview.addEventListener('dragstart', ev => {
            ev.dataTransfer.setData('iconId', selectedIconId);
        });
    });

    grid.appendChild(img);
}

// open
openPickerBtn.addEventListener('click', () => {
    overlay.style.display = 'flex';
});

// close
closePickerBtn.addEventListener('click', () => {
    overlay.style.display = 'none';
});

document.getElementById("guestbook-google-login-btn")
    .addEventListener("click", () => signInWithGoogle().catch(console.error));






