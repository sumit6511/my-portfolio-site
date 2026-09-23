// Global utility and feature initialization

// Formspree endpoint used by the contact form and the resource recommendation form.
// Sign up at https://formspree.io, create a form, and replace this with your form's
// endpoint (e.g. 'https://formspree.io/f/abcdwxyz').
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xwleyvog';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;

function debounce(fn, delay = 150) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
}

function throttle(fn) {
    let ticking = false;
    return (...args) => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            fn(...args);
            ticking = false;
        });
    };
}

function initHeaderMenu() {
    const header = document.querySelector('header');
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navLinksItems = document.querySelectorAll('.nav-links li');

    if (!header || !hamburger || !navLinks) return;

    const updateHeader = () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    };

    // While the drawer is open the page behind it is inert, so Tab stays in the menu
    const covered = [document.querySelector('main'), document.querySelector('footer')].filter(Boolean);
    const setMenu = (open) => {
        navLinks.classList.toggle('active', open);
        hamburger.classList.toggle('active', open);
        document.body.classList.toggle('menu-open', open);
        hamburger.setAttribute('aria-expanded', String(open));
        covered.forEach((el) => { el.inert = open; });
        if (open) navLinks.querySelector('a')?.focus({ preventScroll: true });
    };
    const isOpen = () => navLinks.classList.contains('active');

    hamburger.addEventListener('click', () => setMenu(!isOpen()));
    navLinksItems.forEach(item => item.addEventListener('click', () => { if (isOpen()) setMenu(false); }));
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' || !isOpen()) return;
        setMenu(false);
        hamburger.focus();
    });
    window.matchMedia('(min-width: 769px)').addEventListener('change', (e) => { if (e.matches && isOpen()) setMenu(false); });

    window.addEventListener('scroll', throttle(updateHeader));
    requestAnimationFrame(updateHeader);   // reading scrollY during start-up forced a layout
}

function initScrollProgress() {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);

    const updateProgress = () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        bar.style.width = `${Math.min(progress, 100)}%`;
    };

    window.addEventListener('scroll', throttle(updateProgress), { passive: true });
    window.addEventListener('resize', debounce(updateProgress));
    updateProgress();
}

// Scroll reveal. Content is only hidden (html.aos-ready, see style.css) once this has run,
// so without JS, without IntersectionObserver or with reduced motion everything simply shows.
function initScrollAnimations() {
    const elements = document.querySelectorAll('[data-aos]');
    if (!elements.length || prefersReducedMotion || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
                obs.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        rootMargin: '0px 0px -8% 0px',
        threshold: 0.08,
    });

    document.documentElement.classList.add('aos-ready');
    elements.forEach(element => observer.observe(element));
}

function initProjectCardHover() {
    const projectCards = document.querySelectorAll('.project-card');
    if (!projectCards.length) return;

    projectCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px)';
            card.style.boxShadow = 'var(--shadow-dark)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
            card.style.boxShadow = '';
        });
    });
}

function initHeroParallax() {
    if (prefersReducedMotion) return;
    const heroSection = document.querySelector('.hero');
    if (!heroSection) return;

    const onMouseMove = (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        heroSection.style.backgroundPosition = `${x * 20}px ${y * 20}px`;
    };

    window.addEventListener('mousemove', throttle(onMouseMove));
}

