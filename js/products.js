/**
 * products.js — Product rendering, filtering, and category management
 * Radha Rani Store
 */

const Products = (() => {
  let allProducts = [];
  let allCategories = [];
  let activeCategory = "all";
  let offersOnly = false;

  // ── Public init (called by app.js after data load) ─────────────────
  function init(products, categories) {
    allProducts = products;
    allCategories = categories;
  }

  // ── Category Grid (Homepage) ──────────────────────────────────────
  function renderCategories() {
    const container = document.getElementById("categories-grid");
    if (!container) return;

    container.innerHTML = allCategories.map(cat => `
      <button
        class="category-card"
        data-category-id="${cat.id}"
        aria-label="Browse ${cat.name}"
        id="cat-${cat.id}"
      >
        <div class="category-icon">
          ${cat.iconImg
            ? `<img src="${cat.iconImg}" alt="${cat.name}" class="category-icon-img" loading="lazy">`
            : `<span class="category-icon-emoji">${cat.icon}</span>`}
        </div>
        <span class="category-name">${cat.name}</span>
      </button>
    `).join("");

    container.querySelectorAll(".category-card").forEach(card => {
      card.addEventListener("click", () => {
        const catId = card.dataset.categoryId;
        offersOnly = false;
        App.showScreen("products");
        setActiveCategory(catId);
        applyFilters();
        // Update filter pills
        document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
        const pill = document.querySelector(`.filter-pill[data-category="${catId}"]`);
        if (pill) pill.classList.add("active");
      });
    });
  }

  // ── Filter Pills (Products screen top bar) ─────────────────────────
  function renderFilterPills() {
    const container = document.getElementById("filter-pills");
    if (!container) return;

    const allPill = `<button class="filter-pill active" data-category="all" id="pill-all">All</button>`;
    const categoryPills = allCategories.map(cat =>
      `<button class="filter-pill" data-category="${cat.id}" id="pill-${cat.id}">${cat.name}</button>`
    ).join("");

    container.innerHTML = allPill + categoryPills;

    container.querySelectorAll(".filter-pill").forEach(pill => {
      pill.addEventListener("click", () => {
        container.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
        pill.classList.add("active");
        setActiveCategory(pill.dataset.category);
        applyFilters();
      });
    });
  }

  // ── Featured Products (Homepage) ──────────────────────────────────
  function renderFeaturedProducts() {
    const container = document.getElementById("featured-products");
    if (!container) return;
    const featured = allProducts.filter(p => p.featured && p.available);
    if (featured.length === 0) {
      container.closest("section").style.display = "none";
      return;
    }
    container.innerHTML = featured.map(p => createProductCardHTML(p)).join("");
    attachCardListeners(container);
  }

  // ── Offers Section (Homepage) ─────────────────────────────────────
  function renderOffersSection() {
    const container = document.getElementById("offers-products");
    if (!container) return;
    const offers = allProducts.filter(p => p.offer && p.available);
    if (offers.length === 0) {
      container.closest("section").style.display = "none";
      return;
    }
    container.innerHTML = offers.map(p => createProductCardHTML(p)).join("");
    attachCardListeners(container);
  }

  // ── Main Product Grid ─────────────────────────────────────────────
  function renderProductGrid(products, headingText = "") {
    const container = document.getElementById("product-grid");
    const heading = document.getElementById("products-heading");
    if (!container) return;

    if (heading) heading.textContent = headingText || getCategoryLabel();

    if (products.length === 0) {
      container.innerHTML = `
        <div class="empty-state" id="empty-products-state">
          <div class="empty-state-icon">🔍</div>
          <p class="empty-state-title">No products found</p>
          <p class="empty-state-subtitle">Try a different search or category.</p>
        </div>`;
      return;
    }

    container.innerHTML = products.map(p => createProductCardHTML(p)).join("");
    attachCardListeners(container);
    Cart.syncProductCardButtons();
  }

  function applyFilters() {
    let filtered = activeCategory === "all"
      ? allProducts
      : allProducts.filter(p => p.category === activeCategory);
    if (offersOnly) {
      filtered = filtered.filter(p => p.offer);
    }
    renderProductGrid(filtered);
    Cart.syncProductCardButtons();
  }

  // ── Show only offer products ────────────────────────────────────
  function showOffersOnly() {
    offersOnly = true;
    activeCategory = "all";
    // Update filter pills
    document.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
    const allPill = document.querySelector(".filter-pill[data-category='all']");
    if (allPill) allPill.classList.add("active");
    renderProductGrid(
      allProducts.filter(p => p.offer),
      "Today's Offers"
    );
    Cart.syncProductCardButtons();
  }

  // ── Clear offers filter ─────────────────────────────────────────
  function clearOffersFilter() {
    offersOnly = false;
  }

  function setActiveCategory(categoryId) {
    activeCategory = categoryId;
  }

  function getCategoryLabel() {
    if (activeCategory === "all") return "All Products";
    const cat = allCategories.find(c => c.id === activeCategory);
    return cat ? cat.name : "Products";
  }

  // ── Product Card HTML Builder ──────────────────────────────────────
  function createProductCardHTML(product) {
    const inCart = Cart.getItem(product.id);
    const qty = inCart ? inCart.quantity : 0;

    const hasDiscount = product.mrp && product.mrp > product.price;
    const discountPct = hasDiscount
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

    const priceHTML = hasDiscount
      ? `<span class="price">${STORE_CONFIG.currency}${product.price}</span>
         <span class="mrp">${STORE_CONFIG.currency}${product.mrp}</span>`
      : `<span class="price">${STORE_CONFIG.currency}${product.price}</span>`;

    const discountBurst = (hasDiscount && discountPct > 0)
      ? `<div class="discount-burst" aria-label="${discountPct}% off"><span class="discount-burst-pct">${discountPct}%</span><span class="discount-burst-off">OFF</span></div>`
      : "";

    const offerBadge = product.offer
      ? `<span class="offer-badge">OFFER</span>`
      : "";

    const actionHTML = product.available
      ? `<button class="btn-add-to-cart" data-id="${product.id}" aria-label="Add ${product.name} to cart"
              style="${qty > 0 ? 'display:none' : ''}">
           + Add to Cart
         </button>
         <div class="qty-control" data-id="${product.id}" style="${qty > 0 ? 'display:flex' : 'display:none'}">
           <button class="btn-qty btn-decrease" aria-label="Decrease quantity" data-id="${product.id}">−</button>
           <span class="qty-display">${qty}</span>
           <button class="btn-qty btn-increase" aria-label="Increase quantity" data-id="${product.id}">+</button>
         </div>`
      : `<div class="out-of-stock-badge">Out of Stock</div>`;

    return `
      <div class="product-card" data-product-id="${product.id}" id="card-${product.id}">
        ${offerBadge}
        <div class="product-image-wrap">
          <div class="product-image-crop">
            <img
              src="${product.image}"
              alt="${product.name}"
              class="product-image"
              loading="lazy"
              onerror="this.src='images/placeholder.webp'"
            />
          </div>
          ${discountBurst}
        </div>
        <div class="product-info">
          <h3 class="product-name">${product.name}</h3>
          <p class="product-weight">${product.weight}</p>
          <div class="product-price-row">${priceHTML}</div>
        </div>
        <div class="product-action">
          ${actionHTML}
        </div>
      </div>`;
  }

  // ── Attach click listeners on product cards ────────────────────────
  function attachCardListeners(container) {
    // Find all products in this container
    container.querySelectorAll(".product-card").forEach(card => {
      const pid = card.dataset.productId;
      const product = allProducts.find(p => p.id === pid);
      if (!product) return;

      const addBtn = card.querySelector(".btn-add-to-cart");
      const incBtn = card.querySelector(".btn-increase");
      const decBtn = card.querySelector(".btn-decrease");

      if (addBtn) {
        addBtn.addEventListener("click", () => {
          Cart.add(product);
          // Toggle button/qty control on this card only
          addBtn.style.display = "none";
          const qtyControl = card.querySelector(".qty-control");
          if (qtyControl) {
            qtyControl.style.display = "flex";
            const display = qtyControl.querySelector(".qty-display");
            if (display) display.textContent = "1";
          }
        });
      }

      if (incBtn) {
        incBtn.addEventListener("click", () => {
          Cart.increase(pid);
          const display = card.querySelector(".qty-display");
          const item = Cart.getItem(pid);
          if (display && item) display.textContent = item.quantity;
        });
      }

      if (decBtn) {
        decBtn.addEventListener("click", () => {
          Cart.decrease(pid);
          const item = Cart.getItem(pid);
          const qtyControl = card.querySelector(".qty-control");
          const addBtn = card.querySelector(".btn-add-to-cart");
          if (item) {
            const display = card.querySelector(".qty-display");
            if (display) display.textContent = item.quantity;
          } else {
            // Item removed, show add button
            if (qtyControl) qtyControl.style.display = "none";
            if (addBtn) addBtn.style.display = "block";
          }
        });
      }
    });
  }

  return {
    init,
    renderCategories,
    renderFilterPills,
    renderFeaturedProducts,
    renderOffersSection,
    renderProductGrid,
    applyFilters,
    setActiveCategory,
    showOffersOnly,
    clearOffersFilter
  };
})();
