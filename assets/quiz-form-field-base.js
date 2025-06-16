import { QuizBaseComponent } from "./quiz-base-component.js";

/**
 * Optimized Base class for all quiz form field components
 *
 * Key Optimizations:
 * - Efficient DOM caching and batch updates
 * - Debounced validation and events
 * - Memory leak prevention
 * - Promise-based validation API
 * - Separated concerns (validation vs presentation)
 * - CSS custom properties for theming
 * - WeakMap caching for performance
 */

// Shared caches for performance
const elementCache = new WeakMap();
const validationCache = new WeakMap();
const debounceTimers = new WeakMap();

export class QuizFormFieldBase extends QuizBaseComponent {
	// Configuration constants
	static VALIDATION_DEBOUNCE_MS = 300;
	static ERROR_TRANSITION_MS = 200;
	static BLUR_VALIDATION_DELAY_MS = 50;

	// CSS custom properties for theming
	static CSS_VARS = {
		errorColor: "--quiz-error-color",
		errorBackground: "--quiz-error-background",
		errorBorder: "--quiz-error-border",
		transitionDuration: "--quiz-transition-duration"
	};

	constructor() {
		super();

		// Internal state
		this._state = {
			showError: false,
			errorMessage: "",
			isDisabled: false,
			questionData: null,
			currentValue: "",
			isValidating: false,
			hasBeenBlurred: false
		};

		// Performance optimizations
		this._cachedElements = new Map();
		this._updateQueue = new Set();
		this._isUpdating = false;

		// Bind methods to maintain context
		this._debouncedValidate = this._createDebouncedFunction(this._performValidation.bind(this), QuizFormFieldBase.VALIDATION_DEBOUNCE_MS);

		this._debouncedDispatchChanged = this._createDebouncedFunction(
			this._dispatchAnswerChanged.bind(this),
			100 // Faster debounce for change events
		);

		// Initialize CSS custom properties
		this._initializeCSSProperties();
	}

	static get observedAttributes() {
		return [
			...super.observedAttributes,
			"question-data",
			"show-error",
			"error-message",
			"disabled",
			"value",
			"validation-mode" // immediate, blur, manual
		];
	}

	connectedCallback() {
		super.connectedCallback();
		this._parseAllAttributes();
		this._setupEventListeners();
		this._initializeValidationMode();
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this._cleanup();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		super.attributeChangedCallback?.(name, oldValue, newValue);

		if (oldValue === newValue) return;

		// Queue attribute updates for batch processing
		this._queueUpdate(() => {
			this._handleAttributeChange(name, oldValue, newValue);
		});
	}

	// ===============================
	// CORE STATE MANAGEMENT
	// ===============================

	/**
	 * Get current field value - optimized with caching
	 */
	getValue() {
		return this._state.currentValue;
	}

	/**
	 * Set field value with validation and caching
	 */
	setValue(value, options = {}) {
		const normalizedValue = this._normalizeValue(value);
		const oldValue = this._state.currentValue;

		if (oldValue === normalizedValue && !options.force) {
			return Promise.resolve();
		}

		this._state.currentValue = normalizedValue;

		// Update input element efficiently
		this._updateInputValue(normalizedValue);

		// Handle validation based on mode
		if (options.skipValidation !== true) {
			return this._handleValueChange(normalizedValue, oldValue);
		}

		return Promise.resolve();
	}

	/**
	 * Enhanced validation state management
	 */
	async isValid() {
		if (this._state.isValidating) {
			await this._waitForValidation();
		}

		return this.hasValidValue() && !this._state.showError;
	}

	/**
	 * Improved value validation with caching
	 */
	hasValidValue() {
		const value = this._state.currentValue;

		// Use cached result if available and value hasn't changed
		const cacheKey = `${this.getFieldType()}-${value}`;
		const cached = validationCache.get(this);

		if (cached && cached.key === cacheKey) {
			return cached.isValid;
		}

		const isValid = this._validateValue(value);

		// Cache the result
		validationCache.set(this, { key: cacheKey, isValid });

		return isValid;
	}

	// ===============================
	// ERROR HANDLING & VALIDATION
	// ===============================

	/**
	 * Promise-based error clearing with animations
	 */
	async clearError(animated = true) {
		if (!this._state.showError && !this._hasVisualError()) {
			return Promise.resolve();
		}

		this._state.showError = false;
		this._state.errorMessage = "";

		this.removeAttribute("show-error");
		this.removeAttribute("error-message");

		if (animated) {
			return this._animateErrorClear();
		} else {
			this._clearVisualErrorState();
			return Promise.resolve();
		}
	}

