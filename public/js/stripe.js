/* eslint-disable */
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import showAlert from "./alerts.js";

const bookTour = async (tourId) => {
  const stripe = await loadStripe(
    "pk_test_51OZ0X2DjxG0LY9R08L8rtAXsW6UCYlqtm4CEwbbvzMXLHa9jjsjCUHfWosrVe7s9Kbg3QCFT3lIGPkuzIY4YPu9e005nZBjvJ0",
  );
  try {
    const session = await axios.get(
      `http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`,
    );
    window.location.replace(session.data.session.url);
  } catch (err) {
    showAlert("error", "Error in booking tour! Try again later.");
  }
};
export default bookTour;
