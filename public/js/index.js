// 📝 index.js is for getting data from the user interface
// and then delegate actions

import axios from "axios";
import "@babel/polyfill";
import { signup } from "./signup";
import { login, logout } from "./login";
import { displayMap } from "./mapbox";
import { updateSettings } from "./updateSettings";
import { showAlert } from "./alerts";

import { bookTour } from "./stripe";

// DOM ELEMENTS
const mapBox = document.getElementById("map");
const loginForm = document.querySelector(".login-form");
const signupForm = document.querySelector(".signup-form");
const logoutBtn = document.querySelector(".nav__el--logout");
const userDataForm = document.querySelector(".form-user-data");
const userPasswordForm = document.querySelector(".form-user-password");
const bookBtn = document.getElementById("book-tour");

// DELEGATION
if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    login(email, password);
  });
}

if (signupForm) {
  signupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("passwordConfirm").value;
    signup(name, email, password, passwordConfirm);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", (event) => {
    event.preventDefault();
    logout();
  });
}

if (userDataForm) {
  userDataForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData();
    form.append("name", document.getElementById("name").value);
    form.append("email", document.getElementById("email").value);
    form.append("photo", document.getElementById("photo").files[0]);

    updateSettings(form, "data");
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    document.querySelector(".btn--save-password").textContent = "Updating...";

    const passwordCurrent = document.getElementById("password-current").value;
    const password = document.getElementById("password").value;
    const passwordConfirm = document.getElementById("password-confirm").value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      "password"
    );

    document.getElementById("password-current").value = "";
    document.getElementById("password").value = "";
    document.getElementById("password-confirm").value = "";
    document.querySelector(".btn--save-password").textContent = "Save password";
  });
}

// ✏️ TODO: Finish implementing mapBox
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (bookBtn)
  bookBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.target.textContent = "Processing...";
    const { tourId } = event.target.dataset;
    bookTour(tourId);
  });

const alertMessage = document.querySelector("body").dataset.alert;
if (alertMessage) showAlert("success", alertMessage, 20);
