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
           // High z-index, centered, max-width 80% (20% smaller than card)
           loader.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 0; max-width: 80%; height: 4px; background-color: #000; z-index: 2147483647; display: block; pointer-events: none; opacity: 1; box-shadow: 0 0 2px rgba(255,255,255,0.5);';
           
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
               // Preload image to prevent white flash
               const newImg = newCard.querySelector('.grid-product__image') || newCard.querySelector('img');
               let preloadPromise = Promise.resolve();
 
               if (newImg) {
                   // Calculate optimal width based on device
                   let targetWidth = '540';
                   if (window.innerWidth >= 768) {
                       targetWidth = '720'; 
                   }
                   
                   let src = newImg.getAttribute('data-src');
                   if (src && src.includes('{width}')) {
                       src = src.replace('{width}', targetWidth);
                   } else if (!src) {
                       src = newImg.src;
                   }
                   
                   if (src) {
                       preloadPromise = new Promise(resolve => {
                           // Create a detached image to force download into cache
                           const tempImg = new Image();
                           
                           tempImg.onload = () => {
                               // Once loaded, apply to the real element
                               newImg.src = src;
                               newImg.srcset = src; // Override srcset to ensure it uses the cached version
                               newImg.classList.remove('lazyload');
                               newImg.classList.add('lazyloaded');
                               newImg.style.opacity = '1';
                               newImg.style.transition = 'none';
                               newImg.setAttribute('data-src', src);
                               resolve();
                           };
                           
                           tempImg.onerror = () => {
                               console.log('Image preload failed, swapping anyway');
                               resolve(); 
                           };
                           
                           tempImg.src = src;
                       });
                   }
               }
               
               // Timeout to prevent hanging if image load fails
               const timeoutPromise = new Promise(resolve => setTimeout(resolve, 3000));

               Promise.race([preloadPromise, timeoutPromise]).then(() => {
                  // Finish loader to 80% (which appears as full loading of our smaller bar)
                  loader.style.transition = 'width 0.2s ease-out';
                  loader.style.width = '80%';
                  
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
               });
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