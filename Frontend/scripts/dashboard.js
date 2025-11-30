let currentUser = null;
let endpoints = [];
let selectedInterval = 60;
let editingEndpointId = null;
let editSelectedInterval = 60;
let deletingEndpointId = null;

// Check authentication on page load
async function checkAuth() {
  try {
    const response = await fetch("/api/v1/auth/verify", {
      credentials: "include",
    });

    if (!response.ok) {
      sessionStorage.clear();
      window.location.href = "/";
      return;
    }

    const data = await response.json();
    currentUser = SecurityUtils.sanitizeForStorage(data.user);
    sessionStorage.setItem("currentUser", JSON.stringify(currentUser));

    // Initialize app after auth confirmed
    initializeApp();
  } catch (error) {
    console.error("Auth check failed:", error);
    sessionStorage.clear();
    window.location.href = "/";
  }
}

// Initialize app
function initializeApp() {
  updateUserInfo();
  setupEventDelegation();
  loadEndpoints();
  updateStats();
  startRealTimeUpdates();
}

function setupEventDelegation() {
  const endpointsList = document.getElementById("endpointsList");

  // Remove any existing listeners to prevent duplicates
  const newEndpointsList = endpointsList.cloneNode(false);
  endpointsList.parentNode.replaceChild(newEndpointsList, endpointsList);

  // Add single click handler using event delegation
  newEndpointsList.addEventListener("click", (e) => {
    // Find the button that was clicked (or its parent)
    const editBtn = e.target.closest(".endpoint-edit-btn");
    const deleteBtn = e.target.closest(".endpoint-delete-btn");

    if (editBtn) {
      e.preventDefault();
      e.stopPropagation();
      const endpointId = editBtn.getAttribute("data-endpoint-id");
      openEditModal(endpointId);
    } else if (deleteBtn) {
      e.preventDefault();
      e.stopPropagation();
      const endpointId = deleteBtn.getAttribute("data-endpoint-id");
      openDeleteModal(endpointId);
    }
  });
}

// Load endpoints from backend
async function loadEndpoints() {
  try {
    const response = await fetch("/api/v1/monitors/get", {
      credentials: "include",
    });

    if (response.ok) {
      const data = await response.json();

      // Transform backend data to match frontend expectations
      endpoints = (data.monitors || []).map((monitor) => {
        return {
          id: monitor.monitorId,
          name: monitor.name,
          url: monitor.url,
          status: monitor.status === "Up" ? "online" : "offline",
          uptime: calculateUptime(monitor.history || []),
          responseTime: monitor.lastResponseTime || 0,
          lastCheck: formatLastCheck(monitor.lastCheckedAt),
          lastCheckedAt: monitor.lastCheckedAt,
          interval: monitor.interval,
          checks:
            monitor.history && monitor.history.length >= 100
              ? "100+"
              : monitor.history
              ? monitor.history.length
              : 0,
        };
      });

      renderEndpoints();
      updateStats();
    }
  } catch (error) {
    console.error("Error loading endpoints:", error);
    endpoints = [];
  }
}

// Calculate uptime percentage from history
function calculateUptime(history) {
  if (!history || history.length === 0) return "100%";

  const upCount = history.filter((h) => h.status === "Up").length;
  const percentage = (upCount / history.length) * 100;
  return `${percentage.toFixed(1)}%`;
}

