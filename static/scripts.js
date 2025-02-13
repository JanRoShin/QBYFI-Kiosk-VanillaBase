// /src/script.js

const socket = io();
let transactionActive = false;

// Initialize system in inactive state
socket.emit("deactivate_system");

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("open");
}

function openModal(modalId) {
  document.getElementById(modalId).classList.add("open");
}

function startNewTransaction() {
  closeModal("successModal");
  openModal("introModal");
  transactionActive = false;
  socket.emit("deactivate_system"); // Ensure system is deactivated when returning to intro
}

document.getElementById("introModal").addEventListener("click", function () {
  closeModal("introModal");
  if (!transactionActive) {
    transactionActive = true;
    socket.emit("activate_system"); // Activate system only after intro modal is closed
    socket.emit("start_coin_acceptance");
    console.log("Transaction started - Coin system activated");
  }
});

// Track the selected package card
let selectedButton = null;
let voucherDuration = null;

// Add event listeners to the package buttons
document.getElementById("btn-5").addEventListener("click", () => {
  selectedButton = 5; // Store the selected button ID
  voucherDuration = "1 hour 30 mins";
  // Optional: You can add some visual indication of selection
  document.querySelectorAll(".package-card").forEach((card) => {
    card.classList.remove("selected");
  });
  document.getElementById("btn-5").classList.add("selected");
});

document.getElementById("btn-15").addEventListener("click", () => {
  selectedButton = 15; // Store the selected button ID
  voucherDuration = "5 hours";
  document.querySelectorAll(".package-card").forEach((card) => {
    card.classList.remove("selected");
  });
  document.getElementById("btn-15").classList.add("selected");
});

document.getElementById("btn-30").addEventListener("click", () => {
  selectedButton = 30; // Store the selected button ID
  voucherDuration = "12 hours";
  document.querySelectorAll(".package-card").forEach((card) => {
    card.classList.remove("selected");
  });
  document.getElementById("btn-30").classList.add("selected");
});

// Handle the "buy" button click
document.getElementById("buy-btn").addEventListener("click", () => {
  const buyButton = document.getElementById("buy-btn");

  if (selectedButton !== null) {
    // Update button state to indicate processing
    buyButton.innerText = "Processing...";
    buyButton.disabled = true;

    // Emit the selected voucher click event
    socket.emit("voucher_button_click", selectedButton, voucherDuration);
  } else {
    alert("Please select a voucher first.");
  }

  document.querySelectorAll(".package-card").forEach((card) => {
    card.classList.remove("selected");
  });
});

socket.on("coin_update", (data) => {
  document.getElementById("coin-count").innerText = `${data.coin_count}.00`;
});

socket.on("update_buttons", (data) => {
  const coinCount = data.coin_count;

  document.getElementById("buy-btn").disabled = coinCount < 5;

  document.getElementById("btn-5").disabled = coinCount < 5;
  document.getElementById("btn-15").disabled = coinCount < 15;
  document.getElementById("btn-30").disabled = coinCount < 30;

  // Array of button configurations
  const buttons = [
    { id: "btn-5", cost: 5 },
    { id: "buy-btn", cost: 5 },
    { id: "btn-15", cost: 15 },
    { id: "btn-30", cost: 30 },
  ];

  // Iterate through buttons to enable/disable and update class
  buttons.forEach((button) => {
    const btnElement = document.getElementById(button.id);
    const isDisabled = coinCount < button.cost;

    // Add or remove the 'dimmed' class based on disabled state
    if (isDisabled) {
      btnElement.classList.add("dimmed");
    } else {
      btnElement.classList.remove("dimmed");
    }
  });
});

socket.on("reset_ui", (data) => {
  document.getElementById("coin-count").innerText = `${data.coin_count}.00`;

  // Array of button configurations
  const buttons = ["btn-5", "btn-15", "btn-30", "buy-btn"];

  // Reset button states and apply 'dimmed' class
  buttons.forEach((buttonId) => {
    const btnElement = document.getElementById(buttonId);
    btnElement.disabled = true; // Disable the button
    btnElement.classList.add("dimmed"); // Add the 'dimmed' class
  });

  // Reset the buy button text
  const buyButton = document.getElementById("buy-btn");
  buyButton.innerText = "Buy Package";
  buyButton.disabled = true;

  // Reset selected package
  selectedButton = null;
});

socket.on("voucher_dispensed", (data) => {
  // Open the success modal
  openModal("successModal");

  const coinCount = data.coin_count;

  // Store the timeout ID
  let modalTimeout = setTimeout(() => {
    if (document.getElementById("successModal").classList.contains("open")) {
      if (coinCount === 0) {
        socket.emit("deactivate_system"); // Deactivate system when transaction is complete
        console.log("Transaction complete - Coin system deactivated");
        startNewTransaction();
      } else {
        closeModal("successModal");
      }
    }
  }, 10000);

  // Create the click handler function
  const handleRebuyClick = function () {
    // Clear the timeout when user clicks manually
    clearTimeout(modalTimeout);

    if (coinCount === 0) {
      socket.emit("deactivate_system"); // Deactivate system when transaction is complete
      console.log("Transaction complete - Coin system deactivated");
      startNewTransaction();
    } else {
      closeModal("successModal");
    }

    // Remove the event listener after it's used
    document
      .getElementById("rebuy")
      .removeEventListener("click", handleRebuyClick);
  };

  // If no remaining balance, deactivate system
  if (coinCount === 0) {
    socket.emit("deactivate_system");
    console.log("Transaction complete - Coin system deactivated");
  }

  // Add the click event listener
  document.getElementById("rebuy").addEventListener("click", handleRebuyClick);

  // Reset the buy button state
  const buyButton = document.getElementById("buy-btn");
  buyButton.innerText = "Buy Package";
  buyButton.disabled = true;

  // Reset selected package
  selectedButton = null;
});
