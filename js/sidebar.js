// sidebar.js
// script for piano sidebar visual effects

async function loadSidebar() {
    const placeholder = document.getElementById('sidebar-placeholder');
    try {
        const resp = await fetch('sidebar.html');
        if (!resp.ok) throw new Error(resp.statusText);
        placeholder.innerHTML = await resp.text();
        initSidebarVisuals();
    } catch(err) {
        console.error('Couldn’t load sidebar:', err);
    }
}

loadSidebar();

function initSidebarVisuals() {
    const wrapper = document.querySelector('.sidebar-img-wrapper');
    const overlay = wrapper.querySelector('.hover-overlay');
    const activeOverlay = wrapper.querySelector('.active-overlay');

    let currentPage = window.location.pathname.split('/').pop();

    if (!currentPage || currentPage === '') {
        currentPage = 'index.html';
    }

    const activeBtn = [...wrapper.querySelectorAll('.sidebar-button')]
        .find(btn => btn.getAttribute('href') === currentPage);

    wrapper.querySelectorAll('.sidebar-button').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            const btnRect = btn.getBoundingClientRect();
            const wrapRect = wrapper.getBoundingClientRect();
            overlay.style.top = (btnRect.top - wrapRect.top) + 'px';
            overlay.style.left = (btnRect.left - wrapRect.left) + 'px';
            overlay.style.width = btnRect.width + 'px';
            overlay.style.height = btnRect.height + 'px';
            overlay.style.opacity = 0.2;
        });
        btn.addEventListener('mouseleave', () => {
            overlay.style.opacity = 0;
        });
    });

    if (activeBtn) {
        const btnRect = activeBtn.getBoundingClientRect();
        const wrapRect = wrapper.getBoundingClientRect();

        Object.assign(activeOverlay.style, {
            top: (btnRect.top - wrapRect.top) + 'px',
            left: (btnRect.left - wrapRect.left) + 'px',
            width: btnRect.width + 'px',
            height: btnRect.height + 'px',
            opacity: 0.25
        });
    }
}
