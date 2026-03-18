// Mobile Touch Hover Logic for Product Cards
// Handles touch interactions to show secondary images on mobile devices
(function() {
  function initMobileTouchHover() {
    // Prevent multiple initializations
    if (window._mobileTouchHoverInited) return;
    window._mobileTouchHoverInited = true;

    // Use capture phase to ensure we intercept events before other scripts
    document.addEventListener('touchstart', function(e) {
      
      // 1. Ignore interactions on Swatches (let them be clickable)
      if (e.target.closest('.sibling-swatch') || e.target.closest('.swatch')) return;

      // 2. Find the product card
      var card = e.target.closest('.grid-product');
      if (!card) return;

      // 3. Find secondary image
      var secondaryWrapper = card.querySelector('.grid-product__secondary-image');
      if (!secondaryWrapper) return;

      // 4. Force Image Loading (Crucial for mobile)
      var img = secondaryWrapper.querySelector('img');
      if (img) {
        if (img.loading === 'lazy') img.loading = 'eager';
        // Force opacity and visibility to ensure browser paints it
        img.style.opacity = '1';
        img.style.visibility = 'visible';
      }

      // 5. Clear other active cards
      var others = document.querySelectorAll('.is-touch-hover');
      for (var i = 0; i < others.length; i++) {
        if (others[i] !== card) {
          others[i].classList.remove('is-touch-hover');
        }
      }

      // 6. ACTIVATE HOVER (Immediate)
      card.classList.add('is-touch-hover');

      // 7. HANDLE RELEASE (Cleanup)
      var cleanup = function() {
        // Delay hiding to allow user to see the image (smooth feel)
        setTimeout(function() {
          card.classList.remove('is-touch-hover');
        }, 250);
        
        card.removeEventListener('touchend', cleanup);
      };

      // We only listen for touchend. Scrolling (touchmove) keeps it visible.
      // This creates the "Sticky Hover" effect during scroll, which is desired.
      card.addEventListener('touchend', cleanup, { passive: true });

    }, { passive: true, capture: true });
  }

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileTouchHover);
  } else {
    initMobileTouchHover();
  }
})();