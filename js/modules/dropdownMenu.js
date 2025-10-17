/**
 * Dropdown Menu Module
 * Handles dropdown menu functionality for header navigation
 */

const DropdownMenu = (() => {
  "use strict";

  // Private variables
  let dropdown = null;
  let toggleButton = null;
  let menu = null;
  let backdrop = null;
  let isMenuOpen = false;
  let menuItems = [];
  let initialized = false;

  /**
   * Initialize the dropdown menu
   */
  const init = () => {
    if (initialized) {
      console.warn("[DropdownMenu] Already initialized");
      return;
    }

    console.log("[DropdownMenu] Initializing...");

    createDropdown();
    setupEventListeners();

    initialized = true;
    console.log("[DropdownMenu] Initialized successfully");
  };

  /**
   * Create the dropdown menu structure
   */
  const createDropdown = () => {
    console.log("[DropdownMenu] Creating dropdown structure...");

    // Create dropdown container
    dropdown = document.createElement("div");
    dropdown.className = "dropdown-container";

    // Create toggle button
    toggleButton = document.createElement("button");
    toggleButton.className = "dropdown-toggle";
    toggleButton.setAttribute("aria-label", "Menu");
    toggleButton.setAttribute("aria-expanded", "false");
    toggleButton.setAttribute("aria-haspopup", "true");

    // Toggle button icon
    const toggleIcon = document.createElement("span");
    toggleIcon.className = "dropdown-toggle-icon";
    toggleIcon.textContent = "☰"; // Menu icon

    // Toggle button text
    const toggleText = document.createElement("span");
    toggleText.className = "dropdown-toggle-text";
    toggleText.textContent = "Menu";

    // Toggle button arrow
    const toggleArrow = document.createElement("span");
    toggleArrow.className = "dropdown-arrow";
    toggleArrow.textContent = "▼";

    toggleButton.appendChild(toggleIcon);
    toggleButton.appendChild(toggleText);
    toggleButton.appendChild(toggleArrow);

    // Create dropdown menu
    menu = document.createElement("div");
    menu.className = "dropdown-menu";
    menu.setAttribute("role", "menu");

    // Create menu items
    menuItems = [
      {
        id: "history",
        icon: "📋",
        text: "History",
        action: handleHistoryClick,
      },
      {
        id: "install-guide",
        icon: "❓",
        text: "How to Install",
        action: handleInstallGuideClick,
      },
      {
        id: "install-app",
        icon: "📥",
        text: "Install App",
        action: handleInstallAppClick,
      },
    ];

    // Add menu items to menu
    menuItems.forEach((item) => {
      const menuItem = createMenuItem(item);
      menu.appendChild(menuItem);
    });

    // Create backdrop for mobile
    backdrop = document.createElement("div");
    backdrop.className = "dropdown-backdrop";

    // Assemble dropdown
    dropdown.appendChild(toggleButton);
    dropdown.appendChild(menu);

    // Insert dropdown into header
    insertIntoHeader();

    // Add backdrop to body
    document.body.appendChild(backdrop);

    console.log("[DropdownMenu] Dropdown structure created");
  };

  /**
   * Create a menu item element
   */
  const createMenuItem = (item) => {
    const menuItem = document.createElement("button");
    menuItem.className = "dropdown-menu-item";
    menuItem.setAttribute("role", "menuitem");
    menuItem.setAttribute("data-action", item.id);

    const icon = document.createElement("span");
    icon.className = "dropdown-menu-item-icon";
    icon.textContent = item.icon;

    const text = document.createElement("span");
    text.className = "dropdown-menu-item-text";
    text.textContent = item.text;

    menuItem.appendChild(icon);
    menuItem.appendChild(text);

    // Add click handler
    menuItem.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      item.action();
      closeMenu();
    });

    return menuItem;
  };

  /**
   * Insert dropdown into header
   */
  const insertIntoHeader = () => {
    const headerControls = document.querySelector(".header-controls");
    if (headerControls) {
      // Insert at the beginning of header controls
      headerControls.insertBefore(dropdown, headerControls.firstChild);
      console.log("[DropdownMenu] Dropdown inserted into header");
    } else {
      console.error("[DropdownMenu] Header controls not found");
    }
  };

  /**
   * Setup event listeners
   */
  const setupEventListeners = () => {
    // Toggle button click
    toggleButton.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    });

    // Backdrop click
    backdrop.addEventListener("click", () => {
      closeMenu();
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isMenuOpen) {
        closeMenu();
      }
    });

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      if (isMenuOpen && !dropdown.contains(e.target)) {
        closeMenu();
      }
    });

    console.log("[DropdownMenu] Event listeners setup");
  };

  /**
   * Toggle menu open/close
   */
  const toggleMenu = () => {
    if (isMenuOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  /**
   * Open the menu
   */
  const openMenu = () => {
    isMenuOpen = true;

    // Calculate dropdown menu position relative to toggle button
    const toggleRect = toggleButton.getBoundingClientRect();
    const menuTop = toggleRect.bottom + 8; // 8px gap below button
    const menuLeft = toggleRect.left;

    // Set menu position
    menu.style.top = `${menuTop}px`;
    menu.style.left = `${menuLeft}px`;

    menu.classList.add("show");
    toggleButton.classList.add("active");
    toggleButton.setAttribute("aria-expanded", "true");
    backdrop.classList.add("show");
    console.log("[DropdownMenu] Menu opened");
  };

  /**
   * Close the menu
   */
  const closeMenu = () => {
    isMenuOpen = false;
    menu.classList.remove("show");
    toggleButton.classList.remove("active");
    toggleButton.setAttribute("aria-expanded", "false");
    backdrop.classList.remove("show");
    console.log("[DropdownMenu] Menu closed");
  };

  /**
   * Handle History menu item click
   */
  const handleHistoryClick = () => {
    console.log("[DropdownMenu] History clicked");
    // Trigger the existing history button click
    const historyButton = document.querySelector(".history-toggle-btn");
    if (historyButton) {
      historyButton.click();
    }
  };

  /**
   * Handle Install Guide menu item click
   */
  const handleInstallGuideClick = () => {
    console.log("[DropdownMenu] Install Guide clicked");
    // Trigger the existing install guide button click
    const installGuideButton = document.querySelector(".install-guide-btn");
    if (installGuideButton) {
      installGuideButton.click();
    }
  };

  /**
   * Handle Install App menu item click
   */
  const handleInstallAppClick = () => {
    console.log("[DropdownMenu] Install App clicked");
    // Trigger the existing install app button click (dynamically created by service worker)
    const installAppButton = document.querySelector(".pwa-install-btn");
    if (installAppButton) {
      installAppButton.click();
    } else {
      console.warn(
        "[DropdownMenu] Install App button not found - may not be available yet"
      );
    }
  };

  /**
   * Hide original buttons (History, Install Guide, Install App)
   */
  const hideOriginalButtons = () => {
    const buttonsToHide = [".history-toggle-btn", ".install-guide-btn"];

    buttonsToHide.forEach((selector) => {
      const button = document.querySelector(selector);
      if (button) {
        button.style.display = "none";
        console.log(`[DropdownMenu] Hidden button: ${selector}`);
      }
    });

    // Install App button is created dynamically by service worker
    // Set up a MutationObserver to hide it when it appears
    const headerControls = document.querySelector(".header-controls");
    if (headerControls) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.classList && node.classList.contains("pwa-install-btn")) {
              node.style.display = "none";
              console.log(
                "[DropdownMenu] Hidden dynamically added Install App button"
              );
            }
          });
        });
      });

      observer.observe(headerControls, {
        childList: true,
        subtree: false,
      });

      console.log(
        "[DropdownMenu] MutationObserver set up to hide Install App button"
      );
    }

    // Also try to hide it immediately in case it already exists
    setTimeout(() => {
      const installBtn = document.querySelector(".pwa-install-btn");
      if (installBtn) {
        installBtn.style.display = "none";
        console.log("[DropdownMenu] Hidden existing Install App button");
      }
    }, 100);
  };

  /**
   * Show original buttons (for debugging or reverting)
   */
  const showOriginalButtons = () => {
    const buttonsToShow = [
      ".history-toggle-btn",
      ".install-guide-btn",
      ".pwa-install-btn",
    ];

    buttonsToShow.forEach((selector) => {
      const button = document.querySelector(selector);
      if (button) {
        button.style.display = "";
        console.log(`[DropdownMenu] Shown button: ${selector}`);
      }
    });
  };

  // Public API
  return {
    init,
    hideOriginalButtons,
    showOriginalButtons,
  };
})();

// Make available globally
window.DropdownMenu = DropdownMenu;
