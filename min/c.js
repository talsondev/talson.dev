function decodeObfuscatedLinks() {
            document.querySelectorAll('.obfuscated-link').forEach(link => {
                const encoded = link.getAttribute('data-obfuscated');
                if (encoded) {
                    const decoded = atob(encoded);
                    link.setAttribute('href', decoded);
                }
            });
        }
        // Run immediately if DOM is ready, otherwise wait
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', decodeObfuscatedLinks);
        } else {
            decodeObfuscatedLinks();
};