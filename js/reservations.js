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
  getDoc,
  updateDoc,
  arrayUnion,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {
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

  const userNameElement = document.getElementById("profileName");
  const reservationsContainer = document.getElementById(
    "reservationsContainer"
  );

  // Sign-out button click event
  const signOutBtn = document.getElementById("signOutBtn");
  if (signOutBtn) {
    console.log("signing out");
    signOutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      // Sign out the user
      signOut(auth)
        .then(() => {
          // Redirect to the login page or handle it based on your app flow
          window.location.href = "login.html";
        })
        .catch((error) => {
          console.error("Error signing out:", error);
        });
    });
  }

  async function init() {
    try {
      return await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            const userEmail = user.email;
            fetchAndDisplayUserInfo(userEmail);
            // User is signed in, resolve the promise with user
            unsubscribe();
            resolve(user);
          } else {
            // User is not signed in, resolve with null
            unsubscribe();
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error("Error initializing:", error);
      return null;
    }
  }

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
      userNameElement.textContent = user.fullName;
    }
  }

  async function fetchAndDisplayReservations(userId) {
    try {
      if (!userId) {
        console.error("User ID is undefined or null");
        return;
      }

      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        console.log("User document not found");
        return;
      }

      const reservationsData = userDoc.data().reservations || [];
      renderReservations(reservationsData);
      return reservationsData;
    } catch (error) {
      console.error("Error fetching reservations:", error);
    }
  }

  // Function to render the reservations on the page
  async function renderReservations(reservationsData) {
    if (reservationsContainer) {
      // Clear existing content
      reservationsContainer.innerHTML = "";

      // Iterate over each reservation and create HTML elements
      for (const reservation of reservationsData) {
        // Fetch room data to get the price
        const roomRef = doc(db, "rooms", reservation.roomId);
        const roomSnapshot = await getDoc(roomRef);
        const roomData = roomSnapshot.data();
        const roomPrice = roomData.roomPrice;

        // Calculate total price
        const totalPrice = calculateTotalPrice(
          reservation.checkInDate.toDate().toISOString().split("T")[0],
          reservation.checkOutDate.toDate().toISOString().split("T")[0],
          roomPrice
        );

        const reservationCard = createReservationCard(reservation, totalPrice);
        reservationsContainer.appendChild(reservationCard);
      }
    }
  }

  function createReservationCard(reservation, totalPrice) {
    const card = document.createElement("div");
    card.classList.add("col");

    card.innerHTML = `
      <div class="card h-100">
        <img src="${reservation.roomImage}" class="card-img-top" alt="${
      reservation.roomName
    }" />
        <div class="card-body">
          <h5 class="card-title">${reservation.roomName}</h5>
          <p class="card-text"></p>
          <!-- Additional Details -->
          <p>Status: ${reservation.status}</p>
          <p>Total Price: $${totalPrice}</p>
          <p>Room Type: ${reservation.roomType}</p>
          ${
            reservation.status === "Canceled"
              ? `<button class="btn rebook-btn" data-reservation-id="${reservation.reservationId}" data-room-id="${reservation.roomId}">Re-book</button>`
              : `<button class="btn btn-danger cancel-btn" data-bs-toggle="modal" data-bs-target="#cancelModal${reservation.reservationId}">Cancel reservation</button>`
          }
          <p>
            <button class="btn view-details-btn" data-bs-toggle="modal" data-bs-target="#viewDetailsModal${
              reservation.reservationId
            }">
              View Details
            </button>
          </p>
        </div>
      </div>
      
      <!-- Cancel Modal -->
      <div class="modal fade" id="cancelModal${
        reservation.reservationId
      }" tabindex="-1" aria-labelledby="cancelModalLabel${
      reservation.reservationId
    }" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="cancelModalLabel${
                reservation.reservationId
              }">Cancel Reservation</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p>Are you sure you want to cancel the reservation for ${
                reservation.roomName
              }?</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <button type="button" class="btn " data-bs-dismiss="modal" onclick="cancelReservation('${
                reservation.reservationId
              }', '${reservation.roomId}')">Cancel Reservation</button>
            </div>
          </div>
        </div>
      </div>
  
      <!-- View Details Modal -->
      <div class="modal fade" id="viewDetailsModal${
        reservation.reservationId
      }" tabindex="-1" aria-labelledby="viewDetailsModalLabel${
      reservation.reservationId
    }" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="viewDetailsModalLabel${
                reservation.reservationId
              }">Reservation Details</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <!-- Add details about the reservation here -->
              <p>Reservation ID: ${reservation.reservationId}</p>
              <p>Check-in: ${reservation.checkInDate
                .toDate()
                .toDateString()}</p>
              <p>Check-out: ${reservation.checkOutDate
                .toDate()
                .toDateString()}</p>
              <p>Total Price: $${totalPrice}</p>
              <p>Status: ${reservation.status}
              <!-- Add more details as needed -->
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;

    return card;
  }

  // Function to open the modal with room details and reservation form
  async function openRoomModal(
    reservationId,
    roomId,
    reservationsData,
    selectedReservation
  ) {
    const roomModal = new bootstrap.Modal(document.getElementById("roomModal"));
    const modalBody = document.getElementById("roomModalBody");

    // Find the reservation data from the reservationsData array
    const reservation = reservationsData.find(
      (res) => res.reservationId === reservationId
    );

    if (!reservation) {
      console.error("Reservation not found");
      return;
    }

    console.log("reservation", reservation);

    modalBody.innerHTML = `
        <p><strong>Room Name:</strong> ${selectedReservation.roomName}</p>
        <!-- Add additional room details as needed -->
  
        <!-- Reservation form -->
        <form id="reservationForm">
          <div class="form-group">
            <label for="checkInDate">Check-In Date:</label>
            <input type="date" class="form-control" id="checkInDate" required value="${
              reservation.checkInDate.toDate().toISOString().split("T")[0]
            }">

          </div>
          <div class="form-group">
            <label for="checkOutDate">Check-Out Date:</label>
            <input type="date" class="form-control" id="checkOutDate" required value="${
              reservation.checkOutDate.toDate().toISOString().split("T")[0]
            }">

          </div>
          <div class="form-group">
            <label for="numUsers">Number of Users:</label>
            <input type="number" class="form-control" id="numUsers" required value="${
              reservation.numUsers
            }">
          </div>
        </form>
      `;

    const modalFooter = document.getElementById("modal-footer");
    modalFooter.innerHTML = `
    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
    <button class="btn confirm-reservation-btn" data-reservation-id="${selectedReservation.reservationId}" id="confirmReservationBtn">Confirm Reservation</button>
    `;

    const confirmReservationBtn = document.getElementById(
      "confirmReservationBtn"
    );
    if (confirmReservationBtn) {
      confirmReservationBtn.addEventListener("click", async (event) => {
        // Add async here
        const reservationId = event.target.getAttribute("data-reservation-id");
        const selectedReservation = reservationsData.find(
          (reservation) => reservation.reservationId === reservationId
        );
        if (selectedReservation) {
          // Calculate totalPrice based on the updated reservation details
          const checkInDateValue = document.getElementById("checkInDate").value;
          const checkOutDateValue =
            document.getElementById("checkOutDate").value;

          // Fetch room data to get the price
          const roomRef = doc(db, "rooms", selectedReservation.roomId);
          const roomSnapshot = await getDoc(roomRef);
          const roomData = roomSnapshot.data();
          const roomPrice = roomData.roomPrice;

          // Calculate total price
          const totalPrice = calculateTotalPrice(
            checkInDateValue,
            checkOutDateValue,
            roomPrice
          );

          // Call rebookReservation with updated totalPrice
          rebookReservation(selectedReservation, reservationId, totalPrice);
          roomModal.hide();
        }
      });
    }
    // Explicitly show the modal
    roomModal.show();
  }

  // Function to cancel a reservation
  window.cancelReservation = async function (reservationId) {
    try {
      const user = await init();

      if (user) {
        // Update the reservation status to "Canceled" directly in the user's document
        const userRef = doc(db, "users", auth.currentUser.uid);

        // Fetch the user's document
        const userSnapshot = await getDoc(userRef);
        const userData = userSnapshot.data();

        if (!userData || !userData.reservations) {
          console.error("User or reservations not found");
          return;
        }

        // Find the reservation within the user's reservations array and update its status
        const updatedReservations = userData.reservations.map((reservation) => {
          if (reservation.reservationId === reservationId) {
            return { ...reservation, status: "Canceled" };
          }
          return reservation;
        });

        // Update the user's document with the modified reservations array
        await updateDoc(userRef, { reservations: updatedReservations });

        // Fetch the reservation document
        const reservationDoc = doc(db, "reservations", reservationId);
        const reservationSnapshot = await getDoc(reservationDoc);
        const reservationData = reservationSnapshot.data();

        const originalReservationDetails = { ...reservationData };
        console.log("originalorrh", originalReservationDetails);

        if (!reservationData) {
          console.error("Reservation not found");
          return;
        }

        // Update the reservation status to "Canceled"
        await updateDoc(reservationDoc, { status: "Canceled" });

        // Clear or delete specific fields in the room document
        const roomRef = doc(db, "rooms", reservationData.roomId);
        await updateDoc(roomRef, {
          status: "Available",
          reservedBy: null,
          numUsersReserved: null,
          checkInDate: null,
          checkOutDate: null,
          totalPrice: null,
        });

        Toastify({
          text: "Booking Canceled Successfully!",
          duration: 3000,
          gravity: "top",
          position: "center",
          backgroundColor: "#dfaa5b",
        }).showToast();

        // Fetch and display updated reservations
        fetchAndDisplayReservations(user.uid);
        return originalReservationDetails;
      } else {
        console.log("User is not signed in");
      }
    } catch (error) {
      console.error("Error cancelling reservation:", error);
    }
  };

  // Function to calculate the total price
  function calculateTotalPrice(checkInDate, checkOutDate, roomPrice) {
    const startDate = new Date(checkInDate);
    const endDate = new Date(checkOutDate);
    const numberOfNights = Math.ceil(
      (endDate - startDate) / (1000 * 60 * 60 * 24)
    );
    return numberOfNights * roomPrice;
  }

  window.rebookReservation = async function (
    originalReservationDetails,
    reservationId,
    originalTotalPrice
  ) {
    try {
      console.log("Actually rebooking");
      const user = await init();

      if (user) {
        // Retrieve the latest form data
        const checkInDate = document.getElementById("checkInDate").value;
        const checkOutDate = document.getElementById("checkOutDate").value;
        const numUsers = document.getElementById("numUsers").value;

        // Fetch room data to get the price
        const roomRef = doc(db, "rooms", originalReservationDetails.roomId);
        const roomSnapshot = await getDoc(roomRef);
        const roomData = roomSnapshot.data();
        const roomPrice = roomData.roomPrice;

        // Calculate total price based on the updated values
        const totalPrice = calculateTotalPrice(
          checkInDate,
          checkOutDate,
          roomPrice
        );

        // Update the reservation details in the reservation document
        const reservationDoc = doc(db, "reservations", reservationId);
        await updateDoc(reservationDoc, {
          status: "Reserved",
          checkInDate: new Date(checkInDate),
          checkOutDate: new Date(checkOutDate),
          numUsers: parseInt(numUsers),
          totalPrice: totalPrice,
        });

        // Update the room document with re-booked reservation details
        await updateDoc(roomRef, {
          status: "Reserved",
          reservedBy: user.uid,
          numUsersReserved: parseInt(numUsers),
          checkInDate: new Date(checkInDate),
          checkOutDate: new Date(checkOutDate),
          totalPrice: totalPrice,
        });

        // Update the user's document with the modified reservations array
        const userRef = doc(db, "users", auth.currentUser.uid);
        const userSnapshot = await getDoc(userRef);
        const userData = userSnapshot.data();

        if (!userData || !userData.reservations) {
          console.error("User or reservations not found");
          return;
        }

        const updatedReservations = userData.reservations.map((reservation) => {
          if (reservation.reservationId === reservationId) {
            return {
              ...reservation,
              status: "Reserved",
              checkInDate: new Date(checkInDate),
              checkOutDate: new Date(checkOutDate),
              numUsers: parseInt(numUsers),
              totalPrice: totalPrice,
            };
          }
          return reservation;
        });

        // Update the user's document with the modified reservations array
        await updateDoc(userRef, { reservations: updatedReservations });

        // Fetch and display updated reservations
        fetchAndDisplayReservations(user.uid);

        // Show success message or perform any other necessary actions
        showSuccessModal(
          originalReservationDetails.roomName,
          new Date(checkInDate),
          new Date(checkOutDate),
          parseInt(numUsers),
          originalReservationDetails.roomImage,
          totalPrice
        );
      } else {
        console.log("User is not signed in");
      }
    } catch (error) {
      console.error("Error re-booking reservation:", error);
    }
  };

  // After successfully rebooking a reservation
  function showSuccessModal(
    selectedRoomName,
    checkInDate,
    checkOutDate,
    numUsers,
    selectedRoomImage,
    totalPrice
  ) {
    const successModalBody = document.getElementById("successModalBody");
    successModalBody.innerHTML = `
      <p>Congratulations! You've successfully booked the ${selectedRoomName} room.</p> 
      <p>Date: ${checkInDate.toDateString()} to ${checkOutDate.toDateString()}</p>
      <p>Number of Users: ${numUsers}</p>
      <img src="${selectedRoomImage}" alt="${selectedRoomName}" style="max-width: 100%;">
      <p>Total Price: ${totalPrice}</p>
      `;

    const successModal = new bootstrap.Modal(
      document.getElementById("successModal")
    );
    successModal.show();
  }

  async function initializeAndFetch() {
    const user = await init();

    if (user) {
      console.log("User ID in initializeAndFetch:", user.uid);
      const userId = user.uid;
      const reservationsData = await fetchAndDisplayReservations(userId);
      console.log("soks", reservationsData);

      // Event listener for re-book button
      document.addEventListener("click", function (event) {
        if (event.target && event.target.classList.contains("rebook-btn")) {
          const reservationId = event.target.getAttribute(
            "data-reservation-id"
          );
          const roomId = event.target.getAttribute("data-room-id");
          const selectedReservation = reservationsData.find(
            (reservation) => reservation.reservationId === reservationId
          );
          openRoomModal(
            reservationId,
            roomId,
            reservationsData,
            selectedReservation
          ); // Pass selected reservation to openRoomModal
        }
      });
    } else {
      console.log("User is not signed in");
    }
  }

  initializeAndFetch();
});
