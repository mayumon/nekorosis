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

    // create overlay
    const overlay = document.createElement('div');
    overlay.className = 'popup-overlay';

    overlay.innerHTML = `
    <div class="popup-box">
      <button class="close">&times;</button>
      <div class="popup-content">
        <div class="popup-left">
          <h4>main</h4>
          <h4>accent 1</h4>
          <h4>accent 2</h4>
          <h4>emotion</h4>
          <h4>accessory</h4>
        </div>
        <div class="popup-right">
          <img src="assets/images/mumu.png" alt="decorative">
        </div>
      </div>
    </div>
  `;

    document.body.appendChild(overlay);

    // wire up close button
    overlay.querySelector('button.close').addEventListener('click', () => overlay.remove());
    // also close if you click outside the box
    overlay.addEventListener('click', e => {
        if (e.target === overlay) overlay.remove();
    });
}