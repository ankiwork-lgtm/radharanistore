/**
 * app.js — Application bootstrap, data loading, SPA routing, navigation
 * Radha Rani Store
 */

const App = (() => {
  let currentScreen = "home";

  // ── SPA Screen Router ──────────────────────────────────────────────
  function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    const target = document.getElementById(`screen-${screenId}`);
    if (target) {
      target.classList.add("active");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    currentScreen = screenId;

    // Update active state on bottom nav
    document.querySelectorAll(".bottom-nav-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.screen === screenId);
    });

    // Screen-specific hooks
    if (screenId === "cart") Cart.renderCartScreen();
    if (screenId === "checkout") Checkout.renderCheckoutForm();
    if (screenId === "products") Products.applyFilters();

    // Close mobile nav drawer whenever screen changes
    closeMobileNav();
  }

  // ── Show Offers (filter products to offers only) ────────────────────
  function showOffers() {
    showScreen("products");
    Products.showOffersOnly();
  }

  // ── Data Loading with file:// fallback ─────────────────────────────
  async function loadData() {
    // Try fetch first (works on HTTP server / GitHub Pages)
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch("data/products.json"),
        fetch("data/categories.json")
      ]);

      if (!productsRes.ok || !categoriesRes.ok) throw new Error("Fetch failed");

      const products = await productsRes.json();
      const categories = await categoriesRes.json();
      return { products, categories };

    } catch (fetchErr) {
      // Fallback: try XHR (works on some file:// setups)
      try {
        const [products, categories] = await Promise.all([
          xhrLoad("data/products.json"),
          xhrLoad("data/categories.json")
        ]);
        return { products, categories };
      } catch (xhrErr) {
        console.error("App: data load error", xhrErr);
        showLoadError();
        return null;
      }
    }
  }

  function xhrLoad(url) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 0) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            reject(new Error("JSON parse error: " + url));
          }
        } else {
          reject(new Error("XHR failed: " + url));
        }
      };
      xhr.onerror = () => reject(new Error("XHR error: " + url));
      xhr.send();
    });
  }

  function showLoadError() {
    const errorBanner = document.getElementById("load-error-banner");
    if (errorBanner) errorBanner.style.display = "flex";
    const loader = document.getElementById("app-loader");
    if (loader) loader.style.display = "none";
  }

  // ── Mobile Hamburger Nav ────────────────────────────────────────────
  function initHamburger() {
    const btn = document.getElementById("hamburger-btn");
    const drawer = document.getElementById("mobile-nav-drawer");
    if (!btn || !drawer) return;

    btn.addEventListener("click", () => {
      const isOpen = drawer.classList.contains("open");
      if (isOpen) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });

    // Close drawer when clicking outside
    document.addEventListener("click", (e) => {
      if (!btn.contains(e.target) && !drawer.contains(e.target)) {
        closeMobileNav();
      }
    });
  }

  function openMobileNav() {
    const btn = document.getElementById("hamburger-btn");
    const drawer = document.getElementById("mobile-nav-drawer");
    if (!btn || !drawer) return;
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    btn.setAttribute("aria-expanded", "true");
    btn.classList.add("open");
  }

  function closeMobileNav() {
    const btn = document.getElementById("hamburger-btn");
    const drawer = document.getElementById("mobile-nav-drawer");
    if (!btn || !drawer) return;
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    btn.setAttribute("aria-expanded", "false");
    btn.classList.remove("open");
  }

  // ── Navigation Wiring ──────────────────────────────────────────────
  function initNavigation() {
    // Bottom nav buttons
    document.querySelectorAll(".bottom-nav-btn").forEach(btn => {
      btn.addEventListener("click", () => showScreen(btn.dataset.screen));
    });

    // Header & footer nav links (data-nav)
    document.querySelectorAll("[data-nav]").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        showScreen(link.dataset.nav);
      });
    });

    // Shop Now / Browse buttons → products
    document.querySelectorAll("[data-action='browse']").forEach(btn => {
      btn.addEventListener("click", () => {
        Products.clearOffersFilter();
        showScreen("products");
      });
    });

    // Offers action → products filtered to offers
    document.querySelectorAll("[data-action='offers']").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        showOffers();
      });
    });

    // Cart button → cart
    document.querySelectorAll("[data-action='cart']").forEach(btn => {
      btn.addEventListener("click", () => showScreen("cart"));
    });

    // Home button → home
    document.querySelectorAll("[data-action='home']").forEach(btn => {
      btn.addEventListener("click", () => showScreen("home"));
    });

    // WhatsApp direct action → open WhatsApp chat
    document.querySelectorAll("[data-action='whatsapp']").forEach(btn => {
      btn.addEventListener("click", () => {
        window.open(`https://wa.me/${STORE_CONFIG.whatsappNumber}`, "_blank", "noopener");
      });
    });

    // Proceed to order → checkout
    const proceedBtn = document.getElementById("btn-proceed-checkout");
    if (proceedBtn) proceedBtn.addEventListener("click", () => showScreen("checkout"));

    // Back buttons
    document.querySelectorAll(".btn-back[data-nav]").forEach(btn => {
      btn.addEventListener("click", () => showScreen(btn.dataset.nav));
    });

    // Back to checkout from summary
    const summaryBack = document.getElementById("btn-summary-back");
    if (summaryBack) {
      summaryBack.addEventListener("click", () => showScreen("checkout"));
    }

    // Clear cart button
    const clearCartBtn = document.getElementById("btn-clear-cart");
    if (clearCartBtn) {
      clearCartBtn.addEventListener("click", () => {
        if (confirm("Clear all items from your cart?")) {
          Cart.clear();
          Cart.renderCartScreen();
        }
      });
    }

    // Mobile nav drawer links
    document.querySelectorAll(".mobile-nav-link[data-nav]").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        showScreen(link.dataset.nav);
      });
    });
    document.querySelectorAll(".mobile-nav-link[data-action]").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const action = link.dataset.action;
        if (action === "offers") showOffers();
        else if (action === "cart") showScreen("cart");
        else if (action === "browse") { Products.clearOffersFilter(); showScreen("products"); }
      });
    });

    // Wire hamburger
    initHamburger();
  }

  // ── Populate contact screen from config ────────────────────────────
  function populateContactScreen() {
    const fields = {
      "contact-address": STORE_CONFIG.address,
      "contact-phone": STORE_CONFIG.phone,
      "contact-hours": STORE_CONFIG.openingHours,
      "footer-address": STORE_CONFIG.address,
      "footer-phone": STORE_CONFIG.phone,
      "footer-hours": STORE_CONFIG.openingHours
    };
    Object.entries(fields).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value;
    });
    // WhatsApp direct link
    const waLink = document.getElementById("contact-whatsapp-link");
    if (waLink) {
      waLink.href = `https://wa.me/${STORE_CONFIG.whatsappNumber}`;
    }
  }

  // ── App Init ───────────────────────────────────────────────────────
  async function init() {
    // Restore cart from localStorage before anything else
    Cart.load();
    Cart.updateCartBadge();

    // Wire navigation immediately (no data dependency)
    initNavigation();

    // Populate contact info from config
    populateContactScreen();

    // Show loading indicator
    const loader = document.getElementById("app-loader");
    if (loader) loader.style.display = "flex";

    // Load data
    const data = await loadData();
    if (!data) return;

    const { products, categories } = data;

    // Hide loader
    if (loader) loader.style.display = "none";

    // Initialize modules
    Products.init(products, categories);
    Search.init(products, categories);

    // Render homepage sections
    Products.renderCategories();
    Products.renderFilterPills();
    Products.renderFeaturedProducts();
    Products.renderOffersSection();

    // Show home screen
    showScreen("home");

    // Sync any cart state onto already-rendered cards
    Cart.syncProductCardButtons();
  }

  // ── Start ─────────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", init);

  return { showScreen, showOffers, init };
})();
