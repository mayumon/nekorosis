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

        // customization screen
        customizeBtn.addEventListener('click', showCustomizePopup);

        // show/hide buttons
        setupGlobalAuth({
            onLogin: () => {
                loginBtn.style.display  = 'none';
                logoutBtn.style.display = '';
            },
            onLogout: () => {
                loginBtn.style.display  = '';
                logoutBtn.style.display = 'none';
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
            <h4>Main</h4>
            <div class="colour-options">${swatchesHTML}</div>
          </div>

          <div class="color-group" data-group="accent1">
            <h4>Accent 1</h4>
            
            <div class="letter-group" data-group="accent1">
              <button class="arrow left">&lt;</button>
              <span class="letter">none</span>
              <button class="arrow right">&gt;</button>
            </div>
            
            <div class="colour-options">${swatchesHTML}</div>
            
          </div>

          <div class="color-group" data-group="accent2">
            <h4>Accent 2</h4>
            
            <div class="letter-group" data-group="accent2">
              <button class="arrow left">&lt;</button>
              <span class="letter">none</span>
              <button class="arrow right">&gt;</button>
            </div>
            
            <div class="colour-options">${swatchesHTML}</div>
            
          </div>

          <div class="letter-group" data-group="emotion">
            <h4>Emotion</h4>
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

    overlay.querySelector('.popup-right').style.position = 'relative';
    overlay.querySelector('.popup-right').style.width    = '200px';
    overlay.querySelector('.popup-right').style.height   = '200px';

    // helper to read prefs
    function readPrefs() {
        const o = overlay;
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

    function renderAvatar() {
        const p = readPrefs();
        const layers = [
            { type:'main',    key:'base',               color:p.mainColour    },
            { type:'accent',  key:p.accent1Letter,      color:p.accent1Colour },
            { type:'accent',  key:p.accent2Letter,      color:p.accent2Colour },
            { type:'emotion', key:p.emotionLetter,      color:'#fff'         },
            { type:'accessory',key:p.accessoryLetter,   color:'#fff'         },
        ];

        const container = overlay.querySelector('.avatar-preview');
        container.innerHTML = '';

        layers.forEach(({type, key, color}) => {
            if (!key || key==='none') return;
            const div = document.createElement('div');
            div.className = 'avatar-layer';
            div.style.color = color;
            const src = `assets/avatar/${type}/${key}.png`;
            div.style.maskImage       = `url("${src}")`;
            div.style.WebkitMaskImage = `url("${src}")`;
            container.appendChild(div);
        });
    }


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
                group==='main' ? 'mainColour'
                    : group==='accent' ? 'accent1Colour'
                        : group==='accent2' ? 'accent2Colour'
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
            group==='accent' ? 'accent1Letter'
                : group==='accent2' ? 'accent2Letter'
                    : group==='emotion' ? 'emotionLetter'
                        : group==='accessory' ? 'accessoryLetter'
                            : null
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

    const triggers = [
        ...overlay.querySelectorAll('.colour-option'),
        ...overlay.querySelectorAll('.letter-group .arrow')
    ];
    triggers.forEach(el => el.addEventListener('click', renderAvatar));

    renderAvatar();


    // save button
    document.body.appendChild(overlay);
    overlay.querySelector('.popup-box').insertAdjacentHTML('beforeend', `
    <div class="popup-footer">
      <button id="save-custom">Save</button>
    </div>
    `);

    // close handlers
    overlay.querySelector('button.close').onclick = () => overlay.remove();
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

    // save preferences
    async function saveUserPrefs(prefs) {
        const user = auth.currentUser;
        if (!user) {
            alert("LOG IN");
            return;
        }
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, { customization: prefs }, { merge: true });
        alert("Saved!");
        overlay.remove();
    }

    // save
    overlay.querySelector('#save-custom').onclick = () => {

        const prefs = {};

        // main colour
        prefs.mainColour = overlay
            .querySelector('.color-group[data-group="main"] .colour-option.selected')
            .dataset.colour;

        // accent
        const a1group = overlay.querySelector('.color-group[data-group="accent"]');
        prefs.accent1Colour = a1group.querySelector('.colour-option.selected').dataset.colour;
        prefs.accent1Letter = overlay.querySelector('.letter-group[data-group="accent"] .letter').textContent;

        // accent2
        const a2group = overlay.querySelector('.color-group[data-group="accent2"]');
        prefs.accent2Colour = a2group.querySelector('.colour-option.selected').dataset.colour;
        prefs.accent2Letter = overlay.querySelector('.letter-group[data-group="accent2"] .letter').textContent;

        // emotion letter
        prefs.emotionLetter = overlay.querySelector('.letter-group[data-group="emotion"] .letter').textContent;

        // accessory letter
        prefs.accessoryLetter = overlay.querySelector('.letter-group[data-group="accessory"] .letter').textContent;

        // finally save
        saveUserPrefs(prefs).catch(err => {
            console.error(err);
            alert("FAILED");
        });
    };
}

