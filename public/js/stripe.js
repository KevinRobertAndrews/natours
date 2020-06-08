import axios from "axios";
import { showAlert } from "./alerts";

export const bookTour = async (tourId) => {
  const stripe = Stripe("pk_test_YAcbRpacm352P0PpQYFJIMvf00hsGEZGaT");
  try {
    // 1. Get session from server
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);

    // 2. Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert("error", err);
  }
};
