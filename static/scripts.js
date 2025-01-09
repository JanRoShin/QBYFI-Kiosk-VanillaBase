// Initialize Socket.IO connection
const socket = io();

// Modal handling functions
function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("open");
}

function openModal(modalId) {
  document.getElementById(modalId).classList.add("open");
}

function startNewTransaction() {
  closeModal("successModal");
  openModal("introModal");
}

// Click anywhere on intro modal to start
document.getElementById("introModal").addEventListener("click", function () {
  closeModal("introModal");
  socket.emit("start_coin_acceptance");
});

// Package selection handling
let selectedButton = null;
let voucherDuration = null;

// Configure package buttons
const packageButtons = {
  "btn-5": { amount: 5, duration: "1 hour 30 mins" },
  "btn-15": { amount: 15, duration: "5 hours" },
  "btn-30": { amount: 30, duration: "12 hours" },
};

// Add click handlers to all package buttons
Object.entries(packageButtons).forEach(([buttonId, config]) => {
  document.getElementById(buttonId).addEventListener("click", () => {
    selectedButton = config.amount;
    voucherDuration = config.duration;

    // Update visual selection
    Object.keys(packageButtons).forEach((id) => {
      document.getElementById(id).classList.remove("selected");
    });
    document.getElementById(buttonId).classList.add("selected");
  });
});

// Buy button handler
document.getElementById("buy-btn").addEventListener("click", () => {
  if (selectedButton !== null) {
    const buyButton = document.getElementById("buy-btn");
    buyButton.textContent = "Processing...";
    buyButton.disabled = true;

    socket.emit("voucher_button_click", selectedButton, voucherDuration);
  }
});

// Socket event handlers
socket.on("coin_update", (data) => {
  document.getElementById("coin-count").textContent = `${data.coin_count}.00`;
});

socket.on("update_buttons", (data) => {
  const coinCount = data.coin_count;

  // Update package buttons
  Object.entries(packageButtons).forEach(([buttonId, config]) => {
    const button = document.getElementById(buttonId);
    button.disabled = coinCount < config.amount;
  });

  // Update buy button
  document.getElementById("buy-btn").disabled = coinCount < 5;
});

socket.on("reset_ui", (data) => {
  // Reset coin display
  document.getElementById("coin-count").textContent = `${data.coin_count}.00`;

  // Disable all buttons
  Object.keys(packageButtons).forEach((buttonId) => {
    const button = document.getElementById(buttonId);
    button.disabled = true;
    button.classList.remove("selected");
  });

  // Reset buy button
  const buyButton = document.getElementById("buy-btn");
  buyButton.textContent = "Buy Package";
  buyButton.disabled = true;

  selectedButton = null;
});

socket.on("voucher_dispensed", (data) => {
  openModal("successModal");

  const coinCount = data.coin_count;

  // Handle modal closing based on remaining balance
  document
    .getElementById("successModal")
    .addEventListener("click", function () {
      if (coinCount === 0) {
        startNewTransaction();
      } else {
        closeModal("successModal");
      }
    });

  // Reset buy button
  const buyButton = document.getElementById("buy-btn");
  buyButton.textContent = "Buy Package";
  buyButton.disabled = true;

  selectedButton = null;
});
