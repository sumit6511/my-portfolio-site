// Global utility and feature initialization
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

    const toggleMenu = () => {
        const isOpen = !navLinks.classList.contains('active');
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active');
        document.body.classList.toggle('menu-open');
        hamburger.setAttribute('aria-expanded', String(isOpen));
    };

    hamburger.addEventListener('click', toggleMenu);
    navLinksItems.forEach(item => {
        item.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                hamburger.classList.remove('active');
                document.body.classList.remove('menu-open');
                hamburger.setAttribute('aria-expanded', 'false');
            }
        });
    });

    window.addEventListener('scroll', throttle(updateHeader));
    updateHeader();
}

function initScrollAnimations() {
    const elements = document.querySelectorAll('[data-aos]');
    if (!elements.length) return;

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('aos-animate');
                    obs.unobserve(entry.target);
                }
            });
        }, {
            root: null,
            rootMargin: '0px 0px -15% 0px',
            threshold: 0.1,
        });

        elements.forEach(element => observer.observe(element));
        return;
    }

    const animateOnScroll = () => {
        const windowHeight = window.innerHeight;
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            if (elementPosition < windowHeight * 0.85) {
                element.classList.add('aos-animate');
            }
        });
    };

    window.addEventListener('scroll', throttle(animateOnScroll, 100), { passive: true });
    animateOnScroll();
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

