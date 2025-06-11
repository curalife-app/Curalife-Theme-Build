/**
 * Core Quiz Functionality
 * Handles basic quiz operations, navigation, and question rendering
 */

const ELEMENT_SELECTORS = {
	MAIN_CONTAINER: "#quiz-container",
	QUESTIONS: ".quiz-questions",
	RESULTS: ".quiz-results",
	ERROR: ".quiz-error",
	LOADING: ".quiz-loading",
	STATUS_CHECK: ".quiz-status-check",
	PROGRESS_BAR: ".quiz-progress-bar",
	QUESTION_CONTAINER: ".quiz-question-container",
	NAVIGATION_BUTTONS: ".quiz-navigation",
	NEXT_BUTTON: "#quiz-next-button"
};

export class QuizCore {
	constructor(container, config = {}) {
		this.container = container;
		this.config = config;

		// Initialize DOM elements
		this._initializeDOMElements();
		if (!this._isInitialized) return;

		// State
		this.quizData = null;
		this.currentStepIndex = 0;
		this.currentQuestionIndex = 0;
		this.responses = [];
		this.submitting = false;
		this.loadingInterval = null;

		// Test mode
		this.isTestMode = this.container.hasAttribute("data-test-mode");
	}

	_initializeDOMElements() {
		this._isInitialized = false;

		if (!this.container) {
			console.error("Quiz container not found");
			return;
		}

		// Initialize all selectors as properties
		Object.entries(ELEMENT_SELECTORS).forEach(([key, selector]) => {
			const propertyName = this._selectorToProperty(key);
			this[propertyName] = this.container.querySelector(selector);
		});

		this._isInitialized = true;
	}

	_selectorToProperty(selectorKey) {
		return selectorKey.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
	}

	_validateEssentialElements() {
		const essential = ["mainContainer", "questions", "results", "error", "loading"];
		const missing = essential.filter(prop => !this[prop]);

		if (missing.length > 0) {
			this._displayCriticalError("Missing essential elements: " + missing.join(", "));
			return false;
		}
		return true;
	}

	_displayCriticalError(message) {
		console.error("Critical Quiz Error:", message);
		if (this.error) {
			this.error.innerHTML = '<div class="quiz-error-message">' + message + "</div>";
			this.error.style.display = "block";
		}
	}

	async loadQuizData() {
		try {
			const quizDataUrl = this.container.getAttribute("data-quiz-data-url");
			if (!quizDataUrl) {
				throw new Error("Quiz data URL not found");
			}

			const response = await fetch(quizDataUrl);
			this.quizData = await response.json();
			this._initializeResponses();
			return true;
		} catch (error) {
			console.error("Failed to load quiz data:", error);
			this._displayCriticalError("Failed to load quiz data");
			return false;
		}
	}

	_initializeResponses() {
		this.responses = this.quizData.steps.map(() => ({}));
	}

	getCurrentStep() {
		return this.quizData && this.quizData.steps && this.quizData.steps[this.currentStepIndex] ? this.quizData.steps[this.currentStepIndex] : null;
	}

	getCurrentQuestion() {
		const step = this.getCurrentStep();
		return step && step.questions && step.questions[this.currentQuestionIndex] ? step.questions[this.currentQuestionIndex] : null;
	}

	getResponseForCurrentQuestion() {
		const step = this.getCurrentStep();
		if (!step) return undefined;

		const question = this.getCurrentQuestion();
		if (!question) return this.responses[this.currentStepIndex];

		return this.responses[this.currentStepIndex][question.id];
	}

	isFormStep(stepId) {
		const step = this.getCurrentStep();
		return step && step.type === "form";
	}

	renderCurrentStep() {
		const step = this.getCurrentStep();
		if (!step) {
			this._displayCriticalError("No step to render");
			return;
		}

		this._updateProgressBar();

		if (step.type === "form") {
			this.questions.innerHTML = this._generateFormStepHTML(step);
		} else {
			this.questions.innerHTML = this._generateWizardStepHTML(step);
		}

		this._attachStepEventListeners(step);
		this.updateNavigation();
		this._toggleElement(this.questions, true);
	}

