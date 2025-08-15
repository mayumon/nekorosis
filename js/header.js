// header.js
import { setupGlobalAuth, signInWithGoogle, signOutUser } from './auth.js';
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { auth, db } from './auth.js';

fetch('header.html')
    .then(res => res.text())
    .then(html => {
        document.getElementById('header-placeholder').innerHTML = html;

        const customizeBtn  = document.getElementById('customize-btn');
        const loginBtn  = document.getElementById('login-btn');
        const logoutBtn = document.getElementById('logout-btn');

        loginBtn.addEventListener('click', () =>
            signInWithGoogle()
                .then(() => window.location.reload())
                .catch(console.error)
        );

        logoutBtn.addEventListener('click', () => {
            if (!confirm("log out?")) return;
            signOutUser()
                .then(() => {
                    window.location.reload();
                })
                .catch(console.error);
        });

        customizeBtn.addEventListener('click', showCustomizePopup);
        customizeBtn.style.display = 'none';

        // show/hide buttons
        setupGlobalAuth({
            onLogin: () => {
                loginBtn.style.display  = 'none';
                logoutBtn.style.display = '';
                customizeBtn.style.display = 'flex';
                renderHeaderAvatar(customizeBtn);
            },
            onLogout: () => {
                loginBtn.style.display  = '';
                logoutBtn.style.display = 'none';
                customizeBtn.style.display = 'none';
            }
        });


    })
    .catch(console.error);


// CUSTOMIZE POPUP

async function showCustomizePopup() {

    // load user preferences
    const user = auth.currentUser;
    let saved = {};
    if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists() && snap.data().customization) {
            saved = snap.data().customization;
        }
    }

    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';

    // colour picker setup
    const colours = [
        '#e7dee3',
        '#70686c',
        '#373335',
        '#f1d9bb',
        '#e7a457',
        '#5e3e35',
        '#bce04c'
    ];

    const swatchesHTML = colours.map(c =>
        `<div class="colour-option" data-colour="${c}"></div>`
    ).join('');

    // letter picker setup
    const letters = ['none','a','b','c','d','e','f','g'];

    overlay.innerHTML = `
    <div class="popup-box">
      <button class="close">&times;</button>
      <div class="popup-content">

        <div class="popup-left">

          <div class="color-group" data-group="main">
            <h4>main</h4>
            <div class="colour-options">${swatchesHTML}</div>
          </div>

          <div class="color-group" data-group="accent1">
            <h4>accent 1</h4>
            
            <div class="letter-group" data-group="accent1">
              <button class="arrow left">&lt;</button>
              <span class="letter">none</span>
              <button class="arrow right">&gt;</button>
            </div>
            
            <div class="colour-options">${swatchesHTML}</div>
            
          </div>

          <div class="color-group" data-group="accent2">
            <h4>accent 2</h4>
            
            <div class="letter-group" data-group="accent2">
              <button class="arrow left">&lt;</button>
              <span class="letter">none</span>
              <button class="arrow right">&gt;</button>
            </div>
            
            <div class="colour-options">${swatchesHTML}</div>
            
          </div>

          <div class="letter-group" data-group="emotion">
            <h4>emotion</h4>
            <button class="arrow left">&lt;</button>
            <span class="letter">none</span>
            <button class="arrow right">&gt;</button>
          </div>

          <div class="letter-group" data-group="accessory">
            <h4>Accessory</h4>
            <button class="arrow left">&lt;</button>
            <span class="letter">none</span>
            <button class="arrow right">&gt;</button>
          </div>
        </div>

        <div class="popup-right">
        <div class="avatar-preview"></div>
      </div>

    </div>
    <div class="popup-footer">
      <button id="save-custom">Save</button>
    </div>
  </div>
  `;

    document.body.appendChild(overlay);

    // save button
    const saveBtn = overlay.querySelector('#save-custom');
    saveBtn.addEventListener('click', () => {
        const prefs = {
            mainColour: overlay.querySelector('.color-group[data-group="main"] .selected').dataset.colour,
            accent1Colour: overlay.querySelector('.color-group[data-group="accent1"] .selected').dataset.colour,
            accent1Letter: overlay.querySelector('.letter-group[data-group="accent1"] .letter').textContent,
            accent2Colour: overlay.querySelector('.color-group[data-group="accent2"] .selected').dataset.colour,
            accent2Letter: overlay.querySelector('.letter-group[data-group="accent2"] .letter').textContent,
            emotionLetter: overlay.querySelector('.letter-group[data-group="emotion"] .letter').textContent,
            accessoryLetter: overlay.querySelector('.letter-group[data-group="accessory"] .letter').textContent,
        };
        saveUserPrefs(prefs);
    });

    overlay.querySelector('.popup-right').style.position = 'relative';
    overlay.querySelector('.popup-right').style.width    = '200px';
    overlay.querySelector('.popup-right').style.height   = '200px';

    // initialize colour pickers
    overlay.querySelectorAll('.color-group').forEach(groupEl => {
        const group = groupEl.dataset.group;
        const swatches = groupEl.querySelectorAll('.colour-option');
        swatches.forEach((sw, i) => {
            sw.style.backgroundColor = sw.dataset.colour;
            sw.onclick = () => {
                swatches.forEach(x=>x.classList.remove('selected'));
                sw.classList.add('selected');
            };

            // pick saved colour or default
            const want = saved[
                group === 'main' ? 'mainColour'
                    : group === 'accent1'? 'accent1Colour'
                        : group === 'accent2'? 'accent2Colour'
                            : null
                ];

            if (want) {
                const match = [...swatches].find(x=>x.dataset.colour===want);
                if (match) match.classList.add('selected');
                else if (i===0) sw.classList.add('selected');
            } else if (i===0) {
                sw.classList.add('selected');
            }
        });
    });

    // initialize letter‐pickers
    overlay.querySelectorAll('.letter-group').forEach(groupEl => {
        const group = groupEl.dataset.group;
        const left = groupEl.querySelector('.arrow.left');
        const right= groupEl.querySelector('.arrow.right');
        const span = groupEl.querySelector('.letter');

        // pick saved colour or default
        const savedLetter = saved[
            group === 'accent1' ? 'accent1Letter'
                : group === 'accent2' ? 'accent2Letter'
                    : group === 'emotion' ? 'emotionLetter'
                        : group === 'accessory'? 'accessoryLetter'
                            :                       null
            ] || 'none';
        let idx = letters.indexOf(savedLetter);
        if (idx<0) idx = 0;
        groupEl.dataset.index = idx;
        const update = () => span.textContent = letters[ +groupEl.dataset.index ];
        left.onclick = () => {
            idx = (idx - 1 + letters.length) % letters.length;
            groupEl.dataset.index = idx; update();
        };
        right.onclick = () => {
            idx = (idx + 1) % letters.length;
            groupEl.dataset.index = idx; update();
        };
        update();
    });

    const preview = overlay.querySelector('.avatar-preview');
    drawAvatar(preview, readPrefs(overlay));

    const triggers = [
        ...overlay.querySelectorAll('.colour-option'),
        ...overlay.querySelectorAll('.letter-group .arrow')
    ];
    triggers.forEach(el => {
        el.addEventListener('click', () => {
            const prefs = readPrefs(overlay);
            drawAvatar(preview, prefs);
        });
    });

    // close handlers
    overlay.querySelector('button.close').onclick = () => overlay.remove();
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

    // helper: save preferences
    async function saveUserPrefs(prefs) {
        const user = auth.currentUser;
        if (!user) {
            alert("youre not logged in. how did you even get here?");
            return;
        }

        const userRef = doc(db, "users", user.uid);
        try {
            // disable the save button to prevent double-submits
            const saveBtn = overlay.querySelector('#save-custom');
            saveBtn.disabled = true;

            await setDoc(userRef, { customization: prefs }, { merge: true });
            alert("avatar saved!");
            overlay.remove();

        } catch (err) {
            console.error("error saving:", err);
            alert("failed to save: " + err.message);

        } finally {
            // re-enable the button in case of error
            const saveBtn = overlay.querySelector('#save-custom');
            if (saveBtn) saveBtn.disabled = false;
        }
    }
}

