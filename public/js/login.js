import axios from "axios";
import { showAlert } from "./alerts";

export const login = async (email, password) => {
  try {
    const res = await axios({
      method: "POST",
      url: "http://localhost:3000/api/v1/users/login",
      data: {
        email,
        password,
      },
    });

    if (res.data.status === "success") {
      showAlert("success", "Logged in successfully!");
      window.setTimeout(() => {
        location.assign("/");
      }, 1500);
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: "http://localhost:3000/api/v1/users/logout",
    });

    // 📝 location.reload(true) needs to be set to true so that the browser
    // is forced to do a real reset, instead of reloading from the cache.
    if ((res.data.staus = "success")) window.location.reload(true);
  } catch (err) {
    showAlert("error", "Error logging out! Please try again.");
  }
};
