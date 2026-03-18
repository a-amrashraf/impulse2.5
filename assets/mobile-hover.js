// Mobile Touch Hover Logic for Product Cards
// Shows the second image while the finger is down or swiping over a card.
(function() {
  function initMobileTouchHover() {
    if (window._mobileTouchHoverInited) return;
    window._mobileTouchHoverInited = true;

    var HOLD_DELAY_MS = 90;
    var MOVE_THRESHOLD_PX = 10;
    var HIDE_DELAY_MS = 120;

    var activeCard = null;
    var startX = 0;
    var startY = 0;
    var moved = false;
    var hoverTimer = null;

    function isExcludedTarget(target) {
      return !!target.closest('.sibling-swatch, .swatch, .grid-product__quick-add, .grid-product__quick-add-btn, .quick-product__btn');
    }

    function clearOtherActiveCards(exceptCard) {
      var openCards = document.querySelectorAll('.is-touch-hover');
      for (var i = 0; i < openCards.length; i++) {
        if (openCards[i] !== exceptCard) {
          openCards[i].classList.remove('is-touch-hover');
        }
      }
    }

    function preloadSecondaryImage(card) {
      var secondaryWrapper = card.querySelector('.grid-product__secondary-image');
      if (!secondaryWrapper) return false;

      var img = secondaryWrapper.querySelector('img');
      if (img) {
        if (img.loading === 'lazy') img.loading = 'eager';

        // If browser delayed src assignment, forcing src from currentSrc can kick paint.
        if (!img.getAttribute('src') && img.currentSrc) {
          img.setAttribute('src', img.currentSrc);
        }
      }

      return true;
    }

    function showHover(card) {
      clearOtherActiveCards(card);
      card.classList.add('is-touch-hover');
    }

    function onStart(target, clientX, clientY) {
      if (isExcludedTarget(target)) return;

      var card = target.closest('.grid-product');
      if (!card) return;
      if (!preloadSecondaryImage(card)) return;

      activeCard = card;
      startX = clientX;
      startY = clientY;
      moved = false;

      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(function() {
        if (activeCard) {
          showHover(activeCard);
        }
      }, HOLD_DELAY_MS);
    }

    function onMove(clientX, clientY) {
      if (!activeCard) return;

      var dx = Math.abs(clientX - startX);
      var dy = Math.abs(clientY - startY);

      if (dx > MOVE_THRESHOLD_PX || dy > MOVE_THRESHOLD_PX) {
        moved = true;

        // Swipe/scroll should still reveal second image quickly.
        clearTimeout(hoverTimer);
        showHover(activeCard);
      }
    }

    function onEnd() {
      clearTimeout(hoverTimer);

      if (activeCard) {
        var cardToClose = activeCard;
        setTimeout(function() {
          cardToClose.classList.remove('is-touch-hover');
        }, HIDE_DELAY_MS);
      }

      activeCard = null;
      moved = false;
    }

    // Pointer Events path (modern browsers)
    document.addEventListener('pointerdown', function(e) {
      if (e.pointerType !== 'touch') return;
      onStart(e.target, e.clientX, e.clientY);
    }, { passive: true, capture: true });

    document.addEventListener('pointermove', function(e) {
      if (e.pointerType !== 'touch') return;
      onMove(e.clientX, e.clientY);
    }, { passive: true, capture: true });

    document.addEventListener('pointerup', function(e) {
      if (e.pointerType !== 'touch') return;
      onEnd();
    }, { passive: true, capture: true });

    document.addEventListener('pointercancel', function(e) {
      if (e.pointerType !== 'touch') return;
      onEnd();
    }, { passive: true, capture: true });

    // Touch Events fallback (older iOS/webviews without Pointer Events)
    if (!window.PointerEvent) {
      document.addEventListener('touchstart', function(e) {
        if (!e.touches || !e.touches.length) return;
        onStart(e.target, e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true, capture: true });

      document.addEventListener('touchmove', function(e) {
        if (!e.touches || !e.touches.length) return;
        onMove(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: true, capture: true });

      document.addEventListener('touchend', function() {
        onEnd();
      }, { passive: true, capture: true });

      document.addEventListener('touchcancel', function() {
        onEnd();
      }, { passive: true, capture: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileTouchHover);
  } else {
    initMobileTouchHover();
  }
})();