// Format last check time
function formatLastCheck(timestamp) {
  if (!timestamp) return "Never";

  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now - then;

  if (isNaN(diffMs) || diffMs < 0) return "Just now";

  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

// Save endpoint to backend
async function saveEndpoint(endpoint) {
  try {
    const response = await fetch("/api/v1/monitors/new", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(endpoint),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to save endpoint");
    }

    return await response.json();
  } catch (error) {
    console.error("Error saving endpoint:", error);
    throw error;
  }
}

// Update endpoint in backend
async function updateEndpoint(id, endpoint) {
  try {
    const response = await fetch(`/api/v1/monitors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(endpoint),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to update endpoint");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating endpoint:", error);
    throw error;
  }
}

// Delete endpoint from backend
async function deleteEndpoint(id) {
  try {
    const response = await fetch(`/api/v1/monitors/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Failed to delete endpoint");
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting endpoint:", error);
    throw error;
  }
}

// Update user info with sanitization
function updateUserInfo() {
  const initial = SecurityUtils.sanitizeHTML(
    currentUser.username.charAt(0).toUpperCase()
  );
  const username = SecurityUtils.sanitizeHTML(currentUser.username);

  UIUtils.setTextContent("sidebarAvatar", initial);
  UIUtils.setTextContent("sidebarUsername", username);
}

// Mobile menu toggle
const mobileMenuToggle = document.getElementById("mobileMenuToggle");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

mobileMenuToggle.addEventListener("click", () => {
  sidebar.classList.toggle("mobile-open");
  sidebarOverlay.classList.toggle("active");
  document.body.style.overflow = sidebar.classList.contains("mobile-open")
    ? "hidden"
    : "";
});

sidebarOverlay.addEventListener("click", () => {
  sidebar.classList.remove("mobile-open");
  sidebarOverlay.classList.remove("active");
  document.body.style.overflow = "";
});

// Logout functionality
document.getElementById("logoutBtn").addEventListener("click", async (e) => {
  e.preventDefault();

  try {
    await fetch("/api/v1/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch (error) {
    console.error("Logout error:", error);
  }

  sessionStorage.clear();
  window.location.href = "/";
});

// Add Modal Logic
const addEndpointModal = document.getElementById("addEndpointModal");
const addEndpointBtn = document.getElementById("addEndpointBtn");
const closeModal = document.getElementById("closeModal");
const addEndpointForm = document.getElementById("addEndpointForm");

function openModal() {
  addEndpointModal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeModalFunc() {
  addEndpointModal.classList.remove("active");
  document.body.style.overflow = "";
  addEndpointForm.reset();
  selectedInterval = 60;

  document.getElementById("endpointName").setCustomValidity("");
  document.getElementById("endpointUrl").setCustomValidity("");

  document
    .querySelectorAll("#addEndpointForm .interval-option")
    .forEach((opt) => {
      opt.classList.remove("selected");
      if (opt.dataset.interval === "60") {
        opt.classList.add("selected");
      }
    });
}

addEndpointBtn.addEventListener("click", openModal);
closeModal.addEventListener("click", closeModalFunc);
addEndpointModal.addEventListener("click", (e) => {
  if (e.target === addEndpointModal) closeModalFunc();
});

// Edit Modal Logic
const editEndpointModal = document.getElementById("editEndpointModal");
const closeEditModal = document.getElementById("closeEditModal");
const editEndpointForm = document.getElementById("editEndpointForm");

function openEditModal(endpointId) {
  console.log("Opening edit modal for:", endpointId);
  const endpoint = endpoints.find((e) => e.id === endpointId);
  if (!endpoint) {
    console.error("Endpoint not found:", endpointId);
    return;
  }

  editingEndpointId = endpointId;
  editSelectedInterval = endpoint.interval;

  document.getElementById("editEndpointName").value = endpoint.name;
  document.getElementById("editEndpointUrl").value = endpoint.url;

  document
    .querySelectorAll("#editIntervalOptions .interval-option")
    .forEach((opt) => {
      opt.classList.remove("selected");
      if (parseInt(opt.dataset.interval) === endpoint.interval) {
        opt.classList.add("selected");
      }
    });

  editEndpointModal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeEditModalFunc() {
  editEndpointModal.classList.remove("active");
  document.body.style.overflow = "";
  editEndpointForm.reset();
  editingEndpointId = null;
  editSelectedInterval = 60;

  document.getElementById("editEndpointName").setCustomValidity("");
  document.getElementById("editEndpointUrl").setCustomValidity("");
}

closeEditModal.addEventListener("click", closeEditModalFunc);
editEndpointModal.addEventListener("click", (e) => {
  if (e.target === editEndpointModal) closeEditModalFunc();
});

// Delete Modal Logic
const deleteConfirmModal = document.getElementById("deleteConfirmModal");
const closeDeleteModal = document.getElementById("closeDeleteModal");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

function openDeleteModal(endpointId) {
  console.log("Opening delete modal for:", endpointId);
  const endpoint = endpoints.find((e) => e.id === endpointId);
  if (!endpoint) {
    console.error("Endpoint not found:", endpointId);
    return;
  }

  deletingEndpointId = endpointId;
  document.getElementById("deleteEndpointName").textContent = endpoint.name;

  deleteConfirmModal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeDeleteModalFunc() {
  deleteConfirmModal.classList.remove("active");
  document.body.style.overflow = "";
  deletingEndpointId = null;
}

closeDeleteModal.addEventListener("click", closeDeleteModalFunc);
cancelDeleteBtn.addEventListener("click", closeDeleteModalFunc);
deleteConfirmModal.addEventListener("click", (e) => {
  if (e.target === deleteConfirmModal) closeDeleteModalFunc();
});

confirmDeleteBtn.addEventListener("click", async () => {
  if (!deletingEndpointId) return;

  const endpoint = endpoints.find((e) => e.id === deletingEndpointId);
  const endpointName = endpoint ? endpoint.name : "endpoint";

  try {
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.textContent = "Deleting...";

    await deleteEndpoint(deletingEndpointId);
    await loadEndpoints();

    closeDeleteModalFunc();
    UIUtils.showSuccess(`Endpoint "${endpointName}" deleted successfully!`);

    confirmDeleteBtn.disabled = false;
    confirmDeleteBtn.textContent = "Delete Forever";
  } catch (error) {
    console.error("Error deleting endpoint:", error);
    UIUtils.showError(
      error.message || "Failed to delete endpoint. Please try again."
    );

    confirmDeleteBtn.disabled = false;
    confirmDeleteBtn.textContent = "Delete Forever";
  }
});

// Close modals on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (addEndpointModal.classList.contains("active")) {
      closeModalFunc();
    }
    if (editEndpointModal.classList.contains("active")) {
      closeEditModalFunc();
    }
    if (deleteConfirmModal.classList.contains("active")) {
      closeDeleteModalFunc();
    }
  }
});

// Interval selection for Add form
const intervalOptions = document.querySelectorAll(
  "#addEndpointForm .interval-option"
);
intervalOptions.forEach((option) => {
  option.addEventListener("click", () => {
    document
      .querySelectorAll("#addEndpointForm .interval-option")
      .forEach((opt) => opt.classList.remove("selected"));
    option.classList.add("selected");
    selectedInterval = parseInt(option.dataset.interval);
  });
});

// Interval selection for Edit form
const editIntervalOptions = document.querySelectorAll(
  "#editIntervalOptions .interval-option"
);
editIntervalOptions.forEach((option) => {
  option.addEventListener("click", () => {
    document
      .querySelectorAll("#editIntervalOptions .interval-option")
      .forEach((opt) => opt.classList.remove("selected"));
    option.classList.add("selected");
    editSelectedInterval = parseInt(option.dataset.interval);
  });
});

// Real-time validation
document.getElementById("endpointName").addEventListener("input", (e) => {
  const name = e.target.value.trim();
  if (name && !SecurityUtils.isValidEndpointName(name)) {
    e.target.setCustomValidity(
      "Name must be 3-100 characters (letters, numbers, spaces, hyphens, underscores)"
    );
  } else {
    e.target.setCustomValidity("");
  }
});

document.getElementById("endpointUrl").addEventListener("input", (e) => {
  const url = e.target.value.trim();
  if (url && !SecurityUtils.isValidURL(url)) {
    e.target.setCustomValidity(
      "Invalid URL. Must start with http:// or https://"
    );
  } else if (url && ValidationUtils.isEndpointDuplicate(url, endpoints)) {
    e.target.setCustomValidity("This endpoint is already being monitored");
  } else {
    e.target.setCustomValidity("");
  }
});

document.getElementById("editEndpointName").addEventListener("input", (e) => {
  const name = e.target.value.trim();
  if (name && !SecurityUtils.isValidEndpointName(name)) {
    e.target.setCustomValidity(
      "Name must be 3-100 characters (letters, numbers, spaces, hyphens, underscores)"
    );
  } else {
    e.target.setCustomValidity("");
  }
});

document.getElementById("editEndpointUrl").addEventListener("input", (e) => {
  const url = e.target.value.trim();
  const otherEndpoints = endpoints.filter((ep) => ep.id !== editingEndpointId);

  if (url && !SecurityUtils.isValidURL(url)) {
    e.target.setCustomValidity(
      "Invalid URL. Must start with http:// or https://"
    );
  } else if (url && ValidationUtils.isEndpointDuplicate(url, otherEndpoints)) {
    e.target.setCustomValidity("This endpoint is already being monitored");
  } else {
    e.target.setCustomValidity("");
  }
});

// Add endpoint form submission
addEndpointForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (RateLimitUtils.isRateLimited("addEndpoint", 10, 60000)) {
    UIUtils.showError("Too many requests. Please wait a moment and try again.");
    return;
  }

  const name = SecurityUtils.sanitizeInput(
    document.getElementById("endpointName").value.trim()
  );
  const url = SecurityUtils.sanitizeInput(
    document.getElementById("endpointUrl").value.trim()
  );

  const validation = ValidationUtils.validateEndpoint(
    name,
    url,
    selectedInterval,
    endpoints
  );

  if (!validation.isValid) {
    UIUtils.showValidationErrors(validation.errors);
    return;
  }

  const newEndpoint = {
    name: name,
    url: url,
    interval: selectedInterval,
  };

  try {
    const submitBtn = addEndpointForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Adding...";

    await saveEndpoint(newEndpoint);
    await loadEndpoints();

    closeModalFunc();
    UIUtils.showSuccess(`Endpoint "${name}" added successfully!`);

    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  } catch (error) {
    console.error("Error adding endpoint:", error);
    UIUtils.showError(
      error.message || "Failed to add endpoint. Please try again."
    );

    const submitBtn = addEndpointForm.querySelector('button[type="submit"]');
    submitBtn.disabled = false;
    submitBtn.textContent = "Add Endpoint";
  }
});

