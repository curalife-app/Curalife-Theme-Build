/**
 * Quiz Step Container Component
 *
 * Replaces _generateStepHTML(), _generateStepInfoHTML(), and _generateWizardStepHTML() methods from quiz.js
 * Handles complete step rendering including info sections and question content
 */

import { QuizBaseComponent } from "../base/quiz-base-component.js";

export class QuizStepContainer extends QuizBaseComponent {
	static get observedAttributes() {
		return ["step-data", "responses", "current-question-index", "is-form-step", "validation-errors"];
	}

	getTemplate() {
		const stepData = this.getStepData();
		const responses = this.getResponses();
		const currentQuestionIndex = parseInt(this.getAttribute("current-question-index") || "0");
		const isFormStep = this.getAttribute("is-form-step") === "true";
		const validationErrors = this.getValidationErrors();

		if (!stepData) {
			return '<p class="quiz-error-text">Step configuration error. Please contact support.</p>';
		}

		return `
			<div class="animate-fade-in">
				${this.renderStepInfo(stepData)}
				${
					stepData.questions?.length > 0
						? isFormStep
							? this.renderFormStep(stepData, responses, validationErrors)
							: this.renderWizardStep(stepData, responses, currentQuestionIndex)
						: !stepData.info
							? '<p class="quiz-error-text">Step configuration error. Please contact support.</p>'
							: ""
				}
			</div>
		`;
	}

	getStyles() {
		return `
			${super.getStyles()}

			.animate-fade-in {
				animation: fadeIn 0.3s ease-in-out;
			}

			@keyframes fadeIn {
				from { opacity: 0; transform: translateY(10px); }
				to { opacity: 1; transform: translateY(0); }
			}

			.quiz-title {
				font-family: "PP Radio Grotesk", sans-serif;
				font-size: 28px;
				font-weight: 700;
				line-height: 1.2;
				color: #121212;
				margin: 0 0 16px 0;
			}

			.quiz-text {
				font-size: 16px;
				line-height: 1.5;
				color: #333;
				margin: 0 0 12px 0;
			}

			.quiz-subtext {
				font-size: 14px;
				line-height: 1.4;
				color: #666;
				margin: 0 0 24px 0;
			}

			.quiz-heading {
				font-family: "PP Radio Grotesk", sans-serif;
				font-size: 20px;
				font-weight: 600;
				line-height: 1.3;
				color: #121212;
				margin: 0 0 16px 0;
			}

			.quiz-text-sm {
				font-size: 14px;
				line-height: 1.4;
				color: #666;
				margin: 0 0 8px 0;
			}

			.quiz-divider {
				border-top: 1px solid #e5e5e5;
				padding-top: 24px;
				margin-top: 24px;
			}

			.quiz-error-text {
				color: var(--quiz-error-color);
				text-align: center;
				padding: 16px;
				background-color: #fef2f2;
				border-radius: var(--quiz-border-radius);
				border: 1px solid #fecaca;
			}

			@media (max-width: 768px) {
				.quiz-title {
					font-size: 24px;
				}

				.quiz-heading {
					font-size: 18px;
				}
			}
		`;
	}

	render() {
		this.renderTemplate();
		this.attachEventListeners();
	}

	attachEventListeners() {
		// Listen for form submissions from child components
		this.addEventListener("form-submit", e => {
			this.dispatchEvent(
				new CustomEvent("step-form-submit", {
					detail: e.detail,
					bubbles: true
				})
			);
		});

		// Listen for question answers from child components
		this.addEventListener("question-answer", e => {
			this.dispatchEvent(
				new CustomEvent("step-question-answer", {
					detail: e.detail,
					bubbles: true
				})
			);
		});
	}

	renderStepInfo(stepData) {
		if (!stepData.info) return "";

		return `
			<div class="quiz-step-info">
				<h3 class="quiz-title">${stepData.info.heading}</h3>
				<p class="quiz-text">${stepData.info.text}</p>
				${stepData.info.subtext ? `<p class="quiz-subtext">${stepData.info.subtext}</p>` : ""}
			</div>
		`;
	}

	renderFormStep(stepData, responses, validationErrors) {
		// Use the quiz-form-step Web Component
		const formStep = document.createElement("quiz-form-step");
		formStep.setAttribute("step-data", JSON.stringify(stepData));
		formStep.setAttribute("responses", JSON.stringify(responses));
		formStep.setAttribute("validation-errors", JSON.stringify(validationErrors));

		// Check if this is the last step (would need to be passed from parent)
		const isLastStep = this.getAttribute("is-last-step") === "true";
		if (isLastStep) {
			formStep.setAttribute("is-last-step", "true");
		}

		return formStep.outerHTML;
	}

	renderWizardStep(stepData, responses, currentQuestionIndex) {
		const question = stepData.questions[currentQuestionIndex];
		const response = responses?.find(r => r.questionId === question?.id) || { answer: null };

		if (!question) {
			return '<p class="quiz-error-text">Question not found. Please try again.</p>';
		}

		let html = "";

		if (!stepData.info) {
			// No step info, show question as main title
			html += `
				<div class="quiz-question-header">
					<h3 class="quiz-title">${question.text}</h3>
					${question.helpText ? `<p class="quiz-text">${question.helpText}</p>` : ""}
				</div>
			`;
		} else {
			// Step info exists, show question as sub-heading
			html += `
				<div class="quiz-divider">
					<h4 class="quiz-heading">${question.text}</h4>
					${question.helpText ? `<p class="quiz-text-sm">${question.helpText}</p>` : ""}
				</div>
			`;
		}

		// Render the question input using appropriate component
		html += this.renderQuestionByType(question, response);

		return html;
	}