	_updateProgressBar() {
		if (!this.progressBar) return;

		const totalSteps = this.quizData.steps.length;
		const progress = ((this.currentStepIndex + 1) / totalSteps) * 100;

		this.progressBar.style.width = Math.min(progress, 100) + "%";
		this.progressBar.setAttribute("aria-valuenow", Math.min(progress, 100));

		const progressText = this.container.querySelector(".quiz-progress-text");
		if (progressText) {
			progressText.textContent = "Step " + (this.currentStepIndex + 1) + " of " + totalSteps;
		}
	}

	_generateFormStepHTML(step) {
		const stepInfo = this._generateStepInfoHTML(step);
		const questions = step.questions
			.map(question => {
				return this._renderQuestionByType(question, this.responses[this.currentStepIndex][question.id]);
			})
			.join("");

		return ['<div class="quiz-form-step">', stepInfo, '<form class="quiz-form">', questions, "</form>", "</div>"].join("");
	}

	_generateWizardStepHTML(step) {
		const question = this.getCurrentQuestion();
		const response = this.getResponseForCurrentQuestion();
		const stepInfo = this._generateStepInfoHTML(step);
		const questionHTML = this._renderQuestionByType(question, response);

		return ['<div class="quiz-wizard-step">', stepInfo, '<div class="quiz-question-wrapper">', questionHTML, "</div>", "</div>"].join("");
	}

	_generateStepInfoHTML(step) {
		if (!step.title && !step.description) return "";

		const title = step.title ? '<h3 class="quiz-step-title">' + step.title + "</h3>" : "";
		const description = step.description ? '<p class="quiz-step-description">' + step.description + "</p>" : "";

		return ['<div class="quiz-step-info">', title, description, "</div>"].join("");
	}

	_toggleElement(element, show) {
		if (element) element.style.display = show ? "block" : "none";
	}

	_setNavigationVisibility(visible) {
		if (this.navigationButtons) {
			this.navigationButtons.style.display = visible ? "flex" : "none";
		}
	}

	_renderQuestionByType(question, response) {
		if (!question) return "";

		switch (question.type) {
			case "multiple-choice":
				return this.renderMultipleChoice(question, response);
			case "checkbox":
				return this.renderCheckbox(question, response);
			case "dropdown":
				return this.renderDropdown(question, response);
			case "text-input":
				return this.renderTextInput(question, response);
			case "date-part":
				return this.renderDatePart(question, response);
			case "textarea":
				return this.renderTextarea(question, response);
			case "rating":
				return this.renderRating(question, response);
			case "date-input":
				return this.renderDateInput(question, response);
			default:
				console.warn("Unknown question type:", question.type);
				return '<div class="quiz-error">Unknown question type: ' + question.type + "</div>";
		}
	}

	renderMultipleChoice(question, response) {
		return this._renderCardOptions(question, response, "radio");
	}

	renderCheckbox(question, response) {
		if (question.style === "cards") {
			return this._renderCardOptions(question, response, "checkbox");
		}
		return this._renderSimpleCheckboxes(question, Array.isArray(response) ? response : []);
	}

	_renderCardOptions(question, response, inputType) {
		const selectedValues = inputType === "checkbox" ? (Array.isArray(response) ? response : []) : [response];

		const options = question.options
			.map((option, index) => {
				const isSelected = selectedValues.includes(option.value);
				const checked = isSelected ? "checked" : "";
				const selectedClass = isSelected ? "selected" : "";

				return [
					'<label class="quiz-option-card ' + selectedClass + '" data-option-value="' + option.value + '">',
					'<input type="' + inputType + '" name="' + question.id + '" value="' + option.value + '" ' + checked + ' style="display: none;">',
					'<div class="quiz-option-content">',
					'<span class="quiz-option-text">' + option.label + "</span>",
					'<span class="quiz-option-checkmark">' + this._getCheckmarkSVG() + "</span>",
					"</div>",
					"</label>"
				].join("");
			})
			.join("");

		return [
			'<div class="quiz-question" data-question-id="' + question.id + '" data-question-type="' + question.type + '">',
			'<h4 class="quiz-question-title">' + question.text + "</h4>",
			'<div class="quiz-options quiz-options-cards">',
			options,
			"</div>",
			"</div>"
		].join("");
	}

