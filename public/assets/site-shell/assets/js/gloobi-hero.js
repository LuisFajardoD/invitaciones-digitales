(function () {
  "use strict";

  var palette = [
    "#ff4fd8",
    "#ffd23f",
    "#13dce4",
    "#40cfff",
    "#ff9f2e",
    "#ff6848",
    "#63df7b",
    "#80d8ff",
    "#b06cff",
  ];

  function randomBetween(min, max) {
    return Math.random() * (max - min) + min;
  }

  function bootHero() {
    var hero = document.querySelector(".gloobi-hero");
    var title = document.querySelector(".gloobi-hero-title");
    var interactiveBubble = document.querySelector(".gloobi-bubble-interactive");

    if (!hero || !title) {
      return;
    }

    var letters = [];
    function prepareTitleLetters() {
      letters = Array.prototype.slice.call(title.querySelectorAll(".gloobi-hero-title-letter"));
      letters.forEach(function (letter, index) {
        letter.style.setProperty("--letter-color", palette[index % palette.length]);
        letter.style.setProperty("--letter-delay", index * 62 + "ms");
      });
    }
    prepareTitleLetters();

    hero.classList.add("gloobi-hero--ready");
    var waveAnimations = [];
    function triggerTitleWave() {
      waveAnimations.forEach(function (animation) { animation.cancel(); });
      waveAnimations = letters.map(function (letter, index) {
        var baseColor = "#f4fdff";
        return letter.animate([
          { offset: 0, color: "#f4fdff", transform: "translateY(0) scaleY(1)" },
          { offset: .2, color: "#ff6bed", transform: "translateY(-42%) scaleY(1.1)" },
          { offset: .4, color: "#f4fdff", transform: "translateY(0) scaleY(.9)" },
          { offset: .6, color: "#00dbea", transform: "translateY(-18%) scaleY(1.05)" },
          { offset: .8, color: "#f4fdff", transform: "translateY(0) scaleY(.97)" },
          { offset: 1, color: baseColor, transform: "translateY(0) scaleY(1)" }
        ], { duration: 800, delay: index * 62, easing: "ease" });
      });
    }
    title.style.cursor = "pointer";
    title.style.pointerEvents = "auto";

    // Keep the signature wave visible over time instead of letting it finish
    // once during the initial page load. Clicking restarts the cadence.
    var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var titleWaveTimer = 0;
    function scheduleTitleWave(delay) {
      window.clearTimeout(titleWaveTimer);
      titleWaveTimer = window.setTimeout(function () {
        if (!document.hidden) triggerTitleWave();
        scheduleTitleWave(5200);
      }, delay);
    }

    title.addEventListener("click", function () {
      triggerTitleWave();
      if (!reducedMotion) scheduleTitleWave(5200);
    });

    if (!reducedMotion) {
      scheduleTitleWave(900);
      window.addEventListener("gloobi-hero-title-change", function () {
        prepareTitleLetters();
        scheduleTitleWave(120);
      });
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) {
          window.clearTimeout(titleWaveTimer);
        } else {
          scheduleTitleWave(450);
        }
      });
    }

    // Dark / Light Theme Mode Switcher
    var darkBtn = document.querySelector(".gloobi-btn-dark");
    var lightBtn = document.querySelector(".gloobi-btn-light");

    var themeStorageKey = "site-theme-mode";
    var legacyThemeStorageKey = "gloobi-site-theme";
    var themeEventName = "site-theme-change";

    function applyThemeMode(theme) {
      // Commit all theme surfaces together, including their pseudo-elements.
      var root = document.documentElement;
      root.classList.add("gloobi-theme-switching");
      if (theme === "light") {
        document.documentElement.setAttribute("data-theme", "light");
        document.documentElement.dataset.siteTheme = "light";
        document.body.classList.add("light-mode");
        document.body.classList.remove("dark-mode");
        if (darkBtn) darkBtn.classList.remove("is-active");
        if (lightBtn) lightBtn.classList.add("is-active");
      } else {
        document.documentElement.setAttribute("data-theme", "dark");
        document.documentElement.dataset.siteTheme = "dark";
        document.body.classList.add("dark-mode");
        document.body.classList.remove("light-mode");
        if (lightBtn) lightBtn.classList.remove("is-active");
        if (darkBtn) darkBtn.classList.add("is-active");
      }
      try {
        localStorage.setItem(themeStorageKey, theme);
        localStorage.setItem(legacyThemeStorageKey, theme);
        window.dispatchEvent(new CustomEvent(themeEventName, { detail: theme }));
      } catch (e) {}
      // Resolve the new styles before restoring normal hover transitions.
      void document.body.offsetWidth;
      root.classList.remove("gloobi-theme-switching");
    }

    if (darkBtn) {
      darkBtn.addEventListener("click", function (e) {
        e.preventDefault();
        applyThemeMode("dark");
      });
    }

    if (lightBtn) {
      lightBtn.addEventListener("click", function (e) {
        e.preventDefault();
        applyThemeMode("light");
      });
    }

    try {
      var savedTheme = localStorage.getItem(themeStorageKey) || localStorage.getItem(legacyThemeStorageKey);
      if (savedTheme === "light") {
        applyThemeMode("light");
      } else {
        applyThemeMode("dark");
      }
    } catch (e) {
      applyThemeMode("dark");
    }

    hero.addEventListener("pointermove", function (event) {
      if (!interactiveBubble) {
        return;
      }

      var rect = hero.getBoundingClientRect();
      var x = event.clientX - rect.left;
      var y = event.clientY - rect.top;
      interactiveBubble.style.transform = "translate(" + x * 0.08 + "px, " + y * 0.08 + "px)";
    });

    

  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootHero);
  } else {
    bootHero();
  }
})();

