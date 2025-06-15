/**
 * Quiz Checkbox Group Component
 *
 * A Web Component for rendering checkbox questions with multiple selection support.
 * Replaces the renderCheckbox method from quiz.js.
 *
 * Features:
 * - Multiple selection support
 * - Card-style and simple checkbox layouts
 * - Visual feedback for selected state
 * - Accessible keyboard navigation
 * - Custom events for answer selection
 *
 * Attributes:
 * - question-data: JSON string containing question configuration
 * - selected-values: JSON array of selected option IDs
 * - disabled: Whether the component is disabled
 * - layout: "cards" (default) or "simple" for different visual styles
 *
 * Events:
 * - answer-selected: Fired when options are selected/deselected
 */

import { QuizBaseComponent } from "../base/quiz-base-component.js";
import sharedStyles from "../utils/shared-styles.js";
import "../utils/quiz-checkmark.js";

export class QuizCheckboxGroupComponent extends QuizBaseComponent {
	static get observedAttributes() {
		return ["question-data", "selected-values", "disabled", "layout"];
	}

	constructor() {
		super();
		this.questionData = null;
		this.selectedValues = [];
		this.isDisabled = false;
		this.layout = "cards"; // "cards" or "simple"
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
				console.error("Quiz Checkbox Group: Invalid question-data JSON:", error);
				this.questionData = null;
			}
		}

		// Parse selected values
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

		// Parse disabled state
		this.isDisabled = this.getBooleanAttribute("disabled", false);

		// Parse layout
		this.layout = this.getAttribute("layout") || "cards";

		// Determine layout based on question ID (special case for consent)
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

		const optionsHTML = options
			.map(
				option => `
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
					${this.selectedValues.includes(option.id) ? '<quiz-checkmark animation="bounce"></quiz-checkmark>' : ""}
				</div>
			</label>
		`
			)
			.join("");

		return `
			<div class="quiz-grid-2" ${this.isDisabled ? 'aria-disabled="true"' : ""}>
				${optionsHTML}
			</div>
		`;
	}

	getSimpleTemplate() {
		const options = this.questionData.options;
		const questionId = this.questionData.id;

		const optionsHTML = options
			.map(
				option => `
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
			)
			.join("");

		return `
			<div class="quiz-space-y-3 quiz-spacing-container" ${this.isDisabled ? 'aria-disabled="true"' : ""}>
				${optionsHTML}
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

			quiz-checkmark {
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
		// Handle option selection
		this.root.addEventListener("change", this.handleOptionChange.bind(this));
		this.root.addEventListener("click", this.handleOptionClick.bind(this));
	}

	handleOptionChange(event) {
		if (this.isDisabled) return;

		const input = event.target;
		if (input.type === "checkbox") {
			const optionId = input.value;

			if (input.checked) {
				// Add to selected values if not already present
				if (!this.selectedValues.includes(optionId)) {
					this.selectedValues.push(optionId);
				}
			} else {
				// Remove from selected values
				this.selectedValues = this.selectedValues.filter(id => id !== optionId);
			}

			this.updateSelectedState();
			this.dispatchAnswerSelected(this.selectedValues);
		}
	}

	handleOptionClick(event) {
		if (this.isDisabled) return;

		// Handle clicks on the label/card area for card layout
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
						this.selectedValues = this.selectedValues.filter(id => id !== optionId);
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
		labels.forEach(label => {
			const optionId = label.getAttribute("data-option-id");
			const button = label.querySelector(".quiz-option-button");
			const input = label.querySelector("input[type='checkbox']");

			if (this.selectedValues.includes(optionId)) {
				button.classList.add("selected");
				input.checked = true;
				// Add checkmark if not present
				if (!button.querySelector("quiz-checkmark")) {
					const textDiv = button.querySelector(".quiz-option-text");
					const checkmark = document.createElement("quiz-checkmark");
					checkmark.setAttribute("animation", "bounce");
					textDiv.insertAdjacentElement("afterend", checkmark);
				}
			} else {
				button.classList.remove("selected");
				input.checked = false;
				// Remove checkmark with smooth animation
				const checkmark = button.querySelector("quiz-checkmark");
				if (checkmark) {
					checkmark.hide("bounce", () => {
						if (checkmark.parentNode) {
							checkmark.remove();
						}
					});
				}
			}
		});
	}

	updateSimpleSelectedState() {
		const inputs = this.root.querySelectorAll("input[type='checkbox']");
		inputs.forEach(input => {
			const optionId = input.value;
			input.checked = this.selectedValues.includes(optionId);
		});
	}

	updateDisabledState() {
		const inputs = this.root.querySelectorAll("input[type='checkbox']");
		inputs.forEach(input => {
			input.disabled = this.isDisabled;
		});

		// Update aria-disabled on container
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

// Register the component
if (!customElements.get("quiz-checkbox-group")) {
	customElements.define("quiz-checkbox-group", QuizCheckboxGroupComponent);
}

export default QuizCheckboxGroupComponent;
