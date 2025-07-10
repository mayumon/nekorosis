// header.js
import { setupGlobalAuth, signInWithGoogle, signOutUser } from './auth.js';

fetch('header.html')
    .then(res => res.text())
    .then(html => {
        document.getElementById('header-placeholder').innerHTML = html;

        const helloBtn  = document.getElementById('hello-btn');
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










        // HELLO WORLD

        helloBtn.addEventListener('click', () => {

            // build overlay
            const overlay = document.createElement('div');
            overlay.className = 'popup-overlay';
            overlay.innerHTML = `
        <div class="popup-box">
          <button class="close">&times;</button>
          <h2>Hello World!</h2>
          <p>wowow cant wait until things are here.</p>
        </div>
      `;
            document.body.appendChild(overlay);

            // close handler
            overlay.querySelector('button.close').addEventListener('click', () => {
                overlay.remove();
            });
            // close on outside‐click
            overlay.addEventListener('click', e => {
                if (e.target === overlay) overlay.remove();
            });
        });













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
