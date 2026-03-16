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
        
        // Create or find loader
        let loader = card.querySelector('.grid-product__loading-bar');
        if (!loader) {
           loader = document.createElement('div');
           loader.className = 'grid-product__loading-bar';
           // Find the image container
           const mask = card.querySelector('.grid-product__image-mask') || card.querySelector('.grid__item-image-wrapper');
           if(mask) {
             mask.appendChild(loader);
             // Ensure mask is relatively positioned so loader absolute pos works
             if(getComputedStyle(mask).position === 'static') {
                mask.style.position = 'relative';
             }
           } else {
             card.appendChild(loader);
           }
        }

        // Reset state instantly
        loader.style.transition = 'none';
        loader.style.width = '0%';
        loader.style.opacity = '1';
        
        // Force reflow
        void loader.offsetWidth;
        
        card.classList.add('loading');
        
        // Start animation with slight delay to ensure reset took effect
        setTimeout(() => {
            loader.style.transition = 'width 0.5s ease-out';
            loader.style.width = '60%'; 
        }, 10);
        
        let separator = '?';
        if (this.dataset.siblingUrl.includes('?')) {
          separator = '&';
        }
        // Force unique timestamp to avoid heavy caching of the HTML response, but images are cached
        const fetchUrl = this.dataset.siblingUrl + separator + 'view=card&t=' + new Date().getTime();

        fetch(fetchUrl)
          .then(response => response.text())
          .then(html => {
            const div = document.createElement('div');
            div.innerHTML = html;
            const newCard = div.querySelector('.grid-product');

            if(newCard) {
              // Complete the bar
              loader.style.transition = 'width 0.2s ease-out';
              loader.style.width = '100%';
              
              // Wait for completion
              setTimeout(() => {
                  card.replaceWith(newCard);
                  newCard.classList.remove('loading');
                  
                  // Re-init logic
                  initSiblingSwatches(); 
                  
                  // Force hover image
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
              }, 250); // Match transition time
            }
          })
          .catch(err => {
            console.error('Error loading sibling:', err);
            card.classList.remove('loading');
            if(loader) loader.style.width = '0%';
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