// // /src/script.js

// const socket = io();
// // let transactionActive = false;

// function closeModal(modalId) {
//   document.getElementById(modalId).classList.remove("open");
// }

// function openModal(modalId) {
//   document.getElementById(modalId).classList.add("open");
// }

// function startNewTransaction() {
//   closeModal("successModal");
//   openModal("introModal");
//   // transactionActive = false;
// }

// document.getElementById("introModal").addEventListener("click", function () {
//   closeModal("introModal");
//   //if(!transactionActive) {
// 	//transactionActive = true;
// 	//socket.emit("start_coin_acceptance");
//   //}
//   socket.emit("start_coin_acceptance");
// });

// // Track the selected package card
// let selectedButton = null;
// let voucherDuration = null;

// // Add event listeners to the package buttons
// document.getElementById("btn-5").addEventListener("click", () => {
//   selectedButton = 5; // Store the selected button ID
//   voucherDuration = "1 hour 30 mins"
//   // Optional: You can add some visual indication of selection
//   document.querySelectorAll(".package-card").forEach((card) => {
//     card.classList.remove("selected");
//   });
//   document.getElementById("btn-5").classList.add("selected");
// });

// document.getElementById("btn-15").addEventListener("click", () => {
//   selectedButton = 15; // Store the selected button ID
//   voucherDuration = "5 hours"
//   document.querySelectorAll(".package-card").forEach((card) => {
//     card.classList.remove("selected");
//   });
//   document.getElementById("btn-15").classList.add("selected");
// });

// document.getElementById("btn-30").addEventListener("click", () => {
//   selectedButton = 30; // Store the selected button ID
//   voucherDuration = "12 hours"
//   document.querySelectorAll(".package-card").forEach((card) => {
//     card.classList.remove("selected");
//   });
//   document.getElementById("btn-30").classList.add("selected");
// });

// // Handle the "buy" button click
// document.getElementById("buy-btn").addEventListener("click", () => {
//   const buyButton = document.getElementById("buy-btn");

//   if (selectedButton !== null) {
//     // Update button state to indicate processing
//     buyButton.innerText = "Processing...";
//     buyButton.disabled = true;

//     // Emit the selected voucher click event
//     socket.emit("voucher_button_click", selectedButton, voucherDuration);
//   } else {
//     alert("Please select a voucher first.");
//   }

//   document.querySelectorAll(".package-card").forEach((card) => {
//     card.classList.remove("selected");
//   });
// });

// socket.on("coin_update", (data) => {
//   document.getElementById("coin-count").innerText = `${data.coin_count}.00`;
// });

// socket.on("update_buttons", (data) => {
//   const coinCount = data.coin_count;

//   document.getElementById("buy-btn").disabled = coinCount < 5;

//   document.getElementById("btn-5").disabled = coinCount < 5;
//   document.getElementById("btn-15").disabled = coinCount < 15;
//   document.getElementById("btn-30").disabled = coinCount < 30;

//   // Array of button configurations
//   const buttons = [
//     { id: "btn-5", cost: 5 },
//     { id: "buy-btn", cost: 5 },
//     { id: "btn-15", cost: 15 },
//     { id: "btn-30", cost: 30 }
//   ];

//   // Iterate through buttons to enable/disable and update class
//   buttons.forEach((button) => {
//     const btnElement = document.getElementById(button.id);
//     const isDisabled = coinCount < button.cost;

//     // Add or remove the 'dimmed' class based on disabled state
//     if (isDisabled) {
//       btnElement.classList.add("dimmed");
//     } else {
//       btnElement.classList.remove("dimmed");
//     }
//   });
// });

// socket.on("reset_ui", (data) => {
//   document.getElementById("coin-count").innerText = `${data.coin_count}.00`;

//   // Array of button configurations
//   const buttons = ["btn-5", "btn-15", "btn-30", "buy-btn"];

//   // Reset button states and apply 'dimmed' class
//   buttons.forEach((buttonId) => {
//     const btnElement = document.getElementById(buttonId);
//     btnElement.disabled = true; // Disable the button
//     btnElement.classList.add("dimmed"); // Add the 'dimmed' class
//   });

//   // Reset the buy button text
//   const buyButton = document.getElementById("buy-btn");
//   buyButton.innerText = "Buy Package";
//   buyButton.disabled = true;

//   // Reset selected package
//   selectedButton = null;
// });

// socket.on("voucher_dispensed", (data) => {

// 	// Open the success modal
// 	  openModal("successModal");

//   const coinCount = data.coin_count;

