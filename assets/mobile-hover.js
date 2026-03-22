
/* Mobile Product Slider Logic */
var IMPULSE_DEBUG = true;

function ensureImpulseDebugBadge(slider) {
    if (!IMPULSE_DEBUG || !slider) return null;
    var media = slider.closest('.impulse-mobile-media');
    if (!media) return null;

    var badge = media.querySelector('.impulse-debug-badge');
    if (!badge) {
        badge = document.createElement('div');
        badge.className = 'impulse-debug-badge';
        badge.style.position = 'absolute';
        badge.style.top = '6px';
        badge.style.left = '6px';
        badge.style.zIndex = '999';
        badge.style.background = 'rgba(0,0,0,0.75)';
        badge.style.color = '#fff';
        badge.style.fontSize = '10px';
        badge.style.lineHeight = '1.3';
        badge.style.padding = '4px 6px';
        badge.style.borderRadius = '4px';
        badge.style.pointerEvents = 'none';
        badge.style.fontFamily = 'monospace';
        media.appendChild(badge);
    }
    return badge;
}

function updateImpulseDebug(slider, eventName, mode) {
    if (!IMPULSE_DEBUG || !slider) return;
    var badge = ensureImpulseDebugBadge(slider);
    if (!badge) return;

    var slides = slider.querySelectorAll('.impulse-mobile-slide').length;
    var index = Number(slider.dataset.impulseIndex || 0);
    if (!Number.isFinite(index)) index = 0;
    var dragging = slider.dataset.impulseDragging === '1' ? 'yes' : 'no';

    var resolvedMode = mode;
    if (!resolvedMode) {
        resolvedMode = window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop';
    }

    badge.textContent = 'mode:' + resolvedMode + ' idx:' + index + ' slides:' + slides + ' drag:' + dragging + ' evt:' + eventName;
}

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
    var lastDx = 0;
    var moved = false;
    var isDragging = false;
    var usingPointer = false;

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
        if (usingPointer) return;
        if (!e.touches || !e.touches.length) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        lastDx = 0;
        moved = false;
        isDragging = true;
        slider.dataset.impulseDragging = '1';
        slider.style.transition = 'none';
        updateImpulseDebug(slider, 'touchstart', 'mobile');
    }, { passive: true });

    slider.addEventListener('touchmove', function(e) {
        if (!window.matchMedia('(max-width: 768px)').matches) return;
        if (usingPointer) return;
        if (!e.touches || !e.touches.length) return;

        var dx = e.touches[0].clientX - startX;
        var dy = e.touches[0].clientY - startY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) {
            moved = true;
            lastDx = dx;
            var currentIndex = Number(slider.dataset.impulseIndex || 0);
            if (!Number.isFinite(currentIndex)) currentIndex = 0;
            var width = slider.offsetWidth || 1;
            var baseX = -currentIndex * width;
            slider.style.transform = 'translate3d(' + (baseX + dx) + 'px,0,0)';
            e.preventDefault();
            updateImpulseDebug(slider, 'touchmove', 'mobile');
        }
    }, { passive: false });

    slider.addEventListener('touchend', function(e) {
        if (!window.matchMedia('(max-width: 768px)').matches) return;
        if (usingPointer) return;
        isDragging = false;
        slider.dataset.impulseDragging = '0';

        var endX = startX;
        if (e.changedTouches && e.changedTouches.length) {
            endX = e.changedTouches[0].clientX;
        }
        var dx = moved ? lastDx : (endX - startX);

        var current = Number(slider.dataset.impulseIndex || 0);
        if (!Number.isFinite(current)) current = 0;

        var width = slider.offsetWidth || 1;
        var threshold = Math.max(20, width * 0.12);

        if (dx < -threshold) current += 1;
        if (dx > threshold) current -= 1;

        if (slider._impulseGoTo) slider._impulseGoTo(current, true);
        slider.dataset.impulseMoved = moved ? '1' : '0';
        updateImpulseDebug(slider, 'touchend', 'mobile');
    }, { passive: true });

    slider.addEventListener('touchcancel', function() {
        if (usingPointer) return;
        isDragging = false;
        slider.dataset.impulseDragging = '0';
        var current = Number(slider.dataset.impulseIndex || 0);
        if (!Number.isFinite(current)) current = 0;
        if (slider._impulseGoTo) slider._impulseGoTo(current, true);
        updateImpulseDebug(slider, 'touchcancel', 'mobile');
    }, { passive: true });

    slider.addEventListener('click', function(e) {
        if (slider.dataset.impulseMoved === '1') {
            e.preventDefault();
            e.stopPropagation();
            slider.dataset.impulseMoved = '0';
        }
    }, true);

    slider.addEventListener('pointerdown', function(e) {
        if (!window.matchMedia('(max-width: 768px)').matches) return;
        if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;

        usingPointer = true;
        startX = e.clientX;
        startY = e.clientY;
        lastDx = 0;
        moved = false;
        isDragging = true;
        slider.dataset.impulseDragging = '1';
        slider.style.transition = 'none';
        updateImpulseDebug(slider, 'pointerdown', 'mobile');
        if (slider.setPointerCapture) {
            try { slider.setPointerCapture(e.pointerId); } catch (err) {}
        }
    }, { passive: true });

    slider.addEventListener('pointermove', function(e) {
        if (!window.matchMedia('(max-width: 768px)').matches) return;
        if (!isDragging) return;
        if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;

        var dx = e.clientX - startX;
        var dy = e.clientY - startY;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 6) {
            moved = true;
            lastDx = dx;
            var currentIndex = Number(slider.dataset.impulseIndex || 0);
            if (!Number.isFinite(currentIndex)) currentIndex = 0;
            var width = slider.offsetWidth || 1;
            var baseX = -currentIndex * width;
            slider.style.transform = 'translate3d(' + (baseX + dx) + 'px,0,0)';
            e.preventDefault();
            updateImpulseDebug(slider, 'pointermove', 'mobile');
        }
    }, { passive: false });

    slider.addEventListener('pointerup', function(e) {
        if (!window.matchMedia('(max-width: 768px)').matches) return;
        if (!isDragging) return;

        isDragging = false;
        slider.dataset.impulseDragging = '0';

        var dx = moved ? lastDx : (e.clientX - startX);
        var current = Number(slider.dataset.impulseIndex || 0);
        if (!Number.isFinite(current)) current = 0;

        var width = slider.offsetWidth || 1;
        var threshold = Math.max(20, width * 0.12);
        if (dx < -threshold) current += 1;
        if (dx > threshold) current -= 1;

        if (slider._impulseGoTo) slider._impulseGoTo(current, true);
        slider.dataset.impulseMoved = moved ? '1' : '0';
        updateImpulseDebug(slider, 'pointerup', 'mobile');

        if (slider.releasePointerCapture) {
            try { slider.releasePointerCapture(e.pointerId); } catch (err) {}
        }

        window.setTimeout(function() {
            usingPointer = false;
        }, 0);
    }, { passive: true });

    slider.addEventListener('pointercancel', function(e) {
        if (!isDragging) return;
        isDragging = false;
        slider.dataset.impulseDragging = '0';

        var current = Number(slider.dataset.impulseIndex || 0);
        if (!Number.isFinite(current)) current = 0;
        if (slider._impulseGoTo) slider._impulseGoTo(current, true);
        updateImpulseDebug(slider, 'pointercancel', 'mobile');

        if (slider.releasePointerCapture) {
            try { slider.releasePointerCapture(e.pointerId); } catch (err) {}
        }

        window.setTimeout(function() {
            usingPointer = false;
        }, 0);
    }, { passive: true });
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
            if (slider.dataset.impulseDragging === '1') {
                continue;
            }
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
            updateImpulseDebug(slider, 'apply', 'mobile');

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

            updateImpulseDebug(slider, 'apply', 'desktop');
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

