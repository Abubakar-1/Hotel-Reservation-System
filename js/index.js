import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  addDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCRGQhErWA-knbMPHKLuSzKmVLJr77jKvo",
  authDomain: "hotel-reservation-system-e7986.firebaseapp.com",
  projectId: "hotel-reservation-system-e7986",
  storageBucket: "hotel-reservation-system-e7986.appspot.com",
  messagingSenderId: "772265433528",
  appId: "1:772265433528:web:5a2509d254f2063e2cd74d",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Check if the current page is reservations.html
const userNameElement = document.getElementById("profileName");
const roomsContainer = document.querySelector("#rooms");
const modalBody = document.getElementById("roomModalBody");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userEmail = user.email;
    fetchAndDisplayUserInfo(userEmail);
    // User is signed in, fetch additional data from Firestore
    const userRef = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userRef);

    if (userSnapshot.exists()) {
      const userData = userSnapshot.data();
      // Update the user object with additional data
      user.fullName = userData.fullName;
      user.phoneNumber = userData.phoneNumber;
      // Now user object will have additional properties
      console.log(user);
    } else {
      console.error("User data not found in Firestore");
    }
  } else {
    console.error("No user is signed in");
  }
});

function fetchAndDisplayUserInfo(email) {
  // Use Firestore to fetch user information based on email
  const usersRef = collection(db, "users");
  const userQuery = query(usersRef, where("email", "==", email));

  getDocs(userQuery)
    .then((querySnapshot) => {
      if (!querySnapshot.empty) {
        // User found, display personalized content
        const user = querySnapshot.docs[0].data();

        displayUserContent(user);
      } else {
        console.error("User not found.");
      }
    })
    .catch((error) => {
      console.error("Error fetching user information:", error);
    });
}

function displayUserContent(user) {
  // Example: Display user's name on the page
  if (userNameElement) {
    userNameElement.innerHTML = `Welcome, ${user.fullName}`;
  }
}

// Function to fetch and display all rooms
const CACHE_KEY = "roomsDataCache";

// Function to fetch and display all rooms
async function fetchAndDisplayRooms() {
  try {
    // Attempt to fetch data from cache
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      const roomsData = JSON.parse(cachedData);
      renderRooms(roomsData);
    }

    // Fetch the rooms data from Firestore
    const roomsRef = collection(db, "rooms");
    const querySnapshot = await getDocs(roomsRef);

    const roomsData = [];

    querySnapshot.forEach((doc) => {
      roomsData.push({
        roomId: doc.id,
        ...doc.data(),
      });
    });

    // Save data to cache
    localStorage.setItem(CACHE_KEY, JSON.stringify(roomsData));

    // Render the rooms data
    renderRooms(roomsData);
  } catch (error) {
    console.error("Error fetching rooms:", error);
  }
}

// Function to render the rooms on the page
function renderRooms(roomsData) {
  if (roomsContainer) {
    // Clear existing content
    roomsContainer.innerHTML = "";

    // Iterate over each room and create HTML elements
    roomsData.forEach((roomData) => {
      const roomCard = createRoomCard(roomData);
      roomsContainer.appendChild(roomCard);
    });
  }
}

