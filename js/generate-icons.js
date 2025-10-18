// Generate Icons Page JavaScript

const iconSizes = [
  { size: 72, filename: "icon-72x72.png", maskable: false },
  { size: 96, filename: "icon-96x96.png", maskable: false },
  { size: 128, filename: "icon-128x128.png", maskable: false },
  { size: 144, filename: "icon-144x144.png", maskable: false },
  { size: 152, filename: "icon-152x152.png", maskable: false },
  { size: 192, filename: "icon-192x192.png", maskable: false },
  { size: 384, filename: "icon-384x384.png", maskable: false },
  { size: 512, filename: "icon-512x512.png", maskable: false },
  { size: 192, filename: "icon-maskable-192x192.png", maskable: true },
  { size: 512, filename: "icon-maskable-512x512.png", maskable: true },
];

function drawIcon(canvas, size, maskable) {
  const ctx = canvas.getContext("2d");
  canvas.width = size;
  canvas.height = size;

  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, "#8b5cf6"); // Purple
  gradient.addColorStop(0.5, "#7c3aed"); // Darker purple
  gradient.addColorStop(1, "#6d28d9"); // Even darker purple

  // Draw background
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Add safe zone for maskable icons (20% padding)
  const padding = maskable ? size * 0.2 : size * 0.15;
  const iconSize = size - padding * 2;
  const centerX = size / 2;
  const centerY = size / 2;

  // Draw dumbbell icon
  ctx.fillStyle = "white";
  ctx.strokeStyle = "white";
  ctx.lineWidth = size * 0.04;

  // Dumbbell dimensions
  const barWidth = iconSize * 0.5;
  const barHeight = size * 0.04;
  const weightWidth = size * 0.08;
  const weightHeight = iconSize * 0.35;

  // Draw center bar
  ctx.fillRect(
    centerX - barWidth / 2,
    centerY - barHeight / 2,
    barWidth,
    barHeight
  );

  // Draw left weight
  ctx.fillRect(
    centerX - barWidth / 2 - weightWidth,
    centerY - weightHeight / 2,
    weightWidth,
    weightHeight
  );

  // Draw right weight
  ctx.fillRect(
    centerX + barWidth / 2,
    centerY - weightHeight / 2,
    weightWidth,
    weightHeight
  );

  // Draw weight plates (circles on ends)
  const plateRadius = size * 0.06;

  // Left plates
  ctx.beginPath();
  ctx.arc(
    centerX - barWidth / 2 - weightWidth / 2,
    centerY - weightHeight / 2,
    plateRadius,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.beginPath();
  ctx.arc(
    centerX - barWidth / 2 - weightWidth / 2,
    centerY + weightHeight / 2,
    plateRadius,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Right plates
  ctx.beginPath();
  ctx.arc(
    centerX + barWidth / 2 + weightWidth / 2,
    centerY - weightHeight / 2,
    plateRadius,
    0,
    Math.PI * 2
  );
  ctx.fill();
  ctx.beginPath();
  ctx.arc(
    centerX + barWidth / 2 + weightWidth / 2,
    centerY + weightHeight / 2,
    plateRadius,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Add subtle shadow for depth
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
  ctx.shadowBlur = size * 0.02;
  ctx.shadowOffsetX = size * 0.01;
  ctx.shadowOffsetY = size * 0.01;
}

function generateAllIcons() {
  const previewGrid = document.getElementById("previewGrid");
  previewGrid.innerHTML = "";

  iconSizes.forEach((iconConfig) => {
    const previewItem = document.createElement("div");
    previewItem.className = "preview-item";

    const canvas = document.createElement("canvas");
    drawIcon(canvas, iconConfig.size, iconConfig.maskable);

    const label = document.createElement("p");
    label.textContent = iconConfig.filename;

    previewItem.appendChild(canvas);
    previewItem.appendChild(label);
    previewGrid.appendChild(previewItem);
  });

  const status = document.getElementById("status");
  status.className = "status success";
  status.innerHTML =
    '<strong>✓ Success!</strong> All 10 icons generated. Right-click each icon to save, or use "Download All Icons" button.';
}

function downloadAllIcons() {
  const previewGrid = document.getElementById("previewGrid");
  const canvases = previewGrid.querySelectorAll("canvas");

  if (canvases.length === 0) {
    alert('Please generate icons first by clicking "Generate All Icons"');
    return;
  }

  canvases.forEach((canvas, index) => {
    const iconConfig = iconSizes[index];

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = iconConfig.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, "image/png");
  });

  const status = document.getElementById("status");
  status.className = "status success";
  status.innerHTML =
    "<strong>✓ Success!</strong> All 10 icons are downloading. Check your Downloads folder and move them to <code>assets/icons/</code> folder.";
}

// Auto-generate on page load
window.addEventListener("DOMContentLoaded", generateAllIcons);

