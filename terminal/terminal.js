/* ==========================================================================
   sumit-sah.com.np — terminal mode
   An alternate, keyboard-first way through the same portfolio. The site stays
   the main experience; this opens over it and closes back to the same place.

   It holds no content of its own. Every fact it prints is read from the page
   it was opened on — the project cards and their case-study templates, the
   stack, journey, about and contact sections — so editing the page updates
   the terminal too. Both designs are supported because the reads key off
   shared hooks (data-project, <template>, section ids) and BEM suffixes
   (__title, __desc, __stack …) rather than either design's class names.

   Loaded on first use by initTerminal() in each design's script.js, as a
   classic script so it also works when the site is opened from disk.
   ========================================================================== */
(() => {
    'use strict';
    if (window.SumitTerminal) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const HISTORY_KEY = 'term-history';
    const BG = '#0b0b0d';

    // Sections that behave like files in `ls` / `cat` / `cd`
    const SECTIONS = ['about', 'projects', 'stack', 'journey', 'github', 'contact'];
    const QUICK = ['about', 'projects', 'stack', 'experience', 'contact', 'help'];
    const ALIASES = {
        '?': 'help', man: 'help', me: 'whoami', bio: 'about', work: 'projects', skills: 'stack', tech: 'stack',
        timeline: 'journey', socials: 'contact', email: 'contact', repos: 'github',
        cls: 'clear', quit: 'exit', q: 'exit', logout: 'exit',
    };

    /* ----------------------------------------------------------------- helpers */
    const h = (tag, props, ...kids) => {
        const el = document.createElement(tag);
        if (props) {
            Object.entries(props).forEach(([key, value]) => {
                if (value == null || value === false) return;
                if (key === 'class') el.className = value;
                else el.setAttribute(key, value === true ? '' : value);
            });
        }
        kids.flat(Infinity).forEach((kid) => {
            if (kid == null || kid === false || kid === '') return;
            el.append(kid instanceof Node ? kid : String(kid));   // text nodes only: nothing is parsed as HTML
        });
        return el;
    };

    const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
    const text = (el) => clean(el && el.textContent);
    const norm = (s) => clean(s).toLowerCase();
    const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
    const sameUrl = (a, b) => a.replace(/\/+$/, '').toLowerCase() === b.replace(/\/+$/, '').toLowerCase();
    const bareUrl = (url) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '');

    const distance = (a, b) => {
        const row = Array.from({ length: b.length + 1 }, (_, i) => i);
        for (let i = 1; i <= a.length; i += 1) {
            let diagonal = row[0];
            row[0] = i;
            for (let j = 1; j <= b.length; j += 1) {
                const above = row[j];
                row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
                diagonal = above;
            }
        }
        return row[b.length];
    };

    const commonPrefix = (words) => words.reduce((prefix, word) => {
        let i = 0;
        while (i < prefix.length && prefix[i] === word[i]) i += 1;
        return prefix.slice(0, i);
    });

    const kathmanduTime = () => {
        try {
            return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kathmandu', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
        } catch { return ''; }
    };

    /* ------------------------------------------------------- reading the page */

    // "Kathmandu,<br>Nepal" → "Kathmandu, Nepal"; "Full stack<br>AI / ML" → "Full stack · AI / ML".
    // A <small> inside the value is its secondary line.
    const readValue = (el) => {
        const parts = [''];
        let note = '';
        el.childNodes.forEach((node) => {
            if (node.nodeName === 'BR') parts.push('');
            else if (node.nodeName === 'SMALL') note = text(node);
            else parts[parts.length - 1] += node.textContent;
        });
        const value = parts.map(clean).filter(Boolean)
            .reduce((acc, part) => (acc ? `${acc}${/[,;:]$/.test(acc) ? ' ' : ' · '}${part}` : part), '');
        return { value, note };
    };

    const readTemplate = (template) => {
        if (!template) return { facts: [], sections: [] };
        const frag = template.content;
        const facts = [...frag.querySelectorAll('dl > div')]
            .map((row) => ({ label: text(row.querySelector('dt')), value: text(row.querySelector('dd')) }))
            .filter((f) => f.label && f.value);
        const sections = [...frag.querySelectorAll('section')].map((section) => ({
            title: text(section.querySelector('h3')),
            blocks: [...section.children].filter((c) => c.tagName !== 'H3').map((c) => {
                if (c.tagName === 'UL' || c.tagName === 'OL') return { list: [...c.children].map(text).filter(Boolean) };
                if (c.tagName === 'FIGURE') {
                    const img = c.querySelector('img');
                    return img ? { figure: { src: new URL(img.getAttribute('src'), document.baseURI).href, alt: img.alt, caption: text(c.querySelector('figcaption')) } } : null;
                }
                return text(c) ? { p: text(c) } : null;
            }).filter(Boolean),
        }));
        return { facts, sections };
    };

    function readPage() {
        const $ = (sel, root = document) => root.querySelector(sel);
        const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

        const name = clean($('meta[name="author"]')?.content) || 'Portfolio';
        const [first = 'guest', ...rest] = name.toLowerCase().split(' ');
        const slugify = (s) => s.replace(/[^a-z0-9-]/g, '');

        // facts: the hero's definition list first, then the about tiles it doesn't already cover
        const facts = [];
        const seen = new Set();
        $$('.hero__meta > div').forEach((row) => {
            const dd = $('dd', row);
            const label = text($('dt', row));
            if (!label || !dd || dd.querySelector('a')) return;   // "Elsewhere" is links; contact covers them
            seen.add(norm(label));
            facts.push({ label, value: text(dd), note: '' });
        });
        $$('#about .label').forEach((labelEl) => {
            const valueEl = labelEl.nextElementSibling;
            const label = text(labelEl);
            if (!valueEl || !label || seen.has(norm(label))) return;
            seen.add(norm(label));
            const link = labelEl.closest('a[href]');
            const list = valueEl.matches('ul, ol, .chips') ? [...valueEl.children].map(text).filter(Boolean) : null;
            const { value, note } = list ? { value: list.join(', '), note: '' } : readValue(valueEl);
            facts.push({ label, value, note, href: link ? link.href : null });
        });

        const projects = $$('article[data-project]').map((card, i) => {
            const pick = (sel) => card.querySelector(sel);
            const img = pick('[class*="__media"] img');
            const detail = readTemplate(pick('template'));
            return {
                n: String(i + 1).padStart(2, '0'),
                slug: card.dataset.project,
                id: card.id,
                title: text(pick('[class*="__title"]')) || card.dataset.project,
                kicker: text(pick('[class*="__kicker"]')),
                desc: text(pick('[class*="__desc"]')),
                tag: text(pick('[class*="__tag"], [class*="__top"] .tag')),
                stack: $$('[class*="__stack"] li', card).map(text).filter(Boolean),
                links: $$('[class*="__links"] a[href]', card).map((a) => ({ label: text(a), href: a.href })),
                cover: img ? {
                    src: new URL(img.getAttribute('src'), document.baseURI).href,
                    alt: img.alt, width: img.getAttribute('width'), height: img.getAttribute('height'),
                } : null,
                facts: detail.facts,
                sections: detail.sections,
                category: detail.facts.find((f) => norm(f.label) === 'category')?.value || '',
            };
        });

        // stack: each design's own grouping; usage counts mirror the page's (data-match aliases)
        const stack = $$('#stack [data-ticker], #stack .stack__group').map((group) => {
            const set = group.querySelector('.ticker__set:not([aria-hidden])') || group;
            const items = $$('[data-tech], .pill', set).map((el) => {
                let label = el.dataset.tech;
                if (!label) {
                    const copy = el.cloneNode(true);
                    copy.querySelectorAll('[class*="__count"]').forEach((c) => c.remove());
                    label = text(copy);
                }
                const keys = (el.dataset.match || label).split('|').map(norm);
                const used = projects.filter((p) => {
                    const tech = new Set(p.stack.map(norm));
                    return keys.some((k) => tech.has(k));
                });
                return { label, keys, used };
            }).filter((item, i, all) => item.label && all.findIndex((x) => x.label === item.label) === i);
            return { title: text(group.querySelector('h3, strong')), items };
        }).filter((g) => g.items.length);

        const journey = $$('#journey li').map((li) => {
            const title = text($('h3', li));
            return {
                when: text($('[class*="__when"]', li)),
                title,
                where: text($('[class*="__where"]', li)),
                body: $$('p:not([class*="__where"])', li).map(text).filter(Boolean),
                links: $$('a[href]', li).filter((a) => !a.getAttribute('href').startsWith('#')).map((a) => ({ label: text(a), href: a.href })),
                // "Final year project — VoxTube" names a project card: link them
                project: projects.find((p) => norm(title).endsWith(norm(p.title)) || norm(title).includes(`— ${norm(p.title)}`)) || null,
            };
        }).filter((j) => j.title);

        const ghList = $('[data-github-user]');
        const github = ghList ? {
            user: ghList.dataset.githubUser,
            profile: $('.gh__head a[href*="github.com"]')?.href || `https://github.com/${ghList.dataset.githubUser}`,
            blurb: text($('.gh__head p:not([class])')),
            repos: $$('[data-repo]', ghList).map((a) => ({
                name: a.dataset.repo,
                href: a.href,
                project: projects.find((p) => p.links.some((l) => sameUrl(l.href, a.href))) || null,
            })),
        } : null;

        const channels = $$('#contact .channel').map((row) => {
            const a = $('a[href]', row);
            return a ? { label: text($('.label', row)), value: text(a), href: a.href, copy: $('[data-copy]', row)?.dataset.copy || null } : null;
        }).filter((c) => c && c.label);

        const root = getComputedStyle(document.documentElement);
        const palette = [...new Set(['--accent', '--yellow', '--coral', '--blue', '--mint', '--accent-strong', '--text', '--text-2', '--surface-3', '--ink', '--paper']
            .map((v) => root.getPropertyValue(v).trim()).filter(Boolean))].slice(0, 8);

        return {
            name,
            user: slugify(first) || 'guest',
            host: slugify(rest[rest.length - 1] || '') || 'portfolio',
            role: text($('.hero .eyebrow, .hero__strip > span')),
            intro: text($('.hero__intro')),
            statement: text($('.about__statement')),
            paragraphs: $$('.about__copy p:not(.about__statement)').map(text).filter(Boolean),
            facts,
            projects,
            stack,
            journey,
            github,
            channels,
            offers: $$('#contact dl > div').map((row) => ({ label: text($('dt', row)), value: text($('dd', row)) })).filter((o) => o.label),
            lede: text($('#contact .lede, #contact .contact__lede')),
            form: !!$('#contact form'),
            design: text($('.vswitch__opt[aria-current]')),
            palette,
        };
    }

    // Same public endpoint, cache key and shape as the page's own GitHub strip, so
    // whichever asks first saves the other a request. No token, nothing private.
    const repoMeta = async (user) => {
        const key = `gh-repos:${user}`;
        try {
            const cached = JSON.parse(sessionStorage.getItem(key) || 'null');
            if (cached && Date.now() - cached.t < 36e5) return cached.data;
        } catch { /* storage unavailable */ }
        try {
            const res = await fetch(`https://api.github.com/users/${encodeURIComponent(user)}/repos?per_page=100&sort=pushed`, {
                headers: { Accept: 'application/vnd.github+json' },
            });
            if (!res.ok) return null;
            const data = (await res.json()).map((r) => ({ name: r.name, language: r.language, pushed_at: r.pushed_at }));
            try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), data })); } catch { /* storage unavailable */ }
            return data;
        } catch { return null; }
    };

    /* ------------------------------------------------------------ view pieces */
    const P = (...kids) => h('p', null, kids);
    const hd = (label) => h('p', { class: 'hd' }, label);
    const span = (cls, ...kids) => h('span', { class: cls }, kids);
    const run = (cmd, label = cmd, cls = '') => h('button', { type: 'button', class: `run${cls ? ` ${cls}` : ''}`, 'data-run': cmd }, label);

    const link = (href, label) => {
        const away = /^https?:/i.test(href) && new URL(href).origin !== window.location.origin;
        return h('a', away ? { href, target: '_blank', rel: 'noopener noreferrer' } : { href }, label,
            away && [span('ne', ' ↗'), span('vh', ' (opens in a new tab)')]);
    };

    const kv = (rows, { kw = '12ch', cls = '' } = {}) => h('dl', { class: `kv${cls ? ` ${cls}` : ''}`, style: `--kw:${kw}` },
        rows.filter(([, value]) => value != null && value !== '' && !(Array.isArray(value) && !value.flat(Infinity).filter(Boolean).length))
            .map(([key, value]) => h('div', null, h('dt', null, key), h('dd', null, value))));

    const figure = ({ src, alt, caption, width, height }, cls = '') => h('figure', { class: `fig${cls ? ` ${cls}` : ''}` },
        h('img', { src, alt: alt || '', width, height, loading: 'lazy', decoding: 'async' }),
        caption && h('figcaption', null, caption));

    // The site's own marks, drawn in CSS: the editorial 3×3 dot grid, the brutalist offset square
    const logo = (design) => (norm(design) === 'brutalist'
        ? h('div', { class: 'logo logo--square', 'aria-hidden': 'true' }, h('i'), h('i'))
        : h('div', { class: 'logo logo--dots', 'aria-hidden': 'true' }, Array.from({ length: 9 }, (_, i) => h('i', { class: i === 4 ? 'on' : null }))));

    /* ----------------------------------------------------------------- commands
       Each returns the nodes to print (or null). `this` is the terminal. */
    const commands = {
        help() {
            const example = this.data.projects[0];
            const rows = [
                [run('about'), 'who I am'],
                [run('projects'), 'everything I’ve built'],
                [span('strong', 'open <name>'), ['one project in full', example && [' — try ', run(`open ${example.slug}`)]]],
                [run('stack'), 'what I work with, and where each tool is used'],
                [run('experience'), 'what I’ve worked on'],
                [run('education'), 'what I’m studying'],
                [run('journey'), 'the whole timeline'],
                [run('github'), 'repositories on GitHub'],
                [run('contact'), 'email and socials'],
            ];
            const shell = [
                [[run('ls'), ' ', run('cd'), ' ', run('cat'), ' ', run('pwd')], 'the usual, pointed at this portfolio'],
                [run('whoami'), 'the short version'],
                [run('history'), 'what you’ve run'],
                [run('clear'), finePointer.matches ? 'clear the screen · ctrl + L' : 'clear the screen'],
                [run('exit'), finePointer.matches ? 'back to the site · esc' : 'back to the site'],
            ];
            return [
                hd('Portfolio'), kv(rows, { kw: '14ch', cls: 'cmds' }),
                hd('Shell'), kv(shell, { kw: '14ch', cls: 'cmds' }),
                h('p', { class: 'gap dim' }, finePointer.matches
                    ? '↑ ↓ history · tab completes · click anything highlighted'
                    : 'Tap anything highlighted to run it.'),
                h('p', { class: 'dim' }, finePointer.matches ? 'There’s at least one more in here. Tab might help.' : 'There’s at least one more in here.'),
            ];
        },

        whoami() {
            const d = this.data;
            return [
                h('p', { class: 'big' }, d.name),
                d.role && h('p', { class: 'acc' }, d.role),
                d.intro && h('p', { class: 'prose gap' }, d.intro),
                h('p', { class: 'gap' }, 'Welcome to the terminal — the same portfolio, as a shell. Type ', run('help'),
                    finePointer.matches ? ' to see what’s here.' : ' to see what’s here, or tap a command below.'),
            ];
        },

        about() {
            const d = this.data;
            const has = (label) => d.facts.some((f) => norm(f.label) === label);
            const rows = d.facts
                .filter((f) => !f.href && !(norm(f.label) === 'studying' && has('education')))
                .map((f) => [f.label, [f.value, f.note && [h('br'), span('muted', f.note)]]]);
            return [
                hd('Name'), h('p', { class: 'ind' }, d.name, d.role && span('muted', ` — ${d.role}`)),
                d.statement && [hd('Synopsis'), h('p', { class: 'ind prose' }, d.statement)],
                d.paragraphs.length && [hd('Description'), d.paragraphs.map((p) => h('p', { class: 'ind prose para' }, p))],
                rows.length && [hd('Details'), kv(rows, { kw: '11ch', cls: 'ind' })],
                d.facts.filter((f) => f.href).map((f) => h('p', { class: 'gap' }, span('dim', `${f.label.toLowerCase()} → `), link(f.href, f.value))),
                h('p', { class: 'gap dim flow' }, 'more:', run('projects'), run('stack'), run('journey'), run('contact')),
            ];
        },

        projects() {
            const d = this.data;
            if (!d.projects.length) return P('No projects on this page.');
            return [
                h('ol', { class: 'plist' }, d.projects.map((p) => h('li', null,
                    span('n', p.n),
                    run(`open ${p.slug}`, p.title, 'name'),
                    span('muted cat', p.category || p.tag),
                    span('dim stk', p.stack.join(' · '))))),
                h('p', { class: 'gap dim' }, `${plural(d.projects.length, 'project')} · `, span('muted', 'open <name|number>'), ' for the full write-up'),
            ];
        },

        open(args) {
            const d = this.data;
            const query = args.join(' ');
            if (!query) return [P('usage: open ', span('muted', '<name|number>')), commands.projects.call(this)];
            const project = this.findProject(query);
            if (project) return this.projectView(project);
            // `open linkedin`, `open email` — the contact channels, by label
            const channel = d.channels.find((c) => norm(c.label) === norm(query));
            if (channel) {
                if (/^mailto:/i.test(channel.href)) window.location.href = channel.href;
                else window.open(channel.href, '_blank', 'noopener');
                return P(span('muted', `opening ${channel.label} `), link(channel.href, channel.value));
            }
            return [P(span('err', `open: no project matching “${query}”`)), P('see ', run('projects'))];
        },

        stack(args) {
            const d = this.data;
            if (args.length) return this.stackTool(args.join(' '));
            if (!d.stack.length) return P('No stack section on this page.');
            return [
                d.stack.map((group) => [
                    hd(group.title),
                    h('p', { class: 'ind flow' }, group.items.map((item) => (item.used.length
                        ? run(`stack ${item.label}`, [item.label, span('cnt', item.used.length), span('vh', `, used in ${plural(item.used.length, 'project')}`)], 'plain')
                        : h('span', null, item.label)))),
                ]),
                h('p', { class: 'gap dim' }, 'No percentages. The number is how many projects here use it — pick one to see which.'),
            ];
        },

        journey() {
            const d = this.data;
            if (!d.journey.length) return P('Nothing listed here yet.');
            return [d.journey.map((j) => this.entry(j)), h('p', { class: 'gap dim flow' }, 'also:', run('experience'), run('education'))];
        },

        experience() {
            const { work } = this.splitJourney();
            if (!work.length) return [P(span('muted', 'Nothing listed here yet.')), P('see ', run('journey'))];
            return [h('p', { class: 'dim' }, '# from the journey section — the whole timeline is ', run('journey')), work.map((j) => this.entry(j))];
        },

        education() {
            const { study, fact } = this.splitJourney();
            if (study.length) return [study.map((j) => this.entry(j)), h('p', { class: 'gap dim' }, 'the whole timeline: ', run('journey'))];
            if (fact) return kv([[fact.label, [fact.value, fact.note && [h('br'), span('muted', fact.note)]]]]);
            return P(span('muted', 'Nothing listed here yet.'));
        },

        github() {
            const g = this.data.github;
            if (!g) return P('No GitHub section on this page.');
            const rows = g.repos.map((repo) => {
                const meta = span('dim meta', '');
                const li = h('li', null, link(repo.href, repo.name), meta,
                    repo.project ? run(`open ${repo.project.slug}`, ['open', span('vh', ` ${repo.project.title}`)], 'plain') : h('span'));
                return { repo, meta, li };
            });
            repoMeta(g.user).then((data) => {
                if (!data) return;
                const byName = new Map(data.map((r) => [r.name.toLowerCase(), r]));
                rows.forEach(({ repo, meta }) => {
                    const r = byName.get(repo.name.toLowerCase());
                    if (!r) return;
                    const when = r.pushed_at ? new Date(r.pushed_at).toLocaleDateString('en', { month: 'short', year: 'numeric' }) : '';
                    meta.textContent = [r.language, when && `updated ${when}`].filter(Boolean).join(' · ');
                });
            });
            return [
                P(link(g.profile, bareUrl(g.profile))),
                g.blurb && h('p', { class: 'muted prose' }, g.blurb),
                hd('Repositories'),
                h('ul', { class: 'repos' }, rows.map((r) => r.li)),
                h('p', { class: 'gap dim' }, 'Language and last update come from the public GitHub API, when it answers.'),
            ];
        },

        contact() {
            const d = this.data;
            if (!d.channels.length) return P('No contact section on this page.');
            return [
                d.lede && h('p', { class: 'prose' }, d.lede),
                kv(d.channels.map((c) => [c.label, [link(c.href, c.value),
                    c.copy && [' ', h('button', { type: 'button', class: 'run plain', 'data-copy': c.copy, 'aria-label': `copy ${c.value}` }, 'copy')]]]), { kw: '11ch', cls: 'gap' }),
                d.offers.length && [hd('Open to'), kv(d.offers.map((o) => [o.label, o.value]), { kw: '15ch' })],
                d.form && h('p', { class: 'gap' }, span('dim', 'prefer a form? '), h('a', { href: '#contact' }, 'the contact form on the page')),
            ];
        },

        ls(args) {
            const target = norm(args.filter((a) => !a.startsWith('-')).join(' ')).replace(/\/$/, '');
            const inProjects = target === 'projects' || target === '~/portfolio/projects' || (!target && this.cwd === 'projects');
            if (inProjects) return h('p', { class: 'flow' }, this.data.projects.map((p) => run(`open ${p.slug}`, p.slug, 'plain')));
            if (target && !['.', '..', '~', '/', '~/portfolio'].includes(target)) {
                if (SECTIONS.includes(target)) return P(target);
                return P(span('err', `ls: cannot access '${target}': No such file or directory`));
            }
            return h('p', { class: 'flow' }, SECTIONS.map((s) => (s === 'projects' ? run('cd projects', 'projects/', 'dir') : run(s, s, 'plain'))));
        },

        cd(args) {
            const target = norm(args.join(' ')).replace(/\/$/, '');
            if (!target || ['~', '..', '/', '~/portfolio'].includes(target)) { this.cwd = ''; return null; }
            if (target === '.') return null;
            if (target === 'projects' || target === '~/portfolio/projects') {
                this.cwd = 'projects';
                return commands.projects.call(this);
            }
            const project = this.cwd === 'projects' && this.findProject(target, { exact: true });
            if (project) return commands.open.call(this, [project.slug]);
            if (SECTIONS.includes(target)) return commands[target].call(this, []);
            return P(span('err', `cd: no such file or directory: ${target}`));
        },

        cat(args) {
            const target = norm(args.join(' ')).replace(/\.(md|txt)$/, '');
            if (!target) return P('usage: cat ', span('muted', '<section>'), '  — try ', run('ls'));
            if (target === 'projects') return [P(span('err', 'cat: projects: Is a directory')), P('try ', run('cd projects'))];
            if (SECTIONS.includes(target)) return commands[target].call(this, []);
            const project = this.findProject(target, { exact: true });
            if (project) return commands.open.call(this, [project.slug]);
            return P(span('err', `cat: ${target}: No such file or directory`));
        },

        pwd() {
            return P(`/home/${this.data.user}/portfolio${this.cwd ? `/${this.cwd}` : ''}`);
        },

        history() {
            if (!this.history.length) return P(span('dim', 'nothing yet'));
            return h('ol', { class: 'hist' }, this.history.map((cmd, i) => h('li', null, span('n', String(i + 1)), run(cmd, cmd, 'plain'))));
        },

        neofetch() {
            const d = this.data;
            const fact = (label) => d.facts.find((f) => norm(f.label) === label);
            const edu = fact('education') || fact('studying');
            const email = d.channels.find((c) => /^mailto:/i.test(c.href));
            const tools = new Set(d.stack.flatMap((g) => g.items.map((i) => norm(i.label)))).size;
            const time = kathmanduTime();
            const title = `${d.user}@${d.host}`;
            return h('div', { class: 'nf' },
                logo(d.design),
                h('div', { class: 'nf__info' },
                    P(span('acc strong', title)),
                    P(span('dim', '-'.repeat(title.length))),
                    kv([
                        ['Name', d.name],
                        ['Role', d.role],
                        ['Location', fact('based in')?.value],
                        ['Education', edu && (edu.note ? `${edu.value} · ${edu.note}` : edu.value)],
                        ['Focus', fact('focus')?.value],
                        ['Projects', d.projects.length ? `${d.projects.length} on this page` : null],
                        ['Stack', tools ? `${tools} tools` : null],
                        ['GitHub', d.github && bareUrl(d.github.profile)],
                        ['Email', email?.value],
                        ['Design', d.design && `${d.design}${window.location.host ? ` · ${window.location.host}` : ''}`],
                        ['Local time', time && `${time} in Kathmandu`],
                    ], { kw: '11ch', cls: 'nf__kv' }),
                    d.palette.length && h('div', { class: 'swatches', 'aria-hidden': 'true' }, d.palette.map((c) => h('i', { style: `background:${c}` })))));
        },
    };

    const COMPLETABLE = [...Object.keys(commands), 'clear', 'exit'].sort();

    /* --------------------------------------------------------------- the shell */
    class Terminal {
        constructor() {
            this.data = readPage();
            this.host = document.createElement('portfolio-terminal');
            this.root = this.host.attachShadow({ mode: 'open' });
            const style = document.createElement('style');
            style.textContent = CSS;
            this.root.append(style, this.build());
            document.body.append(this.host);

            this.cwd = '';                        // '' is ~/portfolio; 'projects' is ~/portfolio/projects
            this.history = readHistory();
            this.cursor = this.history.length;    // where ↑/↓ is in the history
            this.draft = '';                      // what was typed before browsing history
            this.isOpen = false;
            this.booted = false;
            this.pushed = false;
            this.typing = false;
            this.timers = [];
            this.bind();
            this.updatePrompt();
        }

        build() {
            const quick = QUICK.map((cmd) => h('button', { type: 'button', class: 'key', 'data-run': cmd },
                h('span', { class: 'br', 'aria-hidden': 'true' }, '[ '), cmd, h('span', { class: 'br', 'aria-hidden': 'true' }, ' ]')));
            this.dialog = h('dialog', { class: 'term', 'aria-labelledby': 'term-title' },
                h('div', { class: 'frame' },
                    h('header', { class: 'bar' },
                        h('span', { class: 'dots', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')),
                        h('h2', { class: 'title', id: 'term-title' }, span('vh', 'Terminal mode, '), h('span', { 'data-title': '' })),
                        h('button', { type: 'button', class: 'exit', 'data-exit': '' },
                            h('span', { class: 'x', 'aria-hidden': 'true' }, '×'), 'Exit', span('vh', ' terminal mode'), h('kbd', { 'aria-hidden': 'true' }, 'esc'))),
                    h('div', { class: 'screen', 'data-screen': '' },
                        h('div', { class: 'col' },
                            h('div', { class: 'log', role: 'log', 'aria-live': 'polite', 'aria-label': 'Terminal output', 'data-log': '' }),
                            h('form', { class: 'line', 'data-form': '' },
                                h('label', { for: 'term-input' }, h('span', { class: 'prompt', 'aria-hidden': 'true', 'data-prompt': '' }), span('vh', 'Command')),
                                h('input', {
                                    id: 'term-input', type: 'text', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off',
                                    spellcheck: 'false', enterkeyhint: 'go', 'aria-describedby': 'term-hint',
                                })),
                            h('p', { class: 'vh', id: 'term-hint' }, 'Type a command and press Enter; help lists them all. Up and down arrows recall earlier commands, Tab completes, and Escape leaves terminal mode.'))),
                    h('nav', { class: 'keys', 'aria-label': 'Quick commands' }, quick)));

            const find = (attr) => this.dialog.querySelector(`[${attr}]`);
            this.titleText = find('data-title');
            this.screen = find('data-screen');
            this.log = find('data-log');
            this.form = find('data-form');
            this.promptEl = find('data-prompt');
            this.input = this.dialog.querySelector('input');
            return this.dialog;
        }

        bind() {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                const value = this.input.value;
                this.input.value = '';
                this.run(value);
            });
            this.input.addEventListener('keydown', (e) => this.onKey(e));

            this.dialog.addEventListener('keydown', (e) => {
                if (this.typing && !e.isComposing) {
                    this.finishBoot();
                    if (e.key === 'Enter') { e.preventDefault(); return; }
                }
                if (e.key !== 'Escape') return;
                e.preventDefault();   // also stops the dialog's own cancel, so this path owns the animation
                if (e.target === this.input && this.input.value) this.input.value = '';
                else this.close();
            });
            this.dialog.addEventListener('cancel', (e) => { e.preventDefault(); this.close(); });   // e.g. the Android back gesture
            this.dialog.addEventListener('close', () => { if (this.isOpen) this.close({ external: true }); });
            this.root.addEventListener('click', (e) => this.onClick(e));

            window.addEventListener('popstate', () => {
                if (this.isOpen && window.location.hash !== '#terminal') this.close({ fromPop: true });
                else if (!this.isOpen && window.location.hash === '#terminal') this.open({ push: false });
            });
        }

        onKey(e) {
            if (e.isComposing) return;
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                if (!this.history.length) return;
                e.preventDefault();
                if (this.cursor === this.history.length) this.draft = this.input.value;
                this.cursor = Math.max(0, Math.min(this.history.length, this.cursor + (e.key === 'ArrowUp' ? -1 : 1)));
                this.input.value = this.cursor === this.history.length ? this.draft : this.history[this.cursor];
                const end = this.input.value.length;
                this.input.setSelectionRange(end, end);
            } else if (e.key === 'Tab' && !e.shiftKey && this.input.value.trim()) {
                // an empty prompt lets Tab move focus as usual, so keyboard users are never trapped
                e.preventDefault();
                this.complete();
            } else if (e.ctrlKey && !e.metaKey && !e.altKey) {
                const key = e.key.toLowerCase();
                if (key === 'l') { e.preventDefault(); this.clear(); }
                else if (key === 'u') { e.preventDefault(); this.input.value = ''; }
                else if (key === 'c' && this.input.selectionStart === this.input.selectionEnd) { e.preventDefault(); this.cancelLine(); }
            }
        }

        onClick(e) {
            const target = e.target.closest('[data-run], [data-exit], [data-copy], a[href^="#"]');
            if (target?.matches('[data-exit]')) return this.close();
            if (target?.matches('[data-copy]')) return this.copy(target);
            if (target?.matches('a[href^="#"]')) {
                if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return undefined;
                e.preventDefault();
                return this.close({ navigate: target.getAttribute('href') });
            }
            if (target?.matches('[data-run]')) {
                this.run(target.dataset.run);
                return this.focusInput();
            }
            // a click on empty screen puts you back at the prompt, like a real terminal
            const blank = e.target.closest('.screen') && !e.target.closest('a, button, input, img');
            if (blank && !String(window.getSelection())) this.focusInput();
            return undefined;
        }

        /* ---------------------------------------------------------- running */
        run(raw, { record = true } = {}) {
            if (this.typing) this.finishBoot();
            const line = clean(raw);
            if (record && line) this.remember(line);
            this.cursor = this.history.length;
            this.draft = '';

            const echo = this.echo(line);
            if (!line) return this.show(echo, null);
            const [word, ...args] = line.split(' ');
            const name = ALIASES[word.toLowerCase()] || word.toLowerCase();

            if (name === 'clear') return this.clear();
            if (name === 'exit') {
                this.show(echo, null);
                return this.later(() => this.close(), reduceMotion.matches ? 0 : 140);
            }
            let out;
            if (Object.prototype.hasOwnProperty.call(commands, name)) out = commands[name].call(this, args);
            else if (this.findProject(line, { exact: true })) out = commands.open.call(this, [line]);   // a bare name or number
            else out = this.notFound(word);
            this.show(echo, out);
            return this.updatePrompt();
        }

        show(echo, out) {
            const block = h('div', { class: 'block' }, echo, out != null && h('div', { class: 'out' }, out));
            this.log.append(block);
            // short output: keep the prompt in view; long output: start reading from its top
            requestAnimationFrame(() => {
                if (block.offsetHeight > this.screen.clientHeight * 0.75) this.screen.scrollTop = block.offsetTop - 16;
                else this.screen.scrollTop = this.screen.scrollHeight;
            });
            return block;
        }

        echo(line, suffix) {
            return h('p', { class: 'echo' }, h('span', { class: 'prompt', 'aria-hidden': 'true' }, this.promptParts()),
                span('vh', '$ '), span('cmd', line), suffix && span('dim', suffix));
        }

        promptParts() {
            const d = this.data;
            return [span('p-user', `${d.user}@${d.host}`), span('p-sep', ':'), span('p-path', this.path()), span('p-sym', '$')];
        }

        path() {
            return `~/portfolio${this.cwd ? `/${this.cwd}` : ''}`;
        }

        updatePrompt() {
            this.promptEl.replaceChildren(...this.promptParts());
            this.titleText.textContent = `${this.data.user}@${this.data.host}: ${this.path()}`;
        }

        findProject(query, { exact = false } = {}) {
            const list = this.data.projects;
            const q = norm(query).replace(/^#/, '');
            if (/^\d+$/.test(q)) return list[Number(q) - 1] || null;
            const slug = q.replace(/\s+/g, '-');
            const hit = list.find((p) => p.slug === slug || norm(p.title) === q);
            if (hit || exact) return hit || null;
            return list.find((p) => p.slug.startsWith(slug) || norm(p.title).startsWith(q))
                || list.find((p) => p.slug.includes(slug) || norm(p.title).includes(q))
                || null;
        }

        projectView(p) {
            const list = this.data.projects;
            const i = list.indexOf(p);
            const prev = list[i - 1];
            const next = list[i + 1];
            const links = [...p.links.map((l) => link(l.href, l.label)), p.id && h('a', { href: `#${p.id}` }, 'see it on the page')].filter(Boolean);
            const body = h('div', { class: 'proj__text' },
                h('p', { class: 'dim' }, `project ${p.n} of ${String(list.length).padStart(2, '0')}`),
                h('p', { class: 'big' }, p.title),
                p.kicker && h('p', { class: 'acc' }, p.kicker),
                p.desc && h('p', { class: 'prose gap' }, p.desc),
                p.facts.length && kv(p.facts.map((f) => [f.label, f.value]), { kw: '10ch', cls: 'gap' }),
                p.sections.map((s) => [
                    s.title && hd(s.title),
                    s.blocks.map((b) => {
                        if (b.list) return h('ul', { class: 'bul' }, b.list.map((item) => h('li', null, item)));
                        if (b.figure) return figure(b.figure, 'shot');
                        return h('p', { class: 'ind prose para' }, b.p);
                    }),
                ]),
                p.stack.length && [hd('Stack'), h('p', { class: 'ind flow' }, p.stack.map((s) => run(`stack ${s}`, s, 'plain')))],
                links.length && [hd('Links'), h('p', { class: 'ind flow' }, links)],
                h('p', { class: 'gap flow nav' },
                    prev && run(`open ${prev.slug}`, `← ${prev.title}`),
                    run('projects', 'all projects', 'plain'),
                    next && run(`open ${next.slug}`, `${next.title} →`)));
            return h('div', { class: 'proj' }, body,
                p.cover && figure({ ...p.cover, caption: p.cover.src.split('/').pop() }, 'cover'));
        }

        stackTool(query) {
            const d = this.data;
            const q = norm(query);
            const items = d.stack.flatMap((g) => g.items);
            // what you asked for comes first: a stack entry by name, then a tool named on the project
            // cards (FAISS, Zod …), and only then the page's aliases (faiss → "Embeddings & vector search")
            const direct = d.projects.filter((p) => p.stack.some((s) => norm(s) === q));
            const item = items.find((i) => norm(i.label) === q)
                || (direct.length ? null : items.find((i) => norm(i.label).startsWith(q)) || items.find((i) => i.keys.includes(q)));
            let label = item?.label;
            let used = item?.used || [];
            if (!item && direct.length) {
                used = direct;
                label = direct[0].stack.find((s) => norm(s) === q);
            }
            if (!label) return [P(span('err', `stack: nothing called “${query}” here`)), P('see ', run('stack'))];
            if (!used.length) return P(span('strong', label), span('muted', ' — part of the toolkit, not tied to a specific project on this page.'));
            return [
                P(span('strong', label), span('muted', ` — used in ${plural(used.length, 'project')}`)),
                h('ol', { class: 'plist tight' }, used.map((p) => h('li', null, span('n', p.n), run(`open ${p.slug}`, p.title, 'name'), span('muted cat', p.category || p.tag)))),
                h('p', { class: 'gap dim' }, 'back to ', run('stack')),
            ];
        }

        splitJourney() {
            const d = this.data;
            const fact = d.facts.find((f) => norm(f.label) === 'education') || d.facts.find((f) => norm(f.label) === 'studying');
            // the About section's Education value names the degree; the journey entry with that title is education
            const degree = fact ? norm(fact.value.split(' · ')[0]) : '';
            const study = degree ? d.journey.filter((j) => norm(j.title) === degree) : [];
            return { fact, study, work: d.journey.filter((j) => !study.includes(j)) };
        }

        entry(j) {
            const actions = [j.project && run(`open ${j.project.slug}`), ...j.links.map((l) => link(l.href, l.label))].filter(Boolean);
            return h('div', { class: 'jrow' },
                span('when', j.when),
                h('div', null,
                    h('p', { class: 'strong' }, j.title),
                    j.where && h('p', { class: 'muted' }, j.where),
                    j.body.map((b) => h('p', { class: 'prose' }, b)),
                    actions.length && h('p', { class: 'flow acts' }, actions)));
        }

        notFound(word) {
            const slugs = this.data.projects.map((p) => p.slug);
            let best = null;
            let score = 3;
            [...COMPLETABLE, ...slugs].forEach((candidate) => {
                const s = distance(word.toLowerCase(), candidate);
                if (s < score) { score = s; best = candidate; }
            });
            return [
                P(span('err', `command not found: ${word}`)),
                best ? P('did you mean ', run(slugs.includes(best) ? `open ${best}` : best, best), '?') : P('try ', run('help')),
            ];
        }

        complete() {
            const value = this.input.value;
            const parts = value.match(/^\s*(\S+)\s+(.*)$/);
            let head = '';
            let partial;
            let pool;
            if (!parts) {
                partial = value.trim().toLowerCase();
                pool = COMPLETABLE;
            } else {
                const cmd = ALIASES[parts[1].toLowerCase()] || parts[1].toLowerCase();
                head = `${parts[1]} `;
                partial = parts[2].toLowerCase();
                const slugs = this.data.projects.map((p) => p.slug);
                if (cmd === 'open') pool = slugs;
                else if (cmd === 'cd' || cmd === 'ls') pool = this.cwd === 'projects' ? [...slugs, '..'] : SECTIONS;
                else if (cmd === 'cat') pool = SECTIONS;
                else pool = [];
            }
            const hits = pool.filter((c) => c.startsWith(partial));
            if (!hits.length) return;
            if (hits.length === 1) {
                this.input.value = `${head}${hits[0]}${parts ? '' : ' '}`;
                return;
            }
            const common = commonPrefix(hits);
            if (common.length > partial.length) {
                this.input.value = `${head}${common}`;
                return;
            }
            this.show(this.echo(value), h('p', { class: 'flow' }, hits.map((c) => h('span', null, c))));
        }

        cancelLine() {
            this.show(this.echo(this.input.value, '^C'), null);
            this.input.value = '';
            this.cursor = this.history.length;
        }

        clear() {
            this.log.replaceChildren();
            this.screen.scrollTop = 0;
        }

        remember(line) {
            if (this.history[this.history.length - 1] !== line) this.history.push(line);
            if (this.history.length > 50) this.history.shift();
            try { sessionStorage.setItem(HISTORY_KEY, JSON.stringify(this.history)); } catch { /* storage unavailable */ }
        }

        async copy(button) {
            const value = button.dataset.copy;
            let ok = false;
            try {
                await navigator.clipboard.writeText(value);
                ok = true;
            } catch {
                // clipboard API needs a secure context; fall back for file:// and older browsers
                const area = h('textarea', { class: 'vh', tabindex: '-1', 'aria-hidden': 'true' });
                area.value = value;
                this.dialog.append(area);
                area.select();
                try { ok = document.execCommand('copy'); } catch { ok = false; }
                area.remove();
                button.focus();
            }
            button.textContent = ok ? 'copied' : 'copy failed';
            clearTimeout(button.resetTimer);
            button.resetTimer = setTimeout(() => { button.textContent = 'copy'; }, 1600);
        }

        /* ------------------------------------------------------ open / close */
        open({ opener = null, push = true } = {}) {
            if (this.isOpen) return;
            this.isOpen = true;
            this.clearTimers();   // cancels a close that is still animating
            this.opener = opener || document.activeElement;
            this.lock();
            this.setOrigin(opener);
            this.dialog.classList.remove('is-closing', 'is-settled');
            if (!this.dialog.open) this.dialog.showModal();
            document.documentElement.classList.add('terminal-open');
            document.dispatchEvent(new CustomEvent('terminal:open'));

            this.pushed = false;
            if (push && window.location.hash !== '#terminal') {
                // Back leaves terminal mode instead of the site, and the URL can be shared
                try { window.history.pushState({ terminal: true }, '', '#terminal'); this.pushed = true; } catch { /* sandboxed */ }
            }
            this.input.placeholder = finePointer.matches ? 'type a command — help lists them' : 'type a command';
            requestAnimationFrame(() => requestAnimationFrame(() => this.dialog.classList.add('is-open')));
            this.later(() => {
                this.dialog.classList.add('is-settled');
                if (!this.booted) this.boot();
            }, reduceMotion.matches ? 0 : 480);
            this.focusInput();
        }

        close({ fromPop = false, navigate = null, external = false } = {}) {
            if (!this.isOpen) return;
            this.isOpen = false;
            this.stopBoot();
            this.clearTimers();

            if (!fromPop) {
                try {
                    if (navigate) window.history.replaceState(null, '', navigate);
                    else if (this.pushed && window.history.state?.terminal) window.history.back();
                    else if (window.location.hash === '#terminal') window.history.replaceState(null, '', window.location.pathname + window.location.search);
                } catch { /* sandboxed */ }
            }
            this.pushed = false;
            this.unlock();
            document.documentElement.classList.remove('terminal-open');
            document.dispatchEvent(new CustomEvent('terminal:close'));

            const finish = () => {
                this.dialog.classList.remove('is-open', 'is-settled', 'is-closing');
                if (this.dialog.open) this.dialog.close();
                if (navigate) jump(navigate);
                else if (this.opener?.isConnected) this.opener.focus({ preventScroll: true });
                this.opener = null;
            };
            if (external || reduceMotion.matches) return finish();
            // un-settle first: clip-path can't animate from `none`, only from the full circle
            this.dialog.classList.remove('is-settled');
            void this.dialog.offsetWidth;
            this.dialog.classList.add('is-closing');
            this.dialog.classList.remove('is-open');
            return this.later(finish, 340);
        }

        boot() {
            this.booted = true;
            if (reduceMotion.matches) return this.run('whoami', { record: false });
            // type the first command, as if someone just sat down at the keyboard
            const cmd = 'whoami';
            let i = 0;
            this.typing = true;
            const step = () => {
                if (!this.typing) return;
                i += 1;
                this.input.value = cmd.slice(0, i);
                this.typeTimer = setTimeout(i < cmd.length ? step : () => this.finishBoot(), i < cmd.length ? 60 + Math.random() * 45 : 240);
            };
            this.typeTimer = setTimeout(step, 100);
            return undefined;
        }

        finishBoot() {
            if (!this.typing) return;
            this.typing = false;
            clearTimeout(this.typeTimer);
            this.input.value = '';
            this.run('whoami', { record: false });
        }

        stopBoot() {
            if (!this.typing) return;
            this.typing = false;
            clearTimeout(this.typeTimer);
            this.input.value = '';
            this.booted = false;
        }

        focusInput() {
            // on touch screens focusing the input would throw up the keyboard over the output
            if (finePointer.matches && this.isOpen) this.input.focus({ preventScroll: true });
        }

        setOrigin(el) {
            const r = el?.getBoundingClientRect?.();
            const visible = r && r.width && r.height;
            const x = visible ? r.left + r.width / 2 : window.innerWidth / 2;
            const y = visible ? r.top + r.height / 2 : window.innerHeight / 2;
            const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 4;
            this.dialog.style.setProperty('--ox', `${x}px`);
            this.dialog.style.setProperty('--oy', `${y}px`);
            this.dialog.style.setProperty('--r', `${radius}px`);
        }

        lock() {
            const style = document.documentElement.style;
            this.saved = { overflow: style.overflow, gutter: style.scrollbarGutter, background: style.backgroundColor };
            // Keep the scrollbar's space so the page behind doesn't shift; the dialog can't cover
            // that gutter, so paint the canvas under it the terminal's colour instead.
            style.scrollbarGutter = 'stable';
            style.overflow = 'hidden';
            style.backgroundColor = BG;
        }

        unlock() {
            if (!this.saved) return;
            const style = document.documentElement.style;
            style.overflow = this.saved.overflow;
            style.scrollbarGutter = this.saved.gutter;
            style.backgroundColor = this.saved.background;
            this.saved = null;
        }

        later(fn, ms) {
            this.timers.push(setTimeout(fn, ms));
        }

        clearTimers() {
            this.timers.forEach(clearTimeout);
            this.timers = [];
        }
    }

    function readHistory() {
        try {
            const saved = JSON.parse(sessionStorage.getItem(HISTORY_KEY) || '[]');
            return Array.isArray(saved) ? saved.filter((s) => typeof s === 'string').slice(-50) : [];
        } catch { return []; }
    }

    // In-page links from the terminal (a project card, the contact form) close it and land there
    function jump(hash) {
        let target = null;
        try { target = document.getElementById(decodeURIComponent(hash.slice(1))); } catch { /* malformed */ }
        if (!target) return;
        target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
        if (!target.matches('a[href], button, input, select, textarea, [tabindex]')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
    }

    /* ------------------------------------------------------------------ styles
       Lives in the shadow root, so neither design's CSS reaches in and none of
       this leaks out. The accent comes from the host page (--term-accent). */
    const CSS = `
:host { all: initial; }
*, *::before, *::after { box-sizing: border-box; }
p, dl, dd, ol, ul, figure, h2 { margin: 0; }
.vh { position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

.term {
    --bg: ${BG};
    --panel: #111114;
    --raise: #19191e;
    --line: rgba(255, 255, 255, 0.08);
    --line-2: rgba(255, 255, 255, 0.16);
    --text: #e7e7ea;
    --muted: #a6a6b0;
    --dim: #8e8e99;
    --accent: var(--term-accent, #8b8cf8);
    --err: #fb7185;
    --ease: cubic-bezier(0.65, 0, 0.35, 1);

    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 0;
    border: 0;
    overflow: hidden;
    background: var(--bg);
    color: var(--text);
    color-scheme: dark;
    font: 400 14px/1.65 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace;
    font-feature-settings: "calt" 0, "liga" 0;   /* show exactly what was typed */
    -webkit-font-smoothing: antialiased;
    -webkit-text-size-adjust: 100%;
    clip-path: circle(0 at var(--ox, 100%) var(--oy, 0));
    transition: clip-path 0.48s var(--ease);
}
.term::backdrop { background: transparent; }
.term.is-open { clip-path: circle(var(--r, 150vmax) at var(--ox, 100%) var(--oy, 0)); }
.term.is-settled { clip-path: none; }
.term.is-closing { clip-path: circle(0 at var(--ox, 100%) var(--oy, 0)); transition-duration: 0.34s; }

.frame {
    height: 100%;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 0.3s ease 0.16s, transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1) 0.12s;
}
.is-open .frame { opacity: 1; transform: none; }
.is-closing .frame { opacity: 0; transition: opacity 0.14s ease; }

/* header */
.bar {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 12px;
    min-height: 48px;
    padding: 6px 10px 6px 16px;
    background: var(--panel);
    border-bottom: 1px solid var(--line);
}
.dots { display: flex; gap: 8px; }
.dots i { width: 12px; height: 12px; border-radius: 50%; background: #e0605a; }
.dots i:nth-child(2) { background: #dcaa3f; }
.dots i:nth-child(3) { background: #4fb862; }
.title {
    max-width: min(60vw, 640px);
    font: inherit;
    font-size: 13px;
    font-weight: 500;
    color: var(--muted);
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.exit {
    justify-self: end;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 36px;
    padding: 0 12px;
    border: 1px solid var(--line-2);
    border-radius: 7px;
    background: transparent;
    color: var(--text);
    font: inherit;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    transition: color 0.2s, border-color 0.2s, background 0.2s;
}
.exit .x { font-size: 15px; line-height: 1; letter-spacing: 0; }
.exit kbd {
    font: inherit;
    font-size: 10.5px;
    font-weight: 500;
    letter-spacing: 0.02em;
    text-transform: none;
    color: var(--dim);
    padding: 1px 6px;
    border: 1px solid var(--line-2);
    border-radius: 4px;
}
.exit:hover { color: var(--accent); border-color: var(--accent); background: var(--raise); }

/* screen */
.screen {
    position: relative;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
    scrollbar-color: var(--line-2) transparent;
}
.col { max-width: 1040px; margin: 0 auto; padding: 28px 28px 36px; }
.block { margin-bottom: 22px; }
.out { margin-top: 10px; }
.out > :first-child, .out > .proj > .proj__text > :first-child { margin-top: 0; }

.echo { display: flex; flex-wrap: wrap; column-gap: 1ch; overflow-wrap: anywhere; }
.prompt { white-space: nowrap; }
.p-user { color: var(--accent); }
.p-sep { color: var(--dim); }
.p-path { color: var(--muted); }
.p-sym { color: var(--text); }
.cmd { color: var(--text); }

.line { display: flex; align-items: baseline; gap: 1ch; margin: 0 -8px; padding: 3px 8px; border-radius: 6px; transition: background 0.2s; }
.line:focus-within { background: rgba(255, 255, 255, 0.045); }
.line:focus-within .p-sym { color: var(--accent); }
.line input {
    flex: 1;
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--text);
    font: inherit;
    caret-color: var(--accent);
}
.line input::placeholder { color: var(--dim); opacity: 1; }

/* output */
.hd { margin: 18px 0 6px; color: var(--text); font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
.ind { padding-left: 4ch; }
.prose { max-width: 84ch; overflow-wrap: anywhere; }
.para + .para { margin-top: 8px; }
.gap { margin-top: 12px; }
.muted { color: var(--muted); }
.dim { color: var(--dim); }
.acc { color: var(--accent); }
.err { color: var(--err); }
.strong { color: var(--text); font-weight: 700; }
.strong.acc { color: var(--accent); }
.big { margin-bottom: 2px; font-size: clamp(22px, 3.4vw, 30px); line-height: 1.15; font-weight: 800; letter-spacing: 0.02em; text-transform: uppercase; overflow-wrap: anywhere; }

a { color: var(--text); text-decoration: underline; text-decoration-color: var(--line-2); text-underline-offset: 3px; border-radius: 3px; overflow-wrap: anywhere; }
a:hover { color: var(--accent); text-decoration-color: currentColor; }
.ne { color: var(--dim); }

.run {
    display: inline;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 3px;
    background: none;
    color: var(--accent);
    font: inherit;
    text-align: left;
    cursor: pointer;
    text-decoration: underline dotted;
    text-decoration-color: color-mix(in srgb, var(--accent) 55%, transparent);
    text-underline-offset: 3px;
}
.run:hover { text-decoration-style: solid; text-decoration-color: currentColor; background: color-mix(in srgb, var(--accent) 12%, transparent); }
.run.plain { color: var(--text); text-decoration-color: var(--line-2); }
.run.plain:hover { color: var(--accent); }
.run.name { font-weight: 700; }
.run.dir { color: var(--accent); font-weight: 700; }
.cnt { margin-left: 0.6ch; color: var(--dim); font-size: 12px; }

:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
.line input:focus-visible { outline: none; }

.flow { display: flex; flex-wrap: wrap; gap: 4px 2.4ch; }

.kv { display: grid; gap: 3px; }
.kv > div { display: grid; grid-template-columns: var(--kw, 12ch) minmax(0, 1fr); column-gap: 2ch; align-items: baseline; }
.kv dt { color: var(--dim); font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; }
.kv dd { overflow-wrap: anywhere; }
.kv.cmds dt { font-size: inherit; letter-spacing: 0; text-transform: none; }
.kv.cmds dd { color: var(--muted); }

.plist { list-style: none; padding: 0; display: grid; gap: 3px; }
.plist li { display: grid; grid-template-columns: 3ch 28ch minmax(14ch, 26ch) minmax(0, 1fr); column-gap: 2ch; align-items: baseline; }
.plist .n, .hist .n { color: var(--dim); }
.plist .stk { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.plist.tight li { grid-template-columns: 3ch 28ch minmax(0, 1fr); }

.hist { list-style: none; padding: 0; display: grid; gap: 2px; }
.hist li { display: grid; grid-template-columns: 4ch minmax(0, 1fr); column-gap: 1ch; }
.hist .n { text-align: right; }

.bul { list-style: none; margin-top: 4px; padding-left: 4ch; display: grid; gap: 4px; max-width: 84ch; }
.bul li { position: relative; overflow-wrap: anywhere; }
.bul li::before { content: "–"; position: absolute; left: -2.2ch; color: var(--dim); }

.jrow { display: grid; grid-template-columns: 12ch minmax(0, 1fr); column-gap: 2ch; }
.jrow + .jrow { margin-top: 16px; }
.jrow .when { color: var(--accent); font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; }
.jrow .prose { margin-top: 4px; }
.acts { margin-top: 6px; }

.repos { list-style: none; padding: 0; display: grid; gap: 3px; }
.repos li { display: grid; grid-template-columns: minmax(0, 28ch) minmax(0, 36ch) auto; justify-content: start; column-gap: 2ch; align-items: baseline; }

.proj { display: grid; grid-template-columns: minmax(0, 1fr) minmax(220px, 34%); gap: 20px 36px; align-items: start; }
.proj .cover { position: sticky; top: 0; }
.fig img { display: block; width: 100%; height: auto; border: 1px solid var(--line); border-radius: 8px; background: #131317; }
.fig figcaption { margin-top: 6px; font-size: 12px; color: var(--dim); }
.fig.shot { margin: 10px 0 0 4ch; max-width: 640px; }
.nav { margin-top: 22px; }

/* neofetch */
.nf { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 20px 40px; }
.logo--dots { display: grid; grid-template-columns: repeat(3, 34px); gap: 14px; padding: 8px; }
.logo--dots i { width: 34px; height: 34px; border-radius: 50%; background: #34343d; }
.logo--dots i.on { background: var(--accent); }
.logo--square { position: relative; isolation: isolate; width: 124px; height: 124px; margin: 8px 20px 20px 8px; }
.logo--square i { position: absolute; inset: 0; }
.logo--square i:first-child { background: var(--accent); }
.logo--square i:last-child { z-index: -1; background: #34343d; transform: translate(12px, 12px); }
.nf__kv { margin-top: 6px; }
.swatches { display: flex; margin-top: 14px; }
.swatches i { width: 30px; height: 16px; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.1); }

/* quick commands */
.keys {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 4px 6px;
    padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
    background: var(--panel);
    border-top: 1px solid var(--line);
}
.key {
    display: inline-flex;
    align-items: center;
    min-height: 36px;
    padding: 0 10px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--muted);
    font: inherit;
    font-size: 13px;
    white-space: pre;
    cursor: pointer;
    transition: color 0.15s, background 0.15s;
}
.key .br { color: var(--dim); transition: color 0.15s; }
.key:hover { color: var(--text); background: var(--raise); }
.key:hover .br { color: var(--accent); }

@media (max-width: 900px) {
    .plist li { grid-template-columns: 3ch minmax(0, 28ch) minmax(0, 1fr); }
    .plist .stk { display: none; }
    .proj { grid-template-columns: 1fr; }
    .proj .cover { position: static; order: -1; max-width: 460px; }
}

@media (max-width: 560px) {
    .term { font-size: 14px; }
    .bar { grid-template-columns: minmax(0, 1fr) auto; padding-left: 14px; }
    .dots { display: none; }
    .title { max-width: none; text-align: left; }
    .col { padding: 18px 16px 24px; }
    .p-user, .p-sep, .p-path { display: none; }
    .ind, .bul { padding-left: 2ch; }
    .bul li::before { left: -1.6ch; }
    .fig.shot { margin-left: 0; }
    .kv > div { grid-template-columns: 1fr; }
    .kv > div + div { margin-top: 6px; }
    .kv.cmds > div { grid-template-columns: 11ch minmax(0, 1fr); }
    .kv.cmds > div + div { margin-top: 0; }
    .plist li, .plist.tight li { grid-template-columns: 3ch minmax(0, 1fr); }
    .plist .cat { grid-column: 2; font-size: 12px; }
    .jrow { grid-template-columns: 1fr; }
    .jrow .when { margin-bottom: 2px; }
    .repos li { grid-template-columns: minmax(0, 1fr) auto; }
    .repos .meta { grid-column: 1 / -1; grid-row: 2; font-size: 12px; }
    .logo { display: none; }
}

@media (pointer: coarse) {
    .line input { font-size: 16px; }   /* below 16px, iOS zooms the page into the field */
    .exit, .key { min-height: 44px; }
    .exit kbd { display: none; }
    .run { padding: 2px 0; }
    /* while typing, give the output the room the keyboard takes */
    .term:has(.line input:focus) .keys { display: none; }
}

@media (prefers-reduced-motion: reduce) {
    .term, .frame, .line, .exit, .key, .key .br { transition: none !important; }
    .term { clip-path: none !important; }
    .frame { transform: none !important; }
}
`;

    let instance = null;
    if (!customElements.get('portfolio-terminal')) customElements.define('portfolio-terminal', class extends HTMLElement {});

    window.SumitTerminal = {
        open(options) {
            if (!instance) instance = new Terminal();
            instance.open(options);
        },
        close() {
            if (instance) instance.close();
        },
    };
})();