// Function to create a card element for a room
function createRoomCard(roomData) {
  const article = document.createElement("article");
  article.classList.add("room");

  const cardBody = document.createElement("div");
  cardBody.classList.add("body-card");

  const imgContainer = document.createElement("div");
  imgContainer.classList.add("img-container");

  const image = document.createElement("img");
  image.classList.add("room-img");
  image.setAttribute("src", roomData.roomImage);
  image.setAttribute("alt", roomData.roomName);

  const icon = document.createElement("i");
  const iconImage = document.createElement("img");
  iconImage.classList.add("icon-img");
  iconImage.setAttribute("src", "media/figma/cart-shopping-svgrepo-com.svg");
  icon.appendChild(iconImage);
  icon.classList.add("fas", "fa-shopping-cart");

  const reserveButton = document.createElement("button");
  reserveButton.classList.add("bag-btn");
  reserveButton.setAttribute("data-toggle", "modal");
  reserveButton.setAttribute("data-target", "#roomModal");
  reserveButton.setAttribute("data-room-id", roomData.roomId);
  reserveButton.setAttribute("data-room-name", roomData.roomName);
  reserveButton.setAttribute("data-room-description", roomData.roomDescription);
  reserveButton.setAttribute("data-room-image", roomData.roomImage);
  reserveButton.setAttribute("data-room-type", roomData.roomType);
  reserveButton.setAttribute("data-room-price", roomData.roomPrice);

  const roomDetails = document.createElement("div");
  roomDetails.classList.add("room-details");

  roomDetails.innerHTML = `
  <div class="room-card-body">
    <h2 class="">${roomData.roomName}</h2>
    <p>₦${roomData.roomPrice}</p>
    <p>${roomData.roomType}</p>
    <p>${roomData.roomDescription}</p>
    </div
  `;

  reserveButton.appendChild(icon);
  reserveButton.appendChild(document.createTextNode("Reserve Now"));
  reserveButton.addEventListener("click", () => openRoomModal(reserveButton));
  imgContainer.appendChild(image);
  imgContainer.appendChild(reserveButton);
  cardBody.appendChild(imgContainer);
  cardBody.appendChild(roomDetails);
  article.appendChild(cardBody);

  return article;
}

// Function to open the modal with room details and reservation form
const roomModal = new bootstrap.Modal(document.getElementById("roomModal"));
let roomData = {};
// Function to open the modal with room details and reservation form
export function openRoomModal(reserveButton) {
  roomData = {
    roomId: reserveButton.getAttribute("data-room-id"),
    roomName: reserveButton.getAttribute("data-room-name"),
    roomDescription: reserveButton.getAttribute("data-room-description"),
    roomImage: reserveButton.getAttribute("data-room-image"),
    roomType: reserveButton.getAttribute("data-room-type"),
    roomPrice: reserveButton.getAttribute("data-room-price"),
  };
  console.log(roomData);

  modalBody.innerHTML = `
      <p><strong>Room Name:</strong> ${roomData.roomName}</p>
      <p><strong>Room Description:</strong> ${roomData.roomDescription}</p>
      <p><strong>Room Price:</strong> ₦${roomData.roomPrice}</p>

      <!-- Add additional room details as needed -->

      <!-- Reservation form -->
      <form>
        <div class="form-group">
          <label for="checkInDate">Check-In Date:</label>
          <input type="date" class="form-control" id="checkInDate" required>
        </div>
        <div class="form-group">
          <label for="checkOutDate">Check-Out Date:</label>
          <input type="date" class="form-control" id="checkOutDate" required>
        </div>
        <div class="form-group">
          <label for="numUsers">Number of Users:</label>
          <input type="number" class="form-control" id="numUsers" required>
        </div>
      </form>
    `;

  // Explicitly show the modal
  roomModal.show();
}

// Call fetchAndDisplayRooms to initially fetch and display the rooms
fetchAndDisplayRooms();

function calculateTotalPrice(checkInDate, checkOutDate, roomPrice) {
  const startDate = new Date(checkInDate);
  const endDate = new Date(checkOutDate);
  const numberOfNights = Math.ceil(
    (endDate - startDate) / (1000 * 60 * 60 * 24)
  );
  return numberOfNights * roomPrice;
}

// Sign-out button click event
const signOutBtn = document.getElementById("signOutBtn");
if (signOutBtn) {
  signOutBtn.addEventListener("click", () => {
    // Sign out the user
    signOut(auth)
      .then(() => {
        // Redirect to the login page or handle it based on your app flow
        window.location.href = "index.html";
      })
      .catch((error) => {
        console.error("Error signing out:", error);
      });
  });
}

const successModal = new bootstrap.Modal(
  document.getElementById("successModal")
);
const successModalBody = document.getElementById("successModalBody");