function createParticles() {
    if (prefersReducedMotion) return;

    const existingContainer = document.querySelector('.particles-container');
    const wanted = window.innerWidth < 576 ? 16 : window.innerWidth < 992 ? 28 : 40;
    if (existingContainer && existingContainer.dataset.count === String(wanted)) return;   // resize within a band: keep them
    if (existingContainer) {
        existingContainer.remove();
    }

    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles-container';
    document.body.insertBefore(particlesContainer, document.body.firstChild);

    const screenWidth = window.innerWidth;
    const numberOfParticles = screenWidth < 576 ? 16 : screenWidth < 992 ? 28 : 40;   // was 30 / 60 / 90
    particlesContainer.dataset.count = String(numberOfParticles);

    for (let i = 0; i < numberOfParticles; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 5 + 1;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const delay = Math.random() * 15;
        const duration = Math.random() * 30 + 20;
        const colorIndex = Math.floor(Math.random() * 3);
        const color = colorIndex === 0 ? 'var(--primary-color)' : colorIndex === 1 ? 'var(--secondary-color)' : 'var(--accent-color)';

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}vw`;
        particle.style.top = `${posY}vh`;
        particle.style.backgroundColor = color;
        particle.style.opacity = (Math.random() * 0.15 + 0.05).toFixed(2);
        particle.style.animationDelay = `${delay}s`;
        particle.style.animationDuration = `${duration}s`;
        particlesContainer.appendChild(particle);
    }
}

function setupProfileImageTilt() {
    const profileContainer = document.querySelector('.img-placeholder');
    if (!profileContainer) return;

    let bounds = profileContainer.getBoundingClientRect();
    const updateBounds = () => { bounds = profileContainer.getBoundingClientRect(); };

    const rotateToMouse = (e) => {
        const centerX = bounds.left + bounds.width / 2;
        const centerY = bounds.top + bounds.height / 2;
        const percentX = (e.clientX - centerX) / (bounds.width / 2);
        const percentY = (e.clientY - centerY) / (bounds.height / 2);
        const rotateX = -percentY * 10;
        const rotateY = percentX * 10;
        profileContainer.style.transform = `translateZ(25px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
    };

    const resetTilt = () => {
        profileContainer.style.transform = 'translateZ(0) rotateX(0) rotateY(0) scale(1)';
    };

    profileContainer.addEventListener('mouseenter', () => {
        updateBounds();
        document.addEventListener('mousemove', rotateToMouse);
    });

    profileContainer.addEventListener('mouseleave', () => {
        document.removeEventListener('mousemove', rotateToMouse);
        resetTilt();
    });

    window.addEventListener('resize', updateBounds);
}

function initContactForm() {
    const contactForm = document.querySelector('.contact-form');
    if (!contactForm) return;

    // Without JS the browser's own validation guards the plain POST; with JS these
    // messages take over, so they look the same everywhere and are announced.
    contactForm.noValidate = true;
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const submitLabel = submitBtn ? submitBtn.innerHTML : '';
    let errorMessage = null;
    watchFields(contactForm);

    const showError = () => {
        if (!errorMessage) {
            errorMessage = document.createElement('p');
            errorMessage.className = 'form-error-message';
            errorMessage.setAttribute('role', 'alert');
            // Appended last so it doesn't shift the nth-child positions the grid layout relies on.
            contactForm.appendChild(errorMessage);
        }
        errorMessage.textContent = 'Something went wrong sending your message. Please try again, or email me directly instead.';
    };

    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!validateForm(contactForm)) return;

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending…';
        }
        if (errorMessage) errorMessage.remove();
        errorMessage = null;

        try {
            const response = await fetch(FORMSPREE_ENDPOINT, {
                method: 'POST',
                headers: { Accept: 'application/json' },
                body: new FormData(contactForm),
            });
            if (!response.ok) throw new Error('Form submission failed');

            // swap the fields for a confirmation, keeping them to put back for another message
            const fields = [...contactForm.children];
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.setAttribute('role', 'status');
            successMessage.tabIndex = -1;
            successMessage.innerHTML = `
                <svg class="ic" aria-hidden="true"><use href="#ic-check-circle"/></svg>
                <h3>Message Sent Successfully!</h3>
                <p>Thank you for reaching out. I’ll get back to you as soon as possible.</p>
                <button class="btn secondary-btn" type="button">Send another message</button>
            `;
            contactForm.replaceChildren(successMessage);
            successMessage.focus({ preventScroll: true });   // the button that had focus is gone
            successMessage.querySelector('button').addEventListener('click', () => {
                contactForm.replaceChildren(...fields);
                contactForm.reset();   // after re-attaching: reset() only clears fields that are in the form
                if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = submitLabel; }
                contactForm.querySelector('input:not([type="hidden"]):not([tabindex="-1"])')?.focus();
            });
        } catch (err) {
            showError();
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = submitLabel;
            }
        }
    });
}

