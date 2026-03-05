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

    // ========== REVEAL ON SCROLL (simple) ==========
    const reveals = document.querySelectorAll('.reveal');
    function checkReveal() {
        for (let el of reveals) {
            const windowHeight = window.innerHeight;
            const revealTop = el.getBoundingClientRect().top;
            if (revealTop < windowHeight - 100) {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            } else {
                el.style.opacity = '0';
                el.style.transform = 'translateY(20px)';
            }
    
    
       }
    }
    // set initial style
    reveals.forEach(el => {
        el.style.transition = 'opacity 0.8s, transform 0.8s';
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
    });
    window.addEventListener('scroll', checkReveal);
    window.addEventListener('load', checkReveal);