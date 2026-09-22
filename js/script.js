/* ==========================================================================
   sumit-sah.com.np — behaviour
   Small, independent modules. Everything degrades: the page reads fine with
   JS off, and every animation respects prefers-reduced-motion.
   ========================================================================== */

// Formspree endpoint used by the contact form and the resource recommendation form.
// Both forms also carry it in their action attribute so they work without JS.
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xwleyvog';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const ACCENT_RGB = '139, 140, 248';

const svgIcon = (id, className = 'icon') =>
    `<svg class="${className}" aria-hidden="true"><use href="#${id}"/></svg>`;

/* --------------------------------------------------------------------------
   Header: elevated state on scroll, mobile menu, active section indicator
   -------------------------------------------------------------------------- */
function initHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Mobile overlay menu
    const toggle = header.querySelector('.nav-toggle');
    const menu = document.getElementById('menu');
    if (toggle && menu) {
        const setOpen = (open) => {
            menu.classList.toggle('is-open', open);
            menu.inert = !open;
            toggle.setAttribute('aria-expanded', String(open));
            toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            document.body.classList.toggle('is-locked', open);
            if (open) {
                menu.querySelector('a')?.focus({ preventScroll: true });
            } else if (document.activeElement && menu.contains(document.activeElement)) {
                toggle.focus({ preventScroll: true });
            }
        };

        toggle.addEventListener('click', () => setOpen(!menu.classList.contains('is-open')));
        menu.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && menu.classList.contains('is-open')) setOpen(false);
        });
        window.matchMedia('(min-width: 901px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
    }

    // Active section indicator (desktop nav + overlay menu share the same hrefs)
    const links = document.querySelectorAll('.nav__link[href^="#"], .menu__link[href^="#"]');
    const sections = [...links]
        .map((a) => document.querySelector(a.getAttribute('href')))
        .filter((el, i, arr) => el && arr.indexOf(el) === i);
    if (!sections.length || !('IntersectionObserver' in window)) return;

    const setCurrent = (id) => {
        links.forEach((a) => {
            const isCurrent = a.getAttribute('href') === `#${id}`;
            if (isCurrent) a.setAttribute('aria-current', 'true');
            else a.removeAttribute('aria-current');
        });
    };

    const hero = document.getElementById('top');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            setCurrent(entry.target === hero ? '' : entry.target.id);
        });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

    sections.forEach((s) => observer.observe(s));
    if (hero) observer.observe(hero);
}

/* --------------------------------------------------------------------------
   Reveal on scroll
   -------------------------------------------------------------------------- */
function initReveal() {
    const items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;

    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
        items.forEach((el) => el.classList.add('is-visible'));
        return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
        });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });

    items.forEach((el) => observer.observe(el));
}

/* --------------------------------------------------------------------------
   Hero: dot lattice. A slow luminance wave drifts across a grid of points and
   the pointer gently lifts nearby dots. Static (one draw) under reduced motion.
   -------------------------------------------------------------------------- */
function initHeroField() {
    const canvas = document.querySelector('.hero__field');
    const hero = canvas?.closest('.hero');
    if (!canvas || !hero) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const GAP = window.innerWidth < 720 ? 30 : 26;
    const REACH = 170;
    let width = 0, height = 0, dots = [];
    let pointer = { x: -1e4, y: -1e4 };
    let raf = 0, last = 0, visible = true;
    const animate = !reduceMotion.matches;

    const build = () => {
        const rect = hero.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = rect.width; height = rect.height;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        dots = [];
        for (let y = GAP; y < height; y += GAP) {
            for (let x = GAP; x < width; x += GAP) dots.push({ x, y });
        }
        draw(performance.now());
    };

    const draw = (t) => {
        ctx.clearRect(0, 0, width, height);
        for (const d of dots) {
            const dx = d.x - pointer.x, dy = d.y - pointer.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const prox = dist < REACH ? 1 - dist / REACH : 0;
            const wave = animate ? (Math.sin(t * 0.0006 + (d.x * 0.7 + d.y * 0.5) * 0.011) + 1) / 2 : 0.5;
            const alpha = 0.1 + wave * 0.18 + prox * 0.6;
            const r = 1.1 + prox * 1.5 + wave * 0.3;
            ctx.fillStyle = prox > 0 ? `rgba(${ACCENT_RGB}, ${alpha})` : `rgba(205, 205, 215, ${alpha})`;
            ctx.beginPath();
            ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    const loop = (t) => {
        raf = requestAnimationFrame(loop);
        if (t - last < 33) return; // ~30fps is plenty for a slow wave
        last = t;
        draw(t);
    };

    const start = () => { if (animate && visible && !raf) raf = requestAnimationFrame(loop); };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };

    hero.addEventListener('pointermove', (e) => {
        const rect = hero.getBoundingClientRect();
        pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
        if (!animate) draw(performance.now());
    });
    hero.addEventListener('pointerleave', () => {
        pointer = { x: -1e4, y: -1e4 };
        if (!animate) draw(performance.now());
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(build, 120);
    });

    if ('IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            visible ? start() : stop();
        }).observe(hero);
    }
    document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

    build();
    start();
}