/* Form validation, as on the current site: a message under each problem field, tied
   to it with aria-describedby and aria-invalid, so it is announced and never relies
   on a coloured border alone. */
function fieldError(field) {
    if (field.type === 'hidden' || field.disabled || field.tabIndex === -1 || field.type === 'submit') return '';
    const value = field.value.trim();
    if (field.required && !value) return field.tagName === 'SELECT' ? 'Choose an option.' : 'This field is required.';
    if (value && field.validity.typeMismatch) {
        if (field.type === 'email') return 'Enter a valid email address, like you@example.com.';
        if (field.type === 'url') return 'Enter a full link, starting with https://';
    }
    return '';
}

function setFieldError(field, message) {
    const id = `${field.id || field.name}-error`;
    let note = document.getElementById(id);
    field.classList.toggle('error', !!message);
    if (!message) {
        note?.remove();
        field.removeAttribute('aria-invalid');
        field.removeAttribute('aria-describedby');
        return;
    }
    if (!note) {
        note = document.createElement('p');
        note.className = 'field__error';
        note.id = id;
        // after the field — or after the select's wrapper, so the chevron stays centred
        const anchor = field.closest('.select-wrap') || field;
        anchor.insertAdjacentElement('afterend', note);
    }
    note.textContent = message;
    field.setAttribute('aria-invalid', 'true');
    field.setAttribute('aria-describedby', id);
}

function validateForm(form) {
    let first = null;
    form.querySelectorAll('input, select, textarea').forEach((field) => {
        const message = fieldError(field);
        setFieldError(field, message);
        if (message && !first) first = field;
    });
    first?.focus();
    return !first;
}

// Clear a message as soon as it's fixed; check a filled-in field when the visitor
// moves on. While a button is being pressed the blur check stands down: a message
// appearing then would move Send out from under the pointer and lose the click.
function watchFields(form) {
    let pressing = false;
    form.addEventListener('pointerdown', (e) => { pressing = !!e.target.closest('button'); });
    document.addEventListener('pointerup', () => { setTimeout(() => { pressing = false; }); });

    form.querySelectorAll('input, select, textarea').forEach((field) => {
        const recheck = () => { if (field.getAttribute('aria-invalid') === 'true') setFieldError(field, fieldError(field)); };
        field.addEventListener('input', recheck);
        field.addEventListener('change', recheck);
        field.addEventListener('blur', () => { if (!pressing && field.value.trim()) setFieldError(field, fieldError(field)); });
    });
}

function initContactFaq() {
    const faqItems = document.querySelectorAll('.faq-item');
    if (!faqItems.length) return;

    const closeFaq = (item) => {
        const icon = item.querySelector('.faq-icon .ic');
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        if (!icon || !question || !answer) return;

        item.classList.remove('active');
        question.setAttribute('aria-expanded', 'false');
        answer.setAttribute('aria-hidden', 'true');
        icon.querySelector('use')?.setAttribute('href', '#ic-plus');
    };

    const openFaq = (item) => {
        const icon = item.querySelector('.faq-icon .ic');
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        if (!icon || !question || !answer) return;

        item.classList.add('active');
        question.setAttribute('aria-expanded', 'true');
        answer.setAttribute('aria-hidden', 'false');
        icon.querySelector('use')?.setAttribute('href', '#ic-minus');
    };

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const icon = item.querySelector('.faq-icon .ic');
        const answer = item.querySelector('.faq-answer');
        if (!question || !icon || !answer) return;

        answer.setAttribute('aria-hidden', 'true');
        question.setAttribute('aria-expanded', 'false');
        item.classList.add('is-collapsible');

        const handleToggle = () => {
            const isActive = item.classList.contains('active');
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    closeFaq(otherItem);
                }
            });
            if (isActive) {
                closeFaq(item);
            } else {
                openFaq(item);
            }
        };

        // a native button: Enter and Space already fire click, so no key handler (it would toggle twice)
        question.addEventListener('click', handleToggle);
    });
}

