/**
 * Optimized Quiz Checkmark Component
 *
 * A high-performance, reusable Web Component for displaying animated checkmarks.
 * Uses Shadow DOM for better encapsulation and performance.
 *
 * Features:
 * - Shadow DOM encapsulation
 * - Configurable via CSS custom properties
 * - Chainable API methods
 * - Memory-efficient styling
 * - Reduced DOM manipulations
 * - Better animation system
 *
 * Usage:
 * <quiz-checkmark></quiz-checkmark>
 * <quiz-checkmark animation="bounce" size="large"></quiz-checkmark>
 */

export class QuizCheckmarkComponent extends HTMLElement {
	static get observedAttributes() {
		return ["animation", "size", "color"];
	}

	// Animation configurations
	static ANIMATIONS = {
		bounce: { duration: 300, easing: "cubic-bezier(0.68, -0.55, 0.265, 1.55)" },
		fade: { duration: 300, easing: "ease-out" },
		scale: { duration: 300, easing: "ease-out" },
		none: { duration: 0, easing: "linear" }
	};

	static SIZES = {
		small: "16px",
		normal: "19px",
		large: "24px"
	};

	constructor() {
		super();

		// Create shadow DOM for better encapsulation
		this.attachShadow({ mode: "open" });

		// Cache frequently accessed elements
		this._container = null;
		this._svg = null;

		// Animation state
		this._isAnimating = false;
		this._animationTimeout = null;

		// Initialize once
		this._initializeComponent();
	}

	connectedCallback() {
		this._updateDisplay();
	}