// Edit endpoint form submission
editEndpointForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!editingEndpointId) return;

  const name = SecurityUtils.sanitizeInput(
    document.getElementById("editEndpointName").value.trim()
  );
  const url = SecurityUtils.sanitizeInput(
    document.getElementById("editEndpointUrl").value.trim()
  );

  const otherEndpoints = endpoints.filter((ep) => ep.id !== editingEndpointId);
  const validation = ValidationUtils.validateEndpoint(
    name,
    url,
    editSelectedInterval,
    otherEndpoints
  );

  if (!validation.isValid) {
    UIUtils.showValidationErrors(validation.errors);
    return;
  }

  const updatedEndpoint = {
    name: name,
    url: url,
    interval: editSelectedInterval,
  };

  try {
    const submitBtn = editEndpointForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Updating...";

    await updateEndpoint(editingEndpointId, updatedEndpoint);
    await loadEndpoints();

    closeEditModalFunc();
    UIUtils.showSuccess(`Endpoint "${name}" updated successfully!`);

    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  } catch (error) {
    console.error("Error updating endpoint:", error);
    UIUtils.showError(
      error.message || "Failed to update endpoint. Please try again."
    );

    const submitBtn = editEndpointForm.querySelector('button[type="submit"]');
    submitBtn.disabled = false;
    submitBtn.textContent = "Update Endpoint";
  }
});

