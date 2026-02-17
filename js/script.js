document.addEventListener("DOMContentLoaded", function () {

    /* ========================================= */
    /* =============== HAMBURGER =============== */
    /* ========================================= */

    const hamburger = document.getElementById("hamburger");
    const navMenu = document.getElementById("navMenu");

    hamburger.addEventListener("click", () => {
        hamburger.classList.toggle("active");
        navMenu.classList.toggle("active");
        document.body.classList.toggle("menu-open");
    });

    /* ========================================= */
    /* =============== THEME TOGGLE ============ */
    /* ========================================= */

    const themeToggle = document.getElementById("themeToggle");

    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark");
    });

    /* ========================================= */
    /* =============== SCROLL REVEAL =========== */
    /* ========================================= */

    const revealElements = document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .card");

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
            } else {
                entry.target.classList.remove("active"); // works up & down
            }
        });
    }, { threshold: 0.15 });

    revealElements.forEach(el => {
        observer.observe(el);
    });

    /* ========================================= */
    /* ============ STAGGER CARD EFFECT ======== */
    /* ========================================= */

    const cards = document.querySelectorAll(".card");

    cards.forEach((card, index) => {
        card.style.transitionDelay = `${index * 0.1}s`;
    });

    /* ========================================= */
    /* ============ MULTI STEP FORM ============ */
    /* ========================================= */

    const steps = document.querySelectorAll(".form-step");
    const nextBtns = document.querySelectorAll(".btn-next");
    const prevBtns = document.querySelectorAll(".prev-btn");
    const progress = document.querySelector(".progress");

    let currentStep = 0;

    function updateProgress() {
        const percent = ((currentStep + 1) / steps.length) * 100;
        progress.style.width = percent + "%";
    }

    function showStep(index, direction) {
        steps.forEach((step, i) => {
            step.classList.remove("active", "exit-left", "exit-right");

            if (i === index) {
                step.classList.add("active");
            } else if (i < index) {
                step.classList.add(direction === "next" ? "exit-left" : "exit-right");
            }
        });

        updateProgress();
    }

    nextBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            if (currentStep < steps.length - 1) {
                currentStep++;
                showStep(currentStep, "next");
            }
        });
    });

    prevBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            if (currentStep > 0) {
                currentStep--;
                showStep(currentStep, "prev");
            }
        });
    });

    updateProgress();

});
