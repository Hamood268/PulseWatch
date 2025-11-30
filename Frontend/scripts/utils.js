const SecurityUtils = {
  sanitizeHTML(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  },

  /**
   * Sanitize input for safe display
   * Removes potentially dangerous content
   */
  sanitizeInput(input) {
    if (typeof input !== "string") return "";

    // Remove script tags and event handlers
    let sanitized = input.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ""
    );
    sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
    sanitized = sanitized.replace(/javascript:/gi, "");

    // Escape HTML entities
    return this.sanitizeHTML(sanitized);
  },

  /**
   * Validate URL format and protocol
   */
  isValidURL(url) {
    if (!url || typeof url !== "string") return false;

    try {
      const urlObj = new URL(url);
      // Only allow http and https protocols
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch (e) {
      return false;
    }
  },

  /**
   * Validate endpoint name
   */
  isValidEndpointName(name) {
    if (!name || typeof name !== "string") return false;

    // Must be 3-100 characters, alphanumeric with spaces, hyphens, underscores
    const nameRegex = /^[a-zA-Z0-9\s\-_]{3,100}$/;
    return nameRegex.test(name.trim());
  },

  /**
   * Validate email format
   */
  isValidEmail(email) {
    if (!email || typeof email !== "string") return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  },

  /**
   * Validate username
   * @param {string} username - Username to validate
   * @param {boolean} allowBypass - Whether to allow owner bypass (for 2-4 char usernames)
   */
  isValidUsername(username, allowBypass = false) {
    if (!username || typeof username !== "string") return false;

    const trimmedUsername = username.trim();

    // If bypass is allowed, accept 2-16 characters
    if (allowBypass) {
      const bypassRegex = /^[a-zA-Z0-9_]{2,16}$/;
      return bypassRegex.test(trimmedUsername);
    }

    // Standard validation: 5-16 characters, alphanumeric with underscores
    const usernameRegex = /^[a-zA-Z0-9_]{5,16}$/;
    return usernameRegex.test(trimmedUsername);
  },

  /**
   * Validate password strength
   */
  isValidPassword(password) {
    if (!password || typeof password !== "string") return false;

    // Minimum 6 characters, at least one letter and one number
    return (
      password.length >= 6 &&
      /[a-zA-Z]/.test(password) &&
      /[0-9]/.test(password)
    );
  },

  /**
   * Check password strength and return feedback
   */
  getPasswordStrength(password) {
    if (!password)
      return { strength: "empty", message: "Password is required" };

    let strength = 0;
    const feedback = [];

    if (password.length >= 6) strength++;
    else feedback.push("at least 6 characters");

    if (password.length >= 12) strength++;

    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    else feedback.push("uppercase and lowercase letters");

    if (/[0-9]/.test(password)) strength++;
    else feedback.push("at least one number");

    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    else feedback.push("special characters");

    const levels = [
      "weak",
      "weak",
      "medium",
      "medium",
      "strong",
      "very strong",
    ];

    return {
      strength: levels[strength],
      score: strength,
      message:
        feedback.length > 0 ? `Add ${feedback.join(", ")}` : "Strong password!",
    };
  },

  /**
   * Sanitize data for storage
   */
  sanitizeForStorage(data) {
    if (typeof data === "string") {
      return this.sanitizeInput(data);
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeForStorage(item));
    }

    if (typeof data === "object" && data !== null) {
      const sanitized = {};
      for (const key in data) {
        if (data.hasOwnProperty(key)) {
          sanitized[key] = this.sanitizeForStorage(data[key]);
        }
      }
      return sanitized;
    }

    return data;
  },
};

/**
 * Validation Utils - Input Validation
 */