// Filter endpoints
const filterStatus = document.getElementById("filterStatus");
filterStatus.addEventListener("change", renderEndpoints);

function renderEndpoints() {
  const filter = filterStatus.value;
  const filteredEndpoints =
    filter === "all" ? endpoints : endpoints.filter((e) => e.status === filter);

  const endpointsList = document.getElementById("endpointsList");

  if (filteredEndpoints.length === 0) {
    endpointsList.innerHTML =
      '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No endpoints found. Add one to get started!</p>';
    return;
  }

  const html = filteredEndpoints
    .map((endpoint) => {
      const endpointId = endpoint.id;

      const safeName = SecurityUtils.sanitizeHTML(endpoint.name);
      const safeUrl = SecurityUtils.sanitizeHTML(endpoint.url);
      const safeStatus = SecurityUtils.sanitizeHTML(endpoint.status);
      const safeUptime = SecurityUtils.sanitizeHTML(endpoint.uptime);
      const safeResponseTime = UIUtils.formatResponseTime(
        endpoint.responseTime
      );
      const safeLastCheck = SecurityUtils.sanitizeHTML(endpoint.lastCheck);
      const safeChecks = SecurityUtils.sanitizeHTML(String(endpoint.checks));

      return `
            <div class="endpoint-card" data-endpoint-id="${endpointId}">
                <div class="endpoint-actions">
                    <button class="endpoint-edit-btn" data-endpoint-id="${endpointId}" data-action="edit" title="Edit endpoint" type="button">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                    <button class="endpoint-delete-btn" data-endpoint-id="${endpointId}" data-action="delete" title="Delete endpoint" type="button">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </div>
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
    })
    .join("");

  endpointsList.innerHTML = html;
}

// Update stats
function updateStats() {
  const total = endpoints.length;
  UIUtils.setTextContent("totalEndpoints", total.toString());

  const onlineCount = endpoints.filter((e) => e.status === "online").length;
  UIUtils.setTextContent("onlineCount", onlineCount.toString());

  if (total > 0) {
    const avgUptime =
      endpoints.reduce((sum, e) => sum + parseFloat(e.uptime), 0) / total;
    UIUtils.setTextContent("avgUptime", avgUptime.toFixed(1) + "%");

    const avgResponse =
      endpoints.reduce((sum, e) => sum + parseInt(e.responseTime), 0) / total;
    UIUtils.setTextContent(
      "avgResponse",
      UIUtils.formatResponseTime(Math.round(avgResponse))
    );
  } else {
    UIUtils.setTextContent("avgUptime", "0%");
    UIUtils.setTextContent("avgResponse", "0ms");
  }
}

// Real-time updates
function startRealTimeUpdates() {
  setInterval(async () => {
    await loadEndpoints();
  }, 10000);
}

// Prevent clickjacking
if (window.top !== window.self) {
  window.top.location = window.self.location;
}

// Token refresh
setInterval(async () => {
  try {
    const response = await fetch("/api/v1/auth/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (response.ok) {
      console.log("Token refreshed successfully");
    } else {
      console.warn("Token refresh failed");
      window.location.href = "/";
    }
  } catch (error) {
    console.error("Token refresh error:", error);
  }
}, 20 * 60 * 1000);

// Start authentication check
checkAuth();
