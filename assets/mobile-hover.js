// Product card touch preview behavior:
// - Desktop keeps native CSS hover
// - Mobile uses first tap = preview, second tap = navigate
(function() {
  function initProductCardTouchPreview() {
    if (window._productCardTouchPreviewInit) return;
    window._productCardTouchPreviewInit = true;

    var isMobileTouch = (
      'ontouchstart' in window ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
      (window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches)
    );
    if (!isMobileTouch) return;

    var activeCard = null;

    function isIgnoredTarget(el) {
      return !!(el && el.closest && el.closest('.sibling-swatch, .swatch, .grid-product__quick-add, .grid-product__quick-add-btn, .quick-product__btn, .js-ajax-add-to-cart'));
    }

    function preloadSecondaryImage(card) {
      var second = card.querySelector('.grid-product__secondary-image img');
      if (!second) return false;
      if (second.loading === 'lazy') second.loading = 'eager';
      return true;
    }

    function setCardActive(card) {
      if (!card) return;
      if (activeCard && activeCard !== card) {
        activeCard.classList.remove('show-second', 'active', 'is-touch-hover');
      }

      card.classList.add('show-second', 'active', 'is-touch-hover');
      activeCard = card;
    }

    function clearActiveCard() {
      if (!activeCard) return;
      activeCard.classList.remove('show-second', 'active', 'is-touch-hover');
      activeCard = null;
    }

    // First tap on product link previews image, second tap navigates.
    document.addEventListener('click', function(event) {
      var target = event.target;
      if (!target || !target.closest) return;
      if (isIgnoredTarget(target)) return;

      var link = target.closest('.grid-product__link');
      if (!link) return;

      var card = target.closest('.grid-product');
      if (!card) return;
      if (!preloadSecondaryImage(card)) return;

      // If this card is not active yet, this tap is a preview tap.
      if (!card.classList.contains('active')) {
        event.preventDefault();
        event.stopPropagation();
        setCardActive(card);
        return;
      }

      // Active card + second tap: allow normal navigation.
      clearActiveCard();
    }, true);

    // Tapping outside product cards resets preview state.
    document.addEventListener('click', function(event) {
      var target = event.target;
      if (!target || !target.closest) return;
      if (target.closest('.grid-product')) return;
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

      var card = target.closest('.grid-product');
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