/* --------------------------------------------------------------------------
   Case study dialog — content comes from the card and its <template>
   -------------------------------------------------------------------------- */
function initCaseStudy() {
    const dialog = document.getElementById('case-study');
    if (!dialog || typeof dialog.showModal !== 'function') return;

    const slot = (name) => dialog.querySelector(`[data-slot="${name}"]`);
    const cover = dialog.querySelector('.case-study__cover img');
    const scroller = dialog.querySelector('.case-study__scroll');
    let lastTrigger = null;

    const open = (card, trigger) => {
        const text = (sel) => card.querySelector(sel)?.textContent.trim() || '';
        slot('num').textContent = text('.project__num');
        slot('title').textContent = text('.project__title');
        slot('kicker').textContent = text('.project__kicker') || text('.project__desc');

        const img = card.querySelector('.project__media img');
        if (img) { cover.src = img.currentSrc || img.src; cover.alt = img.alt; }

        const facts = slot('facts');
        const main = slot('main');
        facts.replaceChildren();
        main.replaceChildren();
        const template = card.querySelector('template.project__detail');
        if (template) {
            const fragment = template.content.cloneNode(true);
            const factList = fragment.querySelector('.facts');
            if (factList) facts.appendChild(factList);
            main.appendChild(fragment);
        } else {
            const p = document.createElement('p');
            p.textContent = text('.project__desc');
            main.appendChild(p);
        }

        slot('stack').replaceChildren(...[...card.querySelectorAll('.project__stack li')].map((li) => {
            const pill = document.createElement('li');
            pill.className = 'pill';
            pill.textContent = li.textContent.trim();
            return pill;
        }));

        slot('links').replaceChildren(...[...card.querySelectorAll('.project__links a')].map((a, i) => {
            const link = a.cloneNode(true);
            link.className = i === 0 ? 'btn btn--primary btn--sm' : 'btn btn--ghost btn--sm';
            return link;
        }));

        lastTrigger = trigger;
        dialog.showModal();
        scroller.scrollTop = 0;
        document.body.classList.add('is-locked');
    };

    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-case-study]');
        const card = trigger?.closest('.project');
        if (trigger && card) open(card, trigger);
    });

    dialog.addEventListener('click', (e) => {
        if (e.target === dialog || e.target.closest('[data-close]')) dialog.close();
    });

    dialog.addEventListener('close', () => {
        document.body.classList.remove('is-locked');
        lastTrigger?.focus({ preventScroll: true });
    });
}

/* --------------------------------------------------------------------------
   Forms (Formspree)
   -------------------------------------------------------------------------- */
async function submitToFormspree(form) {
    const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
    });
    if (!response.ok) throw new Error('Form submission failed');
}

function validateRequired(form) {
    let valid = true;
    form.querySelectorAll('input[required], textarea[required], select[required]').forEach((field) => {
        const empty = !field.value.trim();
        field.classList.toggle('error', empty);
        if (empty) valid = false;
    });
    return valid;
}

function showFormError(form, message) {
    let el = form.querySelector('.form-error-message');
    if (!el) {
        el = document.createElement('p');
        el.className = 'form-error-message';
        el.setAttribute('role', 'alert');
        form.appendChild(el);
    }
    el.textContent = message;
}

function initContactForm() {
    const form = document.querySelector('.contact-form');
    if (!form) return;

    const submit = form.querySelector('button[type="submit"]');
    const submitLabel = submit ? submit.innerHTML : '';

    form.querySelectorAll('input, textarea').forEach((field) => {
        field.addEventListener('input', () => field.classList.remove('error'));
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateRequired(form)) {
            form.querySelector('.error')?.focus();
            return;
        }

        form.querySelector('.form-error-message')?.remove();
        if (submit) { submit.disabled = true; submit.textContent = 'Sending…'; }

        try {
            await submitToFormspree(form);
            form.replaceChildren();
            form.insertAdjacentHTML('beforeend', `
                <div class="success-message" role="status">
                    ${svgIcon('i-check')}
                    <h3>Message sent.</h3>
                    <p>Thanks for reaching out — I'll get back to you as soon as I can, usually within 24–48 hours.</p>
                </div>
            `);
        } catch {
            showFormError(form, "Something went wrong sending your message. Please try again, or email me directly at sumitsah6511@gmail.com.");
            if (submit) { submit.disabled = false; submit.innerHTML = submitLabel; }
        }
    });
}

