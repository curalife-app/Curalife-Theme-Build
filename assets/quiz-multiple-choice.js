/**
 * Quiz Multiple Choice Component
 *
 * A Web Component for rendering multiple choice questions with card-style options.
 * Replaces the renderMultipleChoice method from quiz.js.
 *
 * Features:
 * - Card-style option display
 * - Single selection (radio button behavior)
 * - Visual feedback for selected state
 * - Accessible keyboard navigation
 * - Custom events for answer selection
 *
 * Attributes:
 * - question-data: JSON string containing question configuration
 * - selected-value: Currently selected option ID
 * - disabled: Whether the component is disabled
 *
 * Events:
 * - answer-selected: Fired when an option is selected
 */

import { QuizBaseComponent } from "../base/quiz-base-component.js";
import sharedStyles from "../utils/shared-styles.js";

export class QuizMultipleChoiceComponent extends QuizBaseComponent {
	static get observedAttributes() {
		return ["question-data", "selected-value", "disabled"];
	}

	constructor() {
		super();
		this.questionData = null;
		this.selectedValue = null;
		this.isDisabled = false;
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
				console.error("Quiz Multiple Choice: Invalid question-data JSON:", error);
				this.questionData = null;
			}
		}

		// Parse selected value
		this.selectedValue = this.getAttribute("selected-value") || null;

		// Parse disabled state
		this.isDisabled = this.getBooleanAttribute("disabled", false);
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

		const options = this.questionData.options;
		const questionId = this.questionData.id;

		const optionsHTML = options
			.map(
				option => `
			<label for="${option.id}" class="quiz-option-card" data-option-id="${option.id}">
				<input
					type="radio"
					id="${option.id}"
					name="question-${questionId}"
					value="${option.id}"
					class="quiz-sr-only"
					${this.selectedValue === option.id ? "checked" : ""}
					${this.isDisabled ? "disabled" : ""}
				>
				<div class="quiz-option-button ${this.selectedValue === option.id ? "selected" : ""}">
					<div class="quiz-option-text">
						<div class="quiz-option-text-content">${option.text}</div>
					</div>
					${this.selectedValue === option.id ? this.getCheckmarkSVG() : ""}
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

	getCheckmarkSVG() {
		return `
			<svg class="quiz-checkmark" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		`;
	}

	render() {
		this.renderTemplate();
	}

	async getStyles() {
		const baseStyles = super.getStyles();
		const quizStyles = await sharedStyles.getQuizStyles();

		return `
			${baseStyles}
			${quizStyles}

			/* Component-specific styles */
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

			.quiz-checkmark {
				color: var(--quiz-primary-color);
				flex-shrink: 0;
				margin-left: 0.5rem;
			}

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
		if (input.type === "radio") {
			const selectedValue = input.value;
			this.selectedValue = selectedValue;
			this.updateSelectedState();
			this.dispatchAnswerSelected(selectedValue);
		}
	}

	handleOptionClick(event) {
		if (this.isDisabled) return;

		// Handle clicks on the label/card area
		const label = event.target.closest(".quiz-option-card");
		if (label) {
			const optionId = label.getAttribute("data-option-id");
			const input = label.querySelector("input[type='radio']");

			if (input && !input.checked) {
				input.checked = true;
				this.selectedValue = optionId;
				this.updateSelectedState();
				this.dispatchAnswerSelected(optionId);
			}
		}
	}

	updateSelectedState() {
		// Update visual state of all options
		const labels = this.root.querySelectorAll(".quiz-option-card");
		labels.forEach(label => {
			const optionId = label.getAttribute("data-option-id");
			const button = label.querySelector(".quiz-option-button");
			const input = label.querySelector("input[type='radio']");

			if (optionId === this.selectedValue) {
				button.classList.add("selected");
				input.checked = true;
				// Add checkmark if not present
				if (!button.querySelector(".quiz-checkmark")) {
					const textDiv = button.querySelector(".quiz-option-text");
					textDiv.insertAdjacentHTML("afterend", this.getCheckmarkSVG());
				}
			} else {
				button.classList.remove("selected");
				input.checked = false;
				// Remove checkmark if present
				const checkmark = button.querySelector(".quiz-checkmark");
				if (checkmark) {
					checkmark.remove();
				}
			}
		});
	}

	updateDisabledState() {
		const inputs = this.root.querySelectorAll("input[type='radio']");
		inputs.forEach(input => {
			input.disabled = this.isDisabled;
		});

		// Update aria-disabled on container
		const container = this.root.querySelector(".quiz-grid-2");
		if (container) {
			if (this.isDisabled) {
				container.setAttribute("aria-disabled", "true");
			} else {
				container.removeAttribute("aria-disabled");
			}
		}
	}

	dispatchAnswerSelected(value) {
		const event = new CustomEvent("answer-selected", {
			detail: {
				questionId: this.questionData?.id,
				value: value,
				questionType: "multiple-choice"
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
		this.setAttribute("selected-value", value);
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
}

// Register the component
if (!customElements.get("quiz-multiple-choice")) {
	customElements.define("quiz-multiple-choice", QuizMultipleChoiceComponent);
}

export default QuizMultipleChoiceComponent;
