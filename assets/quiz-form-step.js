/**
 * Quiz Form Step Component
 *
 * Replaces _generateFormStepHTML() method from quiz.js
 * Handles complete form step rendering with questions, validation, and submission
 */

import { QuizBaseComponent } from "../base/quiz-base-component.js";

export class QuizFormStep extends QuizBaseComponent {
	static get observedAttributes() {
		return ["step-data", "responses", "is-last-step", "validation-errors", "quiz-data"];
	}

	getTemplate() {
		const stepData = this.getStepData();
		const responses = this.getResponses();
		const isLastStep = this.getAttribute("is-last-step") === "true";
		const validationErrors = this.getValidationErrors();

		if (!stepData) {
			return '<p class="quiz-error-text">Step configuration error. Please contact support.</p>';
		}

		const buttonText = isLastStep ? stepData.ctaText || "Finish Quiz" : stepData.ctaText || "Continue";

		return `
			${stepData.info?.formSubHeading ? `<h4 class="quiz-heading quiz-heading-mobile-outside">${stepData.info.formSubHeading}</h4>` : ""}
			<div class="quiz-form-container">
				${stepData.info?.formSubHeading ? `<h4 class="quiz-heading quiz-heading-desktop-inside">${stepData.info.formSubHeading}</h4>` : ""}
				<div class="quiz-space-y-6">
					${this.renderFormQuestions(stepData.questions, responses, validationErrors)}
				</div>
				<button class="quiz-nav-button quiz-nav-button--primary quiz-form-button" id="quiz-form-next-button">
					${buttonText}
				</button>
				${stepData.legal ? `<p class="quiz-legal-form">${stepData.legal}</p>` : ""}
			</div>
		`;
	}

	getStyles() {
		return `
			${super.getStyles()}

			.quiz-form-container {
				display: flex;
				flex-direction: column;
				gap: 24px;
			}

			.quiz-space-y-6 {
				display: flex;
				flex-direction: column;
				gap: 24px;
			}

			.quiz-heading-mobile-outside {
				display: block;
			}

			.quiz-heading-desktop-inside {
				display: none;
			}

			@media (min-width: 768px) {
				.quiz-heading-mobile-outside {
					display: none;
				}

				.quiz-heading-desktop-inside {
					display: block;
				}
			}

			.quiz-nav-button {
				padding: 12px 24px;
				border-radius: var(--quiz-border-radius);
				font-weight: 600;
				transition: var(--quiz-transition);
				cursor: pointer;
				border: none;
			}

			.quiz-nav-button--primary {
				background-color: var(--quiz-secondary-color);
				color: white;
			}

			.quiz-nav-button--primary:hover {
				opacity: 0.9;
			}

			.quiz-legal-form {
				font-size: 12px;
				color: #666;
				text-align: center;
				margin-top: 16px;
			}

			.quiz-error-text {
				color: var(--quiz-error-color);
				text-align: center;
				padding: 16px;
			}
		`;
	}

	render() {
		this.renderTemplate();
		this.attachEventListeners();
	}

	attachEventListeners() {
		const submitButton = this.root.querySelector("#quiz-form-next-button");
		if (submitButton) {
			submitButton.addEventListener("click", e => {
				e.preventDefault();
				this.dispatchEvent(
					new CustomEvent("form-submit", {
						detail: { stepData: this.getStepData() },
						bubbles: true
					})
				);
			});
		}
	}

	renderFormQuestions(questions, responses, validationErrors) {
		if (!questions || !Array.isArray(questions)) return "";

		let html = "";
		let i = 0;

		while (i < questions.length) {
			const processed = this.tryProcessQuestionGroup(questions, i, responses);
			if (processed.html) {
				html += processed.html;
				i += processed.skip;
			} else {
				html += this.renderSingleFormQuestion(questions[i], responses, validationErrors);
				i++;
			}
		}

		return html;
	}

	tryProcessQuestionGroup(questions, index, responses) {
		const question = questions[index];
		const getResponse = q => responses?.find(r => r.questionId === q.id) || { answer: null };

		// Check for paired fields (simplified - would need full config)
		const commonPairs = [
			["q4", "q4_group"],
			["q7", "q8"],
			["q9", "q10"]
		];

		for (const pair of commonPairs) {
			if (question.id === pair[0] && questions[index + 1]?.id === pair[1]) {
				return {
					html: this.renderFormFieldPair(question, questions[index + 1], getResponse(question), getResponse(questions[index + 1])),
					skip: 2
				};
			}
		}

		// Check for date group
		if (question.type === "date-part" && question.part === "month") {
			const [dayQ, yearQ] = [questions[index + 1], questions[index + 2]];
			if (dayQ?.type === "date-part" && dayQ.part === "day" && yearQ?.type === "date-part" && yearQ.part === "year") {
				return {
					html: this.renderDateGroup(question, dayQ, yearQ, responses),
					skip: 3
				};
			}
		}

		return { html: null, skip: 0 };
	}

	renderSingleFormQuestion(question, responses, validationErrors) {
		const response = responses?.find(r => r.questionId === question.id) || { answer: null };
		const hasError = validationErrors?.some(error => error.questionId === question.id);
		const errorClass = hasError ? "quiz-field-error" : "";

		return `
			<div class="quiz-question-section ${errorClass}">
				<label class="quiz-label" for="question-${question.id}">
					${question.text}${this.renderHelpIcon(question.id)}
				</label>
				${question.helpText ? `<p class="quiz-text-sm">${question.helpText}</p>` : ""}
				${this.renderQuestionInput(question, response, hasError)}
				${hasError ? `<div class="quiz-error-message">${validationErrors.find(e => e.questionId === question.id)?.message || "Invalid input"}</div>` : ""}
			</div>
		`;
	}

