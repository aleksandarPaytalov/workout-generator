// Offline Page JavaScript

// Check connection status
function updateConnectionStatus() {
  const statusElement = document.getElementById("connectionStatus");
  if (navigator.onLine) {
    statusElement.className = "connection-status online";
    statusElement.innerHTML =
      '<span class="status-dot"></span><span>Back Online!</span>';
  } else {
    statusElement.className = "connection-status";
    statusElement.innerHTML =
      '<span class="status-dot"></span><span>You\'re Offline</span>';
  }
}

// Try to reload the page
function tryAgain() {
  if (navigator.onLine) {
    window.location.reload();
  } else {
    // Show a message that we're still offline
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = "❌ Still Offline";
    btn.style.background = "#ef4444";

    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.style.background = "";
    }, 2000);
  }
}

// Listen for connection changes
window.addEventListener("online", () => {
  updateConnectionStatus();
  // Auto-reload when back online
  setTimeout(() => {
    window.location.reload();
  }, 1000);
});

window.addEventListener("offline", updateConnectionStatus);

// Initial check
updateConnectionStatus();

