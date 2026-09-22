/* ==========================================================================
   sumit-sah.com.np — v4 behaviour
   Same feature set as the current site, adapted to the brutalist markup.
   Everything degrades: the page reads fully with JS off, and all motion
   respects prefers-reduced-motion.
   ========================================================================== */

// Formspree endpoint used by the contact form and the resource recommendation
// form. Both also carry it in their action attribute so they work without JS.
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xwleyvog';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const svgIcon = (id, className = 'icon') =>
    `<svg class="${className}" aria-hidden="true"><use href="#${id}"/></svg>`;

/* --------------------------------------------------------------------------
   Header: mobile panel + active section
   -------------------------------------------------------------------------- */
function initHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;

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
        window.matchMedia('(min-width: 921px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
    }

    const links = document.querySelectorAll('.nav__link[href^="#"], .menu__link[href^="#"]');
    const sections = [...links]
        .map((a) => document.querySelector(a.getAttribute('href')))
        .filter((el, i, arr) => el && arr.indexOf(el) === i);
    if (!sections.length || !('IntersectionObserver' in window)) return;

    const setCurrent = (id) => links.forEach((a) => {
        if (a.getAttribute('href') === `#${id}`) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
    });

    // the hero clears the indicator, so nothing looks "current" at the top of the page
    const hero = document.querySelector('.hero, .page-hero');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) setCurrent(entry.target === hero ? '' : entry.target.id);
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
   Case study dialog — content comes from the card and its <template>
   -------------------------------------------------------------------------- */
function initCaseStudy() {
    const dialog = document.getElementById('case-study');
    if (!dialog || typeof dialog.showModal !== 'function') return;

    const slot = (name) => dialog.querySelector(`[data-slot="${name}"]`);
    const cover = dialog.querySelector('.case__cover img');
    const scroller = dialog.querySelector('.case__scroll');
    let lastTrigger = null;

    const open = (card, trigger) => {
        const text = (sel) => card.querySelector(sel)?.textContent.trim() || '';
        slot('num').textContent = `Project / ${text('.pj__num')}`;
        slot('title').textContent = text('.pj__title');
        slot('kicker').textContent = text('.pj__kicker') || text('.pj__desc');

        const img = card.querySelector('.pj__media img');
        if (img) { cover.src = img.currentSrc || img.src; cover.alt = img.alt; }

        const facts = slot('facts');
        const main = slot('main');
        facts.replaceChildren();
        main.replaceChildren();
        const template = card.querySelector('template.pj__detail');
        if (template) {
            const fragment = template.content.cloneNode(true);
            const factList = fragment.querySelector('.case__facts');
            if (factList) facts.appendChild(factList);
            main.appendChild(fragment);
        } else {
            const p = document.createElement('p');
            p.textContent = text('.pj__desc');
            main.appendChild(p);
        }

        slot('stack').replaceChildren(...[...card.querySelectorAll('.pj__stack li')].map((li) => {
            const item = document.createElement('li');
            item.textContent = li.textContent.trim();
            return item;
        }));

        slot('links').replaceChildren(...[...card.querySelectorAll('.pj__links a')].map((a, i) => {
            const link = a.cloneNode(true);
            link.className = i === 0 ? 'btn btn--yellow btn--sm' : 'btn btn--sm';
            return link;
        }));

        lastTrigger = trigger;
        dialog.showModal();
        scroller.scrollTop = 0;
        document.body.classList.add('is-locked');
    };

    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-case-study]');
        const card = trigger?.closest('.pj');
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
    const form = document.querySelector('.form:not(.recommend__form)');
    if (!form || form.id === 'recommendation-form') return;

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
   Copy-to-clipboard
   -------------------------------------------------------------------------- */
function initCopyButtons() {
    const buttons = document.querySelectorAll('[data-copy]');
    if (!buttons.length || !navigator.clipboard) return;

    buttons.forEach((btn) => {
        const original = btn.innerHTML;
        btn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(btn.dataset.copy);
                btn.classList.add('is-copied');
                btn.innerHTML = `${svgIcon('i-check')}<span>Copied</span>`;
                setTimeout(() => { btn.classList.remove('is-copied'); btn.innerHTML = original; }, 2000);
            } catch {
                btn.querySelector('span').textContent = 'Copy failed';
            }
        });
    });
}

/* --------------------------------------------------------------------------
   Stack ↔ Work: chips backed by a project get a count and expand to a list
   -------------------------------------------------------------------------- */
function initStackLinks() {
    const wall = document.querySelector('.stack');
    if (!wall) return;

    const norm = (text) => text.toLowerCase().replace(/\s+/g, ' ').trim();
    const projects = [...document.querySelectorAll('.pj[data-project]')].map((card) => ({
        id: card.id,
        title: card.querySelector('.pj__title')?.textContent.trim() || card.dataset.project,
        tech: new Set([...card.querySelectorAll('.pj__stack li')].map((li) => norm(li.textContent))),
    }));

    let open = null;
    const close = () => {
        if (!open) return;
        open.row.remove();
        open.chip.classList.remove('is-open');
        open.button.setAttribute('aria-expanded', 'false');
        open = null;
    };

    wall.querySelectorAll('.chip').forEach((chip) => {
        const label = chip.textContent.trim();
        const keys = (chip.dataset.match || label).split('|').map(norm);
        const matches = projects.filter((p) => keys.some((k) => p.tech.has(k)));
        if (!matches.length) return;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'chip__btn';
        button.setAttribute('aria-expanded', 'false');
        button.append(label);
        const count = document.createElement('span');
        count.className = 'chip__count';
        count.textContent = String(matches.length);
        count.setAttribute('aria-label', `used in ${matches.length} project${matches.length === 1 ? '' : 's'}`);
        button.append(count);
        chip.classList.add('chip--linked');
        chip.replaceChildren(button);

        button.addEventListener('click', () => {
            const reopen = open?.button !== button;
            close();
            if (!reopen) return;
            const row = document.createElement('div');
            row.className = 'stack__uses';
            row.innerHTML = `<span class="label">${label} · used in</span>` + matches.map((m) =>
                `<a class="link" href="#${m.id}" data-jump>${m.title}${svgIcon('i-arrow', 'icon icon--arrow')}</a>`).join('');
            chip.closest('.stack__group').appendChild(row);
            chip.classList.add('is-open');
            button.setAttribute('aria-expanded', 'true');
            open = { chip, button, row };
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
   GitHub: annotate the static repo list. Public API, no token, one request,
   cached for an hour, silent on failure.
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
            link.querySelector('.repo__meta').textContent = [repo.language, when].filter(Boolean).join(' · ');
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
const boot = () => {
    initHeader();
    initReveal();
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