/* Carrusel móvil continuo de temáticas, sin saltos al reiniciar. */
(function () {
  function initCategoryMarquee() {
    if (!window.matchMedia || !window.matchMedia('(max-width: 767px)').matches) return;
    var grid = document.querySelector('.gloobi-category-grid');
    if (!grid || grid.dataset.marqueeReady === 'true') return;
    var cards = Array.prototype.slice.call(grid.children);
    if (!cards.length) return;
    cards.forEach(function (card) {
      var clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      grid.appendChild(clone);
    });
    grid.dataset.marqueeReady = 'true';
    grid.classList.add('gloobi-category-grid--marquee');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initCategoryMarquee);
  else initCategoryMarquee();
})();

(function () {
  "use strict";

  function bootFeaturedGalleryLinks() {
    var gallery = document.querySelector(".gloobi-featured-gallery");
    if (!gallery) {
      return;
    }

    var pointerStartX = 0;
    var pointerStartY = 0;
    var moved = false;
    var dragThreshold = 8;
    var pendingHref = "";

    gallery.addEventListener("pointerdown", function (event) {
      var link = event.target && event.target.closest ? event.target.closest(".gloobi-featured-gallery-link") : null;
      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      moved = false;
      pendingHref = link ? link.href : "";
    }, true);

    gallery.addEventListener("pointermove", function (event) {
      if (Math.hypot(event.clientX - pointerStartX, event.clientY - pointerStartY) > dragThreshold) {
        moved = true;
      }
    }, true);

    gallery.addEventListener("pointerup", function (event) {
      if (!pendingHref) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      if (!moved) {
        window.location.href = pendingHref;
      }

      pendingHref = "";
      moved = false;
    }, true);

    gallery.addEventListener("click", function (event) {
      var link = event.target && event.target.closest ? event.target.closest(".gloobi-featured-gallery-link") : null;
      if (!link) {
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      if (moved) {
        moved = false;
        return;
      }

      window.location.href = link.href;
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootFeaturedGalleryLinks);
  } else {
    bootFeaturedGalleryLinks();
  }
})();

(function () {
  "use strict";

  function bootCelebrationCategories() {
    var section = document.querySelector(".gloobi-celebration-categories");
    if (!section) {
      return;
    }

    var carouselEl = section.querySelector(".gloobi-celebration-carousel");
    var nextButton = section.querySelector(".gloobi-celebration-next");
    var prevButton = section.querySelector(".gloobi-celebration-prev");
    var paginationEl = section.querySelector(".gloobi-celebration-pagination");
    var slides = Array.prototype.slice.call(section.querySelectorAll(".gloobi-celebration-carousel .swiper-slide"));
    var cards = slides.map(function (slide) {
      return slide.querySelector(".gloobi-celebration-card");
    }).filter(Boolean);
    var reducedMotionQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    var autoplayDelay = Number(carouselEl && carouselEl.dataset.autoplayDelay) || 3200;
    var transitionSpeed = reducedMotionQuery && reducedMotionQuery.matches ? 0 : 450;
    var autoplayTimer = null;
    var transitionTimer = null;
    var isTransitioning = false;
    var activeIndex = 0;
    var pointerStartX = 0;
    var pointerStartY = 0;
    var pointerStarted = false;
    var dragMoved = false;
    var suppressClick = false;
    var dragThreshold = 8;
    var isSectionVisible = false;

    if (!carouselEl || !cards.length || !slides.length) {
      return;
    }

    carouselEl.classList.add("is-gloobi-controlled");

    function isReducedMotion() {
      return Boolean(reducedMotionQuery && reducedMotionQuery.matches);
    }

    function clearAutoplay() {
      if (autoplayTimer !== null) {
        window.clearTimeout(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function scheduleAutoplay() {
      clearAutoplay();
      if (isReducedMotion() || document.hidden || !isSectionVisible) {
        return;
      }

      autoplayTimer = window.setTimeout(function () {
        nextSlide();
      }, autoplayDelay);
    }

    function finishTransition() {
      if (transitionTimer !== null) {
        window.clearTimeout(transitionTimer);
        transitionTimer = null;
      }

      isTransitioning = false;
      scheduleAutoplay();
    }

    function cancelTransitionGuard() {
      if (transitionTimer !== null) {
        window.clearTimeout(transitionTimer);
        transitionTimer = null;
      }

      isTransitioning = false;
    }

    function guardTransition() {
      isTransitioning = true;
      if (transitionTimer !== null) {
        window.clearTimeout(transitionTimer);
      }
      transitionTimer = window.setTimeout(finishTransition, transitionSpeed + 180);
    }

    function updatePagination(activeIndex) {
      if (!paginationEl) {
        return;
      }

      var bullets = Array.prototype.slice.call(paginationEl.querySelectorAll("button"));
      bullets.forEach(function (bullet, index) {
        var isActive = index === activeIndex;
        bullet.classList.toggle("is-active", isActive);
        bullet.setAttribute("aria-current", isActive ? "true" : "false");
      });
    }

    function wrapIndex(index) {
      return (index % cards.length + cards.length) % cards.length;
    }

    function getCircularOffset(index, centerIndex) {
      var total = cards.length;
      var offset = index - centerIndex;
      var half = total / 2;

      if (offset > half) {
        offset -= total;
      } else if (offset < -half) {
        offset += total;
      }

      return offset;
    }

    function getSpacing() {
      var viewport = window.innerWidth || document.documentElement.clientWidth || 1440;
      var availableWidth = carouselEl.clientWidth || viewport;

      if (viewport <= 420) {
        return Math.max(48, Math.min(62, availableWidth / 5.8));
      }

      if (viewport <= 767) {
        return Math.max(62, Math.min(82, availableWidth / 5.4));
      }

      if (viewport <= 1199) {
        return Math.max(86, Math.min(114, availableWidth / 7.2));
      }

      return Math.max(104, Math.min(144, availableWidth / 8.7));
    }

    function updateCards(index) {
      activeIndex = wrapIndex(index);

      var spacing = getSpacing();
      var visibleSideCount = Math.floor((cards.length - 1) / 2);

      slides.forEach(function (slide, index) {
        var card = cards[index];
        var offset = getCircularOffset(index, activeIndex);
        var distance = Math.abs(offset);
        var isActive = index === activeIndex;
        var isHidden = distance > visibleSideCount;
        var scale = isActive ? 1 : Math.max(0.68, 0.92 - distance * 0.07);
        var opacity = isHidden ? 0 : 1;
        var y = isActive ? 0 : Math.min(48, distance * 10);
        var currentX = offset * spacing;

        slide.style.setProperty("--gloobi-card-x", currentX + "px");
        slide.style.setProperty("--gloobi-card-y", y + "px");
        slide.style.setProperty("--gloobi-card-rotation", "0deg");
        slide.style.setProperty("--gloobi-card-scale", String(scale));
        slide.style.setProperty("--gloobi-card-opacity", String(opacity));
        slide.style.zIndex = String(100 - distance);
        slide.classList.toggle("swiper-slide-active", isActive);
        slide.classList.toggle("swiper-slide-prev", offset === -1);
        slide.classList.toggle("swiper-slide-next", offset === 1);
        slide.classList.toggle("is-gloobi-hidden", isHidden);

        if (card) {
          card.setAttribute("aria-current", isActive ? "true" : "false");
          card.setAttribute("tabindex", isHidden ? "-1" : "0");
        }
      });

      updatePagination(activeIndex);
    }

    function nextSlide() {
      clearAutoplay();
      if (isTransitioning) {
        cancelTransitionGuard();
      }
      guardTransition();
      updateCards(activeIndex + 1);
    }

    function previousSlide() {
      clearAutoplay();
      if (isTransitioning) {
        cancelTransitionGuard();
      }
      guardTransition();
      updateCards(activeIndex - 1);
    }

    function goToSlide(index) {
      var targetIndex = wrapIndex(index);
      if (targetIndex === activeIndex) {
        scheduleAutoplay();
        return;
      }

      clearAutoplay();
      cancelTransitionGuard();
      guardTransition();
      updateCards(targetIndex);
    }

    function restartAfterManualInteraction() {
      clearAutoplay();
      if (!isTransitioning) {
        scheduleAutoplay();
      }
    }

    if (paginationEl) {
      paginationEl.innerHTML = "";
      cards.forEach(function (_card, index) {
        var bullet = document.createElement("button");
        bullet.type = "button";
        bullet.textContent = String(index + 1);
        bullet.setAttribute("aria-label", "Mostrar categoría " + (index + 1));
        bullet.addEventListener("click", function () {
          goToSlide(index);
        });
        paginationEl.appendChild(bullet);
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        nextSlide();
      });
    }

    if (prevButton) {
      prevButton.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        previousSlide();
      });
    }

    // Prevent native browser link/image dragging
    carouselEl.addEventListener("dragstart", function (e) {
      e.preventDefault();
    });

    cards.forEach(function (card) {
      card.addEventListener("dragstart", function (e) {
        e.preventDefault();
      });
    });

    var isMouseDragging = false;

    function handleStart(clientX, clientY) {
      pointerStartX = clientX;
      pointerStartY = clientY;
      pointerStarted = true;
      isMouseDragging = true;
      dragMoved = false;
      clearAutoplay();
    }

    function handleMove(clientX, clientY, event) {
      if (!pointerStarted || !isMouseDragging) {
        return;
      }

      var deltaX = clientX - pointerStartX;
      var deltaY = clientY - pointerStartY;

      if (Math.hypot(deltaX, deltaY) > dragThreshold) {
        dragMoved = true;
      }

      if (dragMoved && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (event && event.cancelable) {
          event.preventDefault();
        }
      }
    }

    function handleEnd(clientX, clientY) {
      if (!pointerStarted) {
        return;
      }

      var deltaX = clientX - pointerStartX;
      var deltaY = clientY - pointerStartY;

      if (dragMoved) {
        suppressClick = true;
        window.setTimeout(function () {
          suppressClick = false;
        }, 280);
      }

      if (dragMoved && Math.abs(deltaX) > 18 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < 0) {
          nextSlide();
        } else {
          previousSlide();
        }
      } else {
        restartAfterManualInteraction();
      }

      pointerStarted = false;
      isMouseDragging = false;
      dragMoved = false;
    }

    carouselEl.addEventListener("mousedown", function (event) {
      if (event.button !== 0) return;
      handleStart(event.clientX, event.clientY);
    });

    window.addEventListener("mousemove", function (event) {
      if (pointerStarted) {
        handleMove(event.clientX, event.clientY, event);
      }
    });

    window.addEventListener("mouseup", function (event) {
      if (pointerStarted) {
        handleEnd(event.clientX, event.clientY);
      }
    });

    carouselEl.addEventListener("touchstart", function (event) {
      if (event.touches && event.touches[0]) {
        handleStart(event.touches[0].clientX, event.touches[0].clientY);
      }
    }, { passive: true });

    carouselEl.addEventListener("touchmove", function (event) {
      if (event.touches && event.touches[0]) {
        handleMove(event.touches[0].clientX, event.touches[0].clientY, event);
      }
    }, { passive: false });

    carouselEl.addEventListener("touchend", function (event) {
      if (event.changedTouches && event.changedTouches[0]) {
        handleEnd(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
      }
    });

    cards.forEach(function (card, index) {
      card.addEventListener("click", function (event) {
        if (suppressClick || dragMoved) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        if (index !== activeIndex) {
          event.preventDefault();
          goToSlide(index);
        }
      });
    });

    section.addEventListener("keydown", function (event) {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        nextSlide();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        previousSlide();
      } else if (event.key === "Home") {
        event.preventDefault();
        goToSlide(0);
      } else if (event.key === "End") {
        event.preventDefault();
        goToSlide(cards.length - 1);
      }
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        clearAutoplay();
      } else {
        scheduleAutoplay();
      }
    });

    if (reducedMotionQuery && typeof reducedMotionQuery.addEventListener === "function") {
      reducedMotionQuery.addEventListener("change", function () {
        transitionSpeed = isReducedMotion() ? 0 : 850;
        scheduleAutoplay();
      });
    }

    window.addEventListener("resize", function () {
      updateCards(activeIndex);
    });

    section.gloobiCelebrationCarousel = {
      swiper: null,
      nextSlide: nextSlide,
      previousSlide: previousSlide,
      goToSlide: goToSlide,
      getActiveIndex: function () {
        return activeIndex;
      },
      pauseAutoplay: clearAutoplay,
      restartAutoplay: scheduleAutoplay,
      autoplayDelay: autoplayDelay
    };
    window.gloobiCelebrationCarousel = section.gloobiCelebrationCarousel;

    function setInitialCategory() {
      clearAutoplay();
      updateCards(0);
    }

    setInitialCategory();
    window.requestAnimationFrame(function () {
      setInitialCategory();
      if ("IntersectionObserver" in window) {
        var observer = new IntersectionObserver(function (entries) {
          var entry = entries[0];
          isSectionVisible = Boolean(entry && entry.isIntersecting);
          if (isSectionVisible) {
            scheduleAutoplay();
          } else {
            clearAutoplay();
          }
        }, {
          threshold: 0.35
        });
        observer.observe(section);
      } else {
        isSectionVisible = true;
        scheduleAutoplay();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootCelebrationCategories);
  } else {
    bootCelebrationCategories();
  }
})();

(function () {
  "use strict";

  function bootLocalVideoModal() {
    var playBtn = document.getElementById("gloobi-video-play-btn");
    var videoEl = document.getElementById("gloobi-compartir-video");
    if (!playBtn || !videoEl) return;

    if (window.jQuery && window.jQuery.fn.magnificPopup) {
      window.jQuery("#gloobi-video-play-btn").magnificPopup({
        type: "inline",
        midClick: true,
        mainClass: "mfp-zoom-in gloobi-video-mfp",
        removalDelay: 260,
        callbacks: {
          open: function () {
            if (videoEl) {
              videoEl.currentTime = 0;
              var playPromise = videoEl.play();
              if (playPromise !== undefined) {
                playPromise.catch(function () {});
              }
            }
          },
          close: function () {
            if (videoEl) {
              videoEl.pause();
            }
          }
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootLocalVideoModal);
  } else {
    bootLocalVideoModal();
  }
})();

(function () {
  "use strict";

  function bootComparisonSection() {
    var section = document.getElementById("comparativa");
    var phone = document.getElementById("gloobiComparisonPhone");
    var screen = document.getElementById("gloobiComparisonScreen");
    var leftLayer = section ? section.querySelector(".gloobi-comparison__layer--left") : null;
    var divider = document.getElementById("gloobiComparisonDivider");
    var handle = document.getElementById("gloobiComparisonHandle");
    var iframe = document.getElementById("gloobiComparisonIframe");
    var scrollbar = document.getElementById("gloobiComparisonScrollbar");
    var scrollbarThumb = document.getElementById("gloobiComparisonScrollbarThumb");

    if (!section || !screen || !leftLayer || !divider || !handle) {
      return;
    }
    if (section.dataset.gloobiComparisonReady === "true") {
      return;
    }
    section.dataset.gloobiComparisonReady = "true";

    var isDragging = false;
    var currentPosition = 50; // 0% to 100%
    var activePointerId = null;
    var dragRect = null;
    var autoScrollTimer = null;
    // Small per-frame increment keeps the premium preview moving slowly and steadily.
    var scrollStep = 0.65;
    var isPaused = false;
    var pauseTimer = null;
    var isSectionVisible = true;
    var isAutoScrollRunning = false;
    var isScrollbarDragging = false;
    var activeScrollbarPointerId = null;
    var currentThumbTop = 0;

    function applyComparisonUpdate(percentage) {
      percentage = Math.max(0, Math.min(100, percentage));
      currentPosition = percentage;

      leftLayer.style.clipPath = "inset(0 " + (100 - percentage) + "% 0 0)";
      divider.style.left = percentage + "%";
      handle.style.left = "50%";
      handle.setAttribute("aria-valuenow", Math.round(percentage));
    }

    function getIframeScrollEl() {
      if (!iframe) return null;
      try {
        var iframeDoc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
        if (!iframeDoc || !iframeDoc.documentElement) return null;
        return iframeDoc.scrollingElement || iframeDoc.documentElement || iframeDoc.body;
      } catch (err) {
        return null;
      }
    }

    function getIframeScrollState() {
      var scrollEl = getIframeScrollEl();
      if (!scrollEl) return null;
      var maxScroll = Math.max(0, scrollEl.scrollHeight - scrollEl.clientHeight);
      return { scrollEl: scrollEl, maxScroll: maxScroll };
    }

    function updateDemoScrollbar() {
      if (!scrollbar || !scrollbarThumb) return;
      var state = getIframeScrollState();
      if (!state || state.maxScroll <= 0) {
        scrollbar.classList.add("is-hidden");
        return;
      }

      var trackHeight = scrollbar.clientHeight;
      if (trackHeight <= 0) return;

      var visibleRatio = state.scrollEl.clientHeight / Math.max(state.scrollEl.scrollHeight, 1);
      var thumbHeight = Math.max(38, Math.min(trackHeight, trackHeight * visibleRatio));
      var thumbRange = Math.max(0, trackHeight - thumbHeight);
      var thumbTop = thumbRange > 0 ? (state.scrollEl.scrollTop / state.maxScroll) * thumbRange : 0;
      currentThumbTop = Math.max(0, Math.min(thumbRange, thumbTop));

      scrollbar.classList.remove("is-hidden");
      scrollbarThumb.style.height = thumbHeight + "px";
      scrollbarThumb.style.transform = "translate3d(0, " + currentThumbTop + "px, 0)";
      scrollbar.setAttribute("aria-valuenow", Math.round((state.scrollEl.scrollTop / state.maxScroll) * 100));
    }

    function scrollIframeToRatio(ratio) {
      var state = getIframeScrollState();
      if (!state || state.maxScroll <= 0) return;
      ratio = Math.max(0, Math.min(1, ratio));
      state.scrollEl.scrollTop = state.maxScroll * ratio;
      updateDemoScrollbar();
    }

    function prepareIframeScrollSurface() {
      if (!iframe) return;
      try {
        var iframeDoc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
        if (!iframeDoc || iframeDoc.getElementById("gloobi-comparison-scrollbar-style")) return;
        var style = iframeDoc.createElement("style");
        style.id = "gloobi-comparison-scrollbar-style";
        style.textContent = "html,body{scrollbar-width:none!important;}html::-webkit-scrollbar,body::-webkit-scrollbar{width:0!important;height:0!important;}";
        iframeDoc.head.appendChild(style);
      } catch (err) {}
    }

    function getPercentageFromClientX(clientX) {
      var rect = dragRect || screen.getBoundingClientRect();
      if (rect.width <= 0) return;
      var x = clientX - rect.left;
      return (x / rect.width) * 100;
    }

    function updateFromClientX(clientX) {
      var percentage = getPercentageFromClientX(clientX);
      if (typeof percentage === "number") {
        applyComparisonUpdate(percentage);
      }
    }

    function pauseIframeAutoScroll() {
      isPaused = true;
      if (pauseTimer) {
        clearTimeout(pauseTimer);
        pauseTimer = null;
      }
      var state = getIframeScrollState();
      if (state && state.scrollEl) {
        state.scrollEl.style.scrollBehavior = "auto";
        state.scrollEl.scrollTop = state.scrollEl.scrollTop;
      }
    }

    function resumeIframeAutoScrollSoon() {
      if (pauseTimer) clearTimeout(pauseTimer);
      pauseTimer = setTimeout(function () {
        if (isSectionVisible) {
          isPaused = false;
        }
      }, 650);
    }

    function startDrag(clientX, pointerId) {
      isDragging = true;
      activePointerId = pointerId != null ? pointerId : null;
      dragRect = screen.getBoundingClientRect();
      pauseIframeAutoScroll();
      if (phone) phone.classList.add("is-dragging");
      handle.classList.add("is-dragging");
      if (activePointerId !== null && screen.setPointerCapture) {
        try {
          screen.setPointerCapture(activePointerId);
        } catch (err) {}
      }
      updateFromClientX(clientX);
    }

    function stopDrag(pointerId) {
      if (!isDragging) return;
      if (pointerId != null && activePointerId !== null && pointerId !== activePointerId) return;
      if (activePointerId !== null && screen.releasePointerCapture) {
        try {
          screen.releasePointerCapture(activePointerId);
        } catch (err) {}
      }
      isDragging = false;
      activePointerId = null;
      dragRect = null;
      if (phone) phone.classList.remove("is-dragging");
      handle.classList.remove("is-dragging");
      resumeIframeAutoScrollSoon();
    }

    function updateScrollbarDragPosition(clientY) {
      if (!scrollbar) return;
      updateDemoScrollbar();
      var trackRect = scrollbar.getBoundingClientRect();
      if (trackRect.height <= 0) return;
      scrollIframeToRatio((clientY - trackRect.top) / trackRect.height);
    }

    function startScrollbarDrag(clientY, pointerId) {
      var state = getIframeScrollState();
      if (!state || state.maxScroll <= 0 || !scrollbar) return;
      updateDemoScrollbar();
      isScrollbarDragging = true;
      activeScrollbarPointerId = pointerId != null ? pointerId : null;
      pauseIframeAutoScroll();
      scrollbar.classList.add("is-dragging");
      if (activeScrollbarPointerId !== null && scrollbar.setPointerCapture) {
        try {
          scrollbar.setPointerCapture(activeScrollbarPointerId);
        } catch (err) {}
      }
    }

    function moveScrollbarDrag(clientY) {
      if (!isScrollbarDragging) return;
      updateScrollbarDragPosition(clientY);
    }

    function stopScrollbarDrag(pointerId) {
      if (!isScrollbarDragging) return;
      if (pointerId != null && activeScrollbarPointerId !== null && pointerId !== activeScrollbarPointerId) return;
      if (activeScrollbarPointerId !== null && scrollbar && scrollbar.releasePointerCapture) {
        try {
          scrollbar.releasePointerCapture(activeScrollbarPointerId);
        } catch (err) {}
      }
      isScrollbarDragging = false;
      activeScrollbarPointerId = null;
      if (scrollbar) scrollbar.classList.remove("is-dragging");
      resumeIframeAutoScrollSoon();
    }

    if (window.PointerEvent) {
      if (scrollbar) {
        scrollbar.addEventListener("pointerdown", function (e) {
          if (e.button !== 0 && e.pointerType !== "touch") return;
          startScrollbarDrag(e.clientY, e.pointerId);
          updateScrollbarDragPosition(e.clientY);
          e.preventDefault();
          e.stopPropagation();
        });

        scrollbar.addEventListener("pointermove", function (e) {
          if (!isScrollbarDragging) return;
          if (activeScrollbarPointerId !== null && e.pointerId !== activeScrollbarPointerId) return;
          moveScrollbarDrag(e.clientY);
          e.preventDefault();
          e.stopPropagation();
        });

        scrollbar.addEventListener("pointerup", function (e) {
          stopScrollbarDrag(e.pointerId);
          e.stopPropagation();
        });
        scrollbar.addEventListener("pointercancel", function (e) {
          stopScrollbarDrag(e.pointerId);
          e.stopPropagation();
        });
        scrollbar.addEventListener("lostpointercapture", function () {
          stopScrollbarDrag();
        });
      }

      handle.addEventListener("pointerdown", function (e) {
        if (e.button !== 0 && e.pointerType !== "touch") return;
        startDrag(e.clientX, e.pointerId);
        e.preventDefault();
        e.stopPropagation();
      });

      screen.addEventListener("pointerdown", function (e) {
        if (e.target && e.target.closest && e.target.closest(".gloobi-comparison__scrollbar")) return;
        if (e.button !== 0 && e.pointerType !== "touch") return;
        startDrag(e.clientX, e.pointerId);
        e.preventDefault();
      });

      screen.addEventListener("pointermove", function (e) {
        if (!isDragging) return;
        if (activePointerId !== null && e.pointerId !== activePointerId) return;
        updateFromClientX(e.clientX);
        e.preventDefault();
      });

      screen.addEventListener("pointerup", function (e) {
        stopDrag(e.pointerId);
      });
      screen.addEventListener("pointercancel", function (e) {
        stopDrag(e.pointerId);
      });
      screen.addEventListener("lostpointercapture", function () {
        stopDrag();
      });
      window.addEventListener("pointerup", function (e) {
        stopDrag(e.pointerId);
        stopScrollbarDrag(e.pointerId);
      });
      window.addEventListener("pointermove", function (e) {
        if (!isScrollbarDragging) return;
        if (activeScrollbarPointerId !== null && e.pointerId !== activeScrollbarPointerId) return;
        moveScrollbarDrag(e.clientY);
        e.preventDefault();
      }, { passive: false });
      document.addEventListener("pointermove", function (e) {
        if (!isScrollbarDragging) return;
        if (activeScrollbarPointerId !== null && e.pointerId !== activeScrollbarPointerId) return;
        moveScrollbarDrag(e.clientY);
        e.preventDefault();
      }, { capture: true, passive: false });
      document.addEventListener("pointerup", function (e) {
        stopScrollbarDrag(e.pointerId);
      }, { capture: true });
    } else {
      // Fallback for older browsers.
      if (scrollbar) {
        scrollbar.addEventListener("mousedown", function (e) {
          if (e.button !== 0) return;
          startScrollbarDrag(e.clientY);
          updateScrollbarDragPosition(e.clientY);
          e.preventDefault();
          e.stopPropagation();
        });

        document.addEventListener("mousemove", function (e) {
          if (!isScrollbarDragging) return;
          moveScrollbarDrag(e.clientY);
          e.preventDefault();
        });

        document.addEventListener("mouseup", function () {
          stopScrollbarDrag();
        });
      }

      handle.addEventListener("mousedown", function (e) {
        if (e.button !== 0) return;
        startDrag(e.clientX);
        e.preventDefault();
        e.stopPropagation();
      });

      screen.addEventListener("mousedown", function (e) {
        if (e.target && e.target.closest && e.target.closest(".gloobi-comparison__scrollbar")) return;
        if (e.button !== 0) return;
        startDrag(e.clientX);
        e.preventDefault();
      });

      document.addEventListener("mousemove", function (e) {
        if (!isDragging) return;
        updateFromClientX(e.clientX);
      });

      document.addEventListener("mouseup", function () {
        stopDrag();
      });

      handle.addEventListener("touchstart", function (e) {
        if (!e.touches || !e.touches[0]) return;
        startDrag(e.touches[0].clientX);
        e.preventDefault();
        e.stopPropagation();
      }, { passive: false });

      screen.addEventListener("touchstart", function (e) {
        if (!e.touches || !e.touches[0]) return;
        if (e.target && e.target.closest && e.target.closest(".gloobi-comparison__scrollbar")) return;
        startDrag(e.touches[0].clientX);
        e.preventDefault();
      }, { passive: false });

      document.addEventListener("touchmove", function (e) {
        if (!isDragging || !e.touches || !e.touches[0]) return;
        updateFromClientX(e.touches[0].clientX);
        if (e.cancelable) e.preventDefault();
      }, { passive: false });

      document.addEventListener("touchend", function () {
        stopDrag();
      });
      document.addEventListener("touchcancel", function () {
        stopDrag();
      });
    }

    window.addEventListener("blur", function () {
      stopDrag();
      stopScrollbarDrag();
    });

    if (scrollbar) {
      scrollbar.addEventListener("keydown", function (e) {
        var state = getIframeScrollState();
        if (!state || state.maxScroll <= 0) return;
        var nextTop = state.scrollEl.scrollTop;
        if (e.key === "ArrowUp") {
          nextTop -= 80;
        } else if (e.key === "ArrowDown") {
          nextTop += 80;
        } else if (e.key === "PageUp") {
          nextTop -= state.scrollEl.clientHeight * 0.8;
        } else if (e.key === "PageDown") {
          nextTop += state.scrollEl.clientHeight * 0.8;
        } else if (e.key === "Home") {
          nextTop = 0;
        } else if (e.key === "End") {
          nextTop = state.maxScroll;
        } else {
          return;
        }
        pauseIframeAutoScroll();
        state.scrollEl.scrollTop = Math.max(0, Math.min(state.maxScroll, nextTop));
        updateDemoScrollbar();
        resumeIframeAutoScrollSoon();
        e.preventDefault();
      });
    }

    // Keyboard Navigation
    handle.addEventListener("keydown", function (e) {
      var step = 5;
      var newPos = currentPosition;
      if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        newPos -= step;
        e.preventDefault();
      } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        newPos += step;
        e.preventDefault();
      } else if (e.key === "Home") {
        newPos = 0;
        e.preventDefault();
      } else if (e.key === "End") {
        newPos = 100;
        e.preventDefault();
      }
      applyComparisonUpdate(newPos);
    });

    // Initial position
    applyComparisonUpdate(50);

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden && isSectionVisible) startIframeAutoScroll();
    });
    // Auto-scroll only while the comparison is visible.
    function startIframeAutoScroll() {
      if (!iframe || !isSectionVisible || document.hidden) return;
      var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reducedMotion) return;
      if (isAutoScrollRunning) return;
      isAutoScrollRunning = true;

      function stepScroll() {
        if (!isSectionVisible || document.hidden) {
          autoScrollTimer = null;
          isAutoScrollRunning = false;
          return;
        }
        if (!iframe || isPaused) {
          autoScrollTimer = requestAnimationFrame(stepScroll);
          return;
        }

        try {
          var iframeDoc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
          if (iframeDoc && iframeDoc.documentElement) {
            var scrollEl = iframeDoc.scrollingElement || iframeDoc.documentElement || iframeDoc.body;
            var maxScroll = scrollEl.scrollHeight - scrollEl.clientHeight;

            if (maxScroll > 0) {
              if (scrollEl.scrollTop >= maxScroll - 4) {
                isPaused = true;
                if (pauseTimer) clearTimeout(pauseTimer);
                pauseTimer = setTimeout(function () {
                  scrollEl.style.scrollBehavior = "auto";
                  scrollEl.scrollTop = 0;
                  updateDemoScrollbar();
                  setTimeout(function () {
                    isPaused = false;
                  }, 1000);
                }, 1500);
              } else {
                scrollEl.scrollTop += scrollStep;
              }
              updateDemoScrollbar();
            } else {
              updateDemoScrollbar();
            }
          }
        } catch (err) {}

        autoScrollTimer = requestAnimationFrame(stepScroll);
      }

      if (!autoScrollTimer) {
        autoScrollTimer = requestAnimationFrame(stepScroll);
      }
    }

    if (iframe) {
      iframe.addEventListener("load", function () {
        prepareIframeScrollSurface();
        updateDemoScrollbar();
        try {
          var scrollEl = getIframeScrollEl();
          if (scrollEl) {
            scrollEl.addEventListener("scroll", updateDemoScrollbar, { passive: true });
          }
        } catch (err) {}
        setTimeout(startIframeAutoScroll, 500);
      });
    }

    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(function (entries) {
        var entry = entries[0];
        if (entry && entry.isIntersecting) {
          isSectionVisible = true;
          if (!isDragging) {
            isPaused = false;
          }
          startIframeAutoScroll();
        } else {
          isSectionVisible = false;
          isPaused = true;
        }
      }, { threshold: 0.15 });
      observer.observe(section);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootComparisonSection);
  } else {
    bootComparisonSection();
  }
})();