function initResourcesPage() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const recommendBtn = document.getElementById('recommend-btn');
    const recommendationForm = document.getElementById('recommendation-form');
    const recommendationSuccess = document.getElementById('recommendation-success');
    const cancelBtn = document.getElementById('cancel-recommendation');
    const recommendationFormElement = recommendationForm?.querySelector('form');

    const hideRecommendationForm = () => {
        if (!recommendationForm) return;
        recommendationForm.hidden = true;
        recommendationForm.style.maxHeight = '0';
        recommendBtn?.setAttribute('aria-expanded', 'false');
    };

    const showRecommendationForm = () => {
        if (!recommendationForm) return;
        recommendationForm.hidden = false;
        setTimeout(() => {
            recommendationForm.style.maxHeight = recommendationForm.scrollHeight + 'px';
        }, 20);
        // Once open, let it grow: error messages would otherwise spill past the frozen height
        setTimeout(() => {
            if (!recommendationForm.hidden) recommendationForm.style.maxHeight = 'none';
        }, 350);
        recommendBtn?.setAttribute('aria-expanded', 'true');
        if (recommendationSuccess) {
            recommendationSuccess.style.display = 'none';
            recommendationSuccess.innerHTML = '';
        }
    };

    if (tabBtns.length && tabContents.length) {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                btn.classList.add('active');
                const tabId = btn.getAttribute('data-tab');
                const target = document.getElementById(tabId);
                if (target) target.classList.add('active');
                window.dispatchEvent(new Event('scroll'));
            });
        });
    }

    if (recommendBtn && recommendationForm && cancelBtn) {
        // without JS the form is simply open and this toggle stays hidden
        recommendBtn.hidden = false;
        hideRecommendationForm();

        recommendBtn.addEventListener('click', showRecommendationForm);

        cancelBtn.addEventListener('click', () => {
            recommendationFormElement?.querySelectorAll('[aria-invalid]').forEach((field) => setFieldError(field, ''));
            hideRecommendationForm();
        });

        if (recommendationFormElement) {
            const recommendSubmitBtn = recommendationFormElement.querySelector('button[type="submit"]');
            const recommendSubmitLabel = recommendSubmitBtn ? recommendSubmitBtn.innerHTML : '';
            let recommendError = null;
            recommendationFormElement.noValidate = true;
            watchFields(recommendationFormElement);

            recommendationFormElement.addEventListener('submit', async (e) => {
                e.preventDefault();
                if (!validateForm(recommendationFormElement)) return;

                if (recommendSubmitBtn) {
                    recommendSubmitBtn.disabled = true;
                    recommendSubmitBtn.textContent = 'Sending...';
                }
                if (recommendError) {
                    recommendError.remove();
                    recommendError = null;
                }

                try {
                    const response = await fetch(FORMSPREE_ENDPOINT, {
                        method: 'POST',
                        headers: { Accept: 'application/json' },
                        body: new FormData(recommendationFormElement),
                    });

                    if (!response.ok) throw new Error('Form submission failed');

                    if (recommendationSuccess) {
                        recommendationSuccess.style.display = 'block';
                        recommendationSuccess.setAttribute('role', 'status');
                        recommendationSuccess.tabIndex = -1;
                        recommendationSuccess.innerHTML = `
                            <h3>Thanks for the recommendation!</h3>
                            <p>Your suggestion has been received. I’ll review it and add it to the list if it fits well.</p>
                        `;
                        requestAnimationFrame(() => recommendationSuccess.focus({ preventScroll: true }));
                    }

                    recommendationFormElement.reset();
                    hideRecommendationForm();
                } catch (err) {
                    recommendError = document.createElement('p');
                    recommendError.className = 'form-error-message';
                    recommendError.setAttribute('role', 'alert');
                    recommendError.textContent = "Something went wrong sending your recommendation. Please try again in a moment.";
                    recommendationFormElement.appendChild(recommendError);
                } finally {
                    if (recommendSubmitBtn) {
                        recommendSubmitBtn.disabled = false;
                        recommendSubmitBtn.innerHTML = recommendSubmitLabel;
                    }
                }
            });
        }
    }

}


// Filter and category buttons are toggles: say which one is on
function syncPressed(buttons) {
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.classList.contains('active'))));
    buttons.forEach((b) => b.addEventListener('click', () => requestAnimationFrame(() =>
        buttons.forEach((x) => x.setAttribute('aria-pressed', String(x.classList.contains('active')))))));
}