const ValidationUtils = {
  /**
   * Check if endpoint URL already exists
   */
  isEndpointDuplicate(url, endpoints) {
    if (!url || !Array.isArray(endpoints)) return false;

    const normalizedUrl = url.trim().toLowerCase();
    return endpoints.some(
      (endpoint) => endpoint.url.trim().toLowerCase() === normalizedUrl
    );
  },

  /**
   * Validate endpoint data before submission
   */
  validateEndpoint(name, url, interval, existingEndpoints) {
    const errors = [];

    // Validate name
    if (!name || !name.trim()) {
      errors.push("Endpoint name is required");
    } else if (!SecurityUtils.isValidEndpointName(name)) {
      errors.push(
        "Endpoint name must be 3-100 characters (letters, numbers, spaces, hyphens, underscores only)"
      );
    }

    // Validate URL
    if (!url || !url.trim()) {
      errors.push("URL is required");
    } else if (!SecurityUtils.isValidURL(url)) {
      errors.push("Invalid URL format. Must start with http:// or https://");
    } else if (this.isEndpointDuplicate(url, existingEndpoints)) {
      errors.push("This endpoint is already being monitored");
    }

    // Validate interval
    const validIntervals = [30, 60, 300, 600, 1800, 3600, 7200];
    if (!validIntervals.includes(parseInt(interval))) {
      errors.push("Invalid check interval selected");
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  },

  /**
   * Validate authentication data
   * @param {boolean} allowBypass - Whether to allow owner bypass for short usernames
   */
  validateAuth(username, email, password, isSignup, allowBypass = false) {
    const errors = [];

    // Validate username with bypass option
    if (!username || !username.trim()) {
      errors.push("Username is required");
    } else if (!SecurityUtils.isValidUsername(username, allowBypass)) {
      if (allowBypass) {
        errors.push(
          "Username must be 2-16 characters (letters, numbers, underscores only)"
        );
      } else {
        errors.push(
          "Username must be 5-16 characters (letters, numbers, underscores only)"
        );
      }
    }

    // Validate email (only for signup)
    if (isSignup) {
      if (!email || !email.trim()) {
        errors.push("Email is required");
      } else if (!SecurityUtils.isValidEmail(email)) {
        errors.push("Invalid email format");
      }
    }

    // Validate password
    if (!password) {
      errors.push("Password is required");
    } else if (!SecurityUtils.isValidPassword(password)) {
      errors.push(
        "Password must be at least 6 characters with letters and numbers"
      );
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  },
};

/**
 * UI Utils - Safe DOM Manipulation & Toast Notifications
 */
const UIUtils = {
  /**
   * Show toast notification
   */
  showToast(message, type = "info", duration = 5000) {
    const container = document.getElementById("toastContainer");
    if (!container) {
      console.error("Toast container not found");
      return;
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;

    const icons = {
      success: "✓",
      error: "✕",
      warning: "⚠",
      info: "ℹ",
    };

    const titles = {
      success: "Success",
      error: "Error",
      warning: "Warning",
      info: "Info",
    };

    toast.innerHTML = `
            <div class="toast-icon">${icons[type] || icons.info}</div>
            <div class="toast-content">
                <div class="toast-title">${titles[type] || titles.info}</div>
                <div class="toast-message">${SecurityUtils.sanitizeHTML(
                  message
                )}</div>
            </div>
            <button class="toast-close" aria-label="Close">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        `;

    container.appendChild(toast);

    // Close button functionality
    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", () => {
      this.removeToast(toast);
    });

    // Auto remove after duration
    setTimeout(() => {
      this.removeToast(toast);
    }, duration);
  },

  /**
   * Remove toast with animation
   */
  removeToast(toast) {
    toast.classList.add("removing");
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 300);
  },

  /**
   * Show error toast
   */
  showError(message) {
    this.showToast(message, "error", 5000);
  },

  /**
   * Show success toast
   */
  showSuccess(message) {
    this.showToast(message, "success", 5000);
  },

  /**
   * Show warning toast
   */
  showWarning(message) {
    this.showToast(message, "warning", 5000);
  },

  /**
   * Show info toast
   */
  showInfo(message) {
    this.showToast(message, "info", 5000);
  },

  /**
   * Show validation errors as toast
   */
  showValidationErrors(errors) {
    if (!Array.isArray(errors) || errors.length === 0) return;

    const errorList = errors
      .map((err) => `• ${SecurityUtils.sanitizeHTML(err)}`)
      .join("<br>");
    this.showError(errorList);
  },

  /**
   * Safely set element text content
   */
  setTextContent(elementId, text) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = SecurityUtils.sanitizeInput(text);
    }
  },

  /**
   * Safely set element HTML with sanitization
   */
  setHTML(elementId, html) {
    const element = document.getElementById(elementId);
    if (element) {
      element.innerHTML = SecurityUtils.sanitizeInput(html);
    }
  },

  /**
   * Format response time from milliseconds
   */
  formatResponseTime(ms) {
    if (!ms && ms !== 0) return "0ms";

    const milliseconds = parseInt(ms);

    if (isNaN(milliseconds)) return "0ms";

    // Less than 1 second - show in ms
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    }

    // 1 second to 59 seconds - show in seconds with 1 decimal
    if (milliseconds < 60000) {
      const seconds = (milliseconds / 1000).toFixed(1);
      return `${seconds}s`;
    }

    // 1 minute or more - show in minutes with 1 decimal
    const minutes = (milliseconds / 60000).toFixed(1);
    return `${minutes}m`;
  },

  /**
   * Create safe endpoint card HTML
   */
  createEndpointCardHTML(endpoint) {
    // Sanitize all endpoint data
    const safeName = SecurityUtils.sanitizeHTML(endpoint.name);
    const safeUrl = SecurityUtils.sanitizeHTML(endpoint.url);
    const safeStatus = SecurityUtils.sanitizeHTML(endpoint.status);
    const safeUptime = SecurityUtils.sanitizeHTML(endpoint.uptime);
    const safeResponseTime = this.formatResponseTime(endpoint.responseTime);
    const safeLastCheck = SecurityUtils.sanitizeHTML(endpoint.lastCheck);
    const safeChecks = SecurityUtils.sanitizeHTML(String(endpoint.checks));

    return `
            <div class="endpoint-card" data-endpoint-id="${endpoint.id}">
                <div class="endpoint-header">
                    <div class="endpoint-info">
                        <div class="endpoint-name">
                            <span class="status-dot ${safeStatus}"></span>
                            ${safeName}
                        </div>
                        <div class="endpoint-url">${safeUrl}</div>
                    </div>
                </div>
                <div class="endpoint-stats">
                    <div class="endpoint-stat">
                        <div class="endpoint-stat-label">Uptime</div>
                        <div class="endpoint-stat-value">${safeUptime}</div>
                    </div>
                    <div class="endpoint-stat">
                        <div class="endpoint-stat-label">Response Time</div>
                        <div class="endpoint-stat-value">${safeResponseTime}</div>
                    </div>
                    <div class="endpoint-stat">
                        <div class="endpoint-stat-label">Last Check</div>
                        <div class="endpoint-stat-value">${safeLastCheck}</div>
                    </div>
                    <div class="endpoint-stat">
                        <div class="endpoint-stat-label">Times Checked</div>
                        <div class="endpoint-stat-value">${safeChecks}</div>
                    </div>
                </div>
            </div>
        `;
  },
};

