(function () {
  "use strict";

  var storageKey = "site-theme-mode";
  var root = document.documentElement;
  var body = document.body;
  var themeButton = document.querySelector(".gloobi-theme-toggle");
  var railButton = document.querySelector(".gloobi-rail-avatar");
  var railMenu = document.querySelector(".gloobi-rail-logo-menu");

  function applyTheme(theme) {
    var isLight = theme === "light";
    root.setAttribute("data-theme", isLight ? "light" : "dark");
    root.dataset.siteTheme = isLight ? "light" : "dark";
    body.classList.toggle("light-mode", isLight);
    body.classList.toggle("dark-mode", !isLight);
    if (themeButton) {
      themeButton.textContent = isLight ? "☾" : "☀";
      themeButton.setAttribute("aria-label", isLight ? "Activar modo oscuro" : "Activar modo claro");
      themeButton.setAttribute("title", isLight ? "Activar modo oscuro" : "Activar modo claro");
    }
    try { localStorage.setItem(storageKey, isLight ? "light" : "dark"); } catch (error) {}
  }

  var savedTheme = null;
  try { savedTheme = localStorage.getItem(storageKey); } catch (error) {}
  applyTheme(savedTheme === "light" ? "light" : "dark");
  if (themeButton) themeButton.addEventListener("click", function () {
    applyTheme(root.dataset.theme === "light" ? "dark" : "light");
  });
  if (railButton && railMenu) railButton.addEventListener("click", function () {
    var open = railMenu.classList.toggle("is-open");
    railButton.setAttribute("aria-expanded", String(open));
  });

  if (window.Swiper) new Swiper(".gloobi-about-gallery-swiper", {
    slidesPerView: "auto",
    spaceBetween: 22,
    loop: true,
    speed: 7000,
    allowTouchMove: true,
    autoplay: { delay: 0, disableOnInteraction: false },
    breakpoints: { 768: { spaceBetween: 28 } }
  });
})();
