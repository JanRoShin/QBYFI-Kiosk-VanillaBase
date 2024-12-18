// /src/script.js

const socket = io();

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

document.getElementById("introModal").addEventListener("click", function () {
  closeModal("introModal");
  socket.emit("start_coin_acceptance");
});

document.getElementById("successModal").addEventListener("click", function () {
  startNewTransaction();
});

// Track the selected package card
let selectedButton = null;

// Add event listeners to the package buttons
document.getElementById("btn-5").addEventListener("click", () => {
  selectedButton = 5; // Store the selected button ID
  // Optional: You can add some visual indication of selection
  document.querySelectorAll(".package-card").forEach((card) => {
    card.classList.remove("selected");
  });
  document.getElementById("btn-5").classList.add("selected");
});

document.getElementById("btn-10").addEventListener("click", () => {
  selectedButton = 10; // Store the selected button ID
  document.querySelectorAll(".package-card").forEach((card) => {
    card.classList.remove("selected");
  });
  document.getElementById("btn-10").classList.add("selected");
});

document.getElementById("btn-15").addEventListener("click", () => {
  selectedButton = 15; // Store the selected button ID
  document.querySelectorAll(".package-card").forEach((card) => {
    card.classList.remove("selected");
  });
  document.getElementById("btn-15").classList.add("selected");
});

document.getElementById("btn-20").addEventListener("click", () => {
  selectedButton = 20; // Store the selected button ID
  document.querySelectorAll(".package-card").forEach((card) => {
    card.classList.remove("selected");
  });
  document.getElementById("btn-20").classList.add("selected");
});

// Handle the "buy" button click
document.getElementById("buy-btn").addEventListener("click", () => {
  const buyButton = document.getElementById("buy-btn");

  if (selectedButton !== null) {
    // Update button state to indicate processing
    buyButton.innerText = "Processing...";
    buyButton.disabled = true;

    // Emit the selected voucher click event
    socket.emit("voucher_button_click", selectedButton);
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
  document.getElementById("btn-10").disabled = coinCount < 10;
  document.getElementById("btn-15").disabled = coinCount < 15;
  document.getElementById("btn-20").disabled = coinCount < 20;

  // Array of button configurations
  const buttons = [
    { id: "btn-5", cost: 5 },
    { id: "buy-btn", cost: 5 },
    { id: "btn-10", cost: 10 },
    { id: "btn-15", cost: 15 },
    { id: "btn-20", cost: 20 },
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
  const buttons = ["btn-5", "btn-10", "btn-15", "btn-20", "buy-btn"];

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

  // Reset the buy button state
  const buyButton = document.getElementById("buy-btn");
  buyButton.innerText = "Buy Package";
  buyButton.disabled = true;

  // Reset selected package
  selectedButton = null;
});
