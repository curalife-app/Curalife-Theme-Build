/**
 * Quiz Dropdown Component
 *
 * A Web Component for rendering dropdown/select questions.
 * Replaces the renderDropdown method from quiz.js.
 *
 * Features:
 * - Standard HTML select element
 * - Placeholder support
 * - Validation error display
 * - Accessible keyboard navigation
 * - Custom events for answer selection
 *
 * Attributes:
 * - question-data: JSON string containing question configuration
 * - selected-value: Currently selected option ID
 * - disabled: Whether the component is disabled
 * - show-error: Whether to show validation error
 * - error-message: Custom error message to display
 *
 * Events:
 * - answer-selected: Fired when an option is selected
 */

import { QuizBaseComponent } from "../base/quiz-base-component.js";
import sharedStyles from "../utils/shared-styles.js";

export class QuizDropdownComponent extends QuizBaseComponent {
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
		// Parse question data
		const questionDataAttr = this.getAttribute("question-data");
		if (questionDataAttr) {
			try {
				this.questionData = JSON.parse(questionDataAttr);
			} catch (error) {
				console.error("Quiz Dropdown: Invalid question-data JSON:", error);
				this.questionData = null;
			}
		}

		// Parse selected value
		this.selectedValue = this.getAttribute("selected-value") || null;

		// Parse disabled state
		this.isDisabled = this.getBooleanAttribute("disabled", false);

		// Parse error state
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

		const optionsHTML = options
			.map(
				option => `
			<option value="${option.id}" ${this.selectedValue === option.id ? "selected" : ""}>
				${option.text}
			</option>
		`
			)
			.join("");

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
		// Handle option selection
		this.root.addEventListener("change", this.handleSelectionChange.bind(this));
	}

	handleSelectionChange(event) {
		if (this.isDisabled) return;

		const select = event.target;
		if (select.classList.contains("quiz-select")) {
			const selectedValue = select.value;
			this.selectedValue = selectedValue;
			this.dispatchAnswerSelected(selectedValue);

			// Clear error state when user makes a selection
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
				value: value,
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

// Register the component
if (!customElements.get("quiz-dropdown")) {
	customElements.define("quiz-dropdown", QuizDropdownComponent);
}

export default QuizDropdownComponent;
