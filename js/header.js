// header.js
import { setupGlobalAuth, signInWithGoogle, signOutUser } from './auth.js';

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

function showCustomizePopup() {
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
          <img src="assets/images/mumu.png" alt="decorative">
        </div>

      </div>
    </div>
  `;

    document.body.appendChild(overlay);

    // close handlers
    overlay.querySelector('button.close').onclick = () => overlay.remove();
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

    // initialize colour pickers
    overlay.querySelectorAll('.color-group').forEach(groupEl => {
        const swatches = groupEl.querySelectorAll('.colour-option');
        swatches.forEach((swatch, i) => {

            swatch.style.backgroundColor = swatch.dataset.colour;

            // click
            swatch.onclick = () => {
                swatches.forEach(s => s.classList.remove('selected'));
                swatch.classList.add('selected');
                console.log(`picked for ${groupEl.dataset.group}:`, swatch.dataset.colour);
            };

            if (i === 0) swatch.classList.add('selected');
        });
    });


    // initialize letter‐pickers
    overlay.querySelectorAll('.letter-group').forEach(groupEl => {
        const left  = groupEl.querySelector('.arrow.left');
        const right = groupEl.querySelector('.arrow.right');
        const span  = groupEl.querySelector('.letter');

        groupEl.dataset.index = 0;
        const update = () => {
            const idx = parseInt(groupEl.dataset.index,10);
            span.textContent = letters[idx];
            console.log(`letter for ${groupEl.dataset.group}:`, letters[idx]);
        };
        left.onclick = () => {
            let idx = parseInt(groupEl.dataset.index,10) - 1;
            if (idx < 0) idx = letters.length - 1;
            groupEl.dataset.index = idx;
            update();
        };
        right.onclick = () => {
            let idx = parseInt(groupEl.dataset.index,10) + 1;
            if (idx >= letters.length) idx = 0;
            groupEl.dataset.index = idx;
            update();
        };
        update();
    });




}
