/**
 * Installation Guide Module
 * Handles the installation guide modal
 */

class InstallGuide {
  constructor() {
    this.modal = null;
    this.openBtn = null;
    this.closeBtn = null;
    this.overlay = null;
  }

  /**
   * Initialize the install guide
   */
  init() {
    this.modal = document.getElementById("installModal");
    this.openBtn = document.getElementById("installGuideBtn");
    this.closeBtn = document.getElementById("installModalClose");
    this.overlay = document.getElementById("installModalOverlay");

    if (!this.modal || !this.openBtn || !this.closeBtn || !this.overlay) {
      console.warn("[InstallGuide] Required elements not found");
      return;
    }

    this.attachEventListeners();
    Logger.devLog("[InstallGuide] Initialized");
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Open modal
    this.openBtn.addEventListener("click", () => this.open());

    // Close modal
    this.closeBtn.addEventListener("click", () => this.close());
    this.overlay.addEventListener("click", () => this.close());

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modal.classList.contains("active")) {
        this.close();
      }
    });
  }

  /**
   * Open the modal
   */
  open() {
    this.modal.classList.add("active");
    this.modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    Logger.devLog("[InstallGuide] Modal opened");
  }

  /**
   * Close the modal
   */
  close() {
    this.modal.classList.remove("active");
    this.modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    Logger.devLog("[InstallGuide] Modal closed");
  }
}