	disconnectedCallback() {
		// Cleanup timeouts to prevent memory leaks
		if (this._animationTimeout) {
			clearTimeout(this._animationTimeout);
			this._animationTimeout = null;
		}
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue !== newValue && this._container) {
			this._updateDisplay();
		}
	}

	_initializeComponent() {
		// Create template with styles and markup
		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: inline-block;
					flex-shrink: 0;
					--checkmark-size: ${QuizCheckmarkComponent.SIZES.normal};
					--checkmark-color: #418865;
					--animation-duration: 300ms;
					--animation-easing: cubic-bezier(0.68, -0.55, 0.265, 1.55);
				}

				:host([hidden]) {
					display: none !important;
				}

				.container {
					display: flex;
					align-items: center;
					justify-content: center;
					width: var(--checkmark-size);
					height: var(--checkmark-size);
				}

				.checkmark-svg {
					width: 100%;
					height: 100%;
					display: block;
				}

				.checkmark-path {
					fill: var(--checkmark-color);
				}

				/* Animation classes */
				.animate-bounce {
					animation: bounce var(--animation-duration) var(--animation-easing);
				}

				.animate-fade {
					animation: fade var(--animation-duration) ease-out;
				}

				.animate-scale {
					animation: scale var(--animation-duration) ease-out;
				}

				.animate-bounce-out {
					animation: bounceOut calc(var(--animation-duration) * 0.67) ease-out forwards;
				}

				.animate-fade-out {
					animation: fadeOut calc(var(--animation-duration) * 0.67) ease-out forwards;
				}

				.animate-scale-out {
					animation: scaleOut calc(var(--animation-duration) * 0.67) ease-out forwards;
				}

				/* Keyframes */
				@keyframes bounce {
					0% { opacity: 0; transform: scale(0.3); }
					50% { opacity: 1; transform: scale(1.1); }
					100% { opacity: 1; transform: scale(1); }
				}

				@keyframes fade {
					0% { opacity: 0; }
					100% { opacity: 1; }
				}

				@keyframes scale {
					0% { opacity: 0; transform: scale(0.8); }
					100% { opacity: 1; transform: scale(1); }
				}

				@keyframes bounceOut {
					0% { opacity: 1; transform: scale(1); }
					100% { opacity: 0; transform: scale(0.3); }
				}

				@keyframes fadeOut {
					0% { opacity: 1; }
					100% { opacity: 0; }
				}

				@keyframes scaleOut {
					0% { opacity: 1; transform: scale(1); }
					100% { opacity: 0; transform: scale(0.8); }
				}
			</style>
			<div class="container">
				<svg class="checkmark-svg" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path class="checkmark-path" fill-rule="evenodd" clip-rule="evenodd"
						d="M9.79158 18.75C4.84404 18.75 0.833252 14.7393 0.833252 9.79168C0.833252 4.84413 4.84404 0.833344 9.79158 0.833344C14.7392 0.833344 18.7499 4.84413 18.7499 9.79168C18.7499 14.7393 14.7392 18.75 9.79158 18.75ZM13.7651 7.82516C14.0598 7.47159 14.012 6.94613 13.6584 6.65148C13.3048 6.35685 12.7793 6.40462 12.4848 6.75818L8.90225 11.0572L7.04751 9.20243C6.72207 8.87701 6.19444 8.87701 5.86899 9.20243C5.54356 9.52784 5.54356 10.0555 5.86899 10.3809L8.369 12.8809C8.53458 13.0465 8.76208 13.1348 8.996 13.1242C9.22992 13.1135 9.44858 13.005 9.59842 12.8252L13.7651 7.82516Z"/>
				</svg>
			</div>
		`;

		// Cache DOM elements
		this._container = this.shadowRoot.querySelector(".container");
		this._svg = this.shadowRoot.querySelector(".checkmark-svg");
	}

	_updateDisplay() {
		const size = this.getAttribute("size") || "normal";
		const color = this.getAttribute("color");
		const animation = this.getAttribute("animation") || "bounce";

		// Update CSS custom properties
		if (QuizCheckmarkComponent.SIZES[size]) {
			this.style.setProperty("--checkmark-size", QuizCheckmarkComponent.SIZES[size]);
		}

		if (color) {
			this.style.setProperty("--checkmark-color", color);
		}

		const animConfig = QuizCheckmarkComponent.ANIMATIONS[animation];
		if (animConfig) {
			this.style.setProperty("--animation-duration", `${animConfig.duration}ms`);
			this.style.setProperty("--animation-easing", animConfig.easing);
		}
	}

	_clearAnimationClasses() {
		this._container.className = "container";
	}

	_playAnimation(animationType, direction = "in") {
		if (this._isAnimating) return Promise.resolve();

		return new Promise(resolve => {
			this._clearAnimationClasses();

			if (animationType === "none") {
				resolve();
				return;
			}

			this._isAnimating = true;
			const suffix = direction === "out" ? "-out" : "";
			this._container.classList.add(`animate-${animationType}${suffix}`);

			const config = QuizCheckmarkComponent.ANIMATIONS[animationType];
			const duration = direction === "out" ? config.duration * 0.67 : config.duration;

			this._animationTimeout = setTimeout(() => {
				this._clearAnimationClasses();
				this._isAnimating = false;
				this._animationTimeout = null;
				resolve();
			}, duration);
		});
	}

	// Public API - Chainable methods
	async show(animationType = null) {
		const animation = animationType || this.getAttribute("animation") || "bounce";

		this.hidden = false;
		await this._playAnimation(animation, "in");
		return this;
	}

	async hide(animationType = null) {
		const animation = animationType || this.getAttribute("animation") || "bounce";

		await this._playAnimation(animation, "out");
		this.hidden = true;
		return this;
	}

	setSize(size) {
		this.setAttribute("size", size);
		return this;
	}

	setAnimation(animationType) {
		this.setAttribute("animation", animationType);
		return this;
	}

	setColor(color) {
		this.setAttribute("color", color);
		return this;
	}

	// Utility methods
	isVisible() {
		return !this.hidden;
	}

	isAnimating() {
		return this._isAnimating;
	}

	// Static method for bulk operations
	static async showAll(checkmarks, animationType = "bounce", staggerDelay = 50) {
		const promises = checkmarks.map((checkmark, index) => {
			return new Promise(resolve => {
				setTimeout(() => {
					checkmark.show(animationType).then(resolve);
				}, index * staggerDelay);
			});
		});

		return Promise.all(promises);
	}

	static async hideAll(checkmarks, animationType = "fade", staggerDelay = 30) {
		const promises = checkmarks.map((checkmark, index) => {
			return new Promise(resolve => {
				setTimeout(() => {
					checkmark.hide(animationType).then(resolve);
				}, index * staggerDelay);
			});
		});

		return Promise.all(promises);
	}
}

// Register the component if not already registered
if (!customElements.get("quiz-checkmark")) {
	customElements.define("quiz-checkmark", QuizCheckmarkComponent);
}

export default QuizCheckmarkComponent;
