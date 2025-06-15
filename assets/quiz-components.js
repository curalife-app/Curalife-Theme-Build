const scriptRel = "modulepreload";
const assetsURL = function(dep) {
  return "/" + dep;
};
const seen = {};
const __vitePreload = function preload(baseModule, deps, importerUrl) {
  let promise = Promise.resolve();
  if (deps && deps.length > 0) {
    document.getElementsByTagName("link");
    const cspNonceMeta = document.querySelector(
      "meta[property=csp-nonce]"
    );
    const cspNonce = cspNonceMeta?.nonce || cspNonceMeta?.getAttribute("nonce");
    promise = Promise.allSettled(
      deps.map((dep) => {
        dep = assetsURL(dep);
        if (dep in seen) return;
        seen[dep] = true;
        const isCss = dep.endsWith(".css");
        const cssSelector = isCss ? '[rel="stylesheet"]' : "";
        if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) {
          return;
        }
        const link = document.createElement("link");
        link.rel = isCss ? "stylesheet" : scriptRel;
        if (!isCss) {
          link.as = "script";
        }
        link.crossOrigin = "";
        link.href = dep;
        if (cspNonce) {
          link.setAttribute("nonce", cspNonce);
        }
        document.head.appendChild(link);
        if (isCss) {
          return new Promise((res, rej) => {
            link.addEventListener("load", res);
            link.addEventListener(
              "error",
              () => rej(new Error(`Unable to preload CSS for ${dep}`))
            );
          });
        }
      })
    );
  }
  function handlePreloadError(err) {
    const e = new Event("vite:preloadError", {
      cancelable: true
    });
    e.payload = err;
    window.dispatchEvent(e);
    if (!e.defaultPrevented) {
      throw err;
    }
  }
  return promise.then((res) => {
    for (const item of res || []) {
      if (item.status !== "rejected") continue;
      handlePreloadError(item.reason);
    }
    return baseModule().catch(handlePreloadError);
  });
};
class QuizBaseComponent extends HTMLElement {
  constructor() {
    super();
    this.config = {
      useShadowDOM: true,
      inheritStyles: true,
      autoRender: true
    };
    this.isInitialized = false;
    this.isConnected = false;
    if (this.config.useShadowDOM) {
      this.attachShadow({ mode: "open" });
      this.root = this.shadowRoot;
    } else {
      this.root = this;
    }
    this.handleAttributeChange = this.handleAttributeChange.bind(this);
    this.handleSlotChange = this.handleSlotChange.bind(this);
  }
  /**
   * Lifecycle: Component connected to DOM
   */
  connectedCallback() {
    this.isConnected = true;
    if (!this.isInitialized) {
      this.initialize();
      this.isInitialized = true;
    }
    if (this.config.autoRender) {
      this.render();
    }
    this.setupEventListeners();
    this.onConnected();
  }
  /**
   * Lifecycle: Component disconnected from DOM
   */
  disconnectedCallback() {
    this.isConnected = false;
    this.cleanup();
    this.onDisconnected();
  }
  /**
   * Lifecycle: Attribute changed
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    this.handleAttributeChange(name, oldValue, newValue);
    if (this.isConnected && this.config.autoRender) {
      this.render();
    }
  }
  /**
   * Initialize component
   * Override in subclasses for custom initialization
   */
  initialize() {
  }
  /**
   * Render component
   * Must be implemented by subclasses
   */
  render() {
    throw new Error("render() must be implemented by subclass");
  }
  /**
   * Get component template
   * Must be implemented by subclasses
   */
  getTemplate() {
    throw new Error("getTemplate() must be implemented by subclass");
  }
  /**
   * Get component styles
   * Override in subclasses to add custom styles
   */
  getStyles() {
    return `
      :host {
        display: block;
        box-sizing: border-box;
      }

      :host([hidden]) {
        display: none !important;
      }

      /* Inherit quiz CSS custom properties */
      :host {
        --quiz-primary-color: var(--quiz-primary-color, #2c3e50);
        --quiz-secondary-color: var(--quiz-secondary-color, #306E51);
        --quiz-success-color: var(--quiz-success-color, #4CAF50);
        --quiz-error-color: var(--quiz-error-color, #f56565);
        --quiz-warning-color: var(--quiz-warning-color, #ed8936);
        --quiz-border-radius: var(--quiz-border-radius, 8px);
        --quiz-shadow: var(--quiz-shadow, 0 2px 10px rgba(0,0,0,0.1));
        --quiz-transition: var(--quiz-transition, all 0.3s ease);
      }
    `;
  }
  /**
   * Handle attribute changes
   * Override in subclasses for custom attribute handling
   */
  handleAttributeChange(name, oldValue, newValue) {
  }
  /**
   * Handle slot changes
   */
  handleSlotChange(event) {
  }
  /**
   * Setup event listeners
   * Override in subclasses
   */
  setupEventListeners() {
  }
  /**
   * Cleanup resources
   * Override in subclasses
   */
  cleanup() {
  }
  /**
   * Called when component is connected
   * Override in subclasses
   */
  onConnected() {
  }
  /**
   * Called when component is disconnected
   * Override in subclasses
   */
  onDisconnected() {
  }
  /**
   * Utility: Get attribute as boolean
   */
  getBooleanAttribute(name, defaultValue = false) {
    const value = this.getAttribute(name);
    if (value === null) return defaultValue;
    return value === "" || value === "true" || value === name;
  }
  /**
   * Utility: Get attribute as number
   */
  getNumberAttribute(name, defaultValue = 0) {
    const value = this.getAttribute(name);
    if (value === null) return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  /**
   * Utility: Set multiple attributes
   */
  setAttributes(attributes) {
    Object.entries(attributes).forEach(([name, value]) => {
      if (value === null || value === void 0) {
        this.removeAttribute(name);
      } else {
        this.setAttribute(name, String(value));
      }
    });
  }
  /**
   * Utility: Dispatch custom event
   */
  dispatchCustomEvent(eventName, detail = {}, options = {}) {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      cancelable: true,
      ...options
    });
    this.dispatchEvent(event);
    return event;
  }
  /**
   * Utility: Query element in component root
   */
  querySelector(selector) {
    return this.root.querySelector(selector);
  }
  /**
   * Utility: Query all elements in component root
   */
  querySelectorAll(selector) {
    return this.root.querySelectorAll(selector);
  }
  /**
   * Utility: Create element with attributes and content
   */
  createElement(tagName, attributes = {}, content = "") {
    const element = document.createElement(tagName);
    Object.entries(attributes).forEach(([name, value]) => {
      element.setAttribute(name, String(value));
    });
    if (content) {
      element.innerHTML = content;
    }
    return element;
  }
  /**
   * Utility: Sanitize HTML content
   */
  sanitizeHTML(html) {
    const div = document.createElement("div");
    div.textContent = html;
    return div.innerHTML;
  }
  /**
   * Utility: Debounce function calls
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  /**
   * Utility: Throttle function calls
   */
  throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
  /**
   * Render complete template with styles
   */
  renderTemplate() {
    if (!this.config.useShadowDOM) {
      this.innerHTML = this.getTemplate();
      return;
    }
    this.root.innerHTML = `
      <style>${this.getStyles()}</style>
      ${this.getTemplate()}
    `;
    const slots = this.root.querySelectorAll("slot");
    slots.forEach((slot) => {
      slot.addEventListener("slotchange", this.handleSlotChange);
    });
  }
}
class QuizComponentRegistry {
  constructor() {
    this.components = /* @__PURE__ */ new Map();
    this.loadedComponents = /* @__PURE__ */ new Set();
  }
  /**
   * Register a component
   */
  register(tagName, componentClass, options = {}) {
    if (customElements.get(tagName)) {
      console.warn(`Component ${tagName} already registered`);
      return;
    }
    if (!(componentClass.prototype instanceof QuizBaseComponent)) {
      console.warn(`Component ${tagName} should extend QuizBaseComponent`);
    }
    customElements.define(tagName, componentClass);
    this.components.set(tagName, { componentClass, options });
    this.loadedComponents.add(tagName);
    console.log(`✓ Registered quiz component: ${tagName}`);
  }
  /**
   * Check if component is registered
   */
  isRegistered(tagName) {
    return this.loadedComponents.has(tagName);
  }
  /**
   * Get all registered components
   */
  getRegistered() {
    return Array.from(this.loadedComponents);
  }
  /**
   * Load component dynamically
   */
  async loadComponent(componentName) {
    if (this.isRegistered(componentName)) {
      return;
    }
    try {
      const module = await __vitePreload(() => import(`../${this.getComponentPath(componentName)}`), true ? [] : void 0);
      if (module.default && !this.isRegistered(componentName)) {
        console.log(`✓ Loaded quiz component: ${componentName}`);
      }
    } catch (error) {
      console.error(`Failed to load component ${componentName}:`, error);
    }
  }
  /**
   * Get component file path
   */
  getComponentPath(componentName) {
    const parts = componentName.split("-");
    if (parts[0] === "quiz") {
      const category = this.getCategoryFromName(parts[1]);
      return `${category}/${componentName}.js`;
    }
    return `${componentName}.js`;
  }
  /**
   * Determine component category from name
   */
  getCategoryFromName(type) {
    const categoryMap = {
      calendar: "icons",
      clock: "icons",
      checkmark: "icons",
      error: "icons",
      results: "layout",
      step: "layout",
      form: "forms",
      coverage: "content",
      action: "content",
      benefit: "content",
      faq: "content"
    };
    return categoryMap[type] || "content";
  }
}
const quizComponentRegistry = new QuizComponentRegistry();
class QuizCalendarIcon extends QuizBaseComponent {
  constructor() {
    super();
    this.config.useShadowDOM = false;
  }
  static get observedAttributes() {
    return ["size", "color", "stroke-width"];
  }
  getTemplate() {
    const size = this.getAttribute("size") || "20";
    const color = this.getAttribute("color") || "currentColor";
    const strokeWidth = this.getAttribute("stroke-width") || "1.5";
    return `
      <svg
        width="${size}"
        height="${size}"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Calendar icon"
      >
        <path
          d="M6.66666 2.5V5.83333M13.3333 2.5V5.83333M2.5 9.16667H17.5M4.16666 3.33333H15.8333C16.7538 3.33333 17.5 4.07952 17.5 5V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16666C3.24619 18.3333 2.5 17.5871 2.5 16.6667V5C2.5 4.07952 3.24619 3.33333 4.16666 3.33333Z"
          stroke="${color}"
          stroke-width="${strokeWidth}"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    `;
  }
  render() {
    this.innerHTML = this.getTemplate();
  }
}
if (!customElements.get("quiz-calendar-icon")) {
  quizComponentRegistry.register("quiz-calendar-icon", QuizCalendarIcon);
}
class QuizClockIcon extends QuizBaseComponent {
  constructor() {
    super();
    this.config.useShadowDOM = false;
  }
  static get observedAttributes() {
    return ["size", "color", "stroke-width"];
  }
  getTemplate() {
    const size = this.getAttribute("size") || "24";
    const color = this.getAttribute("color") || "#306E51";
    const strokeWidth = this.getAttribute("stroke-width") || "2";
    return `
      <svg
        width="${size}"
        height="${size}"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Clock icon"
      >
        <path
          d="M12 8V12L15 15"
          stroke="${color}"
          stroke-width="${strokeWidth}"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <circle
          cx="12"
          cy="12"
          r="9"
          stroke="${color}"
          stroke-width="${strokeWidth}"
        />
      </svg>
    `;
  }
  render() {
    this.innerHTML = this.getTemplate();
  }
}
if (!customElements.get("quiz-clock-icon")) {
  quizComponentRegistry.register("quiz-clock-icon", QuizClockIcon);
}
class QuizCheckmarkIcon extends QuizBaseComponent {
  constructor() {
    super();
    this.config.useShadowDOM = false;
  }
  static get observedAttributes() {
    return ["size", "color", "stroke-width", "type"];
  }
  getTemplate() {
    const size = this.getAttribute("size") || "20";
    const color = this.getAttribute("color") || "#306E51";
    const strokeWidth = this.getAttribute("stroke-width") || "1.5";
    const type = this.getAttribute("type") || "simple";
    if (type === "circle") {
      return `
        <svg
          width="${size}"
          height="${size}"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          role="img"
          aria-label="Checkmark in circle icon"
        >
          <path
            d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z"
            stroke="${color}"
            stroke-width="${strokeWidth}"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329"
            stroke="${color}"
            stroke-width="${strokeWidth}"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      `;
    }
    return `
      <svg
        width="${size}"
        height="${size}"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Checkmark icon"
      >
        <path
          d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329"
          stroke="${color}"
          stroke-width="${strokeWidth}"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    `;
  }
  render() {
    this.innerHTML = this.getTemplate();
  }
}
if (!customElements.get("quiz-checkmark-icon")) {
  quizComponentRegistry.register("quiz-checkmark-icon", QuizCheckmarkIcon);
}
class QuizCoverageCard extends QuizBaseComponent {
  static get observedAttributes() {
    return ["title", "type", "sessions-covered", "plan-end"];
  }
  getTemplate() {
    const title = this.getAttribute("title") || "Coverage Information";
    const type = this.getAttribute("type") || "default";
    return `
      <div class="quiz-coverage-card" data-type="${type}">
        <div class="quiz-coverage-card-title">${this.sanitizeHTML(title)}</div>
        <div class="quiz-coverage-content">
          <slot></slot>
        </div>
      </div>
    `;
  }
  getStyles() {
    return `
      ${super.getStyles()}

      :host {
        display: block;
        margin: 20px 0;
      }

      .quiz-coverage-card {
        background: white;
        border-radius: var(--quiz-border-radius);
        padding: 24px;
        box-shadow: var(--quiz-shadow);
        border-left: 4px solid transparent;
        transition: var(--quiz-transition);
      }

      :host([type="success"]) .quiz-coverage-card {
        border-left-color: var(--quiz-success-color);
        background-color: #f1f8f4;
      }

      :host([type="error"]) .quiz-coverage-card {
        border-left-color: var(--quiz-error-color);
        background-color: #fed7d7;
      }

      :host([type="warning"]) .quiz-coverage-card {
        border-left-color: var(--quiz-warning-color);
        background-color: #fffaf0;
      }

      .quiz-coverage-card-title {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 16px;
        color: var(--quiz-primary-color);
      }

      :host([type="success"]) .quiz-coverage-card-title {
        color: #2d5a3d;
      }

      :host([type="error"]) .quiz-coverage-card-title {
        color: #c53030;
      }

      :host([type="warning"]) .quiz-coverage-card-title {
        color: #c05621;
      }

      .quiz-coverage-content {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      /* Responsive design */
      @media (max-width: 768px) {
        .quiz-coverage-card {
          padding: 20px 16px;
          margin: 16px 0;
        }

        .quiz-coverage-card-title {
          font-size: 16px;
          margin-bottom: 14px;
        }
      }
    `;
  }
  render() {
    this.renderTemplate();
  }
  handleAttributeChange(name, oldValue, newValue) {
    if (name === "type") {
      this.updateTypeStyles();
    }
  }
  updateTypeStyles() {
    const card = this.querySelector(".quiz-coverage-card");
    if (card) {
      const type = this.getAttribute("type") || "default";
      card.setAttribute("data-type", type);
    }
  }
  onConnected() {
    this.dispatchCustomEvent("quiz-coverage-card-ready", {
      title: this.getAttribute("title"),
      type: this.getAttribute("type")
    });
  }
}
if (!customElements.get("quiz-coverage-card")) {
  quizComponentRegistry.register("quiz-coverage-card", QuizCoverageCard);
}
class QuizBenefitItem extends QuizBaseComponent {
  static get observedAttributes() {
    return ["icon", "text", "icon-color", "icon-size"];
  }
  getTemplate() {
    const iconType = this.getAttribute("icon") || "checkmark";
    const text = this.getAttribute("text") || "";
    const iconColor = this.getAttribute("icon-color") || "#306E51";
    const iconSize = this.getAttribute("icon-size") || "20";
    return `
      <div class="quiz-benefit-item">
        <div class="quiz-benefit-icon">
          ${this.getIconHTML(iconType, iconColor, iconSize)}
        </div>
        <div class="quiz-benefit-text">
          ${this.sanitizeHTML(text)}
        </div>
      </div>
    `;
  }
  getIconHTML(type, color, size) {
    const commonAttrs = `width="${size}" height="${size}" role="img"`;
    switch (type) {
      case "calendar":
        return `
          <svg ${commonAttrs} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Calendar">
            <path d="M6.66666 2.5V5.83333M13.3333 2.5V5.83333M2.5 9.16667H17.5M4.16666 3.33333H15.8333C16.7538 3.33333 17.5 4.07952 17.5 5V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16666C3.24619 18.3333 2.5 17.5871 2.5 16.6667V5C2.5 4.07952 3.24619 3.33333 4.16666 3.33333Z" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
      case "clock":
        return `
          <svg ${commonAttrs} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Clock">
            <path d="M12 8V12L15 15" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12" cy="12" r="9" stroke="${color}" stroke-width="2"/>
          </svg>
        `;
      case "checkmark":
      default:
        return `
          <svg ${commonAttrs} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Checkmark">
            <path d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
    }
  }
  getStyles() {
    return `
      ${super.getStyles()}

      :host {
        display: block;
        margin: 8px 0;
      }

      .quiz-benefit-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 8px 0;
      }

      .quiz-benefit-icon {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        margin-top: -2px; /* Optical alignment */
      }

      .quiz-benefit-icon svg {
        display: block;
      }

      .quiz-benefit-text {
        flex: 1;
        font-size: 14px;
        line-height: 1.5;
        color: var(--quiz-primary-color);
      }

      /* Strong text formatting */
      .quiz-benefit-text strong {
        font-weight: 600;
        color: var(--quiz-secondary-color);
      }

      /* Mobile responsive */
      @media (max-width: 768px) {
        .quiz-benefit-item {
          gap: 10px;
          padding: 6px 0;
        }

        .quiz-benefit-icon {
          width: 28px;
          height: 28px;
        }

        .quiz-benefit-text {
          font-size: 13px;
        }
      }
    `;
  }
  render() {
    this.renderTemplate();
  }
  handleAttributeChange(name, oldValue, newValue) {
    if (this.isConnected) {
      this.render();
    }
  }
  /**
   * Utility method to set benefit data programmatically
   */
  setBenefit(icon, text, iconColor = "#306E51") {
    this.setAttributes({
      icon,
      text,
      "icon-color": iconColor
    });
  }
  /**
   * Get benefit data
   */
  getBenefit() {
    return {
      icon: this.getAttribute("icon"),
      text: this.getAttribute("text"),
      iconColor: this.getAttribute("icon-color"),
      iconSize: this.getAttribute("icon-size")
    };
  }
}
if (!customElements.get("quiz-benefit-item")) {
  quizComponentRegistry.register("quiz-benefit-item", QuizBenefitItem);
}
class QuizActionSection extends QuizBaseComponent {
  static get observedAttributes() {
    return ["title", "type", "background-color"];
  }
  getTemplate() {
    const title = this.getAttribute("title") || "";
    const type = this.getAttribute("type") || "default";
    return `
      <div class="quiz-action-section" data-type="${type}">
        <div class="quiz-action-content">
          ${title ? `
            <div class="quiz-action-header">
              <h3 class="quiz-action-title">${this.sanitizeHTML(title)}</h3>
            </div>
          ` : ""}

          <div class="quiz-action-details">
            <slot name="info"></slot>
          </div>

          <div class="quiz-action-buttons">
            <slot name="action"></slot>
          </div>

          <!-- Default slot for any additional content -->
          <slot></slot>
        </div>
      </div>
    `;
  }
  getStyles() {
    return `
      ${super.getStyles()}

      :host {
        display: block;
        margin: 24px 0;
      }

      .quiz-action-section {
        background: #f8f9fa;
        border-radius: var(--quiz-border-radius);
        padding: 32px 24px;
        text-align: center;
        transition: var(--quiz-transition);
      }

      :host([type="primary"]) .quiz-action-section {
        background: linear-gradient(135deg, #f1f8f4, #e8f5e8);
        border: 1px solid #d4edda;
      }

      :host([type="secondary"]) .quiz-action-section {
        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        border: 1px solid #dee2e6;
      }

      :host([type="warning"]) .quiz-action-section {
        background: linear-gradient(135deg, #fffaf0, #fef5e7);
        border: 1px solid #ffeaa7;
      }

      /* Custom background color support */
      :host([background-color]) .quiz-action-section {
        background: attr(background-color);
      }

      .quiz-action-content {
        max-width: 600px;
        margin: 0 auto;
      }

      .quiz-action-header {
        margin-bottom: 20px;
      }

      .quiz-action-title {
        font-size: 24px;
        font-weight: 600;
        color: var(--quiz-primary-color);
        margin: 0 0 8px 0;
        line-height: 1.3;
      }

      .quiz-action-details {
        margin-bottom: 24px;
      }

      .quiz-action-details ::slotted(*) {
        margin-bottom: 12px;
      }

      .quiz-action-buttons {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }

      /* Style slotted booking buttons */
      .quiz-action-buttons ::slotted(.quiz-booking-button) {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--quiz-secondary-color);
        color: white;
        padding: 16px 32px;
        border-radius: var(--quiz-border-radius);
        text-decoration: none;
        font-weight: 600;
        font-size: 16px;
        transition: var(--quiz-transition);
        border: none;
        cursor: pointer;
        min-width: 200px;
      }

      .quiz-action-buttons ::slotted(.quiz-booking-button:hover) {
        background: #2a5d42;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(48, 110, 81, 0.3);
      }

      .quiz-action-buttons ::slotted(.quiz-booking-button:active) {
        transform: translateY(0);
      }

      .quiz-action-buttons ::slotted(.quiz-booking-button:disabled) {
        background: #6c757d;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }

      /* Responsive design */
      @media (max-width: 768px) {
        .quiz-action-section {
          padding: 24px 20px;
          margin: 20px 0;
        }

        .quiz-action-title {
          font-size: 20px;
        }

        .quiz-action-buttons ::slotted(.quiz-booking-button) {
          padding: 14px 24px;
          font-size: 15px;
          min-width: 180px;
        }
      }

      @media (max-width: 480px) {
        .quiz-action-section {
          padding: 20px 16px;
        }

        .quiz-action-title {
          font-size: 18px;
        }

        .quiz-action-buttons ::slotted(.quiz-booking-button) {
          width: 100%;
          max-width: 280px;
        }
      }
    `;
  }
  render() {
    this.renderTemplate();
    this.updateBackgroundColor();
  }
  handleAttributeChange(name, oldValue, newValue) {
    if (name === "background-color") {
      this.updateBackgroundColor();
    }
  }
  updateBackgroundColor() {
    const backgroundColor = this.getAttribute("background-color");
    if (backgroundColor) {
      const section = this.querySelector(".quiz-action-section");
      if (section) {
        section.style.background = backgroundColor;
      }
    }
  }
  onConnected() {
    this.dispatchCustomEvent("quiz-action-section-ready", {
      title: this.getAttribute("title"),
      type: this.getAttribute("type")
    });
  }
  /**
   * Utility method to set action data programmatically
   */
  setAction(title, type = "default", backgroundColor = null) {
    this.setAttributes({
      title,
      type,
      "background-color": backgroundColor
    });
  }
  /**
   * Get action data
   */
  getAction() {
    return {
      title: this.getAttribute("title"),
      type: this.getAttribute("type"),
      backgroundColor: this.getAttribute("background-color")
    };
  }
}
if (!customElements.get("quiz-action-section")) {
  quizComponentRegistry.register("quiz-action-section", QuizActionSection);
}
class QuizErrorDisplay extends QuizBaseComponent {
  static get observedAttributes() {
    return ["type", "title", "message", "error-code", "show-details"];
  }
  getTemplate() {
    const type = this.getAttribute("type") || "general";
    const title = this.getAttribute("title") || "Error";
    const message = this.getAttribute("message") || "An error occurred. Please try again.";
    const errorCode = this.getAttribute("error-code") || "";
    const showDetails = this.getBooleanAttribute("show-details", false);
    return `
      <div class="quiz-error-display" data-type="${type}">
        <div class="quiz-error-content">
          <div class="quiz-error-header">
            <div class="quiz-error-icon">
              ${this.getErrorIcon(type)}
            </div>
            <div class="quiz-error-text">
              <h3 class="quiz-error-title">${this.sanitizeHTML(title)}</h3>
              <p class="quiz-error-message">${this.sanitizeHTML(message)}</p>
            </div>
          </div>

          ${errorCode ? `
            <div class="quiz-error-code">
              <span class="quiz-error-code-label">Error Code:</span>
              <span class="quiz-error-code-value">${this.sanitizeHTML(errorCode)}</span>
            </div>
          ` : ""}

          ${showDetails ? `
            <div class="quiz-error-details">
              <details class="quiz-error-details-toggle">
                <summary class="quiz-error-details-summary">Technical Details</summary>
                <div class="quiz-error-details-content">
                  <slot name="details"></slot>
                </div>
              </details>
            </div>
          ` : ""}

          <div class="quiz-error-actions">
            <slot name="actions"></slot>
          </div>

          <!-- Default slot for additional content -->
          <slot></slot>
        </div>
      </div>
    `;
  }
  getErrorIcon(type) {
    const iconColor = this.getIconColor(type);
    switch (type) {
      case "warning":
        return `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Warning">
            <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
      case "technical":
        return `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Technical Error">
            <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 12L16 12" stroke="${iconColor}" stroke-width="1" stroke-linecap="round"/>
          </svg>
        `;
      case "network":
        return `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Network Error">
            <path d="M3 12H21M12 3L12 21" stroke="${iconColor}" stroke-width="2" stroke-linecap="round"/>
            <path d="M8.5 8.5L15.5 15.5M15.5 8.5L8.5 15.5" stroke="${iconColor}" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        `;
      case "general":
      default:
        return `
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Error">
            <circle cx="12" cy="12" r="9" stroke="${iconColor}" stroke-width="2"/>
            <path d="M15 9L9 15M9 9L15 15" stroke="${iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
    }
  }
  getIconColor(type) {
    switch (type) {
      case "warning":
        return "#ed8936";
      case "technical":
        return "#e53e3e";
      case "network":
        return "#3182ce";
      case "general":
      default:
        return "#e53e3e";
    }
  }
  getStyles() {
    return `
      ${super.getStyles()}

      :host {
        display: block;
        margin: 20px 0;
      }

      .quiz-error-display {
        background: white;
        border-radius: var(--quiz-border-radius);
        padding: 24px;
        box-shadow: var(--quiz-shadow);
        border-left: 4px solid var(--quiz-error-color);
      }

      :host([type="warning"]) .quiz-error-display {
        border-left-color: var(--quiz-warning-color);
        background-color: #fffaf0;
      }

      :host([type="technical"]) .quiz-error-display {
        border-left-color: #e53e3e;
        background-color: #fed7d7;
      }

      :host([type="network"]) .quiz-error-display {
        border-left-color: #3182ce;
        background-color: #ebf8ff;
      }

      .quiz-error-content {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .quiz-error-header {
        display: flex;
        align-items: flex-start;
        gap: 16px;
      }

      .quiz-error-icon {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.8);
      }

      .quiz-error-text {
        flex: 1;
      }

      .quiz-error-title {
        font-size: 18px;
        font-weight: 600;
        color: var(--quiz-primary-color);
        margin: 0 0 8px 0;
        line-height: 1.3;
      }

      :host([type="warning"]) .quiz-error-title {
        color: #c05621;
      }

      :host([type="technical"]) .quiz-error-title {
        color: #c53030;
      }

      :host([type="network"]) .quiz-error-title {
        color: #2c5282;
      }

      .quiz-error-message {
        font-size: 14px;
        line-height: 1.5;
        color: #4a5568;
        margin: 0;
      }

      .quiz-error-code {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 16px;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 6px;
        font-family: 'Monaco', 'Menlo', monospace;
        font-size: 13px;
      }

      .quiz-error-code-label {
        font-weight: 600;
        color: #4a5568;
      }

      .quiz-error-code-value {
        color: #2d3748;
        background: rgba(255, 255, 255, 0.8);
        padding: 2px 6px;
        border-radius: 4px;
      }

      .quiz-error-details {
        border-top: 1px solid rgba(0, 0, 0, 0.1);
        padding-top: 16px;
      }

      .quiz-error-details-toggle {
        cursor: pointer;
      }

      .quiz-error-details-summary {
        font-weight: 600;
        color: var(--quiz-primary-color);
        padding: 8px 0;
        list-style: none;
        outline: none;
      }

      .quiz-error-details-summary::-webkit-details-marker {
        display: none;
      }

      .quiz-error-details-summary::before {
        content: "▶";
        display: inline-block;
        margin-right: 8px;
        transition: transform 0.2s ease;
      }

      .quiz-error-details-toggle[open] .quiz-error-details-summary::before {
        transform: rotate(90deg);
      }

      .quiz-error-details-content {
        padding: 12px 0;
        color: #4a5568;
        font-size: 14px;
        line-height: 1.5;
      }

      .quiz-error-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        justify-content: center;
        padding-top: 8px;
      }

      /* Style slotted action buttons */
      .quiz-error-actions ::slotted(.quiz-retry-button) {
        background: var(--quiz-secondary-color);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: var(--quiz-border-radius);
        font-weight: 600;
        cursor: pointer;
        transition: var(--quiz-transition);
      }

      .quiz-error-actions ::slotted(.quiz-retry-button:hover) {
        background: #2a5d42;
        transform: translateY(-1px);
      }

      .quiz-error-actions ::slotted(.quiz-retry-button:active) {
        transform: translateY(0);
      }

      /* Responsive design */
      @media (max-width: 768px) {
        .quiz-error-display {
          padding: 20px 16px;
        }

        .quiz-error-header {
          gap: 12px;
        }

        .quiz-error-icon {
          width: 36px;
          height: 36px;
        }

        .quiz-error-title {
          font-size: 16px;
        }

        .quiz-error-message {
          font-size: 13px;
        }

        .quiz-error-actions {
          flex-direction: column;
          align-items: center;
        }

        .quiz-error-actions ::slotted(.quiz-retry-button) {
          width: 100%;
          max-width: 200px;
        }
      }
    `;
  }
  render() {
    this.renderTemplate();
  }
  handleAttributeChange(name, oldValue, newValue) {
    if (this.isConnected) {
      this.render();
    }
  }
  onConnected() {
    this.dispatchCustomEvent("quiz-error-display-ready", {
      type: this.getAttribute("type"),
      title: this.getAttribute("title"),
      errorCode: this.getAttribute("error-code")
    });
  }
  /**
   * Utility method to set error data programmatically
   */
  setError(type, title, message, errorCode = null, showDetails = false) {
    this.setAttributes({
      type,
      title,
      message,
      "error-code": errorCode,
      "show-details": showDetails
    });
  }
  /**
   * Get error data
   */
  getError() {
    return {
      type: this.getAttribute("type"),
      title: this.getAttribute("title"),
      message: this.getAttribute("message"),
      errorCode: this.getAttribute("error-code"),
      showDetails: this.getBooleanAttribute("show-details")
    };
  }
  /**
   * Show/hide technical details
   */
  toggleDetails(show = null) {
    const currentShow = this.getBooleanAttribute("show-details");
    const newShow = show !== null ? show : !currentShow;
    this.setAttribute("show-details", newShow);
  }
}
if (!customElements.get("quiz-error-display")) {
  quizComponentRegistry.register("quiz-error-display", QuizErrorDisplay);
}
class QuizLoadingDisplay extends QuizBaseComponent {
  static get observedAttributes() {
    return ["type", "title", "message", "progress", "current-step", "total-steps", "show-spinner"];
  }
  getTemplate() {
    const type = this.getAttribute("type") || "simple";
    const title = this.getAttribute("title") || "Loading...";
    const message = this.getAttribute("message") || "";
    const progress = this.getAttribute("progress") || "0";
    const currentStep = this.getAttribute("current-step") || "1";
    const totalSteps = this.getAttribute("total-steps") || "1";
    const showSpinner = this.getBooleanAttribute("show-spinner", true);
    if (type === "comprehensive") {
      return this.getComprehensiveTemplate(title, message, progress, currentStep, totalSteps, showSpinner);
    } else {
      return this.getSimpleTemplate(title, message, showSpinner);
    }
  }
  getSimpleTemplate(title, message, showSpinner) {
    return `
      <div class="quiz-loading-display simple">
        <div class="quiz-loading-content">
          ${showSpinner ? `
            <div class="quiz-loading-icon">
              <div class="quiz-loading-spinner"></div>
            </div>
          ` : ""}

          <div class="quiz-loading-text">
            <h3 class="quiz-loading-title">${this.sanitizeHTML(title)}</h3>
            ${message ? `<p class="quiz-loading-message">${this.sanitizeHTML(message)}</p>` : ""}
          </div>

          <!-- Default slot for additional content -->
          <slot></slot>
        </div>
      </div>
    `;
  }
  getComprehensiveTemplate(title, message, progress, currentStep, totalSteps, showSpinner) {
    return `
      <div class="quiz-loading-display comprehensive">
        <div class="quiz-loading-content">
          ${showSpinner ? `
            <div class="quiz-loading-icon">
              <div class="quiz-loading-spinner-large"></div>
            </div>
          ` : ""}

          <div class="quiz-loading-text">
            <h3 class="quiz-loading-title">${this.sanitizeHTML(title)}</h3>
            ${message ? `<p class="quiz-loading-message">${this.sanitizeHTML(message)}</p>` : ""}
          </div>

          <div class="quiz-loading-steps">
            <slot name="steps"></slot>
          </div>

          <div class="quiz-loading-progress">
            <div class="quiz-loading-progress-bar">
              <div class="quiz-loading-progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="quiz-loading-progress-text">
              ${progress}% complete (${currentStep}/${totalSteps})
            </div>
          </div>

          <!-- Default slot for additional content -->
          <slot></slot>
        </div>
      </div>
    `;
  }
  getStyles() {
    return `
      ${super.getStyles()}

      :host {
        display: block;
        margin: 20px 0;
      }

      .quiz-loading-display {
        background: white;
        border-radius: var(--quiz-border-radius);
        padding: 32px 24px;
        text-align: center;
        box-shadow: var(--quiz-shadow);
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .quiz-loading-display.simple {
        min-height: 120px;
        padding: 24px;
      }

      .quiz-loading-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        max-width: 500px;
        width: 100%;
      }

      .quiz-loading-icon {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .quiz-loading-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid var(--quiz-secondary-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      .quiz-loading-spinner-large {
        width: 48px;
        height: 48px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid var(--quiz-secondary-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .quiz-loading-text {
        text-align: center;
      }

      .quiz-loading-title {
        font-size: 20px;
        font-weight: 600;
        color: var(--quiz-primary-color);
        margin: 0 0 8px 0;
        line-height: 1.3;
      }

      .quiz-loading-message {
        font-size: 14px;
        line-height: 1.5;
        color: #6b7280;
        margin: 0;
      }

      .quiz-loading-steps {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin: 8px 0;
      }

      /* Style slotted step elements */
      .quiz-loading-steps ::slotted(.loading-step) {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        background: #f8f9fa;
        border-radius: 8px;
        font-size: 14px;
        color: #6b7280;
        transition: var(--quiz-transition);
        position: relative;
      }

      .quiz-loading-steps ::slotted(.loading-step::before) {
        content: attr(data-step);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background: #e5e7eb;
        color: #6b7280;
        border-radius: 50%;
        font-size: 12px;
        font-weight: 600;
        margin-right: 12px;
        flex-shrink: 0;
      }

      .quiz-loading-steps ::slotted(.loading-step.active) {
        background: #f0f9ff;
        color: var(--quiz-primary-color);
        border: 1px solid #bfdbfe;
      }

      .quiz-loading-steps ::slotted(.loading-step.active::before) {
        background: var(--quiz-secondary-color);
        color: white;
      }

      .quiz-loading-steps ::slotted(.loading-step.completed) {
        background: #f0fdf4;
        color: #16a34a;
        border: 1px solid #bbf7d0;
      }

      .quiz-loading-steps ::slotted(.loading-step.completed::before) {
        background: #16a34a;
        color: white;
        content: "✓";
      }

      .quiz-loading-progress {
        width: 100%;
        margin-top: 8px;
      }

      .quiz-loading-progress-bar {
        width: 100%;
        height: 8px;
        background: #e5e7eb;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 8px;
      }

      .quiz-loading-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--quiz-secondary-color), #4ade80);
        border-radius: 4px;
        transition: width 0.3s ease;
        position: relative;
      }

      .quiz-loading-progress-fill::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.3),
          transparent
        );
        animation: shimmer 2s infinite;
      }

      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      .quiz-loading-progress-text {
        font-size: 13px;
        color: #6b7280;
        font-weight: 500;
      }

      /* Responsive design */
      @media (max-width: 768px) {
        .quiz-loading-display {
          padding: 24px 20px;
          min-height: 160px;
        }

        .quiz-loading-display.simple {
          min-height: 100px;
          padding: 20px 16px;
        }

        .quiz-loading-content {
          gap: 16px;
        }

        .quiz-loading-title {
          font-size: 18px;
        }

        .quiz-loading-message {
          font-size: 13px;
        }

        .quiz-loading-spinner-large {
          width: 40px;
          height: 40px;
          border-width: 3px;
        }

        .quiz-loading-steps ::slotted(.loading-step) {
          padding: 10px 14px;
          font-size: 13px;
        }

        .quiz-loading-steps ::slotted(.loading-step::before) {
          width: 20px;
          height: 20px;
          font-size: 11px;
          margin-right: 10px;
        }
      }

      @media (max-width: 480px) {
        .quiz-loading-display {
          padding: 20px 16px;
        }

        .quiz-loading-title {
          font-size: 16px;
        }

        .quiz-loading-steps {
          gap: 8px;
        }

        .quiz-loading-steps ::slotted(.loading-step) {
          padding: 8px 12px;
          font-size: 12px;
        }
      }
    `;
  }
  render() {
    this.renderTemplate();
  }
  handleAttributeChange(name, oldValue, newValue) {
    if (this.isConnected) {
      if (name === "progress") {
        this.updateProgress(newValue);
      } else {
        this.render();
      }
    }
  }
  updateProgress(progress) {
    const progressFill = this.querySelector(".quiz-loading-progress-fill");
    const progressText = this.querySelector(".quiz-loading-progress-text");
    if (progressFill) {
      progressFill.style.width = `${progress}%`;
    }
    if (progressText) {
      const currentStep = this.getAttribute("current-step") || "1";
      const totalSteps = this.getAttribute("total-steps") || "1";
      progressText.textContent = `${progress}% complete (${currentStep}/${totalSteps})`;
    }
  }
  onConnected() {
    this.dispatchCustomEvent("quiz-loading-display-ready", {
      type: this.getAttribute("type"),
      title: this.getAttribute("title"),
      progress: this.getAttribute("progress")
    });
  }
  /**
   * Utility method to set loading data programmatically
   */
  setLoading(type, title, message = "", progress = 0, currentStep = 1, totalSteps = 1) {
    this.setAttributes({
      type,
      title,
      message,
      progress: progress.toString(),
      "current-step": currentStep.toString(),
      "total-steps": totalSteps.toString()
    });
  }
  /**
   * Update progress programmatically
   */
  setProgress(progress, currentStep = null) {
    this.setAttribute("progress", progress.toString());
    if (currentStep !== null) {
      this.setAttribute("current-step", currentStep.toString());
    }
  }
  /**
   * Get loading data
   */
  getLoading() {
    return {
      type: this.getAttribute("type"),
      title: this.getAttribute("title"),
      message: this.getAttribute("message"),
      progress: parseInt(this.getAttribute("progress") || "0"),
      currentStep: parseInt(this.getAttribute("current-step") || "1"),
      totalSteps: parseInt(this.getAttribute("total-steps") || "1")
    };
  }
  /**
   * Show/hide spinner
   */
  toggleSpinner(show = null) {
    const currentShow = this.getBooleanAttribute("show-spinner", true);
    const newShow = show !== null ? show : !currentShow;
    this.setAttribute("show-spinner", newShow);
  }
}
if (!customElements.get("quiz-loading-display")) {
  quizComponentRegistry.register("quiz-loading-display", QuizLoadingDisplay);
}
const COMPONENT_CONFIG = {
  // Core icons
  "quiz-calendar-icon": {
    module: QuizCalendarIcon,
    category: "icons",
    description: "Calendar icon for date-related benefits"
  },
  "quiz-clock-icon": {
    module: QuizClockIcon,
    category: "icons",
    description: "Clock icon for time-related benefits"
  },
  "quiz-checkmark-icon": {
    module: QuizCheckmarkIcon,
    category: "icons",
    description: "Checkmark icon for success states"
  },
  // Content components
  "quiz-coverage-card": {
    module: QuizCoverageCard,
    category: "content",
    description: "Insurance coverage information card"
  },
  "quiz-benefit-item": {
    module: QuizBenefitItem,
    category: "content",
    description: "Individual benefit item with icon and text"
  },
  "quiz-action-section": {
    module: QuizActionSection,
    category: "content",
    description: "Call-to-action section with buttons and info"
  },
  "quiz-error-display": {
    module: QuizErrorDisplay,
    category: "content",
    description: "Error display with different severity levels"
  },
  "quiz-loading-display": {
    module: QuizLoadingDisplay,
    category: "content",
    description: "Loading display with progress and step indicators"
  }
};
function loadQuizComponents() {
  const startTime = performance.now();
  let loadedCount = 0;
  console.log("🚀 Loading Quiz Web Components...");
  Object.entries(COMPONENT_CONFIG).forEach(([tagName, config]) => {
    if (!quizComponentRegistry.isRegistered(tagName)) {
      try {
        loadedCount++;
        console.log(`  ✓ ${tagName} (${config.category})`);
      } catch (error) {
        console.error(`  ✗ Failed to load ${tagName}:`, error);
      }
    } else {
      console.log(`  ~ ${tagName} already registered`);
    }
  });
  const endTime = performance.now();
  console.log(`🎉 Quiz Components loaded: ${loadedCount} components in ${(endTime - startTime).toFixed(2)}ms`);
  return {
    loaded: loadedCount,
    total: Object.keys(COMPONENT_CONFIG).length,
    loadTime: endTime - startTime
  };
}
loadQuizComponents();
