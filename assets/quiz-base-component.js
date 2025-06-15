/**
 * Base Quiz Component
 *
 * A foundational class for all quiz Web Components that provides:
 * - Common lifecycle management
 * - Attribute observation and handling
 * - Style and template management
 * - Event handling utilities
 * - Integration with existing quiz CSS classes
 */

import sharedStyles from "../utils/shared-styles.js";

export class QuizBaseComponent extends HTMLElement {
	constructor() {
		super();

		// Configuration
		this.config = {
			useShadowDOM: false, // Disable for now - quiz.css designed for light DOM
			inheritStyles: true,
			autoRender: true
		};

		// Component state
		this.isInitialized = false;
		this._isComponentConnected = false;

		// Setup Shadow DOM if enabled
		if (this.config.useShadowDOM) {
			this.attachShadow({ mode: "open" });
			this.root = this.shadowRoot;
		} else {
			this.root = this;
		}

		// Bind methods
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
			try {
				const renderResult = this.render();
				// Handle both sync and async render methods
				if (renderResult && typeof renderResult.catch === "function") {
					renderResult.catch(error => {
						console.error("Error rendering component:", error);
					});
				}
			} catch (error) {
				console.error("Error rendering component:", error);
			}
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
			try {
				const renderResult = this.render();
				// Handle both sync and async render methods
				if (renderResult && typeof renderResult.catch === "function") {
					renderResult.catch(error => {
						console.error("Error rendering component on attribute change:", error);
					});
				}
			} catch (error) {
				console.error("Error rendering component on attribute change:", error);
			}
		}
	}

	/**
	 * Initialize component
	 * Override in subclasses for custom initialization
	 */
	initialize() {
		// Override in subclasses
	}

	/**
	 * Render component
	 * Must be implemented by subclasses
	 */
	async render() {
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
				--quiz-primary: var(--quiz-primary, #306E51);
				--quiz-primary-hover: var(--quiz-primary-hover, #245a40);
				--quiz-text-error: var(--quiz-text-error, #dc2626);
				--quiz-border-radius: var(--quiz-border-radius, 8px);
				--quiz-shadow-md: var(--quiz-shadow-md, 0 1px 3px rgba(0, 0, 0, 0.1));
				--quiz-transition-fast: var(--quiz-transition-fast, 0.2s ease);
				--quiz-transition-slow: var(--quiz-transition-slow, 0.5s ease-out);
			}
    `;
	}

	/**
	 * Handle attribute changes
	 * Override in subclasses for custom attribute handling
	 */
	handleAttributeChange(name, oldValue, newValue) {
		// Override in subclasses
	}

	/**
	 * Handle slot changes
	 */
	handleSlotChange(event) {
		// Override in subclasses
	}

	/**
	 * Setup event listeners
	 * Override in subclasses
	 */
	setupEventListeners() {
		// Override in subclasses
	}

	/**
	 * Cleanup resources
	 * Override in subclasses
	 */
	cleanup() {
		// Override in subclasses
	}

	/**
	 * Called when component is connected
	 * Override in subclasses
	 */
	onConnected() {
		// Override in subclasses
	}

	/**
	 * Called when component is disconnected
	 * Override in subclasses
	 */
	onDisconnected() {
		// Override in subclasses
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
			if (value === null || value === undefined) {
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
				setTimeout(() => (inThrottle = false), limit);
			}
		};
	}

	/**
	 * Render complete template with styles
	 */
	async renderTemplate() {
		// For light DOM, simply set innerHTML - styles are handled globally by quiz.css
		this.innerHTML = this.getTemplate();
	}
}

/**
 * Component Registry
 * Manages registration and loading of quiz components
 */
export class QuizComponentRegistry {
	constructor() {
		this.components = new Map();
		this.loadedComponents = new Set();
	}

	/**
	 * Register a component
	 */
	register(tagName, componentClass, options = {}) {
		if (customElements.get(tagName)) {
			console.warn(`Component ${tagName} already registered`);
			return;
		}

		// Validate component class
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
			// Static import mapping for Vite compatibility
			const componentMap = {
				"quiz-calendar-icon": () => import("../icons/quiz-calendar-icon.js"),
				"quiz-clock-icon": () => import("../icons/quiz-clock-icon.js"),
				"quiz-checkmark-icon": () => import("../icons/quiz-checkmark-icon.js"),
				"quiz-coverage-card": () => import("../content/quiz-coverage-card.js"),
				"quiz-benefit-item": () => import("../content/quiz-benefit-item.js"),
				"quiz-action-section": () => import("../content/quiz-action-section.js"),
				"quiz-error-display": () => import("../content/quiz-error-display.js"),
				"quiz-loading-display": () => import("../content/quiz-loading-display.js")
			};

			const importFn = componentMap[componentName];
			if (!importFn) {
				throw new Error(`Unknown component: ${componentName}`);
			}

			const module = await importFn();

			if (module.default && !this.isRegistered(componentName)) {
				// Component should self-register when imported
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

// Create global registry instance
export const quizComponentRegistry = new QuizComponentRegistry();
