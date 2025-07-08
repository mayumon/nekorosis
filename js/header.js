// header.js
import { setupGlobalAuth, signInWithGoogle, signOutUser } from './auth.js';

fetch('header.html')
    .then(res => res.text())
    .then(html => {
        document.getElementById('header-placeholder').innerHTML = html;

        // now that header is in DOM, grab the buttons:
        const loginBtn  = document.getElementById('google-login-btn');
        const logoutBtn = document.getElementById('logout-btn');

        loginBtn.addEventListener('click', () =>
            signInWithGoogle().catch(console.error)
        );
        logoutBtn.addEventListener('click', () => {
            if (confirm("log out?")) {
                signOutUser().catch(console.error);
            }
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