//   document.getElementById("successModal").addEventListener("click", function () {
// 	 if (coinCount ==0) {
// 	  startNewTransaction();
//    } else {
// 	   closeModal("successModal");
//    }

// });

//   // Reset the buy button state
//   const buyButton = document.getElementById("buy-btn");
//   buyButton.innerText = "Buy Package";
//   buyButton.disabled = true;

//   // Reset selected package
//   selectedButton = null;
// });

const socket = io();
let isProcessing = false;

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove("open");
}

function openModal(modalId) {
  document.getElementById(modalId).classList.add("open");
}

function startNewTransaction() {
  closeModal("successModal");
  openModal("introModal");
  isProcessing = false;
  resetUI();
}

function resetUI() {
  document.getElementById("coin-count").innerText = "0.00";
  const buttons = ["btn-5", "btn-15", "btn-30", "buy-btn"];

  buttons.forEach((buttonId) => {
    const btnElement = document.getElementById(buttonId);
    btnElement.disabled = true;
    btnElement.classList.add("dimmed");
  });

  selectedButton = null;
  voucherDuration = null;
  document.getElementById("buy-btn").innerText = "Buy Package";
}

// Initialize the transaction when clicking the intro modal
document.getElementById("introModal").addEventListener("click", function () {
  if (!isProcessing) {
    closeModal("introModal");
    isProcessing = true;
    socket.emit("start_coin_acceptance");
  }
});

// Track the selected package
let selectedButton = null;
let voucherDuration = null;

// Package selection handlers with debouncing
const createPackageHandler = (amount, duration) => {
  return () => {
    if (isProcessing) {
      selectedButton = amount;
      voucherDuration = duration;

      document.querySelectorAll(".package-card").forEach((card) => {
        card.classList.remove("selected");
      });
      document.getElementById(`btn-${amount}`).classList.add("selected");
    }
  };
};

// Add event listeners to package buttons
document
  .getElementById("btn-5")
  .addEventListener("click", createPackageHandler(5, "1 hour 30 mins"));
document
  .getElementById("btn-15")
  .addEventListener("click", createPackageHandler(15, "5 hours"));
document
  .getElementById("btn-30")
  .addEventListener("click", createPackageHandler(30, "12 hours"));

// Buy button handler with debouncing
document.getElementById("buy-btn").addEventListener("click", () => {
  if (!isProcessing || !selectedButton) return;

  const buyButton = document.getElementById("buy-btn");
  if (buyButton.disabled) return;

  // Prevent multiple clicks
  buyButton.disabled = true;
  buyButton.innerText = "Processing...";

  // Emit the purchase event
  socket.emit("voucher_button_click", selectedButton, voucherDuration);
});

// Socket event handlers
socket.on("coin_update", (data) => {
  if (isProcessing) {
    document.getElementById("coin-count").innerText = `${data.coin_count}.00`;
  }
});

socket.on("update_buttons", (data) => {
  if (!isProcessing) return;

  const coinCount = data.coin_count;
  const buyButton = document.getElementById("buy-btn");

  // Update buy button state
  buyButton.disabled = coinCount < 5;

  // Configure button states
  const buttons = [
    { id: "btn-5", cost: 5 },
    { id: "btn-15", cost: 15 },
    { id: "btn-30", cost: 30 },
  ];

  buttons.forEach(({ id, cost }) => {
    const button = document.getElementById(id);
    const isDisabled = coinCount < cost;

    button.disabled = isDisabled;
    button.classList.toggle("dimmed", isDisabled);
  });
});

socket.on("reset_ui", (data) => {
  resetUI();
  isProcessing = false;
});

socket.on("voucher_dispensed", (data) => {
  openModal("successModal");
  const coinCount = data.coin_count;

  // Update the coin display
  document.getElementById("coin-count").innerText = `${coinCount}.00`;

  // Reset buy button
  const buyButton = document.getElementById("buy-btn");
  buyButton.innerText = "Buy Package";
  buyButton.disabled = true;

  // Reset package selection
  selectedButton = null;
  document.querySelectorAll(".package-card").forEach((card) => {
    card.classList.remove("selected");
  });
});

socket.on("message", (data) => {
  // You could add a toast or notification system here
  console.log(data.status);
});

// Handle success modal click
document.getElementById("successModal").addEventListener("click", function () {
  const currentCoinCount = parseFloat(
    document.getElementById("coin-count").innerText
  );
  if (currentCoinCount === 0) {
    startNewTransaction();
  } else {
    closeModal("successModal");
  }
});
