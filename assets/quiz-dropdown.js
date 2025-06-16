/**
 * Quiz Dropdown Component - Refactored
 * Extends QuizFormFieldBase for common form field functionality
 */
import { QuizFormFieldBase } from "../base/quiz-form-field-base.js";
import { sharedStyles } from "../utils/shared-styles.js";

export class QuizDropdownComponent extends QuizFormFieldBase {
	constructor() {
		super();
		this.selectedValue = "";
	}

	static get observedAttributes() {
		return [...super.observedAttributes, "selected-value"];
	}

	initialize() {
		this.parseAttributes();
	}

	parseAttributes() {
		this.parseCommonAttributes();
		this.selectedValue = this.getAttribute("selected-value") || "";
		this.currentValue = this.selectedValue;
	}

	handleAttributeChange(name, oldValue, newValue) {
		// Handle common attributes
		this.handleCommonAttributeChange(name, oldValue, newValue);

		// Handle component-specific attributes
		switch (name) {
			case "selected-value":
				this.selectedValue = newValue || "";
				this.currentValue = this.selectedValue;
				this.updateSelectedState();
				break;
		}
	}

	getFieldType() {
		return "dropdown";
	}

	getValue() {
		return this.selectedValue;
	}

	setValue(value) {
		this.selectedValue = value || "";
		this.currentValue = this.selectedValue;
		this.setAttribute("selected-value", this.selectedValue);
		this.updateSelectedState();
	}

	getInputElement() {
		return this.root.querySelector(".quiz-select");
	}

	hasValidValue() {
		return this.selectedValue && this.selectedValue.trim() !== "";
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
				border-color: #ad0000;
			}

			.quiz-select-error:focus {
				box-shadow: 0 0 0 2px #ad0000;
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
		const select = this.getInputElement();
		if (select) {
			select.addEventListener("change", this.handleSelectionEvent.bind(this));
			select.addEventListener("blur", this.handleBlurEvent.bind(this));
		}
	}

	handleSelectionEvent(event) {
		if (this.isDisabled) return;

		const selectedValue = event.target.value;
		this.handleInputChange(selectedValue);
	}

	handleBlurEvent(event) {
		if (this.isDisabled) return;
		this.handleInputBlur();
	}

	updateSelectedState() {
		const select = this.getInputElement();
		if (select) {
			select.value = this.selectedValue || "";
		}
	}

	updateDisabledState() {
		const select = this.getInputElement();
		if (select) {
			select.disabled = this.isDisabled;
		}
	}

	updateFieldErrorStyling() {
		const select = this.getInputElement();
		if (select) {
			if (this.showError) {
				select.classList.add("quiz-select-error");
			} else {
				select.classList.remove("quiz-select-error");
			}
		}
	}

	clearVisualErrorState() {
		super.clearVisualErrorState();

		const select = this.getInputElement();
		if (select) {
			select.classList.remove("quiz-select-error");
		}
	}

	// Compatibility methods
	getSelectedValue() {
		return this.selectedValue;
	}

	setSelectedValue(value) {
		this.setValue(value);
	}
}

// Register the component
if (!customElements.get("quiz-dropdown")) {
	customElements.define("quiz-dropdown", QuizDropdownComponent);
}

export default QuizDropdownComponent;
