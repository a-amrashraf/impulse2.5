(function() {
  var MOBILE_QUERY = '(max-width: 768px)';

  function isMobileMode() {
    return window.matchMedia(MOBILE_QUERY).matches || window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function wrapIndex(n, length) {
    if (!length) return 0;
    return ((n % length) + length) % length;
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

  function getSecondImage(slider) {
    if (!slider) return null;
    return slider.querySelector('.impulse-mobile-slide--second img');
  }

  function isSecondImageReady(secondImg) {
    if (!secondImg) return false;
    var src = secondImg.currentSrc || secondImg.getAttribute('src') || '';
    if (!src || /^data:/i.test(src)) return false;
    return !!(secondImg.complete && secondImg.naturalWidth > 0);
  }

  function prioritizeSecondImage(secondImg) {
    if (!secondImg) return;
    secondImg.setAttribute('loading', 'eager');
    secondImg.setAttribute('decoding', 'async');
    secondImg.setAttribute('fetchpriority', 'high');
  }

  function prepareSecondImage(slider) {
    ensureSecondSlideImage(slider);
    var secondImg = getSecondImage(slider);
    if (!secondImg) return;
    prioritizeSecondImage(secondImg);
    if (typeof secondImg.decode === 'function' && !isSecondImageReady(secondImg)) {
      secondImg.decode().catch(function() {});
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
      return;
    }

    var hasSrc = !!secondImg.getAttribute('src');
    var isDataUrl = hasSrc && /^data:/i.test(secondImg.getAttribute('src'));
    var secondBroken = !hasSrc || isDataUrl || (secondImg.complete && secondImg.naturalWidth === 0);
    if (!secondBroken) {
      return;
    }

    var fallbackSrc = firstImg.currentSrc || firstImg.getAttribute('src');
    if (!fallbackSrc || /^data:/i.test(fallbackSrc)) {
      return;
    }

    secondImg.setAttribute('src', fallbackSrc);
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

  function setIndex(slider, index, animate) {
    if (!slider) return;
    var slides = getSlides(slider);
    if (!slides.length) return;

    var target = wrapIndex(index, slides.length);
    slider.dataset.impulseIndex = String(target);
    var duration = '0s';

    for (var i = 0; i < slides.length; i++) {
      var isFirst = i === 0;
      var isActive = i === target;
      slides[i].style.setProperty('position', isFirst ? 'relative' : 'absolute', 'important');
      if (!isFirst) {
        slides[i].style.setProperty('top', '0', 'important');
        slides[i].style.setProperty('left', '0', 'important');
        slides[i].style.setProperty('right', '0', 'important');
        slides[i].style.setProperty('bottom', '0', 'important');
      }
      slides[i].style.setProperty('transition', 'opacity ' + duration + ' ease');
      slides[i].style.setProperty('opacity', isActive ? '1' : '0', 'important');
      slides[i].style.setProperty('visibility', (isActive || isFirst) ? 'visible' : 'hidden', 'important');
      slides[i].style.setProperty('pointer-events', isActive ? 'auto' : 'none', 'important');
      slides[i].style.setProperty('z-index', isActive ? '2' : '1', 'important');
    }

    if (target > 0) {
      prepareSecondImage(slider);
      forceSecondSlideVisibility(slider);
    }
  }

  function styleForMobile(slider) {
    var slides = getSlides(slider);
    slider.style.display = 'block';
    slider.style.flexWrap = '';
    slider.style.overflow = 'hidden';
    slider.style.touchAction = 'pan-y';
    slider.style.willChange = 'auto';

    for (var i = 0; i < slides.length; i++) {
      var s = slides[i];
      s.style.setProperty('position', i === 0 ? 'relative' : 'absolute', 'important');
      s.style.setProperty('top', i > 0 ? '0' : 'auto', 'important');
      s.style.setProperty('left', i > 0 ? '0' : 'auto', 'important');
      s.style.setProperty('right', i > 0 ? '0' : 'auto', 'important');
      s.style.setProperty('bottom', i > 0 ? '0' : 'auto', 'important');
      s.style.flex = '';
      s.style.minWidth = '';
      s.style.maxWidth = '';
      s.style.width = '100%';
      s.style.setProperty('opacity', '1', 'important');
      s.style.setProperty('visibility', 'visible', 'important');
      s.style.setProperty('pointer-events', 'auto', 'important');
      s.style.backgroundColor = 'transparent';
      s.style.transition = '';
      s.style.setProperty('z-index', i === 0 ? '2' : '1', 'important');
    }

    slider.style.transform = '';
    slider.style.transition = '';

    prepareSecondImage(slider);

    var current = Number(slider.dataset.impulseIndex || 0);
    if (!Number.isFinite(current)) current = 0;
    forceSecondSlideVisibility(slider);
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
      s.style.maxWidth = '';
      s.style.width = '';
      s.style.opacity = '';
      s.style.visibility = '';
      s.style.pointerEvents = '';
      s.style.backgroundColor = '';
      s.style.zIndex = '';
      s.style.transition = '';
    }

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
      if (getSlides(slider).length < 2) return;
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

    }

    function isWithinMedia(clientX, clientY) {
      if (!media || !media.getBoundingClientRect) return false;
      var rect = media.getBoundingClientRect();
      return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    }

    function move(clientX, clientY) {
      if (!drag.active || !isMobileMode()) return false;
      if (getSlides(slider).length < 2) return false;

      var dx = clientX - drag.startX;
      var dy = clientY - drag.startY;

      if (!drag.axisLocked) {
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          drag.axisLocked = true;
          drag.axis = Math.abs(dx) > Math.abs(dy) * 1.15 ? 'x' : 'y';
        } else {
          return false;
        }
      }

      if (drag.axis !== 'x') return false;

      drag.moved = true;
      drag.dx = dx;

      var current = Number(slider.dataset.impulseIndex || 0);
      if (!Number.isFinite(current)) current = 0;

      if (current === 0 && dx < 0) {
        var secondImg = getSecondImage(slider);
        if (secondImg && !isSecondImageReady(secondImg)) {
          prepareSecondImage(slider);
          return false;
        }
      }
      return true;
    }

    function end(clientX) {
      if (!drag.active || !isMobileMode()) return;
      if (getSlides(slider).length < 2) {
        drag.active = false;
        slider.dataset.impulseDragging = '0';
        setIndex(slider, 0, false);
        return;
      }
      drag.active = false;
      slider.dataset.impulseDragging = '0';

      var dx = drag.moved ? drag.dx : (clientX - drag.startX);
      var current = Number(slider.dataset.impulseIndex || 0);
      if (!Number.isFinite(current)) current = 0;
      var slides = getSlides(slider);
      var slideCount = slides.length;
      if (slideCount < 2) {
        setIndex(slider, 0, false);
        drag.axisLocked = false;
        drag.axis = '';
        drag.moved = false;
        return;
      }

      var width = getViewportWidth(slider);
      var threshold = Math.max(12, width * 0.08);
      var target = current;
      if (dx < -threshold) target = current + 1;
      if (dx > threshold) target = current - 1;
      target = wrapIndex(target, slideCount);

      if (target > 0) {
        var secondImg = getSecondImage(slider);
        if (secondImg && !isSecondImageReady(secondImg)) {
          prepareSecondImage(slider);
          target = current;
        }
      }

      setIndex(slider, target, false);
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
      setIndex(slider, current, false);
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

    function isInteractiveTapTarget(target) {
      if (!target || !target.closest) return false;
      return !!target.closest('a, button, input, select, textarea, label, summary, [role="button"], .grid-product__quick-add, .color-swatch, .sibling-swatch');
    }

    function navigateToProductFromCard() {
      if (!card) return;
      var productLink = card.querySelector('a.grid-product__link[href]');
      if (!productLink) return;
      var href = productLink.getAttribute('href');
      if (!href) return;
      window.location.href = href;
    }

    gestureTarget.addEventListener('click', function(e) {
      if (slider.dataset.impulseMoved === '1') {
        e.preventDefault();
        e.stopPropagation();
        slider.dataset.impulseMoved = '0';
        return;
      }

      if (!isMobileMode()) return;
      if (isInteractiveTapTarget(e.target)) return;

      var clientX = typeof e.clientX === 'number' ? e.clientX : drag.startX;
      var clientY = typeof e.clientY === 'number' ? e.clientY : drag.startY;
      if (!isWithinMedia(clientX, clientY)) return;

      if (card) {
        e.preventDefault();
        navigateToProductFromCard();
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