	/**
	 * Enhanced error display with better UX
	 */
	async showValidationError(message, options = {}) {
		const { animated = true, focus = false, temporary = false, duration = 5000 } = options;

		this._state.errorMessage = message;
		this._state.showError = true;

		this.setAttribute("error-message", message);
		this.setAttribute("show-error", "");

		const promise = animated ? this._animateErrorShow() : Promise.resolve(this._updateErrorState());

		if (focus) {
			promise.then(() => this.focus());
		}

		if (temporary) {
			setTimeout(() => this.clearError(animated), duration);
		}

		return promise;
	}

	/**
	 * Debounced validation with Promise support
	 */
	async validate(immediate = false) {
		if (immediate) {
			return this._performValidation();
		}

		return new Promise(resolve => {
			this._debouncedValidate().then(resolve);
		});
	}

	// ===============================
	// EVENT HANDLING
	// ===============================

	/**
	 * Optimized input change handler
	 */
	handleInputChange(newValue, options = {}) {
		const { immediate = false, skipEvents = false } = options;

		const promise = this.setValue(newValue, {
			skipValidation: this._getValidationMode() === "manual"
		});

		if (!skipEvents) {
			if (immediate) {
				this._dispatchAnswerChanged(newValue);
			} else {
				this._debouncedDispatchChanged(newValue);
			}
		}

		return promise;
	}

	/**
	 * Enhanced blur handler with better timing
	 */
	async handleInputBlur() {
		this._state.hasBeenBlurred = true;
		const currentValue = this.getValue();

		// Dispatch answer selected immediately
		this._dispatchAnswerSelected(currentValue);

		// Validate based on mode with optimal timing
		const validationMode = this._getValidationMode();
		if (validationMode === "blur" || (validationMode === "immediate" && !this._state.showError)) {
			// Small delay to prevent race conditions with other events
			await new Promise(resolve => setTimeout(resolve, QuizFormFieldBase.BLUR_VALIDATION_DELAY_MS));
			return this.validate(true);
		}

		return Promise.resolve();
	}

	// ===============================
	// PERFORMANCE OPTIMIZATIONS
	// ===============================

	/**
	 * Batch DOM updates for better performance
	 */
	_queueUpdate(updateFunction) {
		this._updateQueue.add(updateFunction);

		if (!this._isUpdating) {
			this._isUpdating = true;

			// Use RAF for smooth updates
			requestAnimationFrame(() => {
				this._processBatchedUpdates();
			});
		}
	}

	/**
	 * Process all queued updates in a single frame
	 */
	_processBatchedUpdates() {
		// Batch all DOM reads first
		const reads = [];
		const writes = [];

		for (const updateFn of this._updateQueue) {
			try {
				updateFn();
			} catch (error) {
				console.error("Error in batched update:", error);
			}
		}

		this._updateQueue.clear();
		this._isUpdating = false;
	}

	/**
	 * Efficient element caching
	 */
	_getElement(selector, useCache = true) {
		if (!useCache) {
			return this.root.querySelector(selector);
		}

		if (!this._cachedElements.has(selector)) {
			this._cachedElements.set(selector, this.root.querySelector(selector));
		}

		return this._cachedElements.get(selector);
	}

	/**
	 * Clear element cache when DOM changes
	 */
	_invalidateElementCache() {
		this._cachedElements.clear();
	}

	/**
	 * Create debounced function with cleanup
	 */
	_createDebouncedFunction(func, delay) {
		return (...args) => {
			return new Promise(resolve => {
				// Clear existing timer
				const existingTimer = debounceTimers.get(func);
				if (existingTimer) {
					clearTimeout(existingTimer);
				}

				// Set new timer
				const timer = setTimeout(async () => {
					debounceTimers.delete(func);
					try {
						const result = await func(...args);
						resolve(result);
					} catch (error) {
						console.error("Debounced function error:", error);
						resolve(null);
					}
				}, delay);

				debounceTimers.set(func, timer);
			});
		};
	}

	// ===============================
	// INTERNAL HELPERS
	// ===============================

	_parseAllAttributes() {
		// Parse all attributes in one pass
		this._state.showError = this.getBooleanAttribute("show-error", false);
		this._state.errorMessage = this.getAttribute("error-message") || "";
		this._state.isDisabled = this.getBooleanAttribute("disabled", false);
		this._state.currentValue = this.getAttribute("value") || "";

		// Parse question data with error handling
		this._parseQuestionData();
	}

	_parseQuestionData() {
		try {
			const questionDataAttr = this.getAttribute("question-data");
			this._state.questionData = questionDataAttr ? JSON.parse(questionDataAttr) : null;
		} catch (error) {
			console.error("Invalid question data:", error);
			this._state.questionData = null;
		}
	}

