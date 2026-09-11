let currentBuild;

async function checkForBuild() {
    try {
        const response = await fetch('/__build-version', { cache: 'no-store' });
        if (!response.ok) return;

        const nextBuild = await response.text();
        if (currentBuild !== undefined && nextBuild !== currentBuild) {
            window.location.reload();
            return;
        }
        currentBuild = nextBuild;
    } catch { }
}

void checkForBuild();
setInterval(checkForBuild, 1000);
