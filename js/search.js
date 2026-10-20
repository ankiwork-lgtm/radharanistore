/**
 * search.js — Search functionality with debouncing, suggestions dropdown & clear button
 * Radha Rani Store
 */

const Search = (() => {
  let allProducts = [];
  let allCategories = [];
  let debounceTimer = null;

  function init(products, categories = []) {
    allProducts = products;
    allCategories = categories;
    const searchInput = document.getElementById("search-input");
    const headerSearchInput = document.getElementById("header-search-input");
    const headerClearBtn = document.getElementById("header-search-clear");

    // Wire header search clear button
    if (headerClearBtn && headerSearchInput) {
      headerClearBtn.addEventListener("click", () => {
        headerSearchInput.value = "";
        if (searchInput) searchInput.value = "";
        headerClearBtn.style.display = "none";
        hideSuggestions();
        handleSearch("");
      });
    }

    // Wire both search inputs
    [searchInput, headerSearchInput].forEach(input => {
      if (!input) return;

      input.addEventListener("input", (e) => {
        const query = e.target.value.trim();

        // Show/hide clear button for header input
        if (input === headerSearchInput && headerClearBtn) {
          headerClearBtn.style.display = query ? "flex" : "none";
        }

        // Sync both inputs
        [searchInput, headerSearchInput].forEach(other => {
          if (other && other !== e.target) other.value = e.target.value;
        });

        // Show instant suggestions in header dropdown
        if (input === headerSearchInput) {
          if (query.length >= 1) {
            showSuggestions(query);
          } else {
            hideSuggestions();
          }
        }

        // Debounce the full-page product grid search
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          handleSearch(query);
        }, 350);
      });

      // Hide suggestions on blur (with small delay so clicks register)
      if (input === headerSearchInput) {
        input.addEventListener("blur", () => {
          setTimeout(hideSuggestions, 200);
        });
        input.addEventListener("focus", (e) => {
          if (e.target.value.trim().length >= 1) {
            showSuggestions(e.target.value.trim());
          }
        });
        // Submit on Enter
        input.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            hideSuggestions();
            const query = e.target.value.trim();
            if (query) handleSearch(query);
          }
          if (e.key === "Escape") {
            hideSuggestions();
            e.target.blur();
          }
        });
      }
    });
  }

  function handleSearch(query) {
    if (!query) {
      // Restore full product grid with current category filter
      Products.applyFilters();
      return;
    }
    // Navigate to products screen for search results
    App.showScreen("products");
    const results = searchProducts(query, allProducts);
    Products.renderProductGrid(results, `Search results for "${query}"`);
  }

  function searchProducts(query, products) {
    const q = query.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.weight && p.weight.toLowerCase().includes(q))
    );
  }

  // ── Suggestions Dropdown ──────────────────────────────────────────

  function showSuggestions(query) {
    const wrap = document.getElementById("header-search-wrap");
    if (!wrap) return;

    // Remove existing panel
    hideSuggestions();

    const results = searchProducts(query, allProducts).slice(0, 6);
    const panel = document.createElement("div");
    panel.className = "search-suggestions";
    panel.id = "search-suggestions-panel";

    if (results.length === 0) {
      panel.innerHTML = `<div class="search-suggestion-empty">No products found for "<strong>${escapeHtml(query)}</strong>"</div>`;
    } else {
      results.forEach(p => {
        const item = document.createElement("div");
        item.className = "search-suggestion-item";
        item.setAttribute("role", "option");
        item.innerHTML = `
          <span class="sug-icon">${getCategoryIcon(p.category)}</span>
          <div>
            <div class="sug-name">${highlightMatch(p.name, query)}</div>
            <div class="sug-cat">${p.category} · ${p.weight}</div>
          </div>
        `;
        item.addEventListener("mousedown", () => {
          const input = document.getElementById("header-search-input");
          const heroInput = document.getElementById("search-input");
          if (input) input.value = p.name;
          if (heroInput) heroInput.value = p.name;
          const clearBtn = document.getElementById("header-search-clear");
          if (clearBtn) clearBtn.style.display = "flex";
          hideSuggestions();
          App.showScreen("products");
          Products.renderProductGrid([p], p.name);
        });
        panel.appendChild(item);
      });

      // "See all results" footer
      if (results.length >= 1) {
        const footer = document.createElement("div");
        footer.className = "search-suggestion-footer";
        footer.textContent = `See all ${searchProducts(query, allProducts).length} results →`;
        footer.addEventListener("mousedown", () => {
          hideSuggestions();
          handleSearch(query);
        });
        panel.appendChild(footer);
      }
    }

    wrap.appendChild(panel);
  }

  function hideSuggestions() {
    const panel = document.getElementById("search-suggestions-panel");
    if (panel) panel.remove();
  }

  function getCategoryIcon(categoryId) {
    const cat = allCategories.find(c => c.id === categoryId);
    return cat ? cat.icon : "🛒";
  }

  function highlightMatch(text, query) {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return escapeHtml(text);
    return (
      escapeHtml(text.slice(0, idx)) +
      `<mark style="background:rgba(232,61,132,0.15);color:var(--primary);border-radius:2px;">${escapeHtml(text.slice(idx, idx + query.length))}</mark>` +
      escapeHtml(text.slice(idx + query.length))
    );
  }

  function escapeHtml(str) {
    return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  return { init, searchProducts, handleSearch };
})();
