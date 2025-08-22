document.addEventListener('DOMContentLoaded', function() {
    const sections = document.querySelectorAll('.content-section');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1
    });

    sections.forEach(section => {
        observer.observe(section);
    });

    const originalTitle = document.title;
    const messages = [
        "Come back! 👋",
        "Don't leave yet!",
        "Let's build something."
    ];
    let i = 0;
    let interval;

    document.addEventListener("visibilitychange", function() {
        if (document.hidden) {
            interval = setInterval(() => {
                document.title = messages[i++ % messages.length];
            }, 1500);
        } else {
            clearInterval(interval);
            document.title = originalTitle;
        }
    });
});