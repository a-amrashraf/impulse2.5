
var IMPULSE_DEBUG = false;

var impulseDrag = {
    activeSlider: null,
    startX: 0,
    startY: 0,
    lastDx: 0,
    moved: false,
    axisLocked: false,
    axis: '',
    source: ''
};

var impulseSuppressClick = {
    slider: null,
    until: 0
};

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
    var resolvedMode = mode || (window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop');

    badge.textContent = 'mode:' + resolvedMode + ' idx:' + index + ' slides:' + slides + ' drag:' + dragging + ' evt:' + eventName;
}

function getImpulseSliderFromTarget(target) {
    if (!target || !target.closest) return null;
    var media = target.closest('.impulse-mobile-media');
    if (media) {
        return media.querySelector('.impulse-mobile-slider');
    }

    // Fallback: card overlay links can be siblings that cover the media area.
    var card = target.closest('.grid-product.has-impulse-slider, .product-card.has-impulse-slider');
    if (!card) return null;
    return card.querySelector('.impulse-mobile-slider');
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

function goToImpulseSlide(slider, index, animate) {
    if (!slider) return;
    var slides = slider.querySelectorAll('.impulse-mobile-slide');
    var max = slides.length - 1;
    if (max < 0) return;

    var target = index;
    if (target < 0) target = 0;
    if (target > max) target = max;

    slider.dataset.impulseIndex = String(target);
    slider.style.transition = animate ? 'transform 0.25s ease' : 'none';
    slider.style.transform = 'translate3d(' + (-target * 100) + '%,0,0)';
    setImpulseActiveDot(slider, target);
}

window.updateImpulseMobileDots = function(slider) {
    if (!slider) return;
    var index = Number(slider.dataset.impulseIndex || 0);
    if (!Number.isFinite(index)) index = 0;
    setImpulseActiveDot(slider, index);
};

function beginImpulseDrag(slider, x, y, source) {
    if (!slider) return;
    impulseDrag.activeSlider = slider;
    impulseDrag.startX = x;
    impulseDrag.startY = y;
    impulseDrag.lastDx = 0;
    impulseDrag.moved = false;
    impulseDrag.axisLocked = false;
    impulseDrag.axis = '';
    impulseDrag.source = source;

    slider.dataset.impulseDragging = '1';
    slider.style.transition = 'none';
    if (window.getSelection) {
        var sel = window.getSelection();
        if (sel && sel.removeAllRanges) sel.removeAllRanges();
    }
    updateImpulseDebug(slider, source + '-start', 'mobile');
}

function moveImpulseDrag(x, y) {
    var slider = impulseDrag.activeSlider;
    if (!slider) return { consume: false };

    var dx = x - impulseDrag.startX;
    var dy = y - impulseDrag.startY;

    if (!impulseDrag.axisLocked) {
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
            impulseDrag.axisLocked = true;
            impulseDrag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        } else {
            return { consume: false };
        }
    }

    if (impulseDrag.axis !== 'x') {
        return { consume: false };
    }

    impulseDrag.moved = true;
    impulseDrag.lastDx = dx;

    var currentIndex = Number(slider.dataset.impulseIndex || 0);
    if (!Number.isFinite(currentIndex)) currentIndex = 0;
    var width = slider.offsetWidth || 1;
    var baseX = -currentIndex * width;
    slider.style.transform = 'translate3d(' + (baseX + dx) + 'px,0,0)';
    updateImpulseDebug(slider, impulseDrag.source + '-move', 'mobile');
    return { consume: true };
}

function endImpulseDrag(x, source) {
    var slider = impulseDrag.activeSlider;
    if (!slider) return;

    var dx = impulseDrag.moved ? impulseDrag.lastDx : (x - impulseDrag.startX);
    var current = Number(slider.dataset.impulseIndex || 0);
    if (!Number.isFinite(current)) current = 0;

    var width = slider.offsetWidth || 1;
    var threshold = Math.max(20, width * 0.12);
    if (dx < -threshold) current += 1;
    if (dx > threshold) current -= 1;

    goToImpulseSlide(slider, current, true);
    slider.dataset.impulseDragging = '0';

    if (impulseDrag.moved && impulseDrag.axis === 'x') {
        impulseSuppressClick.slider = slider;
        impulseSuppressClick.until = Date.now() + 500;
    }

    updateImpulseDebug(slider, source + '-end', 'mobile');

    impulseDrag.activeSlider = null;
    impulseDrag.axisLocked = false;
    impulseDrag.axis = '';
    impulseDrag.moved = false;
}

function cancelImpulseDrag(source) {
    var slider = impulseDrag.activeSlider;
    if (!slider) return;

    var current = Number(slider.dataset.impulseIndex || 0);
    if (!Number.isFinite(current)) current = 0;
    goToImpulseSlide(slider, current, true);
    slider.dataset.impulseDragging = '0';
    updateImpulseDebug(slider, source + '-cancel', 'mobile');

    impulseDrag.activeSlider = null;
    impulseDrag.axisLocked = false;
    impulseDrag.axis = '';
    impulseDrag.moved = false;
}

