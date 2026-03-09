// ========== CUSTOM CURSOR ==========
const cursorDot  = document.getElementById('cursorDot');
const cursorRing = document.getElementById('cursorRing');

let mouseX = 0, mouseY = 0;
let ringX  = 0, ringY  = 0;

window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // dot follows instantly
    cursorDot.style.left = mouseX + 'px';
    cursorDot.style.top  = mouseY + 'px';
});

// ring follows with smooth lag
function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;

    cursorRing.style.left = ringX + 'px';
    cursorRing.style.top  = ringY + 'px';

    requestAnimationFrame(animateRing);
}
animateRing();

// expand on hoverable elements
const hoverTargets = document.querySelectorAll(
    'a, button, .card, .nav-link, .btn-primary, .btn-secondary, .social-link, .hamburger'
);

hoverTargets.forEach(el => {
    el.addEventListener('mouseenter', () => {
        cursorDot.classList.add('expanded');
        cursorRing.classList.add('expanded');
    });
    el.addEventListener('mouseleave', () => {
        cursorDot.classList.remove('expanded');
        cursorRing.classList.remove('expanded');
    });
});

// shrink on click
window.addEventListener('mousedown', () => {
    cursorDot.classList.add('clicked');
    cursorRing.classList.add('clicked');
});
window.addEventListener('mouseup', () => {
    cursorDot.classList.remove('clicked');
    cursorRing.classList.remove('clicked');
});
// ========== THEME TOGGLE ==========
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;

    // Check local storage
    if (localStorage.getItem('theme') === 'dark') {
        body.classList.add('dark');
    }

    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark');
        localStorage.setItem('theme', body.classList.contains('dark') ? 'dark' : 'light');
    });

    // ========== MOBILE MENU ==========
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const overlay = document.getElementById('mobileOverlay');

    function closeMobileMenu() {
        navMenu.classList.remove('active');
        overlay.classList.remove('active');
    }

    hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        navMenu.classList.toggle('active');
        overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', closeMobileMenu);
    document.querySelectorAll('#navMenu .nav-link').forEach(link => {
        link.addEventListener('click', closeMobileMenu);
    });

    // ========== CUSTOM ALERT ==========
const customAlert = document.getElementById('customAlert');
const customAlertMsg = document.getElementById('customAlertMsg');
const customAlertClose = document.getElementById('customAlertClose');

function showAlert(message) {
    customAlertMsg.textContent = message;
    customAlert.classList.add('active');
}

function closeAlert() {
    customAlert.classList.remove('active');
}

customAlertClose.addEventListener('click', closeAlert);

// close if clicking outside the box
customAlert.addEventListener('click', function(e) {
    if (e.target === customAlert) closeAlert();
});

// close on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeAlert();
});

// ========== MULTI-STEP FORM ==========
let currentStep = 1;
const totalSteps = 3;
const progress = document.getElementById('formProgress');

function updateProgress() {
    let percent = (currentStep / totalSteps) * 100;
    progress.style.width = percent + '%';
}

window.nextStep = function(step) {
    if (step === 1) {
        let inputs = document.querySelectorAll('#step1 [required]');
        for (let inp of inputs) {
            if (!inp.value.trim()) {
                showAlert('Please fill all required fields in Part A before continuing.');
                return;
            }
        }
    }
    if (step === 2) {
        let inputs = document.querySelectorAll('#step2 [required]');
        for (let inp of inputs) {
            if (!inp.value.trim()) {
                showAlert('Please fill all required fields in Part B before continuing.');
                return;
            }
        }
    }
    document.getElementById('step' + step).classList.remove('active');
    currentStep = step + 1;
    document.getElementById('step' + currentStep).classList.add('active');
    updateProgress();
}

window.prevStep = function(step) {
    document.getElementById('step' + step).classList.remove('active');
    currentStep = step - 1;
    document.getElementById('step' + currentStep).classList.add('active');
    updateProgress();
}

// Form submit
document.getElementById('multiStepForm').addEventListener('submit', function(e) {
    e.preventDefault();
    showAlert('Form submitted successfully! We will be in touch within 24 hours.');
});

// ========== REVEAL ON SCROLL ==========
const reveals = document.querySelectorAll('.reveal');

reveals.forEach(el => {
    el.style.transition = 'opacity 0.8s, transform 0.8s';
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
});

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        } else {
            entry.target.style.opacity = '0';
            entry.target.style.transform = 'translateY(20px)';
        }
    });
}, { threshold: 0.1 });

reveals.forEach(el => revealObserver.observe(el));


    // ========== SCROLL PROGRESS BAR ==========
const scrollProgressBar = document.getElementById('scrollProgress');

window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (scrollTop / docHeight) * 100;
    scrollProgressBar.style.width = progress + '%';
});



// ========== PAGE LOADER ==========
const pageLoader = document.getElementById('pageLoader');

window.addEventListener('load', () => {
    setTimeout(() => {
        pageLoader.classList.add('hidden');
    }, 2000);
});

// ========== STICKY FLOATING CTA + BACK TO TOP ==========
const floatingCTA  = document.getElementById('floatingCTA');
const backToTopBtn = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    const heroHeight = document.querySelector('.hero').offsetHeight;

    if (window.scrollY > heroHeight * 0.8) {
        floatingCTA.classList.add('visible');
        backToTopBtn.classList.add('visible');
    } else {
        floatingCTA.classList.remove('visible');
        backToTopBtn.classList.remove('visible');
    }
});

backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ========== CARD MICRO ANIMATIONS ==========
const cards = document.querySelectorAll('.card');

const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('card-visible');
        } else {
            entry.target.classList.remove('card-visible');
        }
    });
}, { threshold: 0.15 });

cards.forEach(card => cardObserver.observe(card));


// ========== HERO CAROUSEL ==========
const slides       = document.querySelectorAll('.hero-slide');
const dots         = document.querySelectorAll('.carousel-dot');
const heroHeading  = document.getElementById('heroHeading');
const prevBtn      = document.getElementById('carouselPrev');
const nextBtn      = document.getElementById('carouselNext');

let currentSlide   = 0;
let carouselTimer  = null;
const SLIDE_DELAY  = 5000;

function goToSlide(index) {
    // remove active from current
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');

    // update index
    currentSlide = (index + slides.length) % slides.length;

    // animate heading out
    heroHeading.classList.add('heading-exit');

    setTimeout(() => {
        // swap heading content
        heroHeading.innerHTML = slides[currentSlide].dataset.heading;

        // animate heading in
        heroHeading.classList.remove('heading-exit');
        heroHeading.classList.add('heading-enter');

        setTimeout(() => {
            heroHeading.classList.remove('heading-enter');
        }, 500);
    }, 500);

    // activate new slide + dot
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}

function nextSlide() {
    goToSlide(currentSlide + 1);
}
function prevSlide() {
    goToSlide(currentSlide - 1);
}

function startAutoPlay() {
    carouselTimer = setInterval(nextSlide, SLIDE_DELAY);
}
function resetAutoPlay() {
    clearInterval(carouselTimer);
    startAutoPlay();
}

// arrow buttons
nextBtn.addEventListener('click', () => { nextSlide(); resetAutoPlay(); });
prevBtn.addEventListener('click', () => { prevSlide(); resetAutoPlay(); });

// dot buttons
dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
        goToSlide(i);
        resetAutoPlay();
    });
});

// start
startAutoPlay();