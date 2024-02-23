import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
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

import { openRoomModal } from "./index.js";

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

// Function to fetch and display all rooms
async function fetchAndDisplayRooms() {
  try {
    const roomsRef = collection(db, "rooms");
    const querySnapshot = await getDocs(roomsRef);

    const roomsData = [];

    querySnapshot.forEach((doc) => {
      roomsData.push({
        roomId: doc.id,
        ...doc.data(),
      });
    });
    console.log(roomsData);

    renderRooms(roomsData);
  } catch (error) {
    console.error("Error fetching rooms:", error);
  }
}

// Function to render the rooms on the page
function renderRooms(roomsData) {
  const roomsContainer = document.querySelector(".room-container");
  if (roomsContainer) {
    roomsContainer.innerHTML = ""; // Clear existing content

    roomsData.forEach((roomData) => {
      console.log(roomData);
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

// Call fetchAndDisplayRooms to initially fetch and display the rooms
fetchAndDisplayRooms();
