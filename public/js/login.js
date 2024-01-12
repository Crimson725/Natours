/* eslint-disable */
const login = (email, password) => {
  fetch("/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => {
      if (res.redirected) window.location.href = res.url;
      else if (res.status === 401) {
        document.querySelector(".error").innerHTML =
          "Invalid email or password";
      }
    })
    .catch((err) => console.log(err));
};
document.querySelector(".form").addEventListener("submit", (e) => {
  e.preventDefault();
  const email = document.querySelector("#email").value;
  const password = document.querySelector("#password").value;
  const data = { email, password };
  fetch("/login", {
    method: "POST",
    body: JSON.stringify(data),
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => {
      if (res.redirected) window.location.href = res.url;
      else if (res.status === 401) {
        document.querySelector(".error").innerHTML =
          "Invalid email or password";
      }
    })
    .catch((err) => console.log(err));
});
