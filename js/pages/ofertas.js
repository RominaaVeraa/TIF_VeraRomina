document.addEventListener('DOMContentLoaded', function() {
  initializeOffers();
  initializeCountdown();
  initializeFilters();
  initializeScrollAnimations();
  initializeBackgroundSlider();
  setupHamburgerMenuOfertas();

  const images = document.querySelectorAll('.offer-image img');
  images.forEach(function(img) {
    img.addEventListener('error', function() {
      handleImageError(this);
    });
  });

  if (typeof updateCartCount === 'function') {
    updateCartCount();
  }
});

function notify(message, type) {
  if (typeof window.showToast === 'function') {
    window.showToast(message, type || 'info');
  } else {
    console.log('[toast:' + (type || 'info') + ']', message);
  }
}

const backgroundImages = [
  'images/Notebook/notebook1.png',
  'images/Notebook/notebook2.png',
  'images/Notebook/notebook3.png',
  'images/Notebook/notebook6.png',
  'images/Notebook/notebook10.png',
  'images/Monitores/monitor1.png',
  'images/Monitores/monitor2.png',
  'images/Monitores/monitor4.png',
  'images/Monitores/monitor5.png',
  'images/Monitores/monitor7.png'
];

function initializeBackgroundSlider() {
  const slides = document.querySelectorAll('.background-slide');
  if (slides.length === 0) return;

  let currentIndex = 0;
  let nextIndex = 1;

  if (backgroundImages.length > 0) {
    slides[0].style.backgroundImage = "url('" + backgroundImages[0] + "')";
    slides[0].classList.add('active');

    if (backgroundImages.length > 1) {
      slides[1].style.backgroundImage = "url('" + backgroundImages[1] + "')";
    }
  }

  function rotateBackground() {
    slides[currentIndex].classList.remove('active');

    currentIndex = (currentIndex + 1) % 2;
    nextIndex = (currentIndex + 1) % 2;

    const imageIndex = Math.floor((Date.now() / 2000) % backgroundImages.length);
    const nextImageIndex = (imageIndex + 1) % backgroundImages.length;

    slides[currentIndex].style.backgroundImage = "url('" + backgroundImages[imageIndex] + "')";
    slides[nextIndex].style.backgroundImage = "url('" + backgroundImages[nextImageIndex] + "')";

    slides[currentIndex].classList.add('active');
  }

  setInterval(rotateBackground, 2000);
}

function initializeOffers() {
  updateOffersCount();
}

function initializeCountdown() {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 3);
  targetDate.setHours(23, 59, 59, 999);

  const countdownElements = {
    days: document.getElementById('days'),
    hours: document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds')
  };

  function updateCountdown() {
    const now = new Date().getTime();
    const distance = targetDate.getTime() - now;

    if (distance > 0) {
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (countdownElements.days) countdownElements.days.textContent = String(days).padStart(2, '0');
      if (countdownElements.hours) countdownElements.hours.textContent = String(hours).padStart(2, '0');
      if (countdownElements.minutes) countdownElements.minutes.textContent = String(minutes).padStart(2, '0');
      if (countdownElements.seconds) countdownElements.seconds.textContent = String(seconds).padStart(2, '0');
    } else {
      targetDate.setTime(new Date().getTime() + (3 * 24 * 60 * 60 * 1000));
    }
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}


function initializeFilters() {
  const filterTabs = document.querySelectorAll('.filter-tab');

  filterTabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      filterTabs.forEach(function(t) { t.classList.remove('active'); });
      this.classList.add('active');

      const selectedCategory = this.getAttribute('data-category');
      filterOffers(selectedCategory);

      this.style.transform = 'scale(0.95)';
      setTimeout(function() {
        tab.style.transform = 'scale(1)';
      }, 150);
    });
  });
}

