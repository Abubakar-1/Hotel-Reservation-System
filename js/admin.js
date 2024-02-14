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
  addDoc,
  onSnapshot,
  setDoc,
  doc,
  deleteDoc,
  getDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCRGQhErWA-knbMPHKLuSzKmVLJr77jKvo",
  authDomain: "hotel-reservation-system-e7986.firebaseapp.com",
  projectId: "hotel-reservation-system-e7986",
  storageBucket: "hotel-reservation-system-e7986.appspot.com",
  messagingSenderId: "772265433528",
  appId: "1:772265433528:web:5a2509d254f2063e2cd74d",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const adminNameElement = document.getElementById("adminName");

onAuthStateChanged(auth, (user) => {
  if (user) {
    // Admin is signed in, fetch and display admin-specific information
    const adminEmail = user.email;
    fetchAndDisplayAdminInfo(adminEmail);
  } else {
    // Admin is not signed in, handle accordingly
    console.log("Admin is not signed in");
  }
});

function fetchAndDisplayAdminInfo(email) {
  // Use Firestore to fetch admin information based on email
  const adminsRef = collection(db, "admins");
  const adminQuery = query(adminsRef, where("email", "==", email));

  getDocs(adminQuery)
    .then((querySnapshot) => {
      if (!querySnapshot.empty) {
        // Admin found, display personalized content
        const admin = querySnapshot.docs[0].data();
        displayAdminContent(admin);
      } else {
        console.error("Admin not found.");
      }
    })
    .catch((error) => {
      console.error("Error fetching admin information:", error);
    });
}