	_renderSimpleCheckboxes(question, selectedOptions) {
		const options = question.options
			.map(option => {
				const checked = selectedOptions.includes(option.value) ? "checked" : "";

				return [
					'<label class="quiz-option-simple">',
					'<input type="checkbox" name="' + question.id + '" value="' + option.value + '" ' + checked + ">",
					'<span class="quiz-option-label">' + option.label + "</span>",
					"</label>"
				].join("");
			})
			.join("");

		return [
			'<div class="quiz-question" data-question-id="' + question.id + '" data-question-type="' + question.type + '">',
			'<h4 class="quiz-question-title">' + question.text + "</h4>",
			'<div class="quiz-options quiz-options-simple">',
			options,
			"</div>",
			"</div>"
		].join("");
	}

	renderDropdown(question, response) {
		const placeholder = question.placeholder || "Select an option";
		const selectedAttr = !response ? "selected" : "";

		const options = question.options
			.map(option => {
				const selected = response === option.value ? "selected" : "";
				return '<option value="' + option.value + '" ' + selected + ">" + option.label + "</option>";
			})
			.join("");

		return [
			'<div class="quiz-question" data-question-id="' + question.id + '" data-question-type="' + question.type + '">',
			'<h4 class="quiz-question-title">' + question.text + "</h4>",
			'<select class="quiz-dropdown" name="' + question.id + '">',
			'<option value="" disabled ' + selectedAttr + ">" + placeholder + "</option>",
			options,
			"</select>",
			'<div class="quiz-field-error" id="error-' + question.id + '"></div>',
			"</div>"
		].join("");
	}

	renderTextInput(question, response) {
		const value = response || "";
		const placeholder = question.placeholder || "";

		return [
			'<div class="quiz-question" data-question-id="' + question.id + '" data-question-type="' + question.type + '">',
			'<h4 class="quiz-question-title">' + question.text + "</h4>",
			'<input type="text" class="quiz-text-input" name="' + question.id + '" value="' + value + '" placeholder="' + placeholder + '">',
			'<div class="quiz-field-error" id="error-' + question.id + '"></div>',
			"</div>"
		].join("");
	}

	renderTextarea(question, response) {
		const value = response || "";
		const placeholder = question.placeholder || "";

		return [
			'<div class="quiz-question" data-question-id="' + question.id + '" data-question-type="' + question.type + '">',
			'<h4 class="quiz-question-title">' + question.text + "</h4>",
			'<textarea class="quiz-textarea" name="' + question.id + '" placeholder="' + placeholder + '">' + value + "</textarea>",
			'<div class="quiz-field-error" id="error-' + question.id + '"></div>',
			"</div>"
		].join("");
	}

	renderRating(question, response) {
		const max = question.max || 10;
		const options = [];

		for (let i = 1; i <= max; i++) {
			const selected = response == i ? "selected" : "";
			const checked = response == i ? "checked" : "";

			options.push(
				[
					'<label class="quiz-rating-option ' + selected + '">',
					'<input type="radio" name="' + question.id + '" value="' + i + '" ' + checked + ">",
					'<span class="quiz-rating-number">' + i + "</span>",
					"</label>"
				].join("")
			);
		}

		return [
			'<div class="quiz-question" data-question-id="' + question.id + '" data-question-type="' + question.type + '">',
			'<h4 class="quiz-question-title">' + question.text + "</h4>",
			'<div class="quiz-rating-options">',
			options.join(""),
			"</div>",
			"</div>"
		].join("");
	}

	renderDateInput(question, response) {
		const value = response || "";

		return [
			'<div class="quiz-question" data-question-id="' + question.id + '" data-question-type="' + question.type + '">',
			'<h4 class="quiz-question-title">' + question.text + "</h4>",
			'<input type="date" class="quiz-date-input" name="' + question.id + '" value="' + value + '">',
			'<div class="quiz-field-error" id="error-' + question.id + '"></div>',
			"</div>"
		].join("");
	}