/**
 * Rate Limiting Utils
 */
const RateLimitUtils = {
  limits: {},

  /**
   * Check if action is rate limited
   */
  isRateLimited(key, maxAttempts = 5, windowMs = 60000) {
    const now = Date.now();

    if (!this.limits[key]) {
      this.limits[key] = { attempts: [], blocked: false };
    }

    const limit = this.limits[key];

    // Remove old attempts outside the window
    limit.attempts = limit.attempts.filter(
      (timestamp) => now - timestamp < windowMs
    );

    // Check if blocked
    if (limit.blocked && limit.attempts.length > 0) {
      const oldestAttempt = Math.min(...limit.attempts);
      if (now - oldestAttempt < windowMs) {
        return true; // Still blocked
      } else {
        limit.blocked = false;
        limit.attempts = [];
      }
    }

    // Check if exceeded limit
    if (limit.attempts.length >= maxAttempts) {
      limit.blocked = true;
      return true;
    }

    // Add attempt
    limit.attempts.push(now);
    return false;
  },

  /**
   * Reset rate limit for a key
   */
  reset(key) {
    if (this.limits[key]) {
      this.limits[key] = { attempts: [], blocked: false };
    }
  },
};

// Export utilities
if (typeof module !== "undefined" && module.exports) {
  module.exports = { SecurityUtils, ValidationUtils, UIUtils, RateLimitUtils };
}
