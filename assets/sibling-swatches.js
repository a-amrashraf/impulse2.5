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
        
        const fetchUrl = this.dataset.siblingUrl + '?view=card&t=' + new Date().getTime();
        
        card.classList.add('loading');
        card.style.opacity = '0.5';

        fetch(fetchUrl)
          .then(response => response.text())
          .then(html => {
            const div = document.createElement('div');
            div.innerHTML = html;
            const newCard = div.querySelector('.grid-product');

            if(newCard) {
              // Add fade-in animation class
              newCard.classList.add('grid-product--fading-in');
              
              card.replaceWith(newCard);
              // Re-init swatches for the new card
              initSiblingSwatches(); 
              
              // Re-init Impulse theme specific features
              if (window.theme) {
                 if(theme.initQuickShop) theme.initQuickShop();
                 if(theme.initQuickAdd) theme.initQuickAdd();
                 
                 // Re-init currency converter if it exists
                 if(theme.currencySwitcher) theme.currencySwitcher.init();
                 
                 // Refresh Animate On Scroll (AOS) to show hidden elements
                 if (window.AOS) {
                    // refreshHard is more thorough for new DOM elements
                    AOS.refreshHard(); 
                 }
                 
                 // Trigger resize for lazyload images (lazysizes)
                 window.dispatchEvent(new Event('resize'));
              }
            }
          })
          .catch(err => {
            console.error('Error loading sibling:', err);
            card.style.opacity = '1';
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