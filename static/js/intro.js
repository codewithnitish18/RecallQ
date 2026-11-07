
document.addEventListener("DOMContentLoaded", () => {
    const intro = document.getElementById("recallq-intro");

    if (!intro) return;

    const skipButton = document.getElementById("skipIntro");
    const replayButton = document.getElementById("replayIntro");

    const typedQuery = document.getElementById("introTypedQuery");
    const searchStatus = document.getElementById("introSearchStatus");

    const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

    const query = "Find that screenshot about my project.";
    const INTRO_DURATION = 12000;

    let introFinished = false;
    let autoFinishTimer;
    let typingTimer;
    let statusTimers = [];

    // Respect the visitor's motion preference.
    if (prefersReducedMotion) {
        intro.remove();
        return;
    }

    // Clear all active timers.
    function clearIntroTimers() {
        window.clearTimeout(autoFinishTimer);
        window.clearTimeout(typingTimer);

        statusTimers.forEach((timer) => {
            window.clearTimeout(timer);
        });

        statusTimers = [];
    }

    // Type the search query character by character.
    function startTyping() {
        if (!typedQuery || introFinished) return;

        typedQuery.textContent = "";

        let index = 0;

        function typeNextCharacter() {
            if (introFinished || !typedQuery.isConnected) return;

            typedQuery.textContent = query.slice(0, index);
            index++;

            if (index <= query.length) {
                typingTimer = window.setTimeout(
                    typeNextCharacter,
                    48
                );
            }
        }

        typeNextCharacter();
    }

    // Update the search status.
    function updateSearchStatus(message) {
        if (searchStatus && !introFinished) {
            searchStatus.textContent = message;
        }
    }

    // Schedule the typing and status sequence.
    function startSearchSequence() {
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
    }

    // Finish the intro.
  function finishIntro() {
    if (introFinished) return;

    introFinished = true;
    clearIntroTimers();

    intro.classList.add("intro-exit");

    window.setTimeout(() => {
        window.location.href = "/workspace";
    }, 800);
}

function replayIntro() {
    if (!intro.isConnected) return;

    clearIntroTimers();

    introFinished = false;

    // Remove exit state.
    intro.classList.remove("intro-exit");

    // Reset search content.
    if (typedQuery) {
        typedQuery.textContent = "";
    }

    if (searchStatus) {
        searchStatus.textContent = "Understanding your request...";
    }

    // Hide the overlay briefly to reset its animations.
    intro.style.display = "none";

    // Force the browser to apply the reset.
    void intro.offsetHeight;

    // Restore the overlay.
    intro.style.display = "";

    // Restart CSS animations.
    intro.style.animation = "none";

    void intro.offsetHeight;

    intro.style.animation = "";

    // Restart the search sequence.
    startSearchSequence();

    // Restart the automatic exit timer.
    autoFinishTimer = window.setTimeout(
        finishIntro,
        INTRO_DURATION
    );
}


    // Skip button.
    if (skipButton) {
        skipButton.addEventListener("click", finishIntro);
    }

    // Replay button.
    if (replayButton) {
        replayButton.addEventListener("click", replayIntro);
    }

    // Start the intro when the page first loads.
    startSearchSequence();

    autoFinishTimer = window.setTimeout(
        finishIntro,
        INTRO_DURATION
    );
});