function applyImpulseMediaMode() {
    var isMobile = window.matchMedia('(max-width: 768px)').matches;
    var mediaBlocks = document.querySelectorAll('.impulse-mobile-media');

    for (var i = 0; i < mediaBlocks.length; i++) {
        var media = mediaBlocks[i];
        if (!IMPULSE_DEBUG) {
            var oldBadge = media.querySelector('.impulse-debug-badge');
            if (oldBadge) oldBadge.remove();
        }
        var slider = media.querySelector('.impulse-mobile-slider');
        if (!slider) continue;

        var first = slider.querySelector('.impulse-mobile-slide--first');
        var second = slider.querySelector('.impulse-mobile-slide--second');
        var dots = media.querySelector('.impulse-mobile-dots');
        var slides = slider.querySelectorAll('.impulse-mobile-slide');

        if (isMobile) {
            if (slider.dataset.impulseDragging === '1') {
                continue;
            }

            slider.style.display = 'flex';
            slider.style.flexWrap = 'nowrap';
            slider.style.overflow = 'hidden';
            slider.style.scrollSnapType = 'none';
            slider.style.touchAction = 'none';
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
            goToImpulseSlide(slider, currentIndex, false);

            if (dots) {
                dots.style.display = slides.length > 1 ? '' : 'none';
            }

            updateImpulseDebug(slider, 'apply', 'mobile');
        } else {
            slider.style.display = 'block';
            slider.style.overflow = 'hidden';
            slider.style.transform = 'none';
            slider.style.transition = 'none';
            slider.style.willChange = 'auto';
            slider.dataset.impulseIndex = '0';
            slider.dataset.impulseDragging = '0';

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

                var hoverRoot = media.closest('.grid-product__content') || media.closest('.grid__item-image-wrapper') || media.closest('.grid-product__image-mask');
                if (hoverRoot && !hoverRoot.dataset.impulseHoverBound) {
                    hoverRoot.dataset.impulseHoverBound = 'true';
                    hoverRoot.addEventListener('mouseenter', function() {
                        var hoverSecond = this.querySelector('.impulse-mobile-slide--second');
                        if (hoverSecond) hoverSecond.style.opacity = '1';
                    });
                    hoverRoot.addEventListener('mouseleave', function() {
                        var hoverSecond = this.querySelector('.impulse-mobile-slide--second');
                        if (hoverSecond) hoverSecond.style.opacity = '0';
                    });
                }
            }

            if (dots) {
                dots.style.display = '';
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

document.addEventListener('pointerdown', function(e) {
    if (!window.matchMedia('(max-width: 768px)').matches) return;
    var slider = getImpulseSliderFromTarget(e.target);
    if (!slider) return;
    e.preventDefault();
    beginImpulseDrag(slider, e.clientX, e.clientY, 'pointer');
}, true);

document.addEventListener('pointermove', function(e) {
    if (!window.matchMedia('(max-width: 768px)').matches) return;
    var result = moveImpulseDrag(e.clientX, e.clientY);
    if (result.consume) {
        e.preventDefault();
    }
}, { capture: true, passive: false });

document.addEventListener('pointerup', function(e) {
    if (!window.matchMedia('(max-width: 768px)').matches) return;
    endImpulseDrag(e.clientX, 'pointer');
}, true);

document.addEventListener('pointercancel', function() {
    cancelImpulseDrag('pointer');
}, true);

document.addEventListener('touchstart', function(e) {
    if (!window.matchMedia('(max-width: 768px)').matches) return;
    if (!e.touches || !e.touches.length) return;
    var slider = getImpulseSliderFromTarget(e.target);
    if (!slider) return;
    beginImpulseDrag(slider, e.touches[0].clientX, e.touches[0].clientY, 'touch');
}, { capture: true, passive: true });

document.addEventListener('touchmove', function(e) {
    if (!window.matchMedia('(max-width: 768px)').matches) return;
    if (!e.touches || !e.touches.length) return;
    var result = moveImpulseDrag(e.touches[0].clientX, e.touches[0].clientY);
    if (result.consume) {
        e.preventDefault();
    }
}, { capture: true, passive: false });

document.addEventListener('touchend', function(e) {
    if (!window.matchMedia('(max-width: 768px)').matches) return;
    var x = impulseDrag.startX;
    if (e.changedTouches && e.changedTouches.length) {
        x = e.changedTouches[0].clientX;
    }
    endImpulseDrag(x, 'touch');
}, { capture: true, passive: true });

document.addEventListener('touchcancel', function() {
    cancelImpulseDrag('touch');
}, true);

document.addEventListener('mousedown', function(e) {
    if (!window.matchMedia('(max-width: 768px)').matches) return;
    var slider = getImpulseSliderFromTarget(e.target);
    if (!slider) return;
    e.preventDefault();
    beginImpulseDrag(slider, e.clientX, e.clientY, 'mouse');
}, true);

document.addEventListener('mousemove', function(e) {
    if (!window.matchMedia('(max-width: 768px)').matches) return;
    moveImpulseDrag(e.clientX, e.clientY);
}, true);

document.addEventListener('mouseup', function(e) {
    if (!window.matchMedia('(max-width: 768px)').matches) return;
    endImpulseDrag(e.clientX, 'mouse');
}, true);

document.addEventListener('click', function(e) {
    if (Date.now() > impulseSuppressClick.until) return;
    if (!impulseSuppressClick.slider) return;
    if (!impulseSuppressClick.slider.contains(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
}, true);

document.addEventListener('dragstart', function(e) {
    var slider = getImpulseSliderFromTarget(e.target);
    if (!slider) return;
    e.preventDefault();
}, true);

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

