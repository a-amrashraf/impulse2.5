document.addEventListener('DOMContentLoaded', function() {
  initSiblingSwatches();
  initTouchHover();
});

function initTouchHover() { 
  // Prevent duplicate listeners
  if (window.touchHoverInitialized) return;
  window.touchHoverInitialized = true;

  // Global touchstart listener (Event Delegation)
  document.addEventListener('touchstart', function(e) {
    const card = e.target.closest('.grid-product');
    if (!card) return;

    // 1. Clear any stuck states from other cards immediately
    // This handles edge cases where a previous touchcancel might have been missed
    const stuckCards = document.querySelectorAll('.is-touch-hover');
    stuckCards.forEach(c => c.classList.remove('is-touch-hover'));

    // 2. Set strict delay to distinguish tap vs scroll (150ms)
    // If user flicks fast, 'touchend' fires before this timer, canceling the effect.
    const timer = setTimeout(() => {
      card.classList.add('is-touch-hover');
    }, 150);

    // 3. Define cleanup (Reset state on release)
    const clearHover = () => {
      clearTimeout(timer); // Cancel the show if it hasn't happened yet (fast scroll)
      card.classList.remove('is-touch-hover'); // Hide image if it was shown
      
      // Remove temporary listeners to keep DOM clean
      card.removeEventListener('touchend', clearHover);
      card.removeEventListener('touchcancel', clearHover);
    };

    // 4. Attach cleanup to this specific interaction
    // 'touchcancel' is crucial for detecting when the browser takes over (e.g. big scroll)
    card.addEventListener('touchend', clearHover, { passive: true });
    card.addEventListener('touchcancel', clearHover, { passive: true });

  }, { passive: true });
}

