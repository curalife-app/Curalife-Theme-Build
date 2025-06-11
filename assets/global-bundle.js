function __vite_legacy_guard() {
  import.meta.url;
  import("_").catch(() => 1);
  (async function* () {
  })().next();
}
;
if (typeof window.Shopify == "undefined") {
  window.Shopify = {};
}
Shopify.bind = function(fn, scope) {
  return function() {
    return fn.apply(scope, arguments);
  };
};
Shopify.setSelectorByValue = function(selector, value) {
  for (var i = 0, count = selector.options.length; i < count; i++) {
    var option = selector.options[i];
    if (value == option.value || value == option.innerHTML) {
      selector.selectedIndex = i;
      return i;
    }
  }
};
Shopify.addListener = function(target, eventName, callback) {
  target.addEventListener ? target.addEventListener(eventName, callback, false) : target.attachEvent("on" + eventName, callback);
};
Shopify.postLink = function(path, options) {
  options = options || {};
  var method = options["method"] || "post";
  var params = options["parameters"] || {};
  var form = document.createElement("form");
  form.setAttribute("method", method);
  form.setAttribute("action", path);
  for (var key in params) {
    var hiddenField = document.createElement("input");
    hiddenField.setAttribute("type", "hidden");
    hiddenField.setAttribute("name", key);
    hiddenField.setAttribute("value", params[key]);
    form.appendChild(hiddenField);
  }
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
};
Shopify.CountryProvinceSelector = function(country_domid, province_domid, options) {
  this.countryEl = document.getElementById(country_domid);
  this.provinceEl = document.getElementById(province_domid);
  this.provinceContainer = document.getElementById(options["hideElement"] || province_domid);
  Shopify.addListener(this.countryEl, "change", Shopify.bind(this.countryHandler, this));
  this.initCountry();
  this.initProvince();
};
Shopify.CountryProvinceSelector.prototype = {
  initCountry: function() {
    var value = this.countryEl.getAttribute("data-default");
    Shopify.setSelectorByValue(this.countryEl, value);
    this.countryHandler();
  },
  initProvince: function() {
    var value = this.provinceEl.getAttribute("data-default");
    if (value && this.provinceEl.options.length > 0) {
      Shopify.setSelectorByValue(this.provinceEl, value);
    }
  },
  countryHandler: function(e) {
    var opt = this.countryEl.options[this.countryEl.selectedIndex];
    var raw = opt.getAttribute("data-provinces");
    var provinces = JSON.parse(raw);
    this.clearOptions(this.provinceEl);
    if (provinces && provinces.length == 0) {
      this.provinceContainer.style.display = "none";
    } else {
      for (var i = 0; i < provinces.length; i++) {
        var opt = document.createElement("option");
        opt.value = provinces[i][0];
        opt.innerHTML = provinces[i][1];
        this.provinceEl.appendChild(opt);
      }
      this.provinceContainer.style.display = "";
    }
  },
  clearOptions: function(selector) {
    while (selector.firstChild) {
      selector.removeChild(selector.firstChild);
    }
  },
  setOptions: function(selector, values) {
    for (var i = 0, count = values.length; i < values.length; i++) {
      var opt = document.createElement("option");
      opt.value = values[i];
      opt.innerHTML = values[i];
      selector.appendChild(opt);
    }
  }
};
class DetailsDisclosure extends HTMLElement {
  constructor() {
    super();
    this.mainDetailsToggle = this.querySelector("details");
    this.content = this.mainDetailsToggle.querySelector("summary").nextElementSibling;
    this.mainDetailsToggle.addEventListener("focusout", this.onFocusOut.bind(this));
    this.mainDetailsToggle.addEventListener("toggle", this.onToggle.bind(this));
  }
  onFocusOut() {
    setTimeout(() => {
      if (!this.contains(document.activeElement)) this.close();
    });
  }
  onToggle() {
    if (!this.animations) this.animations = this.content.getAnimations();
    if (this.mainDetailsToggle.hasAttribute("open")) {
      this.animations.forEach((animation) => animation.play());
    } else {
      this.animations.forEach((animation) => animation.cancel());
    }
  }
  close() {
    this.mainDetailsToggle.removeAttribute("open");
    this.mainDetailsToggle.querySelector("summary").setAttribute("aria-expanded", false);
  }
}
customElements.define("details-disclosure", DetailsDisclosure);
class HeaderMenu extends DetailsDisclosure {
  constructor() {
    super();
    this.header = document.querySelector(".header-wrapper");
  }
  onToggle() {
    if (!this.header) return;
    this.header.preventHide = this.mainDetailsToggle.open;
    if (document.documentElement.style.getPropertyValue("--header-bottom-position-desktop") !== "") return;
    document.documentElement.style.setProperty("--header-bottom-position-desktop", "".concat(Math.floor(this.header.getBoundingClientRect().bottom), "px"));
  }
}
customElements.define("header-menu", HeaderMenu);
class DetailsModal extends HTMLElement {
  constructor() {
    super();
    this.detailsContainer = this.querySelector("details");
    this.summaryToggle = this.querySelector("summary");
    this.detailsContainer.addEventListener(
      "keyup",
      (event) => event.code.toUpperCase() === "ESCAPE" && this.close()
    );
    this.summaryToggle.addEventListener(
      "click",
      this.onSummaryClick.bind(this)
    );
    this.querySelector('button[type="button"]').addEventListener(
      "click",
      this.close.bind(this)
    );
    this.summaryToggle.setAttribute("role", "button");
  }
  isOpen() {
    return this.detailsContainer.hasAttribute("open");
  }
  onSummaryClick(event) {
    event.preventDefault();
    event.target.closest("details").hasAttribute("open") ? this.close() : this.open(event);
  }
  onBodyClick(event) {
    if (!this.contains(event.target) || event.target.classList.contains("modal-overlay")) this.close(false);
  }
  open(event) {
    this.onBodyClickEvent = this.onBodyClickEvent || this.onBodyClick.bind(this);
    event.target.closest("details").setAttribute("open", true);
    document.body.addEventListener("click", this.onBodyClickEvent);
    document.body.classList.add("overflow-hidden");
    trapFocus(
      this.detailsContainer.querySelector('[tabindex="-1"]'),
      this.detailsContainer.querySelector('input:not([type="hidden"])')
    );
  }
  close(focusToggle = true) {
    removeTrapFocus(focusToggle ? this.summaryToggle : null);
    this.detailsContainer.removeAttribute("open");
    document.body.removeEventListener("click", this.onBodyClickEvent);
    document.body.classList.remove("overflow-hidden");
  }
}
customElements.define("details-modal", DetailsModal);
function hideProductModal() {
  const productModal = document.querySelectorAll("product-modal[open]");
  productModal && productModal.forEach((modal) => modal.hide());
}
document.addEventListener("shopify:block:select", function(event) {
  hideProductModal();
  const blockSelectedIsSlide = event.target.classList.contains("slideshow__slide");
  if (!blockSelectedIsSlide) return;
  const parentSlideshowComponent = event.target.closest("slideshow-component");
  parentSlideshowComponent.pause();
  setTimeout(function() {
    parentSlideshowComponent.slider.scrollTo({
      left: event.target.offsetLeft
    });
  }, 200);
});
document.addEventListener("shopify:block:deselect", function(event) {
  const blockDeselectedIsSlide = event.target.classList.contains("slideshow__slide");
  if (!blockDeselectedIsSlide) return;
  const parentSlideshowComponent = event.target.closest("slideshow-component");
  if (parentSlideshowComponent.autoplayButtonIsSetToPlay) parentSlideshowComponent.play();
});
document.addEventListener("shopify:section:load", () => {
  hideProductModal();
  const zoomOnHoverScript = document.querySelector("[id^=EnableZoomOnHover]");
  if (!zoomOnHoverScript) return;
  if (zoomOnHoverScript) {
    const newScriptTag = document.createElement("script");
    newScriptTag.src = zoomOnHoverScript.src;
    zoomOnHoverScript.parentNode.replaceChild(newScriptTag, zoomOnHoverScript);
  }
});
document.addEventListener("shopify:section:reorder", () => hideProductModal());
document.addEventListener("shopify:section:select", () => hideProductModal());
document.addEventListener("shopify:section:deselect", () => hideProductModal());
document.addEventListener("shopify:inspector:activate", () => hideProductModal());
document.addEventListener("shopify:inspector:deactivate", () => hideProductModal());
function initWebVitals() {
  if (document.readyState === "complete") {
    importAndInitVitals();
  } else {
    window.addEventListener("load", importAndInitVitals);
  }
}
function importAndInitVitals() {
  const script = document.createElement("script");
  script.src = "https://unpkg.com/web-vitals@3/dist/web-vitals.iife.js";
  script.onload = () => {
    if (window.webVitals) {
      window.webVitals.getFCP(sendToAnalytics);
      window.webVitals.getLCP(sendToAnalytics);
      window.webVitals.getFID(sendToAnalytics);
      window.webVitals.getCLS(sendToAnalytics);
      window.webVitals.getTTFB(sendToAnalytics);
      window.webVitals.getINP(sendToAnalytics);
    }
  };
  document.body.appendChild(script);
}
function sendToAnalytics(metric) {
  const pageUrl = window.location.href;
  const pagePath = window.location.pathname;
  const pageTemplate = document.documentElement.getAttribute("data-template") || "unknown";
  const data = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    // 'good', 'needs-improvement', or 'poor'
    delta: metric.delta,
    id: metric.id,
    page: {
      url: pageUrl,
      path: pagePath,
      template: pageTemplate
    },
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    userAgent: navigator.userAgent,
    // Include shop information if available
    shop: window.Shopify ? window.Shopify.shop : void 0
  };
  {
    console.log("[Web Vitals]", metric.name, metric.value, metric.rating);
    storeMetricLocally(data);
  }
  storeMetricLocally(data);
}
function storeMetricLocally(data) {
  try {
    const existingMetrics = JSON.parse(localStorage.getItem("curalife_web_vitals") || "[]");
    existingMetrics.push(data);
    const limitedMetrics = existingMetrics.slice(-100);
    localStorage.setItem("curalife_web_vitals", JSON.stringify(limitedMetrics));
  } catch (error) {
    console.error("Failed to store web vitals locally:", error);
  }
}
function getStoredMetrics() {
  try {
    return JSON.parse(localStorage.getItem("curalife_web_vitals") || "[]");
  } catch (e) {
    return [];
  }
}
function clearStoredMetrics() {
  localStorage.removeItem("curalife_web_vitals");
}
let isDashboardVisible = false;
function initPerformanceDashboard() {
  createDashboardToggle();
  document.addEventListener("keydown", (event) => {
    if (event.altKey && event.shiftKey && event.key === "P") {
      toggleDashboard();
    }
  });
}
function createDashboardToggle() {
  const button = document.createElement("button");
  button.id = "performance-dashboard-toggle";
  button.innerHTML = "📊";
  button.setAttribute("aria-label", "Toggle Performance Dashboard");
  button.title = "Toggle Performance Dashboard (Alt+Shift+P)";
  Object.assign(button.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: "9999",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#4338ca",
    color: "white",
    border: "none",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.2)",
    cursor: "pointer",
    fontSize: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  });
  button.addEventListener("click", toggleDashboard);
  document.body.appendChild(button);
}
function toggleDashboard() {
  if (isDashboardVisible) {
    const dashboard = document.getElementById("performance-dashboard");
    if (dashboard) {
      dashboard.remove();
    }
    isDashboardVisible = false;
  } else {
    createDashboard();
    isDashboardVisible = true;
  }
}
function createDashboard() {
  const dashboard = document.createElement("div");
  dashboard.id = "performance-dashboard";
  Object.assign(dashboard.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    bottom: "20px",
    width: "400px",
    backgroundColor: "white",
    boxShadow: "0 0 20px rgba(0, 0, 0, 0.3)",
    borderRadius: "8px",
    zIndex: "9998",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    fontFamily: "system-ui, -apple-system, sans-serif"
  });
  const header = document.createElement("div");
  Object.assign(header.style, {
    padding: "15px 20px",
    borderBottom: "1px solid #e5e7eb",
    backgroundColor: "#4338ca",
    color: "white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  });
  const title = document.createElement("h2");
  title.textContent = "Performance Dashboard";
  Object.assign(title.style, {
    margin: "0",
    fontSize: "18px",
    fontWeight: "600"
  });
  const closeButton = document.createElement("button");
  closeButton.innerHTML = "&times;";
  closeButton.setAttribute("aria-label", "Close Dashboard");
  Object.assign(closeButton.style, {
    background: "none",
    border: "none",
    color: "white",
    fontSize: "24px",
    cursor: "pointer",
    padding: "0",
    lineHeight: "1"
  });
  closeButton.addEventListener("click", toggleDashboard);
  const buttonsContainer = document.createElement("div");
  Object.assign(buttonsContainer.style, {
    padding: "10px 20px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    gap: "10px"
  });
  const refreshButton = document.createElement("button");
  refreshButton.textContent = "Refresh";
  styleButton(refreshButton);
  refreshButton.addEventListener("click", () => updateDashboardContent(dashboard));
  const clearButton = document.createElement("button");
  clearButton.textContent = "Clear Data";
  styleButton(clearButton, "#ef4444");
  clearButton.addEventListener("click", () => {
    clearStoredMetrics();
    updateDashboardContent(dashboard);
  });
  const content = document.createElement("div");
  content.className = "dashboard-content";
  Object.assign(content.style, {
    padding: "20px",
    overflowY: "auto",
    flex: "1"
  });
  header.appendChild(title);
  header.appendChild(closeButton);
  buttonsContainer.appendChild(refreshButton);
  buttonsContainer.appendChild(clearButton);
  dashboard.appendChild(header);
  dashboard.appendChild(buttonsContainer);
  dashboard.appendChild(content);
  document.body.appendChild(dashboard);
  updateDashboardContent(dashboard);
}
function styleButton(button, bgColor = "#4338ca") {
  Object.assign(button.style, {
    padding: "8px 12px",
    backgroundColor: bgColor,
    color: "white",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "14px"
  });
}
function updateDashboardContent(dashboard) {
  const contentContainer = dashboard.querySelector(".dashboard-content");
  if (!contentContainer) return;
  contentContainer.innerHTML = "";
  const metrics = getStoredMetrics();
  if (metrics.length === 0) {
    const emptyMessage = document.createElement("div");
    emptyMessage.textContent = "No metrics collected yet. Browse the site to collect performance data.";
    Object.assign(emptyMessage.style, {
      textAlign: "center",
      padding: "40px 20px",
      color: "#6b7280",
      fontSize: "16px"
    });
    contentContainer.appendChild(emptyMessage);
    return;
  }
  const metricsByType = {};
  const metricsByPage = {};
  metrics.forEach((metric) => {
    if (!metricsByType[metric.name]) {
      metricsByType[metric.name] = [];
    }
    metricsByType[metric.name].push(metric);
    const pagePath = metric.page.path;
    if (!metricsByPage[pagePath]) {
      metricsByPage[pagePath] = [];
    }
    metricsByPage[pagePath].push(metric);
  });
  const summarySection = createSection("Summary");
  contentContainer.appendChild(summarySection);
  Object.keys(metricsByType).forEach((metricName) => {
    const metricData = metricsByType[metricName];
    const values = metricData.map((m) => m.value);
    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
    let color = "#10b981";
    if (metricName === "LCP" && avgValue > 2500) {
      color = avgValue > 4e3 ? "#ef4444" : "#f59e0b";
    } else if (metricName === "FID" && avgValue > 100) {
      color = avgValue > 300 ? "#ef4444" : "#f59e0b";
    } else if (metricName === "CLS" && avgValue > 0.1) {
      color = avgValue > 0.25 ? "#ef4444" : "#f59e0b";
    } else if (metricName === "FCP" && avgValue > 1800) {
      color = avgValue > 3e3 ? "#ef4444" : "#f59e0b";
    } else if (metricName === "TTFB" && avgValue > 800) {
      color = avgValue > 1800 ? "#ef4444" : "#f59e0b";
    } else if (metricName === "INP" && avgValue > 200) {
      color = avgValue > 500 ? "#ef4444" : "#f59e0b";
    }
    let formattedValue;
    if (metricName === "CLS") {
      formattedValue = avgValue.toFixed(3);
    } else {
      formattedValue = "".concat(Math.round(avgValue), "ms");
    }
    const metricRow = document.createElement("div");
    Object.assign(metricRow.style, {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "10px 0",
      borderBottom: "1px solid #e5e7eb"
    });
    const nameElement = document.createElement("div");
    nameElement.textContent = getMetricFullName(metricName);
    Object.assign(nameElement.style, {
      fontWeight: "500"
    });
    const valueElement = document.createElement("div");
    valueElement.textContent = formattedValue;
    Object.assign(valueElement.style, {
      fontWeight: "600",
      color
    });
    metricRow.appendChild(nameElement);
    metricRow.appendChild(valueElement);
    summarySection.appendChild(metricRow);
  });
  const pageSection = createSection("Page Breakdown");
  contentContainer.appendChild(pageSection);
  Object.keys(metricsByPage).forEach((pagePath) => {
    const pageMetrics = metricsByPage[pagePath];
    const pageRow = document.createElement("div");
    Object.assign(pageRow.style, {
      padding: "10px 0",
      borderBottom: "1px solid #e5e7eb"
    });
    const pathElement = document.createElement("div");
    pathElement.textContent = pagePath;
    Object.assign(pathElement.style, {
      fontWeight: "500",
      marginBottom: "5px"
    });
    const metricsGrid = document.createElement("div");
    Object.assign(metricsGrid.style, {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "5px",
      fontSize: "13px"
    });
    const latestMetrics = {};
    pageMetrics.forEach((metric) => {
      if (!latestMetrics[metric.name] || new Date(metric.timestamp) > new Date(latestMetrics[metric.name].timestamp)) {
        latestMetrics[metric.name] = metric;
      }
    });
    Object.values(latestMetrics).forEach((metric) => {
      const metricTile = document.createElement("div");
      Object.assign(metricTile.style, {
        padding: "5px",
        backgroundColor: getMetricColor(metric.name, metric.value),
        color: "white",
        borderRadius: "4px",
        textAlign: "center"
      });
      const metricValue = metric.name === "CLS" ? metric.value.toFixed(3) : "".concat(Math.round(metric.value), "ms");
      metricTile.textContent = "".concat(metric.name, ": ").concat(metricValue);
      metricsGrid.appendChild(metricTile);
    });
    pageRow.appendChild(pathElement);
    pageRow.appendChild(metricsGrid);
    pageSection.appendChild(pageRow);
  });
  const trendsSection = createSection("Trends");
  const trendsMessage = document.createElement("p");
  trendsMessage.textContent = "".concat(metrics.length, " data points collected. View detailed trends by exporting data.");
  trendsSection.appendChild(trendsMessage);
  contentContainer.appendChild(trendsSection);
}
function createSection(title) {
  const section = document.createElement("div");
  Object.assign(section.style, {
    marginBottom: "25px"
  });
  const sectionTitle = document.createElement("h3");
  sectionTitle.textContent = title;
  Object.assign(sectionTitle.style, {
    fontSize: "16px",
    fontWeight: "600",
    marginBottom: "10px",
    paddingBottom: "5px",
    borderBottom: "2px solid #4338ca"
  });
  section.appendChild(sectionTitle);
  return section;
}
function getMetricFullName(shortName) {
  const names = {
    LCP: "Largest Contentful Paint",
    FID: "First Input Delay",
    CLS: "Cumulative Layout Shift",
    FCP: "First Contentful Paint",
    TTFB: "Time to First Byte",
    INP: "Interaction to Next Paint"
  };
  return names[shortName] || shortName;
}
function getMetricColor(name, value) {
  let color = "#10b981";
  switch (name) {
    case "LCP":
      if (value > 4e3) color = "#ef4444";
      else if (value > 2500) color = "#f59e0b";
      break;
    case "FID":
      if (value > 300) color = "#ef4444";
      else if (value > 100) color = "#f59e0b";
      break;
    case "CLS":
      if (value > 0.25) color = "#ef4444";
      else if (value > 0.1) color = "#f59e0b";
      break;
    case "FCP":
      if (value > 3e3) color = "#ef4444";
      else if (value > 1800) color = "#f59e0b";
      break;
    case "TTFB":
      if (value > 1800) color = "#ef4444";
      else if (value > 800) color = "#f59e0b";
      break;
    case "INP":
      if (value > 500) color = "#ef4444";
      else if (value > 200) color = "#f59e0b";
      break;
  }
  return color;
}
function initPerformanceMonitoring() {
  initWebVitals();
  initPerformanceDashboard();
}
function initializePerformanceMonitoring() {
  initPerformanceMonitoring();
  {
    console.log("[Performance] Monitoring initialized in development mode");
    console.log("[Performance] Press Alt+Shift+P to open the dashboard");
  }
}
document.addEventListener("DOMContentLoaded", () => {
  initializePerformanceMonitoring();
});
console.log("🌍 Global bundle loaded - Core theme functionality initialized");
export {
  __vite_legacy_guard
};
