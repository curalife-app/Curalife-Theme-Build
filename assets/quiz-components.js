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
class SharedStyles {
  constructor() {
    this.stylesCache = /* @__PURE__ */ new Map();
    this.loadingPromises = /* @__PURE__ */ new Map();
  }
  async loadStyles(cssPath) {
    if (this.stylesCache.has(cssPath)) {
      return this.stylesCache.get(cssPath);
    }
    if (this.loadingPromises.has(cssPath)) {
      return this.loadingPromises.get(cssPath);
    }
    const loadingPromise = this.fetchStyles(cssPath);
    this.loadingPromises.set(cssPath, loadingPromise);
    try {
      const styles = await loadingPromise;
      this.stylesCache.set(cssPath, styles);
      this.loadingPromises.delete(cssPath);
      return styles;
    } catch (error) {
      this.loadingPromises.delete(cssPath);
      throw error;
    }
  }
  async fetchStyles(cssPath) {
    try {
      const response = await fetch(cssPath);
      if (!response.ok) {
        throw new Error(`Failed to load CSS: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.warn(`Could not load shared styles from ${cssPath}:`, error);
      if (cssPath.includes("/assets/quiz.css")) {
        const alternatives = [cssPath.replace("/assets/", "/assets/"), "./assets/quiz.css", "../assets/quiz.css"];
        for (const altPath of alternatives) {
          if (altPath !== cssPath) {
            try {
              const altResponse = await fetch(altPath);
              if (altResponse.ok) {
                console.log(`✓ Loaded styles from alternative path: ${altPath}`);
                return await altResponse.text();
              }
            } catch (altError) {
            }
          }
        }
      }
      return "";
    }
  }
  // Get quiz-specific styles with configurable URL
  async getQuizStyles(cssUrl = null) {
    const url = cssUrl || window.QUIZ_CSS_URL || "/assets/quiz.css";
    if (window.QUIZ_CONFIG?.debug) {
      console.log(`🎨 Loading quiz styles from: ${url}`);
    }
    return this.loadStyles(url);
  }
  // Create a style element with the shared styles
  createStyleElement(additionalCSS = "", cssUrl = null) {
    const styleElement = document.createElement("style");
    this.getQuizStyles(cssUrl).then((sharedCSS) => {
      styleElement.textContent = sharedCSS + "\n" + additionalCSS;
    }).catch(() => {
      styleElement.textContent = additionalCSS;
    });
    styleElement.textContent = additionalCSS;
    return styleElement;
  }
  // Set global CSS URL for all components
  setQuizCssUrl(url) {
    window.QUIZ_CSS_URL = url;
  }
}
const sharedStyles = new SharedStyles();
class QuizBaseComponent extends HTMLElement {
  constructor() {
    super();
    this.config = {
      useShadowDOM: true,
      inheritStyles: true,
      autoRender: true
    };
    this.isInitialized = false;
    this._isComponentConnected = false;
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
    this._isComponentConnected = true;
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
    this._isComponentConnected = false;
    this.cleanup();
    this.onDisconnected();
  }
  /**
   * Lifecycle: Attribute changed
   */
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    this.handleAttributeChange(name, oldValue, newValue);
    if (this._isComponentConnected && this.config.autoRender) {
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
   * Check if component is connected (use native isConnected for DOM connection status)
   */
  get isComponentConnected() {
    return this._isComponentConnected;
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
    this.root.innerHTML = "";
    const cssUrl = window.QUIZ_CSS_URL || window.QUIZ_CONFIG?.cssUrl;
    const styleElement = sharedStyles.createStyleElement(this.getStyles(), cssUrl);
    this.root.appendChild(styleElement);
    const template = this.getTemplate();
    if (template) {
      const templateElement = document.createElement("template");
      templateElement.innerHTML = template;
      this.root.appendChild(templateElement.content.cloneNode(true));
    }
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
      const componentMap = {
        "quiz-calendar-icon": () => __vitePreload(() => Promise.resolve().then(() => quizCalendarIcon), true ? void 0 : void 0),
        "quiz-clock-icon": () => __vitePreload(() => Promise.resolve().then(() => quizClockIcon), true ? void 0 : void 0),
        "quiz-checkmark-icon": () => __vitePreload(() => Promise.resolve().then(() => quizCheckmarkIcon), true ? void 0 : void 0),
        "quiz-coverage-card": () => __vitePreload(() => Promise.resolve().then(() => quizCoverageCard), true ? void 0 : void 0),
        "quiz-benefit-item": () => __vitePreload(() => Promise.resolve().then(() => quizBenefitItem), true ? void 0 : void 0),
        "quiz-action-section": () => __vitePreload(() => Promise.resolve().then(() => quizActionSection), true ? void 0 : void 0),
        "quiz-error-display": () => __vitePreload(() => Promise.resolve().then(() => quizErrorDisplay), true ? void 0 : void 0),
        "quiz-loading-display": () => __vitePreload(() => Promise.resolve().then(() => quizLoadingDisplay), true ? void 0 : void 0)
      };
      const importFn = componentMap[componentName];
      if (!importFn) {
        throw new Error(`Unknown component: ${componentName}`);
      }
      const module = await importFn();
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
const quizCalendarIcon = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: QuizCalendarIcon
}, Symbol.toStringTag, { value: "Module" }));
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
const quizClockIcon = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: QuizClockIcon
}, Symbol.toStringTag, { value: "Module" }));
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
const quizCheckmarkIcon = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: QuizCheckmarkIcon
}, Symbol.toStringTag, { value: "Module" }));
class QuizCoverageCard extends QuizBaseComponent {
  static get observedAttributes() {
    return ["title", "sessions-covered", "plan-end"];
  }
  connectedCallback() {
    this.render();
  }
  attributeChangedCallback() {
    if (this.isConnected) {
      this.render();
    }
  }
  render() {
    this.getAttribute("title") || "Here's Your Offer";
    this.getAttribute("sessions-covered") || "5";
    this.getAttribute("plan-end") || "Dec 31, 2025";
    this.renderTemplate();
  }
  getTemplate() {
    const title = this.getAttribute("title") || "Here's Your Offer";
    const sessionsCovered = this.getAttribute("sessions-covered") || "5";
    const planEnd = this.getAttribute("plan-end") || "Dec 31, 2025";
    return `
			<div class="quiz-coverage-card">
				<div class="quiz-coverage-card-title">${title}</div>
				<div class="quiz-coverage-pricing">
					<div class="quiz-coverage-service-item">
						<div class="quiz-coverage-service">${sessionsCovered} sessions with a Registered Dietitian</div>
						<div class="quiz-coverage-cost">
							<div class="quiz-coverage-copay">$0 copay</div>
							<div class="quiz-coverage-original-price">$1,200</div>
						</div>
					</div>
				</div>
				<div class="quiz-coverage-divider"></div>
				<div class="quiz-coverage-benefits">
					<div class="quiz-coverage-benefit">
						<quiz-checkmark-icon class="quiz-coverage-benefit-icon"></quiz-checkmark-icon>
						<div class="quiz-coverage-benefit-text">${sessionsCovered} sessions covered</div>
					</div>
					<div class="quiz-coverage-benefit">
						<quiz-calendar-icon class="quiz-coverage-benefit-icon"></quiz-calendar-icon>
						<div class="quiz-coverage-benefit-text">Coverage expires ${planEnd}</div>
					</div>
				</div>
			</div>
		`;
  }
  getStyles() {
    return `
				:host {
					display: block;
				}

				.quiz-coverage-card {
					border: 1px solid #bdddc9;
					border-radius: 20px;
					padding: 32px;
					background-color: white;
					margin-bottom: 36px;
					align-self: stretch;
				}

				.quiz-coverage-card-title {
					font-family: "PP Radio Grotesk", sans-serif;
					font-size: 24px;
					font-weight: 700;
					line-height: 1.3333333333333333em;
					color: #121212;
					margin-bottom: 16px;
				}

				.quiz-coverage-pricing {
					display: flex;
					flex-direction: column;
					gap: 8px;
					margin-bottom: 16px;
					width: fit-content;
				}

				.quiz-coverage-service-item {
					display: flex;
					align-items: center;
					gap: 32px;
					width: fit-content;
				}

				.quiz-coverage-service {
					font-family: "DM Sans", sans-serif;
					font-size: 18px;
					font-weight: 400;
					line-height: 1.4444444444444444em;
					color: #121212;
					flex: 1;
					width: 312px;
				}

				.quiz-coverage-cost {
					display: flex;
					align-items: center;
					gap: 4px;
				}

				.quiz-coverage-copay {
					font-family: "DM Sans", sans-serif;
					font-size: 18px;
					font-weight: 800;
					line-height: 1.4444444444444444em;
					color: #121212;
				}

				.quiz-coverage-original-price {
					font-family: "DM Sans", sans-serif;
					font-size: 18px;
					font-weight: 400;
					line-height: 1.3333333333333333em;
					color: #6d6d6d;
					text-decoration: line-through;
				}

				.quiz-coverage-divider {
					width: 100%;
					height: 0.5px;
					background-color: #bdddc9;
					margin: 16px 0;
				}

				.quiz-coverage-benefits {
					display: flex;
					flex-direction: column;
					gap: 12px;
				}

				.quiz-coverage-benefit {
					display: flex;
					align-items: center;
					gap: 8px;
				}

				.quiz-coverage-benefit-icon {
					width: 20px;
					height: 20px;
					flex-shrink: 0;
				}

				.quiz-coverage-benefit-text {
					font-family: "DM Sans", sans-serif;
					font-size: 16px;
					font-weight: 400;
					line-height: 1.5em;
					color: #4f4f4f;
				}

				@media (max-width: 768px) {
					.quiz-coverage-card {
						padding: 20px;
						margin-bottom: 28px;
						align-self: stretch;
						width: 100%;
					}

					.quiz-coverage-card-title {
						font-size: 24px;
						line-height: 1.3333333333333333em;
						margin-bottom: 12px;
					}

					.quiz-coverage-pricing {
						flex-direction: column;
						gap: 16px;
						align-items: stretch;
						margin-bottom: 16px;
					}

					.quiz-coverage-service-item {
						display: flex;
						flex-direction: column;
						gap: 8px;
						width: 100%;
						align-items: start;
					}

					.quiz-coverage-service {
						font-size: 18px;
						line-height: 1.3333333333333333em;
						width: unset;
					}

					.quiz-coverage-cost {
						display: flex;
						align-items: center;
						gap: 4px;
					}

					.quiz-coverage-copay {
						font-size: 18px;
						font-weight: 700;
						line-height: 1.3333333333333333em;
					}

					.quiz-coverage-original-price {
						font-size: 18px;
						line-height: 1.3333333333333333em;
					}

					.quiz-coverage-benefits {
						gap: 12px;
					}

					.quiz-coverage-benefit-text {
						font-size: 16px;
						line-height: 1.5em;
					}

					.quiz-coverage-divider {
						margin: 16px 0;
					}
				}
		`;
  }
}
if (!customElements.get("quiz-coverage-card")) {
  quizComponentRegistry.register("quiz-coverage-card", QuizCoverageCard);
}
const quizCoverageCard = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: QuizCoverageCard
}, Symbol.toStringTag, { value: "Module" }));
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
const quizBenefitItem = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: QuizBenefitItem
}, Symbol.toStringTag, { value: "Module" }));
class QuizActionSection extends QuizBaseComponent {
  static get observedAttributes() {
    return ["title", "type", "background-color", "result-url"];
  }
  getTemplate() {
    const title = this.getAttribute("title") || "Schedule your initial online consultation now";
    const type = this.getAttribute("type") || "default";
    const backgroundColor = this.getAttribute("background-color") || "#F1F8F4";
    const resultUrl = this.getAttribute("result-url") || "#";
    return `
      <div class="quiz-action-section" data-type="${type}" style="background-color: ${backgroundColor};">
        <div class="quiz-action-content">
          <div class="quiz-action-header">
            <h3 class="quiz-action-title">${this.sanitizeHTML(title)}</h3>
          </div>
          <div class="quiz-action-details">
            <div class="quiz-action-info">
              <div class="quiz-action-info-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M12.4214 14.5583C12.4709 14.3109 12.6316 14.1021 12.8477 13.972C14.3893 13.0437 15.4163 11.5305 15.4163 9.58378C15.4163 6.59224 12.9913 4.16711 9.99967 4.16711C7.00813 4.16711 4.58301 6.59224 4.58301 9.58378C4.58301 11.5305 5.60997 13.0437 7.15168 13.972C7.36778 14.1021 7.52844 14.3109 7.57791 14.5583L7.78236 15.5805C7.86027 15.97 8.20227 16.2504 8.59951 16.2504H11.3998C11.7971 16.2504 12.1391 15.97 12.217 15.5805L12.4214 14.5583Z" stroke="#418865" stroke-width="1.25" stroke-linejoin="round"/>
<path d="M17.4997 9.58378H17.9163M2.08301 9.58378H2.49967M15.3024 4.28048L15.597 3.98586M4.16634 15.4171L4.58301 15.0004M15.4163 15.0004L15.833 15.4171M4.40234 3.98644L4.69697 4.28106M9.99967 2.08378V1.66711" stroke="#418865" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M11.6663 16.25V17.5C11.6663 17.9602 11.2933 18.3333 10.833 18.3333H9.16634C8.70609 18.3333 8.33301 17.9602 8.33301 17.5V16.25" stroke="#418865" stroke-width="1.25" stroke-linejoin="round"/>
</svg>

              </div>
              <div class="quiz-action-info-text">Our dietitians usually recommend minimum 6 consultations over 6 months, Today, just book your first.</div>
            </div>
            <div class="quiz-action-feature">
              <div class="quiz-action-feature-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10.417 2.5031C9.67107 2.49199 8.92091 2.51074 8.19149 2.55923C4.70565 2.79094 1.929 5.60698 1.70052 9.14225C1.65582 9.83408 1.65582 10.5506 1.70052 11.2424C1.78374 12.53 2.35318 13.7222 3.02358 14.7288C3.41283 15.4336 3.15594 16.3132 2.7505 17.0815C2.45817 17.6355 2.312 17.9125 2.42936 18.1126C2.54672 18.3127 2.80887 18.3191 3.33318 18.3318C4.37005 18.3571 5.06922 18.0631 5.62422 17.6538C5.93899 17.4218 6.09638 17.3057 6.20486 17.2923C6.31332 17.279 6.5268 17.3669 6.95367 17.5427C7.33732 17.7007 7.78279 17.7982 8.19149 17.8254C9.37832 17.9043 10.6199 17.9045 11.8092 17.8254C15.295 17.5937 18.0717 14.7777 18.3002 11.2424C18.3354 10.6967 18.3428 10.1356 18.3225 9.58333" stroke="#418865" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M18.333 6.66663L13.333 1.66663M18.333 1.66663L13.333 6.66663" stroke="#418865" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M9.99658 10.4166H10.004M13.3262 10.4166H13.3337M6.66699 10.4166H6.67447" stroke="#418865" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
</svg>

              </div>
              <div class="quiz-action-feature-text">Free cancellation up to 24h before</div>
            </div>
          </div>
          <a href="${resultUrl}" class="quiz-booking-button">Proceed to booking</a>

          <!-- Slots for additional content -->
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
      }

      .quiz-action-section {
        background-color: #f1f8f4;
        border-radius: 20px;
        padding: 32px;
        margin-bottom: 72px;
        align-self: stretch;
      }

      .quiz-action-content {
        display: flex;
        flex-direction: column;
        gap: 0;
        align-self: stretch;
      }

      .quiz-action-header {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .quiz-action-title {
        font-family: "PP Radio Grotesk", sans-serif;
        font-size: 24px;
        font-weight: 700;
        line-height: 1.3333333333333333em;
        color: #121212;
				margin: 0;
      }

      .quiz-action-details {
        display: flex;
        flex-direction: column;
        gap: 12px;
        align-self: stretch;
        margin-top: 12px;
        max-width: 550px;
      }

      .quiz-action-info {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        align-self: stretch;
      }

      .quiz-action-info-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .quiz-action-info-text {
        line-height: 1.4444444444444444em;
        color: #121212;
        flex: 1;
      }

      .quiz-action-feature {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .quiz-action-feature-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      .quiz-action-feature-text {
        font-family: "DM Sans", sans-serif;
        font-size: 18px;
        font-weight: 400;
        line-height: 1.4444444444444444em;
        color: #121212;
      }

      .quiz-booking-button {
        background-color: #306e51;
        color: white;
        border: none;
        border-radius: 300px;
        padding: 12px 40px;
        font-family: "DM Sans", sans-serif;
        font-size: 18px;
        font-weight: 600;
        line-height: 1.3333333333333333em;
        text-align: center;
        cursor: pointer;
        transition: all var(--quiz-transition-fast);
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: fit-content;
        margin-top: 32px;
      }

      .quiz-booking-button:hover {
        background-color: var(--quiz-primary-hover);
        transform: translateY(-1px);
      }

      .quiz-booking-button:disabled {
        background-color: #ccc !important;
        cursor: not-allowed !important;
        transform: none !important;
        box-shadow: none !important;
      }

      .quiz-booking-button:disabled:hover {
        background-color: #ccc !important;
        transform: none !important;
        box-shadow: none !important;
      }

      /* Mobile responsive styles */
      @media (max-width: 768px) {
        .quiz-action-section {
          padding: 32px;
        }

        .quiz-action-title {
          font-size: 24px;
        }

        .quiz-action-details {
          gap: 12px;
        }

        .quiz-booking-button {
          padding: 12px 40px;
          font-size: 18px;
          margin-top: 32px;
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
const quizActionSection = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: QuizActionSection
}, Symbol.toStringTag, { value: "Module" }));
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
const quizErrorDisplay = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: QuizErrorDisplay
}, Symbol.toStringTag, { value: "Module" }));
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
      <div class="quiz-comprehensive-loading">
        <div class="quiz-loading-content">
          ${showSpinner ? `
            <div class="quiz-loading-icon">
              <div class="quiz-loading-spinner-large"></div>
            </div>
          ` : ""}

          <div class="quiz-loading-step">
            <h3 class="quiz-loading-step-title">${this.sanitizeHTML(title)}</h3>
            ${message ? `<p class="quiz-loading-step-description">${this.sanitizeHTML(message)}</p>` : ""}
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
      }