function initSiblingSwatches() {
  const swatches = document.querySelectorAll('.sibling-swatch:not(.init-done)');
  
  // We don't need to re-run initTouchHover here because it uses
  // event delegation on the document, so it handles new elements automatically.

  swatches.forEach(swatch => {
    swatch.classList.add('init-done');
    
    swatch.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();

      const card = this.closest('.grid-product');
      if (!card || card.classList.contains('sibling-loading')) return;
      
      // Inject Spinner Styles if not present
      if (!document.getElementById('sibling-swatch-spinner-style')) {
         const style = document.createElement('style');
         style.id = 'sibling-swatch-spinner-style';
         style.innerHTML = `
           @keyframes sibling-spin {
              0% { transform: translate(-50%, -50%) rotate(0deg); }
              100% { transform: translate(-50%, -50%) rotate(360deg); }
           }
           .grid-product__spinner {
              position: absolute;
              top: 50%;
              left: 50%;
              width: 60px;
              height: 60px;
              border: 5px solid rgba(0,0,0,0.1);
              border-top: 5px solid currentColor;
              border-radius: 50%;
              animation: sibling-spin 0.6s linear infinite;
              z-index: 20;
              margin: 0;
              transform-origin: center;
              transform: translate(-50%, -50%);
              color: var(--colorTextBody, #000);
           }
         `;
         document.head.appendChild(style);
      }

      // Add Spinner
      let spinner = card.querySelector('.grid-product__spinner');
      if (!spinner) {
         spinner = document.createElement('div');
         spinner.className = 'grid-product__spinner';
         // Try to append to image wrapper for better positioning
         const imageWrapper = card.querySelector('.grid-product__image-mask') || card.querySelector('.grid__item-image-wrapper') || card;
         
         // Ensure relative positioning for spinner
         if(getComputedStyle(imageWrapper).position === 'static') {
            imageWrapper.style.position = 'relative'; 
         }
         imageWrapper.appendChild(spinner);
      }
      
      card.classList.add('sibling-loading');
      card.style.opacity = '0.6';
      card.style.pointerEvents = 'none';
      card.style.transition = 'opacity 0.2s';

      // Build Fetch URL
      let separator = '?';
      if (this.dataset.siblingUrl.includes('?')) {
        separator = '&';
      }
      const fetchUrl = this.dataset.siblingUrl + separator + 'view=card';

      fetch(fetchUrl)
        .then(response => response.text())
        .then(html => {
          const div = document.createElement('div');
          div.innerHTML = html;
          const newCard = div.querySelector('.grid-product');

          if(newCard) {
             // 1. CLEANUP: Remove PBIOH elements
             newCard.querySelectorAll('.pbioh-hidden, .pbioh-second, [class*="pbioh"], .lazyload.pbioh-hidden').forEach(el => el.remove());

             // 2. IMAGE PRELOADING LOGIC
             // We want to force load the main image before swapping content to avoid white flash.
             // We also want to bypass lazyloading for this initial display.
             const images = newCard.querySelectorAll('img');
             const cardWidth = card.offsetWidth || 540;
             let bestWidth = '540';
             if (cardWidth > 540) bestWidth = '720';
             if (cardWidth > 720) bestWidth = '900';
             if (cardWidth > 900) bestWidth = '1080';

             const imagePromises = [];

             images.forEach(img => {
                let srcTemplate = img.getAttribute('data-src');
                if (srcTemplate) {
                   const finalSrc = srcTemplate.replace('{width}', bestWidth);
                   // Prepare the DOM element for instant display
                   img.setAttribute('src', finalSrc);
                   img.classList.remove('lazyload');
                   img.classList.add('lazyloaded');
                   img.style.opacity = '1';
                   img.style.transition = 'none';

                   // Create a promise that resolves when the image is naturally loaded
                   const p = new Promise((resolve) => {
                       const tempImg = new Image();
                       tempImg.onload = resolve;
                       tempImg.onerror = resolve; // Continue even if error
                       tempImg.src = finalSrc;
                   });
                   imagePromises.push(p);
                }
             });

             // Wait for images to load (with a 2s timeout just in case)
             const timeout = new Promise(resolve => setTimeout(resolve, 2000));
             
             Promise.race([Promise.all(imagePromises), timeout]).then(() => {
                 // 3. SWAP CONTENT
                 card.innerHTML = newCard.innerHTML;
                 
                 // 4. UPDATE ATTRIBUTES
                 if (newCard.className) {
                    const wasTouchInit = card.classList.contains('touch-init-done');
                    card.className = newCard.className;
                    if (wasTouchInit) card.classList.add('touch-init-done');
                 }
                 if (newCard.getAttribute('data-product-id')) card.setAttribute('data-product-id', newCard.getAttribute('data-product-id'));
                 if (newCard.getAttribute('data-product-handle')) card.setAttribute('data-product-handle', newCard.getAttribute('data-product-handle'));
                 
                 // 5. RE-INITIALIZE SWATCHES
                 initSiblingSwatches();
                 
                 // 6. RE-INITIALIZE "ADD TO CART" (AJAX CART)
                 if (window.theme && window.theme.initQuickAdd) {
                     // We need to re-init just this button or all. 
                     // Since initQuickAdd replaces elements, it's safe to run globally.
                     window.theme.initQuickAdd();
                 }
                 
                 // 7. TRIGGER LAZYSIZES
                 if (window.lazySizes) {
                   window.lazySizes.loader.checkElems();
                 }

                 // 8. FINAL CLEANUP
                 card.classList.remove('sibling-loading');
                 card.style.opacity = '1';
                 card.style.pointerEvents = 'auto';
                 const existingSpinner = card.querySelector('.grid-product__spinner');
                 if(existingSpinner) existingSpinner.remove();
             });
          } else {
             // Fallback if no card found
             card.classList.remove('sibling-loading');
             card.style.opacity = '1';
             card.style.pointerEvents = 'auto';
             const existingSpinner = card.querySelector('.grid-product__spinner');
             if(existingSpinner) existingSpinner.remove();
          }
        })
        .catch(err => {
          console.error('Sibling Swatch Error:', err);
          card.classList.remove('sibling-loading');
          card.style.opacity = '1';
          card.style.pointerEvents = 'auto';
          const existingSpinner = card.querySelector('.grid-product__spinner');
          if(existingSpinner) existingSpinner.remove();
        });
    });
  });
}
