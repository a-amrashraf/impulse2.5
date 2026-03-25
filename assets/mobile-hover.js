(function() {
  var MOBILE_QUERY = '(max-width: 768px)';
  var DEBUG_KEY = 'impulseDebug';

  function getDebugFromQuery() {
    try {
      if (!window.location || !window.location.search) return null;
      var params = new URLSearchParams(window.location.search);
      var value = params.get('impulseDebug');
      if (value === null) return null;
      return value === '1' || value === 'true' || value === 'on';
    } catch (e) {
      return null;
    }
  }

  function getDebugFromStorage() {
    try {
      return window.localStorage && window.localStorage.getItem(DEBUG_KEY) === '1';
    } catch (e) {
      return false;
    }
  }

  var DEBUG_ENABLED = (function() {
    var q = getDebugFromQuery();
    if (q !== null) {
      try {
        if (window.localStorage) window.localStorage.setItem(DEBUG_KEY, q ? '1' : '0');
      } catch (e) {
      }
      return q;
    }
    return getDebugFromStorage();
  })();

  function setDebugEnabled(enabled) {
    DEBUG_ENABLED = !!enabled;
    try {
      if (window.localStorage) window.localStorage.setItem(DEBUG_KEY, DEBUG_ENABLED ? '1' : '0');
    } catch (e) {
    }
  }

  function debugLog() {
    if (!DEBUG_ENABLED) return;
    var args = Array.prototype.slice.call(arguments);
    args.unshift('[impulse-mobile-debug]');
    try {
      console.log.apply(console, args);
    } catch (e) {
    }
  }

  function getDebugBadge(slider) {
    var media = slider ? slider.closest('.impulse-mobile-media') : null;
    if (!media) return null;
    var badge = media.querySelector('.impulse-mobile-debug-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'impulse-mobile-debug-badge';
      badge.style.position = 'absolute';
      badge.style.left = '8px';
      badge.style.bottom = '8px';
      badge.style.zIndex = '999';
      badge.style.background = 'rgba(0,0,0,0.75)';
      badge.style.color = '#fff';
      badge.style.padding = '4px 6px';
      badge.style.fontSize = '11px';
      badge.style.lineHeight = '1.2';
      badge.style.borderRadius = '4px';
      badge.style.pointerEvents = 'none';
      media.appendChild(badge);
    }
    return badge;
  }

  function updateDebugBadge(slider, eventName, extra) {
    var media;
    var secondImg;
    var badge;
    var idx;
    var width;
    var src;
    var nw;
    var slidesCount;
    var dotsCount;
    var mobile;
    var dotsWrap;
    var dotsDisplay;
    if (!slider) return;
    media = slider.closest('.impulse-mobile-media');
    if (!media) return;

    if (!DEBUG_ENABLED) {
      badge = media.querySelector('.impulse-mobile-debug-badge');
      if (badge && badge.parentNode) badge.parentNode.removeChild(badge);
      return;
    }

    badge = getDebugBadge(slider);
    if (!badge) return;

    secondImg = slider.querySelector('.impulse-mobile-slide--second img');
    idx = slider.dataset.impulseIndex || '0';
    width = getViewportWidth(slider);
    src = secondImg ? (secondImg.currentSrc || secondImg.getAttribute('src') || 'none') : 'none';
    nw = secondImg ? secondImg.naturalWidth : 0;
    slidesCount = getSlides(slider).length;
    dotsCount = getDots(slider).length;
    mobile = isMobileMode() ? '1' : '0';
    dotsWrap = getDotsScope(slider);
    dotsWrap = dotsWrap ? dotsWrap.querySelector('.impulse-mobile-dots') : null;
    dotsDisplay = dotsWrap ? ((window.getComputedStyle && window.getComputedStyle(dotsWrap).display) || dotsWrap.style.display || 'none') : 'missing';

    badge.textContent = 'evt=' + eventName + ' mm=' + mobile + ' idx=' + idx + ' s=' + slidesCount + ' d=' + dotsCount + ' dd=' + dotsDisplay + ' w=' + width + ' nw=' + nw + (extra ? ' ' + extra : '');
    badge.setAttribute('title', src);
  }

  window.IMPULSE_DEBUG = window.IMPULSE_DEBUG || {
    enable: function() { setDebugEnabled(true); },
    disable: function() { setDebugEnabled(false); },
    isEnabled: function() { return !!DEBUG_ENABLED; },
    key: DEBUG_KEY
  };

  function isMobileMode() {
    return window.matchMedia(MOBILE_QUERY).matches || window.matchMedia('(hover: none) and (pointer: coarse)').matches;
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

  function getDotsScope(slider) {
    if (!slider) return null;
    return slider.closest('.grid-product__image-mask') || slider.closest('.impulse-mobile-media');
  }

  function getDots(slider) {
    var scope = getDotsScope(slider);
    return scope ? scope.querySelectorAll('.impulse-mobile-dot') : [];
  }

  function ensureDots(slider, slideCount) {
    var scope = getDotsScope(slider);
    if (!scope) return null;
    if (!slideCount || slideCount < 2) return null;

    var dotsWrap = scope.querySelector('.impulse-mobile-dots');
    if (!dotsWrap) {
      dotsWrap = document.createElement('div');
      dotsWrap.className = 'impulse-mobile-dots';
      scope.appendChild(dotsWrap);
    }

    var existingDots = dotsWrap.querySelectorAll('.impulse-mobile-dot');
    if (existingDots.length >= 2) return dotsWrap;

    dotsWrap.innerHTML = '';
    for (var i = 0; i < slideCount; i++) {
      var dot = document.createElement('div');
      dot.className = 'impulse-mobile-dot' + (i === 0 ? ' active' : '');
      dotsWrap.appendChild(dot);
    }
    return dotsWrap;
  }

  function setDotsDisplay(slider, show) {
    var scope = getDotsScope(slider);
    if (!scope) return;

    var slideCount = getSlides(slider).length;
    var dotsWrap = show ? ensureDots(slider, slideCount) : scope.querySelector('.impulse-mobile-dots');
    if (!dotsWrap) return;

    dotsWrap.style.setProperty('display', show ? 'flex' : 'none', 'important');
    if (!show) return;

    dotsWrap.style.setProperty('position', 'relative');
    dotsWrap.style.setProperty('justify-content', 'center');
    dotsWrap.style.setProperty('align-items', 'center');
    dotsWrap.style.setProperty('gap', '8px');
    dotsWrap.style.setProperty('z-index', '35', 'important');
    dotsWrap.style.setProperty('pointer-events', 'none');
    dotsWrap.style.setProperty('padding', '6px 10px');
    dotsWrap.style.setProperty('width', 'fit-content');
    dotsWrap.style.setProperty('margin', '10px auto 2px');
    dotsWrap.style.setProperty('background', 'rgba(0,0,0,0.45)', 'important');
    dotsWrap.style.setProperty('border-radius', '999px');

    var dots = dotsWrap.querySelectorAll('.impulse-mobile-dot');
    for (var i = 0; i < dots.length; i++) {
      var dot = dots[i];
      dot.style.setProperty('display', 'block', 'important');
      dot.style.setProperty('width', '10px');
      dot.style.setProperty('height', '10px');
      dot.style.setProperty('border-radius', '50%');
      dot.style.setProperty('border', '1px solid rgba(0,0,0,0.9)');
    }
  }

  function ensureSecondSlideImage(slider) {
    if (!slider) return;
    var firstSlide = slider.querySelector('.impulse-mobile-slide--first');
    var secondSlide = slider.querySelector('.impulse-mobile-slide--second');
    if (!firstSlide || !secondSlide) return;

    var firstImg = firstSlide.querySelector('img');
    var secondImg = secondSlide.querySelector('img');
    if (!firstImg || !secondImg) {
      debugLog('ensureSecondSlideImage: missing img node');
      return;
    }

    var hasSrc = !!secondImg.getAttribute('src');
    var isDataUrl = hasSrc && /^data:/i.test(secondImg.getAttribute('src'));
    var secondBroken = !hasSrc || isDataUrl || (secondImg.complete && secondImg.naturalWidth === 0);
    if (!secondBroken) {
      debugLog('ensureSecondSlideImage: second image OK', secondImg.currentSrc || secondImg.getAttribute('src'), 'naturalWidth=', secondImg.naturalWidth);
      return;
    }

    var fallbackSrc = firstImg.currentSrc || firstImg.getAttribute('src');
    if (!fallbackSrc || /^data:/i.test(fallbackSrc)) {
      debugLog('ensureSecondSlideImage: no fallback src available');
      return;
    }

    secondImg.setAttribute('src', fallbackSrc);
    debugLog('ensureSecondSlideImage: applied fallback src', fallbackSrc);
    updateDebugBadge(slider, 'fallback', 'applied=1');
  }

  function forceSecondSlideVisibility(slider) {
    var secondSlide;
    var secondImg;
    if (!slider) return;

    secondSlide = slider.querySelector('.impulse-mobile-slide--second');
    if (!secondSlide) return;

    secondSlide.style.opacity = '1';
    secondSlide.style.visibility = 'visible';
    secondSlide.style.backgroundColor = 'transparent';

    secondImg = secondSlide.querySelector('img');
    if (!secondImg) return;
    secondImg.style.display = 'block';
    secondImg.style.opacity = '1';
    secondImg.style.visibility = 'visible';
  }

  function updateDots(slider, index) {
    var dots = getDots(slider);
    if (!dots.length) return;

    var safe = clamp(index, 0, dots.length - 1);
    for (var i = 0; i < dots.length; i++) {
      var isActive = i === safe;
      dots[i].classList.toggle('active', isActive);
      dots[i].style.setProperty('background', isActive ? '#000000' : '#9e9e9e', 'important');
      dots[i].style.setProperty('opacity', '1', 'important');
      dots[i].style.setProperty('box-shadow', 'none', 'important');
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
    if (target > 0) {
      ensureSecondSlideImage(slider);
      forceSecondSlideVisibility(slider);
    }
    debugLog('setIndex', { target: target, animate: !!animate, viewportWidth: viewportWidth, transform: slider.style.transform });
    updateDebugBadge(slider, 'setIndex', 't=' + target);
    updateDots(slider, target);
  }

  function styleForMobile(slider) {
    var slides = getSlides(slider);
    slider.style.display = 'flex';
    slider.style.flexWrap = 'nowrap';
    slider.style.overflow = 'hidden';
    slider.style.touchAction = 'pan-y';
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
      s.style.visibility = 'visible';
      s.style.pointerEvents = 'auto';
      s.style.backgroundColor = 'transparent';
    }

    if (slides.length > 1) {
      slides[1].style.position = 'relative';
      slides[1].style.opacity = '1';
      slides[1].style.visibility = 'visible';
      slides[1].style.pointerEvents = 'auto';
    }

    ensureDots(slider, slides.length);
    setDotsDisplay(slider, slides.length > 1);

    var current = Number(slider.dataset.impulseIndex || 0);
    if (!Number.isFinite(current)) current = 0;
    forceSecondSlideVisibility(slider);
    setIndex(slider, current, false);
    debugLog('styleForMobile', { slides: slides.length, index: current });
    updateDebugBadge(slider, 'style', 'slides=' + slides.length);
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
      s.style.visibility = '';
      s.style.pointerEvents = '';
      s.style.backgroundColor = '';
    }

    setDotsDisplay(slider, false);
    updateDebugBadge(slider, 'desktop', 'cleared=1');
  }

  function initSlider(slider) {
    if (!slider || slider.dataset.impulseInit === '1') return;
    slider.dataset.impulseInit = '1';
    slider.dataset.impulseIndex = slider.dataset.impulseIndex || '0';

    var media = slider.closest('.impulse-mobile-media') || slider;
    var card = slider.closest('.grid-product.has-impulse-slider, .product-card.has-impulse-slider');
    var gestureTarget = card || media;
    var usePointerEvents = !!window.PointerEvent;
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
      slider.dataset.impulseMoved = '0';
      slider.dataset.impulseDragging = '1';
      slider.style.transition = 'none';

      if (window.getSelection) {
        var sel = window.getSelection();
        if (sel && sel.removeAllRanges) sel.removeAllRanges();
      }

      debugLog('drag start', { x: clientX, y: clientY, index: slider.dataset.impulseIndex || '0' });
      updateDebugBadge(slider, 'start', 'x=' + Math.round(clientX));
    }

    function isWithinMedia(clientX, clientY) {
      if (!media || !media.getBoundingClientRect) return false;
      var rect = media.getBoundingClientRect();
      return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    }

    function move(clientX, clientY) {
      if (!drag.active || !isMobileMode()) return false;

      var dx = clientX - drag.startX;
      var dy = clientY - drag.startY;

      if (!drag.axisLocked) {
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
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
      updateDebugBadge(slider, 'move', 'dx=' + Math.round(dx));
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
      var threshold = Math.max(12, width * 0.08);
      if (dx < -threshold) current += 1;
      if (dx > threshold) current -= 1;

      setIndex(slider, current, true);
      debugLog('drag end', { dx: dx, threshold: threshold, nextIndex: current });
      updateDebugBadge(slider, 'end', 'dx=' + Math.round(dx));
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
      debugLog('drag cancel', { index: current });
      updateDebugBadge(slider, 'cancel', 'idx=' + current);
      drag.axisLocked = false;
      drag.axis = '';
      drag.moved = false;
    }

    if (usePointerEvents) {
      gestureTarget.addEventListener('pointerdown', function(e) {
        if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
        if (!isMobileMode()) return;
        if (!isWithinMedia(e.clientX, e.clientY)) return;
        if (gestureTarget.setPointerCapture) {
          try {
            gestureTarget.setPointerCapture(e.pointerId);
          } catch (err) {
          }
        }
        start(e.clientX, e.clientY);
      }, true);

      gestureTarget.addEventListener('pointermove', function(e) {
        if (!drag.active) return;
        if (move(e.clientX, e.clientY)) {
          e.preventDefault();
        }
      }, { passive: false });

      gestureTarget.addEventListener('pointerup', function(e) {
        if (!drag.active) return;
        end(e.clientX);
      }, true);

      gestureTarget.addEventListener('pointercancel', function() {
        cancel();
      }, true);
    } else {
      gestureTarget.addEventListener('touchstart', function(e) {
        if (!isMobileMode()) return;
        if (!e.touches || !e.touches.length) return;
        if (!isWithinMedia(e.touches[0].clientX, e.touches[0].clientY)) return;
        start(e.touches[0].clientX, e.touches[0].clientY);
      }, { passive: false });

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
    }

    gestureTarget.addEventListener('click', function(e) {
      if (slider.dataset.impulseMoved === '1') {
        e.preventDefault();
        e.stopPropagation();
        slider.dataset.impulseMoved = '0';
        debugLog('click suppressed after drag');
        updateDebugBadge(slider, 'click', 'suppressed=1');
      }
    }, true);

    gestureTarget.addEventListener('selectstart', function(e) {
      if (drag.active) {
        e.preventDefault();
      }
    }, true);

    if (card) {
      card.addEventListener('selectstart', function(e) {
        if (drag.active) {
          e.preventDefault();
        }
      }, true);
    }
  }

  function applyMode() {
    var sliders = document.querySelectorAll('.impulse-mobile-media .impulse-mobile-slider');
    var mobile = isMobileMode();
    debugLog('applyMode', { sliders: sliders.length, mobile: mobile });

    for (var i = 0; i < sliders.length; i++) {
      var slider = sliders[i];
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

  debugLog('debug mode', DEBUG_ENABLED ? 'enabled' : 'disabled');

  var observer = new MutationObserver(function() {
    scheduleApply();
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