const signOutBtn = document.getElementById("signOutBtn");
if (signOutBtn) {
  signOutBtn.addEventListener("click", () => {
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

function formatDate(dateString) {
  const date = dateString.toDate();
  return date.toDateString();
}

function renderRooms(roomsData) {
  if (tableBody) {
    // Clear existing rows
    tableBody.innerHTML = "";

    roomsData.forEach((room, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <th scope="row">${index + 1}</th>
        <th scope="row">${room.roomId}</th>
        <td>${room.roomName}</td>
        <td><img src="${room.roomImage}" style="max-width:50px" /></td>
        <td>${room.roomType}</td>
        <td>${room.status}</td>
        <td>${room.roomDescription}</td>
        <td>${room.roomPrice}</td>
        <td><button class="edit-button" data-room-id="${
          room.roomId
        }"><img src="./media/edit.svg"/></button></td>
        <td><button class="delete-button" data-room-id="${
          room.roomId
        }"><img src="./media/del.svg"/></button></td>
      `;
      tableBody.appendChild(row);
    });
  }
}

function displayAdminContent(admin) {
  // Example: Display admin's name on the page
  if (adminNameElement) {
    adminNameElement.textContent = admin.fullName;
  }
}

let roomsData = [];
const addRoomForm = document.getElementById("addRoomForm");
const submitAddRoomBtn = document.getElementById("submitAddRoomBtn");

// Function to add a room with image upload to Firebase Storage

// Modify the submitAddRoomBtn event listener
if (submitAddRoomBtn) {
  if (submitAddRoomBtn) {
    submitAddRoomBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      const roomName = document.getElementById("roomName").value;
      const roomType = document.getElementById("roomType").value;
      const roomDescription = document.getElementById("roomDescription").value;
      const roomPrice = document.getElementById("roomPrice").value;
      const roomImageFile = document.getElementById("roomImage").files[0];
      const status = document.getElementById("roomStatus").value;
      console.log(status);

      addRoomForm.reset();

      const roomObject = {
        roomName,
        roomType,
        roomDescription,
        roomPrice,
        roomImageFile,
        status,
      };

      await addRoom(roomObject);
      await adminDisplayRooms();
    });
  }

  async function addRoom(room) {
    const { roomImageFile, ...roomData } = room;

    try {
      // Upload the image to Firebase Storage
      const storageRef = ref(storage, `roomImages/${roomData.roomName}`);
      const snapshot = await uploadBytes(storageRef, roomImageFile);

      // Get the download URL of the uploaded image
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update the room data with the download URL
      const updatedRoomData = {
        ...roomData,
        roomImage: downloadURL,
      };

      // Add the room data to Firestore with Firestore UID
      const roomsRef = collection(db, "rooms");
      await addDoc(roomsRef, updatedRoomData);
      Toastify({
        text: "Room Added Successfully!",
        duration: 3000,
        gravity: "top", // or "bottom"
        position: "center", // or "left", "center", "right"
        backgroundColor: "#007bff",
      }).showToast();
      console.log("Room added.");
    } catch (error) {
      Toastify({
        text: `Signup error: ${error.message}`,
        duration: 3000,
        gravity: "top", // or "bottom"
        position: "center", // or "left", "center", "right"
        backgroundColor: "red",
      }).showToast();
      console.error("Error adding room:", error);
    }
  }
}

async function adminDisplayRooms() {
  const tableBody = document.querySelector("#adminRoomsTbody");
  const CACHE_KEY = "roomsDataCache";

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

// Add the event listener outside the adminDisplayRooms function
const tableBody = document.querySelector("#adminRoomsTbody");
if (tableBody) {
  tableBody.addEventListener("click", async (e) => {
    const target = e.target;

    // Check if the clicked element is an edit button

    const editButton = target.closest(".edit-button");
    if (editButton) {
      const roomId = editButton.dataset.roomId;
      const row = editButton.closest("tr");
      await handleEdit(roomId, row);
    }

    // Check if the clicked element is a delete button
    const deleteButton = target.closest(".delete-button");
    if (deleteButton) {
      const roomId = deleteButton.dataset.roomId;
      await handleDelete(roomId);
    }
  });
}

async function handleEdit(roomId, row, index) {
  const roomRef = doc(db, "rooms", roomId);
  const roomSnapshot = await getDoc(roomRef);
  const roomData = roomSnapshot.data();

  // Replace table cells with input fields
  row.innerHTML = `
  <td><input disabled type="text" value="${index}"></td>
  <td><input disabled type="text" id="editRoomId" value="${roomId}"></td>
  <td><input type="text" id="editRoomName" value="${roomData.roomName}"></td>
  <td>
      <input type="file" id="editRoomImage">
      <img id="editRoomImagePreview" src="${
        roomData.roomImage
      }" style="max-width:50px" />
    </td>
    <td>
    <select id="editRoomType" class="form-select" required>
      <option value="Standard" ${
        roomData.roomType === "Standard" ? "selected" : ""
      }>Standard Room</option>
      <option value="Deluxe" ${
        roomData.roomType === "Deluxe" ? "selected" : ""
      }>Deluxe Room</option>
      <option value="Suite" ${
        roomData.roomType === "Suite" ? "selected" : ""
      }>Suite</option>
      <option value="Premium" ${
        roomData.roomType === "Premium" ? "selected" : ""
      }>Premium</option>
      <option value="Art Deco" ${
        roomData.roomType === "Art Deco" ? "selected" : ""
      }>Art Deco</option>
      <option value="Vintage" ${
        roomData.roomType === "Vintage" ? "selected" : ""
      }>Vintage</option>
      <option value="Penthouse" ${
        roomData.roomType === "Penthouse" ? "selected" : ""
      }>Penthouse</option>
      <option value="Economy" ${
        roomData.roomType === "Economy" ? "selected" : ""
      }>Economy</option>
      <option value="Business" ${
        roomData.roomType === "Business" ? "selected" : ""
      }>Business</option>
      <option value="Family" ${
        roomData.roomType === "Family" ? "selected" : ""
      }>Family</option>
      <option value="Executive" ${
        roomData.roomType === "Executive" ? "selected" : ""
      }>Executive</option>
    </select>
  </td>
  <td>
    <select id="editRoomStatus">
      <option value="Available" ${
        roomData.status === "Available" ? "selected" : ""
      }>Reserved</option>
      <option value="Reserved" ${
        roomData.status === "Reserved" ? "selected" : ""
      }>Available</option>
    </select>
  </td>
  <td><input type="text" id="editRoomDescription" value="${
    roomData.roomDescription
  }"></td>
  <td><input type="number" id="editRoomPrice" value="${
    roomData.roomPrice
  }"></td>
  
  <td><button class="save-button" data-room-id="${roomId}">Save</button></td>
  <td><button class="cancel-button">Cancel</button></td>
`;

  // Attach event listener to the "Cancel" button
  row.querySelector(".cancel-button").addEventListener("click", () => {
    // Revert changes and update the UI
    adminDisplayRooms();
  });

  // Attach event listener to the "Save" button
  row.querySelector(".save-button").addEventListener("click", async () => {
    const editedRoomName = row.querySelector("#editRoomName").value;
    const editedRoomType = row.querySelector("#editRoomType").value;
    const editedRoomDescription = row.querySelector(
      "#editRoomDescription"
    ).value;
    const editedRoomPrice = parseFloat(
      row.querySelector("#editRoomPrice").value
    );
    const editedRoomStatus = row.querySelector("#editRoomStatus").value;
    const editedRoomImageFile = row.querySelector("#editRoomImage").files[0];
    // Validate edited values
    if (
      !editedRoomName ||
      !editedRoomType ||
      !editedRoomDescription ||
      isNaN(editedRoomPrice) ||
      !editedRoomStatus
    ) {
      alert("Please fill in all fields with valid data.");
      return;
    }

    try {
      let editedRoomImage = roomData.roomImage;
      if (editedRoomImageFile) {
        const storageRef = ref(storage, `roomImages/${editedRoomName}`);
        const snapshot = await uploadBytes(storageRef, editedRoomImageFile);
        editedRoomImage = await getDownloadURL(snapshot.ref);
      }

      const imagePreview = row.querySelector("#editRoomImagePreview");
      if (imagePreview) {
        imagePreview.src = editedRoomImage;
      }
      // Update Firestore document with edited values
      await updateDoc(roomRef, {
        roomName: editedRoomName,
        roomType: editedRoomType,
        roomDescription: editedRoomDescription,
        roomPrice: editedRoomPrice,
        status: editedRoomStatus,
      });
      Toastify({
        text: "Room Updated Successfully!",
        duration: 3000,
        gravity: "top",
        position: "center",
        backgroundColor: "#007bff",
      }).showToast();
      console.log("Room added.");

      // Update UI
      adminDisplayRooms();
    } catch (error) {
      console.error("Error updating room:", error);
    }
  });
}

async function handleDelete(roomId) {
  // Use a confirmation dialog to confirm deletion
  const isConfirmed = confirm("Are you sure you want to delete this room?");

  if (isConfirmed) {
    // Delete the room from Firestore
    const roomRef = doc(db, "rooms", roomId);

    try {
      await deleteDoc(roomRef);
      Toastify({
        text: "Room Deleted Successfully!",
        duration: 3000,
        gravity: "top",
        position: "center",
        backgroundColor: "#007bff",
      }).showToast();
      console.log("Room Deleted.");

      // Refresh the rooms display or update the UI as needed
      adminDisplayRooms();
    } catch (error) {
      console.error("Error deleting room:", error);
    }
  }
}

// Add a function to fetch and display reservations data
async function adminDisplayReservations() {
  const reservationsTable = document.getElementById("reservationsTable");

  if (reservationsTable) {
    const tableBody = reservationsTable.querySelector("tbody");
    try {
      // Fetch reservations data from Firestore
      const reservationsRef = collection(db, "reservations");
      const querySnapshot = await getDocs(reservationsRef);

      // Clear existing rows
      tableBody.innerHTML = "";

      querySnapshot.forEach((doc) => {
        const reservationData = doc.data();
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${doc.id}</td>
          <td>${reservationData.fullName}</td>
          <td>${reservationData.checkInDate.toDate()}</td>
          <td>${reservationData.checkOutDate.toDate()}</td>
          <td>${reservationData.status}</td>
          <td>
            <a href="admin-reservation-details.html?id=${
              doc.id
            }">View Details</a>
          </td>
        `;
        tableBody.appendChild(row);
      });
    } catch (error) {
      console.error("Error fetching reservations:", error);
    }
  }
}

