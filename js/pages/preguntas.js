let allFaqItems = [];
let currentCategory = 'all';
let isAnimating = false;

document.addEventListener('DOMContentLoaded', function() {
    initializeFaqPage();
    setupCategories();
    setupFaqItems();
    setupBackToTop();
    if (typeof updateCartCount === 'function') {
        updateCartCount();
    }
    setupIntersectionObserver();
    setupScrollEffects();
    setupAccessibility();
    setupAnalytics();
    setupEasterEgg();
});

/* ================= INICIALIZACIÓN ================= */

function initializeFaqPage() {
    console.log('Digital Point - FAQ inicializado');
    allFaqItems = Array.from(document.querySelectorAll('.faq-item'));

    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 500);

    updateCategoryCounts();
}

/* ================= CATEGORÍAS ================= */

function setupCategories() {
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.dataset.category;

            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);

            setActiveCategory(category);
            filterByCategory(category);
        });
    });
}

function setActiveCategory(category) {
    currentCategory = category;
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.category === category);
    });
}

function filterByCategory(category) {
    const noResults = document.getElementById('noResults');

    allFaqItems.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            showFaqItem(item);
        } else {
            hideFaqItem(item);
        }
    });

    if (noResults) {
        noResults.style.display = 'none';
    }
}

function updateCategoryCounts() {
    const categories = ['all', 'productos', 'compras', 'envios', 'soporte'];

    categories.forEach(category => {
        const count = category === 'all'
            ? allFaqItems.length
            : allFaqItems.filter(item => item.dataset.category === category).length;

        const id = `count${category.charAt(0).toUpperCase() + category.slice(1)}`;
        const countElement = document.getElementById(id);
        if (countElement) {
            countElement.textContent = count;
        }
    });
}

/* ================= ITEMS FAQ (ACORDEÓN) ================= */

function setupFaqItems() {
    allFaqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (!question) return;

        question.addEventListener('click', function() {
            toggleFaqItem(item);
        });
    });
}

function toggleFaqItem(item) {
    const isActive = item.classList.contains('active');
    if (isActive) {
        closeFaqItem(item);
    } else {
        openFaqItem(item);
    }
}

function openFaqItem(item) {
    item.classList.add('active');
    setTimeout(() => {
        const rect = item.getBoundingClientRect();
        const header = document.querySelector('.header');
        const headerHeight = header ? header.offsetHeight : 0;
        if (rect.top < headerHeight) {
            item.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }, 300);
}

function closeFaqItem(item) {
    item.classList.remove('active');
}

function showFaqItem(item) {
    item.classList.remove('hidden');
    item.style.display = 'block';
}

function hideFaqItem(item) {
    item.classList.add('hidden');
    setTimeout(() => {
        if (item.classList.contains('hidden')) {
            item.style.display = 'none';
        }
    }, 300);
}

function countVisibleItems() {
    return allFaqItems.filter(item => !item.classList.contains('hidden')).length;
}

/* ================= BOTÓN BACK TO TOP (DE ESTA PÁGINA) ================= */

function setupBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    if (!backToTopBtn) return;

    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    backToTopBtn.addEventListener('click', function() {
        this.style.transform = 'scale(0.9)';
        setTimeout(() => {
            this.style.transform = '';
        }, 200);

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

/* ================= INTERSECTION OBSERVER (ANIMACIONES) ================= */

function setupIntersectionObserver() {
    const options = {
        root: null,
        rootMargin: '-10% 0px -10% 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
            }
        });
    }, options);

    const animatedElements = document.querySelectorAll('[data-aos]');
    animatedElements.forEach(el => {
        observer.observe(el);
    });
}

/* ================= EFECTOS DE SCROLL EN HEADER (LOCAL A FAQ) ================= */

function setupScrollEffects() {
    const header = document.querySelector('.header');
    window.addEventListener('scroll', debounce(function() {
        const scrollY = window.scrollY;
        if (header) {
            if (scrollY > 100) {
                header.style.background = 'rgba(0, 0, 0, 0.98)';
                header.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.3)';
                header.style.backdropFilter = 'blur(15px)';
            } else {
                header.style.background = 'rgba(0, 0, 0, 0.95)';
                header.style.boxShadow = 'none';
                header.style.backdropFilter = 'blur(10px)';
            }
        }
    }, 16));
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/* ================= ACCESIBILIDAD ================= */

function setupAccessibility() {
    allFaqItems.forEach((item, index) => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');

        if (!question || !answer) return;

        question.setAttribute('tabindex', '0');
        question.setAttribute('role', 'button');
        question.setAttribute('aria-expanded', 'false');
        question.setAttribute('aria-controls', `faq-answer-${index}`);

        answer.setAttribute('id', `faq-answer-${index}`);
        answer.setAttribute('role', 'region');

        question.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleFaqItem(item);
                const isActive = item.classList.contains('active');
                question.setAttribute('aria-expanded', isActive.toString());
            }
        });
    });

    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', 'false');
    });
}

/* ================= ANALYTICS SIMPLES ================= */

function trackFaqInteraction(action, category, question) {
    console.log('FAQ Interaction:', {
        action: action,
        category: category,
        question: question,
        timestamp: new Date().toISOString()
    });
}

function setupAnalytics() {
    const categoryBtns = document.querySelectorAll('.category-btn');
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            trackFaqInteraction('category_select', this.dataset.category, '');
        });
    });

    allFaqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (!question) return;

        question.addEventListener('click', function() {
            const questionText = this.querySelector('h3') ? this.querySelector('h3').textContent : '';
            trackFaqInteraction('question_expand', item.dataset.category, questionText);
        });
    });
}


function setupEasterEgg() {
    const konamiCode = [
        'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
        'KeyB', 'KeyA'
    ];
    let userInput = [];

    document.addEventListener('keydown', function(e) {
        userInput.push(e.code);
        if (userInput.length > konamiCode.length) {
            userInput.shift();
        }
        if (userInput.join(',') === konamiCode.join(',')) {
            if (typeof showToast === 'function') {
                showToast('Codigo Konami activado. Eres un verdadero gamer.', 'success');
            }
            document.body.style.animation = 'rainbow 2s ease-in-out';
            setTimeout(() => {
                document.body.style.animation = '';
            }, 2000);
            userInput = [];
        }
    });
}
