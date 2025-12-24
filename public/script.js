// ============================================
// DRIFT LANDING PAGE - CINEMATIC EXPERIENCE
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navLinks = document.getElementById('nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            this.classList.toggle('active');
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
            });
        });
    }

    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const navHeight = navbar ? navbar.offsetHeight : 0;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }
        });
    });

    // Cinematic reveal animations
    const revealElements = document.querySelectorAll('.reveal');
    const revealOnScroll = () => {
        revealElements.forEach(el => {
            const elementTop = el.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            if (elementTop < windowHeight - 100) {
                el.classList.add('revealed');
            }
        });
    };
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Initial check

    // Parallax effect for hero
    const hero = document.querySelector('.hero');
    if (hero) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            hero.style.setProperty('--scroll', scrolled * 0.5 + 'px');
        });
    }

    // Glowing cursor effect
    const glowCursor = document.createElement('div');
    glowCursor.className = 'glow-cursor';
    document.body.appendChild(glowCursor);

    document.addEventListener('mousemove', (e) => {
        glowCursor.style.left = e.clientX + 'px';
        glowCursor.style.top = e.clientY + 'px';
    });

    // Counter animation for stats
    const animateValue = (element, start, end, duration, suffix = '') => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            element.textContent = value + suffix;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    };

    // Observe stats for animation
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumbers = entry.target.querySelectorAll('.stat-number');
                statNumbers.forEach(stat => {
                    const text = stat.dataset.value || stat.textContent;
                    if (text.includes('+')) {
                        animateValue(stat, 0, parseInt(text), 2000, '+');
                    } else if (text.includes('K')) {
                        animateValue(stat, 0, parseFloat(text), 2000, 'K+');
                    } else if (!text.includes('/')) {
                        animateValue(stat, 0, parseFloat(text), 2000, text.includes('.') ? '' : '');
                    }
                });
                statsObserver.disconnect();
            }
        });
    }, { threshold: 0.5 });

    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) statsObserver.observe(heroStats);

    // Magnetic button effect
    document.querySelectorAll('.btn-primary, .store-badge').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
        });
    });

    // Track Google Play clicks
    document.querySelectorAll('a[href*="play.google.com"]').forEach(link => {
        link.addEventListener('click', () => {
            if (typeof gtag !== 'undefined') {
                gtag('event', 'click', {
                    'event_category': 'App Download',
                    'event_label': 'Google Play'
                });
            }
        });
    });

    // Text scramble effect for hero title
    const scrambleText = (element) => {
        const originalText = element.textContent;
        const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        let iteration = 0;
        const interval = setInterval(() => {
            element.textContent = originalText
                .split('')
                .map((char, index) => {
                    if (index < iteration) return originalText[index];
                    if (char === ' ') return ' ';
                    return chars[Math.floor(Math.random() * chars.length)];
                })
                .join('');
            if (iteration >= originalText.length) clearInterval(interval);
            iteration += 1/3;
        }, 30);
    };

    // Trigger scramble on hero load
    const heroTitle = document.querySelector('.hero-title .location');
    if (heroTitle) {
        setTimeout(() => scrambleText(heroTitle), 500);
    }
});