	renderDatePart(question, response) {
		const parts = ["month", "day", "year"];

		const partsHTML = parts
			.map(part => {
				const value = response && response[part] ? response[part] : "";
				const selectedAttr = !value ? "selected" : "";
				const partTitle = part.charAt(0).toUpperCase() + part.slice(1);

				const options = this._getDatePartOptions(part)
					.map(option => {
						const selected = value == option.value ? "selected" : "";
						return '<option value="' + option.value + '" ' + selected + ">" + option.label + "</option>";
					})
					.join("");

				return [
					'<select class="quiz-date-part" name="' + question.id + "_" + part + '" data-date-part="' + part + '">',
					'<option value="" disabled ' + selectedAttr + ">" + partTitle + "</option>",
					options,
					"</select>"
				].join("");
			})
			.join("");

		return [
			'<div class="quiz-question" data-question-id="' + question.id + '" data-question-type="' + question.type + '">',
			'<h4 class="quiz-question-title">' + question.text + "</h4>",
			'<div class="quiz-date-parts">',
			partsHTML,
			"</div>",
			'<div class="quiz-field-error" id="error-' + question.id + '"></div>',
			"</div>"
		].join("");
	}

	_getDatePartOptions(part) {
		const currentYear = new Date().getFullYear();

		switch (part) {
			case "month":
				return [
					{ value: "01", label: "January" },
					{ value: "02", label: "February" },
					{ value: "03", label: "March" },
					{ value: "04", label: "April" },
					{ value: "05", label: "May" },
					{ value: "06", label: "June" },
					{ value: "07", label: "July" },
					{ value: "08", label: "August" },
					{ value: "09", label: "September" },
					{ value: "10", label: "October" },
					{ value: "11", label: "November" },
					{ value: "12", label: "December" }
				];
			case "day":
				const days = [];
				for (let i = 1; i <= 31; i++) {
					const day = i.toString().padStart(2, "0");
					days.push({ value: day, label: i.toString() });
				}
				return days;
			case "year":
				const years = [];
				for (let i = 0; i < 100; i++) {
					const year = currentYear - i;
					years.push({ value: year.toString(), label: year.toString() });
				}
				return years;
			default:
				return [];
		}
	}

	_getCheckmarkSVG() {
		return [
			'<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">',
			'<path d="M16.6667 5L7.50004 14.1667L3.33337 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
			"</svg>"
		].join("");
	}

	goToPreviousStep() {
		if (this.currentStepIndex > 0) {
			this.currentStepIndex--;
			this.currentQuestionIndex = 0;
			this.renderCurrentStep();
		}
	}

	goToNextStep() {
		const step = this.getCurrentStep();
		if (!step) return;

		if (step.type === "form") {
			// Handle form steps - all questions at once
			if (this.currentStepIndex < this.quizData.steps.length - 1) {
				this.currentStepIndex++;
				this.currentQuestionIndex = 0;
				this.renderCurrentStep();
			}
		} else {
			// Handle wizard steps - one question at a time
			if (this.currentQuestionIndex < step.questions.length - 1) {
				this.currentQuestionIndex++;
				this.renderCurrentStep();
			} else if (this.currentStepIndex < this.quizData.steps.length - 1) {
				this.currentStepIndex++;
				this.currentQuestionIndex = 0;
				this.renderCurrentStep();
			}
		}
	}

	updateNavigation() {
		const step = this.getCurrentStep();
		if (!step) return;

		// Update next button text and behavior
		const nextButton = this.nextButton;
		if (!nextButton) return;

		const isLastStep = this.currentStepIndex === this.quizData.steps.length - 1;
		const isLastQuestion = step.type !== "form" && this.currentQuestionIndex === step.questions.length - 1;

		if (isLastStep && (step.type === "form" || isLastQuestion)) {
			nextButton.textContent = this._getStepButtonText(step);
			nextButton.disabled = !this._hasValidAnswer(step);
		} else {
			nextButton.textContent = "Next";
			nextButton.disabled = !this._hasValidAnswer(step);
		}

		// Show/hide back button
		const backButton = this.container.querySelector("#quiz-back-button");
		if (backButton) {
			backButton.style.display = this.currentStepIndex === 0 && this.currentQuestionIndex === 0 ? "none" : "inline-block";
		}
	}