// Function to extract reservation ID from the URL
function getReservationIdFromUrl() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  return urlParams.get("id");
}

// Function to fetch and display reservation details
async function fetchAndDisplayReservationDetails(reservationId) {
  try {
    // Fetch reservation data from Firestore
    const reservationRef = doc(db, "reservations", reservationId);
    const reservationSnapshot = await getDoc(reservationRef);
    const reservationData = reservationSnapshot.data();

    // Populate the reservation details on the page
    const reservationCard = document.getElementById("reservation-card");
    if (reservationCard) {
      reservationCard.innerHTML = `
        <img src="${
          reservationData.roomImage
        }" class="card-img-top" alt="Room Image" />
        <div class="card-body">
          <h5 class="card-title">Booking ID: ${reservationId}</h5>
          <p>Guest Name: ${reservationData.fullName}</p>
          <p>Check-in Date: ${reservationData.checkInDate.toDate()}</p>
          <p>Check-out Date: ${reservationData.checkOutDate.toDate()}</p>
          <p>Status: ${reservationData.status}</p>
          <p>Room Type: ${reservationData.roomType}</p>
          <p>Total Price: $${reservationData.totalPrice}</p>
          <!-- Add more reservation details as needed -->
        </div>
      `;
    }
  } catch (error) {
    console.error("Error fetching reservation details:", error);
  }
}

// Fetch reservation ID from URL and display reservation details
const reservationId = getReservationIdFromUrl();
if (reservationId) {
  fetchAndDisplayReservationDetails(reservationId);
} else {
  console.error("Reservation ID not found in URL.");
}

const customerListTableBody = document.getElementById("customer-list");

// Call fetchAndDisplayCustomers when the page loads
fetchAndDisplayCustomers();

