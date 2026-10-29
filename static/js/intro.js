document.addEventListener("DOMContentLoaded", () => {
    const intro = document.getElementById("recallq-intro");

    if (!intro) return;

    const skipButton = document.getElementById("skipIntro");
    const typedQuery = document.getElementById("introTypedQuery");
    const searchStatus = document.getElementById("introSearchStatus");
    const searchResult = document.getElementById("introSearchResult");

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    let introFinished = false;
    let autoFinishTimer;
    let typingTimer;
    let statusTimers = [];

    const query = "Find that screenshot about my project.";
    const INTRO_DURATION = 12000;

    // Skip the animation for visitors who prefer reduced motion.
    if (prefersReducedMotion) {
        intro.remove();
        return;
    }

    // Type the query one character at a time.
    function startTyping() {
        if (!typedQuery || introFinished) return;

        typedQuery.textContent = "";

        let index = 0;

        function typeNextCharacter() {
            if (introFinished || !typedQuery.isConnected) return;

            typedQuery.textContent = query.slice(0, index);
            index++;

            if (index <= query.length) {
                typingTimer = window.setTimeout(typeNextCharacter, 48);
            }
        }

        typeNextCharacter();
    }

    // Update the search status as the demonstration progresses.
    function updateSearchStatus(message) {
        if (searchStatus && !introFinished) {
            searchStatus.textContent = message;
        }
    }

    // Start typing shortly after the search scene begins.
    statusTimers.push(
        window.setTimeout(startTyping, 7000)
    );

    statusTimers.push(
        window.setTimeout(() => {
            updateSearchStatus("Searching your digital memory...");
        }, 7900)
    );

    statusTimers.push(
        window.setTimeout(() => {
            updateSearchStatus("Matching content across your files...");
        }, 8300)
    );

    statusTimers.push(
        window.setTimeout(() => {
            updateSearchStatus("A relevant file has been found.");
        }, 8700)
    );

    // Finish the intro and reveal the landing page.
    function finishIntro() {
        if (introFinished) return;

        introFinished = true;

        window.clearTimeout(autoFinishTimer);
        window.clearTimeout(typingTimer);

        statusTimers.forEach((timer) => {
            window.clearTimeout(timer);
        });

        intro.classList.add("intro-exit");

        window.setTimeout(() => {
            intro.remove();
        }, 800);
    }

    if (skipButton) {
        skipButton.addEventListener("click", finishIntro);
    }

    // Automatically transition after the cinematic sequence.
    autoFinishTimer = window.setTimeout(finishIntro, INTRO_DURATION);
});
