
/* Mobile Product Slider Logic */
function setImpulseActiveDot(slider, index) {
    if (!slider || !slider.parentElement) return;
    var dots = slider.parentElement.querySelector('.impulse-mobile-dots');
    if (!dots) return;

    var dotElements = dots.querySelectorAll('.impulse-mobile-dot');
    if (!dotElements.length) return;

    var safeIndex = index;
    if (safeIndex < 0) safeIndex = 0;
    if (safeIndex > dotElements.length - 1) safeIndex = dotElements.length - 1;

    for (var i = 0; i < dotElements.length; i++) {
        dotElements[i].classList.toggle('active', i === safeIndex);
    }
}

window.updateImpulseMobileDots = function(slider) {
    if (!slider) return;
    var index = Number(slider.dataset.impulseIndex || 0);
    if (!Number.isFinite(index)) index = 0;
    setImpulseActiveDot(slider, index);
};

function bindImpulseSwipe(slider) {
    if (!slider || slider.dataset.impulseSwipeBound) return;
    slider.dataset.impulseSwipeBound = 'true';

    var startX = 0;
    var startY = 0;
    var moved = false;

    function goTo(index, animate) {
        var slides = slider.querySelectorAll('.impulse-mobile-slide');
        var max = slides.length - 1;
        var target = index;
        if (target < 0) target = 0;
        if (target > max) target = max;

        slider.dataset.impulseIndex = String(target);
        slider.style.transition = animate ? 'transform 0.25s ease' : 'none';
        slider.style.transform = 'translate3d(' + (-target * 100) + '%,0,0)';
        setImpulseActiveDot(slider, target);
    }

    slider._impulseGoTo = goTo;

    slider.addEventListener('touchstart', function(e) {
        if (!window.matchMedia('(max-width: 768px)').matches) return;
        if (!e.touches || !e.touches.length) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        moved = false;
        slider.style.transition = 'none';
    }, { passive: true });

    slider.addEventListener('touchmove', function(e) {
        if (!window.matchMedia('(max-width: 768px)').matches) return;
        if (!e.touches || !e.touches.length) return;

        var dx = e.touches[0].clientX - startX;
        var dy = e.touches[0].clientY - startY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) {
            moved = true;
            e.preventDefault();
        }
    }, { passive: false });

    slider.addEventListener('touchend', function(e) {
        if (!window.matchMedia('(max-width: 768px)').matches) return;

        var endX = startX;
        if (e.changedTouches && e.changedTouches.length) {
            endX = e.changedTouches[0].clientX;
        }
        var dx = endX - startX;

        var current = Number(slider.dataset.impulseIndex || 0);
        if (!Number.isFinite(current)) current = 0;

        if (dx < -30) current += 1;
        if (dx > 30) current -= 1;

        if (slider._impulseGoTo) slider._impulseGoTo(current, true);
        slider.dataset.impulseMoved = moved ? '1' : '0';
    }, { passive: true });

    slider.addEventListener('click', function(e) {
        if (slider.dataset.impulseMoved === '1') {
            e.preventDefault();
            e.stopPropagation();
            slider.dataset.impulseMoved = '0';
        }
    }, true);
}

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
        var slides = slider.querySelectorAll('.impulse-mobile-slide');

        bindImpulseSwipe(slider);

        if (isMobile) {
            slider.style.display = 'flex';
            slider.style.flexWrap = 'nowrap';
            slider.style.overflow = 'hidden';
            slider.style.scrollSnapType = 'none';
            slider.style.touchAction = 'pan-y';
            slider.style.willChange = 'transform';

            for (var s = 0; s < slides.length; s++) {
                slides[s].style.position = 'relative';
                slides[s].style.top = 'auto';
                slides[s].style.left = 'auto';
                slides[s].style.right = 'auto';
                slides[s].style.bottom = 'auto';
                slides[s].style.flex = '0 0 100%';
                slides[s].style.minWidth = '100%';
                slides[s].style.width = '100%';
                slides[s].style.opacity = '1';
                slides[s].style.pointerEvents = 'auto';
            }

            var currentIndex = Number(slider.dataset.impulseIndex || 0);
            if (!Number.isFinite(currentIndex)) currentIndex = 0;
            if (slider._impulseGoTo) slider._impulseGoTo(currentIndex, false);

            if (dots) {
                dots.style.display = slides.length > 1 ? 'flex' : 'none';
            }
        } else {
            slider.style.display = 'block';
            slider.style.overflow = 'hidden';
            slider.style.transform = 'none';
            slider.style.transition = 'none';
            slider.style.willChange = 'auto';
            slider.dataset.impulseIndex = '0';

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

var impulseApplyScheduled = false;
function scheduleImpulseApply() {
    if (impulseApplyScheduled) return;
    impulseApplyScheduled = true;
    window.requestAnimationFrame(function() {
        impulseApplyScheduled = false;
        applyImpulseMediaMode();
    });
}

document.addEventListener('DOMContentLoaded', applyImpulseMediaMode);
window.addEventListener('resize', scheduleImpulseApply);

if (document.readyState === 'interactive' || document.readyState === 'complete') {
    applyImpulseMediaMode();
}

var impulseMediaObserver = new MutationObserver(function() {
    scheduleImpulseApply();
});

if (document.body) {
    impulseMediaObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
}

