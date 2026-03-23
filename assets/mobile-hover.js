(function() {
  var MOBILE_QUERY = '(max-width: 768px)';

  function isMobileMode() {
    return window.matchMedia(MOBILE_QUERY).matches;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function getViewportWidth(slider) {
    var media = slider ? slider.closest('.impulse-mobile-media') : null;
    var width = media ? media.offsetWidth : 0;
    if (!width && slider && slider.parentElement) width = slider.parentElement.offsetWidth;
    if (!width && slider) width = slider.offsetWidth;
    return width || 1;
  }

  function getSlides(slider) {
    return slider ? slider.querySelectorAll('.impulse-mobile-slide') : [];
  }

  function getDots(slider) {
    var media = slider ? slider.closest('.impulse-mobile-media') : null;
    return media ? media.querySelectorAll('.impulse-mobile-dot') : [];
  }

  function updateDots(slider, index) {
    var dots = getDots(slider);
    if (!dots.length) return;

    var safe = clamp(index, 0, dots.length - 1);
    for (var i = 0; i < dots.length; i++) {
      dots[i].classList.toggle('active', i === safe);
    }
  }

  function setIndex(slider, index, animate) {
    if (!slider) return;
    var slides = getSlides(slider);
    if (!slides.length) return;

    var target = clamp(index, 0, slides.length - 1);
    slider.dataset.impulseIndex = String(target);
    slider.style.transition = animate ? 'transform 0.25s ease' : 'none';
    var viewportWidth = getViewportWidth(slider);
    slider.style.transform = 'translate3d(' + (-target * viewportWidth) + 'px,0,0)';
    updateDots(slider, target);
  }

  function styleForMobile(slider) {
    var slides = getSlides(slider);
    slider.style.display = 'flex';
    slider.style.flexWrap = 'nowrap';
    slider.style.overflow = 'hidden';
    slider.style.touchAction = 'none';
    slider.style.willChange = 'transform';

    for (var i = 0; i < slides.length; i++) {
      var s = slides[i];
      s.style.position = 'relative';
      s.style.top = 'auto';
      s.style.left = 'auto';
      s.style.right = 'auto';
      s.style.bottom = 'auto';
      s.style.flex = '0 0 100%';
      s.style.minWidth = '100%';
      s.style.width = '100%';
      s.style.opacity = '1';
      s.style.pointerEvents = 'auto';
    }

    var media = slider.closest('.impulse-mobile-media');
    if (media) {
      var dotsWrap = media.querySelector('.impulse-mobile-dots');
      if (dotsWrap) {
        dotsWrap.style.display = slides.length > 1 ? 'flex' : 'none';
      }
    }

    var current = Number(slider.dataset.impulseIndex || 0);
    if (!Number.isFinite(current)) current = 0;
    setIndex(slider, current, false);
  }

  function clearMobileInlineStyles(slider) {
    var slides = getSlides(slider);

    slider.style.display = '';
    slider.style.flexWrap = '';
    slider.style.overflow = '';
    slider.style.touchAction = '';
    slider.style.willChange = '';
    slider.style.transform = '';
    slider.style.transition = '';

    for (var i = 0; i < slides.length; i++) {
      var s = slides[i];
      s.style.position = '';
      s.style.top = '';
      s.style.left = '';
      s.style.right = '';
      s.style.bottom = '';
      s.style.flex = '';
      s.style.minWidth = '';
      s.style.width = '';
      s.style.opacity = '';
      s.style.pointerEvents = '';
    }

    var media = slider.closest('.impulse-mobile-media');
    if (media) {
      var dotsWrap = media.querySelector('.impulse-mobile-dots');
      if (dotsWrap) {
        dotsWrap.style.display = 'none';
      }
    }
  }

  function initSlider(slider) {
    if (!slider || slider.dataset.impulseInit === '1') return;
    slider.dataset.impulseInit = '1';
    slider.dataset.impulseIndex = slider.dataset.impulseIndex || '0';

    var media = slider.closest('.impulse-mobile-media') || slider;
    var card = slider.closest('.grid-product.has-impulse-slider, .product-card.has-impulse-slider');
    var gestureTarget = card || media;
    var drag = {
      active: false,
      startX: 0,
      startY: 0,
      dx: 0,
      moved: false,
      axisLocked: false,
      axis: ''
    };

    function start(clientX, clientY) {
      if (!isMobileMode()) return;
      drag.active = true;
      drag.startX = clientX;
      drag.startY = clientY;
      drag.dx = 0;
      drag.moved = false;
      drag.axisLocked = false;
      drag.axis = '';
      slider.dataset.impulseDragging = '1';
      slider.style.transition = 'none';

      if (window.getSelection) {
        var sel = window.getSelection();
        if (sel && sel.removeAllRanges) sel.removeAllRanges();
      }
    }

    function move(clientX, clientY) {
      if (!drag.active || !isMobileMode()) return false;

      var dx = clientX - drag.startX;
      var dy = clientY - drag.startY;

      if (!drag.axisLocked) {
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
          drag.axisLocked = true;
          drag.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        } else {
          return false;
        }
      }

      if (drag.axis !== 'x') return false;

      drag.moved = true;
      drag.dx = dx;

      var current = Number(slider.dataset.impulseIndex || 0);
      if (!Number.isFinite(current)) current = 0;
      var width = getViewportWidth(slider);
      var baseX = -current * width;
      slider.style.transform = 'translate3d(' + (baseX + dx) + 'px,0,0)';
      return true;
    }

    function end(clientX) {
      if (!drag.active || !isMobileMode()) return;
      drag.active = false;
      slider.dataset.impulseDragging = '0';

      var dx = drag.moved ? drag.dx : (clientX - drag.startX);
      var current = Number(slider.dataset.impulseIndex || 0);
      if (!Number.isFinite(current)) current = 0;

      var width = getViewportWidth(slider);
      var threshold = Math.max(20, width * 0.12);
      if (dx < -threshold) current += 1;
      if (dx > threshold) current -= 1;

      setIndex(slider, current, true);
      slider.dataset.impulseMoved = drag.moved && drag.axis === 'x' ? '1' : '0';
      drag.axisLocked = false;
      drag.axis = '';
      drag.moved = false;
    }

    function cancel() {
      if (!drag.active) return;
      drag.active = false;
      slider.dataset.impulseDragging = '0';
      var current = Number(slider.dataset.impulseIndex || 0);
      if (!Number.isFinite(current)) current = 0;
      setIndex(slider, current, true);
      drag.axisLocked = false;
      drag.axis = '';
      drag.moved = false;
    }

    gestureTarget.addEventListener('pointerdown', function(e) {
      if (e.pointerType !== 'touch' && e.pointerType !== 'pen' && e.pointerType !== 'mouse') return;
      if (!isMobileMode()) return;
      e.preventDefault();
      start(e.clientX, e.clientY);
    }, true);

    window.addEventListener('pointermove', function(e) {
      if (!drag.active) return;
      if (move(e.clientX, e.clientY)) {
        e.preventDefault();
      }
    }, { passive: false });

    window.addEventListener('pointerup', function(e) {
      if (!drag.active) return;
      end(e.clientX);
    }, true);

    window.addEventListener('pointercancel', function() {
      cancel();
    }, true);

    gestureTarget.addEventListener('touchstart', function(e) {
      if (!isMobileMode()) return;
      if (!e.touches || !e.touches.length) return;
      start(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    gestureTarget.addEventListener('touchmove', function(e) {
      if (!isMobileMode()) return;
      if (!e.touches || !e.touches.length) return;
      if (move(e.touches[0].clientX, e.touches[0].clientY)) {
        e.preventDefault();
      }
    }, { passive: false });

    gestureTarget.addEventListener('touchend', function(e) {
      if (!drag.active) return;
      var x = drag.startX;
      if (e.changedTouches && e.changedTouches.length) x = e.changedTouches[0].clientX;
      end(x);
    }, { passive: true });

    gestureTarget.addEventListener('touchcancel', function() {
      cancel();
    }, true);

    gestureTarget.addEventListener('click', function(e) {
      if (slider.dataset.impulseMoved === '1') {
        e.preventDefault();
        e.stopPropagation();
        slider.dataset.impulseMoved = '0';
      }
    }, true);
  }

  function applyMode() {
    var sliders = document.querySelectorAll('.impulse-mobile-media .impulse-mobile-slider');
    var mobile = isMobileMode();

    for (var i = 0; i < sliders.length; i++) {
      var slider = sliders[i];
      var legacySecond = slider.querySelector('.impulse-mobile-slide--second.grid-product__secondary-image');
      if (legacySecond) legacySecond.classList.remove('grid-product__secondary-image');
      initSlider(slider);
      if (mobile) {
        if (slider.dataset.impulseDragging === '1') continue;
        styleForMobile(slider);
      } else {
        clearMobileInlineStyles(slider);
      }
    }
  }

  var applyScheduled = false;
  function scheduleApply() {
    if (applyScheduled) return;
    applyScheduled = true;
    window.requestAnimationFrame(function() {
      applyScheduled = false;
      applyMode();
    });
  }

  // Legacy compatibility for existing inline handler in markup
  window.updateImpulseMobileDots = function(slider) {
    if (!slider) return;
    var idx = Number(slider.dataset.impulseIndex || 0);
    if (!Number.isFinite(idx)) idx = 0;
    updateDots(slider, idx);
  };

  document.addEventListener('DOMContentLoaded', applyMode);
  window.addEventListener('resize', scheduleApply);

  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    applyMode();
  }

  var observer = new MutationObserver(function() {
    scheduleApply();
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
