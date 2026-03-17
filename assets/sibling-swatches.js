document.addEventListener('DOMContentLoaded', function() {
  
  /**
   * Initializes hover effects for all swatches within product cards.
   * Scoped to each card to prevent global selector issues.
   */
  function initSwatchHover(scope) {
     const container = scope && scope.querySelectorAll ? scope : document;
     const cards = container.querySelectorAll('.product-card:not(.hover-init-done)');
     
     cards.forEach(card => {
        card.classList.add('hover-init-done');
        
        // 1. Get Image Elements
        const imageWrapper = card.querySelector('.grid__item-image-wrapper');
        // Retrieve the actual image (try .product-image first, fallback to standard classes)
        const image = card.querySelector('.product-image') || card.querySelector('.grid-product__image') || card.querySelector('img');
        
        if (!imageWrapper || !image) return;

        // 2. Get Swatches
        const swatches = card.querySelectorAll('.swatch');
        if (swatches.length === 0) return;

        // 3. Handle Active State on Load
        // If a swatch is active (e.g. selected variant/sibling), set that image immediately.
        const activeSwatch = card.querySelector('.swatch.is-active, .swatch.active');
        if (activeSwatch && activeSwatch.dataset.image) {
             const newSrc = activeSwatch.dataset.image;
             image.src = newSrc;
             image.srcset = newSrc;
        }

        // 4. Attach Event Listeners
        swatches.forEach(swatch => {
             swatch.addEventListener('mouseenter', function() {
                 const newSrc = this.dataset.image;
                 if (newSrc) {
                     image.src = newSrc;
                     image.srcset = newSrc; 
                 }
             });
             
             swatch.addEventListener('mouseleave', function() {
                 // Restore from data-original on the wrapper
                 const originalSrc = imageWrapper.dataset.original;
                 if (originalSrc) {
                     image.src = originalSrc;
                     image.srcset = originalSrc;
                 }
             });
        });
     });
  }

  /**
   * Initializes Sibling Swatch AJAX Logic (Click to Swap)
   */
  function initSiblingSwatches() {
    const swatches = document.querySelectorAll('.sibling-swatch:not(.init-done)');

    swatches.forEach(swatch => {
      swatch.classList.add('init-done');
      
      swatch.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const card = this.closest('.product-card, .grid-product');
        if (!card || card.classList.contains('loading')) return;
        
        // Inject Spinner Styles if missing
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

        // Create Spinner
        let spinner = card.querySelector('.grid-product__spinner');
        if (!spinner) {
           spinner = document.createElement('div');
           spinner.className = 'grid-product__spinner';
           const imageWrapper = card.querySelector('.grid__item-image-wrapper') || card.querySelector('.grid-product__image-mask') || card;
           imageWrapper.appendChild(spinner);
           if(getComputedStyle(imageWrapper).position === 'static') {
              imageWrapper.style.position = 'relative'; 
           }
        }
        
        // Set Loading State
        card.classList.add('loading');
        card.style.opacity = '0.6';
        card.style.pointerEvents = 'none';
        card.style.transition = 'opacity 0.2s';
        
        const oldBar = card.querySelector('.grid-product__loading-bar');
        if(oldBar) oldBar.remove();

        // Build Fetch URL
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
            const newCard = div.querySelector('.product-card') || div.querySelector('.grid-product');

            if(newCard) {
               // --- CRITICAL FIX START ---
               // Do NOT blind-overwrite the secondary image with dataset.siblingHoverImage which might be wrong.
               // Instead, trust the server-rendered secondary image if it exists, disable lazy-load on it, and preload it.
               
               const hoverImg = newCard.querySelector('.grid-product__secondary-image img');
               let secondaryPromises = []; // To track secondary image preload

               if (hoverImg) {
                   // If server rendered a secondary image, respect it.
                   // Disable lazy load to prevent flicker/reversion
                   let hoverSrc = hoverImg.getAttribute('data-src') || hoverImg.src; // Prefer data-src (high res)
                   if (hoverSrc && hoverSrc.includes('{width}')) {
                        // Replace width if needed, or just let lazysizes handle it? 
                        // Better to force a specific size for immediate display
                        let targetWidth = (window.innerWidth >= 768) ? '720' : '540';
                        hoverSrc = hoverSrc.replace('{width}', targetWidth);
                   }
                   
                   if (hoverSrc) {
                       // Update the img tag immediately so it's ready upon insertion
                       hoverImg.src = hoverSrc;
                       hoverImg.srcset = hoverSrc;
                       hoverImg.setAttribute('data-src', hoverSrc); // Sync attributes
                       hoverImg.setAttribute('data-srcset', hoverSrc);
                       hoverImg.classList.remove('lazyload');
                       hoverImg.classList.add('lazyloaded');
                       hoverImg.style.opacity = '1';
                       hoverImg.style.transition = 'none';

                       // Preload separately
                       secondaryPromises.push(new Promise(resolve => {
                           const tempHover = new Image();
                           tempHover.onload = resolve;
                           tempHover.onerror = resolve;
                           tempHover.src = hoverSrc;
                       }));
                   }
               }
               // --- CRITICAL FIX END ---

               // Image Preloading Logic (Main Image)
               const newImg = newCard.querySelector('.product-image') || newCard.querySelector('.grid-product__image') || newCard.querySelector('img');
               let preloadPromise = Promise.resolve();
 
               if (newImg) {
                   let targetWidth = '540';
                   if (window.innerWidth >= 768) targetWidth = '720'; 
                   
                   let src = newImg.getAttribute('data-src');
                   if (src && src.includes('{width}')) {
                       src = src.replace('{width}', targetWidth);
                   } else if (!src) {
                       src = newImg.src;
                   }
                   
                   if (src) {
                       preloadPromise = new Promise(resolve => {
                           // Eagerly preload main image
                           const tempImg = new Image();
                           tempImg.onload = () => {
                               newImg.src = src;
                               newImg.srcset = src;
                               newImg.classList.remove('lazyload');
                               newImg.classList.add('lazyloaded');
                               newImg.style.opacity = '1';
                               newImg.style.transition = 'none';
                               newImg.setAttribute('data-src', src);
                               resolve();
                           };
                           tempImg.onerror = () => { resolve(); };
                           tempImg.src = src;
                       });
                   }
               }
               
               // Timeout Check
               const timeoutPromise = new Promise(resolve => setTimeout(resolve, 3000));
               
               // Wait for Main Image to load (Secondary is good-to-have but prioritized less)
               Promise.race([preloadPromise, timeoutPromise]).then(() => {
                  // Replace Card
                  card.replaceWith(newCard);
                  newCard.classList.remove('loading');
                  newCard.style.opacity = '1';
                  newCard.style.pointerEvents = 'auto';
                  
                  // Re-initialize scripts
                  initSiblingSwatches(); 
                  initSwatchHover(); // Re-run hover logic for the new card

                  // Re-trigger theme scripts if available
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

  // Initialize on Load
  initSiblingSwatches();
  initSwatchHover();
  
  // Initialize on Customizer Load
  document.addEventListener('shopify:section:load', function() {
    initSiblingSwatches();
    initSwatchHover();
  });
});