/* --------------------------------------------------------------------------
   Copy-to-clipboard buttons
   -------------------------------------------------------------------------- */
function initCopyButtons() {
    const buttons = document.querySelectorAll('[data-copy]');
    if (!buttons.length || !navigator.clipboard) return;

    buttons.forEach((btn) => {
        const label = btn.querySelector('span');
        const original = btn.innerHTML;
        btn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(btn.dataset.copy);
                btn.classList.add('is-copied');
                btn.innerHTML = `${svgIcon('i-check')}<span>Copied</span>`;
                setTimeout(() => { btn.classList.remove('is-copied'); btn.innerHTML = original; }, 2000);
            } catch {
                if (label) label.textContent = 'Copy failed';
            }
        });
    });
}

/* --------------------------------------------------------------------------
   Stack ↔ Work: a pill that matches a project's stack becomes a button with a
   count; clicking it lists the projects, and each link jumps to that card.
   -------------------------------------------------------------------------- */
function initStackLinks() {
    const groups = document.querySelector('.stack__groups');
    if (!groups) return;

    const norm = (text) => text.toLowerCase().replace(/\s+/g, ' ').trim();
    const projects = [...document.querySelectorAll('.project[data-project]')].map((card) => ({
        id: card.id,
        title: card.querySelector('.project__title')?.textContent.trim() || card.dataset.project,
        tech: new Set([...card.querySelectorAll('.project__stack li')].map((li) => norm(li.textContent))),
    }));

    let open = null;
    const close = () => {
        if (!open) return;
        open.row.remove();
        open.pill.classList.remove('is-open');
        open.button.setAttribute('aria-expanded', 'false');
        open = null;
    };

    groups.querySelectorAll('.pill').forEach((pill) => {
        const label = pill.textContent.trim();
        const keys = (pill.dataset.match || label).split('|').map(norm);
        const matches = projects.filter((p) => keys.some((k) => p.tech.has(k)));
        if (!matches.length) return;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'pill__btn';
        button.setAttribute('aria-expanded', 'false');
        button.append(label);
        const count = document.createElement('span');
        count.className = 'pill__count';
        count.textContent = String(matches.length);
        count.setAttribute('aria-label', `used in ${matches.length} project${matches.length === 1 ? '' : 's'}`);
        button.append(count);
        pill.classList.add('pill--linked');
        pill.replaceChildren(button);

        button.addEventListener('click', () => {
            const reopen = open?.button !== button;
            close();
            if (!reopen) return;
            const row = document.createElement('div');
            row.className = 'stack__uses';
            row.innerHTML = `<span class="label">${label} · used in</span>` + matches.map((m) =>
                `<a class="link" href="#${m.id}" data-jump>${m.title}${svgIcon('i-arrow', 'icon icon--arrow')}</a>`).join('');
            pill.closest('.stack__group').appendChild(row);
            pill.classList.add('is-open');
            button.setAttribute('aria-expanded', 'true');
            open = { pill, button, row };
        });
    });

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    document.addEventListener('click', (e) => {
        const link = e.target.closest('[data-jump]');
        if (!link) return;
        const target = document.getElementById(link.getAttribute('href').slice(1));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center' });
        target.tabIndex = -1;
        target.focus({ preventScroll: true });
        target.classList.add('is-highlighted');
        setTimeout(() => target.classList.remove('is-highlighted'), 1800);
    });
}

/* --------------------------------------------------------------------------
   Footer: current time in Kathmandu
   -------------------------------------------------------------------------- */
function initLocalTime() {
    const el = document.querySelector('[data-local-time]');
    if (!el || typeof Intl === 'undefined') return;
    let format;
    try {
        format = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kathmandu', hour: '2-digit', minute: '2-digit', hour12: false });
    } catch { return; }
    const tick = () => { el.textContent = `· ${format.format(new Date())} local time`; el.hidden = false; };
    tick();
    setInterval(tick, 30000);
}

/* --------------------------------------------------------------------------
   GitHub: annotate the static repo list with language + last push.
   Public API, no token, one request, cached for an hour. Silent on failure.
   -------------------------------------------------------------------------- */
