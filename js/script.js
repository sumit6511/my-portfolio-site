// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const header = document.querySelector('header');
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navLinksItems = document.querySelectorAll('.nav-links li');
    
    // Scroll functions
    window.addEventListener('scroll', () => {
        // Header scroll class for background change
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // Check for elements to animate on scroll
        animateOnScroll();
    });
    
    // Mobile menu toggle
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active');
        document.body.classList.toggle('menu-open');
    });
    
    // Close mobile menu when clicking on a link
    navLinksItems.forEach(item => {
        item.addEventListener('click', () => {
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                hamburger.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });
    });
    
    // Animate elements on scroll
    function animateOnScroll() {
        const elements = document.querySelectorAll('[data-aos]');
        
        elements.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (elementPosition < windowHeight * 0.85) {
                element.classList.add('aos-animate');
            }
        });
    }
    
    // Run animation check on load
    animateOnScroll();
    
    // Add hover effect to project cards
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px)';
            card.style.boxShadow = 'var(--shadow-dark)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = 'var(--shadow)';
        });
    });
    
    // Add typing effect to hero section
    const codeElement = document.querySelector('.code-block code');
    if (codeElement) {
        const codeText = codeElement.innerHTML;
        codeElement.innerHTML = '';
        
        let i = 0;
        const typeWriter = () => {
            if (i < codeText.length) {
                codeElement.innerHTML += codeText.charAt(i);
                i++;
                setTimeout(typeWriter, 20);
            }
        };
        
        // Start the typing effect after a short delay
        setTimeout(typeWriter, 1000);
    }
    
    // Add subtle parallax effect to hero section
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        window.addEventListener('mousemove', (e) => {
            const x = e.clientX / window.innerWidth;
            const y = e.clientY / window.innerHeight;
            
            heroSection.style.backgroundPosition = `${x * 20}px ${y * 20}px`;
        });
    }
    
    // Form validation for contact form (if exists on the page)
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Simple validation
            let valid = true;
            const formInputs = contactForm.querySelectorAll('input, textarea');
            
            formInputs.forEach(input => {
                if (!input.value.trim()) {
                    valid = false;
                    input.classList.add('error');
                } else {
                    input.classList.remove('error');
                }
            });
            
            if (valid) {
                // Show success message (in a real app, you would submit the form here)
                const successMessage = document.createElement('div');
                successMessage.classList.add('success-message');
                successMessage.textContent = 'Thank you for your message! I will get back to you soon.';
                
                contactForm.innerHTML = '';
                contactForm.appendChild(successMessage);
            }
        });
    }
    
    // Create particles after a small delay to ensure DOM is fully ready
    setTimeout(createParticles, 100);
    
    // Setup profile image tilt effect
    setupProfileImageTilt();
});

// Add custom cursor effect
const cursorDot = document.createElement('div');
cursorDot.classList.add('cursor-dot');
document.body.appendChild(cursorDot);

const cursorOutline = document.createElement('div');
cursorOutline.classList.add('cursor-outline');
document.body.appendChild(cursorOutline);

// Cursor positions
let mouseX = 0;
let mouseY = 0;
let cursorX = 0;
let cursorY = 0;
let outlineX = 0;
let outlineY = 0;
const speed = 0.1; // Smoothing factor (lower = smoother)
const outlineSpeed = 0.08; // Slower for trailing effect

// Mouse move handler with linear interpolation for smooth following
window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// Mouse down animation effect
window.addEventListener('mousedown', () => {
    cursorDot.style.transform = 'translate(-50%, -50%) scale(0.8)';
    cursorOutline.style.transform = 'translate(-50%, -50%) scale(1.5)';
});

// Mouse up animation effect
window.addEventListener('mouseup', () => {
    cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
    cursorOutline.style.transform = 'translate(-50%, -50%) scale(1)';
});

// Mouse leaving window behavior
document.addEventListener('mouseleave', () => {
    cursorDot.style.opacity = '0';
    cursorOutline.style.opacity = '0';
});

// Mouse entering window behavior
document.addEventListener('mouseenter', () => {
    cursorDot.style.opacity = '1';
    cursorOutline.style.opacity = '0.6';
});

// Animation loop for smooth movement
function animateCursor() {
    // Interpolate the dot position for smooth movement
    cursorX += (mouseX - cursorX) * speed;
    cursorY += (mouseY - cursorY) * speed;
    
    // Interpolate the outline position for trailing effect
    outlineX += (mouseX - outlineX) * outlineSpeed;
    outlineY += (mouseY - outlineY) * outlineSpeed;
    
    // Apply positions with rounding to avoid subpixel rendering
    cursorDot.style.left = `${Math.round(cursorX)}px`;
    cursorDot.style.top = `${Math.round(cursorY)}px`;
    
    cursorOutline.style.left = `${Math.round(outlineX)}px`;
    cursorOutline.style.top = `${Math.round(outlineY)}px`;
    
    // Continue the animation loop
    requestAnimationFrame(animateCursor);
}

// Start the cursor animation
animateCursor();

