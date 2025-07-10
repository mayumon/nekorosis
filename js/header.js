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

    overlay.innerHTML = `
    <div class="popup-box">
      <button class="close">&times;</button>
      <div class="popup-content">
        <div class="popup-left">

          <div class="color-group" data-group="main">
            <h4>Main</h4>
            <div class="colour-options">
              <div class="colour-option" data-colour="#e7dee3"></div>
              <div class="colour-option" data-colour="#70686c"></div>
              <div class="colour-option" data-colour="#373335"></div>
              <div class="colour-option" data-colour="#f1d9bb"></div>
              <div class="colour-option" data-colour="#e7a457"></div>
              <div class="colour-option" data-colour="#5e3e35"></div>
              <div class="colour-option" data-colour="#bce04c"></div>
            </div>
          </div>

          <div class="color-group" data-group="accent1">
            <h4>Accent 1</h4>
            <div class="colour-options">
              <div class="colour-option" data-colour="#e7dee3"></div>
              <div class="colour-option" data-colour="#70686c"></div>
              <div class="colour-option" data-colour="#373335"></div>
              <div class="colour-option" data-colour="#f1d9bb"></div>
              <div class="colour-option" data-colour="#e7a457"></div>
              <div class="colour-option" data-colour="#5e3e35"></div>
              <div class="colour-option" data-colour="#bce04c"></div>
            </div>
          </div>

          <div class="color-group" data-group="accent2">
            <h4>Accent 2</h4>
            <div class="colour-options">
              <div class="colour-option" data-colour="#e7dee3"></div>
              <div class="colour-option" data-colour="#70686c"></div>
              <div class="colour-option" data-colour="#373335"></div>
              <div class="colour-option" data-colour="#f1d9bb"></div>
              <div class="colour-option" data-colour="#e7a457"></div>
              <div class="colour-option" data-colour="#5e3e35"></div>
              <div class="colour-option" data-colour="#bce04c"></div>
            </div>
          </div>

          <h4>Emotion</h4>
          <h4>Accessory</h4>

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

    overlay.querySelectorAll('.color-group').forEach(groupEl => {
        const swatches = groupEl.querySelectorAll('.colour-option');
        swatches.forEach((swatch, i) => {
            swatch.style.backgroundColor = swatch.dataset.colour;
            swatch.onclick = () => {
                swatches.forEach(s => s.classList.remove('selected'));
                swatch.classList.add('selected');
                console.log(`picked for ${groupEl.dataset.group}:`, swatch.dataset.colour);
            };
            if (i === 0) swatch.classList.add('selected');
        });
    });
}