	_getStepButtonText(step) {
		if (step.buttonText) return step.buttonText;

		const buttonTextMap = {
			submit: "Submit Application",
			finish: "Get My Results",
			schedule: "Schedule Appointment",
			complete: "Complete Quiz"
		};

		return buttonTextMap[step.action] || "Continue";
	}

	_hasValidAnswer(step) {
		if (step.type === "form") {
			return step.questions.every(question => {
				const response = this.responses[this.currentStepIndex][question.id];
				return !this._isEmptyValue(response, question.type);
			});
		} else {
			const question = this.getCurrentQuestion();
			if (!question) return true;

			const response = this.getResponseForCurrentQuestion();
			return !this._isEmptyValue(response, question.type);
		}
	}

	_isEmptyValue(value, questionType) {
		if (questionType === "checkbox") {
			return !Array.isArray(value) || value.length === 0;
		}
		return value === undefined || value === null || value === "";
	}

	handleAnswer(answer) {
		const step = this.getCurrentStep();
		const question = this.getCurrentQuestion();

		if (!step || !question) return;

		this._updateResponse(question.id, answer, step.id);

		if (this._shouldAutoAdvance(question)) {
			this._handleAutoAdvance(answer);
		}

		this.updateNavigation();
	}

	_updateResponse(questionId, answer, stepId) {
		this.responses[this.currentStepIndex][questionId] = answer;

		// Dispatch event for external listeners
		this.container.dispatchEvent(
			new CustomEvent("quizAnswer", {
				detail: { questionId: questionId, answer: answer, stepId: stepId }
			})
		);
	}

	_shouldAutoAdvance(question) {
		return question.autoAdvance === true && question.type === "multiple-choice";
	}

	_handleAutoAdvance(answer) {
		const self = this;
		setTimeout(function () {
			self.goToNextStep();
		}, 300);
	}

	_attachStepEventListeners(step) {
		if (step.type === "form") {
			const self = this;
			step.questions.forEach(function (question) {
				self._attachFormQuestionListener(question);
			});
		} else {
			const question = this.getCurrentQuestion();
			if (question) {
				this._attachQuestionEventListeners(question);
			}
		}
	}

	_attachQuestionEventListeners(question) {
		const questionElement = this.container.querySelector('[data-question-id="' + question.id + '"]');
		if (!questionElement) return;

		this._removeExistingHandlers(questionElement, ["change", "input", "click"]);

		switch (question.type) {
			case "checkbox":
				this._attachCheckboxListeners(question);
				break;
			case "dropdown":
				this._attachDropdownListeners(question);
				break;
			case "text-input":
			case "textarea":
			case "date-input":
				this._attachTextInputListeners(question);
				break;
			case "multiple-choice":
			case "rating":
				this._attachInputGroupListeners(question, "change", () => {
					const selectedInput = questionElement.querySelector('input[type="radio"]:checked');
					if (selectedInput) {
						this.handleAnswer(selectedInput.value);
					}
				});
				break;
			case "date-part":
				const self = this;
				questionElement.querySelectorAll("select").forEach(function (select) {
					select.addEventListener("change", function () {
						const parts = {};
						questionElement.querySelectorAll("select").forEach(function (partSelect) {
							const part = partSelect.getAttribute("data-date-part");
							if (partSelect.value) {
								parts[part] = partSelect.value;
							}
						});
						self.handleAnswer(parts);
					});
				});
				break;
		}
	}

	_attachCheckboxListeners(question) {
		const questionElement = this.container.querySelector('[data-question-id="' + question.id + '"]');
		const checkboxInputs = questionElement.querySelectorAll('input[type="checkbox"]');
		const self = this;

		const getSelectedValues = function () {
			return Array.from(checkboxInputs)
				.filter(function (input) {
					return input.checked;
				})
				.map(function (input) {
					return input.value;
				});
		};

		checkboxInputs.forEach(function (input) {
			input.addEventListener("change", function () {
				const selectedValues = getSelectedValues();
				self.handleAnswer(selectedValues);
				self._updateCheckboxVisualState(question, selectedValues);
			});
		});
	}