	renderQuestionByType(question, response) {
		// This would delegate to specific question input components
		// For now, simplified implementation
		const value = response?.answer || "";

		switch (question.type) {
			case "multiple-choice":
				return this.renderMultipleChoice(question, value);
			case "checkbox":
				return this.renderCheckbox(question, value);
			case "dropdown":
				return this.renderDropdown(question, value);
			case "text":
			case "email":
			case "phone":
				return this.renderTextInput(question, value);
			case "textarea":
				return this.renderTextarea(question, value);
			case "rating":
				return this.renderRating(question, value);
			case "date":
				return this.renderDateInput(question, value);
			case "payer-search":
				return this.renderPayerSearch(question, value);
			default:
				return `<p class="quiz-error-text">Unsupported question type: ${question.type}</p>`;
		}
	}

	renderMultipleChoice(question, selectedValue) {
		if (!question.options) return "";

		return `
			<div class="quiz-multiple-choice">
				${question.options
					.map(
						option => `
					<label class="quiz-option-card ${selectedValue === option.value ? "selected" : ""}">
						<input type="radio" name="question-${question.id}" value="${option.value}"
							   ${selectedValue === option.value ? "checked" : ""} class="quiz-radio-input">
						<div class="quiz-option-content">
							<span class="quiz-option-text">${option.text}</span>
							${option.description ? `<span class="quiz-option-description">${option.description}</span>` : ""}
						</div>
					</label>
				`
					)
					.join("")}
			</div>
		`;
	}

	renderCheckbox(question, selectedValues) {
		if (!question.options) return "";

		const selected = Array.isArray(selectedValues) ? selectedValues : selectedValues ? [selectedValues] : [];

		return `
			<div class="quiz-checkbox-group">
				${question.options
					.map(
						option => `
					<label class="quiz-option-card ${selected.includes(option.value) ? "selected" : ""}">
						<input type="checkbox" name="question-${question.id}" value="${option.value}"
							   ${selected.includes(option.value) ? "checked" : ""} class="quiz-checkbox-input">
						<div class="quiz-option-content">
							<span class="quiz-option-text">${option.text}</span>
							${option.description ? `<span class="quiz-option-description">${option.description}</span>` : ""}
						</div>
					</label>
				`
					)
					.join("")}
			</div>
		`;
	}

	renderDropdown(question, selectedValue) {
		if (!question.options) return "";

		return `
			<select id="question-${question.id}" class="quiz-dropdown">
				<option value="">${question.placeholder || "Select an option"}</option>
				${question.options
					.map(
						option => `
					<option value="${option.value}" ${selectedValue === option.value ? "selected" : ""}>
						${option.text}
					</option>
				`
					)
					.join("")}
			</select>
		`;
	}

	renderTextInput(question, value) {
		return `
			<input type="${question.type || "text"}"
				   id="question-${question.id}"
				   class="quiz-input"
				   value="${value}"
				   placeholder="${question.placeholder || ""}"
				   ${question.required ? "required" : ""}>
		`;
	}

	renderTextarea(question, value) {
		return `
			<textarea id="question-${question.id}"
					  class="quiz-textarea"
					  placeholder="${question.placeholder || ""}"
					  ${question.required ? "required" : ""}>${value}</textarea>
		`;
	}

	renderRating(question, value) {
		const maxRating = question.maxRating || 5;
		const currentRating = parseInt(value) || 0;

		return `
			<div class="quiz-rating">
				${Array.from({ length: maxRating }, (_, i) => i + 1)
					.map(
						rating => `
					<button type="button" class="quiz-rating-star ${rating <= currentRating ? "selected" : ""}"
							data-rating="${rating}">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
							<path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
								  fill="${rating <= currentRating ? "#fbbf24" : "#e5e7eb"}"
								  stroke="#d1d5db" stroke-width="1"/>
						</svg>
					</button>
				`
					)
					.join("")}
			</div>
		`;
	}

	renderDateInput(question, value) {
		return `
			<input type="date"
				   id="question-${question.id}"
				   class="quiz-input"
				   value="${value}"
				   ${question.required ? "required" : ""}>
		`;
	}

	renderPayerSearch(question, value) {
		// Use the existing quiz-payer-search Web Component
		const payerSearch = document.createElement("quiz-payer-search");
		payerSearch.setAttribute("question-id", question.id);

		if (question.commonPayers) {
			payerSearch.setAttribute("common-payers", JSON.stringify(question.commonPayers));
		}

		if (value) {
			payerSearch.setAttribute("selected-payer", value);
		}

		return payerSearch.outerHTML;
	}

	// Utility methods
	getStepData() {
		try {
			const stepDataAttr = this.getAttribute("step-data");
			return stepDataAttr ? JSON.parse(stepDataAttr) : null;
		} catch (error) {
			console.error("Error parsing step data:", error);
			return null;
		}
	}

	getResponses() {
		try {
			const responsesAttr = this.getAttribute("responses");
			return responsesAttr ? JSON.parse(responsesAttr) : [];
		} catch (error) {
			console.error("Error parsing responses:", error);
			return [];
		}
	}

	getValidationErrors() {
		try {
			const errorsAttr = this.getAttribute("validation-errors");
			return errorsAttr ? JSON.parse(errorsAttr) : [];
		} catch (error) {
			console.error("Error parsing validation errors:", error);
			return [];
		}
	}

	handleAttributeChange(name, oldValue, newValue) {
		if (["step-data", "responses", "current-question-index", "is-form-step", "validation-errors"].includes(name)) {
			this.render();
		}
	}
}

// Register the component
customElements.define("quiz-step-container", QuizStepContainer);
