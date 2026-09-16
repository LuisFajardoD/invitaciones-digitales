(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    var demoFrames = document.querySelectorAll("iframe[data-src]");
    if ("IntersectionObserver" in window) {
      var frameObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.src = entry.target.dataset.src;
          frameObserver.unobserve(entry.target);
        });
      }, { rootMargin: "300px 0px" });
      demoFrames.forEach(function (frame) { frameObserver.observe(frame); });
    } else {
      demoFrames.forEach(function (frame) { frame.src = frame.dataset.src; });
    }
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var globalBackground = document.querySelector(".gloobi-global-bg");
    if (globalBackground && !document.getElementById("gloobi-liquid-global-canvas")) {
      var liquidCanvas = document.createElement("canvas");
      liquidCanvas.id = "gloobi-liquid-global-canvas";
      liquidCanvas.className = "gloobi-liquid-global-canvas";
      globalBackground.appendChild(liquidCanvas);
      var customSources = { dark: "", light: "" };
      var liquidApp = null;
      function sourceForTheme(theme) {
        return theme === "light"
          ? (customSources.light || "/assets/gloobi-home/Panel/background-global-light.avif")
          : (customSources.dark || "/assets/gloobi-home/Panel/background-global-dark.avif");
      }
      window.addEventListener("gloobi-site-background-change", function (event) {
        if (!event.detail || event.detail.scope !== "global") return;
        customSources.dark = event.detail.dark || customSources.dark;
        customSources.light = event.detail.light || customSources.light;
        if (liquidApp) liquidApp.loadImage(sourceForTheme(document.documentElement.dataset.theme || "dark"));
      });
      import("https://cdn.jsdelivr.net/npm/threejs-components@0.0.27/build/backgrounds/liquid1.min.js").then(function (module) {
        var app = module.default(liquidCanvas);
        liquidApp = app;
        function loadThemeTexture(theme) {
          app.loadImage(sourceForTheme(theme));
        }
        loadThemeTexture(document.documentElement.dataset.theme);
        window.addEventListener("site-theme-change", function (event) {
          loadThemeTexture(event.detail);
        });
        app.liquidPlane.material.metalness = 0.75;
        app.liquidPlane.material.roughness = 0.25;
        app.liquidPlane.uniforms.displacementScale.value = 5;
        app.setRain(false);
      }).catch(function () { liquidCanvas.remove(); });
    }
    var regions = document.querySelectorAll(".gloobi-hero, .gloobi-featured-gallery");
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.style.setProperty("--gloobi-animation-state", entry.isIntersecting ? "running" : "paused");
      });
    });
    regions.forEach(function (region) { observer.observe(region); });
    function syncVisibility() {
      document.documentElement.classList.toggle("gloobi-page-hidden", document.hidden);
    }
    document.addEventListener("visibilitychange", syncVisibility);
    syncVisibility();
    if (reduceMotion.matches) return;
    var interBubble = document.querySelector(".gloobi-global-interactive");
    if (!interBubble) return;

    var curX = 0;
    var curY = 0;
    var tgX = 0;
    var tgY = 0;
    var isRunning = false;
    var rafId = null;

    function move() {
      if (document.hidden) {
        isRunning = false;
        return;
      }

      curX += (tgX - curX) / 20;
      curY += (tgY - curY) / 20;
      interBubble.style.transform =
        "translate3d(" + Math.round(curX) + "px, " + Math.round(curY) + "px, 0)";

      if (Math.abs(tgX - curX) + Math.abs(tgY - curY) < 0.5) {
        isRunning = false;
        rafId = null;
        return;
      }
      rafId = requestAnimationFrame(move);
    }

    function startLoop() {
      if (!isRunning && !document.hidden) {
        isRunning = true;
        rafId = requestAnimationFrame(move);
      }
    }

    window.addEventListener("mousemove", function (event) {
      tgX = event.clientX;
      tgY = event.clientY;
      startLoop();
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        isRunning = false;
      } else {
        startLoop();
      }
    });

    startLoop();
  });
})();


