(function () {
  "use strict";

  var loader = document.querySelector("#preloader[data-home-loader]");
  if (!loader) return;

  var root = document.documentElement;
  var maximumWait = 12000;
  var startedAt = performance.now();

  function nextPaint() {
    return new Promise(function (resolve) {
      requestAnimationFrame(function () { requestAnimationFrame(resolve); });
    });
  }

  function waitForState(datasetKey, eventName) {
    if (root.dataset[datasetKey]) return Promise.resolve();
    return new Promise(function (resolve) {
      window.addEventListener(eventName, resolve, { once: true });
    });
  }

  function waitForVideo(video, eventName) {
    if (!video) return Promise.resolve();
    if (video.readyState >= 2) return Promise.resolve();
    return new Promise(function (resolve) {
      function finish() {
        video.removeEventListener("loadeddata", finish);
        video.removeEventListener("canplay", finish);
        resolve();
      }
      video.addEventListener("loadeddata", finish, { once: true });
      video.addEventListener("canplay", finish, { once: true });
      if (eventName) window.addEventListener(eventName, finish, { once: true });
    });
  }

  function waitForHeroVideo() {
    return waitForState("siteContentReady", "gloobi-site-content-ready").then(function () {
      return waitForVideo(document.querySelector("#hero .gloobi-season-video"), "gloobi-hero-video-ready");
    });
  }

  function waitForFonts() {
    return document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  }

  function dismiss(reason) {
    if (loader.dataset.dismissed === "true") return;
    loader.dataset.dismissed = "true";
    loader.dataset.dismissReason = reason;
    root.dataset.homeReady = reason;
    loader.classList.add("is-exiting");
    window.setTimeout(function () { loader.remove(); }, 450);
  }

  var ready = Promise.all([
    waitForState("siteContentReady", "gloobi-site-content-ready"),
    waitForState("heroLiquidReady", "gloobi-hero-liquid-ready"),
    waitForHeroVideo(),
    waitForVideo(loader.querySelector("video")),
    waitForFonts()
  ]).then(nextPaint).then(function () { dismiss("assets"); });

  var safety = window.setTimeout(function () { dismiss("timeout"); }, maximumWait);
  ready.then(function () {
    window.clearTimeout(safety);
    root.dataset.homeReadyElapsed = String(Math.round(performance.now() - startedAt));
  });
})();
