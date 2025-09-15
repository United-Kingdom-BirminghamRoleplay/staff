// remove-html.js
document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname;

    // If URL ends with .html → redirect to same path without it
    if (path.endsWith(".html")) {
        const newPath = path.replace(/\.html$/, "");
        window.location.replace(newPath + window.location.search + window.location.hash);
    }
});