// ...
async function confirmReservation() {
  // Validate the form
  if (validateReservationForm()) {
    // Get the input values
    const checkInDateInput = document.getElementById("checkInDate");
    const checkOutDateInput = document.getElementById("checkOutDate");
    const numUsersInput = document.getElementById("numUsers");
    const checkInDate = new Date(checkInDateInput.value);
    const checkOutDate = new Date(checkOutDateInput.value);
    const numUsers = numUsersInput.value;

    // Calculate total price
    const totalPrice = calculateTotalPrice(
      checkInDate,
      checkOutDate,
      roomData.roomPrice
    );

    // Get the selected room data
    const selectedRoomId = roomData.roomId;
    const selectedRoomName = roomData.roomName;
    const selectedRoomImage = roomData.roomImage;
    const selectedRoomType = roomData.roomType;

    // Get the current user
    const user = auth.currentUser;
    console.log("user", user);

    try {
      // Create a new reservation document with Firestore-generated ID
      const reservationsRef = collection(db, "reservations");
      const reservationDocRef = await addDoc(reservationsRef, {
        fullName: user.fullName,
        roomId: selectedRoomId,
        userId: user.uid,
        roomName: selectedRoomName,
        roomImage: selectedRoomImage,
        status: "Reserved",
        roomType: selectedRoomType,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        numUsers: numUsers,
        totalPrice: totalPrice,
      });

      const reservationId = reservationDocRef.id; // Get the Firestore document ID

      // Update user's reservation array
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        reservations: arrayUnion({
          reservationId: reservationId,
          roomId: selectedRoomId,
          roomName: selectedRoomName,
          roomImage: selectedRoomImage,
          status: "Reserved",
          roomType: selectedRoomType,
          checkInDate: checkInDate,
          checkOutDate: checkOutDate,
          numUsers: numUsers,
          totalPrice: totalPrice,
        }),
      });

      // Update room availability
      const roomRef = doc(db, "rooms", selectedRoomId);
      await updateDoc(roomRef, {
        status: "Reserved",
        reservedBy: user.uid,
        numUsersReserved: numUsers,
        checkInDate: checkInDate,
        checkOutDate: checkOutDate,
        totalPrice: totalPrice,
      });

      // Close the modal after reservation confirmation
      roomModal.hide();

      successModalBody.innerHTML = `
          <p>Congratulations! You've successfully booked the ${selectedRoomName} room.</p> 
          <p>Date: ${checkInDate.toDateString()} to ${checkOutDate.toDateString()}</p>
          <p>Number of Users: ${numUsers}</p>
          <p>Total Price: ₦${totalPrice}</p>
          <img src="${selectedRoomImage}" alt="${selectedRoomName}" style="max-width: 100%;">
        `;
      successModal.show();
    } catch (error) {
      console.error("Error updating Firestore:", error);
      // Handle the error (display a message, log, etc.)
    }
  }
}

const confirmReservationBtn = document.getElementById("confirmReservationBtn");
if (confirmReservationBtn) {
  confirmReservationBtn.addEventListener("click", confirmReservation);
}

function validateReservationForm() {
  const checkInDateInput = document.getElementById("checkInDate");
  const checkOutDateInput = document.getElementById("checkOutDate");
  const numUsersInput = document.getElementById("numUsers");
  const checkInDate = new Date(checkInDateInput.value);
  const checkOutDate = new Date(checkOutDateInput.value);
  const numUsers = numUsersInput.value;

  // Perform your validation logic here
  // Example: Check if fields are not empty and check-out date is after check-in date
  if (
    !checkInDate ||
    !checkOutDate ||
    !numUsers ||
    checkOutDate < checkInDate
  ) {
    // Display an error message or handle validation failure
    // You can use a library like Toastify for displaying messages
    Toastify({
      text: "Please fill in all fields and ensure Check-Out Date is after Check-In Date.",
      duration: 3000,
      close: true,
      gravity: "top",
      position: "center",
      stopOnFocus: true,
      backgroundColor: "red",
      className: "toastify-custom",
    }).showToast();

    return false; // Validation failed
  }

  // Validation succeeded
  return true;
}

const closeBtn = document.querySelector("#roomModal .btn-secondary");
if (closeBtn) {
  closeBtn.addEventListener("click", () => roomModal.hide());
}