	_handleAttributeChange(name, oldValue, newValue) {
		switch (name) {
			case "question-data":
				this._parseQuestionData();
				break;
			case "show-error":
				this._state.showError = this.getBooleanAttribute("show-error", false);
				this._updateErrorState();
				break;
			case "error-message":
				this._state.errorMessage = newValue || "";
				this._updateErrorState();
				break;
			case "disabled":
				this._state.isDisabled = this.getBooleanAttribute("disabled", false);
				this._updateDisabledState();
				break;
			case "value":
				this.setValue(newValue, { skipValidation: true });
				break;
			case "validation-mode":
				this._initializeValidationMode();
				break;
		}
	}

	_normalizeValue(value) {
		if (value === null || value === undefined) return "";
		return String(value);
	}

	_validateValue(value) {
		return value && (typeof value !== "string" || value.trim() !== "");
	}

	async _handleValueChange(newValue, oldValue) {
		// Clear error if user provides valid input
		if ((this._state.showError || this._hasVisualError()) && this.hasValidValue()) {
			await this.clearError();
		}

		// Validate based on mode
		const validationMode = this._getValidationMode();
		if (validationMode === "immediate" || (validationMode === "blur" && this._state.hasBeenBlurred)) {
			return this._debouncedValidate();
		}

		return Promise.resolve();
	}

	_getValidationMode() {
		return this.getAttribute("validation-mode") || "blur";
	}

	_initializeValidationMode() {
		const mode = this._getValidationMode();
		this.style.setProperty("--validation-mode", mode);
	}

	async _performValidation() {
		this._state.isValidating = true;

		try {
			const value = this.getValue();
			const validationResult = await this._customValidation(value);

			if (validationResult !== true) {
				await this.showValidationError(validationResult || "Invalid value");
			}

			return validationResult === true;
		} finally {
			this._state.isValidating = false;
		}
	}

	_waitForValidation() {
		return new Promise(resolve => {
			const checkValidation = () => {
				if (!this._state.isValidating) {
					resolve();
				} else {
					setTimeout(checkValidation, 10);
				}
			};
			checkValidation();
		});
	}

	_initializeCSSProperties() {
		// Set default CSS custom properties
		const style = this.style;
		style.setProperty(QuizFormFieldBase.CSS_VARS.errorColor, "#dc3545");
		style.setProperty(QuizFormFieldBase.CSS_VARS.errorBackground, "#f8d7da");
		style.setProperty(QuizFormFieldBase.CSS_VARS.errorBorder, "#f5c6cb");
		style.setProperty(QuizFormFieldBase.CSS_VARS.transitionDuration, `${QuizFormFieldBase.ERROR_TRANSITION_MS}ms`);
	}

	_setupEventListeners() {
		// Setup any global event listeners here
		// Remember to clean them up in _cleanup()
	}

	_cleanup() {
		// Clear all timeouts
		const timers = debounceTimers.get(this);
		if (timers) {
			Object.values(timers).forEach(clearTimeout);
			debounceTimers.delete(this);
		}

		// Clear caches
		elementCache.delete(this);
		validationCache.delete(this);
		this._cachedElements.clear();
		this._updateQueue.clear();
	}

	// ===============================
	// ANIMATION HELPERS
	// ===============================

	async _animateErrorShow() {
		const errorElement = this._getElement(".quiz-error-text");
		if (!errorElement) return;

		errorElement.textContent = this._state.errorMessage;
		errorElement.classList.remove("quiz-error-hidden");
		errorElement.classList.add("quiz-error-visible");

		this._updateFieldErrorStyling();

		return new Promise(resolve => {
			setTimeout(resolve, QuizFormFieldBase.ERROR_TRANSITION_MS);
		});
	}

	async _animateErrorClear() {
		const errorElement = this._getElement(".quiz-error-text");
		if (!errorElement) return;

		errorElement.classList.remove("quiz-error-visible");
		errorElement.classList.add("quiz-error-hidden");

		this._updateFieldErrorStyling();

		return new Promise(resolve => {
			setTimeout(() => {
				errorElement.textContent = "";
				resolve();
			}, QuizFormFieldBase.ERROR_TRANSITION_MS);
		});
	}

	// ===============================
	// ABSTRACT METHODS (TO BE OVERRIDDEN)
	// ===============================

	/**
	 * Custom validation logic - override in subclasses
	 * @param {string} value - The value to validate
	 * @returns {Promise<true|string>} - true if valid, error message if invalid
	 */
	async _customValidation(value) {
		return true; // Default: always valid
	}

