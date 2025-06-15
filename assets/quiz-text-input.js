/**
 * Quiz Text Input Component
 *
 * A Web Component for rendering text input questions.
 * Replaces the renderTextInput method from quiz.js.
 *
 * Features:
 * - Standard HTML text input
 * - Placeholder support
 * - Validation error display
 * - Real-time validation feedback
 * - Custom events for answer changes
 *
 * Attributes:
 * - question-data: JSON string containing question configuration
 * - value: Current input value
 * - disabled: Whether the component is disabled
 * - show-error: Whether to show validation error
 * - error-message: Custom error message to display
 * - input-type: Type of input (text, email, tel, etc.)
 *
 * Events:
 * - answer-changed: Fired when input value changes
 * - answer-selected: Fired when input loses focus (for compatibility)
 */

import { QuizBaseComponent } from "../base/quiz-base-component.js";
import sharedStyles from "../utils/shared-styles.js";

export class QuizTextInputComponent extends QuizBaseComponent {
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
		// Parse question data
		const questionDataAttr = this.getAttribute("question-data");
		if (questionDataAttr) {
			try {
				this.questionData = JSON.parse(questionDataAttr);
			} catch (error) {
				console.error("Quiz Text Input: Invalid question-data JSON:", error);
				this.questionData = null;
			}
		}

		// Parse input value
		this.inputValue = this.getAttribute("value") || "";

		// Parse disabled state
		this.isDisabled = this.getBooleanAttribute("disabled", false);

		// Parse error state
		this.showError = this.getBooleanAttribute("show-error", false);
		this.errorMessage = this.getAttribute("error-message") || "";

		// Parse input type
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
				<p id="error-${questionId}" class="quiz-error-text ${this.showError ? "quiz-error-visible" : "quiz-error-hidden"}">${this.errorMessage}</p>
			</div>
		`;
	}

	async render() {
		await this.renderTemplate();
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
				border: 1px solid #ddeee2;
				border-radius: 10px;
				background: white;
				font-size: 18px;
				color: #374151;
				transition: var(--quiz-transition);
				box-sizing: border-box;
			}

			.quiz-input:focus {
				outline: none;
				box-shadow: 0 0 0 2px var(--quiz-primary);
			}

			.quiz-input:hover:not(:disabled) {
				border-color: #ddeee2;
			}

			.quiz-input::placeholder {
				color: #9ca3af;
			}

			/* Error state */
			.quiz-input-error {
				border-color: #ad0000;
			}

			.quiz-input-error:focus {
				box-shadow: 0 0 0 2px #ad0000;
			}

			/* Error message - using global styling */
			.quiz-error-element {
				/* Styling handled by global .quiz-error-text class */
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
		// Handle input changes
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

			// Clear error state when user starts typing
			if (this.showError && newValue.trim()) {
				this.clearError();
			}
		}
	}

	handleInputBlur(event) {
		if (this.isDisabled) return;

		const input = event.target;
		if (input.classList.contains("quiz-input")) {
			// Dispatch answer-selected for compatibility with existing quiz logic
			this.dispatchAnswerSelected(this.inputValue);

			// Dispatch validation event for blur validation
			this.dispatchValidationRequested(this.inputValue);
		}
	}

	handleInputFocus(event) {
		// Clear error state when input gains focus
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
		const errorElement = this.root.querySelector(".quiz-error-text");

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
		const errorElement = this.root.querySelector(".quiz-error-text");
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
				value: value,
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
				value: value,
				questionType: "text"
			},
			bubbles: true
		});
		this.dispatchEvent(event);
	}

	dispatchValidationRequested(value) {
		const event = new CustomEvent("validation-requested", {
			detail: {
				questionId: this.questionData?.id,
				value: value,
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

// Register the component
if (!customElements.get("quiz-text-input")) {
	customElements.define("quiz-text-input", QuizTextInputComponent);
}

export default QuizTextInputComponent;
