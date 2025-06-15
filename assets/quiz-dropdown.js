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
			.quiz-dropdown-container {
				position: relative;
			}

			.quiz-select {
				width: 100%;
				padding: 13px 16px;
				border: 1px solid #DDEEE2;
				border-radius: 10px;
				background: white;
				font-size: 18px;
				color: #b0b0b0;
				transition: var(--quiz-transition);
				appearance: none;
				cursor: pointer;
				background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg width='12' height='7' viewBox='0 0 12 7' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1.03888 0.294581C1.42815 -0.0946914 2.05918 -0.0950353 2.44888 0.293813L5.62716 3.46517C6.01751 3.85467 6.64948 3.85467 7.03983 3.46517L10.2181 0.293812C10.6078 -0.0950355 11.2388 -0.0946913 11.6281 0.294581C12.0177 0.684154 12.0177 1.31578 11.6281 1.70535L7.0406 6.29286C6.65008 6.68338 6.01691 6.68338 5.62639 6.29286L1.03888 1.70535C0.649308 1.31578 0.649307 0.684154 1.03888 0.294581Z' fill='%23B0B0B0'/%3E%3C/svg%3E");
				background-position: right 16px center;
				background-repeat: no-repeat;
				background-size: 12px 7px;
				padding-right: 2.5rem;
			}

			.quiz-select:focus,
			.quiz-select:valid {
				outline: none;
				color: var(--quiz-text-primary);
				box-shadow: 0 0 0 2px var(--quiz-primary);
			}

			.quiz-select:hover:not(:disabled) {
				border-color: #DDEEE2;
			}

			/* Placeholder styling */
			.quiz-select option[value=""] {
				color: #b0b0b0;
			}

			.quiz-select option:not([value=""]) {
				color: #121212;
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
