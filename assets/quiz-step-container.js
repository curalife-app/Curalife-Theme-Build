/**
 * Quiz Step Container Component
 *
 * Replaces _generateStepHTML(), _generateStepInfoHTML(), and _generateWizardStepHTML() methods from quiz.js
 * Handles complete step rendering including info sections and question content
 */

import { QuizBaseComponent } from "../base/quiz-base-component.js";

export class QuizStepContainer extends QuizBaseComponent {
	static get observedAttributes() {
		return ["step-data", "responses", "current-question-index", "is-form-step", "validation-errors", "quiz-data"];
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

		// Pass quiz data for tooltip access
		const quizData = this.getQuizData();
		if (quizData) {
			formStep.setAttribute("quiz-data", JSON.stringify(quizData));
		}

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

		// Use the quiz-multiple-choice Web Component
		const questionData = JSON.stringify(question);
		return `<quiz-multiple-choice
			question-data='${questionData}'
			selected-value="${selectedValue || ""}"
		></quiz-multiple-choice>`;
	}

	renderCheckbox(question, selectedValues) {
		if (!question.options) return "";

		// Use the quiz-checkbox-group Web Component
		const selected = Array.isArray(selectedValues) ? selectedValues : selectedValues ? [selectedValues] : [];
		const questionData = JSON.stringify(question);
		const layout = question.id === "consent" ? "simple" : "cards";

		return `<quiz-checkbox-group
			question-data='${questionData}'
			selected-values='${JSON.stringify(selected)}'
			layout="${layout}"
		></quiz-checkbox-group>`;
	}

	renderDropdown(question, selectedValue) {
		if (!question.options) return "";

		// Use the quiz-dropdown Web Component
		const questionData = JSON.stringify(question);
		return `<quiz-dropdown
			question-data='${questionData}'
			selected-value="${selectedValue || ""}"
		></quiz-dropdown>`;
	}

	renderTextInput(question, value) {
		// Use the quiz-text-input Web Component
		const questionData = JSON.stringify(question);
		return `<quiz-text-input
			question-data='${questionData}'
			value="${value || ""}"
		></quiz-text-input>`;
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
		// Use the quiz-rating Web Component
		const questionData = JSON.stringify(question);
		return `<quiz-rating
			question-data='${questionData}'
			value="${value || 5}"
		></quiz-rating>`;
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

	getQuizData() {
		try {
			const quizDataAttr = this.getAttribute("quiz-data");
			return quizDataAttr ? JSON.parse(quizDataAttr) : null;
		} catch (error) {
			console.error("Error parsing quiz data:", error);
			return null;
		}
	}

	handleAttributeChange(name, oldValue, newValue) {
		if (["step-data", "responses", "current-question-index", "is-form-step", "validation-errors", "quiz-data"].includes(name)) {
			this.render();
		}
	}
}

// Register the component
if (!customElements.get("quiz-step-container")) {
	customElements.define("quiz-step-container", QuizStepContainer);
}

export default QuizStepContainer;
