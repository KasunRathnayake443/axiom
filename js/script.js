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

function showAlert(message, isSuccess = false) {
    const alertTitle = document.getElementById('customAlertTitle');
    alertTitle.textContent = isSuccess ? 'Message Sent' : 'Required Fields Missing';
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

// ========== FORM SUBMIT (fetch → submit.php) ==========
document.getElementById('multiStepForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const submitBtn = this.querySelector('[type="submit"]');
    const originalText = submitBtn.textContent;

    // Disable button + show sending state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
        const formData = new FormData(this);

        const response = await fetch('submit.php', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            // Show success alert
            showAlert(result.message, true);

            // Reset form back to step 1
            document.getElementById('step3').classList.remove('active');
            document.getElementById('step1').classList.add('active');
            currentStep = 1;
            updateProgress();
            document.getElementById('multiStepForm').reset();
        } else {
            showAlert(result.message || 'Something went wrong. Please try again.');
        }

    } catch (err) {
        showAlert('Could not reach the server. Please check your connection and try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
});

// ========== REVEAL ON SCROLL ==========
// exclude hero-content and about-section from generic reveal
// as they are handled by the parallax engine below
const reveals = document.querySelectorAll(
    '.reveal:not(.hero-content):not(.about-section)'
);

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


// ========== PARALLAX SCROLL ENGINE ==========
const heroSection      = document.querySelector('.hero');
const heroContentEl    = document.querySelector('.hero-content');
const heroSlidesEl     = document.querySelector('.hero-slides');
const heroOverlayEl    = document.querySelector('.hero-overlay');
const heroVertLine     = document.querySelector('.hero-vert-line');
const heroScrollHint   = document.querySelector('.hero-scroll-hint');
const heroCarousel     = document.querySelector('.hero-carousel-controls');

const aboutSection     = document.querySelector('.about-section');
const aboutText        = document.querySelector('.about-text');
const aboutImageWrap   = document.querySelector('.about-image-wrap');

// remove transition from parallax elements so rAF controls them directly
[
    heroContentEl,
    heroSlidesEl,
    aboutSection,
    aboutText,
    aboutImageWrap
].forEach(el => {
    if (el) el.style.transition = 'none';
});

function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

let lastScrollY = window.scrollY;
let rafId       = null;

function applyParallax() {
    const scrollY    = window.scrollY;
    const heroH      = heroSection ? heroSection.offsetHeight : window.innerHeight;

    // ── HERO EXIT ──────────────────────────────────────────
    // progress: 0 = top of page, 1 = scrolled one full hero height
    const heroProgress = clamp(scrollY / (heroH * 0.75), 0, 1);

    if (heroContentEl) {
        const contentY  = heroProgress * -80;
        const contentOp = 1 - heroProgress * 1.4;

        // on mobile, skip parallax transform so CSS centering is not disrupted
        if (window.innerWidth > 800) {
            heroContentEl.style.transform = `translateY(${contentY}px)`;
        } else {
            heroContentEl.style.transform = 'none';
        }
        heroContentEl.style.opacity = clamp(contentOp, 0, 1);
    }

   if (heroSlidesEl) {
        const bgY  = scrollY * 0.35;
        const bgOp = 1 - heroProgress * 0.6;

        if (window.innerWidth > 800) {
            heroSlidesEl.style.transform = `translateY(${bgY}px)`;
        } else {
            heroSlidesEl.style.transform = 'none';
        }
        heroSlidesEl.style.opacity = clamp(bgOp, 0, 1);
    }

    if (heroOverlayEl) {
        // overlay deepens slightly as you scroll
        const overlayOp = clamp(0.6 + heroProgress * 0.4, 0, 1);
        heroOverlayEl.style.opacity = overlayOp;
    }

    if (heroVertLine) {
        heroVertLine.style.opacity = clamp(1 - heroProgress * 2, 0, 1);
    }

    if (heroScrollHint) {
        heroScrollHint.style.opacity = clamp(0.4 - heroProgress * 2, 0, 0.4);
    }

    if (heroCarousel) {
        heroCarousel.style.opacity   = clamp(1 - heroProgress * 2, 0, 1);
        heroCarousel.style.transform = `translateX(-50%) translateY(${heroProgress * 20}px)`;
    }

    // ── ABOUT ENTRANCE ────────────────────────────────────
    if (aboutSection) {
        const aboutTop      = aboutSection.getBoundingClientRect().top;
        const windowH       = window.innerHeight;

        // progress: 1 = fully off screen bottom, 0 = fully in view
        const aboutProgress = clamp(aboutTop / (windowH * 0.65), 0, 1);

        // section rises up
        const aboutY  = aboutProgress * 60;
        const aboutOp = 1 - aboutProgress * 0.85;
        aboutSection.style.transform = `translateY(${aboutY}px)`;
        aboutSection.style.opacity   = clamp(aboutOp, 0, 1);

        // text slides in from left
        if (aboutText) {
            const textX  = aboutProgress * -50;
            const textOp = 1 - aboutProgress * 1.1;
            aboutText.style.transform = `translateX(${textX}px)`;
            aboutText.style.opacity   = clamp(textOp, 0, 1);
        }

        // image slides in from right
        if (aboutImageWrap) {
            const imgX  = aboutProgress * 50;
            const imgOp = 1 - aboutProgress * 1.1;
            aboutImageWrap.style.transform = `translateX(${imgX}px)`;
            aboutImageWrap.style.opacity   = clamp(imgOp, 0, 1);
        }
    }

     lastScrollY = scrollY;
    rafId = requestAnimationFrame(applyParallax);

    // ── QUOTE 1 EXIT + ENTRANCE ───────────────────────────
    const quote1El = document.querySelector('.parallax-quote-1');
    if (quote1El) {
        const q1Rect     = quote1El.getBoundingClientRect();
        const q1H        = quote1El.offsetHeight;
        const windowH    = window.innerHeight;

        // entrance: comes up from below
        const q1EnterP   = clamp(q1Rect.top / (windowH * 0.6), 0, 1);

        // exit: fades and slides up as it leaves top
        const q1ExitP    = clamp(-q1Rect.bottom / (q1H * 0.5), 0, 1);

        const q1Progress = Math.max(q1EnterP, q1ExitP);
        const q1Y        = q1EnterP > q1ExitP
            ? q1EnterP * 50        // entering: slides up into view
            : q1ExitP  * -40;      // exiting: slides up out of view

        const q1Op = q1EnterP > q1ExitP
            ? 1 - q1EnterP * 0.9   // fade in on enter
            : 1 - q1ExitP  * 1.2;  // fade out on exit

        quote1El.style.transform = `translateY(${q1Y}px)`;
        quote1El.style.opacity   = clamp(q1Op, 0, 1);
    }

    // ── EXPERTISE ENTRANCE ────────────────────────────────
    const expertiseEl   = document.querySelector('.parallax-expertise');
    const expertiseH2   = document.querySelector('.parallax-expertise h2');
    const expertiseGrid = document.querySelector('.parallax-expertise .grid');

    if (expertiseEl) {
        const exRect    = expertiseEl.getBoundingClientRect();
        const exH       = expertiseEl.offsetHeight;
        const windowH   = window.innerHeight;

        // entrance progress
        const exEnterP  = clamp(exRect.top / (windowH * 0.65), 0, 1);

        // exit progress — fades out as section scrolls past top
        const exExitP   = clamp(-exRect.bottom / (exH * 0.4), 0, 1);

        // section rises up on entrance, slides up on exit
        const exY = exEnterP > exExitP
            ? exEnterP * 70
            : exExitP  * -50;

        const exOp = exEnterP > exExitP
            ? 1 - exEnterP * 0.85
            : 1 - exExitP  * 1.2;

        expertiseEl.style.transform = `translateY(${exY}px)`;
        expertiseEl.style.opacity   = clamp(exOp, 0, 1);

        // heading slides down from above
        if (expertiseH2) {
            const h2Y  = exEnterP > exExitP ? exEnterP * -40 : 0;
            const h2Op = 1 - exEnterP * 1.1;
            expertiseH2.style.transform = `translateY(${h2Y}px)`;
            expertiseH2.style.opacity   = clamp(h2Op, 0, 1);
        }

        // grid rises up slightly behind heading
        if (expertiseGrid) {
            const gridY  = exEnterP > exExitP ? exEnterP * 90 : exExitP * -30;
            const gridOp = 1 - exEnterP * 0.8;
            expertiseGrid.style.transform = `translateY(${gridY}px)`;
            expertiseGrid.style.opacity   = clamp(gridOp, 0, 1);
        }
    }

    

   

    // ── STRATEGY SESSION ─────────────────────────────────
    const strategyEl      = document.querySelector('.parallax-strategy');
    const strategyImage   = document.querySelector('.parallax-strategy .strategy-image-wrap');
    const strategyText    = document.querySelector('.parallax-strategy .strategy-text-block');

    if (strategyEl) {
        const stRect   = strategyEl.getBoundingClientRect();
        const stH      = strategyEl.offsetHeight;
        const windowH  = window.innerHeight;

        // entrance: section rises from below
        const stEnterP = clamp(stRect.top / (windowH * 0.65), 0, 1);

        // exit: section fades out as it scrolls past top
        const stExitP  = clamp(-stRect.bottom / (stH * 0.4), 0, 1);

        const stY = stEnterP > stExitP
            ? stEnterP * 65
            : stExitP  * -45;

        const stOp = stEnterP > stExitP
            ? 1 - stEnterP * 0.85
            : 1 - stExitP  * 1.2;

        strategyEl.style.transform = `translateY(${stY}px)`;
        strategyEl.style.opacity   = clamp(stOp, 0, 1);

        // image slides in from left
        if (strategyImage) {
            const imgX  = stEnterP > stExitP ? stEnterP * -65  : stExitP * 30;
            const imgY  = stEnterP > stExitP ? stEnterP *  20  : 0;
            const imgOp = stEnterP > stExitP
                ? 1 - stEnterP * 1.0
                : 1 - stExitP  * 1.3;

            strategyImage.style.transform = `translateX(${imgX}px) translateY(${imgY}px)`;
            strategyImage.style.opacity   = clamp(imgOp, 0, 1);
        }

        // text slides in from right
        if (strategyText) {
            const txX  = stEnterP > stExitP ? stEnterP * 65   : stExitP * -30;
            const txY  = stEnterP > stExitP ? stEnterP * 20   : 0;
            const txOp = stEnterP > stExitP
                ? 1 - stEnterP * 1.0
                : 1 - stExitP  * 1.3;

            strategyText.style.transform = `translateX(${txX}px) translateY(${txY}px)`;
            strategyText.style.opacity   = clamp(txOp, 0, 1);
        }
    }

    // ── QUOTE 2 ENTRANCE + EXIT ───────────────────────────
    const quote2El   = document.querySelector('.parallax-quote-2');
    const quote2Card = document.querySelector('.parallax-quote-2 .quote-two-card');

    if (quote2El) {
        const q2Rect  = quote2El.getBoundingClientRect();
        const q2H     = quote2El.offsetHeight;
        const windowH = window.innerHeight;

        // entrance from below
        const q2EnterP = clamp(q2Rect.top / (windowH * 0.6), 0, 1);

        // exit past top
        const q2ExitP  = clamp(-q2Rect.bottom / (q2H * 0.5), 0, 1);

        const q2Y = q2EnterP > q2ExitP
            ? q2EnterP * 50
            : q2ExitP  * -40;

        const q2Op = q2EnterP > q2ExitP
            ? 1 - q2EnterP * 0.9
            : 1 - q2ExitP  * 1.2;

        quote2El.style.transform = `translateY(${q2Y}px)`;
        quote2El.style.opacity   = clamp(q2Op, 0, 1);

        // card scales up slightly on entrance for extra depth
        if (quote2Card) {
            const cardScale = stEnterP !== undefined
                ? 1
                : clamp(0.94 + (1 - q2EnterP) * 0.06, 0.94, 1);

            const scaleVal  = clamp(0.94 + (1 - q2EnterP) * 0.06, 0.94, 1);
            quote2Card.style.transform = `scale(${scaleVal})`;
            quote2Card.style.opacity   = clamp(q2Op + 0.1, 0, 1);
        }
    }
}

// kick off the loop
rafId = requestAnimationFrame(applyParallax);


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