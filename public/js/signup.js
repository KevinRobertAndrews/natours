import axios from "axios";
import { showAlert } from "./alerts";

export const signup = async (name, email, password, passwordConfirm) => {
  try {
    const res = await axios({
      method: "POST",
      url: "/api/v1/users/signup",
      data: {
        name,
        email,
        password,
        passwordConfirm,
        role: "user",
      },
    });

    if (res.data.status === "success") {
      showAlert("success", "You are signed up!");
      window.setTimeout(() => {
        location.assign("/");
      }, 1500);
    }
  } catch (err) {}
};