function initProjectsPage() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectItems = document.querySelectorAll('.project-item');

    if (filterBtns.length && projectItems.length) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filterValue = btn.getAttribute('data-filter');
                projectItems.forEach(item => {
                    const category = item.getAttribute('data-category');
                    const match = filterValue === 'all' || filterValue === category;
                    item.style.display = match ? 'block' : 'none';
                    item.style.opacity = match ? '1' : '0';
                    item.style.transform = match ? 'translateY(0)' : 'translateY(20px)';
                });
            });
        });
    }
}

function initPageScripts() {
    initHeaderMenu();
    initScrollProgress();
    initScrollAnimations();
    initProjectCardHover();
    initHeroParallax();
    initContactForm();
    initContactFaq();
    initResourcesPage();
    initProjectsPage();
    syncPressed([...document.querySelectorAll('.filter-btn')]);
    syncPressed([...document.querySelectorAll('.tab-btn')]);
    initArchiveBar();
    setupProfileImageTilt();
    createParticles();
}

// The archive notice can be dismissed for the rest of the visit
function initArchiveBar() {
    const bar = document.querySelector('[data-archive-bar]');
    if (!bar) return;
    const KEY = 'v2-archive-dismissed';
    try { if (sessionStorage.getItem(KEY) === '1') { bar.remove(); return; } } catch { /* storage unavailable */ }
    const close = bar.querySelector('.archive-bar__close');
    if (!close) return;
    close.hidden = false;
    close.addEventListener('click', () => {
        bar.remove();
        try { sessionStorage.setItem(KEY, '1'); } catch { /* storage unavailable */ }
    });
}

function initCustomCursor() {
    if (prefersReducedMotion || isTouchDevice || window.innerWidth < 768) return;

    const cursorDot = document.createElement('div');
    cursorDot.className = 'cursor-dot';
    const cursorOutline = document.createElement('div');
    cursorOutline.className = 'cursor-outline';
    document.body.appendChild(cursorDot);
    document.body.appendChild(cursorOutline);

    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    let outlineX = 0;
    let outlineY = 0;
    const speed = 0.1;
    const outlineSpeed = 0.08;

    window.addEventListener('mousemove', (event) => {
        mouseX = event.clientX;
        mouseY = event.clientY;
    });

    window.addEventListener('mousedown', () => {
        cursorDot.style.transform = 'translate(-50%, -50%) scale(0.8)';
        cursorOutline.style.transform = 'translate(-50%, -50%) scale(1.5)';
    });
    window.addEventListener('mouseup', () => {
        cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
        cursorOutline.style.transform = 'translate(-50%, -50%) scale(1)';
    });
    document.addEventListener('mouseleave', () => {
        cursorDot.style.opacity = '0';
        cursorOutline.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
        cursorDot.style.opacity = '1';
        cursorOutline.style.opacity = '0.6';
    });

    // Moves with transforms (left/top forced a layout every frame) and stops once it has
    // caught up with the pointer, instead of running a loop forever.
    let frame = 0;
    const animateCursor = () => {
        cursorX += (mouseX - cursorX) * speed;
        cursorY += (mouseY - cursorY) * speed;
        outlineX += (mouseX - outlineX) * outlineSpeed;
        outlineY += (mouseY - outlineY) * outlineSpeed;
        cursorDot.style.translate = `${cursorX}px ${cursorY}px`;
        cursorOutline.style.translate = `${outlineX}px ${outlineY}px`;
        const settled = Math.abs(mouseX - outlineX) < 0.3 && Math.abs(mouseY - outlineY) < 0.3;
        frame = settled ? 0 : requestAnimationFrame(animateCursor);
    };
    window.addEventListener('mousemove', () => { if (!frame) frame = requestAnimationFrame(animateCursor); });
}

window.addEventListener('DOMContentLoaded', () => {
    initPageScripts();
    initCustomCursor();
});

window.addEventListener('resize', debounce(() => {
    if (document.querySelector('.particles-container')) {
        createParticles();
    }
}));
