/* docs-addon.js */
(function () {
    // 0. Add Styles
    const style = document.createElement('style');
    style.innerHTML = `
        .active-nav {
            font-weight: 700 !important;
            border-left: 3px solid #3b82f6;
            padding-left: 8px !important;
            background: rgba(59, 130, 246, 0.1);
        }
        .active-nav a {
            color: #3b82f6 !important;
        }
        .doc-pagination a:hover {
            text-decoration: underline !important;
            filter: brightness(0.8);
        }
    `;
    document.head.appendChild(style);

    // 1. Highlight Active Sidebar Link
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('nav ul li a, nav > h2 > a');
    let currentIndex = -1;
    const allLinks = [];

    navLinks.forEach((link) => {
        allLinks.push(link);
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPath) {
            link.parentElement.classList.add('active-nav');
            currentIndex = allLinks.length - 1;
            // Also handle the H2 case for index.html
            if (link.parentElement.tagName === 'NAV') {
                link.classList.add('active-nav');
            }
        }
    });

    // 2. Add Pagination
    const mainDiv = document.getElementById('main');
    if (mainDiv && currentIndex !== -1 && allLinks.length > 1) {
        const paginationDiv = document.createElement('div');
        paginationDiv.className = 'doc-pagination';
        paginationDiv.style.cssText = 'display: flex; justify-content: space-between; margin-top: 3rem; padding: 1.5rem 30px; border-top: 1px solid #e2e8f0; background: #fafafa; border-radius: 8px;';

        const prev = allLinks[currentIndex - 1];
        const next = allLinks[currentIndex + 1];

        if (prev) {
            const prevBtn = document.createElement('a');
            prevBtn.href = prev.getAttribute('href');
            prevBtn.innerHTML = '← Anterior: ' + prev.innerText;
            prevBtn.style.cssText = 'text-decoration: none; color: #64748b; font-size: 0.9rem; padding: 0.5rem 0;';
            paginationDiv.appendChild(prevBtn);
        } else {
            paginationDiv.appendChild(document.createElement('div'));
        }

        if (next) {
            const nextBtn = document.createElement('a');
            nextBtn.href = next.getAttribute('href');
            nextBtn.innerHTML = 'Siguiente: ' + next.innerText + ' →';
            nextBtn.style.cssText = 'text-decoration: none; color: #3b82f6; font-weight: 600; font-size: 0.9rem; padding: 0.5rem 0;';
            paginationDiv.appendChild(nextBtn);
        }

        mainDiv.appendChild(paginationDiv);
    }
})();