function initGithubMeta() {
    const list = document.querySelector('[data-github-user]');
    if (!list || !('fetch' in window)) return;

    const user = list.dataset.githubUser;
    const cacheKey = `gh-repos:${user}`;

    const readCache = () => {
        try {
            const cached = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
            return cached && Date.now() - cached.t < 36e5 ? cached.data : null;
        } catch { return null; }
    };

    const annotate = (repos) => {
        const byName = new Map(repos.map((r) => [r.name.toLowerCase(), r]));
        list.querySelectorAll('[data-repo]').forEach((link) => {
            const repo = byName.get(link.dataset.repo.toLowerCase());
            if (!repo) return;
            const when = new Date(repo.pushed_at).toLocaleDateString('en', { month: 'short', year: 'numeric' });
            link.querySelector('.repo__meta').textContent = [repo.language, `Updated ${when}`].filter(Boolean).join(' · ');
        });
    };

    const load = async () => {
        const cached = readCache();
        if (cached) return annotate(cached);
        try {
            const res = await fetch(`https://api.github.com/users/${user}/repos?per_page=100&sort=pushed`, {
                headers: { Accept: 'application/vnd.github+json' },
            });
            if (!res.ok) return;
            const data = (await res.json()).map((r) => ({ name: r.name, language: r.language, pushed_at: r.pushed_at }));
            try { sessionStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), data })); } catch { /* storage unavailable */ }
            annotate(data);
        } catch { /* offline or rate-limited: static links remain */ }
    };

    // Only spend the request when the strip is actually about to be seen
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(([entry], obs) => {
            if (!entry.isIntersecting) return;
            obs.disconnect();
            load();
        }, { rootMargin: '300px 0px' });
        observer.observe(list);
    } else {
        load();
    }
}

/* --------------------------------------------------------------------------
   Resources page: tabs + recommendation form
   -------------------------------------------------------------------------- */
function initTabs() {
    const tablist = document.querySelector('[role="tablist"]');
    if (!tablist) return;
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];

    const select = (tab, focus = false) => {
        tabs.forEach((t) => {
            const active = t === tab;
            t.setAttribute('aria-selected', String(active));
            t.tabIndex = active ? 0 : -1;
            const panel = document.getElementById(t.getAttribute('aria-controls'));
            if (panel) panel.hidden = !active;
        });
        if (focus) tab.focus();
    };

    tabs.forEach((tab, i) => {
        tab.addEventListener('click', () => select(tab));
        tab.addEventListener('keydown', (e) => {
            const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
            if (!delta) return;
            e.preventDefault();
            select(tabs[(i + delta + tabs.length) % tabs.length], true);
        });
    });

    select(tabs.find((t) => t.getAttribute('aria-selected') === 'true') || tabs[0]);
}

function initRecommendForm() {
    const toggle = document.getElementById('recommend-btn');
    const form = document.getElementById('recommendation-form');
    const cancel = document.getElementById('cancel-recommendation');
    const status = document.getElementById('recommendation-status');
    if (!toggle || !form || !cancel) return;

    const setOpen = (open) => {
        form.hidden = !open;
        toggle.hidden = open;
        toggle.setAttribute('aria-expanded', String(open));
        if (open) {
            status.hidden = true;
            form.querySelector('input, select, textarea')?.focus();
        } else {
            toggle.focus();
        }
    };

    toggle.addEventListener('click', () => setOpen(true));
    cancel.addEventListener('click', () => setOpen(false));

    const submit = form.querySelector('button[type="submit"]');
    const submitLabel = submit ? submit.innerHTML : '';

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateRequired(form)) {
            form.querySelector('.error')?.focus();
            return;
        }
        form.querySelector('.form-error-message')?.remove();
        if (submit) { submit.disabled = true; submit.textContent = 'Sending…'; }

        try {
            await submitToFormspree(form);
            form.reset();
            setOpen(false);
            status.hidden = false;
            status.innerHTML = `
                <div class="success-message" role="status">
                    ${svgIcon('i-check')}
                    <h3>Thanks for the recommendation.</h3>
                    <p>Your suggestion has been received. I'll review it and add it to the list if it fits well.</p>
                </div>
            `;
        } catch {
            showFormError(form, 'Something went wrong sending your recommendation. Please try again in a moment.');
        } finally {
            if (submit) { submit.disabled = false; submit.innerHTML = submitLabel; }
        }
    });
}

/* --------------------------------------------------------------------------
   Boot
   -------------------------------------------------------------------------- */
document.documentElement.classList.add('js');

const boot = () => {
    initHeader();
    initReveal();
    initHeroField();
    initCaseStudy();
    initContactForm();
    initCopyButtons();
    initStackLinks();
    initLocalTime();
    initGithubMeta();
    initTabs();
    initRecommendForm();
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
