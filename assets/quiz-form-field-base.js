import { QuizBaseComponent } from "./quiz-base-component.js";

/**
 * Base class for all quiz form field components
 * Handles common functionality like error states, validation, and event dispatching
 */
export class QuizFormFieldBase extends QuizBaseComponent {
	constructor() {
		super();

		// Common form field properties
		this.showError = false;
		this.errorMessage = "";
		this.isDisabled = false;
		this.questionData = null;
		this.currentValue = "";
	}

	static get observedAttributes() {
		return [...super.observedAttributes, "question-data", "show-error", "error-message", "disabled", "value"];
	}

	/**
	 * Parse common form field attributes
	 */
	parseCommonAttributes() {
		this.showError = this.getBooleanAttribute("show-error", false);
		this.errorMessage = this.getAttribute("error-message") || "";
		this.isDisabled = this.getBooleanAttribute("disabled", false);

		// Parse question data
		try {
			const questionDataAttr = this.getAttribute("question-data");
			this.questionData = questionDataAttr ? JSON.parse(questionDataAttr) : null;
		} catch (error) {
			console.error("Invalid question data:", error);
			this.questionData = null;
		}
	}

	/**
	 * Handle common attribute changes
	 */
	handleCommonAttributeChange(name, oldValue, newValue) {
		switch (name) {
			case "question-data":
			case "show-error":
			case "error-message":
			case "disabled":
				this.parseCommonAttributes();
				this.updateErrorState();
				this.updateDisabledState();
				break;
			case "value":
				this.setValue(newValue);
				break;
		}
	}

	/**
	 * Get the current field value - to be implemented by subclasses
	 */
	getValue() {
		return this.currentValue;
	}

	/**
	 * Set the field value - to be implemented by subclasses
	 */
	setValue(value) {
		this.currentValue = value || "";
	}

	/**
	 * Check if the field has a valid value
	 */
	hasValidValue() {
		const value = this.getValue();
		return value && (typeof value !== "string" || value.trim() !== "");
	}

	/**
	 * Clear error state - handles both internal state and DOM
	 */
	clearError() {
		this.showError = false;
		this.errorMessage = "";
		this.removeAttribute("show-error");
		this.removeAttribute("error-message");

		// Force clear all visual error states
		this.clearVisualErrorState();
	}

	/**
	 * Clear visual error state from DOM - to be implemented by subclasses
	 */
	clearVisualErrorState() {
		const errorElement = this.root.querySelector(".quiz-error-text");
		if (errorElement) {
			errorElement.classList.remove("quiz-error-visible");
			errorElement.classList.add("quiz-error-hidden");
			errorElement.textContent = "";
		}
	}

	/**
	 * Check if field has visual error state in DOM
	 */
	hasVisualError() {
		const errorElement = this.root.querySelector(".quiz-error-text");
		return errorElement?.classList.contains("quiz-error-visible") || false;
	}

	/**
	 * Update error state in DOM
	 */
	updateErrorState() {
		const errorElement = this.root.querySelector(".quiz-error-text");

		if (errorElement) {
			if (this.showError) {
				errorElement.classList.remove("quiz-error-hidden");
				errorElement.classList.add("quiz-error-visible");
				errorElement.textContent = this.errorMessage;
			} else {
				errorElement.classList.remove("quiz-error-visible");
				errorElement.classList.add("quiz-error-hidden");
				errorElement.textContent = "";
			}
		}

		// Update field-specific error styling
		this.updateFieldErrorStyling();
	}

	/**
	 * Update field-specific error styling - to be implemented by subclasses
	 */
	updateFieldErrorStyling() {
		// Override in subclasses
	}

	/**
	 * Update disabled state - to be implemented by subclasses
	 */
	updateDisabledState() {
		// Override in subclasses
	}

	/**
	 * Handle user input change - checks for error clearing
	 */
	handleInputChange(newValue) {
		this.setValue(newValue);

		// Clear error if user provides valid input
		if ((this.showError || this.hasVisualError()) && this.hasValidValue()) {
			this.clearError();
		}

		// Dispatch events
		this.dispatchAnswerChanged(newValue);
	}

	/**
	 * Handle user input blur - triggers validation
	 */
	handleInputBlur() {
		const currentValue = this.getValue();

		// Dispatch answer selected for compatibility
		this.dispatchAnswerSelected(currentValue);

		// Dispatch validation with small delay to avoid race conditions
		setTimeout(() => {
			this.dispatchValidationRequested(currentValue);
		}, 10);
	}

	/**
	 * Dispatch answer changed event
	 */
	dispatchAnswerChanged(value) {
		const event = new CustomEvent("answer-changed", {
			detail: {
				questionId: this.questionData?.id,
				value: value,
				questionType: this.getFieldType()
			},
			bubbles: true
		});
		this.dispatchEvent(event);
	}

	/**
	 * Dispatch answer selected event
	 */
	dispatchAnswerSelected(value) {
		const event = new CustomEvent("answer-selected", {
			detail: {
				questionId: this.questionData?.id,
				value: value,
				questionType: this.getFieldType()
			},
			bubbles: true
		});
		this.dispatchEvent(event);
	}

	/**
	 * Dispatch validation requested event
	 */
	dispatchValidationRequested(value) {
		const event = new CustomEvent("validation-requested", {
			detail: {
				questionId: this.questionData?.id,
				value: value,
				questionType: this.getFieldType()
			},
			bubbles: true
		});
		this.dispatchEvent(event);
	}

	/**
	 * Get field type - to be implemented by subclasses
	 */
	getFieldType() {
		return "unknown";
	}

	/**
	 * Show validation error
	 */
	showValidationError(message) {
		this.errorMessage = message;
		this.showError = true;
		this.setAttribute("error-message", message);
		this.setAttribute("show-error", "");
		this.updateErrorState();
	}

	/**
	 * Get question data
	 */
	getQuestionData() {
		return this.questionData;
	}

	/**
	 * Set question data
	 */
	setQuestionData(data) {
		this.questionData = data;
		this.setAttribute("question-data", JSON.stringify(data));
	}

	/**
	 * Set disabled state
	 */
	setDisabled(disabled) {
		this.isDisabled = disabled;
		if (disabled) {
			this.setAttribute("disabled", "");
		} else {
			this.removeAttribute("disabled");
		}
		this.updateDisabledState();
	}

	/**
	 * Check if field is valid
	 */
	isValid() {
		return this.hasValidValue();
	}

	/**
	 * Focus the field
	 */
	focus() {
		const input = this.getInputElement();
		if (input && input.focus) {
			input.focus();
		}
	}

	/**
	 * Get the main input element - to be implemented by subclasses
	 */
	getInputElement() {
		return null;
	}

	/**
	 * Generate error element HTML
	 */
	getErrorElementHTML(questionId) {
		return `<p id="error-${questionId}" class="quiz-error-text ${this.showError ? "quiz-error-visible" : "quiz-error-hidden"}">${this.errorMessage}</p>`;
	}
}

export default QuizFormFieldBase;