	_updateCheckboxVisualState(question, selectedValues) {
		const questionElement = this.container.querySelector('[data-question-id="' + question.id + '"]');
		if (!questionElement) return;

		questionElement.querySelectorAll(".quiz-option-card").forEach(function (card) {
			const optionValue = card.getAttribute("data-option-value");
			const isSelected = selectedValues.includes(optionValue);

			if (isSelected) {
				card.classList.add("selected");
			} else {
				card.classList.remove("selected");
			}
		});
	}

	_attachDropdownListeners(question) {
		const dropdown = this.container.querySelector('[data-question-id="' + question.id + '"] select');
		const self = this;
		if (dropdown) {
			dropdown.addEventListener("change", function () {
				self.handleAnswer(dropdown.value);
			});
		}
	}

	_attachTextInputListeners(question) {
		const input = this.container.querySelector('[data-question-id="' + question.id + '"] input, [data-question-id="' + question.id + '"] textarea');
		const self = this;
		if (input) {
			input.addEventListener("input", function () {
				self.handleAnswer(input.value);
			});
		}
	}

	_attachInputGroupListeners(question, eventType, callback) {
		const inputs = this.container.querySelectorAll('[data-question-id="' + question.id + '"] input');
		inputs.forEach(function (input) {
			input.addEventListener(eventType, callback);
		});
	}

	_removeExistingHandlers(element, events) {
		// Note: This is a simplified version - in practice, you'd want to track handlers for proper removal
		const self = this;
		events.forEach(function (event) {
			element.removeEventListener(event, function () {});
		});
	}

	_attachFormQuestionListener(question) {
		const questionElement = this.container.querySelector('[data-question-id="' + question.id + '"]');
		if (!questionElement) return;

		const self = this;

		switch (question.type) {
			case "checkbox":
				this._attachFormCheckboxListeners(question);
				break;
			default:
				const input = questionElement.querySelector("input, select, textarea");
				if (input) {
					input.addEventListener("input", function () {
						self.handleFormAnswer(question.id, input.value);
					});
					input.addEventListener("change", function () {
						self.handleFormAnswer(question.id, input.value);
					});
				}
				break;
		}
	}

	_attachFormCheckboxListeners(question) {
		const questionElement = this.container.querySelector('[data-question-id="' + question.id + '"]');
		const checkboxes = questionElement.querySelectorAll('input[type="checkbox"]');
		const self = this;

		checkboxes.forEach(function (checkbox) {
			checkbox.addEventListener("change", function () {
				const selectedValues = Array.from(checkboxes)
					.filter(function (cb) {
						return cb.checked;
					})
					.map(function (cb) {
						return cb.value;
					});
				self.handleFormAnswer(question.id, selectedValues);
			});
		});
	}

	handleFormAnswer(questionId, answer) {
		this._updateResponse(questionId, answer);
		this.updateNavigation();
	}

	// Event binding for navigation
	attachNavigationListeners() {
		const backButton = this.container.querySelector("#quiz-back-button");
		const nextButton = this.nextButton;
		const self = this;

		if (backButton) {
			backButton.addEventListener("click", function () {
				self.goToPreviousStep();
			});
		}

		if (nextButton) {
			nextButton.addEventListener("click", function () {
				const step = self.getCurrentStep();
				const isLastStep = self.currentStepIndex === self.quizData.steps.length - 1;
				const isLastQuestion = step.type !== "form" && self.currentQuestionIndex === step.questions.length - 1;

				if (isLastStep && (step.type === "form" || isLastQuestion)) {
					// This is where we'd trigger the finish process
					self.container.dispatchEvent(
						new CustomEvent("quizComplete", {
							detail: { responses: self.responses }
						})
					);
				} else {
					self.goToNextStep();
				}
			});
		}
	}
}
