
window.addEventListener("load", () => {
  const signupName = document.getElementById("signupName");
  const signupEmail = document.getElementById("signupEmail");
  const signupPassword = document.getElementById("signupPassword");
  const signinEmail = document.getElementById("signinEmail");
  const signinPassword = document.getElementById("signinPassword");
  const singupSubmit = document.getElementById("signupSubmit");
  const singinSubmit = document.getElementById("signinSubmit");

  const signUpButton = document.getElementById("signUp");
  const signInButton = document.getElementById("signIn");
  const container = document.getElementById("container");

  signUpButton.addEventListener("click", () => {
    container.classList.add("right-panel-active");
  });

  signInButton.addEventListener("click", () => {
    container.classList.remove("right-panel-active");
  });

  singupSubmit.addEventListener("click", () => {
    const signupInfo = {
      signupName: signupName.value,
      signupEmail: signupEmail.value,
      signupPassword: signupPassword.value
    };
    fetch("/api/1.0/user/signup", {
      method: "POST",
      body: JSON.stringify(signupInfo),
      headers: { "Content-Type": "application/json" }
    }).then((response) => {
      return response.json();
    }).then((data) => {
      if (!data.error) {
        window.localStorage.setItem("access_token", data.data.access_token);
        loginSuccess();
        redirect();
      } else {
        swal({
          text: data.error,
          icon: "warning"
        });
      }
    });
  });

  singinSubmit.addEventListener("click", () => {
    const signinInfo = {
      signinEmail: signinEmail.value,
      signinPassword: signinPassword.value
    };

    fetch("/api/1.0/user/signin", {
      method: "POST",
      body: JSON.stringify(signinInfo),
      headers: { "Content-Type": "application/json" }
    }).then((response) => {
      return response.json();
    }).then((data) => {
      if (!data.error) {
        loginSuccess();
        window.localStorage.setItem("access_token", data.data.access_token);
        if (document.referrer == window.location || !document.referrer) {
          document.location.href = "./";
        } else {
          document.location.href = document.referrer;
        }
      } else {
        swal({
          text: data.error,
          icon: "warning"
        });
      }
    });
  });
});

const loginSuccess = function () {
  swal({
    title: "登入成功",
    closeOnEsc: false,
    allowOutsideClick: false,
    icon: "success",
    button: false
  });
};

const redirect = function () {
  if (document.referrer != window.location.href) {
    document.location.href = document.referrer;
  } else {
    document.location.href = "./";
  }
};
