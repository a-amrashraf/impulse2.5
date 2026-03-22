
/* Mobile Product Slider Logic (Replaces Hover) */
window.updateImpulseMobileDots = function(slider) {
    if (!slider || !slider.parentElement) return;
    var dots = slider.parentElement.querySelector('.impulse-mobile-dots');
    if (!dots) return;

    var dotElements = dots.querySelectorAll('.impulse-mobile-dot');
    if (dotElements.length < 2) return;
    
    var scrollLeft = slider.scrollLeft;
    var width = slider.offsetWidth;
    var index = Math.round(scrollLeft / width);
    if (index < 0) index = 0;
    if (index > dotElements.length - 1) index = dotElements.length - 1;
    
    for (var i = 0; i < dotElements.length; i++) {
        if (i === index) {
            dotElements[i].classList.add('active');
        } else {
            dotElements[i].classList.remove('active');
        }
    }
};
console.log('Mobile hover logic disabled. Product slider logic active.');

