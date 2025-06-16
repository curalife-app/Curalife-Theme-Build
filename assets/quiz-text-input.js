/**
 * Quiz Text Input Component - Refactored
 * Extends QuizFormFieldBase for common form field functionality
 */
import { QuizFormFieldBase } from "../base/quiz-form-field-base.js";
import { sharedStyles } from "../utils/shared-styles.js";

export class QuizTextInputComponent extends QuizFormFieldBase {
	constructor() {
		super();
		this.inputType = "text";
	}

	static get observedAttributes() {
		return [...super.observedAttributes, "input-type"];
	}

	initialize() {
		this.parseAttributes();
	}

	parseAttributes() {
		this.parseCommonAttributes();
		this.inputType = this.getAttribute("input-type") || "text";
	}

	handleAttributeChange(name, oldValue, newValue) {
		// Handle common attributes
		this.handleCommonAttributeChange(name, oldValue, newValue);

		// Handle component-specific attributes
		switch (name) {
			case "input-type":
				this.inputType = newValue || "text";
				this.updateInputType();
				break;
		}
	}

	getFieldType() {
		return "text";
	}

	getValue() {
		return this.currentValue;
	}

	setValue(value) {
		this.currentValue = value || "";
		this.setAttribute("value", this.currentValue);
		this.updateInputValue();
	}

	getInputElement() {
		return this.root.querySelector(".quiz-input");
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
		const placeholder = this.questionData.placeholder || "Enter your answer";

		return `
			<div class="quiz-text-input-container">
				<input
					type="${this.inputType}"
					id="question-${questionId}"
					class="quiz-input ${this.showError ? "quiz-input-error" : ""}"
					placeholder="${placeholder}"
					value="${this.currentValue}"
					${this.isDisabled ? "disabled" : ""}
					aria-describedby="error-${questionId}"
				>
				${this.getErrorElementHTML(questionId)}
			</div>
		`;
	}

	async render() {
		await this.renderTemplate();
		this.setupEventListeners();
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
				padding: 13px 16px;
				border: 1px solid #DDEEE2;
				border-radius: 10px;
				background: white;
				font-size: 18px;
				color: var(--quiz-text-primary);
				transition: var(--quiz-transition);
			}

			.quiz-input:focus {
				outline: none;
				box-shadow: 0 0 0 2px var(--quiz-primary);
			}

			.quiz-input:hover:not(:disabled) {
				border-color: #DDEEE2;
			}

			.quiz-input::placeholder {
				color: #b0b0b0;
			}

			/* Error state */
			.quiz-input-error {
				border-color: #ad0000;
			}

			.quiz-input-error:focus {
				box-shadow: 0 0 0 2px #ad0000;
			}

			/* Valid state */
			.quiz-input-valid {
				border-color: var(--quiz-success);
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

			/* Mobile responsiveness */
			@media (max-width: 768px) {
				.quiz-input {
					font-size: 16px; /* Prevents zoom on iOS */
				}
			}
		`;
	}

	setupEventListeners() {
		const input = this.getInputElement();
		if (input) {
			input.addEventListener("input", this.handleInputEvent.bind(this));
			input.addEventListener("blur", this.handleBlurEvent.bind(this));
			input.addEventListener("focus", this.handleFocusEvent.bind(this));
		}
	}

	handleInputEvent(event) {
		if (this.isDisabled) return;

		const newValue = event.target.value;
		this.handleInputChange(newValue);
	}

	handleBlurEvent(event) {
		if (this.isDisabled) return;
		this.handleInputBlur();
	}

	handleFocusEvent(event) {
		// Clear error state when input gains focus
		if (this.showError || this.hasVisualError()) {
			this.clearError();
		}
	}

	updateInputValue() {
		const input = this.getInputElement();
		if (input) {
			input.value = this.currentValue;
		}
	}

	updateInputType() {
		const input = this.getInputElement();
		if (input) {
			input.type = this.inputType;
		}
	}

	updateDisabledState() {
		const input = this.getInputElement();
		if (input) {
			input.disabled = this.isDisabled;
		}
	}

	updateFieldErrorStyling() {
		const input = this.getInputElement();
		if (input) {
			if (this.showError) {
				input.classList.add("quiz-input-error");
				input.classList.remove("quiz-input-valid");
			} else {
				input.classList.remove("quiz-input-error");
			}
		}
	}

	clearVisualErrorState() {
		super.clearVisualErrorState();

		const input = this.getInputElement();
		if (input) {
			input.classList.remove("quiz-input-error");
			input.classList.remove("quiz-input-valid");
		}
	}

	// Additional methods for compatibility
	setInputType(type) {
		this.inputType = type;
		this.setAttribute("input-type", type);
	}

	isEmpty() {
		return !this.currentValue || this.currentValue.trim() === "";
	}

	showValidState() {
		const input = this.getInputElement();
		if (input) {
			input.classList.add("quiz-input-valid");
			input.classList.remove("quiz-input-error");
		}
	}

	clearValidState() {
		const input = this.getInputElement();
		if (input) {
			input.classList.remove("quiz-input-valid");
		}
	}

	select() {
		const input = this.getInputElement();
		if (input && input.select) {
			input.select();
		}
	}
}

// Register the component
if (!customElements.get("quiz-text-input")) {
	customElements.define("quiz-text-input", QuizTextInputComponent);
}

export default QuizTextInputComponent;
