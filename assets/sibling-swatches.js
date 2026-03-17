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
        
        // Inject keyframes globally if not present
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
                width: 40px;
                height: 40px;
                background-color: rgba(255, 255, 255, 0.5);
                border: 4px solid rgba(0,0,0,0.1);
                border-top: 4px solid #000;
                border-radius: 50%;
                animation: sibling-spin 0.6s linear infinite;
                z-index: 20;
                transform: translate(-50%, -50%);
                box-shadow: 0 0 5px rgba(0,0,0,0.2);
             }
           `;
           document.head.appendChild(style);
        }

        // Create or find spinner
        let spinner = card.querySelector('.grid-product__spinner');
        if (!spinner) {
           spinner = document.createElement('div');
           spinner.className = 'grid-product__spinner';
           
           // Find image wrapper specifically to center over image, not whole card (which includes swatches)
           const imageWrapper = card.querySelector('.grid__item-image-wrapper') || card.querySelector('.grid-product__image-mask') || card;
           imageWrapper.appendChild(spinner);
           
           if(getComputedStyle(imageWrapper).position === 'static') {
              imageWrapper.style.position = 'relative'; 
           }
        }
        
        // Start Loading State
        card.classList.add('loading');
        card.style.opacity = '0.6';
        card.style.pointerEvents = 'none';
        card.style.transition = 'opacity 0.2s';
        
        // Remove old loader bar if it exists
        const oldBar = card.querySelector('.grid-product__loading-bar');
        if(oldBar) oldBar.remove();

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
                  
                  // SWAP NOW
                  card.replaceWith(newCard);
                  newCard.classList.remove('loading');
                  newCard.style.opacity = '1';
                  newCard.style.pointerEvents = 'auto';
                  
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
               });
            }
          })
          .catch(err => {
            console.error('Error loading sibling:', err);
            card.classList.remove('loading');
            card.style.opacity = '1';
            card.style.pointerEvents = 'auto';
            if(spinner) spinner.remove();
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