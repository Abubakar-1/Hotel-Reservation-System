import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  getDoc,
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

// Get elements
const profileNameElement = document.getElementById("profileName");
const profileNameElementDoc = document.getElementById("profileNameDoc");
const profileEmailElement = document.getElementById("profileEmail");
const profilePhoneElement = document.getElementById("profilePhone");
const profileDOBElement = document.getElementById("profileDOB");
const profileAddressElement = document.getElementById("profileAddress");

// Listen for auth state changes
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // User is signed in, fetch additional data from Firestore
    const userRef = doc(db, "users", user.uid);
    const userSnapshot = await getDoc(userRef);

    if (userSnapshot.exists()) {
      const userData = userSnapshot.data();
      console.log(userData);
      // Update profile information
      if (profileNameElement)
        profileNameElement.innerHTML = `Welcome, ${userData.fullName}`;
      if (profileNameElementDoc)
        profileNameElementDoc.innerHTML = `Name: ${userData.fullName}`;
      if (profileEmailElement)
        profileEmailElement.innerHTML = `Email: ${user.email}`;
      if (profilePhoneElement)
        profilePhoneElement.innerHTML =
          `Phone Number: ${userData.phoneNumber}` || "N/A";
      if (profileDOBElement)
        profileDOBElement.innerHTML = userData.dateOfBirth || "N/A";
      if (profileAddressElement)
        profileAddressElement.innerHTML = userData.address || "N/A";
    }
  } else {
    // User is signed out
    console.log("No user is signed in");
  }
});

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
