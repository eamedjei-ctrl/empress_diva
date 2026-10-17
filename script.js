(() => {
  const STORE = window.EMPRESS || { products: [], categories: [] };
  const PRODUCTS = STORE.products;
  const CATEGORIES = STORE.categories;
  const productById = Object.fromEntries(PRODUCTS.map((p) => [p.id, p]));
  const categoryBySlug = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c]));
  const root = document.documentElement;

  // ---------- Helpers ----------
  const money = (n) => 'GH₵ ' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const productUrl = (p) => `item.html?id=${encodeURIComponent(p.id)}`;
  const whatsappUrl = (text) => `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(text)}`;
  const params = new URLSearchParams(location.search);
  const onCartPage = !!document.querySelector('[data-cart-page]');

  const svg = (paths) =>
    `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
  const ICONS = {
    close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
    bag: svg('<path d="M5.5 8h13l-1 12.5h-11L5.5 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>'),
    chat: svg('<path d="M20 11.5a8 8 0 0 1-11.7 7.1L4 20l1.3-4.1A8 8 0 1 1 20 11.5Z"/><path d="M9 10h6M9 13.5h4"/>'),
    check: svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
    arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
    minus: svg('<path d="M6 12h12"/>'),
    plus: svg('<path d="M12 6v12M6 12h12"/>'),
  };

  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* private mode */ } },
  };

  function openWhatsApp(text) {
    window.open(whatsappUrl(text), '_blank', 'noopener');
  }

  // ---------- Entrance splash ----------
  const siteIntro = document.getElementById('site-intro');
  if (siteIntro) {
    if (root.classList.contains('no-intro')) {
      siteIntro.remove();
    } else {
      try { sessionStorage.setItem('empress_intro_shown', '1'); } catch (e) { /* ignore */ }
      siteIntro.addEventListener('animationend', (e) => { if (e.target === siteIntro) siteIntro.remove(); });
      window.setTimeout(() => siteIntro.remove(), 2300);
    }
  }

  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  // ---------- Cart store ----------
  const CART_KEY = 'empress_cart_v2';
  const lineKey = (id, size) => (size ? `${id}::${size}` : id);

  function readCart() {
    try {
      const items = JSON.parse(storage.get(CART_KEY) || '[]');
      return Array.isArray(items) ? items.filter((it) => productById[it.id]) : [];
    } catch (e) {
      return [];
    }
  }

  let cartItems = readCart();

  const cart = {
    lines() {
      return cartItems.map((it) => {
        const product = productById[it.id];
        return { ...it, key: lineKey(it.id, it.size), product, total: product.price * it.qty };
      });
    },
    count: () => cartItems.reduce((s, it) => s + it.qty, 0),
    subtotal: () => cartItems.reduce((s, it) => s + productById[it.id].price * it.qty, 0),
    add(id, size, qty = 1) {
      const existing = cartItems.find((it) => lineKey(it.id, it.size) === lineKey(id, size));
      if (existing) existing.qty = Math.min(99, existing.qty + qty);
      else cartItems.push({ id, size: size || null, qty });
      save();
    },
    setQty(key, qty) {
      const line = cartItems.find((it) => lineKey(it.id, it.size) === key);
      if (!line) return;
      if (qty < 1) return cart.remove(key);
      line.qty = Math.min(99, qty);
      save();
    },
    remove(key) {
      cartItems = cartItems.filter((it) => lineKey(it.id, it.size) !== key);
      save();
    },
    clear() {
      cartItems = [];
      save();
    },
  };

  function save() {
    storage.set(CART_KEY, JSON.stringify(cartItems));
    document.dispatchEvent(new CustomEvent('cart:change'));
  }

  // Keep tabs in sync.
  window.addEventListener('storage', (e) => {
    if (e.key === CART_KEY) {
      cartItems = readCart();
      document.dispatchEvent(new CustomEvent('cart:change'));
    }
  });

  function orderMessage(lines, extra = []) {
    const items = lines.map((l, i) => {
      const size = l.size ? ` (Size: ${l.size})` : '';
      return `${i + 1}. ${l.product.name}${size} × ${l.qty} — ${money(l.total)}`;
    });
    const subtotal = lines.reduce((s, l) => s + l.total, 0);
    return ["Hello Empress Divas! I'd like to place an order:", '', ...items, '', `Subtotal: ${money(subtotal)}`, ...extra]
      .filter((line, i, arr) => !(line === '' && arr[i - 1] === ''))
      .join('\n');
  }

  // ---------- Shared UI pieces ----------
  function qtyStepper(value, { key = '', label = 'Quantity' } = {}) {
    const keyAttr = key ? ` data-cart-key="${esc(key)}"` : '';
    return `<div class="qty"${keyAttr}>
      <button type="button" data-step="-1" aria-label="Decrease ${esc(label)}">${ICONS.minus}</button>
      <input type="number" inputmode="numeric" min="1" max="99" value="${value}" aria-label="${esc(label)}" />
      <button type="button" data-step="1" aria-label="Increase ${esc(label)}">${ICONS.plus}</button>
    </div>`;
  }

  function productMedia(p, cls = '') {
    const img = p.images && p.images[0];
    return img
      ? `<img src="${esc(img)}" alt="${esc(p.alt || p.name)}" loading="lazy" class="${cls}" />`
      : `<span class="img-placeholder ${cls}" role="img" aria-label="${esc(p.alt || p.name)}">${esc(p.name.charAt(0))}</span>`;
  }

  function productCard(p) {
    const cat = categoryBySlug[p.category];
    const url = productUrl(p);
    const badge = p.badge ? `<span class="badge${/sale/i.test(p.badge) ? ' badge-sale' : ''}">${esc(p.badge)}</span>` : '';
    const action = p.sizes && p.sizes.length
      ? `<a class="btn btn-outline btn-sm btn-block" href="${url}">Choose options</a>`
      : `<button class="btn btn-outline btn-sm btn-block" type="button" data-add-to-cart="${esc(p.id)}">Add to cart</button>`;
    return `<article class="product-card">
      <a class="product-media" href="${url}" tabindex="-1" aria-hidden="true">${productMedia(p)}</a>
      ${badge}
      <div class="product-info">
        <p class="product-cat">${esc(cat ? cat.name : '')}</p>
        <h3 class="product-name"><a href="${url}">${esc(p.name)}</a></h3>
        <p class="product-price">${money(p.price)}</p>
      </div>
      ${action}
    </article>`;
  }

  function cartLine(l, compact = false) {
    const url = productUrl(l.product);
    return `<div class="cart-line${compact ? ' cart-line-compact' : ''}">
      <a class="cart-line-media" href="${url}" tabindex="-1" aria-hidden="true">${productMedia(l.product)}</a>
      <div class="cart-line-info">
        <a class="cart-line-name" href="${url}">${esc(l.product.name)}</a>
        ${l.size ? `<p class="cart-line-meta">Size: ${esc(l.size)}</p>` : ''}
        <p class="cart-line-unit">${money(l.product.price)}</p>
        <button class="link-btn" type="button" data-remove="${esc(l.key)}">Remove</button>
      </div>
      ${qtyStepper(l.qty, { key: l.key, label: `quantity of ${l.product.name}` })}
      <p class="cart-line-total">${money(l.total)}</p>
    </div>`;
  }

  // ---------- Drawers (mobile menu, cart, mobile filters) ----------
  const scrim = document.querySelector('[data-scrim]');
  let activeDrawer = null;
  let drawerTrigger = null;

  function openDrawer(drawer, trigger) {
    if (!drawer) return;
    if (activeDrawer && activeDrawer !== drawer) closeDrawer(false);
    activeDrawer = drawer;
    drawerTrigger = trigger || document.activeElement;
    drawer.classList.add('is-open');
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    scrim && scrim.classList.add('is-open');
    root.classList.add('scroll-locked');
    document.querySelectorAll(`[aria-controls="${drawer.id}"]`).forEach((b) => b.setAttribute('aria-expanded', 'true'));
    const focusTarget = drawer.querySelector('[data-drawer-close], a, button, input');
    window.setTimeout(() => focusTarget && focusTarget.focus({ preventScroll: true }), 60);
  }

  function closeDrawer(restoreFocus = true) {
    if (!activeDrawer) return;
    const drawer = activeDrawer;
    drawer.classList.remove('is-open');
    drawer.removeAttribute('role');
    drawer.removeAttribute('aria-modal');
    scrim && scrim.classList.remove('is-open');
    root.classList.remove('scroll-locked');
    document.querySelectorAll(`[aria-controls="${drawer.id}"]`).forEach((b) => b.setAttribute('aria-expanded', 'false'));
    activeDrawer = null;
    if (restoreFocus && drawerTrigger && drawerTrigger.focus) drawerTrigger.focus({ preventScroll: true });
  }

  document.addEventListener('click', (e) => {
    const opener = e.target.closest('[data-drawer-open]');
    if (opener) {
      e.preventDefault();
      openDrawer(document.getElementById(opener.dataset.drawerOpen), opener);
      return;
    }
    if (e.target.closest('[data-drawer-close]') || e.target === scrim) closeDrawer();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (activeDrawer) closeDrawer();
    else if (searchPanel && !searchPanel.hidden) toggleSearch(false);
  });

  // Drawers only exist below the desktop breakpoint; don't leave the page locked after a resize.
  window.matchMedia('(min-width: 1025px)').addEventListener('change', (e) => {
    if (e.matches && activeDrawer && activeDrawer.id !== 'cart-drawer') closeDrawer(false);
  });

  // ---------- Search ----------
  const searchPanel = document.getElementById('search-panel');
  const searchToggle = document.querySelector('[data-search-toggle]');

  function toggleSearch(open) {
    if (!searchPanel) return;
    searchPanel.hidden = !open;
    searchToggle && searchToggle.setAttribute('aria-expanded', String(open));
    if (open) searchPanel.querySelector('input').focus();
  }

  if (searchToggle) searchToggle.addEventListener('click', () => toggleSearch(searchPanel.hidden));
  if (searchPanel && params.get('q')) searchPanel.querySelector('input').value = params.get('q');

  // ---------- Cart drawer ----------
  let cartDrawer = null;
  if (!onCartPage) {
    document.body.insertAdjacentHTML('beforeend', `
      <aside class="drawer drawer-right cart-drawer" id="cart-drawer" aria-label="Shopping cart">
        <div class="drawer-head">
          <span class="drawer-title">Your cart <span class="drawer-count" data-drawer-count></span></span>
          <button class="icon-btn" type="button" aria-label="Close cart" data-drawer-close>${ICONS.close}</button>
        </div>
        <div class="drawer-body" data-drawer-lines></div>
        <div class="drawer-foot" data-drawer-foot></div>
      </aside>`);
    cartDrawer = document.getElementById('cart-drawer');
  }

  function renderCartDrawer() {
    if (!cartDrawer) return;
    const lines = cart.lines();
    cartDrawer.querySelector('[data-drawer-count]').textContent = lines.length ? `(${cart.count()})` : '';
    const body = cartDrawer.querySelector('[data-drawer-lines]');
    const foot = cartDrawer.querySelector('[data-drawer-foot]');
    if (!lines.length) {
      body.innerHTML = `<div class="empty-state empty-state-compact">
        ${ICONS.bag}
        <p>Your cart is empty.</p>
        <a class="btn btn-primary" href="shop.html">Start shopping</a>
      </div>`;
      foot.innerHTML = '';
      return;
    }
    body.innerHTML = lines.map((l) => cartLine(l, true)).join('');
    foot.innerHTML = `
      <div class="summary-row summary-total"><span>Subtotal</span><strong>${money(cart.subtotal())}</strong></div>
      <p class="fine-print">Delivery is arranged with you on WhatsApp.</p>
      <a class="btn btn-primary btn-block btn-lg" href="cart.html">Checkout</a>
      <button class="btn btn-link btn-block" type="button" data-drawer-close>Continue shopping</button>`;
  }

  function renderCartCount() {
    const count = cart.count();
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = count > 99 ? '99+' : count;
      el.hidden = count === 0;
    });
    document.querySelectorAll('[data-cart-open]').forEach((el) => {
      el.setAttribute('aria-label', `Cart, ${count} item${count === 1 ? '' : 's'}`);
    });
  }

  document.querySelectorAll('[data-cart-open]').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (!cartDrawer) return; // on the cart page the link simply reloads it
      e.preventDefault();
      openDrawer(cartDrawer, el);
    });
  });

  // Quantity steppers + remove buttons, wherever they appear.
  document.addEventListener('click', (e) => {
    const step = e.target.closest('.qty [data-step]');
    if (step) {
      const wrap = step.closest('.qty');
      const input = wrap.querySelector('input');
      const next = Math.max(wrap.dataset.cartKey ? 0 : 1, Math.min(99, (parseInt(input.value, 10) || 1) + Number(step.dataset.step)));
      if (wrap.dataset.cartKey) cart.setQty(wrap.dataset.cartKey, next);
      else input.value = next;
      return;
    }
    const remove = e.target.closest('[data-remove]');
    if (remove) cart.remove(remove.dataset.remove);

    const add = e.target.closest('[data-add-to-cart]');
    if (add) {
      cart.add(add.dataset.addToCart, null, 1);
      flashAdded(add);
      if (cartDrawer) openDrawer(cartDrawer, add);
    }
  });

  document.addEventListener('change', (e) => {
    const input = e.target.closest('.qty[data-cart-key] input');
    if (input) cart.setQty(input.closest('.qty').dataset.cartKey, parseInt(input.value, 10) || 1);
  });

  function flashAdded(btn) {
    if (btn.dataset.label === undefined) btn.dataset.label = btn.innerHTML;
    btn.innerHTML = `${ICONS.check} Added`;
    btn.classList.add('is-added');
    window.clearTimeout(btn._flash);
    btn._flash = window.setTimeout(() => {
      btn.innerHTML = btn.dataset.label;
      btn.classList.remove('is-added');
    }, 1600);
  }

  document.addEventListener('cart:change', () => {
    renderCartCount();
    renderCartDrawer();
  });
  renderCartCount();
  renderCartDrawer();

  // ---------- Homepage blocks ----------
  document.querySelectorAll('[data-category-grid]').forEach((grid) => {
    grid.innerHTML = CATEGORIES.map((c) => {
      const count = PRODUCTS.filter((p) => p.category === c.slug).length;
      const media = c.image
        ? `<img src="${esc(c.image)}" alt="" loading="lazy" />`
        : `<span class="img-placeholder">${esc(c.name.charAt(0))}</span>`;
      return `<a class="category-tile" href="${esc(c.page)}">
        <span class="category-media">${media}</span>
        <span class="category-label"><strong>${esc(c.name)}</strong><span>${count} item${count === 1 ? '' : 's'}</span></span>
      </a>`;
    }).join('');
  });

  document.querySelectorAll('[data-product-grid]').forEach((grid) => {
    let items = PRODUCTS;
    if (grid.dataset.ids) items = grid.dataset.ids.split(',').map((id) => productById[id.trim()]).filter(Boolean);
    if (grid.dataset.category) items = items.filter((p) => p.category === grid.dataset.category);
    if (grid.dataset.featured) items = items.filter((p) => p.featured);
    if (grid.dataset.limit) items = items.slice(0, Number(grid.dataset.limit));
    grid.innerHTML = items.map(productCard).join('');
  });

  // ---------- Listing pages (shop + categories) ----------
  const listing = document.querySelector('[data-listing]');
  if (listing) initListing(listing);

  function initListing(el) {
    const pageCategory = el.dataset.category || 'all';
    const grid = el.querySelector('[data-listing-grid]');
    const filtersEl = el.querySelector('[data-filters]');
    const countEl = el.querySelector('[data-result-count]');
    const activeEl = el.querySelector('[data-active-filters]');
    const sortEl = el.querySelector('[data-sort]');
    const resultsBtn = el.querySelector('[data-results-btn]');

    const PRICE_RANGES = [
      { id: 'any', label: 'Any price', test: () => true },
      { id: 'u500', label: 'Under GH₵ 500', test: (p) => p.price < 500 },
      { id: '500-1000', label: 'GH₵ 500 – 1,000', test: (p) => p.price >= 500 && p.price <= 1000 },
      { id: 'o1000', label: 'Over GH₵ 1,000', test: (p) => p.price > 1000 },
    ];

    const state = {
      category: pageCategory === 'all' ? (categoryBySlug[params.get('category')] ? params.get('category') : 'all') : pageCategory,
      q: params.get('q') || '',
      sizes: new Set(),
      price: 'any',
      sort: 'featured',
    };

    const inCategory = () => PRODUCTS.filter((p) => state.category === 'all' || p.category === state.category);

    function renderFilters() {
      const scoped = inCategory();
      const sizes = [...new Set(scoped.flatMap((p) => p.sizes || []))];
      // Drop size selections that no longer apply after a category change.
      [...state.sizes].forEach((s) => { if (!sizes.includes(s)) state.sizes.delete(s); });

      const categoryGroup = pageCategory === 'all' ? `
        <fieldset class="filter-group">
          <legend>Category</legend>
          ${[{ slug: 'all', name: 'All products' }, ...CATEGORIES].map((c) => {
            const n = c.slug === 'all' ? PRODUCTS.length : PRODUCTS.filter((p) => p.category === c.slug).length;
            return `<label class="radio-row"><input type="radio" name="category" value="${c.slug}"${state.category === c.slug ? ' checked' : ''} />
              <span>${esc(c.name)}</span><span class="filter-count">${n}</span></label>`;
          }).join('')}
        </fieldset>` : '';

      const sizeGroup = sizes.length ? `
        <fieldset class="filter-group">
          <legend>Size</legend>
          <div class="size-options">
            ${sizes.map((s) => `<label class="size-option"><input type="checkbox" name="size" value="${esc(s)}"${state.sizes.has(s) ? ' checked' : ''} /><span>${esc(s)}</span></label>`).join('')}
          </div>
        </fieldset>` : '';

      filtersEl.innerHTML = `
        <div class="filter-group">
          <label class="filter-label" for="filter-q">Search</label>
          <input id="filter-q" class="input" type="search" name="q" placeholder="Search products…" value="${esc(state.q)}" autocomplete="off" />
        </div>
        ${categoryGroup}
        ${sizeGroup}
        <fieldset class="filter-group">
          <legend>Price</legend>
          ${PRICE_RANGES.map((r) => `<label class="radio-row"><input type="radio" name="price" value="${r.id}"${state.price === r.id ? ' checked' : ''} /><span>${esc(r.label)}</span></label>`).join('')}
        </fieldset>
        <button class="btn btn-link" type="button" data-clear-filters>Clear all filters</button>`;
    }

    function results() {
      const q = state.q.trim().toLowerCase();
      const range = PRICE_RANGES.find((r) => r.id === state.price);
      let items = inCategory().filter((p) =>
        (!q || `${p.name} ${p.description} ${p.category}`.toLowerCase().includes(q)) &&
        (!state.sizes.size || (p.sizes || []).some((s) => state.sizes.has(s))) &&
        range.test(p));
      if (state.sort === 'price-asc') items = [...items].sort((a, b) => a.price - b.price);
      if (state.sort === 'price-desc') items = [...items].sort((a, b) => b.price - a.price);
      if (state.sort === 'name') items = [...items].sort((a, b) => a.name.localeCompare(b.name));
      return items;
    }

    function renderResults() {
      const items = results();
      countEl.textContent = `${items.length} product${items.length === 1 ? '' : 's'}`;
      if (resultsBtn) resultsBtn.textContent = `Show ${items.length} result${items.length === 1 ? '' : 's'}`;
      grid.innerHTML = items.length
        ? items.map(productCard).join('')
        : `<div class="empty-state">
            <p><strong>No products match your filters.</strong></p>
            <p>Try a different search or clear your filters.</p>
            <button class="btn btn-outline" type="button" data-clear-filters>Clear filters</button>
          </div>`;

      const chips = [];
      if (pageCategory === 'all' && state.category !== 'all') chips.push(['category', categoryBySlug[state.category].name]);
      if (state.q) chips.push(['q', `“${state.q}”`]);
      state.sizes.forEach((s) => chips.push([`size:${s}`, `Size ${s}`]));
      if (state.price !== 'any') chips.push(['price', PRICE_RANGES.find((r) => r.id === state.price).label]);
      activeEl.innerHTML = chips.map(([k, label]) =>
        `<button class="chip" type="button" data-chip="${esc(k)}" aria-label="Remove filter ${esc(label)}">${esc(label)} ${ICONS.close}</button>`).join('');
      activeEl.hidden = !chips.length;

      // Keep the URL shareable for search + category.
      const url = new URL(location.href);
      state.q ? url.searchParams.set('q', state.q) : url.searchParams.delete('q');
      pageCategory === 'all' && state.category !== 'all' ? url.searchParams.set('category', state.category) : url.searchParams.delete('category');
      history.replaceState(null, '', url);
    }

    function clearAll() {
      state.q = '';
      state.sizes.clear();
      state.price = 'any';
      if (pageCategory === 'all') state.category = 'all';
      renderFilters();
      renderResults();
    }

    filtersEl.addEventListener('input', (e) => {
      if (e.target.name === 'q') {
        state.q = e.target.value;
        renderResults();
      }
    });

    filtersEl.addEventListener('change', (e) => {
      const t = e.target;
      if (t.name === 'category') {
        state.category = t.value;
        renderFilters();
      }
      if (t.name === 'size') t.checked ? state.sizes.add(t.value) : state.sizes.delete(t.value);
      if (t.name === 'price') state.price = t.value;
      renderResults();
    });

    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-clear-filters]')) return clearAll();
      const chip = e.target.closest('[data-chip]');
      if (!chip) return;
      const k = chip.dataset.chip;
      if (k === 'category') state.category = 'all';
      if (k === 'q') state.q = '';
      if (k === 'price') state.price = 'any';
      if (k.startsWith('size:')) state.sizes.delete(k.slice(5));
      renderFilters();
      renderResults();
    });

    sortEl.addEventListener('change', () => {
      state.sort = sortEl.value;
      renderResults();
    });

    renderFilters();
    renderResults();
  }

  // ---------- Product detail page ----------
  const productPage = document.querySelector('[data-product-page]');
  if (productPage) initProductPage(productPage);

  function initProductPage(el) {
    const p = productById[params.get('id')];
    if (!p) {
      el.innerHTML = `<div class="empty-state empty-state-page">
        <h1>Product not found</h1>
        <p>This item may have sold out or moved.</p>
        <a class="btn btn-primary" href="shop.html">Browse the shop</a>
      </div>`;
      return;
    }

    const cat = categoryBySlug[p.category];
    document.title = `${p.name} | Empress Divas Collections`;
    const images = p.images || [];
    const thumbs = images.length > 1
      ? `<div class="pdp-thumbs">${images.map((src, i) =>
          `<button type="button" class="pdp-thumb${i === 0 ? ' is-active' : ''}" data-thumb="${esc(src)}" aria-label="Show image ${i + 1}"><img src="${esc(src)}" alt="" /></button>`).join('')}</div>`
      : '';
    const sizes = p.sizes && p.sizes.length ? `
      <fieldset class="pdp-sizes">
        <legend>Size <span class="pdp-size-picked" data-size-picked></span></legend>
        <div class="size-options">
          ${p.sizes.map((s) => `<label class="size-option"><input type="radio" name="size" value="${esc(s)}" /><span>${esc(s)}</span></label>`).join('')}
        </div>
      </fieldset>` : '';

    el.innerHTML = `
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="index.html">Home</a><span aria-hidden="true">/</span>
        <a href="${esc(cat.page)}">${esc(cat.name)}</a><span aria-hidden="true">/</span>
        <span aria-current="page">${esc(p.name)}</span>
      </nav>
      <div class="pdp">
        <div class="pdp-gallery">
          <div class="pdp-main">
            ${p.badge ? `<span class="badge${/sale/i.test(p.badge) ? ' badge-sale' : ''}">${esc(p.badge)}</span>` : ''}
            ${productMedia(p, 'pdp-main-img')}
          </div>
          ${thumbs}
        </div>
        <div class="pdp-info">
          <a class="product-cat" href="${esc(cat.page)}">${esc(cat.name)}</a>
          <h1>${esc(p.name)}</h1>
          <p class="pdp-price">${money(p.price)}</p>
          <p class="stock-pill"><span aria-hidden="true"></span>In stock</p>
          <p class="pdp-desc">${esc(p.description)}</p>
          <form class="pdp-form" data-pdp-form novalidate>
            ${sizes}
            <div class="pdp-qty">
              <span class="filter-label">Quantity</span>
              ${qtyStepper(1)}
            </div>
            <p class="form-error" data-form-error role="alert" hidden>Please choose a size.</p>
            <button class="btn btn-primary btn-lg btn-block" type="submit">${ICONS.bag} Add to cart</button>
            <button class="btn btn-whatsapp btn-lg btn-block" type="button" data-buy-now>${ICONS.chat} Order now on WhatsApp</button>
          </form>
          <div class="pdp-accordion">
            <details>
              <summary>Delivery &amp; pickup</summary>
              <p>Choose pickup or delivery when you check out. We'll confirm delivery details, fees and payment with you on WhatsApp.</p>
            </details>
            <details>
              <summary>Need help?</summary>
              <p>Call <a href="tel:${esc(STORE.phone)}">${esc(STORE.phone)}</a> or <a href="https://wa.me/${esc(STORE.whatsapp)}" target="_blank" rel="noopener">chat with us on WhatsApp</a>, Monday to Saturday, 9am – 6pm.</p>
            </details>
          </div>
        </div>
      </div>`;

    const form = el.querySelector('[data-pdp-form]');
    const errorEl = form.querySelector('[data-form-error]');
    const picked = form.querySelector('[data-size-picked]');

    function selection() {
      const size = form.querySelector('input[name="size"]:checked');
      const qty = Math.max(1, Math.min(99, parseInt(form.querySelector('.qty input').value, 10) || 1));
      if (p.sizes && p.sizes.length && !size) {
        errorEl.hidden = false;
        form.querySelector('.pdp-sizes').classList.add('has-error');
        return null;
      }
      return { size: size ? size.value : null, qty };
    }

    form.addEventListener('change', (e) => {
      if (e.target.name === 'size') {
        errorEl.hidden = true;
        form.querySelector('.pdp-sizes').classList.remove('has-error');
        if (picked) picked.textContent = `— ${e.target.value}`;
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const sel = selection();
      if (!sel) return;
      cart.add(p.id, sel.size, sel.qty);
      const btn = form.querySelector('[type="submit"]');
      flashAdded(btn);
      if (cartDrawer) openDrawer(cartDrawer, btn);
    });

    form.querySelector('[data-buy-now]').addEventListener('click', () => {
      const sel = selection();
      if (!sel) return;
      openWhatsApp(orderMessage([{ product: p, size: sel.size, qty: sel.qty, total: p.price * sel.qty }], ['', 'Please confirm availability. Thank you!']));
    });

    el.querySelectorAll('[data-thumb]').forEach((btn) => {
      btn.addEventListener('click', () => {
        el.querySelector('.pdp-main-img').src = btn.dataset.thumb;
        el.querySelectorAll('[data-thumb]').forEach((b) => b.classList.toggle('is-active', b === btn));
      });
    });

    const related = document.querySelector('[data-related]');
    if (related) {
      const same = PRODUCTS.filter((x) => x.category === p.category && x.id !== p.id);
      const others = PRODUCTS.filter((x) => x.category !== p.category && x.featured);
      const picks = [...same, ...others].slice(0, 4);
      related.querySelector('[data-related-grid]').innerHTML = picks.map(productCard).join('');
      related.hidden = !picks.length;
    }
  }

  // ---------- Cart page + checkout ----------
  const cartPage = document.querySelector('[data-cart-page]');
  if (cartPage) initCartPage(cartPage);

  function initCartPage(el) {
    let layoutRendered = false;

    function renderEmpty() {
      layoutRendered = false;
      el.innerHTML = `<div class="empty-state empty-state-page">
        ${ICONS.bag}
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added anything yet.</p>
        <a class="btn btn-primary btn-lg" href="shop.html">Start shopping</a>
        <div class="empty-links">${CATEGORIES.map((c) => `<a href="${esc(c.page)}">${esc(c.name)}</a>`).join('')}</div>
      </div>`;
    }

    function renderLayout() {
      layoutRendered = true;
      el.innerHTML = `
        <div class="cart-layout">
          <div class="cart-lines">
            <div class="cart-lines-head" aria-hidden="true"><span>Product</span><span>Quantity</span><span>Total</span></div>
            <div data-cart-lines></div>
            <a class="link-arrow link-back" href="shop.html">${ICONS.arrow} Continue shopping</a>
          </div>
          <aside class="card cart-summary">
            <h2>Order summary</h2>
            <div class="summary-row"><span data-summary-label></span><span data-summary-subtotal></span></div>
            <div class="summary-row"><span>Delivery</span><span>Confirmed on WhatsApp</span></div>
            <div class="summary-row summary-total"><span>Total</span><strong data-summary-total></strong></div>

            <form class="checkout-form" data-checkout-form>
              <h3>Your details</h3>
              <div class="field">
                <label for="co-name">Full name</label>
                <input id="co-name" name="name" type="text" autocomplete="name" required />
              </div>
              <div class="field">
                <label for="co-phone">Phone number</label>
                <input id="co-phone" name="phone" type="tel" autocomplete="tel" required />
              </div>
              <fieldset class="field">
                <legend>Pickup or delivery</legend>
                <div class="segmented">
                  <label><input type="radio" name="method" value="Pickup" checked /><span>Pickup</span></label>
                  <label><input type="radio" name="method" value="Delivery" /><span>Delivery</span></label>
                </div>
              </fieldset>
              <div class="field">
                <label for="co-location" data-location-label>Pickup location</label>
                <input id="co-location" name="location" type="text" placeholder="e.g. Accra Mall, East Legon" required />
              </div>
              <div class="field">
                <label for="co-notes">Order notes <span class="optional">(optional)</span></label>
                <textarea id="co-notes" name="notes" rows="3"></textarea>
              </div>
              <button class="btn btn-whatsapp btn-lg btn-block" type="submit">${ICONS.chat} Place order on WhatsApp</button>
              <p class="fine-print">Your order opens in WhatsApp, ready to send. We'll confirm availability, delivery fee and payment with you there.</p>
            </form>
            <div class="order-sent" data-order-sent hidden>
              ${ICONS.check}
              <h3>Your order is ready in WhatsApp</h3>
              <p>Send the message to complete your order. If WhatsApp didn't open, <button class="link-btn" type="button" data-resend>try again</button>.</p>
              <button class="btn btn-outline btn-block" type="button" data-finish>Clear cart &amp; keep shopping</button>
            </div>
          </aside>
        </div>`;

      const form = el.querySelector('[data-checkout-form]');
      const locLabel = form.querySelector('[data-location-label]');
      const locInput = form.querySelector('#co-location');
      let lastMessage = '';

      form.addEventListener('change', (e) => {
        if (e.target.name !== 'method') return;
        const delivery = e.target.value === 'Delivery';
        locLabel.textContent = delivery ? 'Delivery address' : 'Pickup location';
        locInput.placeholder = delivery ? 'Street, area and city' : 'e.g. Accra Mall, East Legon';
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!form.reportValidity()) return;
        const f = new FormData(form);
        const method = f.get('method');
        lastMessage = orderMessage(cart.lines(), [
          '',
          `Name: ${f.get('name')}`,
          `Phone: ${f.get('phone')}`,
          `Pickup or delivery: ${method}`,
          `${method === 'Delivery' ? 'Delivery address' : 'Pickup location'}: ${f.get('location')}`,
          f.get('notes') ? `Notes: ${f.get('notes')}` : '',
        ].filter((line, i) => i === 0 || line));
        openWhatsApp(lastMessage);
        form.hidden = true;
        el.querySelector('[data-order-sent]').hidden = false;
      });

      el.querySelector('[data-resend]').addEventListener('click', () => openWhatsApp(lastMessage));
      el.querySelector('[data-finish]').addEventListener('click', () => {
        cart.clear();
        goTo('shop.html');
      });
    }

    function render() {
      const lines = cart.lines();
      if (!lines.length) return renderEmpty();
      if (!layoutRendered) renderLayout();
      el.querySelector('[data-cart-lines]').innerHTML = lines.map((l) => cartLine(l)).join('');
      const count = cart.count();
      el.querySelector('[data-summary-label]').textContent = `Subtotal (${count} item${count === 1 ? '' : 's'})`;
      el.querySelector('[data-summary-subtotal]').textContent = money(cart.subtotal());
      el.querySelector('[data-summary-total]').textContent = money(cart.subtotal());
    }

    document.addEventListener('cart:change', render);
    render();
  }

  // ---------- Contact form → WhatsApp ----------
  document.querySelectorAll('[data-contact-form]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const f = new FormData(form);
      openWhatsApp([
        `Hello Empress Divas! (${f.get('topic')})`,
        '',
        f.get('message'),
        '',
        `— ${f.get('name')}${f.get('phone') ? `, ${f.get('phone')}` : ''}`,
      ].join('\n'));
    });
  });

  // ---------- Page transition spinner ----------
  // Moving to another page on the site shows a spinner for this long first.
  // Registered last so handlers above that cancel a click (cart drawer, etc.) run first.
  const PAGE_TRANSITION_MS = 3000;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="page-loader" data-page-loader role="status" aria-live="polite" hidden>
      <div class="page-loader-spinner" aria-hidden="true"></div>
      <p class="page-loader-text">Loading…</p>
    </div>`);
  const pageLoader = document.querySelector('[data-page-loader]');
  let transitionTimer = null;

  function startTransition(navigate) {
    if (transitionTimer) return;
    closeDrawer(false);
    pageLoader.hidden = false;
    transitionTimer = window.setTimeout(navigate, PAGE_TRANSITION_MS);
  }

  function goTo(url) {
    startTransition(() => { location.href = url; });
  }

  function isPageNavigation(link, e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
    if ((link.target && link.target !== '_self') || link.hasAttribute('download')) return false;
    if (link.getAttribute('href').startsWith('#')) return false;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return false; // WhatsApp, tel:, external sites
    const samePage = url.pathname === location.pathname && url.search === location.search;
    return !(samePage && url.hash); // in-page anchors just scroll
  }

  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link || !isPageNavigation(link, e)) return;
    e.preventDefault();
    goTo(link.href);
  });

  // Plain GET forms that lead to another page (the header search).
  document.addEventListener('submit', (e) => {
    const form = e.target;
    if (e.defaultPrevented || !form.getAttribute('action') || form.method.toLowerCase() !== 'get') return;
    e.preventDefault();
    startTransition(() => form.submit());
  });

  // Coming back via the browser's back button can restore this page with the spinner still up.
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    window.clearTimeout(transitionTimer);
    transitionTimer = null;
    pageLoader.hidden = true;
  });
})();
