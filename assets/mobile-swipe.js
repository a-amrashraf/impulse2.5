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

  function getDotsScope(slider) {
    if (!slider) return null;
    return slider.closest('.grid-product__image-mask') || slider.closest('.impulse-mobile-media');
  }

  function getDots(slider) {
    var scope = getDotsScope(slider);
    return scope ? scope.querySelectorAll('.impulse-mobile-dot') : [];
  }

  function isSecondImageSwipeDisabled(slider) {
    if (!slider) return false;
    var recommendations = slider.closest('product-recommendations');
    return !!(recommendations && recommendations.getAttribute('data-disable-second-image-swipe') === 'true');
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

    dotsWrap.style.setProperty('position', 'absolute');
    dotsWrap.style.setProperty('left', '50%');
    dotsWrap.style.setProperty('bottom', '8px');
    dotsWrap.style.setProperty('transform', 'translateX(-50%)');
    dotsWrap.style.setProperty('justify-content', 'center');
    dotsWrap.style.setProperty('align-items', 'center');
    dotsWrap.style.setProperty('gap', '6px');
    dotsWrap.style.setProperty('z-index', '5', 'important');
    dotsWrap.style.setProperty('pointer-events', 'none');
    dotsWrap.style.setProperty('padding', '0');
    dotsWrap.style.setProperty('width', 'fit-content');
    dotsWrap.style.setProperty('margin', '0');

    // Handle circular background styling based on setting
    var showBackground = dotsWrap.getAttribute('data-dots-background') === 'true';
    if (showBackground) {
      dotsWrap.classList.add('with-background');
      dotsWrap.style.setProperty('background', 'rgba(217, 217, 217, 0.45)', 'important');
      dotsWrap.style.setProperty('border-radius', '999px');
      dotsWrap.style.setProperty('padding', '6px 10px');
    } else {
      dotsWrap.classList.remove('with-background');
      dotsWrap.style.setProperty('background', 'transparent', 'important');
      dotsWrap.style.setProperty('border-radius', '0');
    }

    var dots = dotsWrap.querySelectorAll('.impulse-mobile-dot');
    for (var i = 0; i < dots.length; i++) {
      var dot = dots[i];
      dot.style.setProperty('display', 'block', 'important');
      dot.style.setProperty('width', '6px');
      dot.style.setProperty('height', '6px');
      dot.style.setProperty('border-radius', '50%');
      dot.style.setProperty('border', '0');
    }
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

  function updateDots(slider, index) {
    var dots = getDots(slider);
    if (!dots.length) return;

    var safe = clamp(index, 0, dots.length - 1);
    for (var i = 0; i < dots.length; i++) {
      var isActive = i === safe;
      dots[i].classList.toggle('active', isActive);
      dots[i].style.setProperty('background', isActive ? '#000000' : '#dedada', 'important');
      dots[i].style.setProperty('opacity', '1', 'important');
      dots[i].style.setProperty('box-shadow', 'none', 'important');
    }
  }

  function setIndex(slider, index, animate) {
    if (!slider) return;
    var slides = getSlides(slider);
    if (!slides.length) return;

    var target = wrapIndex(index, slides.length);
    if (isSecondImageSwipeDisabled(slider)) {
      target = 0;
    }
    slider.dataset.impulseIndex = String(target);
    var duration = '0s';

    for (var i = 0; i < slides.length; i++) {
      var isFirst = i === 0;
      var isActive = i === target;
      slides[i].style.setProperty('position', isFirst ? 'relative' : 'absolute', 'important');
      if (!isFirst) {
        slides[i].style.setProperty('top', '0', 'important');
        slides[i].style.setProperty('left', '0', 'important');
    updateDots(slider, target);
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
    var swipeDisabled = isSecondImageSwipeDisabled(slider);
    slider.style.display = 'block';
    slider.style.flexWrap = '';
    slider.style.overflow = 'hidden';
    slider.style.touchAction = swipeDisabled ? 'auto' : 'pan-y';
    slider.style.willChange = 'auto';

    for (var i = 0; i < slides.length; i++) {
      var s = slides[i];
      s.style.setProperty('position', i === 0 ? 'relative' : 'absolute', 'important');
      s.style.setProperty('top', i > 0 ? '0' : 'auto', 'important');
      s.style.setProperty('left', i > 0 ? '0' : 'auto', 'important');
      s.style.setProperty('right', i > 0 ? '0' : 'auto', 'important');
      s.style.setProperty('bottom', i > 0 ? '0' : 'auto', 'important');
      if (!swipeDisabled) {
        ensureDots(slider, slides.length);
      }
      var dotsScope = getDotsScope(slider);
      var dotsWrap = dotsScope ? dotsScope.querySelector('.impulse-mobile-dots') : null;
      var showDotsSettingEnabled = !dotsWrap || dotsWrap.getAttribute('data-show-dots') !== 'false';
      setDotsDisplay(slider, slides.length > 1 && showDotsSettingEnabled && !swipeDisabled);
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

    if (!swipeDisabled) {
      prepareSecondImage(slider);
    }

    var current = Number(slider.dataset.impulseIndex || 0);
    if (!Number.isFinite(current)) current = 0;
    if (swipeDisabled) current = 0;
    if (!swipeDisabled) {
      forceSecondSlideVisibility(slider);
    }
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
    setDotsDisplay(slider, false);
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
    var TAP_MAX_MOVEMENT = 10;
    var SWIPE_CLICK_SUPPRESS_MS = 500;
    var suppressClickUntil = 0;
    var swipeDisabled = isSecondImageSwipeDisabled(slider);
    var drag = {
      active: false,
      startX: 0,
      startY: 0,
      startTarget: null,
      dx: 0,
      moved: false,
      axisLocked: false,
      axis: ''
    };

    function start(clientX, clientY, eventTarget) {
      if (!isMobileMode()) return;
      if (swipeDisabled) return;
      drag.active = true;
      drag.startX = clientX;
      drag.startY = clientY;
      drag.startTarget = eventTarget || null;
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

    function maybeNavigateTap(clientX, clientY, dx, dy) {
      var isTap = Math.abs(dx) <= TAP_MAX_MOVEMENT && Math.abs(dy) <= TAP_MAX_MOVEMENT;
      if (!isTap) return false;
      if (!isWithinMedia(clientX, clientY)) return false;
      if (isInteractiveTapTarget(drag.startTarget)) return false;
      if (!card) return false;

      slider.dataset.impulseTapNavAt = String(Date.now());
      suppressClickUntil = Date.now() + SWIPE_CLICK_SUPPRESS_MS;
      navigateToProductFromCard();
      return true;
    }

    function isWithinMedia(clientX, clientY) {
      if (!media || !media.getBoundingClientRect) return false;
      var rect = media.getBoundingClientRect();
      return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    }

    function move(clientX, clientY) {
      if (!drag.active || !isMobileMode()) return false;
      if (swipeDisabled) return false;
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

    function end(clientX, clientY) {
      if (!drag.active || !isMobileMode()) return;

      if (!Number.isFinite(clientY)) clientY = drag.startY;
      if (!Number.isFinite(clientX)) clientX = drag.startX;
      var dx = drag.moved ? drag.dx : (clientX - drag.startX);
      var dy = clientY - drag.startY;

      if (getSlides(slider).length < 2) {
        drag.active = false;
        slider.dataset.impulseDragging = '0';
        setIndex(slider, 0, false);
        slider.dataset.impulseMoved = '0';
        maybeNavigateTap(clientX, clientY, dx, dy);
        drag.axisLocked = false;
        drag.axis = '';
        drag.moved = false;
        drag.startTarget = null;
        return;
      }
      drag.active = false;
      slider.dataset.impulseDragging = '0';

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
      var didSwipe = drag.axis === 'x' && Math.abs(dx) >= threshold;
      if (didSwipe && dx < 0) target = current + 1;
      if (didSwipe && dx > 0) target = current - 1;
      target = wrapIndex(target, slideCount);

      if (didSwipe && target > 0) {
        var secondImg = getSecondImage(slider);
        if (secondImg && !isSecondImageReady(secondImg)) {
          prepareSecondImage(slider);
          target = current;
        }
      }

      if (didSwipe) {
        setIndex(slider, target, false);
        slider.dataset.impulseMoved = '1';
        suppressClickUntil = Date.now() + SWIPE_CLICK_SUPPRESS_MS;
      } else {
        setIndex(slider, current, false);
        slider.dataset.impulseMoved = '0';
        maybeNavigateTap(clientX, clientY, dx, dy);
      }

      drag.axisLocked = false;
      drag.axis = '';
      drag.moved = false;
      drag.startTarget = null;
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
      drag.startTarget = null;
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
        start(e.clientX, e.clientY, e.target);
      }, true);

      gestureTarget.addEventListener('pointermove', function(e) {
        if (!drag.active) return;
        if (move(e.clientX, e.clientY)) {
          e.preventDefault();
        }
      }, { passive: false });

      gestureTarget.addEventListener('pointerup', function(e) {
        if (!drag.active) return;
        end(e.clientX, e.clientY);
      }, true);

      gestureTarget.addEventListener('pointercancel', function() {
        cancel();
      }, true);
    } else {
      gestureTarget.addEventListener('touchstart', function(e) {
        if (!isMobileMode()) return;
        if (!e.touches || !e.touches.length) return;
        if (!isWithinMedia(e.touches[0].clientX, e.touches[0].clientY)) return;
        start(e.touches[0].clientX, e.touches[0].clientY, e.target);
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
        var y = drag.startY;
        if (e.changedTouches && e.changedTouches.length) {
          x = e.changedTouches[0].clientX;
          y = e.changedTouches[0].clientY;
        }
        end(x, y);
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
      if (Date.now() < suppressClickUntil) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (slider.dataset.impulseMoved === '1') {
        e.preventDefault();
        e.stopPropagation();
        slider.dataset.impulseMoved = '0';
        return;
      }

      var tapNavAt = Number(slider.dataset.impulseTapNavAt || 0);
      if (tapNavAt && (Date.now() - tapNavAt) < 700) {
        e.preventDefault();
        e.stopPropagation();
        return;
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
