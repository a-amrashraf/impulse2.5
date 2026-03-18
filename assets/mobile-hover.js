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
    var IGNORED_SELECTOR = '.sibling-swatch, .swatch, .grid-product__quick-add, .grid-product__quick-add-btn, .quick-product__btn, .js-ajax-add-to-cart';

    var isMobileTouch = (
      'ontouchstart' in window ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
      (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches)
    );
    if (!isMobileTouch) return;

    document.documentElement.classList.add('mobile-touch-preview-ready');

    function isPlainPrimaryClick(event) {
      // Keep analytics and modified-click behavior intact.
      var isPrimary = (event.button == null || event.button === 0);
      return isPrimary && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
    }

    function isIgnoredTarget(el) {
      return !!(el && el.closest && el.closest(IGNORED_SELECTOR));
    }

    function preloadSecondaryImage(card) {
      var second = card.querySelector(SECONDARY_IMAGE_SELECTOR);
      if (!second) return false;
      if (second.loading === 'lazy') second.loading = 'eager';
      return true;
    }

    function clearCardState(card) {
      if (!card) return;
      card.classList.remove.apply(card.classList, ACTIVE_CLASSES);
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
      card.classList.add.apply(card.classList, ACTIVE_CLASSES);
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
      if (!isPlainPrimaryClick(event)) return;

      var target = event.target;
      if (!target || !target.closest) return;

      var card = target.closest(CARD_SELECTOR);

      // Outside any card: reset state.
      if (!card) {
        clearAllCards();
        return;
      }

      // Do not interfere with swatches/quick add controls.
      if (isIgnoredTarget(target)) return;

      // We only intercept taps related to the product link area.
      var link = target.closest(LINK_SELECTOR) || card.querySelector(LINK_SELECTOR);
      if (!link) {
        clearAllCards(card);
        return;
      }

      // No second image: keep native navigation.
      if (!preloadSecondaryImage(card)) {
        clearAllCards(card);
        return;
      }

      // First tap on this card = preview only.
      if (!isCardActive(card)) {
        event.preventDefault();
        activateCard(card);
        return;
      }

      // Second tap on same active card = allow navigation.
      clearCardState(card);
    }, true);

    // Reset on scroll to avoid stuck previews.
    window.addEventListener('scroll', function() {
      clearAllCards();
    }, { passive: true });

    // Preload second image as early as possible on touch start.
    document.addEventListener('touchstart', function(event) {
      var target = event.target;
      if (!target || !target.closest) return;
      if (isIgnoredTarget(target)) return;

      var card = target.closest(CARD_SELECTOR);
      if (!card) return;

      preloadSecondaryImage(card);
    }, { passive: true, capture: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProductCardTouchPreview);
  } else {
    initProductCardTouchPreview();
  }
})();