document.addEventListener("DOMContentLoaded", function () {

    /* ================= MULTI STEP FORM ================= */

    const steps = document.querySelectorAll(".form-step");
    const progress = document.querySelector(".progress");
    const nextBtns = document.querySelectorAll(".btn-next");
    const prevBtns = document.querySelectorAll(".prev-btn");

    let currentStep = 0;

    function showStep(step) {
        steps.forEach((s, index) => {
            s.classList.remove("active");
            if (index === step) {
                s.classList.add("active");
            }
        });

        updateProgress();
    }

    function updateProgress() {
        const percent = ((currentStep + 1) / steps.length) * 100;
        progress.style.width = percent + "%";
    }

    nextBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            if (currentStep < steps.length - 1) {
                currentStep++;
                showStep(currentStep);
            }
        });
    });

    prevBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            if (currentStep > 0) {
                currentStep--;
                showStep(currentStep);
            }
        });
    });

    // Initialize first step
    showStep(currentStep);


    /* ================= DARK MODE ================= */

    const toggle = document.getElementById("themeToggle");

    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark");
    }

    if (toggle) {
        toggle.addEventListener("click", () => {
            document.body.classList.toggle("dark");

            localStorage.setItem(
                "theme",
                document.body.classList.contains("dark") ? "dark" : "light"
            );
        });
    }


    /* ================= SCROLL REVEAL ================= */

    const reveals = document.querySelectorAll(".reveal");

    function revealOnScroll() {
        reveals.forEach(el => {
            const elementTop = el.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;

            if (elementTop < windowHeight - 100) {
                el.classList.add("active");
            }
        });
    }

    window.addEventListener("scroll", revealOnScroll);
    revealOnScroll();

});

// Hamburger menu toggle
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
    document.body.classList.toggle('menu-open');
});


