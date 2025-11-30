const storedUser = sessionStorage.getItem("currentUser");
if (storedUser) {
  fetch("/api/v1/auth/verify", { credentials: "include" })
    .then((response) => {
      if (response.ok) {
        window.location.href = "/dashboard";
      } else {
        sessionStorage.clear();
      }
    })
    .catch(() => sessionStorage.clear());
}

const authForm = document.getElementById("authForm");
const authButton = document.getElementById("authButton");
const emailGroup = document.getElementById("emailGroup");
let isSignup = true;

// Toggle between login and signup
document.addEventListener("click", (e) => {
  if (e.target.id === "authSwitch") {
    isSignup = !isSignup;
    const switchLink = document.getElementById("authSwitch");

    if (isSignup) {
      authButton.textContent = "Sign Up";
      switchLink.parentElement.innerHTML =
        'Already have an account? <a id="authSwitch">Login</a>';
      emailGroup.style.display = "block";
      document.getElementById("email").required = true;
    } else {
      authButton.textContent = "Login";
      switchLink.parentElement.innerHTML =
        'Don\'t have an account? <a id="authSwitch">Sign Up</a>';
      emailGroup.style.display = "none";
      document.getElementById("email").required = false;
    }

    // Clear any validation errors when switching
    authForm.reset();
    document.getElementById("username").setCustomValidity("");
    document.getElementById("email").setCustomValidity("");
    document.getElementById("password").setCustomValidity("");
  }
});

// Handle form submission with security
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Rate limiting check - max 5 attempts per minute
  if (RateLimitUtils.isRateLimited("auth", 5, 60000)) {
    UIUtils.showError("Too many attempts. Please wait a minute and try again.");
    return;
  }

  // Get and sanitize input values
  const username = SecurityUtils.sanitizeInput(
    document.getElementById("username").value.trim()
  );
  const password = document.getElementById("password").value;

  const ownerBypass =
    document.getElementById("username").dataset.ownerBypass === "true";

  // Only get email if signing up
  const email = isSignup
    ? SecurityUtils.sanitizeInput(document.getElementById("email").value.trim())
    : "";

  // Validate inputs with owner bypass flag
  const validation = ValidationUtils.validateAuth(
    username,
    email,
    password,
    isSignup,
    ownerBypass && !isSignup // Only apply bypass for login, not signup
  );

  if (!validation.isValid) {
    UIUtils.showValidationErrors(validation.errors);
    return;
  }

  if (isSignup) {
    const passwordStrength = SecurityUtils.getPasswordStrength(password);
    if (passwordStrength.score < 2) {
      UIUtils.showError(`Weak password. ${passwordStrength.message}`);
      return;
    }
  }

  // Show loading state
  authButton.disabled = true;
  const originalText = authButton.textContent;
  authButton.textContent = isSignup ? "Signing up..." : "Logging in...";

  try {
    const endpoint = isSignup ? "/api/v1/auth/signup" : "/api/v1/auth/login";
    const body = isSignup
      ? { username, email, password }
      : { username, password };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log("Response data:", data);

    if (!response.ok) {
      throw new Error(data.message || "Authentication failed");
    }

    // For signup, show success and switch to login
    if (isSignup) {
      UIUtils.showSuccess("Account created successfully! Please login.");

      // Switch to login form
      isSignup = false;
      authButton.textContent = "Login";
      authButton.disabled = false;

      document.getElementById("authSwitch").parentElement.innerHTML =
        'Don\'t have an account? <a id="authSwitch">Sign Up</a>';
      emailGroup.style.display = "none";
      document.getElementById("email").required = false;

      // Clear form and reset validation
      authForm.reset();
      document.getElementById("username").setCustomValidity("");
      document.getElementById("email").setCustomValidity("");
      document.getElementById("password").setCustomValidity("");

      RateLimitUtils.reset("auth");
      return;
    }

    const currentUser = SecurityUtils.sanitizeForStorage({
      id: data.user.id,
      username: data.user.username,
      email: data.user.email,
      role: data.user.role || "User",
    });

    sessionStorage.setItem("currentUser", JSON.stringify(currentUser));

    // Reset rate limit on success
    RateLimitUtils.reset("auth");

    // Redirect to dashboard
    window.location.href = "/dashboard";
  } catch (error) {
    console.error("Authentication error:", error);
    UIUtils.showError(
      error.message || "Authentication failed. Please try again."
    );

    // Reset button state
    authButton.disabled = false;
    authButton.textContent = originalText;
  }
});

// Prevent form resubmission on page reload
if (window.history.replaceState) {
  window.history.replaceState(null, null, window.location.href);
}

// Add input event listeners for real-time validation feedback
document.getElementById("username").addEventListener("input", (e) => {
  const username = e.target.value.trim();
  const ownerBypass = e.target.dataset.ownerBypass === "true";

  if (ownerBypass && !isSignup) {
    // For login with owner bypass, allow 2-16 characters
    if (username && !SecurityUtils.isValidUsername(username, true)) {
      e.target.setCustomValidity(
        "Username must be 2-16 characters (letters, numbers, underscores only)"
      );
    } else {
      e.target.setCustomValidity("");
    }
  } else {
    // For signup or regular login, enforce 5-16 characters
    if (username && !SecurityUtils.isValidUsername(username, false)) {
      e.target.setCustomValidity(
        "Username must be 5-16 characters (letters, numbers, underscores only)"
      );
    } else {
      e.target.setCustomValidity("");
    }
  }
});

document.getElementById("email").addEventListener("input", (e) => {
  const email = e.target.value.trim();
  if (email && !SecurityUtils.isValidEmail(email)) {
    e.target.setCustomValidity("Please enter a valid email address");
  } else {
    e.target.setCustomValidity("");
  }
});

document.getElementById("password").addEventListener("input", (e) => {
  const password = e.target.value;
  if (password && !SecurityUtils.isValidPassword(password)) {
    e.target.setCustomValidity(
      "Password must be at least 6 characters with letters and numbers"
    );
  } else {
    e.target.setCustomValidity("");
  }
});
