document.addEventListener('DOMContentLoaded', function() {
  initSiblingSwatches();
});

function initSiblingSwatches() {
  const swatches = document.querySelectorAll('.sibling-swatch:not(.init-done)');

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
             // --- AGGRESSIVE CLEANUP: Remove PBIOH elements before injection ---
             newCard.querySelectorAll('.pbioh-hidden, .pbioh-second, [class*="pbioh"], .lazyload.pbioh-hidden').forEach(el => el.remove());

             // Pre-process images to avoid lazyload fade-in
             const images = newCard.querySelectorAll('img');
             const cardWidth = card.offsetWidth || 540;
             let bestWidth = '540';
             if (cardWidth > 540) bestWidth = '720';
             if (cardWidth > 720) bestWidth = '900';
             if (cardWidth > 900) bestWidth = '1080';

             images.forEach(img => {
                // Determine source
                let srcTemplate = img.getAttribute('data-src');
                if (srcTemplate) {
                   const finalSrc = srcTemplate.replace('{width}', bestWidth);
                   img.setAttribute('src', finalSrc);
                   img.classList.remove('lazyload');
                   img.classList.add('lazyloaded');
                   img.style.opacity = '1';
                   img.style.transition = 'none';
                }
             });

             // 1. Replace the innerHTML of the card
             card.innerHTML = newCard.innerHTML;
             
             // 2. Update the card wrapper attributes (crucial specifically for data-product-id)
             if (newCard.className) card.className = newCard.className;
             if (newCard.getAttribute('data-product-id')) card.setAttribute('data-product-id', newCard.getAttribute('data-product-id'));
             if (newCard.getAttribute('data-product-handle')) card.setAttribute('data-product-handle', newCard.getAttribute('data-product-handle'));
             
             // 3. Re-initialize swatches
             initSiblingSwatches();
             
             // 4. Important: Trigger lazysizes check if available
             if (window.lazySizes) {
               window.lazySizes.loader.checkElems();
             }
          }
          
          // Cleanup loading state
          card.classList.remove('sibling-loading');
          card.style.opacity = '1';
          card.style.pointerEvents = 'auto';
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
