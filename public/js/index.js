/* eslint-disable */
import "@babel/polyfill";
import { login, logout } from "./login.js";
import displayMap from "./mapbox.js";
import updateSettings from "./updateSettings.js";
import bookTour from "./stripe.js";
import showAlert from "./alerts.js";
import { signup } from "./signup.js";

const mapBox = document.querySelector("#map");
const loginForm = document.querySelector(".form--login");
const signupForm = document.querySelector(".form--signup");
const logoutBtn = document.querySelector(".nav__el--logout");
const updateUserDataForm = document.querySelector(".form-user-data");
const updatePasswordForm = document.querySelector(".form-user-settings");
const bookBtn = document.querySelector("#book-tour");

if (mapBox) {
  const locations = JSON.parse(
    document.querySelector("#map").dataset.locations,
  );
  displayMap(locations);
}
if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.querySelector("#name").value;
    const email = document.querySelector("#email").value;
    const password = document.querySelector("#password").value;
    const passwordConfirm = document.querySelector("#passwordConfirm").value;
    signupForm.querySelector(".btn--signup").textContent = "Signing up...";
    signupForm.querySelector(".btn--signup").disabled = true;
    signup(name, email, password, passwordConfirm);
  });
}
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.querySelector("#email").value;
    const password = document.querySelector("#password").value;
    login(email, password);
  });
}
if (logoutBtn) logoutBtn.addEventListener("click", logout);
if (updateUserDataForm)
  updateUserDataForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append("name", document.querySelector("#name").value);
    form.append("email", document.querySelector("#email").value);
    form.append("photo", document.querySelector("#photo").files[0]);
    updateSettings(form, "data");
  });
if (updatePasswordForm)
  updatePasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    document.querySelector(".btn--save-password").textContent = "Updating...";
    const passwordCurrent = document.querySelector("#password-current").value;
    const password = document.querySelector("#password").value;
    const passwordConfirm = document.querySelector("#password-confirm").value;
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      "password",
    );
    document.querySelector(".btn--save-password").textContent = "Save password";
    document.querySelector("#password-current").value = "";
    document.querySelector("#password").value = "";
    document.querySelector("#password-confirm").value = "";
  });
if (bookBtn)
  bookBtn.addEventListener("click", (e) => {
    e.target.textContent = "Processing...";
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });
const alertMessage = document.querySelector("body").dataset.alert;
if (alertMessage) showAlert("success", alertMessage, 20);
