/* Site behaviour: theme, navigation, search, filters, reveal, contents bar, copy email.
   Plain JavaScript, no dependencies. */
(function () {
    "use strict";

    var PAGES = [
        { url: "index.html", name: "Home" },
        { url: "research.html", name: "Research" },
        { url: "writing.html", name: "Writing" },
        { url: "resources.html", name: "Public Goods" }
    ];

    function $(sel, root) { return (root || document).querySelector(sel); }
    function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
    function storage(get, key, val) {
        try {
            if (get) { return window.localStorage.getItem(key); }
            window.localStorage.setItem(key, val);
        } catch (e) { return null; }
    }

    /* ---------- Theme ---------- */
    function initTheme() {
        var btn = $("[data-theme-toggle]");
        if (!btn) { return; }
        btn.addEventListener("click", function () {
            var root = document.documentElement;
            var current = root.getAttribute("data-theme");
            var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
            var isDark = current === "dark" || (!current && prefersDark);
            var next = isDark ? "light" : "dark";
            root.setAttribute("data-theme", next);
            storage(false, "theme", next);
        });
    }

    /* ---------- Mobile navigation ---------- */
    function initNav() {
        var btn = $("[data-menu-toggle]");
        var nav = $("#site-nav");
        if (!btn || !nav) { return; }
        btn.addEventListener("click", function () {
            var open = nav.classList.toggle("open");
            btn.setAttribute("aria-expanded", open ? "true" : "false");
        });
    }

    /* ---------- Site search ---------- */
    var index = null, indexing = null;

    function textOf(el) { return (el.textContent || "").replace(/\s+/g, " ").trim(); }

    function indexDocument(doc, page) {
        var out = [];
        var main = doc.querySelector("main") || doc.body;
        var title = textOf(doc.querySelector("h1")) || page.name;
        var desc = doc.querySelector('meta[name="description"]');
        out.push({ page: page.name, url: page.url, title: title, body: desc ? desc.getAttribute("content") : "", weight: 1 });
        $$("section[id]", main).forEach(function (sec) {
            var h = sec.querySelector("h2");
            if (!h) { return; }
            var body = textOf(sec).slice(0, 600);
            out.push({ page: page.name, url: page.url + "#" + sec.id, title: textOf(h), body: body, weight: 1 });
        });
        $$("[data-index]", main).forEach(function (el) {
            var h = el.querySelector("h3, h2, .t");
            var sec = el.closest("section[id]");
            var anchor = el.id ? el.id : (sec ? sec.id : "");
            out.push({
                page: page.name,
                url: page.url + (anchor ? "#" + anchor : ""),
                title: h ? textOf(h) : textOf(el).slice(0, 80),
                body: textOf(el).slice(0, 700),
                keywords: el.getAttribute("data-index") || "",
                weight: 2
            });
        });
        return out;
    }

    function buildIndex() {
        if (indexing) { return indexing; }
        var isFile = location.protocol === "file:";
        var current = location.pathname.split("/").pop() || "index.html";
        indexing = Promise.all(PAGES.map(function (page) {
            if (page.url === current) { return Promise.resolve(indexDocument(document, page)); }
            if (isFile) { return Promise.resolve([]); }
            return fetch(page.url, { cache: "force-cache" })
                .then(function (r) { return r.ok ? r.text() : ""; })
                .then(function (html) {
                    if (!html) { return []; }
                    var doc = new DOMParser().parseFromString(html, "text/html");
                    return indexDocument(doc, page);
                })
                .catch(function () { return []; });
        })).then(function (parts) {
            index = [].concat.apply([], parts);
            return index;
        });
        return indexing;
    }

    function escapeHtml(s) {
        return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
    }

    function highlight(text, terms) {
        var safe = escapeHtml(text);
        terms.forEach(function (t) {
            if (!t) { return; }
            var re = new RegExp("(" + t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
            safe = safe.replace(re, "<mark>$1</mark>");
        });
        return safe;
    }

    function snippet(body, terms) {
        var lower = body.toLowerCase();
        var pos = -1;
        for (var i = 0; i < terms.length; i++) {
            pos = lower.indexOf(terms[i]);
            if (pos >= 0) { break; }
        }
        if (pos < 0) { return body.slice(0, 140); }
        var start = Math.max(0, pos - 60);
        var end = Math.min(body.length, pos + 110);
        return (start > 0 ? "…" : "") + body.slice(start, end) + (end < body.length ? "…" : "");
    }

    function search(query) {
        var terms = query.toLowerCase().split(/\s+/).filter(Boolean);
        if (!terms.length || !index) { return []; }
        var hits = [];
        index.forEach(function (item) {
            var t = item.title.toLowerCase();
            var b = (item.body + " " + (item.keywords || "")).toLowerCase();
            var score = 0;
            terms.forEach(function (term) {
                if (t.indexOf(term) >= 0) { score += 6; }
                if (b.indexOf(term) >= 0) { score += 2; }
            });
            var allMatch = terms.every(function (term) { return t.indexOf(term) >= 0 || b.indexOf(term) >= 0; });
            if (allMatch && score > 0) { hits.push({ item: item, score: score * item.weight }); }
        });
        hits.sort(function (a, b) { return b.score - a.score; });
        var seen = {}, out = [];
        hits.forEach(function (h) {
            var key = h.item.url + "|" + h.item.title;
            if (seen[key]) { return; }
            seen[key] = true;
            out.push(h.item);
        });
        return out.slice(0, 14);
    }

    function initSearch() {
        var dialog = $("#search-dialog");
        var input = $("#search-input");
        var results = $("#search-results");
        var openers = $$("[data-search-open]");
        if (!dialog || !input || !results) { return; }
        var activeIdx = -1;

        function open() {
            dialog.classList.add("open");
            dialog.setAttribute("aria-hidden", "false");
            document.body.style.overflow = "hidden";
            input.value = "";
            renderHint();
            setTimeout(function () { input.focus(); }, 10);
            buildIndex();
        }
        function close() {
            dialog.classList.remove("open");
            dialog.setAttribute("aria-hidden", "true");
            document.body.style.overflow = "";
            activeIdx = -1;
        }
        function renderHint() {
            results.innerHTML = '<div class="search-hint">Type to search papers, writing, links and pages. Use <kbd>↑</kbd><kbd>↓</kbd> to move and <kbd>Enter</kbd> to open.</div>';
        }
        function render(query) {
            var terms = query.toLowerCase().split(/\s+/).filter(Boolean);
            var hits = search(query);
            activeIdx = -1;
            if (!query.trim()) { renderHint(); return; }
            if (!hits.length) {
                results.innerHTML = '<div class="search-empty">Nothing found for “' + escapeHtml(query) + '”.</div>';
                return;
            }
            var html = "", lastPage = "";
            hits.forEach(function (h) {
                if (h.page !== lastPage) { html += '<div class="search-group">' + escapeHtml(h.page) + "</div>"; lastPage = h.page; }
                html += '<a class="search-hit" href="' + h.url + '"><div class="t">' + highlight(h.title, terms) + '</div><div class="s">' + highlight(snippet(h.body, terms), terms) + "</div></a>";
            });
            results.innerHTML = html;
        }
        function move(delta) {
            var hits = $$(".search-hit", results);
            if (!hits.length) { return; }
            activeIdx = (activeIdx + delta + hits.length) % hits.length;
            hits.forEach(function (h, i) { h.classList.toggle("active", i === activeIdx); });
            hits[activeIdx].scrollIntoView({ block: "nearest" });
        }

        openers.forEach(function (b) { b.addEventListener("click", open); });
        dialog.addEventListener("click", function (e) { if (e.target === dialog) { close(); } });
        $$("[data-search-close]", dialog).forEach(function (b) { b.addEventListener("click", close); });
        document.addEventListener("keydown", function (e) {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); dialog.classList.contains("open") ? close() : open(); return; }
            if (!dialog.classList.contains("open")) { return; }
            if (e.key === "Escape") { close(); }
            if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
            if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
            if (e.key === "Enter") {
                var active = $(".search-hit.active", results) || $(".search-hit", results);
                if (active) { window.location.href = active.getAttribute("href"); close(); }
            }
        });
        var timer = null;
        input.addEventListener("input", function () {
            var q = input.value;
            clearTimeout(timer);
            timer = setTimeout(function () {
                buildIndex().then(function () { if (input.value === q) { render(q); } });
            }, 60);
        });
    }

    /* ---------- Filters: chips and text ---------- */
    function initFilters() {
        $$("[data-filter-group]").forEach(function (group) {
            var targetSel = group.getAttribute("data-filter-group");
            var items = $$(targetSel);
            var empty = $(group.getAttribute("data-filter-empty") || "#no-such-element");
            var chips = $$(".chip", group);
            chips.forEach(function (chip) {
                var type = chip.getAttribute("data-type");
                var count = type === "all" ? items.length : items.filter(function (i) { return (i.getAttribute("data-type") || "").split(" ").indexOf(type) >= 0; }).length;
                var c = chip.querySelector(".count");
                if (c) { c.textContent = count; }
            });
            group.addEventListener("click", function (e) {
                var chip = e.target.closest(".chip");
                if (!chip) { return; }
                chips.forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
                var type = chip.getAttribute("data-type");
                var shown = 0;
                items.forEach(function (item) {
                    var types = (item.getAttribute("data-type") || "").split(" ");
                    var show = type === "all" || types.indexOf(type) >= 0;
                    item.hidden = !show;
                    if (show) { shown++; }
                });
                if (empty) { empty.classList.toggle("show", shown === 0); }
            });
        });

        $$("[data-filter-input]").forEach(function (input) {
            var targetSel = input.getAttribute("data-filter-input");
            var items = $$(targetSel);
            var groups = $$(input.getAttribute("data-filter-groups") || "#no-such-element");
            var empty = $(input.getAttribute("data-filter-empty") || "#no-such-element");
            input.addEventListener("input", function () {
                var q = input.value.toLowerCase().trim();
                var shown = 0;
                items.forEach(function (item) {
                    var hay = (item.textContent + " " + (item.getAttribute("data-index") || "")).toLowerCase();
                    var show = !q || hay.indexOf(q) >= 0;
                    item.hidden = !show;
                    if (show) { shown++; }
                });
                groups.forEach(function (g) {
                    var visible = $$(targetSel, g).some(function (i) { return !i.hidden; });
                    g.hidden = !visible;
                });
                if (empty) { empty.classList.toggle("show", shown === 0); }
            });
        });
    }

    /* ---------- Reveal on scroll ---------- */
    function initReveal() {
        var els = $$(".reveal");
        if (!els.length) { return; }
        if (!("IntersectionObserver" in window) || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
            els.forEach(function (el) { el.classList.add("in"); });
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
            });
        }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
        els.forEach(function (el) { io.observe(el); });
    }

    /* ---------- Contents bar active state ---------- */
    function initContents() {
        var bar = $(".contents-bar");
        if (!bar || !("IntersectionObserver" in window)) { return; }
        var links = $$("a[href^='#']", bar);
        var sections = links.map(function (a) { return $(a.getAttribute("href")); }).filter(Boolean);
        if (!sections.length) { return; }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (!en.isIntersecting) { return; }
                links.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id); });
            });
        }, { rootMargin: "-40% 0px -55% 0px", threshold: 0 });
        sections.forEach(function (s) { io.observe(s); });
    }

    /* ---------- Copy to clipboard ---------- */
    function initCopy() {
        $$("[data-copy]").forEach(function (btn) {
            btn.addEventListener("click", function () {
                var value = btn.getAttribute("data-copy");
                var label = btn.textContent;
                function done() {
                    btn.textContent = "Copied";
                    btn.classList.add("done");
                    setTimeout(function () { btn.textContent = label; btn.classList.remove("done"); }, 1600);
                }
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(value).then(done).catch(function () {});
                } else {
                    var ta = document.createElement("textarea");
                    ta.value = value; document.body.appendChild(ta); ta.select();
                    try { document.execCommand("copy"); done(); } catch (e) {}
                    document.body.removeChild(ta);
                }
            });
        });
    }

    /* ---------- Expand all (accordions) ---------- */
    function initExpandAll() {
        $$("[data-expand-all]").forEach(function (btn) {
            var sel = btn.getAttribute("data-expand-all");
            btn.addEventListener("click", function () {
                var items = $$(sel);
                var anyClosed = items.some(function (d) { return !d.open; });
                items.forEach(function (d) { d.open = anyClosed; });
                btn.textContent = anyClosed ? "Collapse all" : "Expand all";
            });
        });
    }

    /* ---------- Footer stamp ---------- */
    function initStamp() {
        var el = $("#site-last-updated");
        if (!el) { return; }
        var d = new Date(document.lastModified);
        if (isNaN(d)) { return; }
        var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        el.textContent = d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
    }

    document.addEventListener("DOMContentLoaded", function () {
        initTheme(); initNav(); initSearch(); initFilters(); initReveal(); initContents(); initCopy(); initExpandAll(); initStamp();
    });
})();
