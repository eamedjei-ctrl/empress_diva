document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.querySelector('.intro-overlay');
  if (overlay) {
    window.setTimeout(() => {
      overlay.classList.add('hidden');
    }, 5000);
  }

  const navMenu = document.querySelector('.nav-menu');
  const toggleButton = document.querySelector('.mobile-toggle');

  if (toggleButton && navMenu) {
    toggleButton.setAttribute('aria-expanded', 'false');
    toggleButton.addEventListener('click', () => {
      const open = navMenu.classList.toggle('open');
      toggleButton.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.documentElement.classList.toggle('no-scroll', open);
    });
  }

  const sizePills = document.querySelectorAll('.size-pill');
  sizePills.forEach((pill) => {
    pill.addEventListener('click', () => {
      pill.classList.toggle('selected');
    });
  });

  const pageForms = document.querySelectorAll('form[data-form="contact"]');
  pageForms.forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const submitButton = form.querySelector('button[type="submit"]');
      const originalText = submitButton?.textContent || 'Send Message';

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Message Sent';
      }

      setTimeout(() => {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = originalText;
        }
        form.reset();
      }, 1800);
    });
  });

  // Order flow via WhatsApp (no server)
  const sellerNumber = '233245816733'; // seller WhatsApp number (country code, no +)

  // inject modal HTML
  const modalHtml = `
  <div id="order-backdrop" class="modal-backdrop" style="display:none">
    <div class="order-modal">
      <button class="modal-close" aria-label="Close">×</button>
      <h3 id="order-product">Order</h3>
      <form id="order-form">
        <label>Name<input name="name" required placeholder="Your full name" /></label>
        <label>Phone<input name="phone" required placeholder="Your phone number" /></label>
        <label>Address<textarea name="address" placeholder="Shipping address (optional)"></textarea></label>
        <label>Quantity<input name="quantity" type="number" min="1" value="1" required /></label>
        <div class="price-summary" style="margin-top:0.5rem; display:flex; gap:1rem; align-items:center;">
          <div>Unit: <strong id="unit-price">GH₵ 0.00</strong></div>
          <div>Total: <strong id="total-price">GH₵ 0.00</strong></div>
        </div>
        <label>Notes<textarea name="notes" placeholder="Additional notes (optional)"></textarea></label>
        <div class="modal-actions">
          <button type="submit" class="btn">Send via WhatsApp</button>
          <button type="button" class="btn btn-ghost modal-cancel">Cancel</button>
        </div>
      </form>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', modalHtml);

  const backdrop = document.getElementById('order-backdrop');
  const orderForm = document.getElementById('order-form');
  const orderProduct = document.getElementById('order-product');

  function openOrderModal(productName) {
    orderProduct.textContent = `Order: ${productName}`;
    backdrop.style.display = 'flex';
    const nameInput = orderForm.querySelector('[name="name"]');
    if (nameInput) nameInput.focus();
  }

  function parsePrice(text) {
    if (!text) return 0;
    // Remove currency symbols and non-numeric except dot and comma
    const cleaned = String(text).replace(/[^0-9.,]/g, '').replace(/,/g, '');
    const n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }

  function formatCurrency(n) {
    if (!n) return 'GH₵ 0.00';
    return 'GH₵ ' + Number(n).toFixed(2);
  }

  function updateTotalDisplay(unitPrice) {
    const qtyInput = orderForm.querySelector('[name="quantity"]');
    const unitEl = document.getElementById('unit-price');
    const totalEl = document.getElementById('total-price');
    const qty = Math.max(1, Number(qtyInput?.value || 1));
    const total = (unitPrice || 0) * qty;
    if (unitEl) unitEl.textContent = formatCurrency(unitPrice);
    if (totalEl) totalEl.textContent = formatCurrency(total);
  }

  function closeOrderModal() {
    backdrop.style.display = 'none';
    orderForm.reset();
  }

  // Attach to all whatsapp buttons
  document.querySelectorAll('.whatsapp-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      // find nearest product title
      let productName = '';
      const card = btn.closest('.product-card, .gadget-card, .category-card, .product-content, .gadget-info');
      if (card) {
        const title = card.querySelector('h3') || card.querySelector('.product-placeholder');
        productName = title ? title.textContent.trim() : '';
      }
      if (!productName) productName = document.title || 'Product Inquiry';
      // try to read unit price from card
      let unitPrice = 0;
      if (card) {
        const priceEl = card.querySelector('.price') || card.querySelector('.price-block strong') || card.querySelector('strong');
        unitPrice = priceEl ? parsePrice(priceEl.textContent) : 0;
      }
      openOrderModal(productName);
      // set unit/total display and quantity listener
      updateTotalDisplay(unitPrice);
      const qtyInput = orderForm.querySelector('[name="quantity"]');
      if (qtyInput) {
        // reset to 1 and set a single oninput handler
        qtyInput.value = 1;
        qtyInput.oninput = () => updateTotalDisplay(unitPrice);
      }
    });
  });

  // close buttons
  document.querySelectorAll('.modal-close, .modal-cancel').forEach((el) => {
    el.addEventListener('click', (e) => { e.preventDefault(); closeOrderModal(); });
  });

  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeOrderModal(); });

  orderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(orderForm);
    const name = f.get('name') || '';
    const phone = f.get('phone') || '';
    const address = f.get('address') || '';
    const qty = f.get('quantity') || '1';
    const notes = f.get('notes') || '';
    const product = orderProduct.textContent.replace(/^Order:\s*/i, '') || 'Product';

    // include total if unit price available
    const qtyNum = Number(qty) || 1;
    const unitText = document.getElementById('unit-price')?.textContent || '';
    const totalText = document.getElementById('total-price')?.textContent || '';
    const message = `New order from ${name}\nProduct: ${product}\nQuantity: ${qtyNum}\nUnit Price: ${unitText}\nTotal: ${totalText}\nPhone: ${phone}\nAddress: ${address}\nNotes: ${notes}`;
    const waUrl = `https://wa.me/${sellerNumber}?text=${encodeURIComponent(message)}`;
    // open WhatsApp in a new tab/window
    window.open(waUrl, '_blank');
    closeOrderModal();
  });

  // --- Simple client-side cart (localStorage) ---
  const CART_KEY = 'empress_cart_v1';

  function loadCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCountUI();
  }

  function updateCartCountUI() {
    const cart = loadCart();
    const count = cart.reduce((s, it) => s + (it.quantity||0), 0);
    document.querySelectorAll('.cart-count').forEach(el => { el.textContent = count; });
  }

  // ensure a left header cart icon exists (useful on pages without a cart link)
  function ensureHeaderCartIcon() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;
    if (navbar.querySelector('.cart-link-left')) return; // already present
    const a = document.createElement('a');
    a.href = 'cart.html';
    a.className = 'icon-btn cart-link-left';
    a.setAttribute('aria-label', 'Open cart');
    a.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M7 4h-2l-1 2v2h2l3.6 7.59-1.35 2.44A1 1 0 0 0 9 19h9v-2H10.42a.25.25 0 0 1-.22-.13L11.1 15h6.45a1 1 0 0 0 .92-.62l1.58-4.47A1 1 0 0 0 19.98 8H6.21" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="cart-count" aria-hidden="true">0</span>
    `;
    const brand = navbar.querySelector('.brand');
    if (brand) navbar.insertBefore(a, brand);
    else navbar.prepend(a);
  }

  function addToCartItem(item) {
    const cart = loadCart();
    const found = cart.find(i => i.id === item.id);
    if (found) {
      found.quantity = (found.quantity || 1) + (item.quantity || 1);
    } else {
      cart.push(Object.assign({ quantity: 1 }, item));
    }
    saveCart(cart);
  }

  // wire up Add to cart buttons
  document.querySelectorAll('.add-cart-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const id = btn.dataset.id || btn.getAttribute('data-id');
      const name = btn.dataset.name || btn.getAttribute('data-name') || 'Item';
      const price = Number(btn.dataset.price || btn.getAttribute('data-price') || 0) || 0;
      addToCartItem({ id, name, price });
      const original = btn.textContent;
      btn.textContent = 'Added';
      btn.disabled = true;
      setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 900);
    });
  });

  ensureHeaderCartIcon();
  updateCartCountUI();

  // render cart page if present
  if (document.getElementById('cart-root')) {
    const root = document.getElementById('cart-root');
    function renderCart() {
      const cart = loadCart();
      if (!cart.length) {
        root.innerHTML = '<p>Your cart is empty. <a href="products.html">Continue shopping</a>.</p>';
        updateCartCountUI();
        return;
      }
      let html = '<div class="cart-list">';
      let total = 0;
      cart.forEach((it, idx) => {
        const lineTotal = (it.price || 0) * (it.quantity || 1);
        total += lineTotal;
        html += `<div class="cart-item" data-idx="${idx}">`+
                `<div class="cart-item-info"><strong>${escapeHtml(it.name)}</strong>`+
                `<div class="cart-item-price">GH₵ ${Number(it.price).toFixed(2)}</div></div>`+
                `<div class="cart-item-actions">`+
                `<input type="number" min="1" value="${it.quantity || 1}" class="cart-qty" />`+
                `<button class="btn btn-ghost remove-item">Remove</button>`+
                `</div></div>`;
      });
      html += `</div><div class="cart-summary"><div>Total: <strong>GH₵ ${Number(total).toFixed(2)}</strong></div>`+
              `<div style="margin-top:1rem; display:flex; gap:0.6rem;"><button id="checkout-btn" class="btn">Checkout via WhatsApp</button><button id="clear-cart" class="btn btn-ghost">Clear cart</button></div></div>`;
      root.innerHTML = html;
      // attach handlers
      root.querySelectorAll('.cart-qty').forEach((input, i) => {
        input.addEventListener('change', (e) => {
          const val = Math.max(1, Number(e.target.value || 1));
          const cart = loadCart();
          cart[i].quantity = val;
          saveCart(cart);
          renderCart();
        });
      });
      root.querySelectorAll('.remove-item').forEach((btn, i) => {
        btn.addEventListener('click', (e) => {
          const cart = loadCart();
          cart.splice(i, 1);
          saveCart(cart);
          renderCart();
        });
      });
      const checkoutBtn = document.getElementById('checkout-btn');
      if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
          const cart = loadCart();
          if (!cart.length) return;
          let msg = 'New order from website%0A';
          let total = 0;
          cart.forEach(it => { total += (it.price||0)*(it.quantity||1); msg += `${it.name} x${it.quantity} - GH₵ ${((it.price||0)*(it.quantity||1)).toFixed(2)}%0A`; });
          msg += `%0ATotal: GH₵ ${total.toFixed(2)}`;
          const wa = `https://wa.me/${sellerNumber}?text=${encodeURIComponent(decodeURIComponent(msg))}`;
          window.open(wa, '_blank');
        });
      }
      const clearBtn = document.getElementById('clear-cart');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => { localStorage.removeItem(CART_KEY); renderCart(); updateCartCountUI(); });
      }
    }
    function escapeHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    renderCart();
  }
});