      .quiz-loading-display {
        background: white;
        border-radius: 8px;
        padding: 32px 24px;
        text-align: center;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .quiz-loading-display.simple {
        min-height: 120px;
        padding: 24px;
      }

      .quiz-comprehensive-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 400px;
        padding: 2rem;
        text-align: center;
      }

      .quiz-loading-content {
        max-width: 500px;
        width: 100%;
      }

      .quiz-loading-icon {
        margin-bottom: 2rem;
        display: flex;
        justify-content: center;
      }

      .quiz-loading-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #f3f4f6;
        border-top: 3px solid #10b981;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      .quiz-loading-spinner-large {
        width: 60px;
        height: 60px;
        border: 4px solid #f3f4f6;
        border-top: 4px solid #10b981;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .quiz-loading-step {
        margin-bottom: 2rem;
      }

      .quiz-loading-step-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        display: block;
        transition: opacity 0.3s ease-in-out;
        transform: scale(1);
        animation: pulseIcon 2s ease-in-out infinite;
      }

      .quiz-loading-step-title {
        font-size: 1.5rem;
        font-weight: 600;
        color: #111827;
        margin-bottom: 0.5rem;
        transition: opacity 0.3s ease-in-out;
      }

      .quiz-loading-step-description {
        font-size: 1rem;
        color: #6b7280;
        margin-bottom: 0;
        transition: opacity 0.3s ease-in-out;
      }

      .quiz-loading-progress {
        margin-top: 2rem;
      }

      .quiz-loading-progress-bar {
        width: 100%;
        height: 8px;
        background-color: #f3f4f6;
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 1rem;
      }

      .quiz-loading-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #10b981, #059669);
        border-radius: 4px;
        transition: width 0.8s ease-in-out;
        position: relative;
      }

      .quiz-loading-progress-fill::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        animation: shimmer 2s infinite;
      }

      .quiz-loading-progress-text {
        font-size: 0.875rem;
        color: #6b7280;
        font-weight: 500;
      }

      @keyframes pulseIcon {
        0%, 100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.1);
        }
      }

      @keyframes shimmer {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }

      /* Mobile responsive styles */
      @media (max-width: 768px) {
        .quiz-comprehensive-loading {
          padding: 2rem;
        }

        .quiz-loading-content {
          .quiz-loading-icon {
            .quiz-loading-spinner-large {
              width: 48px;
              height: 48px;
              border-width: 3px;
            }
          }

          .quiz-loading-step {
            .quiz-loading-step-icon {
              font-size: 2.5rem;
            }

            .quiz-loading-step-title {
              font-size: 1.25rem;
            }

            .quiz-loading-step-description {
              font-size: 0.875rem;
            }
          }
        }
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
const quizLoadingDisplay = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: QuizLoadingDisplay
}, Symbol.toStringTag, { value: "Module" }));
class QuizFAQSection extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.faqData = [];
  }
  static get observedAttributes() {
    return ["faq-data"];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === "faq-data" && newValue) {
      try {
        this.faqData = JSON.parse(newValue);
        this.render();
      } catch (error) {
        console.error("Invalid FAQ data:", error);
      }
    }
  }
  connectedCallback() {
    this.render();
  }
  async render() {
    const sharedStyles2 = await SharedStyles.getQuizStyles();
    const template = this.getTemplate();
    const styles = this.getStyles();
    this.shadowRoot.innerHTML = `
			<style>
				${sharedStyles2}
				${styles}
			</style>
			${template}
		`;
    this.attachEventListeners();
  }
  getTemplate() {
    if (!this.faqData || this.faqData.length === 0) {
      return "<div></div>";
    }
    return `
			<div class="quiz-faq-section">
				<div class="quiz-faq-divider"></div>
				${this.faqData.map(
      (faq) => `
					<div class="quiz-faq-item" data-faq="${faq.id}" tabindex="0" role="button" aria-expanded="false">
						<div class="quiz-faq-content">
							<div class="quiz-faq-question-collapsed">${faq.question}</div>
							<div class="quiz-faq-answer">${faq.answer}</div>
						</div>
						<div class="quiz-faq-toggle">
							<svg class="quiz-faq-toggle-icon" width="32" height="32" viewBox="0 0 32 32" fill="none">
								<path d="M4 16H28" stroke="#4f4f4f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								<path d="M16 4V28" stroke="#4f4f4f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</div>
					</div>
					<div class="quiz-faq-divider"></div>
				`
    ).join("")}
			</div>
		`;
  }
  getStyles() {
    return `
			:host {
				display: block;
			}
		`;
  }
  attachEventListeners() {
    const faqItems = this.shadowRoot.querySelectorAll(".quiz-faq-item");
    faqItems.forEach((item) => {
      item.addEventListener("click", () => {
        const isExpanded = item.classList.contains("expanded");
        if (!isExpanded) {
          item.classList.add("expanded");
          item.setAttribute("aria-expanded", "true");
          const question = item.querySelector(".quiz-faq-question, .quiz-faq-question-collapsed");
          if (question) question.className = "quiz-faq-question";
        } else {
          item.classList.remove("expanded");
          item.setAttribute("aria-expanded", "false");
          const question = item.querySelector(".quiz-faq-question, .quiz-faq-question-collapsed");
          if (question) question.className = "quiz-faq-question-collapsed";
        }
      });
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          item.click();
        }
      });
    });
  }
  // Public API for setting FAQ data
  setFAQData(faqData) {
    this.faqData = faqData;
    this.render();
  }
}
if (!customElements.get("quiz-faq-section")) {
  customElements.define("quiz-faq-section", QuizFAQSection);
}
class QuizPayerSearch extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.selectedPayer = "";
    this.placeholder = "Start typing to search for your insurance plan...";
    this.commonPayers = [];
    this.questionId = "";
    this.searchTimeout = null;
  }
  static get observedAttributes() {
    return ["question-id", "placeholder", "selected-payer", "common-payers"];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "question-id":
        this.questionId = newValue || "";
        break;
      case "placeholder":
        this.placeholder = newValue || "Start typing to search for your insurance plan...";
        break;
      case "selected-payer":
        this.selectedPayer = newValue || "";
        break;
      case "common-payers":
        try {
          this.commonPayers = newValue ? JSON.parse(newValue) : [];
        } catch (error) {
          console.error("Invalid common payers data:", error);
          this.commonPayers = [];
        }
        break;
    }
    if (this.shadowRoot.innerHTML) {
      this.render();
    }
  }
  connectedCallback() {
    this.render();
  }
  async render() {
    const sharedStyles2 = await SharedStyles.getQuizStyles();
    const template = this.getTemplate();
    const styles = this.getStyles();
    this.shadowRoot.innerHTML = `
			<style>
				${sharedStyles2}
				${styles}
			</style>
			${template}
		`;
    this.attachEventListeners();
  }
  getTemplate() {
    const selectedDisplayName = this.resolvePayerDisplayName(this.selectedPayer);
    return `
			<div class="quiz-payer-search-container">
				<div class="quiz-payer-search-input-wrapper">
					<input
						type="text"
						id="question-${this.questionId}"
						class="quiz-payer-search-input"
						placeholder="${this.placeholder}"
						value="${selectedDisplayName}"
						autocomplete="off"
						aria-describedby="error-${this.questionId}"
					>
					<svg class="quiz-payer-search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
						<path d="M13.1667 13.1667L16.5 16.5M14.8333 8.16667C14.8333 4.48477 11.8486 1.5 8.16667 1.5C4.48477 1.5 1.5 4.48477 1.5 8.16667C1.5 11.8486 4.48477 14.8333 8.16667 14.8333C11.8486 14.8333 14.8333 11.8486 14.8333 8.16667Z" stroke="#121212" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</div>
				<div class="quiz-payer-search-dropdown" id="search-dropdown-${this.questionId}" style="display: none;">
					<div class="quiz-payer-search-dropdown-header">
						<span class="quiz-payer-search-dropdown-title">Suggestions</span>
						<button class="quiz-payer-search-close-btn" type="button" aria-label="Close dropdown">
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M12 4L4 12M4 4L12 12" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</button>
					</div>
					<div class="quiz-payer-search-results"></div>
				</div>
				<p id="error-${this.questionId}" class="quiz-error-text quiz-error-hidden"></p>
			</div>
		`;
  }
  getStyles() {
    return `
			:host {
				display: block;
			}
		`;
  }
  attachEventListeners() {
    const searchInput = this.shadowRoot.querySelector(".quiz-payer-search-input");
    const dropdown = this.shadowRoot.querySelector(".quiz-payer-search-dropdown");
    const closeBtn = this.shadowRoot.querySelector(".quiz-payer-search-close-btn");
    const container = this.shadowRoot.querySelector(".quiz-payer-search-container");
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.trim();
      this.handleSearch(query, dropdown);
    });
    searchInput.addEventListener("focus", () => {
      if (searchInput.value.trim() === "") {
        this.showInitialPayerList(dropdown);
      }
      this.openDropdown(dropdown, container, searchInput);
    });
    closeBtn.addEventListener("click", () => {
      this.closeDropdown(dropdown, container, searchInput);
    });
    document.addEventListener("click", (e) => {
      if (!container.contains(e.target)) {
        this.closeDropdown(dropdown, container, searchInput);
      }
    });
  }
  handleSearch(query, dropdown) {
    clearTimeout(this.searchTimeout);
    if (query.length === 0) {
      this.showInitialPayerList(dropdown);
      return;
    }
    this.searchTimeout = setTimeout(async () => {
      try {
        const results = await this.searchPayers(query);
        this.renderSearchResults(results, query, dropdown);
      } catch (error) {
        console.error("Search error:", error);
        this.showSearchError(dropdown);
      }
    }, 300);
  }
  async searchPayers(query) {
    const commonResults = this.filterCommonPayers(query);
    if (commonResults.length > 0) {
      return commonResults;
    }
    try {
      return await this.searchPayersAPI(query);
    } catch (error) {
      console.error("API search failed:", error);
      return commonResults;
    }
  }
  filterCommonPayers(query) {
    const queryLower = query.toLowerCase();
    return this.commonPayers.filter((payer) => {
      const nameMatch = payer.displayName.toLowerCase().includes(queryLower);
      const aliasMatch = payer.aliases?.some((alias) => alias.toLowerCase().includes(queryLower));
      return nameMatch || aliasMatch;
    });
  }
  async searchPayersAPI(query) {
    return [];
  }
  showInitialPayerList(dropdown) {
    const resultsContainer = dropdown.querySelector(".quiz-payer-search-results");
    resultsContainer.innerHTML = this.commonPayers.map(
      (payer) => `
			<div class="quiz-payer-search-item" data-payer-id="${payer.stediId}" data-payer-name="${payer.displayName}">
				<div class="quiz-payer-search-item-name">${payer.displayName}</div>
				<div class="quiz-payer-search-item-details">ID: ${payer.primaryPayerId}</div>
			</div>
		`
    ).join("");
    this.attachResultListeners(dropdown);
  }
  renderSearchResults(results, query, dropdown) {
    const resultsContainer = dropdown.querySelector(".quiz-payer-search-results");
    if (results.length === 0) {
      resultsContainer.innerHTML = `
				<div class="quiz-payer-search-no-results">
					No insurance plans found for "${query}"
				</div>
			`;
      return;
    }
    resultsContainer.innerHTML = results.map(
      (payer) => `
			<div class="quiz-payer-search-item" data-payer-id="${payer.stediId}" data-payer-name="${payer.displayName}">
				<div class="quiz-payer-search-item-name">${this.highlightSearchTerm(payer.displayName, query)}</div>
				<div class="quiz-payer-search-item-details">ID: ${payer.primaryPayerId}</div>
			</div>
		`
    ).join("");
    this.attachResultListeners(dropdown);
  }
  attachResultListeners(dropdown) {
    const items = dropdown.querySelectorAll(".quiz-payer-search-item");
    items.forEach((item) => {
      item.addEventListener("click", () => {
        const payerId = item.dataset.payerId;
        const payerName = item.dataset.payerName;
        this.selectPayer({ stediId: payerId, displayName: payerName });
      });
    });
  }
  selectPayer(payer) {
    const searchInput = this.shadowRoot.querySelector(".quiz-payer-search-input");
    const dropdown = this.shadowRoot.querySelector(".quiz-payer-search-dropdown");
    const container = this.shadowRoot.querySelector(".quiz-payer-search-container");
    searchInput.value = payer.displayName;
    this.selectedPayer = payer.stediId;
    this.closeDropdown(dropdown, container, searchInput);
    this.dispatchEvent(
      new CustomEvent("payer-selected", {
        detail: {
          questionId: this.questionId,
          payer
        },
        bubbles: true
      })
    );
  }
  openDropdown(dropdown, container, searchInput) {
    dropdown.style.display = "block";
    container.classList.add("dropdown-open");
    searchInput.classList.add("dropdown-open");
  }
  closeDropdown(dropdown, container, searchInput) {
    dropdown.style.display = "none";
    container.classList.remove("dropdown-open");
    searchInput.classList.remove("dropdown-open");
  }
  showSearchError(dropdown) {
    const resultsContainer = dropdown.querySelector(".quiz-payer-search-results");
    resultsContainer.innerHTML = `
			<div class="quiz-payer-search-error">
				Unable to search at this time. Please try again.
			</div>
		`;
  }
  highlightSearchTerm(text, searchTerm) {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, "gi");
    return text.replace(regex, '<span class="quiz-payer-search-highlight">$1</span>');
  }
  resolvePayerDisplayName(payerId) {
    if (!payerId) return "";
    const payer = this.commonPayers.find((p) => p.stediId === payerId || p.primaryPayerId === payerId);
    return payer ? payer.displayName : payerId;
  }
  // Public API
  setValue(value) {
    this.selectedPayer = value;
    const searchInput = this.shadowRoot.querySelector(".quiz-payer-search-input");
    if (searchInput) {
      searchInput.value = this.resolvePayerDisplayName(value);
    }
  }
  getValue() {
    return this.selectedPayer;
  }
}
if (!customElements.get("quiz-payer-search")) {
  customElements.define("quiz-payer-search", QuizPayerSearch);
}
class QuizResultCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.resultType = "generic";
    this.resultData = {};
    this.resultUrl = "";
  }
  static get observedAttributes() {
    return ["result-type", "result-data", "result-url"];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "result-type":
        this.resultType = newValue || "generic";
        break;
      case "result-data":
        try {
          this.resultData = newValue ? JSON.parse(newValue) : {};
        } catch (error) {
          console.error("Invalid result data:", error);
          this.resultData = {};
        }
        break;
      case "result-url":
        this.resultUrl = newValue || "";
        break;
    }
    if (this.shadowRoot.innerHTML) {
      this.render();
    }
  }
  connectedCallback() {
    this.render();
  }
  async render() {
    const sharedStyles2 = await SharedStyles.getQuizStyles();
    const template = this.getTemplate();
    const styles = this.getStyles();
    this.shadowRoot.innerHTML = `
			<style>
				${sharedStyles2}
				${styles}
			</style>
			${template}
		`;
    this.attachEventListeners();
  }
  getTemplate() {
    switch (this.resultType) {
      case "eligible":
        return this.getEligibleTemplate();
      case "not-covered":
        return this.getNotCoveredTemplate();
      case "aaa-error":
        return this.getAAAErrorTemplate();
      case "test-data-error":
        return this.getTestDataErrorTemplate();
      case "technical-problem":
        return this.getTechnicalProblemTemplate();
      case "processing":
        return this.getProcessingTemplate();
      case "ineligible":
        return this.getIneligibleTemplate();
      default:
        return this.getGenericTemplate();
    }
  }
  getStyles() {
    return `
			:host {
				display: block;
			}

			.result-card {
				background: white;
				border-radius: 12px;
				padding: 24px;
				margin-bottom: 24px;
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
			}

			.result-header {
				margin-bottom: 20px;
			}

			.result-title {
				font-family: "PP Radio Grotesk", sans-serif;
				font-size: 24px;
				font-weight: 700;
				line-height: 1.3;
				color: #121212;
				margin: 0 0 8px 0;
			}

			.result-subtitle {
				font-family: "DM Sans", sans-serif;
				font-size: 16px;
				color: #666;
				margin: 0;
			}

			.result-content {
				margin-bottom: 20px;
			}

			.result-actions {
				display: flex;
				gap: 12px;
				flex-wrap: wrap;
			}

			.result-button {
				background-color: #306e51;
				color: white;
				border: none;
				border-radius: 300px;
				padding: 14px 40px;
				font-family: "DM Sans", sans-serif;
				font-size: 18px;
				font-weight: 600;
				text-decoration: none;
				display: inline-flex;
				align-items: center;
				justify-content: center;
				cursor: pointer;
				transition: all 0.2s ease;
			}

			.result-button:hover {
				background-color: #245a42;
				transform: translateY(-1px);
			}

			.error-card {
				border-left: 4px solid #f56565;
				background-color: #fed7d7;
			}

			.warning-card {
				border-left: 4px solid #ed8936;
				background-color: #fffaf0;
			}

			.success-card {
				border-left: 4px solid #48bb78;
				background-color: #f0fff4;
			}

			.info-card {
				border-left: 4px solid #4299e1;
				background-color: #ebf8ff;
			}

			.feature-list {
				list-style: none;
				padding: 0;
				margin: 16px 0;
			}

			.feature-item {
				display: flex;
				align-items: center;
				gap: 12px;
				margin-bottom: 12px;
				font-family: "DM Sans", sans-serif;
				font-size: 16px;
				color: #333;
			}

			.feature-icon {
				width: 20px;
				height: 20px;
				flex-shrink: 0;
			}

			.error-details {
				margin-top: 16px;
				padding: 12px;
				background: rgba(0, 0, 0, 0.05);
				border-radius: 8px;
				font-family: "DM Sans", sans-serif;
				font-size: 14px;
				color: #666;
			}
		`;
  }
  getEligibleTemplate() {
    const sessionsCovered = this.resultData.sessionsCovered || 5;
    const planEnd = this.resultData.planEnd || "Dec 31, 2025";
    return `
			<div class="result-card success-card">
				<div class="result-header">
					<h2 class="result-title">Great news! You're covered</h2>
					<p class="result-subtitle">As of today, your insurance fully covers your online dietitian consultations*</p>
				</div>
				<div class="result-content">
					<ul class="feature-list">
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z" stroke="#48bb78" stroke-width="1.5"/>
								<path d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329" stroke="#48bb78" stroke-width="1.5"/>
							</svg>
							Up to ${sessionsCovered} sessions covered through ${planEnd}
						</li>
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z" stroke="#48bb78" stroke-width="1.5"/>
								<path d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329" stroke="#48bb78" stroke-width="1.5"/>
							</svg>
							Licensed registered dietitians
						</li>
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z" stroke="#48bb78" stroke-width="1.5"/>
								<path d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329" stroke="#48bb78" stroke-width="1.5"/>
							</svg>
							Personalized nutrition plans
						</li>
					</ul>
				</div>
				<div class="result-actions">
					<a href="${this.resultUrl}" class="result-button">Schedule Your Consultation</a>
				</div>
			</div>
		`;
  }
  getNotCoveredTemplate() {
    const userMessage = this.resultData.userMessage || "Your insurance plan doesn't cover nutrition counseling, but we have affordable options available.";
    return `
			<div class="result-card warning-card">
				<div class="result-header">
					<h2 class="result-title">Thanks for completing the quiz!</h2>
					<p class="result-subtitle">We have options for you.</p>
				</div>
				<div class="result-content">
					<p><strong>💡 Coverage Information:</strong></p>
					<p>${userMessage}</p>
					<ul class="feature-list">
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z" stroke="#ed8936" stroke-width="1.5"/>
								<path d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329" stroke="#ed8936" stroke-width="1.5"/>
							</svg>
							Affordable self-pay options available
						</li>
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M18.3333 14.1667C18.3333 15.0871 17.5871 15.8333 16.6667 15.8333H5.83333L1.66666 20V3.33333C1.66666 2.41286 2.41285 1.66667 3.33333 1.66667H16.6667C17.5871 1.66667 18.3333 2.41286 18.3333 3.33333V14.1667Z" stroke="#ed8936" stroke-width="1.5"/>
							</svg>
							Flexible payment plans
						</li>
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M6.66666 2.5V5.83333M13.3333 2.5V5.83333M2.5 9.16667H17.5M4.16666 3.33333H15.8333C16.7538 3.33333 17.5 4.07952 17.5 5V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16666C3.24619 18.3333 2.5 17.5871 2.5 16.6667V5C2.5 4.07952 3.24619 3.33333 4.16666 3.33333Z" stroke="#ed8936" stroke-width="1.5"/>
							</svg>
							Same quality care from registered dietitians
						</li>
					</ul>
				</div>
				<div class="result-actions">
					<a href="${this.resultUrl}" class="result-button">Explore Options</a>
				</div>
			</div>
		`;
  }
  getAAAErrorTemplate() {
    const error = this.resultData.error || {};
    const errorCode = error.code || this.resultData.aaaErrorCode || "Unknown";
    const userMessage = this.resultData.userMessage || error.message || "There was an issue verifying your insurance coverage automatically.";
    const errorTitle = error.title || this.getErrorTitle(errorCode);
    return `
			<div class="result-card error-card">
				<div class="result-header">
					<h2 class="result-title">Thanks for completing the quiz!</h2>
					<p class="result-subtitle">We're here to help.</p>
				</div>
				<div class="result-content">
					<p><strong>⚠️ ${errorTitle}:</strong></p>
					<p>${userMessage}</p>
					${errorCode !== "Unknown" ? `<div class="error-details">Error Code: ${errorCode}</div>` : ""}
					<ul class="feature-list">
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z" stroke="#f56565" stroke-width="1.5"/>
								<path d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329" stroke="#f56565" stroke-width="1.5"/>
							</svg>
							Manual verification by our team
						</li>
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M18.3333 14.1667C18.3333 15.0871 17.5871 15.8333 16.6667 15.8333H5.83333L1.66666 20V3.33333C1.66666 2.41286 2.41285 1.66667 3.33333 1.66667H16.6667C17.5871 1.66667 18.3333 2.41286 18.3333 3.33333V14.1667Z" stroke="#f56565" stroke-width="1.5"/>
							</svg>
							Direct support to resolve issues
						</li>
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M6.66666 2.5V5.83333M13.3333 2.5V5.83333M2.5 9.16667H17.5M4.16666 3.33333H15.8333C16.7538 3.33333 17.5 4.07952 17.5 5V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16666C3.24619 18.3333 2.5 17.5871 2.5 16.6667V5C2.5 4.07952 3.24619 3.33333 4.16666 3.33333Z" stroke="#f56565" stroke-width="1.5"/>
							</svg>
							Quick resolution to connect you with a dietitian
						</li>
					</ul>
				</div>
				<div class="result-actions">
					<a href="${this.resultUrl}" class="result-button">Continue with Support</a>
				</div>
			</div>
		`;
  }
  getTestDataErrorTemplate() {
    const userMessage = this.resultData.userMessage || "Test data was detected in your submission. Please use real insurance information for accurate verification.";
    return `
			<div class="result-card warning-card">
				<div class="result-header">
					<h2 class="result-title">Please use real information</h2>
					<p class="result-subtitle">We need accurate details for verification.</p>
				</div>
				<div class="result-content">
					<p><strong>⚠️ Test Data Detected:</strong></p>
					<p>${userMessage}</p>
					<ul class="feature-list">
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z" stroke="#ed8936" stroke-width="1.5"/>
								<path d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329" stroke="#ed8936" stroke-width="1.5"/>
							</svg>
							Retake quiz with real insurance information
						</li>
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M18.3333 14.1667C18.3333 15.0871 17.5871 15.8333 16.6667 15.8333H5.83333L1.66666 20V3.33333C1.66666 2.41286 2.41285 1.66667 3.33333 1.66667H16.6667C17.5871 1.66667 18.3333 2.41286 18.3333 3.33333V14.1667Z" stroke="#ed8936" stroke-width="1.5"/>
							</svg>
							Use information exactly as it appears on your card
						</li>
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M6.66666 2.5V5.83333M13.3333 2.5V5.83333M2.5 9.16667H17.5M4.16666 3.33333H15.8333C16.7538 3.33333 17.5 4.07952 17.5 5V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16666C3.24619 18.3333 2.5 17.5871 2.5 16.6667V5C2.5 4.07952 3.24619 3.33333 4.16666 3.33333Z" stroke="#ed8936" stroke-width="1.5"/>
							</svg>
							Get accurate coverage details for your plan
						</li>
					</ul>
				</div>
				<div class="result-actions">
					<a href="${this.resultUrl}" class="result-button">Continue</a>
				</div>
			</div>
		`;
  }
  getTechnicalProblemTemplate() {
    const error = this.resultData.error || {};
    const errorCode = error.code || this.resultData.stediErrorCode || "Unknown";
    const userMessage = this.resultData.userMessage || error.message || "There was a technical issue processing your insurance verification.";
    return `
			<div class="result-card error-card">
				<div class="result-header">
					<h2 class="result-title">Technical Issue</h2>
					<p class="result-subtitle">We're working to resolve this quickly.</p>
				</div>
				<div class="result-content">
					<p>${userMessage}</p>
					${errorCode !== "Unknown" ? `<div class="error-details">Error Code: ${errorCode}</div>` : ""}
				</div>
				<div class="result-actions">
					<a href="${this.resultUrl}" class="result-button">Continue with Support</a>
				</div>
			</div>
		`;
  }
  getProcessingTemplate() {
    return `
			<div class="result-card info-card">
				<div class="result-header">
					<h2 class="result-title">Thanks for completing the quiz!</h2>
					<p class="result-subtitle">We're ready to connect you with a registered dietitian.</p>
				</div>
				<div class="result-content">
					<p>Your eligibility check and account setup is still processing in the background. This can take up to 3 minutes for complex insurance verifications and account creation. Please proceed with booking - we'll contact you with your coverage details shortly.</p>
				</div>
				<div class="result-actions">
					<a href="${this.resultUrl}" class="result-button">Continue to Booking</a>
				</div>
			</div>
		`;
  }
  getIneligibleTemplate() {
    return `
			<div class="result-card warning-card">
				<div class="result-header">
					<h2 class="result-title">Thanks for completing the quiz!</h2>
					<p class="result-subtitle">We're ready to connect you with a registered dietitian.</p>
				</div>
				<div class="result-content">
					<p>Based on your insurance information, you may not be eligible for covered nutrition counseling. However, we have affordable self-pay options available.</p>
				</div>
				<div class="result-actions">
					<a href="${this.resultUrl}" class="result-button">Explore Options</a>
				</div>
			</div>
		`;
  }
  getGenericTemplate() {
    return `
			<div class="result-card">
				<div class="result-header">
					<h2 class="result-title">Thanks for completing the quiz!</h2>
					<p class="result-subtitle">We're ready to help you on your health journey.</p>
				</div>
				<div class="result-actions">
					<a href="${this.resultUrl}" class="result-button">Continue</a>
				</div>
			</div>
		`;
  }
  getErrorTitle(errorCode) {
    const errorTitles = {
      42: "Insurance Information Issue",
      43: "Coverage Verification Problem",
      72: "Plan Details Unavailable",
      73: "Eligibility Check Failed",
      75: "Coverage Status Unknown",
      79: "Verification Timeout"
    };
    return errorTitles[errorCode] || "Verification Issue";
  }
  attachEventListeners() {
    const buttons = this.shadowRoot.querySelectorAll(".result-button");
    buttons.forEach((button) => {
      button.addEventListener("click", (e) => {
        this.dispatchEvent(
          new CustomEvent("result-action", {
            detail: {
              resultType: this.resultType,
              action: "button-click",
              url: button.href
            },
            bubbles: true
          })
        );
      });
    });
  }
  setResultData(type, data, url) {
    this.resultType = type;
    this.resultData = data;
    this.resultUrl = url;
    this.render();
  }
}
if (!customElements.get("quiz-result-card")) {
  customElements.define("quiz-result-card", QuizResultCard);
}
class QuizFormStep extends QuizBaseComponent {
  static get observedAttributes() {
    return ["step-data", "responses", "is-last-step", "validation-errors"];
  }
  getTemplate() {
    const stepData = this.getStepData();
    const responses = this.getResponses();
    const isLastStep = this.getAttribute("is-last-step") === "true";
    const validationErrors = this.getValidationErrors();
    if (!stepData) {
      return '<p class="quiz-error-text">Step configuration error. Please contact support.</p>';
    }
    const buttonText = isLastStep ? stepData.ctaText || "Finish Quiz" : stepData.ctaText || "Continue";
    return `
			${stepData.info?.formSubHeading ? `<h4 class="quiz-heading quiz-heading-mobile-outside">${stepData.info.formSubHeading}</h4>` : ""}
			<div class="quiz-form-container">
				${stepData.info?.formSubHeading ? `<h4 class="quiz-heading quiz-heading-desktop-inside">${stepData.info.formSubHeading}</h4>` : ""}
				<div class="quiz-space-y-6">
					${this.renderFormQuestions(stepData.questions, responses, validationErrors)}
				</div>
				<button class="quiz-nav-button quiz-nav-button--primary quiz-form-button" id="quiz-form-next-button">
					${buttonText}
				</button>
				${stepData.legal ? `<p class="quiz-legal-form">${stepData.legal}</p>` : ""}
			</div>
		`;
  }
  getStyles() {
    return `
			${super.getStyles()}

			.quiz-form-container {
				display: flex;
				flex-direction: column;
				gap: 24px;
			}

			.quiz-space-y-6 {
				display: flex;
				flex-direction: column;
				gap: 24px;
			}

			.quiz-heading-mobile-outside {
				display: block;
			}

			.quiz-heading-desktop-inside {
				display: none;
			}

			@media (min-width: 768px) {
				.quiz-heading-mobile-outside {
					display: none;
				}

				.quiz-heading-desktop-inside {
					display: block;
				}
			}

			.quiz-nav-button {
				padding: 12px 24px;
				border-radius: var(--quiz-border-radius);
				font-weight: 600;
				transition: var(--quiz-transition);
				cursor: pointer;
				border: none;
			}

			.quiz-nav-button--primary {
				background-color: var(--quiz-secondary-color);
				color: white;
			}

			.quiz-nav-button--primary:hover {
				opacity: 0.9;
			}

			.quiz-legal-form {
				font-size: 12px;
				color: #666;
				text-align: center;
				margin-top: 16px;
			}

			.quiz-error-text {
				color: var(--quiz-error-color);
				text-align: center;
				padding: 16px;
			}
		`;
  }
  render() {
    this.renderTemplate();
    this.attachEventListeners();
  }
  attachEventListeners() {
    const submitButton = this.root.querySelector("#quiz-form-next-button");
    if (submitButton) {
      submitButton.addEventListener("click", (e) => {
        e.preventDefault();
        this.dispatchEvent(
          new CustomEvent("form-submit", {
            detail: { stepData: this.getStepData() },
            bubbles: true
          })
        );
      });
    }
  }
  renderFormQuestions(questions, responses, validationErrors) {
    if (!questions || !Array.isArray(questions)) return "";
    let html = "";
    let i = 0;
    while (i < questions.length) {
      const processed = this.tryProcessQuestionGroup(questions, i, responses);
      if (processed.html) {
        html += processed.html;
        i += processed.skip;
      } else {
        html += this.renderSingleFormQuestion(questions[i], responses, validationErrors);
        i++;
      }
    }
    return html;
  }
  tryProcessQuestionGroup(questions, index, responses) {
    const question = questions[index];
    const getResponse = (q) => responses?.find((r) => r.questionId === q.id) || { answer: null };
    const commonPairs = [
      ["member-id", "group-number"],
      ["first-name", "last-name"],
      ["email", "phone"]
    ];
    for (const pair of commonPairs) {
      if (question.id === pair[0] && questions[index + 1]?.id === pair[1]) {
        return {
          html: this.renderFormFieldPair(question, questions[index + 1], getResponse(question), getResponse(questions[index + 1])),
          skip: 2
        };
      }
    }
    if (question.type === "date-part" && question.part === "month") {
      const [dayQ, yearQ] = [questions[index + 1], questions[index + 2]];
      if (dayQ?.type === "date-part" && dayQ.part === "day" && yearQ?.type === "date-part" && yearQ.part === "year") {
        return {
          html: this.renderDateGroup(question, dayQ, yearQ, responses),
          skip: 3
        };
      }
    }
    return { html: null, skip: 0 };
  }
  renderSingleFormQuestion(question, responses, validationErrors) {
    const response = responses?.find((r) => r.questionId === question.id) || { answer: null };
    const hasError = validationErrors?.some((error) => error.questionId === question.id);
    const errorClass = hasError ? "quiz-field-error" : "";
    return `
			<div class="quiz-question-section ${errorClass}">
				<label class="quiz-label" for="question-${question.id}">
					${question.text}${this.renderHelpIcon(question.id)}
				</label>
				${question.helpText ? `<p class="quiz-text-sm">${question.helpText}</p>` : ""}
				${this.renderQuestionInput(question, response)}
				${hasError ? `<div class="quiz-error-message">${validationErrors.find((e) => e.questionId === question.id)?.message || "Invalid input"}</div>` : ""}
			</div>
		`;
  }
  renderFormFieldPair(leftQuestion, rightQuestion, leftResponse, rightResponse) {
    const generateField = (question, response) => ({
      input: this.renderQuestionInput(question, response),
      helpIcon: this.renderHelpIcon(question.id),
      label: question.text,
      id: question.id
    });
    const [left, right] = [generateField(leftQuestion, leftResponse), generateField(rightQuestion, rightResponse)];
    return `
			<div class="quiz-grid-2-form">
				${[left, right].map(
      (field) => `
					<div>
						<label class="quiz-label" for="question-${field.id}">
							${field.label}${field.helpIcon}
						</label>
						${field.input}
					</div>
				`
    ).join("")}
			</div>
		`;
  }
  renderDateGroup(monthQ, dayQ, yearQ, responses) {
    const monthResponse = responses?.find((r) => r.questionId === monthQ.id) || { answer: null };
    const dayResponse = responses?.find((r) => r.questionId === dayQ.id) || { answer: null };
    const yearResponse = responses?.find((r) => r.questionId === yearQ.id) || { answer: null };
    return `
			<div class="quiz-question-section">
				<label class="quiz-label">${monthQ.text}</label>
				<div class="quiz-grid-3">
					${this.renderDatePart(monthQ, monthResponse)}
					${this.renderDatePart(dayQ, dayResponse)}
					${this.renderDatePart(yearQ, yearResponse)}
				</div>
			</div>
		`;
  }
  renderQuestionInput(question, response) {
    const value = response?.answer || "";
    switch (question.type) {
      case "text":
      case "email":
      case "phone":
        return `<input type="${question.type}" id="question-${question.id}" class="quiz-input" value="${value}" ${question.required ? "required" : ""}>`;
      case "textarea":
        return `<textarea id="question-${question.id}" class="quiz-textarea" ${question.required ? "required" : ""}>${value}</textarea>`;
      case "dropdown":
        return this.renderDropdownOptions(question, value);
      default:
        return `<input type="text" id="question-${question.id}" class="quiz-input" value="${value}">`;
    }
  }
  renderDropdownOptions(question, selectedValue) {
    if (!question.options) return "";
    return `
			<select id="question-${question.id}" class="quiz-dropdown">
				<option value="">${question.placeholder || "Select an option"}</option>
				${question.options.map(
      (option) => `
					<option value="${option.value}" ${selectedValue === option.value ? "selected" : ""}>
						${option.text}
					</option>
				`
    ).join("")}
			</select>
		`;
  }
  renderDatePart(question, response) {
    const value = response?.answer || "";
    const options = this.getDatePartOptions(question.part);
    return `
			<select id="question-${question.id}" class="quiz-dropdown">
				<option value="">${question.placeholder || question.part}</option>
				${options.map(
      (option) => `
					<option value="${option.value}" ${value === option.value ? "selected" : ""}>
						${option.text}
					</option>
				`
    ).join("")}
			</select>
		`;
  }
  getDatePartOptions(part) {
    switch (part) {
      case "month":
        return Array.from({ length: 12 }, (_, i) => ({
          value: String(i + 1).padStart(2, "0"),
          text: new Date(2e3, i).toLocaleString("default", { month: "long" })
        }));
      case "day":
        return Array.from({ length: 31 }, (_, i) => ({
          value: String(i + 1).padStart(2, "0"),
          text: String(i + 1)
        }));
      case "year":
        const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
        return Array.from({ length: 100 }, (_, i) => ({
          value: String(currentYear - i),
          text: String(currentYear - i)
        }));
      default:
        return [];
    }
  }
  renderHelpIcon(questionId) {
    return `<span class="quiz-help-icon-container">
			<svg class="quiz-help-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
				<path d="M14.6668 8.00004C14.6668 4.31814 11.682 1.33337 8.00016 1.33337C4.31826 1.33337 1.3335 4.31814 1.3335 8.00004C1.3335 11.6819 4.31826 14.6667 8.00016 14.6667C11.682 14.6667 14.6668 11.6819 14.6668 8.00004Z" stroke="#121212"/>
				<path d="M8.1613 11.3334V8.00004C8.1613 7.68577 8.1613 7.52864 8.06363 7.43097C7.96603 7.33337 7.8089 7.33337 7.49463 7.33337" stroke="#121212" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M7.99463 5.33337H8.00063" stroke="#121212" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</span>`;
  }
  // Utility methods
  getStepData() {
    try {
      const stepDataAttr = this.getAttribute("step-data");
      return stepDataAttr ? JSON.parse(stepDataAttr) : null;
    } catch (error) {
      console.error("Error parsing step data:", error);
      return null;
    }
  }
  getResponses() {
    try {
      const responsesAttr = this.getAttribute("responses");
      return responsesAttr ? JSON.parse(responsesAttr) : [];
    } catch (error) {
      console.error("Error parsing responses:", error);
      return [];
    }
  }
  getValidationErrors() {
    try {
      const errorsAttr = this.getAttribute("validation-errors");
      return errorsAttr ? JSON.parse(errorsAttr) : [];
    } catch (error) {
      console.error("Error parsing validation errors:", error);
      return [];
    }
  }
  handleAttributeChange(name, oldValue, newValue) {
    if (["step-data", "responses", "validation-errors", "is-last-step"].includes(name)) {
      this.render();
    }
  }
}
if (!customElements.get("quiz-form-step")) {
  customElements.define("quiz-form-step", QuizFormStep);
}
class QuizStepContainer extends QuizBaseComponent {
  static get observedAttributes() {
    return ["step-data", "responses", "current-question-index", "is-form-step", "validation-errors"];
  }
  getTemplate() {
    const stepData = this.getStepData();
    const responses = this.getResponses();
    const currentQuestionIndex = parseInt(this.getAttribute("current-question-index") || "0");
    const isFormStep = this.getAttribute("is-form-step") === "true";
    const validationErrors = this.getValidationErrors();
    if (!stepData) {
      return '<p class="quiz-error-text">Step configuration error. Please contact support.</p>';
    }
    return `
			<div class="animate-fade-in">
				${this.renderStepInfo(stepData)}
				${stepData.questions?.length > 0 ? isFormStep ? this.renderFormStep(stepData, responses, validationErrors) : this.renderWizardStep(stepData, responses, currentQuestionIndex) : !stepData.info ? '<p class="quiz-error-text">Step configuration error. Please contact support.</p>' : ""}
			</div>
		`;
  }
  getStyles() {
    return `
			${super.getStyles()}

			.animate-fade-in {
				animation: fadeIn 0.3s ease-in-out;
			}

			@keyframes fadeIn {
				from { opacity: 0; transform: translateY(10px); }
				to { opacity: 1; transform: translateY(0); }
			}

			.quiz-title {
				font-family: "PP Radio Grotesk", sans-serif;
				font-size: 28px;
				font-weight: 700;
				line-height: 1.2;
				color: #121212;
				margin: 0 0 16px 0;
			}

			.quiz-text {
				font-size: 16px;
				line-height: 1.5;
				color: #333;
				margin: 0 0 12px 0;
			}

			.quiz-subtext {
				font-size: 14px;
				line-height: 1.4;
				color: #666;
				margin: 0 0 24px 0;
			}

			.quiz-heading {
				font-family: "PP Radio Grotesk", sans-serif;
				font-size: 20px;
				font-weight: 600;
				line-height: 1.3;
				color: #121212;
				margin: 0 0 16px 0;
			}

			.quiz-text-sm {
				font-size: 14px;
				line-height: 1.4;
				color: #666;
				margin: 0 0 8px 0;
			}

			.quiz-divider {
				border-top: 1px solid #e5e5e5;
				padding-top: 24px;
				margin-top: 24px;
			}

			.quiz-error-text {
				color: var(--quiz-error-color);
				text-align: center;
				padding: 16px;
				background-color: #fef2f2;
				border-radius: var(--quiz-border-radius);
				border: 1px solid #fecaca;
			}

			@media (max-width: 768px) {
				.quiz-title {
					font-size: 24px;
				}

				.quiz-heading {
					font-size: 18px;
				}
			}
		`;
  }
  render() {
    this.renderTemplate();
    this.attachEventListeners();
  }
  attachEventListeners() {
    this.addEventListener("form-submit", (e) => {
      this.dispatchEvent(
        new CustomEvent("step-form-submit", {
          detail: e.detail,
          bubbles: true
        })
      );
    });
    this.addEventListener("question-answer", (e) => {
      this.dispatchEvent(
        new CustomEvent("step-question-answer", {
          detail: e.detail,
          bubbles: true
        })
      );
    });
  }
  renderStepInfo(stepData) {
    if (!stepData.info) return "";
    return `
			<div class="quiz-step-info">
				<h3 class="quiz-title">${stepData.info.heading}</h3>
				<p class="quiz-text">${stepData.info.text}</p>
				${stepData.info.subtext ? `<p class="quiz-subtext">${stepData.info.subtext}</p>` : ""}
			</div>
		`;
  }
  renderFormStep(stepData, responses, validationErrors) {
    const formStep = document.createElement("quiz-form-step");
    formStep.setAttribute("step-data", JSON.stringify(stepData));
    formStep.setAttribute("responses", JSON.stringify(responses));
    formStep.setAttribute("validation-errors", JSON.stringify(validationErrors));
    const isLastStep = this.getAttribute("is-last-step") === "true";
    if (isLastStep) {
      formStep.setAttribute("is-last-step", "true");
    }
    return formStep.outerHTML;
  }
  renderWizardStep(stepData, responses, currentQuestionIndex) {
    const question = stepData.questions[currentQuestionIndex];
    const response = responses?.find((r) => r.questionId === question?.id) || { answer: null };
    if (!question) {
      return '<p class="quiz-error-text">Question not found. Please try again.</p>';
    }
    let html = "";
    if (!stepData.info) {
      html += `
				<div class="quiz-question-header">
					<h3 class="quiz-title">${question.text}</h3>
					${question.helpText ? `<p class="quiz-text">${question.helpText}</p>` : ""}
				</div>
			`;
    } else {
      html += `
				<div class="quiz-divider">
					<h4 class="quiz-heading">${question.text}</h4>
					${question.helpText ? `<p class="quiz-text-sm">${question.helpText}</p>` : ""}
				</div>
			`;
    }
    html += this.renderQuestionByType(question, response);
    return html;
  }
  renderQuestionByType(question, response) {
    const value = response?.answer || "";
    switch (question.type) {
      case "multiple-choice":
        return this.renderMultipleChoice(question, value);
      case "checkbox":
        return this.renderCheckbox(question, value);
      case "dropdown":
        return this.renderDropdown(question, value);
      case "text":
      case "email":
      case "phone":
        return this.renderTextInput(question, value);
      case "textarea":
        return this.renderTextarea(question, value);
      case "rating":
        return this.renderRating(question, value);
      case "date":
        return this.renderDateInput(question, value);
      case "payer-search":
        return this.renderPayerSearch(question, value);
      default:
        return `<p class="quiz-error-text">Unsupported question type: ${question.type}</p>`;
    }
  }
  renderMultipleChoice(question, selectedValue) {
    if (!question.options) return "";
    return `
			<div class="quiz-multiple-choice">
				${question.options.map(
      (option) => `
					<label class="quiz-option-card ${selectedValue === option.value ? "selected" : ""}">
						<input type="radio" name="question-${question.id}" value="${option.value}"
							   ${selectedValue === option.value ? "checked" : ""} class="quiz-radio-input">
						<div class="quiz-option-content">
							<span class="quiz-option-text">${option.text}</span>
							${option.description ? `<span class="quiz-option-description">${option.description}</span>` : ""}
						</div>
					</label>
				`
    ).join("")}
			</div>
		`;
  }
  renderCheckbox(question, selectedValues) {
    if (!question.options) return "";
    const selected = Array.isArray(selectedValues) ? selectedValues : selectedValues ? [selectedValues] : [];
    return `
			<div class="quiz-checkbox-group">
				${question.options.map(
      (option) => `
					<label class="quiz-option-card ${selected.includes(option.value) ? "selected" : ""}">
						<input type="checkbox" name="question-${question.id}" value="${option.value}"
							   ${selected.includes(option.value) ? "checked" : ""} class="quiz-checkbox-input">
						<div class="quiz-option-content">
							<span class="quiz-option-text">${option.text}</span>
							${option.description ? `<span class="quiz-option-description">${option.description}</span>` : ""}
						</div>
					</label>
				`
    ).join("")}
			</div>
		`;
  }
  renderDropdown(question, selectedValue) {
    if (!question.options) return "";
    return `
			<select id="question-${question.id}" class="quiz-dropdown">
				<option value="">${question.placeholder || "Select an option"}</option>
				${question.options.map(
      (option) => `
					<option value="${option.value}" ${selectedValue === option.value ? "selected" : ""}>
						${option.text}
					</option>
				`
    ).join("")}
			</select>
		`;
  }
  renderTextInput(question, value) {
    return `
			<input type="${question.type || "text"}"
				   id="question-${question.id}"
				   class="quiz-input"
				   value="${value}"
				   placeholder="${question.placeholder || ""}"
				   ${question.required ? "required" : ""}>
		`;
  }
  renderTextarea(question, value) {
    return `
			<textarea id="question-${question.id}"
					  class="quiz-textarea"
					  placeholder="${question.placeholder || ""}"
					  ${question.required ? "required" : ""}>${value}</textarea>
		`;
  }
  renderRating(question, value) {
    const maxRating = question.maxRating || 5;
    const currentRating = parseInt(value) || 0;
    return `
			<div class="quiz-rating">
				${Array.from({ length: maxRating }, (_, i) => i + 1).map(
      (rating) => `
					<button type="button" class="quiz-rating-star ${rating <= currentRating ? "selected" : ""}"
							data-rating="${rating}">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
							<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
								  fill="${rating <= currentRating ? "#fbbf24" : "#e5e7eb"}"
								  stroke="#d1d5db" stroke-width="1"/>
						</svg>
					</button>
				`
    ).join("")}
			</div>
		`;
  }
  renderDateInput(question, value) {
    return `
			<input type="date"
				   id="question-${question.id}"
				   class="quiz-input"
				   value="${value}"
				   ${question.required ? "required" : ""}>
		`;
  }
  renderPayerSearch(question, value) {
    const payerSearch = document.createElement("quiz-payer-search");
    payerSearch.setAttribute("question-id", question.id);
    if (question.commonPayers) {
      payerSearch.setAttribute("common-payers", JSON.stringify(question.commonPayers));
    }
    if (value) {
      payerSearch.setAttribute("selected-payer", value);
    }
    return payerSearch.outerHTML;
  }
  // Utility methods
  getStepData() {
    try {
      const stepDataAttr = this.getAttribute("step-data");
      return stepDataAttr ? JSON.parse(stepDataAttr) : null;
    } catch (error) {
      console.error("Error parsing step data:", error);
      return null;
    }
  }
  getResponses() {
    try {
      const responsesAttr = this.getAttribute("responses");
      return responsesAttr ? JSON.parse(responsesAttr) : [];
    } catch (error) {
      console.error("Error parsing responses:", error);
      return [];
    }
  }
  getValidationErrors() {
    try {
      const errorsAttr = this.getAttribute("validation-errors");
      return errorsAttr ? JSON.parse(errorsAttr) : [];
    } catch (error) {
      console.error("Error parsing validation errors:", error);
      return [];
    }
  }
  handleAttributeChange(name, oldValue, newValue) {
    if (["step-data", "responses", "current-question-index", "is-form-step", "validation-errors"].includes(name)) {
      this.render();
    }
  }
}
if (!customElements.get("quiz-step-container")) {
  customElements.define("quiz-step-container", QuizStepContainer);
}
class QuizSchedulingResult extends QuizBaseComponent {
  static get observedAttributes() {
    return ["result-type", "scheduling-data", "error-message"];
  }
  getTemplate() {
    const resultType = this.getAttribute("result-type") || "success";
    const schedulingData = this.getSchedulingData();
    const errorMessage = this.getAttribute("error-message") || "";
    if (resultType === "success") {
      return this.renderSuccessResult(schedulingData);
    } else {
      return this.renderErrorResult(errorMessage, schedulingData);
    }
  }
  getStyles() {
    return `
			${super.getStyles()}

			.quiz-scheduling-container {
				display: flex;
				flex-direction: column;
				gap: 24px;
				max-width: 600px;
				margin: 0 auto;
			}

			.quiz-scheduling-header {
				text-align: center;
				padding: 24px;
				background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
				border-radius: var(--quiz-border-radius);
				border: 1px solid #bae6fd;
			}

			.quiz-scheduling-title {
				font-family: "PP Radio Grotesk", sans-serif;
				font-size: 28px;
				font-weight: 700;
				color: #0c4a6e;
				margin: 0 0 8px 0;
			}

			.quiz-scheduling-subtitle {
				font-size: 16px;
				color: #0369a1;
				margin: 0;
			}

			.quiz-appointment-card {
				background: white;
				border: 2px solid #22c55e;
				border-radius: var(--quiz-border-radius);
				padding: 24px;
				box-shadow: var(--quiz-shadow);
			}

			.quiz-appointment-header {
				display: flex;
				align-items: center;
				gap: 12px;
				margin-bottom: 16px;
			}

			.quiz-appointment-icon {
				width: 32px;
				height: 32px;
				background: #22c55e;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.quiz-appointment-title {
				font-family: "PP Radio Grotesk", sans-serif;
				font-size: 20px;
				font-weight: 600;
				color: #166534;
				margin: 0;
			}

			.quiz-appointment-details {
				display: flex;
				flex-direction: column;
				gap: 12px;
			}

			.quiz-appointment-detail {
				display: flex;
				align-items: center;
				gap: 8px;
				padding: 8px 0;
				border-bottom: 1px solid #f3f4f6;
			}

			.quiz-appointment-detail:last-child {
				border-bottom: none;
			}

			.quiz-appointment-detail-icon {
				width: 20px;
				height: 20px;
				color: #6b7280;
			}

			.quiz-appointment-detail-text {
				font-size: 14px;
				color: #374151;
			}

			.quiz-appointment-detail-value {
				font-weight: 600;
				color: #111827;
			}

			.quiz-next-steps {
				background: #f8fafc;
				border: 1px solid #e2e8f0;
				border-radius: var(--quiz-border-radius);
				padding: 20px;
			}

			.quiz-next-steps-title {
				font-family: "PP Radio Grotesk", sans-serif;
				font-size: 18px;
				font-weight: 600;
				color: #1e293b;
				margin: 0 0 12px 0;
			}

			.quiz-next-steps-list {
				list-style: none;
				padding: 0;
				margin: 0;
			}

			.quiz-next-steps-item {
				display: flex;
				align-items: flex-start;
				gap: 8px;
				margin-bottom: 8px;
				font-size: 14px;
				color: #475569;
			}

			.quiz-next-steps-item:last-child {
				margin-bottom: 0;
			}

			.quiz-next-steps-number {
				background: #3b82f6;
				color: white;
				width: 20px;
				height: 20px;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 12px;
				font-weight: 600;
				flex-shrink: 0;
			}

			.quiz-error-card {
				background: #fef2f2;
				border: 2px solid #fca5a5;
				border-radius: var(--quiz-border-radius);
				padding: 24px;
			}

			.quiz-error-header {
				display: flex;
				align-items: center;
				gap: 12px;
				margin-bottom: 16px;
			}

			.quiz-error-icon {
				width: 32px;
				height: 32px;
				background: #ef4444;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.quiz-error-title {
				font-family: "PP Radio Grotesk", sans-serif;
				font-size: 20px;
				font-weight: 600;
				color: #dc2626;
				margin: 0;
			}

			.quiz-error-message {
				font-size: 16px;
				color: #991b1b;
				line-height: 1.5;
				margin-bottom: 16px;
			}

			.quiz-support-info {
				background: white;
				border: 1px solid #fca5a5;
				border-radius: var(--quiz-border-radius);
				padding: 16px;
			}

			.quiz-support-title {
				font-weight: 600;
				color: #dc2626;
				margin: 0 0 8px 0;
			}

			.quiz-support-text {
				font-size: 14px;
				color: #7f1d1d;
				margin: 0;
			}

			.quiz-action-buttons {
				display: flex;
				gap: 12px;
				justify-content: center;
				margin-top: 24px;
			}

			.quiz-button {
				padding: 12px 24px;
				border-radius: var(--quiz-border-radius);
				font-weight: 600;
				text-decoration: none;
				transition: var(--quiz-transition);
				cursor: pointer;
				border: none;
				font-size: 16px;
			}

			.quiz-button--primary {
				background: #3b82f6;
				color: white;
			}

			.quiz-button--primary:hover {
				background: #2563eb;
			}

			.quiz-button--secondary {
				background: white;
				color: #3b82f6;
				border: 2px solid #3b82f6;
			}

			.quiz-button--secondary:hover {
				background: #eff6ff;
			}

			@media (max-width: 768px) {
				.quiz-scheduling-title {
					font-size: 24px;
				}

				.quiz-appointment-details {
					gap: 8px;
				}

				.quiz-action-buttons {
					flex-direction: column;
				}
			}
		`;
  }
  render() {
    this.renderTemplate();
    this.attachEventListeners();
  }
  attachEventListeners() {
    const buttons = this.root.querySelectorAll(".quiz-button");
    buttons.forEach((button) => {
      button.addEventListener("click", (e) => {
        const action = button.getAttribute("data-action");
        if (action) {
          this.dispatchEvent(
            new CustomEvent("scheduling-action", {
              detail: { action, target: e.target },
              bubbles: true
            })
          );
        }
      });
    });
  }
  renderSuccessResult(schedulingData) {
    if (!schedulingData) {
      return this.renderGenericSuccess();
    }
    const appointment = schedulingData.appointment || {};
    const dietitian = schedulingData.dietitian || {};
    return `
			<div class="quiz-scheduling-container">
				<div class="quiz-scheduling-header">
					<h2 class="quiz-scheduling-title">🎉 Appointment Confirmed!</h2>
					<p class="quiz-scheduling-subtitle">Your consultation has been successfully scheduled</p>
				</div>

				<div class="quiz-appointment-card">
					<div class="quiz-appointment-header">
						<div class="quiz-appointment-icon">
							<svg width="20" height="20" viewBox="0 0 20 20" fill="white">
								<path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
							</svg>
						</div>
						<h3 class="quiz-appointment-title">Your Appointment Details</h3>
					</div>

					<div class="quiz-appointment-details">
						${appointment.date ? `
							<div class="quiz-appointment-detail">
								<svg class="quiz-appointment-detail-icon" viewBox="0 0 20 20" fill="currentColor">
									<path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 9h12v8H4V9z"/>
								</svg>
								<span class="quiz-appointment-detail-text">Date: <span class="quiz-appointment-detail-value">${appointment.date}</span></span>
							</div>
						` : ""}

						${appointment.time ? `
							<div class="quiz-appointment-detail">
								<svg class="quiz-appointment-detail-icon" viewBox="0 0 20 20" fill="currentColor">
									<path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V5z"/>
								</svg>
								<span class="quiz-appointment-detail-text">Time: <span class="quiz-appointment-detail-value">${appointment.time}</span></span>
							</div>
						` : ""}

						${dietitian.name ? `
							<div class="quiz-appointment-detail">
								<svg class="quiz-appointment-detail-icon" viewBox="0 0 20 20" fill="currentColor">
									<path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
								</svg>
								<span class="quiz-appointment-detail-text">Dietitian: <span class="quiz-appointment-detail-value">${dietitian.name}</span></span>
							</div>
						` : ""}

						${appointment.type ? `
							<div class="quiz-appointment-detail">
								<svg class="quiz-appointment-detail-icon" viewBox="0 0 20 20" fill="currentColor">
									<path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
								</svg>
								<span class="quiz-appointment-detail-text">Type: <span class="quiz-appointment-detail-value">${appointment.type}</span></span>
							</div>
						` : ""}
					</div>
				</div>

				<div class="quiz-next-steps">
					<h4 class="quiz-next-steps-title">What happens next?</h4>
					<ul class="quiz-next-steps-list">
						<li class="quiz-next-steps-item">
							<span class="quiz-next-steps-number">1</span>
							<span>You'll receive a confirmation email with your appointment details and preparation instructions</span>
						</li>
						<li class="quiz-next-steps-item">
							<span class="quiz-next-steps-number">2</span>
							<span>Your dietitian will call you at the scheduled time for your consultation</span>
						</li>
						<li class="quiz-next-steps-item">
							<span class="quiz-next-steps-number">3</span>
							<span>After your consultation, you'll receive a personalized nutrition plan</span>
						</li>
					</ul>
				</div>

				<div class="quiz-action-buttons">
					<button class="quiz-button quiz-button--primary" data-action="add-to-calendar">
						Add to Calendar
					</button>
					<button class="quiz-button quiz-button--secondary" data-action="view-details">
						View Full Details
					</button>
				</div>
			</div>
		`;
  }
  renderGenericSuccess() {
    return `
			<div class="quiz-scheduling-container">
				<div class="quiz-scheduling-header">
					<h2 class="quiz-scheduling-title">🎉 Success!</h2>
					<p class="quiz-scheduling-subtitle">Your request has been processed successfully</p>
				</div>

				<div class="quiz-appointment-card">
					<div class="quiz-appointment-header">
						<div class="quiz-appointment-icon">
							<svg width="20" height="20" viewBox="0 0 20 20" fill="white">
								<path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
							</svg>
						</div>
						<h3 class="quiz-appointment-title">Request Completed</h3>
					</div>
					<p class="quiz-appointment-detail-text">We've received your information and will be in touch soon with next steps.</p>
				</div>

				<div class="quiz-action-buttons">
					<button class="quiz-button quiz-button--primary" data-action="continue">
						Continue
					</button>
				</div>
			</div>
		`;
  }
  renderErrorResult(errorMessage, schedulingData) {
    return `
			<div class="quiz-scheduling-container">
				<div class="quiz-scheduling-header">
					<h2 class="quiz-scheduling-title">⚠️ Scheduling Issue</h2>
					<p class="quiz-scheduling-subtitle">We encountered a problem with your appointment</p>
				</div>

				<div class="quiz-error-card">
					<div class="quiz-error-header">
						<div class="quiz-error-icon">
							<svg width="20" height="20" viewBox="0 0 20 20" fill="white">
								<path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/>
							</svg>
						</div>
						<h3 class="quiz-error-title">Unable to Complete Scheduling</h3>
					</div>

					<p class="quiz-error-message">
						${errorMessage || "There was an unexpected error while trying to schedule your appointment. Please try again or contact our support team for assistance."}
					</p>

					<div class="quiz-support-info">
						<h4 class="quiz-support-title">Need Help?</h4>
						<p class="quiz-support-text">
							Our support team is available to help you schedule your appointment manually.
							Contact us at support@curalife.com or call (555) 123-4567.
						</p>
					</div>
				</div>

				<div class="quiz-action-buttons">
					<button class="quiz-button quiz-button--primary" data-action="retry">
						Try Again
					</button>
					<button class="quiz-button quiz-button--secondary" data-action="contact-support">
						Contact Support
					</button>
				</div>
			</div>
		`;
  }
  // Utility methods
  getSchedulingData() {
    try {
      const dataAttr = this.getAttribute("scheduling-data");
      return dataAttr ? JSON.parse(dataAttr) : null;
    } catch (error) {
      console.error("Error parsing scheduling data:", error);
      return null;
    }
  }
  handleAttributeChange(name, oldValue, newValue) {
    if (["result-type", "scheduling-data", "error-message"].includes(name)) {
      this.render();
    }
  }
}
if (!customElements.get("quiz-scheduling-result")) {
  customElements.define("quiz-scheduling-result", QuizSchedulingResult);
}
class QuizMultipleChoiceComponent extends QuizBaseComponent {
  static get observedAttributes() {
    return ["question-data", "selected-value", "disabled"];
  }
  constructor() {
    super();
    this.questionData = null;
    this.selectedValue = null;
    this.isDisabled = false;
  }
  initialize() {
    this.parseAttributes();
  }
  parseAttributes() {
    const questionDataAttr = this.getAttribute("question-data");
    if (questionDataAttr) {
      try {
        this.questionData = JSON.parse(questionDataAttr);
      } catch (error) {
        console.error("Quiz Multiple Choice: Invalid question-data JSON:", error);
        this.questionData = null;
      }
    }
    this.selectedValue = this.getAttribute("selected-value") || null;
    this.isDisabled = this.getBooleanAttribute("disabled", false);
  }
  handleAttributeChange(name, oldValue, newValue) {
    switch (name) {
      case "question-data":
        this.parseAttributes();
        break;
      case "selected-value":
        this.selectedValue = newValue;
        this.updateSelectedState();
        break;
      case "disabled":
        this.isDisabled = this.getBooleanAttribute("disabled", false);
        this.updateDisabledState();
        break;
    }
  }
  getTemplate() {
    if (!this.questionData || !this.questionData.options) {
      return `
				<div class="quiz-error-container">
					<p class="quiz-error-text">Invalid question configuration</p>
				</div>
			`;
    }
    const options = this.questionData.options;
    const questionId = this.questionData.id;
    const optionsHTML = options.map(
      (option) => `
			<label for="${option.id}" class="quiz-option-card" data-option-id="${option.id}">
				<input
					type="radio"
					id="${option.id}"
					name="question-${questionId}"
					value="${option.id}"
					class="quiz-sr-only"
					${this.selectedValue === option.id ? "checked" : ""}
					${this.isDisabled ? "disabled" : ""}
				>
				<div class="quiz-option-button ${this.selectedValue === option.id ? "selected" : ""}">
					<div class="quiz-option-text">
						<div class="quiz-option-text-content">${option.text}</div>
					</div>
					${this.selectedValue === option.id ? this.getCheckmarkSVG() : ""}
				</div>
			</label>
		`
    ).join("");
    return `
			<div class="quiz-grid-2" ${this.isDisabled ? 'aria-disabled="true"' : ""}>
				${optionsHTML}
			</div>
		`;
  }
  getCheckmarkSVG() {
    return `
			<svg class="quiz-checkmark" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		`;
  }
  render() {
    this.renderTemplate();
  }
  async getStyles() {
    const baseStyles = super.getStyles();
    const quizStyles = await sharedStyles.getQuizStyles();
    return `
			${baseStyles}
			${quizStyles}

			/* Component-specific styles */
			.quiz-grid-2 {
				display: grid;
				grid-template-columns: repeat(2, 1fr);
				gap: 1rem;
			}

			@media (max-width: 768px) {
				.quiz-grid-2 {
					grid-template-columns: 1fr;
				}
			}

			.quiz-option-card {
				cursor: pointer;
				display: block;
				transition: var(--quiz-transition);
			}

			.quiz-option-card:hover:not([aria-disabled="true"]) .quiz-option-button {
				transform: translateY(-2px);
				box-shadow: var(--quiz-shadow);
			}

			.quiz-option-button {
				border: 2px solid #e2e8f0;
				border-radius: var(--quiz-border-radius);
				padding: 1rem;
				background: white;
				transition: var(--quiz-transition);
				position: relative;
				min-height: 60px;
				display: flex;
				align-items: center;
				justify-content: space-between;
			}

			.quiz-option-button.selected {
				border-color: var(--quiz-primary-color);
				background-color: #f0f9ff;
			}

			.quiz-option-text {
				flex: 1;
			}

			.quiz-option-text-content {
				font-weight: 500;
				color: #374151;
			}

			.quiz-checkmark {
				color: var(--quiz-primary-color);
				flex-shrink: 0;
				margin-left: 0.5rem;
			}

			.quiz-sr-only {
				position: absolute;
				width: 1px;
				height: 1px;
				padding: 0;
				margin: -1px;
				overflow: hidden;
				clip: rect(0, 0, 0, 0);
				white-space: nowrap;
				border: 0;
			}

			/* Disabled state */
			:host([disabled]) .quiz-option-card {
				cursor: not-allowed;
				opacity: 0.6;
			}

			:host([disabled]) .quiz-option-button {
				background-color: #f9fafb;
				color: #9ca3af;
			}

			/* Error state */
			.quiz-error-container {
				padding: 1rem;
				background-color: #fef2f2;
				border: 1px solid #fecaca;
				border-radius: var(--quiz-border-radius);
			}

			.quiz-error-text {
				color: var(--quiz-error-color);
				margin: 0;
				font-size: 0.875rem;
			}

			/* Focus styles for accessibility */
			.quiz-option-card:focus-within .quiz-option-button {
				outline: 2px solid var(--quiz-primary-color);
				outline-offset: 2px;
			}
		`;
  }
  setupEventListeners() {
    this.root.addEventListener("change", this.handleOptionChange.bind(this));
    this.root.addEventListener("click", this.handleOptionClick.bind(this));
  }
  handleOptionChange(event) {
    if (this.isDisabled) return;
    const input = event.target;
    if (input.type === "radio") {
      const selectedValue = input.value;
      this.selectedValue = selectedValue;
      this.updateSelectedState();
      this.dispatchAnswerSelected(selectedValue);
    }
  }
  handleOptionClick(event) {
    if (this.isDisabled) return;
    const label = event.target.closest(".quiz-option-card");
    if (label) {
      const optionId = label.getAttribute("data-option-id");
      const input = label.querySelector("input[type='radio']");
      if (input && !input.checked) {
        input.checked = true;
        this.selectedValue = optionId;
        this.updateSelectedState();
        this.dispatchAnswerSelected(optionId);
      }
    }
  }
  updateSelectedState() {
    const labels = this.root.querySelectorAll(".quiz-option-card");
    labels.forEach((label) => {
      const optionId = label.getAttribute("data-option-id");
      const button = label.querySelector(".quiz-option-button");
      const input = label.querySelector("input[type='radio']");
      if (optionId === this.selectedValue) {
        button.classList.add("selected");
        input.checked = true;
        if (!button.querySelector(".quiz-checkmark")) {
          const textDiv = button.querySelector(".quiz-option-text");
          textDiv.insertAdjacentHTML("afterend", this.getCheckmarkSVG());
        }
      } else {
        button.classList.remove("selected");
        input.checked = false;
        const checkmark = button.querySelector(".quiz-checkmark");
        if (checkmark) {
          checkmark.remove();
        }
      }
    });
  }
  updateDisabledState() {
    const inputs = this.root.querySelectorAll("input[type='radio']");
    inputs.forEach((input) => {
      input.disabled = this.isDisabled;
    });
    const container = this.root.querySelector(".quiz-grid-2");
    if (container) {
      if (this.isDisabled) {
        container.setAttribute("aria-disabled", "true");
      } else {
        container.removeAttribute("aria-disabled");
      }
    }
  }
  dispatchAnswerSelected(value) {
    const event = new CustomEvent("answer-selected", {
      detail: {
        questionId: this.questionData?.id,
        value,
        questionType: "multiple-choice"
      },
      bubbles: true
    });
    this.dispatchEvent(event);
  }
  // Public API methods
  getSelectedValue() {
    return this.selectedValue;
  }
  setSelectedValue(value) {
    this.selectedValue = value;
    this.setAttribute("selected-value", value);
  }
  setDisabled(disabled) {
    this.isDisabled = disabled;
    if (disabled) {
      this.setAttribute("disabled", "");
    } else {
      this.removeAttribute("disabled");
    }
  }
  getQuestionData() {
    return this.questionData;
  }
  setQuestionData(data) {
    this.questionData = data;
    this.setAttribute("question-data", JSON.stringify(data));
  }
}
if (!customElements.get("quiz-multiple-choice")) {
  customElements.define("quiz-multiple-choice", QuizMultipleChoiceComponent);
}
class QuizCheckboxGroupComponent extends QuizBaseComponent {
  static get observedAttributes() {
    return ["question-data", "selected-values", "disabled", "layout"];
  }
  constructor() {
    super();
    this.questionData = null;
    this.selectedValues = [];
    this.isDisabled = false;
    this.layout = "cards";
  }
  initialize() {
    this.parseAttributes();
  }
  parseAttributes() {
    const questionDataAttr = this.getAttribute("question-data");
    if (questionDataAttr) {
      try {
        this.questionData = JSON.parse(questionDataAttr);
      } catch (error) {
        console.error("Quiz Checkbox Group: Invalid question-data JSON:", error);
        this.questionData = null;
      }
    }
    const selectedValuesAttr = this.getAttribute("selected-values");
    if (selectedValuesAttr) {
      try {
        this.selectedValues = JSON.parse(selectedValuesAttr);
      } catch (error) {
        console.error("Quiz Checkbox Group: Invalid selected-values JSON:", error);
        this.selectedValues = [];
      }
    } else {
      this.selectedValues = [];
    }
    this.isDisabled = this.getBooleanAttribute("disabled", false);
    this.layout = this.getAttribute("layout") || "cards";
    if (this.questionData?.id === "consent") {
      this.layout = "simple";
    }
  }
  handleAttributeChange(name, oldValue, newValue) {
    switch (name) {
      case "question-data":
        this.parseAttributes();
        break;
      case "selected-values":
        this.parseSelectedValues();
        this.updateSelectedState();
        break;
      case "disabled":
        this.isDisabled = this.getBooleanAttribute("disabled", false);
        this.updateDisabledState();
        break;
      case "layout":
        this.layout = newValue || "cards";
        break;
    }
  }
  parseSelectedValues() {
    const selectedValuesAttr = this.getAttribute("selected-values");
    if (selectedValuesAttr) {
      try {
        this.selectedValues = JSON.parse(selectedValuesAttr);
      } catch (error) {
        console.error("Quiz Checkbox Group: Invalid selected-values JSON:", error);
        this.selectedValues = [];
      }
    } else {
      this.selectedValues = [];
    }
  }
  getTemplate() {
    if (!this.questionData || !this.questionData.options) {
      return `
				<div class="quiz-error-container">
					<p class="quiz-error-text">Invalid question configuration</p>
				</div>
			`;
    }
    if (this.layout === "simple") {
      return this.getSimpleTemplate();
    } else {
      return this.getCardTemplate();
    }
  }
  getCardTemplate() {
    const options = this.questionData.options;
    const questionId = this.questionData.id;
    const optionsHTML = options.map(
      (option) => `
			<label for="${option.id}" class="quiz-option-card" data-option-id="${option.id}">
				<input
					type="checkbox"
					id="${option.id}"
					name="question-${questionId}"
					value="${option.id}"
					class="quiz-sr-only"
					${this.selectedValues.includes(option.id) ? "checked" : ""}
					${this.isDisabled ? "disabled" : ""}
				>
				<div class="quiz-option-button ${this.selectedValues.includes(option.id) ? "selected" : ""}">
					<div class="quiz-option-text">
						<div class="quiz-option-text-content">${option.text}</div>
					</div>
					${this.selectedValues.includes(option.id) ? this.getCheckmarkSVG() : ""}
				</div>
			</label>
		`
    ).join("");
    return `
			<div class="quiz-grid-2" ${this.isDisabled ? 'aria-disabled="true"' : ""}>
				${optionsHTML}
			</div>
		`;
  }
  getSimpleTemplate() {
    const options = this.questionData.options;
    const questionId = this.questionData.id;
    const optionsHTML = options.map(
      (option) => `
			<div class="quiz-checkbox-container">
				<input
					type="checkbox"
					id="${option.id}"
					name="question-${questionId}"
					value="${option.id}"
					class="quiz-checkbox-input"
					${this.selectedValues.includes(option.id) ? "checked" : ""}
					${this.isDisabled ? "disabled" : ""}
				>
				<label class="quiz-checkbox-label" for="${option.id}">${option.text}</label>
			</div>
		`
    ).join("");
    return `
			<div class="quiz-space-y-3 quiz-spacing-container" ${this.isDisabled ? 'aria-disabled="true"' : ""}>
				${optionsHTML}
			</div>
		`;
  }
  getCheckmarkSVG() {
    return `
			<svg class="quiz-checkmark" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		`;
  }
  async getStyles() {
    const baseStyles = super.getStyles();
    const quizStyles = await sharedStyles.getQuizStyles();
    return `
			${baseStyles}
			${quizStyles}

			/* Card layout styles */
			.quiz-grid-2 {
				display: grid;
				grid-template-columns: repeat(2, 1fr);
				gap: 1rem;
			}

			@media (max-width: 768px) {
				.quiz-grid-2 {
					grid-template-columns: 1fr;
				}
			}

			.quiz-option-card {
				cursor: pointer;
				display: block;
				transition: var(--quiz-transition);
			}

			.quiz-option-card:hover:not([aria-disabled="true"]) .quiz-option-button {
				transform: translateY(-2px);
				box-shadow: var(--quiz-shadow);
			}

			.quiz-option-button {
				border: 2px solid #e2e8f0;
				border-radius: var(--quiz-border-radius);
				padding: 1rem;
				background: white;
				transition: var(--quiz-transition);
				position: relative;
				min-height: 60px;
				display: flex;
				align-items: center;
				justify-content: space-between;
			}

			.quiz-option-button.selected {
				border-color: var(--quiz-primary-color);
				background-color: #f0f9ff;
			}

			.quiz-option-text {
				flex: 1;
			}

			.quiz-option-text-content {
				font-weight: 500;
				color: #374151;
			}

			.quiz-checkmark {
				color: var(--quiz-primary-color);
				flex-shrink: 0;
				margin-left: 0.5rem;
			}

			/* Simple layout styles */
			.quiz-space-y-3 {
				display: flex;
				flex-direction: column;
				gap: 0.75rem;
			}

			.quiz-spacing-container {
				padding: 0.5rem 0;
			}

			.quiz-checkbox-container {
				display: flex;
				align-items: flex-start;
				gap: 0.75rem;
			}

			.quiz-checkbox-input {
				width: 1.25rem;
				height: 1.25rem;
				border: 2px solid #d1d5db;
				border-radius: 0.25rem;
				background: white;
				cursor: pointer;
				flex-shrink: 0;
				margin-top: 0.125rem;
			}

			.quiz-checkbox-input:checked {
				background-color: var(--quiz-primary-color);
				border-color: var(--quiz-primary-color);
			}

			.quiz-checkbox-input:focus {
				outline: 2px solid var(--quiz-primary-color);
				outline-offset: 2px;
			}

			.quiz-checkbox-label {
				cursor: pointer;
				color: #374151;
				line-height: 1.5;
				flex: 1;
			}

			/* Screen reader only */
			.quiz-sr-only {
				position: absolute;
				width: 1px;
				height: 1px;
				padding: 0;
				margin: -1px;
				overflow: hidden;
				clip: rect(0, 0, 0, 0);
				white-space: nowrap;
				border: 0;
			}

			/* Disabled state */
			:host([disabled]) .quiz-option-card {
				cursor: not-allowed;
				opacity: 0.6;
			}

			:host([disabled]) .quiz-option-button {
				background-color: #f9fafb;
				color: #9ca3af;
			}

			:host([disabled]) .quiz-checkbox-input {
				cursor: not-allowed;
				opacity: 0.6;
			}

			:host([disabled]) .quiz-checkbox-label {
				cursor: not-allowed;
				color: #9ca3af;
			}

			/* Error state */
			.quiz-error-container {
				padding: 1rem;
				background-color: #fef2f2;
				border: 1px solid #fecaca;
				border-radius: var(--quiz-border-radius);
			}

			.quiz-error-text {
				color: var(--quiz-error-color);
				margin: 0;
				font-size: 0.875rem;
			}

			/* Focus styles for accessibility */
			.quiz-option-card:focus-within .quiz-option-button {
				outline: 2px solid var(--quiz-primary-color);
				outline-offset: 2px;
			}
		`;
  }
  setupEventListeners() {
    this.root.addEventListener("change", this.handleOptionChange.bind(this));
    this.root.addEventListener("click", this.handleOptionClick.bind(this));
  }
  handleOptionChange(event) {
    if (this.isDisabled) return;
    const input = event.target;
    if (input.type === "checkbox") {
      const optionId = input.value;
      if (input.checked) {
        if (!this.selectedValues.includes(optionId)) {
          this.selectedValues.push(optionId);
        }
      } else {
        this.selectedValues = this.selectedValues.filter((id) => id !== optionId);
      }
      this.updateSelectedState();
      this.dispatchAnswerSelected(this.selectedValues);
    }
  }
  handleOptionClick(event) {
    if (this.isDisabled) return;
    if (this.layout === "cards") {
      const label = event.target.closest(".quiz-option-card");
      if (label) {
        const optionId = label.getAttribute("data-option-id");
        const input = label.querySelector("input[type='checkbox']");
        if (input) {
          input.checked = !input.checked;
          if (input.checked) {
            if (!this.selectedValues.includes(optionId)) {
              this.selectedValues.push(optionId);
            }
          } else {
            this.selectedValues = this.selectedValues.filter((id) => id !== optionId);
          }
          this.updateSelectedState();
          this.dispatchAnswerSelected(this.selectedValues);
        }
      }
    }
  }
  updateSelectedState() {
    if (this.layout === "cards") {
      this.updateCardSelectedState();
    } else {
      this.updateSimpleSelectedState();
    }
  }
  updateCardSelectedState() {
    const labels = this.root.querySelectorAll(".quiz-option-card");
    labels.forEach((label) => {
      const optionId = label.getAttribute("data-option-id");
      const button = label.querySelector(".quiz-option-button");
      const input = label.querySelector("input[type='checkbox']");
      if (this.selectedValues.includes(optionId)) {
        button.classList.add("selected");
        input.checked = true;
        if (!button.querySelector(".quiz-checkmark")) {
          const textDiv = button.querySelector(".quiz-option-text");
          textDiv.insertAdjacentHTML("afterend", this.getCheckmarkSVG());
        }
      } else {
        button.classList.remove("selected");
        input.checked = false;
        const checkmark = button.querySelector(".quiz-checkmark");
        if (checkmark) {
          checkmark.remove();
        }
      }
    });
  }
  updateSimpleSelectedState() {
    const inputs = this.root.querySelectorAll("input[type='checkbox']");
    inputs.forEach((input) => {
      const optionId = input.value;
      input.checked = this.selectedValues.includes(optionId);
    });
  }
  updateDisabledState() {
    const inputs = this.root.querySelectorAll("input[type='checkbox']");
    inputs.forEach((input) => {
      input.disabled = this.isDisabled;
    });
    const container = this.root.querySelector(".quiz-grid-2, .quiz-space-y-3");
    if (container) {
      if (this.isDisabled) {
        container.setAttribute("aria-disabled", "true");
      } else {
        container.removeAttribute("aria-disabled");
      }
    }
  }
  dispatchAnswerSelected(values) {
    const event = new CustomEvent("answer-selected", {
      detail: {
        questionId: this.questionData?.id,
        value: values,
        questionType: "checkbox"
      },
      bubbles: true
    });
    this.dispatchEvent(event);
  }
  // Public API methods
  getSelectedValues() {
    return [...this.selectedValues];
  }
  setSelectedValues(values) {
    this.selectedValues = Array.isArray(values) ? [...values] : [];
    this.setAttribute("selected-values", JSON.stringify(this.selectedValues));
  }
  setDisabled(disabled) {
    this.isDisabled = disabled;
    if (disabled) {
      this.setAttribute("disabled", "");
    } else {
      this.removeAttribute("disabled");
    }
  }
  getQuestionData() {
    return this.questionData;
  }
  setQuestionData(data) {
    this.questionData = data;
    this.setAttribute("question-data", JSON.stringify(data));
  }
  setLayout(layout) {
    this.layout = layout;
    this.setAttribute("layout", layout);
  }
}
if (!customElements.get("quiz-checkbox-group")) {
  customElements.define("quiz-checkbox-group", QuizCheckboxGroupComponent);
}
class QuizDropdownComponent extends QuizBaseComponent {
  static get observedAttributes() {
    return ["question-data", "selected-value", "disabled", "show-error", "error-message"];
  }
  constructor() {
    super();
    this.questionData = null;
    this.selectedValue = null;
    this.isDisabled = false;
    this.showError = false;
    this.errorMessage = "";
  }
  initialize() {
    this.parseAttributes();
  }
  parseAttributes() {
    const questionDataAttr = this.getAttribute("question-data");
    if (questionDataAttr) {
      try {
        this.questionData = JSON.parse(questionDataAttr);
      } catch (error) {
        console.error("Quiz Dropdown: Invalid question-data JSON:", error);
        this.questionData = null;
      }
    }
    this.selectedValue = this.getAttribute("selected-value") || null;
    this.isDisabled = this.getBooleanAttribute("disabled", false);
    this.showError = this.getBooleanAttribute("show-error", false);
    this.errorMessage = this.getAttribute("error-message") || "";
  }
  handleAttributeChange(name, oldValue, newValue) {
    switch (name) {
      case "question-data":
        this.parseAttributes();
        break;
      case "selected-value":
        this.selectedValue = newValue;
        this.updateSelectedState();
        break;
      case "disabled":
        this.isDisabled = this.getBooleanAttribute("disabled", false);
        this.updateDisabledState();
        break;
      case "show-error":
        this.showError = this.getBooleanAttribute("show-error", false);
        this.updateErrorState();
        break;
      case "error-message":
        this.errorMessage = newValue || "";
        this.updateErrorMessage();
        break;
    }
  }
  getTemplate() {
    if (!this.questionData) {
      return `
				<div class="quiz-error-container">
					<p class="quiz-error-text">Invalid question configuration</p>
				</div>
			`;
    }
    const options = this.questionData.options || [];
    const questionId = this.questionData.id;
    const placeholder = this.questionData.placeholder || "Select an option";
    const optionsHTML = options.map(
      (option) => `
			<option value="${option.id}" ${this.selectedValue === option.id ? "selected" : ""}>
				${option.text}
			</option>
		`
    ).join("");
    return `
			<div class="quiz-dropdown-container">
				<select
					id="question-${questionId}"
					class="quiz-select ${this.showError ? "quiz-select-error" : ""}"
					${this.isDisabled ? "disabled" : ""}
					aria-describedby="error-${questionId}"
				>
					<option value="">${placeholder}</option>
					${optionsHTML}
				</select>
				<div class="quiz-error-element ${this.showError ? "quiz-error-visible" : "quiz-error-hidden"}"
					 id="error-${questionId}"
					 role="alert"
					 aria-live="polite">
					${this.errorMessage}
				</div>
			</div>
		`;
  }
  async getStyles() {
    const baseStyles = super.getStyles();
    const quizStyles = await sharedStyles.getQuizStyles();
    return `
			${baseStyles}
			${quizStyles}

			/* Component-specific styles */
			.quiz-dropdown-container {
				position: relative;
			}

			.quiz-select {
				width: 100%;
				padding: 0.75rem 1rem;
				border: 2px solid #e2e8f0;
				border-radius: var(--quiz-border-radius);
				background: white;
				font-size: 1rem;
				color: #374151;
				transition: var(--quiz-transition);
				appearance: none;
				background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
				background-position: right 0.5rem center;
				background-repeat: no-repeat;
				background-size: 1.5em 1.5em;
				padding-right: 2.5rem;
			}

			.quiz-select:focus {
				outline: none;
				border-color: var(--quiz-primary-color);
				box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
			}

			.quiz-select:hover:not(:disabled) {
				border-color: #cbd5e1;
			}

			/* Placeholder styling */
			.quiz-select option[value=""] {
				color: #9ca3af;
			}

			/* Error state */
			.quiz-select-error {
				border-color: var(--quiz-error-color);
				background-color: #fef2f2;
			}

			.quiz-select-error:focus {
				border-color: var(--quiz-error-color);
				box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
			}

			/* Error message */
			.quiz-error-element {
				margin-top: 0.5rem;
				font-size: 0.875rem;
				color: var(--quiz-error-color);
				transition: var(--quiz-transition);
			}

			.quiz-error-hidden {
				opacity: 0;
				height: 0;
				overflow: hidden;
			}

			.quiz-error-visible {
				opacity: 1;
				height: auto;
			}

			/* Disabled state */
			.quiz-select:disabled {
				background-color: #f9fafb;
				color: #9ca3af;
				cursor: not-allowed;
				opacity: 0.6;
			}

			/* Error container for invalid configuration */
			.quiz-error-container {
				padding: 1rem;
				background-color: #fef2f2;
				border: 1px solid #fecaca;
				border-radius: var(--quiz-border-radius);
			}

			.quiz-error-text {
				color: var(--quiz-error-color);
				margin: 0;
				font-size: 0.875rem;
			}

			/* Mobile responsiveness */
			@media (max-width: 768px) {
				.quiz-select {
					font-size: 16px; /* Prevents zoom on iOS */
				}
			}
		`;
  }
  setupEventListeners() {
    this.root.addEventListener("change", this.handleSelectionChange.bind(this));
  }
  handleSelectionChange(event) {
    if (this.isDisabled) return;
    const select = event.target;
    if (select.classList.contains("quiz-select")) {
      const selectedValue = select.value;
      this.selectedValue = selectedValue;
      this.dispatchAnswerSelected(selectedValue);
      if (this.showError && selectedValue) {
        this.clearError();
      }
    }
  }
  updateSelectedState() {
    const select = this.root.querySelector(".quiz-select");
    if (select) {
      select.value = this.selectedValue || "";
    }
  }
  updateDisabledState() {
    const select = this.root.querySelector(".quiz-select");
    if (select) {
      select.disabled = this.isDisabled;
    }
  }
  updateErrorState() {
    const select = this.root.querySelector(".quiz-select");
    const errorElement = this.root.querySelector(".quiz-error-element");
    if (select) {
      if (this.showError) {
        select.classList.add("quiz-select-error");
      } else {
        select.classList.remove("quiz-select-error");
      }
    }
    if (errorElement) {
      if (this.showError) {
        errorElement.classList.remove("quiz-error-hidden");
        errorElement.classList.add("quiz-error-visible");
      } else {
        errorElement.classList.remove("quiz-error-visible");
        errorElement.classList.add("quiz-error-hidden");
      }
    }
  }
  updateErrorMessage() {
    const errorElement = this.root.querySelector(".quiz-error-element");
    if (errorElement) {
      errorElement.textContent = this.errorMessage;
    }
  }
  dispatchAnswerSelected(value) {
    const event = new CustomEvent("answer-selected", {
      detail: {
        questionId: this.questionData?.id,
        value,
        questionType: "dropdown"
      },
      bubbles: true
    });
    this.dispatchEvent(event);
  }
  // Public API methods
  getSelectedValue() {
    return this.selectedValue;
  }
  setSelectedValue(value) {
    this.selectedValue = value;
    this.setAttribute("selected-value", value || "");
  }
  setDisabled(disabled) {
    this.isDisabled = disabled;
    if (disabled) {
      this.setAttribute("disabled", "");
    } else {
      this.removeAttribute("disabled");
    }
  }
  showValidationError(message) {
    this.errorMessage = message;
    this.showError = true;
    this.setAttribute("error-message", message);
    this.setAttribute("show-error", "");
  }
  clearError() {
    this.showError = false;
    this.errorMessage = "";
    this.removeAttribute("show-error");
    this.removeAttribute("error-message");
  }
  getQuestionData() {
    return this.questionData;
  }
  setQuestionData(data) {
    this.questionData = data;
    this.setAttribute("question-data", JSON.stringify(data));
  }
  // Validation helper
  isValid() {
    return this.selectedValue && this.selectedValue.trim() !== "";
  }
  // Focus management
  focus() {
    const select = this.root.querySelector(".quiz-select");
    if (select) {
      select.focus();
    }
  }
}
if (!customElements.get("quiz-dropdown")) {
  customElements.define("quiz-dropdown", QuizDropdownComponent);
}
class QuizTextInputComponent extends QuizBaseComponent {
  static get observedAttributes() {
    return ["question-data", "value", "disabled", "show-error", "error-message", "input-type"];
  }
  constructor() {
    super();
    this.questionData = null;
    this.inputValue = "";
    this.isDisabled = false;
    this.showError = false;
    this.errorMessage = "";
    this.inputType = "text";
  }
  initialize() {
    this.parseAttributes();
  }
  parseAttributes() {
    const questionDataAttr = this.getAttribute("question-data");
    if (questionDataAttr) {
      try {
        this.questionData = JSON.parse(questionDataAttr);
      } catch (error) {
        console.error("Quiz Text Input: Invalid question-data JSON:", error);
        this.questionData = null;
      }
    }
    this.inputValue = this.getAttribute("value") || "";
    this.isDisabled = this.getBooleanAttribute("disabled", false);
    this.showError = this.getBooleanAttribute("show-error", false);
    this.errorMessage = this.getAttribute("error-message") || "";
    this.inputType = this.getAttribute("input-type") || "text";
  }
  handleAttributeChange(name, oldValue, newValue) {
    switch (name) {
      case "question-data":
        this.parseAttributes();
        break;
      case "value":
        this.inputValue = newValue || "";
        this.updateInputValue();
        break;
      case "disabled":
        this.isDisabled = this.getBooleanAttribute("disabled", false);
        this.updateDisabledState();
        break;
      case "show-error":
        this.showError = this.getBooleanAttribute("show-error", false);
        this.updateErrorState();
        break;
      case "error-message":
        this.errorMessage = newValue || "";
        this.updateErrorMessage();
        break;
      case "input-type":
        this.inputType = newValue || "text";
        this.updateInputType();
        break;
    }
  }
  getTemplate() {
    if (!this.questionData) {
      return `
				<div class="quiz-error-container">
					<p class="quiz-error-text">Invalid question configuration</p>
				</div>
			`;
    }
    const questionId = this.questionData.id;
    const placeholder = this.questionData.placeholder || "Type your answer here...";
    return `
			<div class="quiz-text-input-container">
				<input
					type="${this.inputType}"
					id="question-${questionId}"
					class="quiz-input ${this.showError ? "quiz-input-error" : ""}"
					placeholder="${placeholder}"
					value="${this.inputValue}"
					${this.isDisabled ? "disabled" : ""}
					aria-describedby="error-${questionId}"
				>
				<div class="quiz-error-element ${this.showError ? "quiz-error-visible" : "quiz-error-hidden"}"
					 id="error-${questionId}"
					 role="alert"
					 aria-live="polite">
					${this.errorMessage}
				</div>
			</div>
		`;
  }
  async getStyles() {
    const baseStyles = super.getStyles();
    const quizStyles = await sharedStyles.getQuizStyles();
    return `
			${baseStyles}
			${quizStyles}

			/* Component-specific styles */
			.quiz-text-input-container {
				position: relative;
			}

			.quiz-input {
				width: 100%;
				padding: 0.75rem 1rem;
				border: 2px solid #e2e8f0;
				border-radius: var(--quiz-border-radius);
				background: white;
				font-size: 1rem;
				color: #374151;
				transition: var(--quiz-transition);
				box-sizing: border-box;
			}

			.quiz-input:focus {
				outline: none;
				border-color: var(--quiz-primary-color);
				box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
			}

			.quiz-input:hover:not(:disabled) {
				border-color: #cbd5e1;
			}

			.quiz-input::placeholder {
				color: #9ca3af;
			}

			/* Error state */
			.quiz-input-error {
				border-color: var(--quiz-error-color);
				background-color: #fef2f2;
			}

			.quiz-input-error:focus {
				border-color: var(--quiz-error-color);
				box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
			}

			/* Error message */
			.quiz-error-element {
				margin-top: 0.5rem;
				font-size: 0.875rem;
				color: var(--quiz-error-color);
				transition: var(--quiz-transition);
			}

			.quiz-error-hidden {
				opacity: 0;
				height: 0;
				overflow: hidden;
			}

			.quiz-error-visible {
				opacity: 1;
				height: auto;
			}

			/* Disabled state */
			.quiz-input:disabled {
				background-color: #f9fafb;
				color: #9ca3af;
				cursor: not-allowed;
				opacity: 0.6;
			}

			/* Error container for invalid configuration */
			.quiz-error-container {
				padding: 1rem;
				background-color: #fef2f2;
				border: 1px solid #fecaca;
				border-radius: var(--quiz-border-radius);
			}

			.quiz-error-text {
				color: var(--quiz-error-color);
				margin: 0;
				font-size: 0.875rem;
			}

			/* Valid state (optional) */
			.quiz-input-valid {
				border-color: var(--quiz-success-color);
				background-color: #f0fdf4;
			}

			.quiz-input-valid:focus {
				border-color: var(--quiz-success-color);
				box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
			}

			/* Mobile responsiveness */
			@media (max-width: 768px) {
				.quiz-input {
					font-size: 16px; /* Prevents zoom on iOS */
				}
			}
		`;
  }
  setupEventListeners() {
    this.root.addEventListener("input", this.handleInputChange.bind(this));
    this.root.addEventListener("blur", this.handleInputBlur.bind(this));
    this.root.addEventListener("focus", this.handleInputFocus.bind(this));
  }
  handleInputChange(event) {
    if (this.isDisabled) return;
    const input = event.target;
    if (input.classList.contains("quiz-input")) {
      const newValue = input.value;
      this.inputValue = newValue;
      this.dispatchAnswerChanged(newValue);
      if (this.showError && newValue.trim()) {
        this.clearError();
      }
    }
  }
  handleInputBlur(event) {
    if (this.isDisabled) return;
    const input = event.target;
    if (input.classList.contains("quiz-input")) {
      this.dispatchAnswerSelected(this.inputValue);
    }
  }
  handleInputFocus(event) {
    if (this.showError) {
      this.clearError();
    }
  }
  updateInputValue() {
    const input = this.root.querySelector(".quiz-input");
    if (input) {
      input.value = this.inputValue;
    }
  }
  updateDisabledState() {
    const input = this.root.querySelector(".quiz-input");
    if (input) {
      input.disabled = this.isDisabled;
    }
  }
  updateErrorState() {
    const input = this.root.querySelector(".quiz-input");
    const errorElement = this.root.querySelector(".quiz-error-element");
    if (input) {
      if (this.showError) {
        input.classList.add("quiz-input-error");
        input.classList.remove("quiz-input-valid");
      } else {
        input.classList.remove("quiz-input-error");
      }
    }
    if (errorElement) {
      if (this.showError) {
        errorElement.classList.remove("quiz-error-hidden");
        errorElement.classList.add("quiz-error-visible");
      } else {
        errorElement.classList.remove("quiz-error-visible");
        errorElement.classList.add("quiz-error-hidden");
      }
    }
  }
  updateErrorMessage() {
    const errorElement = this.root.querySelector(".quiz-error-element");
    if (errorElement) {
      errorElement.textContent = this.errorMessage;
    }
  }
  updateInputType() {
    const input = this.root.querySelector(".quiz-input");
    if (input) {
      input.type = this.inputType;
    }
  }
  dispatchAnswerChanged(value) {
    const event = new CustomEvent("answer-changed", {
      detail: {
        questionId: this.questionData?.id,
        value,
        questionType: "text"
      },
      bubbles: true
    });
    this.dispatchEvent(event);
  }
  dispatchAnswerSelected(value) {
    const event = new CustomEvent("answer-selected", {
      detail: {
        questionId: this.questionData?.id,
        value,
        questionType: "text"
      },
      bubbles: true
    });
    this.dispatchEvent(event);
  }
  // Public API methods
  getValue() {
    return this.inputValue;
  }
  setValue(value) {
    this.inputValue = value || "";
    this.setAttribute("value", this.inputValue);
  }
  setDisabled(disabled) {
    this.isDisabled = disabled;
    if (disabled) {
      this.setAttribute("disabled", "");
    } else {
      this.removeAttribute("disabled");
    }
  }
  showValidationError(message) {
    this.errorMessage = message;
    this.showError = true;
    this.setAttribute("error-message", message);
    this.setAttribute("show-error", "");
  }
  clearError() {
    this.showError = false;
    this.errorMessage = "";
    this.removeAttribute("show-error");
    this.removeAttribute("error-message");
  }
  showValidState() {
    const input = this.root.querySelector(".quiz-input");
    if (input) {
      input.classList.add("quiz-input-valid");
      input.classList.remove("quiz-input-error");
    }
  }
  clearValidState() {
    const input = this.root.querySelector(".quiz-input");
    if (input) {
      input.classList.remove("quiz-input-valid");
    }
  }
  getQuestionData() {
    return this.questionData;
  }
  setQuestionData(data) {
    this.questionData = data;
    this.setAttribute("question-data", JSON.stringify(data));
  }
  setInputType(type) {
    this.inputType = type;
    this.setAttribute("input-type", type);
  }
  // Validation helpers
  isValid() {
    return this.inputValue && this.inputValue.trim() !== "";
  }
  isEmpty() {
    return !this.inputValue || this.inputValue.trim() === "";
  }
  // Focus management
  focus() {
    const input = this.root.querySelector(".quiz-input");
    if (input) {
      input.focus();
    }
  }
  select() {
    const input = this.root.querySelector(".quiz-input");
    if (input) {
      input.select();
    }
  }
}
if (!customElements.get("quiz-text-input")) {
  customElements.define("quiz-text-input", QuizTextInputComponent);
}
class QuizRatingComponent extends QuizBaseComponent {
  static get observedAttributes() {
    return ["question-data", "value", "disabled", "min-value", "max-value", "step"];
  }
  constructor() {
    super();
    this.questionData = null;
    this.ratingValue = 5;
    this.isDisabled = false;
    this.minValue = 1;
    this.maxValue = 10;
    this.step = 1;
  }
  initialize() {
    this.parseAttributes();
  }
  parseAttributes() {
    const questionDataAttr = this.getAttribute("question-data");
    if (questionDataAttr) {
      try {
        this.questionData = JSON.parse(questionDataAttr);
      } catch (error) {
        console.error("Quiz Rating: Invalid question-data JSON:", error);
        this.questionData = null;
      }
    }
    this.ratingValue = this.getNumberAttribute("value", 5);
    this.isDisabled = this.getBooleanAttribute("disabled", false);
    this.minValue = this.getNumberAttribute("min-value", 1);
    this.maxValue = this.getNumberAttribute("max-value", 10);
    this.step = this.getNumberAttribute("step", 1);
    this.ratingValue = Math.max(this.minValue, Math.min(this.maxValue, this.ratingValue));
  }
  handleAttributeChange(name, oldValue, newValue) {
    switch (name) {
      case "question-data":
        this.parseAttributes();
        break;
      case "value":
        this.ratingValue = this.getNumberAttribute("value", 5);
        this.ratingValue = Math.max(this.minValue, Math.min(this.maxValue, this.ratingValue));
        this.updateRatingValue();
        break;
      case "disabled":
        this.isDisabled = this.getBooleanAttribute("disabled", false);
        this.updateDisabledState();
        break;
      case "min-value":
      case "max-value":
      case "step":
        this.parseAttributes();
        break;
    }
  }
  getTemplate() {
    if (!this.questionData) {
      return `
				<div class="quiz-error-container">
					<p class="quiz-error-text">Invalid question configuration</p>
				</div>
			`;
    }
    const questionId = this.questionData.id;
    return `
			<div class="quiz-rating-container">
				<div class="quiz-rating-input-wrapper">
					<input
						type="range"
						id="question-${questionId}"
						class="quiz-range"
						min="${this.minValue}"
						max="${this.maxValue}"
						step="${this.step}"
						value="${this.ratingValue}"
						${this.isDisabled ? "disabled" : ""}
					>
					<div class="quiz-rating-value" aria-live="polite">
						<span class="quiz-rating-current">${this.ratingValue}</span>
					</div>
				</div>
				<div class="quiz-range-labels">
					<span class="quiz-range-label-min">${this.minValue}</span>
					<span class="quiz-range-label-mid">${Math.floor((this.minValue + this.maxValue) / 2)}</span>
					<span class="quiz-range-label-max">${this.maxValue}</span>
				</div>
			</div>
		`;
  }
  async getStyles() {
    const baseStyles = super.getStyles();
    const quizStyles = await sharedStyles.getQuizStyles();
    return `
			${baseStyles}
			${quizStyles}

			/* Component-specific styles */
			.quiz-rating-container {
				padding: 1rem 0;
			}

			.quiz-rating-input-wrapper {
				position: relative;
				margin-bottom: 1rem;
			}

			.quiz-range {
				width: 100%;
				height: 8px;
				border-radius: 4px;
				background: #e2e8f0;
				outline: none;
				appearance: none;
				cursor: pointer;
				transition: var(--quiz-transition);
			}

			.quiz-range:focus {
				box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
			}

			/* Webkit browsers (Chrome, Safari) */
			.quiz-range::-webkit-slider-thumb {
				appearance: none;
				width: 24px;
				height: 24px;
				border-radius: 50%;
				background: var(--quiz-primary-color);
				cursor: pointer;
				border: 2px solid white;
				box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
				transition: var(--quiz-transition);
			}

			.quiz-range::-webkit-slider-thumb:hover {
				transform: scale(1.1);
				box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
			}

			.quiz-range::-webkit-slider-thumb:active {
				transform: scale(1.2);
			}

			/* Firefox */
			.quiz-range::-moz-range-thumb {
				width: 24px;
				height: 24px;
				border-radius: 50%;
				background: var(--quiz-primary-color);
				cursor: pointer;
				border: 2px solid white;
				box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
				transition: var(--quiz-transition);
			}

			.quiz-range::-moz-range-thumb:hover {
				transform: scale(1.1);
				box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
			}

			.quiz-range::-moz-range-track {
				height: 8px;
				border-radius: 4px;
				background: #e2e8f0;
				border: none;
			}

			/* Rating value display */
			.quiz-rating-value {
				position: absolute;
				top: -2.5rem;
				left: 50%;
				transform: translateX(-50%);
				background: var(--quiz-primary-color);
				color: white;
				padding: 0.5rem 0.75rem;
				border-radius: var(--quiz-border-radius);
				font-weight: 600;
				font-size: 1.125rem;
				box-shadow: var(--quiz-shadow);
				pointer-events: none;
			}

			.quiz-rating-value::after {
				content: '';
				position: absolute;
				top: 100%;
				left: 50%;
				transform: translateX(-50%);
				border: 6px solid transparent;
				border-top-color: var(--quiz-primary-color);
			}

			.quiz-rating-current {
				display: block;
				min-width: 1.5rem;
				text-align: center;
			}

			/* Range labels */
			.quiz-range-labels {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-top: 0.5rem;
				font-size: 0.875rem;
				color: #6b7280;
			}

			.quiz-range-label-min,
			.quiz-range-label-max {
				font-weight: 500;
			}

			.quiz-range-label-mid {
				color: #9ca3af;
			}

			/* Disabled state */
			.quiz-range:disabled {
				cursor: not-allowed;
				opacity: 0.6;
			}

			.quiz-range:disabled::-webkit-slider-thumb {
				cursor: not-allowed;
				background: #9ca3af;
			}

			.quiz-range:disabled::-moz-range-thumb {
				cursor: not-allowed;
				background: #9ca3af;
			}

			:host([disabled]) .quiz-rating-value {
				background: #9ca3af;
			}

			:host([disabled]) .quiz-rating-value::after {
				border-top-color: #9ca3af;
			}

			/* Error container for invalid configuration */
			.quiz-error-container {
				padding: 1rem;
				background-color: #fef2f2;
				border: 1px solid #fecaca;
				border-radius: var(--quiz-border-radius);
			}

			.quiz-error-text {
				color: var(--quiz-error-color);
				margin: 0;
				font-size: 0.875rem;
			}

			/* Mobile responsiveness */
			@media (max-width: 768px) {
				.quiz-rating-value {
					font-size: 1rem;
					padding: 0.375rem 0.625rem;
				}

				.quiz-range::-webkit-slider-thumb {
					width: 20px;
					height: 20px;
				}

				.quiz-range::-moz-range-thumb {
					width: 20px;
					height: 20px;
				}
			}

			/* Animation for value changes */
			.quiz-rating-value {
				transition: all 0.2s ease;
			}

			.quiz-rating-value.updating {
				transform: translateX(-50%) scale(1.1);
			}
		`;
  }
  setupEventListeners() {
    this.root.addEventListener("input", this.handleRatingChange.bind(this));
    this.root.addEventListener("change", this.handleRatingSet.bind(this));
  }
  handleRatingChange(event) {
    if (this.isDisabled) return;
    const range = event.target;
    if (range.classList.contains("quiz-range")) {
      const newValue = parseInt(range.value, 10);
      this.ratingValue = newValue;
      this.updateRatingDisplay();
      this.dispatchAnswerChanged(newValue);
    }
  }
  handleRatingSet(event) {
    if (this.isDisabled) return;
    const range = event.target;
    if (range.classList.contains("quiz-range")) {
      const newValue = parseInt(range.value, 10);
      this.ratingValue = newValue;
      this.dispatchAnswerSelected(newValue);
    }
  }
  updateRatingValue() {
    const range = this.root.querySelector(".quiz-range");
    if (range) {
      range.value = this.ratingValue;
    }
    this.updateRatingDisplay();
  }
  updateRatingDisplay() {
    const valueDisplay = this.root.querySelector(".quiz-rating-current");
    if (valueDisplay) {
      valueDisplay.textContent = this.ratingValue;
      const valueContainer = this.root.querySelector(".quiz-rating-value");
      if (valueContainer) {
        valueContainer.classList.add("updating");
        setTimeout(() => {
          valueContainer.classList.remove("updating");
        }, 200);
      }
    }
  }
  updateDisabledState() {
    const range = this.root.querySelector(".quiz-range");
    if (range) {
      range.disabled = this.isDisabled;
    }
  }
  dispatchAnswerChanged(value) {
    const event = new CustomEvent("answer-changed", {
      detail: {
        questionId: this.questionData?.id,
        value,
        questionType: "rating"
      },
      bubbles: true
    });
    this.dispatchEvent(event);
  }
  dispatchAnswerSelected(value) {
    const event = new CustomEvent("answer-selected", {
      detail: {
        questionId: this.questionData?.id,
        value,
        questionType: "rating"
      },
      bubbles: true
    });
    this.dispatchEvent(event);
  }
  // Public API methods
  getValue() {
    return this.ratingValue;
  }
  setValue(value) {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      this.ratingValue = Math.max(this.minValue, Math.min(this.maxValue, numValue));
      this.setAttribute("value", this.ratingValue.toString());
    }
  }
  setDisabled(disabled) {
    this.isDisabled = disabled;
    if (disabled) {
      this.setAttribute("disabled", "");
    } else {
      this.removeAttribute("disabled");
    }
  }
  getQuestionData() {
    return this.questionData;
  }
  setQuestionData(data) {
    this.questionData = data;
    this.setAttribute("question-data", JSON.stringify(data));
  }
  setRange(min, max, step = 1) {
    this.minValue = min;
    this.maxValue = max;
    this.step = step;
    this.setAttribute("min-value", min.toString());
    this.setAttribute("max-value", max.toString());
    this.setAttribute("step", step.toString());
    this.ratingValue = Math.max(this.minValue, Math.min(this.maxValue, this.ratingValue));
    this.setAttribute("value", this.ratingValue.toString());
  }
  // Focus management
  focus() {
    const range = this.root.querySelector(".quiz-range");
    if (range) {
      range.focus();
    }
  }
}
if (!customElements.get("quiz-rating")) {
  customElements.define("quiz-rating", QuizRatingComponent);
}
class QuizComponentsInit {
  constructor() {
    this.initialized = false;
    this.config = null;
  }
  /**
   * Initialize quiz components with configuration
   */
  async init(config = {}) {
    if (this.initialized) {
      console.warn("Quiz components already initialized");
      return;
    }
    this.config = {
      cssUrl: config.cssUrl || window.QUIZ_CSS_URL || window.QUIZ_CONFIG?.cssUrl,
      debug: config.debug || window.QUIZ_CONFIG?.debug || false,
      fallbackCssUrl: config.fallbackCssUrl || "/assets/quiz.css",
      ...config
    };
    if (this.config.cssUrl) {
      sharedStyles.setQuizCssUrl(this.config.cssUrl);
    }
    if (this.config.debug) {
      console.log("🎯 Quiz Web Components Initialization:", this.config);
      await this.validateConfiguration();
    }
    this.initialized = true;
  }
  /**
   * Validate configuration and CSS accessibility
   */
  async validateConfiguration() {
    const cssUrl = this.config.cssUrl || this.config.fallbackCssUrl;
    console.log("🔍 Validating quiz components configuration...");
    console.log("📍 CSS URL:", cssUrl);
    try {
      const styles = await sharedStyles.getQuizStyles(cssUrl);
      if (styles && styles.length > 0) {
        console.log("✅ Quiz CSS loaded successfully:", `${styles.length} characters`);
      } else {
        console.warn("⚠️ Quiz CSS loaded but appears empty");
      }
    } catch (error) {
      console.error("❌ Failed to load quiz CSS:", error);
      console.log("🔄 Will attempt fallback loading when components render");
    }
    const checks = [
      { name: "QUIZ_CSS_URL", value: window.QUIZ_CSS_URL },
      { name: "QUIZ_CONFIG", value: window.QUIZ_CONFIG }
    ];
    checks.forEach((check) => {
      if (check.value) {
        console.log(`✅ ${check.name}:`, check.value);
      } else {
        console.warn(`⚠️ ${check.name} not found`);
      }
    });
  }
  /**
   * Get current configuration
   */
  getConfig() {
    return this.config;
  }
  /**
   * Check if components are initialized
   */
  isInitialized() {
    return this.initialized;
  }
  /**
   * Check if Web Components are available in the browser
   */
  areComponentsAvailable() {
    const requiredComponents = ["quiz-multiple-choice", "quiz-checkbox-group", "quiz-dropdown", "quiz-text-input", "quiz-rating"];
    return requiredComponents.every((componentName) => {
      return customElements.get(componentName) !== void 0;
    });
  }
  /**
   * Manually set CSS URL (useful for testing)
   */
  setCssUrl(url) {
    if (this.config) {
      this.config.cssUrl = url;
    }
    sharedStyles.setQuizCssUrl(url);
    if (this.config?.debug) {
      console.log("🎨 CSS URL updated to:", url);
    }
  }
}
const quizComponentsInit = new QuizComponentsInit();
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      if (window.QUIZ_CONFIG || window.QUIZ_CSS_URL) {
        quizComponentsInit.init();
      }
    });
  } else {
    if (window.QUIZ_CONFIG || window.QUIZ_CSS_URL) {
      quizComponentsInit.init();
    }
  }
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
  },
  "quiz-faq-section": {
    module: QuizFAQSection,
    category: "content",
    description: "FAQ section with collapsible questions"
  },
  "quiz-payer-search": {
    module: QuizPayerSearch,
    category: "content",
    description: "Insurance payer search with autocomplete"
  },
  "quiz-result-card": {
    module: QuizResultCard,
    category: "content",
    description: "Result card for quiz outcomes"
  },
  "quiz-form-step": {
    module: QuizFormStep,
    category: "content",
    description: "Complete form step with questions and validation"
  },
  "quiz-step-container": {
    module: QuizStepContainer,
    category: "content",
    description: "Container for quiz steps with navigation"
  },
  "quiz-scheduling-result": {
    module: QuizSchedulingResult,
    category: "content",
    description: "Scheduling result display with success/error states"
  },
  // Question Input Components
  "quiz-multiple-choice": {
    module: QuizMultipleChoiceComponent,
    category: "questions",
    description: "Multiple choice question with card-style options"
  },
  "quiz-checkbox-group": {
    module: QuizCheckboxGroupComponent,
    category: "questions",
    description: "Checkbox group with multiple selection support"
  },
  "quiz-dropdown": {
    module: QuizDropdownComponent,
    category: "questions",
    description: "Dropdown selection with validation"
  },
  "quiz-text-input": {
    module: QuizTextInputComponent,
    category: "questions",
    description: "Text input with validation and error display"
  },
  "quiz-rating": {
    module: QuizRatingComponent,
    category: "questions",
    description: "Rating input with range slider (1-10 scale)"
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
