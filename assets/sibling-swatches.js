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
        
        let loader = card.querySelector('.grid-product__loading-bar');
        if (!loader) {
           loader = document.createElement('div');
           loader.className = 'grid-product__loading-bar';
           const content = card.querySelector('.grid-product__content');
           if(content) content.appendChild(loader);
        }

        // Reset width to trigger animation
        loader.style.width = '0%';
        loader.style.opacity = '1';
        
        card.classList.add('loading');
        // card.style.opacity = '0.5';

        // Animate to 50% while waiting
        requestAnimationFrame(() => {
           loader.style.width = '50%';
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
              // Finish loader
              loader.style.width = '100%';
              
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
              }, 300); // Wait for bar to fill
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