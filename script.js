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
    toggleButton.addEventListener('click', () => {
      navMenu.classList.toggle('open');
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
});
