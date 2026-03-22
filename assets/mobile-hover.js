
/* Mobile Hover replaced with Carousel dot logic */
window.updateProductDots = function(slider) {
    var dots = slider.parentElement.querySelector('.product-slider-dots');
    if (!dots) return;
    var dotElements = dots.querySelectorAll('.product-slider-dot');
    if (dotElements.length < 2) return;
    
    var scrollLeft = slider.scrollLeft;
    var width = slider.offsetWidth;
    var index = Math.round(scrollLeft / width);
    
    for (var i = 0; i < dotElements.length; i++) {
        if (i === index) {
            dotElements[i].classList.add('active');
        } else {
            dotElements[i].classList.remove('active');
        }
    }
};
console.log('Mobile hover logic disabled. Product slider logic active.');