(function () {
  "use strict";

  function bootRailNavigation() {
    var rail = document.querySelector(".gloobi-rail");
    if (!rail) return;

    var logoMenu = rail.querySelector(".gloobi-rail-logo-menu");
    var logoButton = rail.querySelector(".gloobi-rail-avatar");
    var links = Array.prototype.slice.call(rail.querySelectorAll("a[href^='#']")).filter(function (link) {
      return !link.closest(".gloobi-rail-dropdown");
    });
    var scrollLinks = Array.prototype.slice.call(rail.querySelectorAll("a[href^='#']"));
    var sectionMap = [];

    links.forEach(function (link) {
      var hash = link.getAttribute("href");
      if (!hash || hash === "#") return;
      var target = document.querySelector(hash);
      if (target) {
        sectionMap.push({
          hash: hash,
          link: link,
          element: target
        });
      }
    });

    function setActiveLink(activeHash) {
      sectionMap.forEach(function (item) {
        var isActive = item.hash === activeHash;
        item.link.classList.toggle("is-active", isActive);
        if (isActive) {
          item.link.setAttribute("aria-current", "page");
        } else {
          item.link.removeAttribute("aria-current");
        }
      });
    }

    var activeLinkFrame = null;

    function updateActiveLinkFromScroll() {
      activeLinkFrame = null;
      if (!sectionMap.length) return;

      if (window.pageYOffset <= 4) {
        setActiveLink("#hero");
        return;
      }

      var anchor = Math.min(window.innerHeight * 0.38, 360);
      var activeItem = null;
      var activeTop = -Infinity;

      sectionMap.forEach(function (item) {
        var styles = window.getComputedStyle(item.element);
        var rect = item.element.getBoundingClientRect();
        if (styles.display === "none" || rect.height <= 1) return;

        if (rect.top <= anchor && rect.bottom > anchor && rect.top > activeTop) {
          activeItem = item;
          activeTop = rect.top;
        }
      });

      if (!activeItem) {
        sectionMap.forEach(function (item) {
          var styles = window.getComputedStyle(item.element);
          var rect = item.element.getBoundingClientRect();
          if (styles.display === "none" || rect.height <= 1) return;
          if (rect.top <= anchor && rect.top > activeTop) {
            activeItem = item;
            activeTop = rect.top;
          }
        });
      }

      setActiveLink(activeItem ? activeItem.hash : sectionMap[0].hash);
    }

    function scheduleActiveLinkUpdate() {
      if (activeLinkFrame !== null) return;
      activeLinkFrame = window.requestAnimationFrame(updateActiveLinkFromScroll);
    }

    window.addEventListener("scroll", scheduleActiveLinkUpdate, { passive: true });
    window.addEventListener("resize", scheduleActiveLinkUpdate);
    window.addEventListener("load", scheduleActiveLinkUpdate);
    scheduleActiveLinkUpdate();

    scrollLinks.forEach(function (link) {
      link.addEventListener("click", function (e) {
        var hash = link.getAttribute("href");
        if (!hash || hash === "#") return;
        var target = document.querySelector(hash);
        if (!target) return;

        e.preventDefault();

        if (window.gloobiLenis && typeof window.gloobiLenis.scrollTo === "function") {
          window.gloobiLenis.scrollTo(target, { offset: -20 });
        } else {
          var targetTop = target.getBoundingClientRect().top + window.pageYOffset - 20;
          window.scrollTo({
            top: targetTop,
            behavior: "smooth"
          });
        }

        setActiveLink(hash);
      });
    });

    if (logoMenu && logoButton) {
      var logoDropdown = logoMenu.querySelector(".gloobi-rail-dropdown");

      function closeLogoMenu(suppressHover) {
        logoMenu.classList.remove("is-open");
        logoMenu.classList.toggle("is-click-closed", Boolean(suppressHover));
        if (logoDropdown) {
          logoDropdown.classList.remove("is-visible");
        }
        logoButton.setAttribute("aria-expanded", "false");
        if (suppressHover && document.activeElement && logoMenu.contains(document.activeElement)) {
          document.activeElement.blur();
        }
      }

      logoButton.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        var isOpen = logoMenu.classList.contains("is-open");
        if (isOpen) {
          closeLogoMenu(true);
          return;
        }

        logoMenu.classList.remove("is-click-closed");
        logoMenu.classList.add("is-open");
        if (logoDropdown) {
          logoDropdown.classList.add("is-visible");
        }
        logoButton.setAttribute("aria-expanded", "true");
      });

      logoMenu.addEventListener("pointerleave", function () {
        logoMenu.classList.remove("is-click-closed");
      });

      logoButton.addEventListener("focus", function () {
        if (!logoMenu.matches(":hover")) {
          logoMenu.classList.remove("is-click-closed");
        }
      });

      if (logoDropdown) {
        logoDropdown.addEventListener("click", function () {
          closeLogoMenu(true);
        });
      }

      document.addEventListener("click", function (event) {
        if (!logoMenu.contains(event.target)) {
          closeLogoMenu();
        }
      });

      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
          closeLogoMenu(true);
        }
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootRailNavigation);
  } else {
    bootRailNavigation();
  }
})();
