// Mobile Touch Hover Logic for Product Cards
// Shows the second image while the finger is down or swiping over a card.
(function() {
  function initMobileTouchHover() {
    if (window._mobileTouchHoverInited) return;
    window._mobileTouchHoverInited = true;

    var HOLD_DELAY_MS = 0;
    var MOVE_THRESHOLD_PX = 10;
    var HIDE_DELAY_MS = 300;
    var PREVIEW_WINDOW_MS = 1400;
    var coarseTouch = window.matchMedia && window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    var activeCard = null;
    var startX = 0;
    var startY = 0;
    var moved = false;
    var hoverTimer = null;
    var lastPointerStartAt = 0;

    function toElement(target) {
      if (!target) return null;
      if (target.nodeType === 1) return target;
      return target.parentElement || null;
    }

    function isExcludedTarget(target) {
      if (!target || !target.closest) return false;
      return !!target.closest('.sibling-swatch, .swatch, .grid-product__quick-add, .grid-product__quick-add-btn, .quick-product__btn');
    }

    function clearOtherActiveCards(exceptCard) {
      var openCards = document.querySelectorAll('.is-touch-hover');
      for (var i = 0; i < openCards.length; i++) {
        if (openCards[i] !== exceptCard) {
          openCards[i].classList.remove('is-touch-hover');
          var openContent = openCards[i].querySelector('.grid-product__content');
          if (openContent) {
            openContent.classList.remove('is-touch-hover');
          }
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
      var content = card.querySelector('.grid-product__content');
      if (content) {
        content.classList.add('is-touch-hover');
      }
    }

    function onStart(target, clientX, clientY) {
      target = toElement(target);
      if (!target) return;
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
          var content = cardToClose.querySelector('.grid-product__content');
          if (content) {
            content.classList.remove('is-touch-hover');
          }
        }, HIDE_DELAY_MS);
      }

      activeCard = null;
      moved = false;
    }

    // Pointer Events path (modern browsers)
    document.addEventListener('pointerdown', function(e) {
      if (e.pointerType !== 'touch') return;
      lastPointerStartAt = Date.now();
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

    // Touch Events path (always on for Safari/webview reliability).
    // Ignore duplicated touchstart right after pointerdown.
    document.addEventListener('touchstart', function(e) {
      if (!e.touches || !e.touches.length) return;
      if (Date.now() - lastPointerStartAt < 450) return;
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

    // First tap previews image; second tap navigates.
    // This prevents immediate navigation from hiding the hover effect.
    document.addEventListener('click', function(e) {
      if (!coarseTouch) return;

      var target = toElement(e.target);
      if (!target) return;
      if (isExcludedTarget(target)) return;

      var link = target.closest('.grid-product__link');
      if (!link) return;

      var card = target.closest('.grid-product');
      if (!card) return;
      if (!preloadSecondaryImage(card)) return;

      var now = Date.now();
      var ts = parseInt(card.getAttribute('data-touch-preview-ts') || '0', 10);
      var recentPreview = ts && (now - ts) < PREVIEW_WINDOW_MS;

      // First tap: preview only, prevent navigation.
      if (!recentPreview) {
        e.preventDefault();
        e.stopPropagation();
        showHover(card);
        card.setAttribute('data-touch-preview-ts', String(now));

        setTimeout(function() {
          card.classList.remove('is-touch-hover');
          var content = card.querySelector('.grid-product__content');
          if (content) {
            content.classList.remove('is-touch-hover');
          }
        }, 420);
      }
      // Second tap within PREVIEW_WINDOW_MS is allowed to navigate naturally.
    }, { capture: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileTouchHover);
  } else {
    initMobileTouchHover();
  }
})();