function drawAvatar(container, { mainColour, accent1Colour, accent1Letter, accent2Colour, accent2Letter, emotionLetter, accessoryLetter }) {
    container.innerHTML = '';
    const layers = [
        { type: 'main',      key: 'base',             color: mainColour      },
        { type: 'accent',    key: accent1Letter,      color: accent1Colour   },
        { type: 'accent',    key: accent2Letter,      color: accent2Colour   },
        { type: 'emotion',   key: emotionLetter,      color: null            },
        { type: 'accessory', key: accessoryLetter,    color: null            },
    ];
    layers.forEach(({type,key,color}) => {
        if (!key || key === 'none') return;
        const folder = (type === 'accent') ? 'accent' : type;
        const src    = `assets/avatar/${folder}/${key}.png`;
        if (type === 'emotion' || type === 'accessory') {
            const img = document.createElement('img');
            img.className = 'avatar-layer';
            img.src = src;
            container.appendChild(img);
        } else {
            const div = document.createElement('div');
            div.className = 'avatar-layer masked';
            div.style.color = color;
            div.style.maskImage = `url("${src}")`;
            div.style.webkitMaskImage = div.style.maskImage;
            container.appendChild(div);
        }
    });
}

async function renderHeaderAvatar(btn) {
    const user = auth.currentUser;
    // default prefs:
    let prefs = {
        mainColour:      '#e7dee3',
        accent1Colour:   '#373335',
        accent1Letter:   'none',
        accent2Colour:   '#e7a457',
        accent2Letter:   'none',
        emotionLetter:   'a',
        accessoryLetter: 'none'
    };

    if (user) {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists() && snap.data().customization) {
            prefs = snap.data().customization;
        }
    }

    drawAvatar(btn, prefs);
}

// helper to read prefs
function readPrefs(o) {
    return {
        mainColour:      o.querySelector('.color-group[data-group="main"] .selected').dataset.colour,
        accent1Colour:   o.querySelector('.color-group[data-group="accent1"] .selected').dataset.colour,
        accent1Letter:   o.querySelector('.letter-group[data-group="accent1"] .letter').textContent,
        accent2Colour:   o.querySelector('.color-group[data-group="accent2"] .selected').dataset.colour,
        accent2Letter:   o.querySelector('.letter-group[data-group="accent2"] .letter').textContent,
        emotionLetter:   o.querySelector('.letter-group[data-group="emotion"] .letter').textContent,
        accessoryLetter: o.querySelector('.letter-group[data-group="accessory"] .letter').textContent,
    };
}