function initTypingAnimation() {
    const typedOutput = document.getElementById('typed-output');
    const textElements = document.querySelectorAll('.to-be-typed span');
    if (!typedOutput || !textElements.length) return;

    const texts = Array.from(textElements).map(elem => elem.getAttribute('data-type') || '');
    let currentTextIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;

    const type = () => {
        const currentText = texts[currentTextIndex];
        if (isDeleting) {
            typedOutput.textContent = currentText.substring(0, currentCharIndex - 1);
            currentCharIndex -= 1;
        } else {
            typedOutput.textContent = currentText.substring(0, currentCharIndex + 1);
            currentCharIndex += 1;
        }

        let typingSpeed = isDeleting ? 50 : 100;
        if (!isDeleting && currentCharIndex === currentText.length) {
            typingSpeed = 2000;
            isDeleting = true;
        }
        if (isDeleting && currentCharIndex === 0) {
            isDeleting = false;
            currentTextIndex = (currentTextIndex + 1) % texts.length;
            typingSpeed = 1000;
        }

        setTimeout(type, typingSpeed);
    };

    setTimeout(type, 1000);
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
    if (existingContainer) {
        existingContainer.remove();
    }

    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles-container';
    document.body.insertBefore(particlesContainer, document.body.firstChild);

    const screenWidth = window.innerWidth;
    const numberOfParticles = screenWidth < 576 ? 30 : screenWidth < 992 ? 60 : 90;

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

    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formInputs = contactForm.querySelectorAll('input, textarea');
        let valid = true;

        formInputs.forEach(input => {
            if (!input.value.trim()) {
                valid = false;
                input.classList.add('error');
            } else {
                input.classList.remove('error');
            }
        });

        if (!valid) return;

        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <h3>Message Sent Successfully!</h3>
            <p>Thank you for reaching out. I&#39;ll get back to you as soon as possible.</p>
        `;
        contactForm.innerHTML = '';
        contactForm.appendChild(successMessage);
    });
}

function initContactFaq() {
    const faqItems = document.querySelectorAll('.faq-item');
    if (!faqItems.length) return;

    const closeFaq = (item) => {
        const icon = item.querySelector('.faq-icon i');
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        if (!icon || !question || !answer) return;

        item.classList.remove('active');
        question.setAttribute('aria-expanded', 'false');
        answer.setAttribute('aria-hidden', 'true');
        icon.classList.remove('fa-minus');
        icon.classList.add('fa-plus');
    };

    const openFaq = (item) => {
        const icon = item.querySelector('.faq-icon i');
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');
        if (!icon || !question || !answer) return;

        item.classList.add('active');
        question.setAttribute('aria-expanded', 'true');
        answer.setAttribute('aria-hidden', 'false');
        icon.classList.remove('fa-plus');
        icon.classList.add('fa-minus');
    };

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const icon = item.querySelector('.faq-icon i');
        const answer = item.querySelector('.faq-answer');
        if (!question || !icon || !answer) return;

        answer.setAttribute('aria-hidden', 'true');
        question.setAttribute('aria-expanded', 'false');

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

        question.addEventListener('click', handleToggle);
        question.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleToggle();
            }
        });
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
        hideRecommendationForm();

        recommendBtn.addEventListener('click', showRecommendationForm);

        cancelBtn.addEventListener('click', () => {
            hideRecommendationForm();
            recommendBtn.style.display = 'inline-block';
        });

        if (recommendationFormElement) {
            recommendationFormElement.addEventListener('submit', (e) => {
                e.preventDefault();

                if (recommendationSuccess) {
                    recommendationSuccess.style.display = 'block';
                    recommendationSuccess.innerHTML = `
                        <h3>Thanks for the recommendation!</h3>
                        <p>Your suggestion has been received. I&#39;ll review it and add it to the list if it fits well.</p>
                    `;
                }

                recommendationFormElement.reset();
                hideRecommendationForm();
                recommendBtn.style.display = 'inline-block';
            });
        }
    }

    initCustomSelects();
}

function initCustomSelects() {
    const wrappers = document.querySelectorAll('.custom-select-wrapper');
    const closeAll = () => {
        document.querySelectorAll('.custom-select.open').forEach(select => {
            select.classList.remove('open');
            select.setAttribute('aria-expanded', 'false');
        });
    };

    wrappers.forEach(wrapper => {
        const select = wrapper.querySelector('select');
        const customSelect = wrapper.querySelector('.custom-select');
        const trigger = wrapper.querySelector('.custom-select__trigger');
        const options = wrapper.querySelectorAll('.custom-option');

        if (!select || !customSelect || !trigger || !options.length) return;

        const setValue = (value, label) => {
            select.value = value;
            trigger.textContent = label;
            options.forEach(option => {
                option.classList.toggle('selected', option.dataset.value === value);
                option.setAttribute('aria-selected', option.dataset.value === value ? 'true' : 'false');
            });
        };

        customSelect.addEventListener('click', (event) => {
            event.stopPropagation();
            const isOpen = customSelect.classList.toggle('open');
            customSelect.setAttribute('aria-expanded', String(isOpen));
            if (isOpen) {
                closeAll();
                customSelect.classList.add('open');
            }
        });

        customSelect.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                customSelect.click();
            }
            if (event.key === 'Escape') {
                closeAll();
            }
        });

        options.forEach(option => {
            option.addEventListener('click', (event) => {
                event.stopPropagation();
                const value = option.dataset.value;
                const label = option.textContent.trim();
                setValue(value, label);
                closeAll();
                customSelect.focus();
            });
        });
    });

    document.addEventListener('click', closeAll);
}

function initProjectsPage() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectItems = document.querySelectorAll('.project-item');
    const backBtns = document.querySelectorAll('.back-to-projects');
    const viewProjectBtns = document.querySelectorAll('.view-project');

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

    backBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.project-details').forEach(section => {
                section.style.display = 'none';
            });
            const gallery = document.querySelector('.projects-gallery');
            if (gallery) gallery.scrollIntoView({ behavior: 'smooth' });
        });
    });

    viewProjectBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.project-details').forEach(section => {
                section.style.display = 'none';
            });
            const targetId = btn.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            if (targetSection) {
                targetSection.style.display = 'block';
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

function initPageScripts() {
    initHeaderMenu();
    initScrollAnimations();
    initProjectCardHover();
    initHeroParallax();
    initTypingAnimation();
    initContactForm();
    initContactFaq();
    initResourcesPage();
    initProjectsPage();
    setupProfileImageTilt();
    createParticles();
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

    const animateCursor = () => {
        cursorX += (mouseX - cursorX) * speed;
        cursorY += (mouseY - cursorY) * speed;
        outlineX += (mouseX - outlineX) * outlineSpeed;
        outlineY += (mouseY - outlineY) * outlineSpeed;
        cursorDot.style.left = `${Math.round(cursorX)}px`;
        cursorDot.style.top = `${Math.round(cursorY)}px`;
        cursorOutline.style.left = `${Math.round(outlineX)}px`;
        cursorOutline.style.top = `${Math.round(outlineY)}px`;
        requestAnimationFrame(animateCursor);
    };

    animateCursor();
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
