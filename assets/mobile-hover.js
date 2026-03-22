
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

function applyImpulseMediaMode() {
    var isMobile = window.matchMedia('(max-width: 768px)').matches;
    var mediaBlocks = document.querySelectorAll('.impulse-mobile-media');

    for (var i = 0; i < mediaBlocks.length; i++) {
        var media = mediaBlocks[i];
        var slider = media.querySelector('.impulse-mobile-slider');
        if (!slider) continue;

        var first = slider.querySelector('.impulse-mobile-slide--first');
        var second = slider.querySelector('.impulse-mobile-slide--second');
        var dots = media.querySelector('.impulse-mobile-dots');

        if (!slider.dataset.impulseSwipeBound) {
            slider.dataset.impulseSwipeBound = 'true';
            var startX = 0;
            var startY = 0;
            var startScroll = 0;
            var isDragging = false;
            var moved = false;

            slider.addEventListener('touchstart', function(e) {
                if (!e.touches || !e.touches.length) return;
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                startScroll = this.scrollLeft;
                isDragging = true;
                moved = false;
            }, { passive: true });

            slider.addEventListener('touchmove', function(e) {
                if (!isDragging || !e.touches || !e.touches.length) return;
                var dx = e.touches[0].clientX - startX;
                var dy = e.touches[0].clientY - startY;

                if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) {
                    moved = true;
                    this.scrollLeft = startScroll - dx;
                    e.preventDefault();
                }
            }, { passive: false });

            slider.addEventListener('touchend', function() {
                isDragging = false;
                var w = this.offsetWidth || 1;
                var snapIndex = Math.round(this.scrollLeft / w);
                this.scrollTo({ left: snapIndex * w, behavior: 'smooth' });
                updateImpulseMobileDots(this);
                this.dataset.impulseMoved = moved ? '1' : '0';
            }, { passive: true });

            slider.addEventListener('click', function(e) {
                if (this.dataset.impulseMoved === '1') {
                    e.preventDefault();
                    e.stopPropagation();
                    this.dataset.impulseMoved = '0';
                }
            }, true);
        }

        if (isMobile) {
            slider.style.display = 'flex';
            slider.style.flexWrap = 'nowrap';
            slider.style.overflowX = 'auto';
            slider.style.scrollSnapType = 'x mandatory';
            slider.style.webkitOverflowScrolling = 'touch';
            slider.style.touchAction = 'pan-x';

            if (first) {
                first.style.position = 'relative';
                first.style.flex = '0 0 100%';
                first.style.minWidth = '100%';
                first.style.width = '100%';
                first.style.opacity = '1';
            }

            if (second) {
                second.style.position = 'relative';
                second.style.top = 'auto';
                second.style.left = 'auto';
                second.style.right = 'auto';
                second.style.bottom = 'auto';
                second.style.flex = '0 0 100%';
                second.style.minWidth = '100%';
                second.style.width = '100%';
                second.style.opacity = '1';
                second.style.pointerEvents = 'auto';
            }

            if (dots) {
                dots.style.display = second ? 'flex' : 'none';
            }

            updateImpulseMobileDots(slider);
        } else {
            slider.style.display = 'block';
            slider.style.overflow = 'hidden';
            slider.style.scrollSnapType = 'none';

            if (first) {
                first.style.position = 'relative';
                first.style.width = '100%';
                first.style.opacity = '1';
            }

            if (second) {
                second.style.position = 'absolute';
                second.style.top = '0';
                second.style.left = '0';
                second.style.right = '0';
                second.style.bottom = '0';
                second.style.width = '100%';
                second.style.opacity = '0';
                second.style.pointerEvents = 'none';
                second.style.transition = 'opacity 0.2s ease-in-out';

                var mask = media.closest('.grid-product__image-mask');
                if (mask && !mask.dataset.impulseHoverBound) {
                    mask.dataset.impulseHoverBound = 'true';
                    mask.addEventListener('mouseenter', function() {
                        var hoverSecond = this.querySelector('.impulse-mobile-slide--second');
                        if (hoverSecond) hoverSecond.style.opacity = '1';
                    });
                    mask.addEventListener('mouseleave', function() {
                        var hoverSecond = this.querySelector('.impulse-mobile-slide--second');
                        if (hoverSecond) hoverSecond.style.opacity = '0';
                    });
                }
            }

            if (dots) {
                dots.style.display = 'none';
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', applyImpulseMediaMode);
window.addEventListener('resize', applyImpulseMediaMode);

if (document.readyState === 'interactive' || document.readyState === 'complete') {
    applyImpulseMediaMode();
}

var impulseMediaObserver = new MutationObserver(function() {
    applyImpulseMediaMode();
});

if (document.body) {
    impulseMediaObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
}