	renderFormFieldPair(leftQuestion, rightQuestion, leftResponse, rightResponse) {
		const generateField = (question, response) => ({
			input: this.renderQuestionInput(question, response),
			helpIcon: this.renderHelpIcon(question.id),
			label: question.text,
			id: question.id
		});

		const [left, right] = [generateField(leftQuestion, leftResponse), generateField(rightQuestion, rightResponse)];

		return `
			<div class="quiz-grid-2-form">
				${[left, right]
					.map(
						field => `
					<div>
						<label class="quiz-label" for="question-${field.id}">
							${field.label}${field.helpIcon}
						</label>
						${field.input}
					</div>
				`
					)
					.join("")}
			</div>
		`;
	}

	renderDateGroup(monthQ, dayQ, yearQ, responses) {
		const monthResponse = responses?.find(r => r.questionId === monthQ.id) || { answer: null };
		const dayResponse = responses?.find(r => r.questionId === dayQ.id) || { answer: null };
		const yearResponse = responses?.find(r => r.questionId === yearQ.id) || { answer: null };

		return `
			<div class="quiz-question-section">
				<label class="quiz-label">${monthQ.text}</label>
				<div class="quiz-grid-3">
					${this.renderDatePart(monthQ, monthResponse)}
					${this.renderDatePart(dayQ, dayResponse)}
					${this.renderDatePart(yearQ, yearResponse)}
				</div>
			</div>
		`;
	}

	renderQuestionInput(question, response, hasError = false) {
		// Simplified input rendering - would delegate to specific input components
		const value = response?.answer || "";
		const errorAttr = hasError ? 'show-error="true"' : "";

		switch (question.type) {
			case "text":
			case "email":
			case "phone":
				return `<quiz-text-input
					question-data='${JSON.stringify(question)}'
					value="${value || ""}"
					${errorAttr}
				></quiz-text-input>`;
			case "textarea":
				return `<textarea id="question-${question.id}" class="quiz-textarea ${hasError ? "quiz-input-error" : ""}" ${question.required ? "required" : ""}>${value}</textarea>`;
			case "dropdown":
				return `<quiz-dropdown
					question-data='${JSON.stringify(question)}'
					selected-value="${value || ""}"
					${errorAttr}
				></quiz-dropdown>`;
			case "payer-search":
				const quizData = this.getQuizData();
				return `<quiz-payer-search
					question-id="${question.id}"
					placeholder="${question.placeholder || "Start typing to search for your insurance plan..."}"
					common-payers='${JSON.stringify(quizData?.commonPayers || [])}'
					${value ? `selected-payer="${value}"` : ""}
					${errorAttr}
				></quiz-payer-search>`;
			default:
				return `<input type="text" id="question-${question.id}" class="quiz-input ${hasError ? "quiz-input-error" : ""}" value="${value}">`;
		}
	}

	renderDatePart(question, response) {
		const value = response?.answer || "";
		const options = this.getDatePartOptions(question.part);

		// Create a dropdown question with the date options
		const dropdownQuestion = {
			...question,
			type: "dropdown",
			options: options.map(opt => ({ id: opt.value, text: opt.text })),
			placeholder: question.placeholder || `Select ${question.part}`
		};

		return `<quiz-dropdown
			question-data='${JSON.stringify(dropdownQuestion)}'
			selected-value="${value || ""}"
		></quiz-dropdown>`;
	}

	getDatePartOptions(part) {
		switch (part) {
			case "month":
				return Array.from({ length: 12 }, (_, i) => ({
					value: String(i + 1).padStart(2, "0"),
					text: new Date(2000, i).toLocaleString("default", { month: "long" })
				}));
			case "day":
				return Array.from({ length: 31 }, (_, i) => ({
					value: String(i + 1).padStart(2, "0"),
					text: String(i + 1)
				}));
			case "year":
				const currentYear = new Date().getFullYear();
				return Array.from({ length: 100 }, (_, i) => ({
					value: String(currentYear - i),
					text: String(currentYear - i)
				}));
			default:
				return [];
		}
	}

	renderHelpIcon(questionId) {
		// Get tooltip from global quiz data validation tooltips
		const quizData = this.getQuizData();
		const tooltip = quizData?.validation?.tooltips?.[questionId];

		if (!tooltip) return "";

		return `<span class="quiz-help-icon-container" data-tooltip="${tooltip}">
			<svg class="quiz-help-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
				<path d="M14.6668 8.00004C14.6668 4.31814 11.682 1.33337 8.00016 1.33337C4.31826 1.33337 1.3335 4.31814 1.3335 8.00004C1.3335 11.6819 4.31826 14.6667 8.00016 14.6667C11.682 14.6667 14.6668 11.6819 14.6668 8.00004Z" stroke="#121212"/>
				<path d="M8.1613 11.3334V8.00004C8.1613 7.68577 8.1613 7.52864 8.06363 7.43097C7.96603 7.33337 7.8089 7.33337 7.49463 7.33337" stroke="#121212" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M7.99463 5.33337H8.00063" stroke="#121212" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</span>`;
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

	getQuizData() {
		try {
			const quizDataAttr = this.getAttribute("quiz-data");
			return quizDataAttr ? JSON.parse(quizDataAttr) : null;
		} catch (error) {
			console.error("Error parsing quiz data:", error);
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
		if (["step-data", "responses", "validation-errors", "is-last-step", "quiz-data"].includes(name)) {
			this.render();
		}
	}
}

// Register the component
if (!customElements.get("quiz-form-step")) {
	customElements.define("quiz-form-step", QuizFormStep);
}

export default QuizFormStep;
