// Product card touch preview behavior:
// - Desktop keeps native CSS hover
// - Mobile uses first tap = preview, second tap = navigate
(function() {
  function initProductCardTouchPreview() {
    if (window._productCardTouchPreviewInit) return;
    window._productCardTouchPreviewInit = true;

    var CARD_SELECTOR = '.grid-product';
    var LINK_SELECTOR = '.grid-product__link[href]';
    var SECONDARY_IMAGE_SELECTOR = '.grid-product__secondary-image img';
    var ACTIVE_CLASSES = ['show-second', 'active', 'is-touch-hover'];
    var ACTIVE_SELECTOR = '.show-second, .active, .is-touch-hover';
    var IGNORED_SELECTOR = '.sibling-swatch, .swatch, .grid-product__quick-add, .grid-product__quick-add-btn, .quick-product__btn, .js-ajax-add-to-cart, .swatch-option, .swatch__item, .swatch__input, .swatch__label';

    var isMobileTouch = (
      'ontouchstart' in window ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
      (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches)
    );
    console.log('[mobile-hover] isMobileTouch:', isMobileTouch);
    if (!isMobileTouch) {
      console.log('[mobile-hover] Not mobile touch, exiting.');
      return;
    }

    document.documentElement.classList.add('mobile-touch-preview-ready');
    console.log('[mobile-hover] Script initialized, mobile-touch-preview-ready set.');

    var touchStartX = 0;
    var touchStartY = 0;
    var touchMoved = false;
    var TOUCH_MOVE_THRESHOLD = 10;
    var lastTouchHandledAt = 0;

    function isPlainPrimaryClick(event) {
      // Keep analytics and modified-click behavior intact.
      var isPrimary = (event.button == null || event.button === 0);
      return isPrimary && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
    }

    function isIgnoredTarget(el) {
      // Only ignore if the target IS or IS INSIDE a swatch/quick add element.
      if (!el || !el.closest) return false;
      var ignored = el.closest(IGNORED_SELECTOR);
      // If the ignored element is inside a product card, but not the main link/image, ignore preview logic.
      if (ignored) return true;
      return false;
    }

    function resolveEventTarget(event) {
      var target = event.target;

      // On some mobile browsers, touchend target can be stale.
      // Resolve the element under the finger for reliable delegation.
      if (event.changedTouches && event.changedTouches.length) {
        var touch = event.changedTouches[0];
        var pointEl = document.elementFromPoint(touch.clientX, touch.clientY);
        if (pointEl) {
          target = pointEl;
        }
      }

      if (!target) return null;
      if (target.nodeType !== 1) return target.parentElement || null;
      return target;
    }

    function preloadSecondaryImage(card) {
      var second = card.querySelector(SECONDARY_IMAGE_SELECTOR);
      if (!second) return false;
      if (second.loading === 'lazy') second.loading = 'eager';
      return true;
    }

    function clearCardState(card) {
      if (!card) return;
      for (var i = 0; i < ACTIVE_CLASSES.length; i++) {
        card.classList.remove(ACTIVE_CLASSES[i]);
      }
      card.removeAttribute('data-touch-preview-active');
    }

    function clearAllCards(exceptCard) {
      var activeNodes = document.querySelectorAll(CARD_SELECTOR + ACTIVE_SELECTOR);
      for (var i = 0; i < activeNodes.length; i++) {
        if (exceptCard && activeNodes[i] === exceptCard) continue;
        clearCardState(activeNodes[i]);
      }
    }

    function activateCard(card) {
      clearAllCards(card);
      for (var i = 0; i < ACTIVE_CLASSES.length; i++) {
        card.classList.add(ACTIVE_CLASSES[i]);
      }
      card.setAttribute('data-touch-preview-active', '1');
    }

    function isCardActive(card) {
      return card && card.getAttribute('data-touch-preview-active') === '1';
    }

    // Single delegated click handler:
    // 1) First tap on card link -> preview (prevent navigation)
    // 2) Second tap on same card link -> allow navigation
    // 3) Tap outside any card -> reset active card
    document.addEventListener('click', function(event) {
      // Ignore synthetic click that follows handled touch interaction.
      if (Date.now() - lastTouchHandledAt < 700) return;
      if (!isPlainPrimaryClick(event)) return;

      var target = resolveEventTarget(event);
      if (!target || !target.closest) return;

      // Do not interfere with swatches/quick add controls.
      if (isIgnoredTarget(target)) {
        console.log('[mobile-hover] Click ignored: swatch/quick add control.');
        return;
      }

      var card = target.closest(CARD_SELECTOR);
      // Outside any card: reset state.
      if (!card) {
        console.log('[mobile-hover] Click outside card, clearing all cards.');
        clearAllCards();
        return;
      }

      // Only trigger preview for taps on main product image or link.
      var link = target.closest(LINK_SELECTOR);
      var mainImage = target.closest('.grid-product__image') || card.querySelector('.grid-product__image');
      if (!link && !mainImage) {
        console.log('[mobile-hover] Click not on main image/link, clearing card.');
        clearAllCards(card);
        return;
      }

      // No second image: keep native navigation.
      if (!preloadSecondaryImage(card)) {
        console.log('[mobile-hover] No secondary image, clearing card.');
        clearAllCards(card);
        return;
      }

      // First tap on this card = preview only.
      if (!isCardActive(card)) {
        console.log('[mobile-hover] First tap, activating preview for card:', card);
        event.preventDefault();
        activateCard(card);
        return;
      }

      // Second tap on same active card = allow navigation.
      console.log('[mobile-hover] Second tap, clearing card state.');
      clearCardState(card);
    }, true);

    // Reset on scroll to avoid stuck previews.
    window.addEventListener('scroll', function() {
      clearAllCards();
    }, { passive: true });

    // Preload second image as early as possible on touch start.
    document.addEventListener('touchstart', function(event) {
      var target = resolveEventTarget(event);
      if (!target || !target.closest) return;
      if (isIgnoredTarget(target)) return;

      if (event.touches && event.touches.length) {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
        touchMoved = false;
      }

      var card = target.closest(CARD_SELECTOR);
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

    // Fallback for browsers/devices with inconsistent click timing:
    // - first tap on link: preview and block navigation
    // - second tap on same card: mark next click to navigate
    document.addEventListener('touchend', function(event) {
      if (touchMoved) {
        console.log('[mobile-hover] Touch moved, not a tap.');
        return;
      }

      var target = resolveEventTarget(event);
      if (!target || !target.closest) return;
      if (isIgnoredTarget(target)) {
        console.log('[mobile-hover] Touchend ignored: swatch/quick add control.');
        return;
      }

      var card = target.closest(CARD_SELECTOR);
      if (!card) {
        console.log('[mobile-hover] Touchend not on card.');
        return;
      }

      // Only trigger preview for taps on main product image or link.
      var link = target.closest(LINK_SELECTOR);
      var mainImage = target.closest('.grid-product__image') || card.querySelector('.grid-product__image');
      if (!link && !mainImage) {
        console.log('[mobile-hover] Touchend not on main image/link.');
        return;
      }
      if (!preloadSecondaryImage(card)) {
        console.log('[mobile-hover] Touchend: no secondary image.');
        return;
      }

      if (!isCardActive(card)) {
        console.log('[mobile-hover] Touchend: first tap, activating preview for card:', card);
        event.preventDefault();
        activateCard(card);
        lastTouchHandledAt = Date.now();
        return;
      }

      // Second tap: navigate directly for maximum device reliability.
      console.log('[mobile-hover] Touchend: second tap, navigating.');
      event.preventDefault();
      clearCardState(card);
      lastTouchHandledAt = Date.now();
      if (link && link.href) {
        window.location.assign(link.href);
      }
    }, { passive: false, capture: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductCardTouchPreview);
  } else {
    initProductCardTouchPreview();
  }
})();