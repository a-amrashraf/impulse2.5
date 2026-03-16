document.addEventListener('DOMContentLoaded', function() {
  function initSiblingSwatches() {
    // Select all sibling swatches. We check if they maintain listeners or not.
    // However, if we replace the element, the old listener is gone with the element.
    // The new element doesn't have the listener or the 'init-done' class.
    const swatches = document.querySelectorAll('.sibling-swatch:not(.init-done)');

    swatches.forEach(swatch => {
      swatch.classList.add('init-done');
      
      swatch.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const card = this.closest('.grid-product');
        // Prevent multiple clicks/fetches
        if (card.classList.contains('loading')) return;
        
        // Create or find loader with INLINE styles - appended to CARD to avoid overflow clipping
        let loader = card.querySelector('.grid-product__loading-bar');
        if (!loader) {
           loader = document.createElement('div');
           loader.className = 'grid-product__loading-bar';
           // High z-index, centered
           loader.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 0; height: 4px; background-color: #000; z-index: 2147483647; display: block; pointer-events: none; opacity: 1; box-shadow: 0 0 2px rgba(255,255,255,0.5);';
           
           card.appendChild(loader);
           if(getComputedStyle(card).position === 'static') {
              card.style.position = 'relative'; 
           }
        }

        // Reset state
        loader.style.transition = 'none';
        loader.style.width = '0%';
        loader.style.opacity = '1';
        
        // Force reflow
        void loader.offsetWidth;
        
        card.classList.add('loading');
        
        // Start animation
        requestAnimationFrame(() => {
            loader.style.transition = 'width 2.5s cubic-bezier(0.1, 0.4, 0.2, 1)';
            loader.style.width = '60%'; 
        });
        
        let separator = '?';
        if (this.dataset.siblingUrl.includes('?')) {
          separator = '&';
        }
        const fetchUrl = this.dataset.siblingUrl + separator + 'view=card&t=' + new Date().getTime();

        fetch(fetchUrl)
          .then(response => response.text())
          .then(html => {
            const div = document.createElement('div');
            div.innerHTML = html;
            const newCard = div.querySelector('.grid-product');

            if(newCard) {
              // Finish loader rapidly
              loader.style.transition = 'width 0.2s ease-out';
              loader.style.width = '100%';
              
              setTimeout(() => {
                  card.replaceWith(newCard);
                  newCard.classList.remove('loading');
                  initSiblingSwatches(); 
                  
                  const swatch = this; 
                  if (swatch.dataset.siblingHoverImage) {
                     const hoverImg = newCard.querySelector('.grid-product__secondary-image img');
                     if (hoverImg) {
                        hoverImg.src = swatch.dataset.siblingHoverImage;
                        hoverImg.srcset = swatch.dataset.siblingHoverImage;
                     }
                  }

                  if (window.theme) {
                     if(theme.initQuickShop) theme.initQuickShop();
                     if(theme.initQuickAdd) theme.initQuickAdd();
                     if(theme.currencySwitcher) theme.currencySwitcher.init();
                     if (window.AOS) AOS.refreshHard(); 
                     window.dispatchEvent(new Event('resize'));
                  }
              }, 250);
            }
          })
          .catch(err => {
            console.error('Error loading sibling:', err);
            card.classList.remove('loading');
            loader.style.width = '0%';
          });
      });
    });
  }

  initSiblingSwatches();
  
  // Re-run safely if sections are reloaded in customizer
  document.addEventListener('shopify:section:load', function() {
    initSiblingSwatches();
  });
});