// Searchable content index across all pages
const searchIndex = [
    // About / Hero
    {
        title: "About",
        content: "Siddhant Manav Pagare Research Assistant Political Economy Centre for Sustainable Business King's College London MSc Economics and Policy labour economics applied microeconomics causal inference",
        url: "index.html",
        section: "About"
    },

    // Work in Progress
    {
        title: "Does Telework Widen the Abstract-Task Wage Premium? Evidence from Within-Occupation Variation",
        content: "telework abstract task wage premium occupation Master's Thesis",
        url: "research.html",
        section: "Work in progress"
    },

    // Pages
    {
        title: "Research",
        content: "Working papers publications work in progress",
        url: "research.html",
        section: "Page"
    },
    {
        title: "Writing",
        content: "articles op-eds commentary economics policy EPW",
        url: "writing.html",
        section: "Page"
    },
    {
        title: "Resources",
        content: "PhD students research assistants graduate school coding empirical methods general reading advice EconJobMarket PREDOC predoc opportunities RA job market",
        url: "resources.html",
        section: "Page"
    },
    {
        title: "CV",
        content: "curriculum vitae resume",
        url: "cv.pdf",
        section: "Page"
    },
    {
        title: "Contact",
        content: "email LinkedIn X Twitter Bluesky GitHub Google Scholar siddhantpagare2014",
        url: "index.html#contact",
        section: "Page"
    }
];

document.addEventListener('DOMContentLoaded', function() {
    const searchToggle = document.getElementById('searchToggle');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    if (!searchToggle) return;

    searchToggle.addEventListener('click', function() {
        searchOverlay.classList.toggle('active');
        if (searchOverlay.classList.contains('active')) {
            searchInput.focus();
        }
    });

    // Close on Esc
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && searchOverlay.classList.contains('active')) {
            searchOverlay.classList.remove('active');
        }
        // Cmd/Ctrl + K to open search
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            searchOverlay.classList.add('active');
            searchInput.focus();
        }
    });

    // Click outside to close
    searchOverlay.addEventListener('click', function(e) {
        if (e.target === searchOverlay) {
            searchOverlay.classList.remove('active');
        }
    });

    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        searchResults.innerHTML = '';

        if (query.length < 2) {
            return;
        }

        const matches = searchIndex.filter(item => {
            return item.title.toLowerCase().includes(query) ||
                   item.content.toLowerCase().includes(query) ||
                   item.section.toLowerCase().includes(query);
        });

        if (matches.length === 0) {
            searchResults.innerHTML = '<p class="search-no-results">No results found.</p>';
            return;
        }

        matches.forEach(match => {
            const result = document.createElement('a');
            result.href = match.url;
            result.className = 'search-result';
            result.innerHTML = `
                <div class="search-result-section">${match.section}</div>
                <div class="search-result-title">${match.title}</div>
            `;
            searchResults.appendChild(result);
        });
    });
});

// Stamp the footer with the file's last modified date (auto-updates on each push)
document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('site-last-updated');
    if (!el) return;
    const d = new Date(document.lastModified);
    if (isNaN(d)) return;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    el.textContent = `${yyyy}-${mm}-${dd}`;
});