// Function to create particles
function createParticles() {
    // Remove any existing particles container
    let existingContainer = document.querySelector('.particles-container');
    if (existingContainer) {
        existingContainer.remove();
    }
    
    // Create new particles container
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles-container';
    document.body.insertBefore(particlesContainer, document.body.firstChild);
    
    // Create particles
    const numberOfParticles = 150; // Increased number of particles
    
    for (let i = 0; i < numberOfParticles; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random size between 1px and 6px (smaller sizes)
        const size = Math.random() * 5 + 1;
        
        // Random position
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        
        // Random animation delay and duration (longer durations)
        const delay = Math.random() * 15;
        const duration = Math.random() * 30 + 20;
        
        // Choose color
        const colorIndex = Math.floor(Math.random() * 3);
        let color;
        
        switch(colorIndex) {
            case 0:
                color = 'var(--primary-color)';
                break;
            case 1:
                color = 'var(--secondary-color)';
                break;
            case 2:
                color = 'var(--accent-color)';
                break;
            default:
                color = 'var(--primary-color)';
        }
        
        // Apply styles
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${posX}vw`;
        particle.style.top = `${posY}vh`;
        particle.style.backgroundColor = color;
        particle.style.opacity = (Math.random() * 0.15 + 0.05).toFixed(2); // More transparent
        particle.style.animationDelay = `${delay}s`;
        particle.style.animationDuration = `${duration}s`;
        
        // Add to container
        particlesContainer.appendChild(particle);
    }
    
    console.log(`Created ${numberOfParticles} particles`);
}

// Typing animation for introduction
function setupTypingAnimation() {
    const typedOutput = document.getElementById('typed-output');
    const textElements = document.querySelectorAll('.to-be-typed span');
    
    if (!typedOutput || textElements.length === 0) return;
    
    let texts = [];
    textElements.forEach(elem => {
        texts.push(elem.getAttribute('data-type'));
    });
    
    let currentTextIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    let typingSpeed = 100; // Milliseconds per character
    
    function type() {
        const currentText = texts[currentTextIndex];
        
        if (isDeleting) {
            // Deleting text
            typedOutput.textContent = currentText.substring(0, currentCharIndex - 1);
            currentCharIndex--;
            typingSpeed = 50; // Faster when deleting
            
            if (currentCharIndex === 0) {
                isDeleting = false;
                currentTextIndex = (currentTextIndex + 1) % texts.length;
                typingSpeed = 1000; // Pause before typing next text
            }
        } else {
            // Typing text
            typedOutput.textContent = currentText.substring(0, currentCharIndex + 1);
            currentCharIndex++;
            typingSpeed = 100; // Normal typing speed
            
            if (currentCharIndex === currentText.length) {
                isDeleting = true;
                typingSpeed = 2000; // Pause before deleting
            }
        }
        
        setTimeout(type, typingSpeed);
    }
    
    // Start typing animation
    setTimeout(type, 1000); // Initial delay before starting
}

// Initialize typing animation when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Call our typing animation setup
    setupTypingAnimation();
    
    // Existing scripts will follow...
    createParticles();
    
    // Other DOMContentLoaded code...
});

// Reinitialize particles on resize for better responsiveness
window.addEventListener('resize', function() {
    createParticles();
});

// Add interactive 3D tilt effect to profile image
function setupProfileImageTilt() {
    const profileContainer = document.querySelector('.img-placeholder');
    
    if (!profileContainer) return;
    
    let bounds;
    
    function rotateToMouse(e) {
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        // Get position relative to the element
        const centerX = bounds.left + bounds.width / 2;
        const centerY = bounds.top + bounds.height / 2;
        
        // Calculate rotation based on mouse position
        const maxRotation = 10; // Maximum degrees of rotation
        
        // Calculate the angle of rotation
        const percentX = (mouseX - centerX) / (bounds.width / 2);
        const percentY = (mouseY - centerY) / (bounds.height / 2);
        
        // Apply transformation - higher value for Y rotation creates more dramatic effect on horizontal movement
        const rotateX = -1 * percentY * maxRotation; // Invert Y axis for natural feel
        const rotateY = percentX * maxRotation;
        
        // Apply transformation with slight zoom
        profileContainer.style.transform = `
            translateZ(25px)
            rotateX(${rotateX}deg)
            rotateY(${rotateY}deg)
            scale(1.03)
        `;
    }
    
    function resetTilt() {
        // Smoothly reset to original position
        profileContainer.style.transform = 'translateZ(0) rotateX(0) rotateY(0) scale(1)';
    }
    
    function updateBounds() {
        bounds = profileContainer.getBoundingClientRect();
    }
    
    // Add event listeners
    profileContainer.addEventListener('mouseenter', () => {
        updateBounds();
        document.addEventListener('mousemove', rotateToMouse);
    });
    
    profileContainer.addEventListener('mouseleave', () => {
        document.removeEventListener('mousemove', rotateToMouse);
        resetTilt();
    });
    
    // Update bounds on window resize
    window.addEventListener('resize', updateBounds);
} 