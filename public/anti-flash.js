/*
 * Synchronous theme + language bootstrap.
 *
 * Loaded as a classic blocking <script> from src/options.html so Chrome's
 * parser pauses here and assigns the correct .dark / .light class to <html>
 * BEFORE the first paint. The module bundle that hydrates the UI is deferred
 * and would otherwise let the page paint with the wrong theme.
 *
 * Lives in /public so Vite copies it to dist/ verbatim — and so it is a real
 * external file, satisfying the MV3 CSP (script-src 'self', no inline).
 */
(function () {
  try {
    var raw = localStorage.getItem("elementSnapperSettings");
    var s = raw ? JSON.parse(raw) : null;
    var theme = s && s.theme ? s.theme : "system";
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var dark = theme === "dark" || (theme === "system" && prefersDark);
    var root = document.documentElement;
    root.classList.add(dark ? "dark" : "light");
    if (s && s.uiLanguage && s.uiLanguage !== "auto") {
      root.lang = s.uiLanguage;
    }
  } catch (_) {
    // localStorage may be unavailable (private mode, disabled). Fall back to
    // the prefers-color-scheme media query baked into the CSS.
  }
})();
