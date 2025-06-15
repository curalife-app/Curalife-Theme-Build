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
		return `<div class="quiz-checkmark">
            <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M9.79158 18.75C4.84404 18.75 0.833252 14.7393 0.833252 9.79168C0.833252 4.84413 4.84404 0.833344 9.79158 0.833344C14.7392 0.833344 18.7499 4.84413 18.7499 9.79168C18.7499 14.7393 14.7392 18.75 9.79158 18.75ZM13.7651 7.82516C14.0598 7.47159 14.012 6.94613 13.6584 6.65148C13.3048 6.35685 12.7793 6.40462 12.4848 6.75818L8.90225 11.0572L7.04751 9.20243C6.72207 8.87701 6.19444 8.87701 5.86899 9.20243C5.54356 9.52784 5.54356 10.0555 5.86899 10.3809L8.369 12.8809C8.53458 13.0465 8.76208 13.1348 8.996 13.1242C9.22992 13.1135 9.44858 13.005 9.59842 12.8252L13.7651 7.82516Z" fill="#418865"/>
            </svg>
        </div>`;
	}

	async render() {
		await this.renderTemplate();
	}

	getStyles() {
		// Styles are now handled globally by quiz.css since we're using light DOM
		return "";
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