async function fetchAndDisplayCustomers() {
  if (customerListTableBody) {
    try {
      // Clear existing table content
      customerListTableBody.innerHTML = "";

      // Fetch all customers from Firestore
      const customersSnapshot = await getDocs(collection(db, "users"));

      // Iterate over each customer document
      customersSnapshot.forEach((doc) => {
        const customerData = doc.data();
        const customerId = doc.id;

        // Create a table row for each customer
        const row = document.createElement("tr");
        row.innerHTML = `
                <td>${customerId}</td>
                <td>${customerData.fullName}</td>
                <td>${
                  customerData.phoneNumber ? customerData.phoneNumber : 0
                }</td>
                <td>${customerData.reservations?.length || 0} reservations</td>
                <td>
                    <a href="admin-customer-detail.html?id=${customerId}">
                        <button type="button" class="btn btn-primary">View Details</button>
                    </a>
                  </td>
                   <td><button type="button" class="btn btn-danger" onclick="deleteCustomer('${customerId}')">Delete Customer</button></td>
                
            `;
        customerListTableBody.appendChild(row);
        const viewDetailsButton = row.querySelector(".btn-primary");
        if (viewDetailsButton) {
          viewDetailsButton.addEventListener("click", () => {
            console.log("fetchin it");
            // Fetch and display the details of the clicked customer
            displayCustomerDetails(customerData);
          });
        }
      });
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  }
}

// Function to delete a customer
// Assume deleteCustomer function is responsible for deleting a user
window.deleteCustomer = async function (customerId) {
  try {
    // Confirm deletion
    const confirmDelete = confirm(
      "Are you sure you want to delete this customer?"
    );
    if (confirmDelete) {
      // Delete the customer document from Firestore
      await deleteDoc(doc(db, "users", customerId));

      // Delete the corresponding user from Firebase Authentication
      await deleteUser(auth.currentUser);

      // Reload the page to reflect the changes
      location.reload();
    }
  } catch (error) {
    console.error("Error deleting customer:", error);
  }
};

const customerDetailsContainer = document.getElementById("customer-details");

function displayCustomerDetails(customerData) {
  console.log("customerData", customerData);
  if (customerDetailsContainer) {
    // customerDetailsContainer.innerHTML = "";

    // Create and append customer details elements
    const customerIdParagraph = document.createElement("p");
    customerIdParagraph.innerHTML = `<strong>Customer ID:</strong> ${customerData.uid}`;
    customerDetailsContainer.appendChild(customerIdParagraph);

    const nameParagraph = document.createElement("p");
    nameParagraph.innerHTML = `<strong>Name:</strong> ${customerData.fullName}`;
    customerDetailsContainer.appendChild(nameParagraph);

    const contactParagraph = document.createElement("p");
    contactParagraph.innerHTML = `<strong>Contact:</strong> ${customerData.email}`;
    customerDetailsContainer.appendChild(contactParagraph);

    const bookingHistoryHeading = document.createElement("p");
    bookingHistoryHeading.textContent = "Booking History:";
    customerDetailsContainer.appendChild(bookingHistoryHeading);

    const bookingHistoryList = document.createElement("div");
    bookingHistoryList.classList.add("list-group");
    customerDetailsContainer.appendChild(bookingHistoryList);

    // Iterate over each reservation and create list items
    customerData.reservations.forEach((reservation, index) => {
      const listItem = document.createElement("a");
      listItem.href = `admin-reservation-details.html?id=${reservation.reservationId}`;
      listItem.classList.add("list-group-item", "list-group-item-action");

      const reservationDetails = `
      <div class="d-flex w-100 justify-content-between">
        <h5 class="mb-1">Reservation #${index + 1}</h5>
        <small>${formatDate(reservation.checkInDate)} to ${formatDate(
        reservation.checkOutDate
      )}</small>
      </div>
      <p class="mb-1">Room Type: ${reservation.roomType}</p>
      <small>Guests: ${reservation.numUsers} | Total Price: $${
        reservation.totalPrice
      }</small>
    `;

      listItem.innerHTML = reservationDetails;
      bookingHistoryList.appendChild(listItem);
    });
  }
}

// Function to extract customer ID from URL parameter
function getCustomerIdFromUrl() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  return urlParams.get("id");
}

// Function to fetch and display customer details
async function fetchAndDisplayCustomerDetails(customerId) {
  try {
    // Fetch customer data from Firestore
    const customerRef = doc(db, "users", customerId);
    const customerSnapshot = await getDoc(customerRef);
    const customerData = customerSnapshot.data();

    // Populate the customer details on the page
    displayCustomerDetails(customerData);
  } catch (error) {
    console.error("Error fetching customer details:", error);
  }
}

// Fetch customer ID from URL and display customer details
const customerId = getCustomerIdFromUrl();
if (customerId) {
  fetchAndDisplayCustomerDetails(customerId);
} else {
  console.error("Customer ID not found in URL.");
}

// Call adminDisplayReservations to initially fetch and display the reservations
adminDisplayReservations();

// Call adminDisplayRooms to initially fetch and display the rooms
adminDisplayRooms();

// Call adminDisplayRooms to initially fetch and display the rooms
const unsubscribe = await adminDisplayRooms();
