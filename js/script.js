// Check if we're on the secret page and play the secret audio
function checkSecretPage() {
    if (window.location.pathname.includes('secret.html')) {
        const audio = new Audio('Z.wav');
        setTimeout(() => {
            audio.play().catch(err => console.log('Audio play failed:', err));
        }, 3000);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    checkSecretPage();
});

// Make the first letter clickable for easter egg (set on specific element)
function initializeEasterEgg(elementSelector) {
    const element = document.querySelector(elementSelector);
    if (element) {
        const firstLetter = element.textContent.charAt(0);
        const html = element.innerHTML;
        const newHtml = `<a href="secret.html" class="easter-egg-link" style="display: inline; border: none;">${firstLetter}</a>` + html.substring(1);
        element.innerHTML = newHtml;
    }
}
