// Product card touch preview behavior:
// - Desktop keeps native CSS hover
// - Mobile uses first tap = preview, second tap = navigate
(function() {
  function initProductCardTouchPreview() {
    if (window._productCardTouchPreviewInit) return;
    window._productCardTouchPreviewInit = true;

    var ACTIVE_CLASSES = ['show-second', 'active', 'is-touch-hover'];
    var IGNORED_SELECTOR = '.sibling-swatch, .swatch, .grid-product__quick-add, .grid-product__quick-add-btn, .quick-product__btn, .js-ajax-add-to-cart';

    var isMobileTouch = (
      'ontouchstart' in window ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
      (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches)
    );
    if (!isMobileTouch) return;

    document.documentElement.classList.add('mobile-touch-preview-ready');

    var activeCard = null;
    var touchStartX = 0;
    var touchStartY = 0;
    var touchMoved = false;
    var TOUCH_MOVE_THRESHOLD = 10;

    function isPlainPrimaryClick(event) {
      // Mobile synthetic clicks may have undefined button in some browsers.
      // Allow undefined/null and only reject explicit non-left clicks.
      var isPrimary = (event.button == null || event.button === 0);
      return isPrimary && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
    }

    function pruneStaleActiveCard() {
      if (activeCard && !document.contains(activeCard)) {
        activeCard = null;
      }
    }

    function isIgnoredTarget(el) {
      return !!(el && el.closest && el.closest(IGNORED_SELECTOR));
    }

    function preloadSecondaryImage(card) {
      var second = card.querySelector('.grid-product__secondary-image img');
      if (!second) return false;
      if (second.loading === 'lazy') second.loading = 'eager';
      return true;
    }

    function setCardActive(card) {
      if (!card) return;
      pruneStaleActiveCard();

      if (activeCard && activeCard !== card) {
        activeCard.classList.remove.apply(activeCard.classList, ACTIVE_CLASSES);
      }

      card.classList.add.apply(card.classList, ACTIVE_CLASSES);
      activeCard = card;
    }

    function clearActiveCard() {
      pruneStaleActiveCard();
      if (!activeCard) return;
      activeCard.classList.remove.apply(activeCard.classList, ACTIVE_CLASSES);
      activeCard = null;
    }

    // Single delegated click handler:
    // 1) First tap on card link -> preview (prevent navigation)
    // 2) Second tap on same card link -> allow navigation
    // 3) Tap outside any card -> reset active card
    document.addEventListener('click', function(event) {
      if (!isPlainPrimaryClick(event)) return;

      var target = event.target;
      if (!target || !target.closest) return;

      pruneStaleActiveCard();

      var card = target.closest('.grid-product');

      // Tap outside product cards: reset any preview state.
      if (!card) {
        clearActiveCard();
        return;
      }

      // Ignore controls that should keep their own behavior.
      if (isIgnoredTarget(target)) return;

      // Intercept card taps for preview/navigation flow.
      // Some themes use overlay links where the tapped DOM node is not always a child of the link.
      var link = target.closest('.grid-product__link') || card.querySelector('.grid-product__link[href]');
      if (!link) return;

      // If no secondary image exists, keep normal navigation.
      if (!preloadSecondaryImage(card)) {
        if (activeCard && activeCard !== card) {
          clearActiveCard();
        }
        return;
      }

      // First tap on a non-active card: preview only.
      if (activeCard !== card) {
        event.preventDefault();
        setCardActive(card);
        return;
      }

      // Second tap on same active card: allow normal navigation.
      clearActiveCard();
    }, true);

    // Reset on scroll to avoid stuck states.
    window.addEventListener('scroll', function() {
      clearActiveCard();
    }, { passive: true });

    // Preload second image on touch start, but do NOT activate here.
    // Activation must happen on first link tap to preserve first-tap preview behavior.
    document.addEventListener('touchstart', function(event) {
      var target = event.target;
      if (!target || !target.closest) return;
      if (isIgnoredTarget(target)) return;

      if (event.touches && event.touches.length) {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
        touchMoved = false;
      }

      var card = target.closest('.grid-product');
      if (!card) return;
      preloadSecondaryImage(card);
    }, { passive: true, capture: true });

    document.addEventListener('touchmove', function(event) {
      if (!event.touches || !event.touches.length) return;

      var dx = Math.abs(event.touches[0].clientX - touchStartX);
      var dy = Math.abs(event.touches[0].clientY - touchStartY);
      if (dx > TOUCH_MOVE_THRESHOLD || dy > TOUCH_MOVE_THRESHOLD) {
        touchMoved = true;
      }
    }, { passive: true, capture: true });

    // Fallback: enforce first-tap preview on touch devices even when click timing is inconsistent.
    document.addEventListener('touchend', function(event) {
      if (touchMoved) return;

      var target = event.target;
      if (!target || !target.closest) return;
      if (isIgnoredTarget(target)) return;

      var card = target.closest('.grid-product');
      if (!card) return;

      var link = target.closest('.grid-product__link') || card.querySelector('.grid-product__link[href]');
      if (!link) return;
      if (!preloadSecondaryImage(card)) return;

      // First tap preview: prevent immediate navigation.
      if (activeCard !== card) {
        event.preventDefault();
        setCardActive(card);
      }
      // Second tap: do nothing here; click handler allows navigation.
    }, { passive: false, capture: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductCardTouchPreview);
  } else {
    initProductCardTouchPreview();
  }
})();