function filterOffers(category) {
  const offerCards = document.querySelectorAll('.offer-card');
  let visibleCount = 0;

  offerCards.forEach(function(card, index) {
    const cardCategoriesStr = card.getAttribute('data-category') || '';
    const cardCategories = cardCategoriesStr.split(' ');
    const shouldShow = category === 'all' || cardCategories.indexOf(category) !== -1;

    if (shouldShow) {
      card.style.display = 'block';
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';

      setTimeout(function() {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 100);

      visibleCount++;
    } else {
      card.style.opacity = '0';
      card.style.transform = 'translateY(-20px)';

      setTimeout(function() {
        card.style.display = 'none';
      }, 300);
    }
  });

  setTimeout(function() {
    updateOffersCount(visibleCount);
  }, 400);
}

function updateOffersCount(count) {
  const offersCountElement = document.getElementById('offers-count');
  if (!offersCountElement) return;

  const totalOffers = (typeof count === 'number')
    ? count
    : document.querySelectorAll('.offer-card').length;

  offersCountElement.textContent = totalOffers + ' ofertas disponibles';

  offersCountElement.style.transform = 'scale(1.1)';
  setTimeout(function() {
    offersCountElement.style.transform = 'scale(1)';
  }, 200);
}


function addToCartOffer(productId) {
  var id = String(productId);

  var card = document.querySelector('.offer-card[data-product-id="' + id + '"]');
  if (!card) {
    console.error('[Ofertas] No se encontró la tarjeta para productId:', id);
    notify('No se pudo encontrar el producto de la oferta', 'error');
    return;
  }

  var nameEl = card.querySelector('.offer-title');
  var priceEl = card.querySelector('.offer-price');
  var imgEl = card.querySelector('.offer-image img');

  var name = nameEl ? nameEl.textContent.trim() : 'Producto en oferta';
  var priceText = priceEl ? priceEl.textContent.trim() : '$0';
  var numericPrice = parseInt(priceText.replace(/[^\d]/g, ''), 10);
  if (isNaN(numericPrice)) numericPrice = 0;

  var image = imgEl ? imgEl.getAttribute('src') : 'images/placeholder.png';

  console.log('[Ofertas] Agregando al carrito:', {
    id: id,
    name: name,
    price: numericPrice,
    image: image
  });

  if (window.DigitalPoint && typeof window.DigitalPoint.addToCart === 'function') {
    window.DigitalPoint.addToCart(id, numericPrice, image, name);
    notify(name + ' agregado al carrito', 'success');
  } else {
    var cart = [];
    try {
      cart = JSON.parse(localStorage.getItem('cartItems') || '[]');
      if (!Array.isArray(cart)) cart = [];
    } catch (e) {
      cart = [];
    }

    var existing = null;
    for (var i = 0; i < cart.length; i++) {
      if (String(cart[i].id) === id) {
        existing = cart[i];
        break;
      }
    }

    if (existing) {
      existing.quantity = Math.min(10, (existing.quantity || 1) + 1);
      notify(name + ' - Cantidad actualizada en el carrito');
    } else {
      cart.push({
        id: id,
        name: name,
        price: numericPrice,
        image: image,
        quantity: 1
      });
      notify(name + ' agregado al carrito', 'success');
    }

    localStorage.setItem('cartItems', JSON.stringify(cart));
    console.log('[Ofertas] Carrito actualizado (localStorage):', cart);
  }

  try {
    window.dispatchEvent(new Event('cart:updated'));
  } catch (e) {
    console.log('No se pudo emitir cart:updated', e);
  }

  if (typeof animateCartIcon === 'function') {
    animateCartIcon();
  }
  if (typeof updateCartCount === 'function') {
    updateCartCount();
  }

  try {
    var btn = card.querySelector('.add-to-cart-offer');
    if (btn) {
      var originalHTML = btn.innerHTML;
      btn.style.transform = 'scale(0.95)';
      btn.innerHTML = '<img src="images/icons/carrito-de-compras.png" alt="Carrito">¡Agregado!';
      setTimeout(function() {
        btn.style.transform = 'scale(1)';
        btn.innerHTML = originalHTML;
      }, 1500);
    }
  } catch (e2) {
    console.log('[Ofertas] Error en animación del botón:', e2);
  }
}

function showToast(message, type) {
  var toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    console.log('[' + (type || 'info').toUpperCase() + ']', message);
    return;
  }

  var toast = document.createElement('div');
  toast.className = 'toast ' + (type || 'info');
  toast.textContent = message;

  toastContainer.appendChild(toast);

  setTimeout(function() {
    toast.classList.add('show');
  }, 100);

  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() {
      if (toastContainer.contains(toast)) {
        toastContainer.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

function initializeScrollAnimations() {
  var observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  var animatableElements = document.querySelectorAll('.offer-card, .promo-banner, .newsletter');
  animatableElements.forEach(function(element) {
    element.style.opacity = '0';
    element.style.transform = 'translateY(30px)';
    element.style.transition = 'all 0.6s ease-out';
    observer.observe(element);
  });
}


document.addEventListener('DOMContentLoaded', function() {
  var heroSection = document.querySelector('.offers-hero');
  if (heroSection) {
    window.addEventListener('scroll', function() {
      var scrolled = window.pageYOffset;

      if (scrolled < heroSection.offsetHeight) {
        var heroOverlay = document.querySelector('.hero-overlay');
        if (heroOverlay) {
          var rate = scrolled * 0.3;
          heroOverlay.style.opacity = 0.6 + (rate / 1000);
        }
      }
    });
  }

  var offerCards = document.querySelectorAll('.offer-card');
  offerCards.forEach(function(card) {
    card.addEventListener('mouseenter', function() {
      card.style.zIndex = '10';
    });

    card.addEventListener('mouseleave', function() {
      card.style.zIndex = '1';
    });
  });
});


function handleImageError(img) {
  img.style.display = 'none';
  var parent = img.closest('.offer-image');
  if (parent) {
    parent.style.background = 'linear-gradient(135deg, #333, #555)';
    parent.innerHTML += '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #ccc; font-size: 14px;">Imagen no disponible</div>';
  }
}


function goToProductDetail(productId) {
  window.location.href = 'ficha_producto.php?id=' + encodeURIComponent(productId);
}

if (typeof window !== 'undefined') {
  window.addToCartOffer = addToCartOffer;
  window.goToProductDetail = goToProductDetail;
}
