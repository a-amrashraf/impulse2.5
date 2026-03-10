document.addEventListener('DOMContentLoaded', function() {
  function initSiblingSwatches() {
    const swatches = document.querySelectorAll('.sibling-swatch:not(.init-done)');

    swatches.forEach(swatch => {
      swatch.classList.add('init-done');
      
      swatch.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const card = this.closest('.grid-product');
        const fetchUrl = this.dataset.siblingUrl + '?view=card';
        
        card.style.opacity = '0.5';

        fetch(fetchUrl)
          .then(response => response.text())
          .then(html => {
            const div = document.createElement('div');
            div.innerHTML = html;
            const newCard = div.querySelector('.grid-product');

            if(newCard) {
              card.replaceWith(newCard);
              // Re-init swatches for the new card
              initSiblingSwatches(); 
              
              // Re-init Impulse theme specific features
              if (window.theme) {
                 if(theme.initQuickShop) theme.initQuickShop();
                 if(theme.reinitSection) theme.reinitSection(newCard.closest('[data-section-id]'));
                 // Trigger resize for lazyload images (lazysizes)
                 window.dispatchEvent(new Event('resize'));
                 
                 // Re-init Ajax Cart listeners for the new form
                 // Impulse usually attaches to 'form[action^="/cart/add"]' automatically if using theme.initQuickShop, 
                 // but sometimes needs explicit re-init if using a separate module.
                 // We can try to manually init if available or simply rely on the form classes we added.
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