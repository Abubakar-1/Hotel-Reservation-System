import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  setDoc,
  doc,
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

console.log("working");

const loginForm = document.getElementById("loginForm");
const loginBtn = document.getElementById("loginBtn");
console.log(loginBtn);
const signupForm = document.getElementById("signupForm");
const signupBtn = document.getElementById("signupBtn");
console.log(signupBtn);

loginBtn.addEventListener("click", () => {
  const email = document.getElementById("email").value;
  console.log(email);
  const password = document.getElementById("password").value;
  console.log(password);

  // Validate inputs
  if (!email || !password) {
    showToast("Please fill in all fields.", "red");
    return;
  }

  // Disable the login button to prevent multiple clicks
  loginBtn.disabled = true;

  // Add the loading class to the login button
  loginBtn.classList.add("loading");

  // Perform login
  loginWithEmailAndPassword(email, password);
});

function loginWithEmailAndPassword(email, password) {
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // User logged in successfully
      const user = userCredential.user;
      // Check if the user is an admin or a regular user
      checkAdminStatus(email);
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      showToast(`Login failed: ${errorMessage}`, "red");
    })
    .finally(() => {
      // Re-enable the login button and remove the loading class
      loginBtn.disabled = false;
      loginBtn.classList.remove("loading");
    });
}

function checkAdminStatus(email) {
  // Use Firestore to check if the user is an admin
  const adminsRef = collection(db, "admins");

  // Query admins collection for the provided email and isAdmin: true
  const adminQuery = query(
    adminsRef,
    where("email", "==", email),
    where("isAdmin", "==", true)
  );

  getDocs(adminQuery)
    .then((querySnapshot) => {
      if (!querySnapshot.empty) {
        // Redirect admin to admin.html
        window.location.href = "admin-reservation-list.html";
      } else {
        // If not admin, check if the user exists as a regular user
        checkUserStatus(email);
      }
    })
    .catch((error) => {
      console.error("Error checking admin status:", error);
      // Show Toastify message or handle differently
      showToast("Error checking admin status. Please try again later.", "red");
    });
}

function checkUserStatus(email) {
  // Use Firestore to check if the user is registered
  const usersRef = collection(db, "users");

  // Query users collection for the provided email
  const userQuery = query(usersRef, where("email", "==", email));

  getDocs(userQuery)
    .then((querySnapshot) => {
      if (!querySnapshot.empty) {
        // Redirect regular user to main.html
        window.location.href = "main.html";
      } else {
        // Show Toastify message indicating user is not registered
        showToast("You are not registered. Please sign up to continue.", "red");
      }
    })
    .catch((error) => {
      console.error("Error checking user status:", error);
      // Show Toastify message or handle differently
      showToast("Error checking user status. Please try again later.", "red");
    });
}

signupBtn.addEventListener("click", () => {
  const fullName = document.getElementById("signupFullName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;
  const confirmPassword = document.getElementById(
    "signupConfirmPassword"
  ).value;
  const phoneNumber = document.getElementById("signupPhoneNumber").value;

  // Validate inputs
  if (!fullName || !email || !password || !confirmPassword || !phoneNumber) {
    showToast("Please fill in all fields.", "red");
    return;
  }

  if (password !== confirmPassword) {
    showToast("Passwords do not match.", "red");
    return;
  }

  // Disable the signup button to prevent multiple clicks
  signupBtn.disabled = true;

  // Add the loading class to the signup button
  signupBtn.classList.add("loading");

  // Perform signup
  signupWithEmailAndPassword(email, password, fullName, phoneNumber);
});

function signupWithEmailAndPassword(email, password, fullName, phoneNumber) {
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // User signed up successfully
      const user = userCredential.user;
      // Save additional user details to Firestore
      return saveUserDetailsToFirestore(user.uid, fullName, email, phoneNumber);
    })
    .then(() => {
      // Redirect to customer home page (you need to define the customer home page)
      window.location.href = "main.html";
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      showToast(`Signup failed: ${errorMessage}`, "red");
    })
    .finally(() => {
      // Re-enable the signup button and remove the loading class
      signupBtn.disabled = false;
      signupBtn.classList.remove("loading");
    });
}

function saveUserDetailsToFirestore(uid, fullName, email, phoneNumber) {
  // Reference to the "users" collection in Firestore
  const usersRef = collection(db, "users");

  // Add a new document with user details using the UID as the document ID
  return setDoc(doc(usersRef, uid), {
    uid: uid,
    fullName: fullName,
    email: email,
    phoneNumber: phoneNumber,
    reservations: [],
  });
}

function showToast(message, bgColor) {
  // You can use your preferred toast library or implement a custom solution
  Toastify({
    text: message,
    duration: 3000,
    gravity: "top",
    position: "center",
    backgroundColor: bgColor || "linear-gradient(to right, #00b09b, #96c93d)",
  }).showToast();
}
