/**
 * Quiz Rating Component
 *
 * A Web Component for rendering rating/range slider questions.
 * Replaces the renderRating method from quiz.js.
 *
 * Features:
 * - Range slider input (1-10 scale)
 * - Visual labels and indicators
 * - Real-time value display
 * - Custom events for rating changes
 * - Accessible keyboard navigation
 *
 * Attributes:
 * - question-data: JSON string containing question configuration
 * - value: Current rating value (1-10)
 * - disabled: Whether the component is disabled
 * - min-value: Minimum rating value (default: 1)
 * - max-value: Maximum rating value (default: 10)
 * - step: Step increment (default: 1)
 *
 * Events:
 * - answer-changed: Fired when rating value changes
 * - answer-selected: Fired when rating is set (for compatibility)
 */

import { QuizBaseComponent } from "../base/quiz-base-component.js";
import sharedStyles from "../utils/shared-styles.js";

export class QuizRatingComponent extends QuizBaseComponent {
	static get observedAttributes() {
		return ["question-data", "value", "disabled", "min-value", "max-value", "step"];
	}

	constructor() {
		super();
		this.questionData = null;
		this.ratingValue = 5; // Default middle value
		this.isDisabled = false;
		this.minValue = 1;
		this.maxValue = 10;
		this.step = 1;
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
				console.error("Quiz Rating: Invalid question-data JSON:", error);
				this.questionData = null;
			}
		}

		// Parse rating value
		this.ratingValue = this.getNumberAttribute("value", 5);

		// Parse disabled state
		this.isDisabled = this.getBooleanAttribute("disabled", false);

		// Parse range configuration
		this.minValue = this.getNumberAttribute("min-value", 1);
		this.maxValue = this.getNumberAttribute("max-value", 10);
		this.step = this.getNumberAttribute("step", 1);

		// Ensure rating value is within bounds
		this.ratingValue = Math.max(this.minValue, Math.min(this.maxValue, this.ratingValue));
	}

	handleAttributeChange(name, oldValue, newValue) {
		switch (name) {
			case "question-data":
				this.parseAttributes();
				break;
			case "value":
				this.ratingValue = this.getNumberAttribute("value", 5);
				this.ratingValue = Math.max(this.minValue, Math.min(this.maxValue, this.ratingValue));
				this.updateRatingValue();
				break;
			case "disabled":
				this.isDisabled = this.getBooleanAttribute("disabled", false);
				this.updateDisabledState();
				break;
			case "min-value":
			case "max-value":
			case "step":
				this.parseAttributes();
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

		return `
			<div class="quiz-rating-container">
				<div class="quiz-rating-input-wrapper">
					<input
						type="range"
						id="question-${questionId}"
						class="quiz-range"
						min="${this.minValue}"
						max="${this.maxValue}"
						step="${this.step}"
						value="${this.ratingValue}"
						${this.isDisabled ? "disabled" : ""}
					>
					<div class="quiz-rating-value" aria-live="polite">
						<span class="quiz-rating-current">${this.ratingValue}</span>
					</div>
				</div>
				<div class="quiz-range-labels">
					<span class="quiz-range-label-min">${this.minValue}</span>
					<span class="quiz-range-label-mid">${Math.floor((this.minValue + this.maxValue) / 2)}</span>
					<span class="quiz-range-label-max">${this.maxValue}</span>
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
			.quiz-rating-container {
				padding: 1rem 0;
			}

			.quiz-rating-input-wrapper {
				position: relative;
				margin-bottom: 1rem;
			}

			.quiz-range {
				width: 100%;
				height: 8px;
				border-radius: 4px;
				background: #e2e8f0;
				outline: none;
				appearance: none;
				cursor: pointer;
				transition: var(--quiz-transition);
			}

			.quiz-range:focus {
				box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
			}

			/* Webkit browsers (Chrome, Safari) */
			.quiz-range::-webkit-slider-thumb {
				appearance: none;
				width: 24px;
				height: 24px;
				border-radius: 50%;
				background: var(--quiz-primary-color);
				cursor: pointer;
				border: 2px solid white;
				box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
				transition: var(--quiz-transition);
			}

			.quiz-range::-webkit-slider-thumb:hover {
				transform: scale(1.1);
				box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
			}

			.quiz-range::-webkit-slider-thumb:active {
				transform: scale(1.2);
			}

			/* Firefox */
			.quiz-range::-moz-range-thumb {
				width: 24px;
				height: 24px;
				border-radius: 50%;
				background: var(--quiz-primary-color);
				cursor: pointer;
				border: 2px solid white;
				box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
				transition: var(--quiz-transition);
			}

			.quiz-range::-moz-range-thumb:hover {
				transform: scale(1.1);
				box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
			}

			.quiz-range::-moz-range-track {
				height: 8px;
				border-radius: 4px;
				background: #e2e8f0;
				border: none;
			}

			/* Rating value display */
			.quiz-rating-value {
				position: absolute;
				top: -2.5rem;
				left: 50%;
				transform: translateX(-50%);
				background: var(--quiz-primary-color);
				color: white;
				padding: 0.5rem 0.75rem;
				border-radius: var(--quiz-border-radius);
				font-weight: 600;
				font-size: 1.125rem;
				box-shadow: var(--quiz-shadow);
				pointer-events: none;
			}

			.quiz-rating-value::after {
				content: '';
				position: absolute;
				top: 100%;
				left: 50%;
				transform: translateX(-50%);
				border: 6px solid transparent;
				border-top-color: var(--quiz-primary-color);
			}

			.quiz-rating-current {
				display: block;
				min-width: 1.5rem;
				text-align: center;
			}

			/* Range labels */
			.quiz-range-labels {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-top: 0.5rem;
				font-size: 0.875rem;
				color: #6b7280;
			}

			.quiz-range-label-min,
			.quiz-range-label-max {
				font-weight: 500;
			}

			.quiz-range-label-mid {
				color: #9ca3af;
			}

			/* Disabled state */
			.quiz-range:disabled {
				cursor: not-allowed;
				opacity: 0.6;
			}

			.quiz-range:disabled::-webkit-slider-thumb {
				cursor: not-allowed;
				background: #9ca3af;
			}

			.quiz-range:disabled::-moz-range-thumb {
				cursor: not-allowed;
				background: #9ca3af;
			}

			:host([disabled]) .quiz-rating-value {
				background: #9ca3af;
			}

			:host([disabled]) .quiz-rating-value::after {
				border-top-color: #9ca3af;
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
				.quiz-rating-value {
					font-size: 1rem;
					padding: 0.375rem 0.625rem;
				}

				.quiz-range::-webkit-slider-thumb {
					width: 20px;
					height: 20px;
				}

				.quiz-range::-moz-range-thumb {
					width: 20px;
					height: 20px;
				}
			}

			/* Animation for value changes */
			.quiz-rating-value {
				transition: all 0.2s ease;
			}

			.quiz-rating-value.updating {
				transform: translateX(-50%) scale(1.1);
			}
		`;
	}

	setupEventListeners() {
		// Handle rating changes
		this.root.addEventListener("input", this.handleRatingChange.bind(this));
		this.root.addEventListener("change", this.handleRatingSet.bind(this));
	}

	handleRatingChange(event) {
		if (this.isDisabled) return;

		const range = event.target;
		if (range.classList.contains("quiz-range")) {
			const newValue = parseInt(range.value, 10);
			this.ratingValue = newValue;
			this.updateRatingDisplay();
			this.dispatchAnswerChanged(newValue);
		}
	}

	handleRatingSet(event) {
		if (this.isDisabled) return;

		const range = event.target;
		if (range.classList.contains("quiz-range")) {
			const newValue = parseInt(range.value, 10);
			this.ratingValue = newValue;
			this.dispatchAnswerSelected(newValue);
		}
	}

	updateRatingValue() {
		const range = this.root.querySelector(".quiz-range");
		if (range) {
			range.value = this.ratingValue;
		}
		this.updateRatingDisplay();
	}

	updateRatingDisplay() {
		const valueDisplay = this.root.querySelector(".quiz-rating-current");
		if (valueDisplay) {
			valueDisplay.textContent = this.ratingValue;

			// Add brief animation
			const valueContainer = this.root.querySelector(".quiz-rating-value");
			if (valueContainer) {
				valueContainer.classList.add("updating");
				setTimeout(() => {
					valueContainer.classList.remove("updating");
				}, 200);
			}
		}
	}

	updateDisabledState() {
		const range = this.root.querySelector(".quiz-range");
		if (range) {
			range.disabled = this.isDisabled;
		}
	}

	dispatchAnswerChanged(value) {
		const event = new CustomEvent("answer-changed", {
			detail: {
				questionId: this.questionData?.id,
				value: value,
				questionType: "rating"
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
				questionType: "rating"
			},
			bubbles: true
		});
		this.dispatchEvent(event);
	}

	// Public API methods
	getValue() {
		return this.ratingValue;
	}

	setValue(value) {
		const numValue = parseInt(value, 10);
		if (!isNaN(numValue)) {
			this.ratingValue = Math.max(this.minValue, Math.min(this.maxValue, numValue));
			this.setAttribute("value", this.ratingValue.toString());
		}
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

	setRange(min, max, step = 1) {
		this.minValue = min;
		this.maxValue = max;
		this.step = step;
		this.setAttribute("min-value", min.toString());
		this.setAttribute("max-value", max.toString());
		this.setAttribute("step", step.toString());

		// Ensure current value is within new bounds
		this.ratingValue = Math.max(this.minValue, Math.min(this.maxValue, this.ratingValue));
		this.setAttribute("value", this.ratingValue.toString());
	}

	// Focus management
	focus() {
		const range = this.root.querySelector(".quiz-range");
		if (range) {
			range.focus();
		}
	}
}

// Register the component
if (!customElements.get("quiz-rating")) {
	customElements.define("quiz-rating", QuizRatingComponent);
}

export default QuizRatingComponent;
