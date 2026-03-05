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
            // simple validation for step1 (just check required fields)
            let inputs = document.querySelectorAll('#step1 [required]');
            for (let inp of inputs) {
                if (!inp.value.trim()) {
                    alert('Please fill all required fields in Part A');
                    return;
                }
            }
        }
        if (step === 2) {
            let inputs = document.querySelectorAll('#step2 [required]');
            for (let inp of inputs) {
                if (!inp.value.trim()) {
                    alert('Please fill all required fields in Part B');
                    return;
                }
            }
        }
        // move to next step
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

    // Form submit alert (just for demo)
    document.getElementById('multiStepForm').addEventListener('submit', function(e) {
        // prevent actual submit for demo, but you can remove if using real action
        e.preventDefault();
        alert('Form submitted (demo). In production, data would go to submit.php');
        // you can keep e.preventDefault() or remove to allow real POST
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