	/**
	 * Update input element value - override in subclasses
	 */
	_updateInputValue(value) {
		const input = this.getInputElement();
		if (input && input.value !== value) {
			input.value = value;
		}
	}

	/**
	 * Update field-specific error styling - override in subclasses
	 */
	_updateFieldErrorStyling() {
		// Override in subclasses
	}

	/**
	 * Update disabled state - override in subclasses
	 */
	_updateDisabledState() {
		// Override in subclasses
	}

	/**
	 * Get field type - override in subclasses
	 */
	getFieldType() {
		return "unknown";
	}

	/**
	 * Get main input element - override in subclasses
	 */
	getInputElement() {
		return null;
	}

	// ===============================
	// LEGACY API COMPATIBILITY
	// ===============================

	// Keep existing method signatures for compatibility
	parseCommonAttributes() {
		this._parseAllAttributes();
	}
	handleCommonAttributeChange(name, oldValue, newValue) {
		this._handleAttributeChange(name, oldValue, newValue);
	}
	clearVisualErrorState() {
		this._clearVisualErrorState();
	}
	hasVisualError() {
		return this._hasVisualError();
	}
	updateErrorState() {
		this._updateErrorState();
	}
	updateFieldErrorStyling() {
		this._updateFieldErrorStyling();
	}
	updateDisabledState() {
		this._updateDisabledState();
	}

	getQuestionData() {
		return this._state.questionData;
	}
	setQuestionData(data) {
		this._state.questionData = data;
		this.setAttribute("question-data", JSON.stringify(data));
	}

	setDisabled(disabled) {
		this._state.isDisabled = disabled;
		if (disabled) {
			this.setAttribute("disabled", "");
		} else {
			this.removeAttribute("disabled");
		}
		this._updateDisabledState();
	}

	focus() {
		const input = this.getInputElement();
		if (input && input.focus) {
			input.focus();
		}
	}

	getErrorElementHTML(questionId) {
		return `<p id="error-${questionId}" class="quiz-error-text ${this._state.showError ? "quiz-error-visible" : "quiz-error-hidden"}">${this._state.errorMessage}</p>`;
	}

	// ===============================
	// ENHANCED EVENT DISPATCHING
	// ===============================

	_dispatchAnswerChanged(value) {
		const event = new CustomEvent("answer-changed", {
			detail: {
				questionId: this._state.questionData?.id,
				value: value,
				questionType: this.getFieldType(),
				timestamp: Date.now()
			},
			bubbles: true
		});
		this.dispatchEvent(event);
	}

	_dispatchAnswerSelected(value) {
		const event = new CustomEvent("answer-selected", {
			detail: {
				questionId: this._state.questionData?.id,
				value: value,
				questionType: this.getFieldType(),
				timestamp: Date.now()
			},
			bubbles: true
		});
		this.dispatchEvent(event);
	}

	dispatchValidationRequested(value) {
		const event = new CustomEvent("validation-requested", {
			detail: {
				questionId: this._state.questionData?.id,
				value: value || this.getValue(),
				questionType: this.getFieldType(),
				timestamp: Date.now()
			},
			bubbles: true
		});
		this.dispatchEvent(event);
	}

	// Backward compatibility
	dispatchAnswerChanged(value) {
		this._dispatchAnswerChanged(value);
	}
	dispatchAnswerSelected(value) {
		this._dispatchAnswerSelected(value);
	}

	// ===============================
	// UTILITY METHODS
	// ===============================

	_hasVisualError() {
		const errorElement = this._getElement(".quiz-error-text");
		const hasErrorMessage = errorElement?.classList.contains("quiz-error-visible") || false;

		const input = this.getInputElement();
		const hasFieldError = input?.classList.contains("quiz-input-error") || input?.classList.contains("quiz-select-error") || false;

		return hasErrorMessage || hasFieldError;
	}

	_clearVisualErrorState() {
		const errorElement = this._getElement(".quiz-error-text");
		if (errorElement) {
			errorElement.classList.remove("quiz-error-visible");
			errorElement.classList.add("quiz-error-hidden");
			errorElement.textContent = "";
		}

		this._updateFieldErrorStyling();
	}

	_updateErrorState() {
		this._queueUpdate(() => {
			const errorElement = this._getElement(".quiz-error-text");

			if (errorElement) {
				if (this._state.showError) {
					errorElement.classList.remove("quiz-error-hidden");
					errorElement.classList.add("quiz-error-visible");
					errorElement.textContent = this._state.errorMessage;
				} else {
					errorElement.classList.remove("quiz-error-visible");
					errorElement.classList.add("quiz-error-hidden");
					errorElement.textContent = "";
				}
			}

			this._updateFieldErrorStyling();
		});
	}
}

export default QuizFormFieldBase;
