/**
 * Modular Quiz System for Shopify
 */

// Remove static import and use dynamic import instead
// import { NotificationManager } from '../utils/notifications.js';

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

class ModularQuiz {
	constructor(options = {}) {
		this._initializeDOMElements();
		if (!this._isInitialized) return;

		if (!this._validateEssentialElements()) return;

		// State
		this.quizData = null;
		this.config = null;
		this.currentStepIndex = 0;
		this.currentQuestionIndex = 0;
		this.responses = [];
		this.submitting = false;
		this.loadingInterval = null;

		// New state for background processing
		this.eligibilityWorkflowPromise = null;
		this.eligibilityWorkflowResult = null;
		this.eligibilityWorkflowError = null;
		this.userCreationWorkflowPromise = null;

		// Initialize the modular notification system asynchronously
		this._initializeNotificationManager().then(() => {
			this.init();
		});
	}

	async _initializeNotificationManager() {
		try {
			// Get the notifications.js URL from the data attribute set by Liquid
			const notificationsUrl = this.container.getAttribute("data-notifications-url");

			if (!notificationsUrl) {
				throw new Error("Notifications asset URL not found");
			}

			console.log("🔗 Loading notification system from:", notificationsUrl);

			// Dynamic import of the NotificationManager using the asset URL
			const { NotificationManager } = await import(notificationsUrl);

			// Configure the notification manager for quiz component using generic classes
			this.notificationManager = new NotificationManager({
				containerSelector: ".notification-container",
				position: "top-right",
				autoCollapse: false, // Disabled auto-collapse for better user control
				maxNotifications: 50,
				defaultDuration: 0, // Don't auto-remove notifications by default
				enableFiltering: true,
				enableCopy: true
				// Using generic notification classes - no custom mapping needed
			});

			console.log("✅ Notification system loaded successfully");
			return true;
		} catch (error) {
			console.error("❌ Failed to load notification system:", error);

			// Fallback: Create a simple notification function
			this.notificationManager = {
				show: (text, type = "info", priority = null) => {
					console.log(`📢 Notification (${type}):`, text);
					return null;
				},
				clear: () => console.log("🧹 Clear notifications"),
				exportNotifications: () => console.log("📤 Export notifications")
			};

			return false;
		}
	}

	_initializeDOMElements() {
		this.container = document.querySelector(ELEMENT_SELECTORS.MAIN_CONTAINER);
		if (!this.container) {
			console.error("ModularQuiz: Main container not found. Quiz cannot start.");
			this._isInitialized = false;
			return;
		}

		this.dataUrl = this.container.getAttribute("data-quiz-url") || "/apps/quiz/data.json";

		Object.keys(ELEMENT_SELECTORS).forEach(key => {
			if (key !== "MAIN_CONTAINER") {
				const selector = ELEMENT_SELECTORS[key];
				this[this._selectorToProperty(key)] = this.container.querySelector(selector);
			}
		});

		this.navHeader = this.container.querySelector("#quiz-nav-header");
		this.progressSection = this.container.querySelector("#quiz-progress-section");
		this._isInitialized = true;
	}

	_selectorToProperty(selectorKey) {
		return selectorKey
			.toLowerCase()
			.split("_")
			.map((word, index) => (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
			.join("");
	}

	_validateEssentialElements() {
		const essentialElements = ["questions", "results", "error", "loading", "progressBar", "questionContainer", "navigationButtons", "nextButton"];

		for (const element of essentialElements) {
			if (!this[element]) {
				this._displayCriticalError(`Essential element "${element}" is missing`);
				return false;
			}
		}
		return true;
	}

	_displayCriticalError(message) {
		this.container.innerHTML = `
            <div class="quiz-error quiz-critical-error">
                <h3 class="quiz-subtitle quiz-error-text">Quiz Error</h3>
                <p class="quiz-text">${message}. Please refresh or contact support.</p>
            </div>
        `;
		this._isInitialized = false;
	}

	async init() {
		if (!this._isInitialized) return;

		this._attachBackButtonListener();
		this._attachNextButtonListener();
		this._loadAndDisplayFirstStep();
	}

	_attachBackButtonListener() {
		if (!this.navHeader) return;

		const backButton = this.navHeader.querySelector("#quiz-back-button");
		if (backButton) {
			backButton.addEventListener("click", () => {
				// If we're showing results, go back to the last step
				if (this.questionContainer.querySelector(".quiz-results-container")) {
					this.currentStepIndex = this.quizData.steps.length - 1;
					this.currentQuestionIndex = 0;
					this.renderCurrentStep();
					this.updateNavigation();
				} else if (this.currentStepIndex === 0) {
					window.location.href = "/pages/telemedicine";
				} else {
					this.goToPreviousStep();
				}
			});
		}
	}

	_attachNextButtonListener() {
		if (!this.nextButton) return;

		this.nextButtonHandler = e => {
			if (!this.nextButton.disabled) {
				this.goToNextStep();
			}
		};

		this.nextButton.addEventListener("click", this.nextButtonHandler);
	}

	async _loadAndDisplayFirstStep() {
		this._toggleElement(this.questions, false);
		this._toggleElement(this.loading, true);

		try {
			await this.loadQuizData();
			this._initializeResponses();
			this._applyTestDataIfEnabled();

			this._toggleElement(this.loading, false);
			this._toggleElement(this.questions, true);
			this._toggleElement(this.navHeader, true);
			this._toggleElement(this.progressSection, true);

			this.renderCurrentStep();
			this.updateNavigation();
		} catch (error) {
			console.error("Failed to load quiz:", error);
			this._toggleElement(this.loading, false);
			this._toggleElement(this.error, true);
		}
	}

	async loadQuizData() {
		const response = await fetch(this.dataUrl);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const text = await response.text();
		this.quizData = JSON.parse(text);
		this.config = this.quizData.config || {};

		return this.quizData;
	}

	_initializeResponses() {
		this.responses = this.quizData.steps.flatMap(step =>
			step.questions ? step.questions.map(question => ({ stepId: step.id, questionId: question.id, answer: null })) : [{ stepId: step.id, questionId: step.id, answer: null }]
		);
	}

	_applyTestDataIfEnabled() {
		const testMode = new URLSearchParams(window.location.search).get("test");

		if (testMode && this.quizData.testData) {
			let testDataKey = "default";
			let displayName = testMode;

			// Support different test scenarios
			if (testMode === "true") {
				testDataKey = "default";
				displayName = "TEST API - UHC Test Data";
			} else if (testMode === "not-covered") {
				testDataKey = "notCovered";
				displayName = "TEST API - Not Covered Test";
			} else if (this.quizData.testData[testMode]) {
				testDataKey = testMode;
				// Create display names for better UX
				const displayNames = {
					default: "TEST API - UHC Test Data",
					notCovered: "TEST API - Not Covered Test",
					aetna_dependent: "TEST API - Aetna Test Data",
					anthem_dependent: "TEST API - Anthem Test Data",
					bcbstx_dependent: "TEST API - BCBS TX Test Data",
					cigna_dependent: "TEST API - Cigna Test Data",
					oscar_dependent: "TEST API - Oscar Test Data",
					error_42: "TEST API - Error 42 Test Data",
					error_43: "TEST API - Error 43 Test Data",
					error_72: "TEST API - Error 72 Test Data",
					error_73: "TEST API - Error 73 Test Data",
					error_75: "TEST API - Error 75 Test Data",
					error_79: "TEST API - Error 79 Test Data"
				};
				displayName = displayNames[testMode] || `TEST API - ${testMode.toUpperCase()}`;
			}

			const testData = this.quizData.testData[testDataKey] || this.quizData.testData.default || this.quizData.testData;

			if (testData) {
				Object.keys(testData).forEach(questionId => {
					const responseIndex = this.responses.findIndex(r => r.questionId === questionId);
					if (responseIndex !== -1) {
						this.responses[responseIndex].answer = testData[questionId];
					}
				});
				this._addTestModeIndicator(`🔬 ${displayName}`);
			}
		}
	}

	_addTestModeIndicator(text = "🧪 TEST MODE") {
		if (document.querySelector(".quiz-test-mode-indicator")) return;

		const indicator = document.createElement("div");
		indicator.className = "quiz-test-mode-indicator";
		indicator.innerHTML = text;
		indicator.style.cssText = `
            position: fixed; top: 10px; right: 10px; background: #4CAF50;
            color: white; padding: 8px 12px; border-radius: 4px; font-weight: bold;
            font-size: 12px; z-index: 9999; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
		document.body.appendChild(indicator);
		setTimeout(() => indicator.remove(), 5000);
	}

	_showBackgroundProcessNotification(text, type = "info", priority = null) {
		console.log("📢 Creating notification:", { text: text.substring(0, 50) + "...", type, priority });

		// Only show notifications if we have a container
		if (!this.questionContainer) {
			console.log("❌ No questionContainer found, skipping notification");
			return;
		}

		// Delegate completely to the modular notification system
		return this.notificationManager.show(text, type, priority);
	}

	clearNotifications() {
		return this.notificationManager.clear();
	}

	exportNotifications(format = "text", filter = "all") {
		return this.notificationManager.exportNotifications(format, filter);
	}

	getCurrentStep() {
		return this.quizData?.steps?.[this.currentStepIndex] || null;
	}

	getCurrentQuestion() {
		const step = this.getCurrentStep();
		return step?.questions?.[this.currentQuestionIndex] || null;
	}

	getResponseForCurrentQuestion() {
		const step = this.getCurrentStep();
		const questionId = step.questions ? step.questions[this.currentQuestionIndex].id : step.id;

		return (
			this.responses.find(r => r.questionId === questionId) || {
				stepId: step.id,
				questionId: questionId,
				answer: null
			}
		);
	}

	isFormStep(stepId) {
		return this.config.formSteps?.includes(stepId) || false;
	}

	renderCurrentStep() {
		const step = this.getCurrentStep();
		if (!step) return;

		this.questionContainer.className = "quiz-question-container";
		this.questionContainer.classList.add(`quiz-step-${this.currentStepIndex + 1}`);
		this.questionContainer.classList.add(`quiz-step-${step.id}`);

		this._updateProgressBar();

		const stepHTML = this._generateStepHTML(step);
		this.questionContainer.innerHTML = stepHTML;

		this._handleStepAcknowledgment(step);
		this._attachStepEventListeners(step);
		this.updateNavigation();

		if (step.legal && !this.isFormStep(step.id)) {
			this._addLegalTextAfterNavigation(step.legal);
		}

		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	_updateProgressBar() {
		const progress = ((this.currentStepIndex + 1) / this.quizData.steps.length) * 100;
		if (this.progressBar) {
			this.progressBar.classList.add("quiz-progress-bar-animated");
			this.progressBar.style.setProperty("--progress-width", `${progress}%`);

			const progressIndicator = this.container.querySelector(".quiz-progress-indicator");
			if (progressIndicator) {
				const progressContainer = this.container.querySelector(".quiz-progress-container");
				const containerWidth = progressContainer?.offsetWidth || 480;
				const isMobile = window.innerWidth <= 768;
				const indicatorHalfWidth = isMobile ? 16 : 26;
				const indicatorPosition = (progress / 100) * containerWidth - indicatorHalfWidth;

				progressIndicator.style.left = `${indicatorPosition}px`;
				progressIndicator.classList.toggle("visible", progress > 0);
			}
		}
	}

	_generateStepHTML(step) {
		let stepHTML = `<div class="animate-fade-in">`;
		stepHTML += this._generateStepInfoHTML(step);

		if (step.questions?.length > 0) {
			stepHTML += this.isFormStep(step.id) ? this._generateFormStepHTML(step) : this._generateWizardStepHTML(step);
		} else if (!step.info) {
			stepHTML += `<p class="quiz-error-text">Step configuration error. Please contact support.</p>`;
		}

		stepHTML += "</div>";
		return stepHTML;
	}

	_generateStepInfoHTML(step) {
		if (!step.info) return "";

		return `
            <h3 class="quiz-title">${step.info.heading}</h3>
            <p class="quiz-text">${step.info.text}</p>
            ${step.info.subtext ? `<p class="quiz-subtext">${step.info.subtext}</p>` : ""}
        `;
	}

	_generateFormStepHTML(step) {
		const isLastStep = this.currentStepIndex === this.quizData.steps.length - 1;
		const buttonText = isLastStep ? step.ctaText || "Finish Quiz" : step.ctaText || "Continue";

		return `
            ${step.info?.formSubHeading ? `<h4 class="quiz-heading quiz-heading-mobile-outside">${step.info.formSubHeading}</h4>` : ""}
			<div class="quiz-form-container">
                ${step.info?.formSubHeading ? `<h4 class="quiz-heading quiz-heading-desktop-inside">${step.info.formSubHeading}</h4>` : ""}
				<div class="quiz-space-y-6">
					${this._processFormQuestions(step.questions)}
				</div>
				<button class="quiz-nav-button quiz-nav-button--primary quiz-form-button" id="quiz-form-next-button">
					${buttonText}
				</button>
				${step.legal ? `<p class="quiz-legal-form">${step.legal}</p>` : ""}
			</div>
		`;
	}

	_generateWizardStepHTML(step) {
		const question = step.questions[this.currentQuestionIndex];
		const response = this.getResponseForCurrentQuestion();

		if (!question) {
			return `<p class="quiz-error-text">Question not found. Please try again.</p>`;
		}

		let html = "";

		if (!step.info) {
			html += `
				<h3 class="quiz-title">${question.text}</h3>
				${question.helpText ? `<p class="quiz-text">${question.helpText}</p>` : ""}
			`;
		} else {
			html += `
				<div class="quiz-divider">
					<h4 class="quiz-heading">${question.text}</h4>
					${question.helpText ? `<p class="quiz-text-sm">${question.helpText}</p>` : ""}
				</div>
			`;
		}

		html += this._renderQuestionByType(question, response);
		return html;
	}

	_toggleElement(element, show) {
		element?.classList.toggle("hidden", !show);
	}

	_setNavigationVisibility(visible) {
		if (!this.navigationButtons) return;

		if (visible) {
			this.navigationButtons.classList.remove("quiz-navigation-hidden", "hidden");
			this.navigationButtons.classList.add("quiz-navigation-visible");
		} else {
			this.navigationButtons.classList.add("quiz-navigation-hidden", "hidden");
			this.navigationButtons.classList.remove("quiz-navigation-visible");
		}
	}

	_renderQuestionByType(question, response) {
		switch (question.type) {
			case "multiple-choice":
				return this.renderMultipleChoice(question, response);
			case "checkbox":
				return this.renderCheckbox(question, response);
			case "dropdown":
				return this.renderDropdown(question, response);
			case "payer-search":
				return this.renderPayerSearch(question, response);
			case "text":
				return this.renderTextInput(question, response);
			case "date":
				return this.renderDateInput(question, response);
			case "date-part":
				return this.renderDatePart(question, response);
			case "textarea":
				return this.renderTextarea(question, response);
			case "rating":
				return this.renderRating(question, response);
			default:
				return `<p class="quiz-error-text">Unsupported field type: ${question.type}</p>`;
		}
	}

	renderMultipleChoice(question, response) {
		return this._renderCardOptions(question, response, "radio");
	}

	renderCheckbox(question, response) {
		const selectedOptions = Array.isArray(response.answer) ? response.answer : [];

		if (question.id === "consent") {
			return this._renderSimpleCheckboxes(question, selectedOptions);
		}
		return this._renderCardOptions(question, response, "checkbox");
	}

	_renderCardOptions(question, response, inputType) {
		const selectedOptions = inputType === "checkbox" ? (Array.isArray(response.answer) ? response.answer : []) : null;
		const isSelected = option => (inputType === "checkbox" ? selectedOptions.includes(option.id) : response.answer === option.id);

		let html = '<div class="quiz-grid-2">';
		question.options.forEach(option => {
			const selected = isSelected(option);
			html += `
				<label for="${option.id}" class="quiz-option-card">
					<input type="${inputType}" id="${option.id}" name="question-${question.id}" value="${option.id}" class="quiz-sr-only" ${selected ? "checked" : ""}>
					<div class="quiz-option-button ${selected ? "selected" : ""}">
						<div class="quiz-option-text">
							<div class="quiz-option-text-content">${option.text}</div>
						</div>
						${selected ? this._getCheckmarkSVG() : ""}
					</div>
				</label>
			`;
		});
		return html + "</div>";
	}

	_renderSimpleCheckboxes(question, selectedOptions) {
		let html = '<div class="quiz-space-y-3 quiz-spacing-container">';
		question.options.forEach(option => {
			html += `
				<div class="quiz-checkbox-container">
					<input type="checkbox" id="${option.id}" name="question-${question.id}" value="${option.id}" class="quiz-checkbox-input" ${selectedOptions.includes(option.id) ? "checked" : ""}>
					<label class="quiz-checkbox-label" for="${option.id}">${option.text}</label>
				</div>
			`;
		});
		return html + "</div>";
	}

	renderDropdown(question, response) {
		const options = question.options || [];
		const placeholder = question.placeholder || "Select an option";
		const optionsHTML = options.map(option => `<option value="${option.id}" ${response.answer === option.id ? "selected" : ""}>${option.text}</option>`).join("");

		return `
			<div>
				<select id="question-${question.id}" class="quiz-select">
					<option value="">${placeholder}</option>
					${optionsHTML}
				</select>
				${this._getErrorElement(question.id)}
			</div>
        `;
	}

	renderTextInput(question, response) {
		return `
			<div>
				<input type="text" id="question-${question.id}" class="quiz-input"
					placeholder="${question.placeholder || "Type your answer here..."}"
					value="${response.answer || ""}"
					aria-describedby="error-${question.id}">
				${this._getErrorElement(question.id)}
			</div>
		`;
	}

	_getErrorElement(questionId) {
		return `<p id="error-${questionId}" class="quiz-error-text quiz-error-hidden"></p>`;
	}

	renderDatePart(question, response) {
		const part = question.part;
		let options = this._getDatePartOptions(part);
		const placeholder = question.placeholder || `Select ${part}`;

		return `
            <div>
                <select id="question-${question.id}" class="quiz-select">
                    <option value="">${placeholder}</option>
                    ${options.map(option => `<option value="${option.id}" ${response.answer === option.id ? "selected" : ""}>${option.text}</option>`).join("")}
                </select>
			</div>
		`;
	}

	_getDatePartOptions(part) {
		if (part === "month") {
			return [
				{ id: "01", text: "January" },
				{ id: "02", text: "February" },
				{ id: "03", text: "March" },
				{ id: "04", text: "April" },
				{ id: "05", text: "May" },
				{ id: "06", text: "June" },
				{ id: "07", text: "July" },
				{ id: "08", text: "August" },
				{ id: "09", text: "September" },
				{ id: "10", text: "October" },
				{ id: "11", text: "November" },
				{ id: "12", text: "December" }
			];
		} else if (part === "day") {
			return Array.from({ length: 31 }, (_, i) => {
				const day = String(i + 1).padStart(2, "0");
				return { id: day, text: day };
			});
		} else if (part === "year") {
			const endYear = 2007;
			const startYear = 1920;
			const yearCount = endYear - startYear + 1;
			return Array.from({ length: yearCount }, (_, i) => {
				const year = String(endYear - i);
				return { id: year, text: year };
			});
		}
		return [];
	}

	renderTextarea(question, response) {
		return `
			<div class="quiz-question-section">
				<textarea id="question-${question.id}" class="quiz-textarea" rows="4"
					placeholder="${question.placeholder || "Type your answer here..."}">${response.answer || ""}</textarea>
			</div>
		`;
	}

	renderRating(question, response) {
		return `
			<div class="quiz-spacing-container">
				<input type="range" id="question-${question.id}" class="quiz-range"
					min="1" max="10" step="1" value="${response.answer || 5}">
				<div class="quiz-range-labels">
                    <span>1</span><span>5</span><span>10</span>
				</div>
			</div>
		`;
	}

	renderDateInput(question, response) {
		return `
            <div class="quiz-question-section">
                <input type="date" id="question-${question.id}" class="quiz-input"
                    placeholder="${question.helpText || "MM/DD/YYYY"}"
                    value="${response.answer || ""}"
                    aria-describedby="error-${question.id}">
                ${this._getErrorElement(question.id)}
                ${question.helpText ? `<p class="quiz-text-sm">${question.helpText}</p>` : ""}
            </div>
        `;
	}

	_getCheckmarkSVG() {
		return `<div class="quiz-checkmark">
            <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M9.79158 18.75C4.84404 18.75 0.833252 14.7393 0.833252 9.79168C0.833252 4.84413 4.84404 0.833344 9.79158 0.833344C14.7392 0.833344 18.7499 4.84413 18.7499 9.79168C18.7499 14.7393 14.7392 18.75 9.79158 18.75ZM13.7651 7.82516C14.0598 7.47159 14.012 6.94613 13.6584 6.65148C13.3048 6.35685 12.7793 6.40462 12.4848 6.75818L8.90225 11.0572L7.04751 9.20243C6.72207 8.87701 6.19444 8.87701 5.86899 9.20243C5.54356 9.52784 5.54356 10.0555 5.86899 10.3809L8.369 12.8809C8.53458 13.0465 8.76208 13.1348 8.996 13.1242C9.22992 13.1135 9.44858 13.005 9.59842 12.8252L13.7651 7.82516Z" fill="#418865"/>
            </svg>
        </div>`;
	}

	goToPreviousStep() {
		if (this.currentStepIndex <= 0) return;

		this.currentStepIndex--;
		this.currentQuestionIndex = 0;
		this.renderCurrentStep();
		this.updateNavigation();
	}

	goToNextStep() {
		const currentStep = this.getCurrentStep();
		if (!currentStep) return;

		this.nextButton.disabled = false;

		if (currentStep.info && (!currentStep.questions || currentStep.questions.length === 0)) {
			if (this.currentStepIndex < this.quizData.steps.length - 1) {
				this.currentStepIndex++;
				this.currentQuestionIndex = 0;
				this.renderCurrentStep();
				this.updateNavigation();
			} else {
				this.finishQuiz();
			}
			return;
		}

		if (this.isFormStep(currentStep.id)) {
			if (!this._validateFormStep(currentStep)) return;

			// Check if this is the insurance step completion
			if (currentStep.id === "step-insurance") {
				// HIPAA COMPLIANT: No longer calling eligibility workflow directly from browser
				// Eligibility will be checked server-side by the user creation workflow
				console.log("📋 Insurance information collected - will be processed server-side for HIPAA compliance");
			}

			// Check if this is the contact step completion
			if (currentStep.id === "step-contact") {
				// HIPAA COMPLIANT: Only call user creation workflow
				// This will handle eligibility checking server-side to keep PHI data secure
				console.log("👤 Starting HIPAA-compliant user creation workflow (includes server-side eligibility check)");
				this._triggerUserCreationWorkflow();
				this.finishQuiz();
				return;
			}

			if (this.currentStepIndex < this.quizData.steps.length - 1) {
				this.currentStepIndex++;
				this.currentQuestionIndex = 0;
				this.renderCurrentStep();
				this.updateNavigation();
			} else {
				this.finishQuiz();
			}
			return;
		}

		if (currentStep.questions && this.currentQuestionIndex < currentStep.questions.length - 1) {
			this.currentQuestionIndex++;
			this.renderCurrentStep();
			this.updateNavigation();
			return;
		}

		if (this.currentStepIndex === this.quizData.steps.length - 1) {
			this.finishQuiz();
		} else {
			this.currentStepIndex++;
			this.currentQuestionIndex = 0;
			this.renderCurrentStep();
			this.updateNavigation();
		}
	}

	updateNavigation() {
		const step = this.getCurrentStep();
		if (!step) {
			this.nextButton.disabled = true;
			return;
		}

		const isFormStep = this.isFormStep(step.id);
		const currentQuestion = step.questions?.[this.currentQuestionIndex];

		// Always show navigation for non-required multiple choice questions
		const isNonRequiredMultipleChoice = currentQuestion?.type === "multiple-choice" && !currentQuestion.required;
		const isCurrentQuestionAutoAdvance = currentQuestion && this._shouldAutoAdvance(currentQuestion);

		const shouldShowNavigation = isNonRequiredMultipleChoice || !isCurrentQuestionAutoAdvance || isFormStep;
		this._setNavigationVisibility(shouldShowNavigation);

		if (!shouldShowNavigation) return;

		const isLastStep = this.currentStepIndex === this.quizData.steps.length - 1;
		const isLastQuestionInStep = isFormStep ? true : step.questions ? this.currentQuestionIndex === step.questions.length - 1 : true;

		if (isLastStep && isLastQuestionInStep) {
			this.nextButton.innerHTML = step.ctaText || "Finish Quiz";
		} else {
			this.nextButton.innerHTML = this._getStepButtonText(step);
		}

		if (isFormStep && step.questions) {
			this._setNavigationVisibility(false);
			const formButton = this.questionContainer.querySelector("#quiz-form-next-button");
			if (formButton) {
				formButton.disabled = this.submitting;
			}
			return;
		}

		const hasAnswer = this._hasValidAnswer(step);
		this.nextButton.disabled = !hasAnswer || this.submitting;
	}

	_getStepButtonText(step) {
		const question = step.questions[this.currentQuestionIndex];

		// Handle multiple choice questions that are not required
		if (question?.type === "multiple-choice" && !question.required) {
			const response = this.responses.find(r => r.questionId === question.id);
			const hasSelection = response && response.answer;
			return hasSelection ? step.ctaText || "Continue" : "Skip";
		}

		// Handle checkbox questions (like medical step)
		if (question?.type === "checkbox") {
			const response = this.responses.find(r => r.questionId === question.id);
			const hasSelection = response && Array.isArray(response.answer) && response.answer.length > 0;
			return hasSelection ? step.ctaText || "Continue" : "Skip";
		}

		return step.ctaText || "Continue";
	}

	_hasValidAnswer(step) {
		if (step.info && (!step.questions || step.questions.length === 0)) {
			return true;
		}

		if (step.questions?.length > 0) {
			const question = step.questions[this.currentQuestionIndex];
			if (!question) return false;

			if (!question.required) return true;

			const response = this.responses.find(r => r.questionId === question.id);
			if (!response || response.answer === null || response.answer === undefined) {
				return false;
			}

			if (question.type === "checkbox") {
				return Array.isArray(response.answer) && response.answer.length > 0;
			}

			if (typeof response.answer === "string") {
				return response.answer.trim() !== "";
			}

			return true;
		}

		return false;
	}

	_shouldAutoAdvance(question) {
		// Don't auto-advance multiple choice if it's not required
		if (question.type === "multiple-choice" && !question.required) {
			return false;
		}
		return question.type === "multiple-choice" || question.type === "dropdown";
	}

	handleAnswer(answer) {
		if (!this.quizData) return;

		const step = this.getCurrentStep();
		if (!step) return;

		if (step.questions?.length > 0) {
			const question = step.questions[this.currentQuestionIndex];
			if (!question) return;

			this._updateResponse(question.id, answer, step.id);

			if (this._shouldAutoAdvance(question)) {
				this._handleAutoAdvance(answer);
			} else if (question.type === "checkbox") {
				this._updateCheckboxVisualState(question, answer);
			} else {
				this.renderCurrentStep();
			}
		} else if (step.info) {
			this._updateResponse(step.id, answer || "info-acknowledged", step.id);
			this.nextButton.disabled = false;
		}

		this.updateNavigation();
	}

	handleFormAnswer(questionId, answer) {
		const step = this.getCurrentStep();
		if (step?.questions) {
			this._updateResponse(questionId, answer, step.id);
		}
	}

	_updateResponse(questionId, answer, stepId) {
		const responseIndex = this.responses.findIndex(r => r.questionId === questionId);
		if (responseIndex !== -1) {
			this.responses[responseIndex].answer = answer;
		} else {
			this.responses.push({ stepId, questionId, answer });
		}
	}

	_handleAutoAdvance(answer) {
		const allOptionButtons = this.questionContainer.querySelectorAll(".quiz-option-button");
		allOptionButtons.forEach(button => {
			button.classList.remove("selected", "processing", "auto-advance-feedback");
			const existingCheckmark = button.querySelector(".quiz-checkmark");
			if (existingCheckmark) {
				existingCheckmark.remove();
			}
		});

		const selectedElement = this.questionContainer.querySelector(`input[value="${answer}"]:checked`);
		if (selectedElement) {
			const optionButton = selectedElement.closest(".quiz-option-card")?.querySelector(".quiz-option-button");
			if (optionButton) {
				optionButton.classList.add("selected", "processing");
				optionButton.innerHTML += this._getCheckmarkSVG();
				optionButton.classList.add("auto-advance-feedback");
			}
		}

		setTimeout(() => {
			this.goToNextStep();
		}, this.config.autoAdvanceDelay || 600);
	}

	_updateCheckboxVisualState(question, answer) {
		if (!Array.isArray(answer)) return;

		const allCheckboxes = this.questionContainer.querySelectorAll(`input[name="question-${question.id}"]`);
		allCheckboxes.forEach(checkbox => {
			const optionCard = checkbox.closest(".quiz-option-card");
			const optionButton = optionCard?.querySelector(".quiz-option-button");

			if (optionButton) {
				const shouldBeSelected = answer.includes(checkbox.value);
				const isCurrentlySelected = optionButton.classList.contains("selected");

				if (shouldBeSelected !== isCurrentlySelected) {
					if (shouldBeSelected) {
						optionButton.classList.add("selected");
						checkbox.checked = true;
						if (!optionButton.querySelector(".quiz-checkmark")) {
							optionButton.innerHTML += this._getCheckmarkSVG();
						}
					} else {
						optionButton.classList.remove("selected");
						checkbox.checked = false;
						const checkmark = optionButton.querySelector(".quiz-checkmark");
						if (checkmark) {
							checkmark.remove();
						}
					}
				}
			}
		});

		this.updateNavigation();
	}

	_handleStepAcknowledgment(step) {
		if (!step.info) return;

		const infoResponse = this.responses.find(r => r.stepId === step.id && r.questionId === step.id);
		if (infoResponse) {
			infoResponse.answer = "info-acknowledged";
		} else {
			this.responses.push({
				stepId: step.id,
				questionId: step.id,
				answer: "info-acknowledged"
			});
		}

		if (!step.questions || step.questions.length === 0) {
			setTimeout(() => {
				this.nextButton.disabled = false;
			}, 0);
		}
	}

	_attachStepEventListeners(step) {
		if (!step.questions || step.questions.length === 0) return;

		if (this.isFormStep(step.id)) {
			step.questions.forEach(question => {
				this._attachFormQuestionListener(question);
			});

			const formButton = this.questionContainer.querySelector("#quiz-form-next-button");
			if (formButton) {
				formButton.removeEventListener("click", this.formButtonHandler);
				this.formButtonHandler = () => {
					if (!formButton.disabled) {
						this.goToNextStep();
					}
				};
				formButton.addEventListener("click", this.formButtonHandler);
			}
		} else {
			const currentQuestion = step.questions[this.currentQuestionIndex];
			if (currentQuestion) {
				this._attachQuestionEventListeners(currentQuestion);
			}
		}
	}

	_attachQuestionEventListeners(question) {
		if (!question) return;

		const handlers = {
			"multiple-choice": () => this._attachInputGroupListeners(question, "change", input => this.handleAnswer(input.value)),
			checkbox: () => this._attachCheckboxListeners(question),
			dropdown: () => this._attachDropdownListeners(question),
			"date-part": () => this._attachDropdownListeners(question),
			text: () => this._attachTextInputListeners(question),
			date: () => this._attachTextInputListeners(question),
			textarea: () => this._attachSingleInputListener(question, "input", input => this.handleAnswer(input.value)),
			rating: () => this._attachSingleInputListener(question, "input", input => this.handleAnswer(parseInt(input.value, 10))),
			"payer-search": () => this._attachPayerSearchListeners(question)
		};

		handlers[question.type]?.();
	}

	_attachInputGroupListeners(question, eventType, callback) {
		const inputs = this.questionContainer.querySelectorAll(`input[name="question-${question.id}"]`);
		inputs.forEach(input => input.addEventListener(eventType, () => callback(input)));
	}

	_attachSingleInputListener(question, eventType, callback) {
		const input = this.questionContainer.querySelector(`#question-${question.id}`);
		if (input) input.addEventListener(eventType, () => callback(input));
	}

	_attachCheckboxListeners(question) {
		const checkboxInputs = this.questionContainer.querySelectorAll(`input[name="question-${question.id}"]`);
		const getSelectedValues = () =>
			Array.from(checkboxInputs)
				.filter(cb => cb.checked)
				.map(cb => cb.value);

		checkboxInputs.forEach(input => {
			input.removeEventListener("change", input._changeHandler);
			input._changeHandler = () => this.handleAnswer(getSelectedValues());
			input.addEventListener("change", input._changeHandler);
		});
	}

	_attachDropdownListeners(question) {
		const dropdown = this.questionContainer.querySelector(`#question-${question.id}`);
		if (!dropdown) return;

		dropdown.addEventListener("change", () => {
			this.handleFormAnswer(question.id, dropdown.value);
			this._updateDropdownColor(dropdown);
			this._clearFieldError(question.id, dropdown);
		});
		this._updateDropdownColor(dropdown);
	}

	_attachTextInputListeners(question) {
		const textInput = this.questionContainer.querySelector(`#question-${question.id}`);
		if (!textInput) return;

		const validate = () => {
			const validationResult = this._validateFieldValue(question, textInput.value);
			this._updateFieldValidationState(textInput, question, validationResult);
		};

		this._removeExistingHandlers(textInput, ["input", "blur", "change"]);

		textInput._inputHandler = () => this.handleFormAnswer(question.id, textInput.value);
		textInput._blurHandler = validate;
		textInput._changeHandler = validate;

		["input", "blur", "change"].forEach((event, i) => {
			const handler = [textInput._inputHandler, textInput._blurHandler, textInput._changeHandler][i];
			textInput.addEventListener(event, handler);
		});
	}

	_removeExistingHandlers(element, events) {
		events.forEach(event => element.removeEventListener(event, element[`_${event}Handler`]));
	}

	_attachFormQuestionListener(question) {
		const formHandlers = {
			dropdown: () => this._attachDropdownListeners(question),
			"date-part": () => this._attachDropdownListeners(question),
			text: () => this._attachTextInputListeners(question),
			date: () => this._attachTextInputListeners(question),
			checkbox: () => this._attachFormCheckboxListeners(question),
			"payer-search": () => this._attachPayerSearchFormListeners(question)
		};

		formHandlers[question.type]?.();
	}

	_attachFormCheckboxListeners(question) {
		const checkboxInputs = this.questionContainer.querySelectorAll(`input[name="question-${question.id}"]`);
		const getFormValue = input =>
			question.options.length === 1
				? input.checked
					? [input.value]
					: []
				: Array.from(checkboxInputs)
						.filter(cb => cb.checked)
						.map(cb => cb.value);

		checkboxInputs.forEach(input => {
			input.onclick = () => this.handleFormAnswer(question.id, getFormValue(input));
		});
	}

	_validateFormStep(step) {
		const validationErrors = step.questions.map(question => this._validateQuestionInForm(question)).filter(error => error);

		if (validationErrors.length > 0) {
			this._displayValidationErrors(validationErrors);
			return false;
		}
		return true;
	}

	_validateQuestionInForm(question) {
		const response = this.responses.find(r => r.questionId === question.id);
		const currentValue = response?.answer;

		if (question.required && this._isEmptyValue(currentValue, question.type)) {
			return {
				questionId: question.id,
				message: this.quizData.ui?.errorMessages?.validationRequired || "This field is required"
			};
		}

		if (currentValue && question.type !== "payer-search") {
			const validationResult = this._validateFieldValue(question, currentValue);
			if (!validationResult.isValid) {
				return {
					questionId: question.id,
					message: validationResult.errorMessage
				};
			}
		}

		return null;
	}

	_isEmptyValue(value, questionType) {
		if (!value) return true;
		if (questionType === "checkbox") return !Array.isArray(value) || value.length === 0;
		if (typeof value === "string") return value.trim() === "";
		return false;
	}

	_displayValidationErrors(validationErrors) {
		let firstInvalidField = null;

		validationErrors.forEach((error, index) => {
			const { input, errorEl } = this._getValidationElements(error.questionId);

			if (input) {
				input.classList.add("quiz-input-error");
				input.classList.remove("quiz-input-valid");
				if (index === 0) firstInvalidField = input;
			}

			if (errorEl) {
				errorEl.textContent = error.message;
				errorEl.classList.remove("quiz-error-hidden");
				errorEl.classList.add("quiz-error-visible");
			}
		});

		if (firstInvalidField) {
			this._scrollToInvalidField(firstInvalidField);
		}
	}

	_getValidationElements(questionId) {
		return {
			input: this.questionContainer.querySelector(`#question-${questionId}`),
			errorEl: this.questionContainer.querySelector(`#error-${questionId}`)
		};
	}

	_validateFieldValue(question, value) {
		const errorMessages = this.quizData.ui?.errorMessages || {};

		if (question.type === "payer-search") {
			return this._validateRequired(question, value) ? { isValid: true, errorMessage: null } : { isValid: false, errorMessage: errorMessages.validationInsurance || "Please select an insurance plan" };
		}

		if (question.required && !this._hasValue(value)) {
			return { isValid: false, errorMessage: errorMessages.validationRequired || "This field is required" };
		}

		if (!this._hasValue(value)) {
			return { isValid: true, errorMessage: null };
		}

		return this._validateFieldFormat(question, value.trim(), errorMessages);
	}

	_hasValue(value) {
		return value && (typeof value !== "string" || value.trim() !== "");
	}

	_validateRequired(question, value) {
		return !question.required || this._hasValue(value);
	}

	_validateFieldFormat(question, trimmedValue, errorMessages) {
		const patterns = this.quizData.validation?.patterns || {};
		const validations = {
			q4: { pattern: patterns.memberId || "^.{6,20}$", message: errorMessages.validationMemberId || "Minimum 6 characters" },
			q4_group: { pattern: patterns.groupNumber || "^$|^.{5,15}$", message: errorMessages.validationGroupNumber || "Minimum 5 characters" },
			q7: { pattern: patterns.name || "^[A-Za-z\\s]{1,100}$", message: errorMessages.validationName || "Use only A–Z letters and spaces" },
			q8: { pattern: patterns.name || "^[A-Za-z\\s]{1,100}$", message: errorMessages.validationName || "Use only A–Z letters and spaces" },
			q9: { pattern: patterns.email || "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", message: errorMessages.validationEmail || "Enter valid email" },
			q10: { custom: () => this._validatePhoneNumber(trimmedValue), message: errorMessages.validationPhone || "Enter valid phone" }
		};

		const validation = validations[question.id];
		if (validation) {
			const isValid = validation.custom ? validation.custom() : new RegExp(validation.pattern).test(trimmedValue);
			return isValid ? { isValid: true, errorMessage: null } : { isValid: false, errorMessage: validation.message };
		}

		if (question.validation?.pattern) {
			const isValid = new RegExp(question.validation.pattern).test(trimmedValue);
			return isValid ? { isValid: true, errorMessage: null } : { isValid: false, errorMessage: question.validation.message || "Invalid format" };
		}

		return { isValid: true, errorMessage: null };
	}

	_validatePhoneNumber(phone) {
		const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, "");

		const patterns = [
			/^[0-9]{10}$/,
			/^1[0-9]{10}$/,
			/^\+1[0-9]{10}$/,
			/^\+[1-9][0-9]{7,14}$/,
			/^\+[0-9]{8,15}$/,
			/^[0-9]{3}-[0-9]{3}-[0-9]{4}$/,
			/^\([0-9]{3}\)\s[0-9]{3}-[0-9]{4}$/,
			/^[0-9]{3}\.[0-9]{3}\.[0-9]{4}$/,
			/^[0-9]{3}\s[0-9]{3}\s[0-9]{4}$/,
			/^\+1\s[0-9]{3}-[0-9]{3}-[0-9]{4}$/,
			/^1-[0-9]{3}-[0-9]{3}-[0-9]{4}$/
		];

		return patterns.some(pattern => pattern.test(cleanPhone)) || patterns.some(pattern => pattern.test(phone));
	}

	_updateFieldValidationState(input, question, validationResult) {
		const errorEl = this.questionContainer.querySelector(`#error-${question.id}`);
		const isValid = validationResult.isValid;

		input.classList.toggle("quiz-input-error", !isValid);
		input.classList.toggle("quiz-input-valid", isValid);

		if (errorEl) {
			if (isValid) {
				errorEl.classList.add("quiz-error-hidden");
				errorEl.classList.remove("quiz-error-visible");
			} else if (validationResult.errorMessage) {
				errorEl.textContent = validationResult.errorMessage;
				errorEl.classList.remove("quiz-error-hidden");
				errorEl.classList.add("quiz-error-visible");
			}
		}

		return isValid;
	}

	_clearFieldError(questionId, input) {
		if (input.value && input.value !== "") {
			const errorEl = this.questionContainer.querySelector(`#error-${questionId}`);
			if (errorEl) {
				input.classList.remove("quiz-input-error");
				input.classList.add("quiz-input-valid");
				errorEl.classList.add("quiz-error-hidden");
				errorEl.classList.remove("quiz-error-visible");
			}
		}
	}

	_updateDropdownColor(dropdown) {
		const hasSelection = dropdown.value && dropdown.value !== dropdown.options[0].value;
		dropdown.style.color = hasSelection ? "var(--quiz-text-primary)" : "#B0B0B0";
		dropdown.classList.toggle("quiz-dropdown-selected", hasSelection);
	}

	_scrollToInvalidField(fieldElement) {
		if (!fieldElement) return;

		const isMobile = window.innerWidth <= 768;
		if (isMobile) {
			const fieldRect = fieldElement.getBoundingClientRect();
			const offset = 100;
			const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
			const targetScrollY = currentScrollY + fieldRect.top - offset;

			window.scrollTo({
				top: Math.max(0, targetScrollY),
				behavior: "smooth"
			});

			setTimeout(() => {
				if (fieldElement.focus) {
					fieldElement.focus();
				}
			}, 300);
		}
	}

	async finishQuiz() {
		const resultUrl = this.container.getAttribute("data-result-url") || this.container.getAttribute("data-booking-url") || "/quiz-complete";

		try {
			this.submitting = true;
			this.nextButton.disabled = true;

			this._toggleElement(this.navigationButtons, false);
			this._toggleElement(this.progressSection, false);

			// Start the comprehensive loading sequence
			await this._showComprehensiveLoadingSequence();

			// Check if eligibility workflow is complete
			let eligibilityResult = null;
			if (this.eligibilityWorkflowPromise) {
				if (this.eligibilityWorkflowResult) {
					// Already completed
					eligibilityResult = this.eligibilityWorkflowResult;
					console.log("Using cached eligibility result:", eligibilityResult);
				} else {
					// Still running - wait for it
					try {
						eligibilityResult = await this.eligibilityWorkflowPromise;
						console.log("Waited for eligibility result:", eligibilityResult);
					} catch (error) {
						console.error("Eligibility workflow failed:", error);
						eligibilityResult = this._createErrorEligibilityData("Eligibility check failed");
					}
				}
			} else {
				// No eligibility check was triggered - use default processing status
				eligibilityResult = this._createProcessingEligibilityData();
				console.log("No eligibility workflow, using processing status");
			}

			// Process the result consistently
			let finalResult;
			if (eligibilityResult) {
				// Check if this is already processed eligibility data or a raw webhook response
				if (eligibilityResult.eligibilityStatus && typeof eligibilityResult.eligibilityStatus === "string") {
					// This is already processed eligibility data - use it directly
					finalResult = eligibilityResult;
					console.log("Using eligibility result directly (already processed):", finalResult);
				} else {
					// This is a raw webhook response - process it
					finalResult = this._processWebhookResult(eligibilityResult);
					console.log("Processed webhook result:", finalResult);
				}
			} else {
				// No eligibility check was run - use default processing status
				finalResult = this._createProcessingEligibilityData();
				console.log("No eligibility result, using processing status");
			}

			console.log("Processing eligibility result in finishQuiz:", {
				eligibilityResult: finalResult,
				hasError: !!finalResult?.error,
				status: finalResult?.eligibilityStatus,
				isEligible: finalResult?.isEligible
			});

			// Test mode comprehensive finish notification
			if (this.isTestMode) {
				const workflowStatus = this.eligibilityWorkflowPromise ? (this.eligibilityWorkflowResult ? "✅ Completed" : "⏳ In Progress") : "❌ Not Started";

				const userCreationStatus = this.userCreationWorkflowPromise ? "✅ Started" : "❌ Not Started";

				this._showBackgroundProcessNotification(
					`
					🧪 TEST MODE - Quiz Completion Status<br>
					• Eligibility Workflow: ${workflowStatus}<br>
					• User Creation: ${userCreationStatus}<br>
					• Final Status: ${finalResult?.eligibilityStatus || "Unknown"}<br>
					• Is Eligible: ${finalResult?.isEligible}<br>
					• Result URL: ${resultUrl}<br>
					• Total Responses: ${this.responses?.length || 0}
				`,
					"info"
				);
			}

			console.log("Showing results with data:", {
				resultData: finalResult,
				eligibilityStatus: finalResult?.eligibilityStatus,
				webhookSuccess: true
			});

			this.showResults(resultUrl, true, finalResult);
		} catch (error) {
			console.error("Error finishing quiz:", error);

			// Test mode error notification
			if (this.isTestMode) {
				this._showBackgroundProcessNotification(
					`
					🧪 TEST MODE - Quiz Finish Error<br>
					❌ ${error.message}<br>
					• Check console for details
				`,
					"error"
				);
			}

			this.showResults(resultUrl, false, null, error.message);
		}
	}

	// Comprehensive loading sequence with animated status updates
	async _showComprehensiveLoadingSequence() {
		// Show the loading screen with progress steps
		this._showLoadingScreen();

		const loadingSteps = [
			{ title: "Processing Your Answers", description: "Analyzing your health information..." },
			{ title: "Checking Insurance Coverage", description: "Verifying your benefits..." },
			{ title: "Finding Your Dietitian", description: "Matching you with the right expert..." },
			{ title: "Preparing Your Results", description: "Finalizing your personalized plan..." }
		];

		for (let i = 0; i < loadingSteps.length; i++) {
			const step = loadingSteps[i];
			this._updateLoadingStep(step);

			// Wait between steps for realistic loading feel
			await new Promise(resolve => setTimeout(resolve, 900));
		}

		// Final completion step
		this._updateLoadingStep({ title: "Almost Ready!", description: "Preparing your personalized results..." });

		// Final wait before showing results
		await new Promise(resolve => setTimeout(resolve, 800));
	}

	_showLoadingScreen() {
		// Hide quiz content and show loading screen
		this._toggleElement(this.questions, false);
		this._toggleElement(this.results, false);
		this._toggleElement(this.error, false);

		// Show loading container (using the correct property name 'loading')
		if (this.loading) {
			this.loading.innerHTML = `
				<div class="quiz-comprehensive-loading">
					<div class="quiz-loading-content">
						<div class="quiz-loading-icon">
							<div class="quiz-loading-spinner-large"></div>
						</div>
						<div class="quiz-loading-step">
							<h3 class="quiz-loading-step-title">Starting...</h3>
							<p class="quiz-loading-step-description">Preparing to process your information</p>
						</div>
					</div>
				</div>
			`;
			this._toggleElement(this.loading, true);
		} else {
			// Fallback: update next button
			this.nextButton.innerHTML = `<div class="quiz-spinner"></div>Processing...`;
		}
	}

	_updateLoadingStep(step) {
		const titleElement = document.querySelector(".quiz-loading-step-title");
		const descriptionElement = document.querySelector(".quiz-loading-step-description");

		if (titleElement && descriptionElement) {
			// Animate out
			titleElement.style.opacity = "0";
			descriptionElement.style.opacity = "0";

			setTimeout(() => {
				// Update content
				titleElement.textContent = step.title;
				descriptionElement.textContent = step.description;

				// Animate in
				titleElement.style.opacity = "1";
				descriptionElement.style.opacity = "1";
			}, 300);
		}
	}

	// HIPAA COMPLIANCE: This method has been removed to prevent PHI data from being sent directly to eligibility workflow from browser
	// Eligibility checking is now handled server-side within the user creation workflow
	_triggerEligibilityWorkflow() {
		console.warn("⚠️ HIPAA COMPLIANCE: Direct eligibility workflow calls from browser are disabled. Eligibility will be checked server-side.");
		// Show user-friendly notification
		this._showBackgroundProcessNotification("🔒 Insurance verification will be processed securely server-side", "info");
	}

	_triggerUserCreationWorkflow() {
		try {
			// HIPAA COMPLIANT: Start orchestrator workflow with status tracking
			console.log("🔒 Starting HIPAA-compliant orchestrator workflow with status tracking");
			this._startOrchestratorWorkflow();
		} catch (error) {
			console.error("Failed to trigger orchestrator workflow:", error);
		}
	}

	// =======================================================================
	// Orchestrator Workflow Methods (HIPAA Compliant)
	// =======================================================================

	/**
	 * Starts the orchestrator workflow (simplified version)
	 * This method triggers the orchestrator cloud function which coordinates
	 * all workflows while maintaining HIPAA compliance.
	 */
	_startOrchestratorWorkflow() {
		const orchestratorUrl = this._getOrchestratorUrl();
		const payload = this._buildWorkflowPayload();

		console.log("🚀 Starting orchestrator workflow...", { orchestratorUrl, payload });

		// Show loading state
		this._showLoadingScreen();

		// Call orchestrator and handle response directly (no status polling)
		this._submitOrchestratorToWebhook(orchestratorUrl, payload)
			.then(result => {
				console.log("✅ Orchestrator workflow completed:", result);
				this._handleWorkflowCompletion(result);
			})
			.catch(error => {
				console.error("❌ Orchestrator workflow failed:", error);
				this._handleWorkflowError(error);
			});
	}

	/**
	 * Handles successful workflow completion
	 */
	_handleWorkflowCompletion(result) {
		console.log("Processing workflow completion result:", result);

		// Stop loading messages
		this._stopLoadingMessages();

		// Show results based on the orchestrator response
		if (result && result.success) {
			const resultData = result.data || result;
			this.showResults(
				this.config.resultUrl,
				true, // webhookSuccess
				resultData,
				result.message || "Account creation completed successfully!"
			);
		} else {
			this.showResults(
				this.config.resultUrl,
				false, // webhookSuccess
				null,
				result.error || "There was an error processing your request."
			);
		}
	}

	/**
	 * Handles workflow errors
	 */
	_handleWorkflowError(error) {
		console.error("Handling workflow error:", error);

		// Stop loading messages
		this._stopLoadingMessages();

		// Show error results
		this.showResults(
			this.config.resultUrl,
			false, // webhookSuccess
			null,
			error.message || error.error || "There was an error processing your request."
		);
	}

	/**
	 * Gets the orchestrator URL
	 */
	_getOrchestratorUrl() {
		const container = document.getElementById('quiz-container');
		return container?.dataset?.orchestratorUrl || 'https://workflow-orchestrator-xxn52lyizq-uc.a.run.app';
	}

	// =======================================================================
	// Status Polling Methods (Simplified - Mock Implementation)
	// =======================================================================

	/**
	 * Start mock status polling for enhanced user experience
	 * This provides visual feedback while the orchestrator runs
	 */
	_startStatusPolling(statusTrackingId) {
		console.log("🔄 Starting mock status polling for:", statusTrackingId);

		this.statusTrackingId = statusTrackingId;
		this.pollingAttempts = 0;
		this.maxPollingAttempts = 20; // 40 seconds max

		// Show initial status message
		this._showBackgroundProcessNotification("🚀 Starting user creation process...", "info");

		// Start polling every 2 seconds for visual feedback
		this.statusPollingInterval = setInterval(() => {
			this._pollWorkflowStatus();
		}, 2000);
	}

	/**
	 * Mock status polling to provide user feedback
	 */
	async _pollWorkflowStatus() {
		if (!this.statusTrackingId) {
			this._stopStatusPolling();
			return;
		}

		this.pollingAttempts++;

		try {
			const statusUrl = this._getStatusPollingUrl();
			const response = await fetch(statusUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					statusTrackingId: this.statusTrackingId
				})
			});

			if (response.ok) {
				const statusData = await response.json();
				console.log("📊 Status update:", statusData);

				if (statusData.success && statusData.statusData) {
					this._updateWorkflowStatus(statusData.statusData);

					// Stop polling when completed or max attempts reached
					if (statusData.statusData.completed || this.pollingAttempts >= this.maxPollingAttempts) {
						this._stopStatusPolling();
					}
				}
			} else {
				console.warn("Status polling failed:", response.status);
				// Continue polling on failures (non-critical)
			}
		} catch (error) {
			console.warn("Status polling error:", error);
			// Continue polling on errors (non-critical)
		}

		// Stop if we've reached max attempts
		if (this.pollingAttempts >= this.maxPollingAttempts) {
			this._stopStatusPolling();
		}
	}

	/**
	 * Update UI with mock status information
	 */
	_updateWorkflowStatus(statusData) {
		if (!statusData) return;

		console.log("📱 Updating UI with status:", statusData);

		// Update loading progress if available
		if (statusData.progress !== undefined) {
			this._updateLoadingProgress(statusData.progress);
		}

		// Show status message to user
		if (statusData.message) {
			this._showBackgroundProcessNotification(statusData.message, "info");
		}

		// Handle completion
		if (statusData.completed) {
			console.log("✅ Workflow completed according to status");
			// The actual workflow completion will be handled by the orchestrator response
		}
	}

	/**
	 * Stop status polling
	 */
	_stopStatusPolling() {
		if (this.statusPollingInterval) {
			clearInterval(this.statusPollingInterval);
			this.statusPollingInterval = null;
			console.log("⏹️ Status polling stopped");
		}
	}

	/**
	 * Get the status polling URL
	 */
	_getStatusPollingUrl() {
		const container = document.getElementById('quiz-container');
		return container?.dataset?.statusPollingUrl || 'https://workflow-status-polling-xxn52lyizq-uc.a.run.app';
	}

	/**
	 * Update loading progress indicator
	 */
	_updateLoadingProgress(progress) {
		// Find progress elements and update them
		const progressBars = document.querySelectorAll('.loading-progress-bar, .progress-bar');
		const progressTexts = document.querySelectorAll('.loading-progress-text, .progress-text');

		progressBars.forEach(bar => {
			bar.style.width = `${progress}%`;
		});

		progressTexts.forEach(text => {
			text.textContent = `${progress}%`;
		});
	}

	// =======================================================================
	// Orchestrator Helper Methods
	// =======================================================================

	/**
	 * Build payload for the orchestrator workflow
	 */
	_buildWorkflowPayload() {
		const payload = {
			timestamp: Date.now(),
			hasInsurance: this._hasInsurance(),
			customerEmail: this._getResponseValue('customer_email'),
			responses: this.responses || []
		};

		// Add form data if available
		const formData = this._collectFormData();
		if (formData && Object.keys(formData).length > 0) {
			payload.formData = formData;
		}

		// Add insurance data if user has insurance
		if (payload.hasInsurance) {
			const insuranceData = this._collectInsuranceData();
			if (insuranceData) {
				payload.insuranceData = insuranceData;
			}
		}

		console.log("Built workflow payload:", payload);
		return payload;
	}

	/**
	 * Submit orchestrator payload to webhook
	 */
	async _submitOrchestratorToWebhook(url, payload) {
		try {
			console.log("Submitting to orchestrator:", { url, payload });

			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			const result = await response.json();
			console.log("Orchestrator response:", result);

			return result;
		} catch (error) {
			console.error("Orchestrator submission failed:", error);
			throw error;
		}
	}

	/**
	 * Check if user has insurance
	 */
	_hasInsurance() {
		const insuranceResponse = this._getResponseValue('has_insurance');
		return insuranceResponse === 'yes' || insuranceResponse === true || insuranceResponse === 'Yes';
	}

	/**
	 * Get response value by question ID
	 */
	_getResponseValue(questionId) {
		const response = this.responses.find(r => r.questionId === questionId);
		return response ? response.answer : null;
	}

	/**
	 * Collect form data from responses
	 */
	_collectFormData() {
		const formData = {};

		// Map common form fields
		const fieldMappings = {
			'customer_first_name': 'firstName',
			'customer_last_name': 'lastName',
			'customer_email': 'email',
			'customer_phone': 'phone',
			'customer_address': 'address',
			'customer_city': 'city',
			'customer_state': 'state',
			'customer_zip': 'zipCode',
			'date_of_birth_month': 'birthMonth',
			'date_of_birth_day': 'birthDay',
			'date_of_birth_year': 'birthYear'
		};

		this.responses.forEach(response => {
			const mappedField = fieldMappings[response.questionId];
			if (mappedField) {
				formData[mappedField] = response.answer;
			}
		});

		return formData;
	}

	/**
	 * Collect insurance data from responses
	 */
	_collectInsuranceData() {
		const insuranceData = {};

		// Map insurance fields
		const insuranceFieldMappings = {
			'insurance_provider': 'provider',
			'form_member_id': 'memberId',
			'subscriber_group_id': 'groupId',
			'plan_group_id': 'planGroupId'
		};

		this.responses.forEach(response => {
			const mappedField = insuranceFieldMappings[response.questionId];
			if (mappedField) {
				insuranceData[mappedField] = response.answer;
			}
		});

		return Object.keys(insuranceData).length > 0 ? insuranceData : null;
	}

	_showBackgroundProcessNotification(text, type = "info", priority = null) {
		console.log("📢 Creating notification:", { text: text.substring(0, 50) + "...", type, priority });

		// Only show notifications if we have a container
		if (!this.questionContainer) {
			console.log("❌ No questionContainer found, skipping notification");
			return;
		}

		// Delegate completely to the modular notification system
		return this.notificationManager.show(text, type, priority);
	}

	clearNotifications() {
		return this.notificationManager.clear();
	}

	exportNotifications(format = "text", filter = "all") {
		return this.notificationManager.exportNotifications(format, filter);
	}

	getCurrentStep() {
		return this.quizData?.steps?.[this.currentStepIndex] || null;
	}

	getCurrentQuestion() {
		const step = this.getCurrentStep();
		return step?.questions?.[this.currentQuestionIndex] || null;
	}

	getResponseForCurrentQuestion() {
		const step = this.getCurrentStep();
		const questionId = step.questions ? step.questions[this.currentQuestionIndex].id : step.id;

		return (
			this.responses.find(r => r.questionId === questionId) || {
				stepId: step.id,
				questionId: questionId,
				answer: null
			}
		);
	}

	isFormStep(stepId) {
		return this.config.formSteps?.includes(stepId) || false;
	}

	renderCurrentStep() {
		const step = this.getCurrentStep();
		if (!step) return;

		this.questionContainer.className = "quiz-question-container";
		this.questionContainer.classList.add(`quiz-step-${this.currentStepIndex + 1}`);
		this.questionContainer.classList.add(`quiz-step-${step.id}`);

		this._updateProgressBar();

		const stepHTML = this._generateStepHTML(step);
		this.questionContainer.innerHTML = stepHTML;

		this._handleStepAcknowledgment(step);
		this._attachStepEventListeners(step);
		this.updateNavigation();

		if (step.legal && !this.isFormStep(step.id)) {
			this._addLegalTextAfterNavigation(step.legal);
		}

		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	_updateProgressBar() {
		const progress = ((this.currentStepIndex + 1) / this.quizData.steps.length) * 100;
		if (this.progressBar) {
			this.progressBar.classList.add("quiz-progress-bar-animated");
			this.progressBar.style.setProperty("--progress-width", `${progress}%`);

			const progressIndicator = this.container.querySelector(".quiz-progress-indicator");
			if (progressIndicator) {
				const progressContainer = this.container.querySelector(".quiz-progress-container");
				const containerWidth = progressContainer?.offsetWidth || 480;
				const isMobile = window.innerWidth <= 768;
				const indicatorHalfWidth = isMobile ? 16 : 26;
				const indicatorPosition = (progress / 100) * containerWidth - indicatorHalfWidth;

				progressIndicator.style.left = `${indicatorPosition}px`;
				progressIndicator.classList.toggle("visible", progress > 0);
			}
		}
	}

	_generateStepHTML(step) {
		let stepHTML = `<div class="animate-fade-in">`;
		stepHTML += this._generateStepInfoHTML(step);

		if (step.questions?.length > 0) {
			stepHTML += this.isFormStep(step.id) ? this._generateFormStepHTML(step) : this._generateWizardStepHTML(step);
		} else if (!step.info) {
			stepHTML += `<p class="quiz-error-text">Step configuration error. Please contact support.</p>`;
		}

		stepHTML += "</div>";
		return stepHTML;
	}

	_generateStepInfoHTML(step) {
		if (!step.info) return "";

		return `
            <h3 class="quiz-title">${step.info.heading}</h3>
            <p class="quiz-text">${step.info.text}</p>
            ${step.info.subtext ? `<p class="quiz-subtext">${step.info.subtext}</p>` : ""}
        `;
	}

	_generateFormStepHTML(step) {
		const isLastStep = this.currentStepIndex === this.quizData.steps.length - 1;
		const buttonText = isLastStep ? step.ctaText || "Finish Quiz" : step.ctaText || "Continue";

		return `
            ${step.info?.formSubHeading ? `<h4 class="quiz-heading quiz-heading-mobile-outside">${step.info.formSubHeading}</h4>` : ""}
			<div class="quiz-form-container">
                ${step.info?.formSubHeading ? `<h4 class="quiz-heading quiz-heading-desktop-inside">${step.info.formSubHeading}</h4>` : ""}
				<div class="quiz-space-y-6">
					${this._processFormQuestions(step.questions)}
				</div>
				<button class="quiz-nav-button quiz-nav-button--primary quiz-form-button" id="quiz-form-next-button">
					${buttonText}
				</button>
				${step.legal ? `<p class="quiz-legal-form">${step.legal}</p>` : ""}
			</div>
		`;
	}

	_generateWizardStepHTML(step) {
		const question = step.questions[this.currentQuestionIndex];
		const response = this.getResponseForCurrentQuestion();

		if (!question) {
			return `<p class="quiz-error-text">Question not found. Please try again.</p>`;
		}

		let html = "";

		if (!step.info) {
			html += `
				<h3 class="quiz-title">${question.text}</h3>
				${question.helpText ? `<p class="quiz-text">${question.helpText}</p>` : ""}
			`;
		} else {
			html += `
				<div class="quiz-divider">
					<h4 class="quiz-heading">${question.text}</h4>
					${question.helpText ? `<p class="quiz-text-sm">${question.helpText}</p>` : ""}
				</div>
			`;
		}

		html += this._renderQuestionByType(question, response);
		return html;
	}

	_toggleElement(element, show) {
		element?.classList.toggle("hidden", !show);
	}

	_setNavigationVisibility(visible) {
		if (!this.navigationButtons) return;

		if (visible) {
			this.navigationButtons.classList.remove("quiz-navigation-hidden", "hidden");
			this.navigationButtons.classList.add("quiz-navigation-visible");
		} else {
			this.navigationButtons.classList.add("quiz-navigation-hidden", "hidden");
			this.navigationButtons.classList.remove("quiz-navigation-visible");
		}
	}

	_renderQuestionByType(question, response) {
		switch (question.type) {
			case "multiple-choice":
				return this.renderMultipleChoice(question, response);
			case "checkbox":
				return this.renderCheckbox(question, response);
			case "dropdown":
				return this.renderDropdown(question, response);
			case "payer-search":
				return this.renderPayerSearch(question, response);
			case "text":
				return this.renderTextInput(question, response);
			case "date":
				return this.renderDateInput(question, response);
			case "date-part":
				return this.renderDatePart(question, response);
			case "textarea":
				return this.renderTextarea(question, response);
			case "rating":
				return this.renderRating(question, response);
			default:
				return `<p class="quiz-error-text">Unsupported field type: ${question.type}</p>`;
		}
	}

	renderMultipleChoice(question, response) {
		return this._renderCardOptions(question, response, "radio");
	}

	renderCheckbox(question, response) {
		const selectedOptions = Array.isArray(response.answer) ? response.answer : [];

		if (question.id === "consent") {
			return this._renderSimpleCheckboxes(question, selectedOptions);
		}
		return this._renderCardOptions(question, response, "checkbox");
	}

	_renderCardOptions(question, response, inputType) {
		const selectedOptions = inputType === "checkbox" ? (Array.isArray(response.answer) ? response.answer : []) : null;
		const isSelected = option => (inputType === "checkbox" ? selectedOptions.includes(option.id) : response.answer === option.id);

		let html = '<div class="quiz-grid-2">';
		question.options.forEach(option => {
			const selected = isSelected(option);
			html += `
				<label for="${option.id}" class="quiz-option-card">
					<input type="${inputType}" id="${option.id}" name="question-${question.id}" value="${option.id}" class="quiz-sr-only" ${selected ? "checked" : ""}>
					<div class="quiz-option-button ${selected ? "selected" : ""}">
						<div class="quiz-option-text">
							<div class="quiz-option-text-content">${option.text}</div>
						</div>
						${selected ? this._getCheckmarkSVG() : ""}
					</div>
				</label>
			`;
		});
		return html + "</div>";
	}

	_renderSimpleCheckboxes(question, selectedOptions) {
		let html = '<div class="quiz-space-y-3 quiz-spacing-container">';
		question.options.forEach(option => {
			html += `
				<div class="quiz-checkbox-container">
					<input type="checkbox" id="${option.id}" name="question-${question.id}" value="${option.id}" class="quiz-checkbox-input" ${selectedOptions.includes(option.id) ? "checked" : ""}>
					<label class="quiz-checkbox-label" for="${option.id}">${option.text}</label>
				</div>
			`;
		});
		return html + "</div>";
	}

	renderDropdown(question, response) {
		const options = question.options || [];
		const placeholder = question.placeholder || "Select an option";
		const optionsHTML = options.map(option => `<option value="${option.id}" ${response.answer === option.id ? "selected" : ""}>${option.text}</option>`).join("");

		return `
			<div>
				<select id="question-${question.id}" class="quiz-select">
					<option value="">${placeholder}</option>
					${optionsHTML}
				</select>
				${this._getErrorElement(question.id)}
			</div>
        `;
	}

	renderTextInput(question, response) {
		return `
			<div>
				<input type="text" id="question-${question.id}" class="quiz-input"
					placeholder="${question.placeholder || "Type your answer here..."}"
					value="${response.answer || ""}"
					aria-describedby="error-${question.id}">
				${this._getErrorElement(question.id)}
			</div>
		`;
	}

	_getErrorElement(questionId) {
		return `<p id="error-${questionId}" class="quiz-error-text quiz-error-hidden"></p>`;
	}

	renderDatePart(question, response) {
		const part = question.part;
		let options = this._getDatePartOptions(part);
		const placeholder = question.placeholder || `Select ${part}`;

		return `
            <div>
                <select id="question-${question.id}" class="quiz-select">
                    <option value="">${placeholder}</option>
                    ${options.map(option => `<option value="${option.id}" ${response.answer === option.id ? "selected" : ""}>${option.text}</option>`).join("")}
                </select>
			</div>
		`;
	}

	_getDatePartOptions(part) {
		if (part === "month") {
			return [
				{ id: "01", text: "January" },
				{ id: "02", text: "February" },
				{ id: "03", text: "March" },
				{ id: "04", text: "April" },
				{ id: "05", text: "May" },
				{ id: "06", text: "June" },
				{ id: "07", text: "July" },
				{ id: "08", text: "August" },
				{ id: "09", text: "September" },
				{ id: "10", text: "October" },
				{ id: "11", text: "November" },
				{ id: "12", text: "December" }
			];
		} else if (part === "day") {
			return Array.from({ length: 31 }, (_, i) => {
				const day = String(i + 1).padStart(2, "0");
				return { id: day, text: day };
			});
		} else if (part === "year") {
			const endYear = 2007;
			const startYear = 1920;
			const yearCount = endYear - startYear + 1;
			return Array.from({ length: yearCount }, (_, i) => {
				const year = String(endYear - i);
				return { id: year, text: year };
			});
		}
		return [];
	}

	renderTextarea(question, response) {
		return `
			<div class="quiz-question-section">
				<textarea id="question-${question.id}" class="quiz-textarea" rows="4"
					placeholder="${question.placeholder || "Type your answer here..."}">${response.answer || ""}</textarea>
			</div>
		`;
	}

	renderRating(question, response) {
		return `
			<div class="quiz-spacing-container">
				<input type="range" id="question-${question.id}" class="quiz-range"
					min="1" max="10" step="1" value="${response.answer || 5}">
				<div class="quiz-range-labels">
                    <span>1</span><span>5</span><span>10</span>
				</div>
			</div>
		`;
	}

	renderDateInput(question, response) {
		return `
            <div class="quiz-question-section">
                <input type="date" id="question-${question.id}" class="quiz-input"
                    placeholder="${question.helpText || "MM/DD/YYYY"}"
                    value="${response.answer || ""}"
                    aria-describedby="error-${question.id}">
                ${this._getErrorElement(question.id)}
                ${question.helpText ? `<p class="quiz-text-sm">${question.helpText}</p>` : ""}
            </div>
        `;
	}

	_getCheckmarkSVG() {
		return `<div class="quiz-checkmark">
            <svg width="19" height="19" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M9.79158 18.75C4.84404 18.75 0.833252 14.7393 0.833252 9.79168C0.833252 4.84413 4.84404 0.833344 9.79158 0.833344C14.7392 0.833344 18.7499 4.84413 18.7499 9.79168C18.7499 14.7393 14.7392 18.75 9.79158 18.75ZM13.7651 7.82516C14.0598 7.47159 14.012 6.94613 13.6584 6.65148C13.3048 6.35685 12.7793 6.40462 12.4848 6.75818L8.90225 11.0572L7.04751 9.20243C6.72207 8.87701 6.19444 8.87701 5.86899 9.20243C5.54356 9.52784 5.54356 10.0555 5.86899 10.3809L8.369 12.8809C8.53458 13.0465 8.76208 13.1348 8.996 13.1242C9.22992 13.1135 9.44858 13.005 9.59842 12.8252L13.7651 7.82516Z" fill="#418865"/>
            </svg>
        </div>`;
	}

	goToPreviousStep() {
		if (this.currentStepIndex <= 0) return;

		this.currentStepIndex--;
		this.currentQuestionIndex = 0;
		this.renderCurrentStep();
		this.updateNavigation();
	}

	goToNextStep() {
		const currentStep = this.getCurrentStep();
		if (!currentStep) return;

		this.nextButton.disabled = false;

		if (currentStep.info && (!currentStep.questions || currentStep.questions.length === 0)) {
			if (this.currentStepIndex < this.quizData.steps.length - 1) {
				this.currentStepIndex++;
				this.currentQuestionIndex = 0;
				this.renderCurrentStep();
				this.updateNavigation();
			} else {
				this.finishQuiz();
			}
			return;
		}

		if (this.isFormStep(currentStep.id)) {
			if (!this._validateFormStep(currentStep)) return;

			// Check if this is the insurance step completion
			if (currentStep.id === "step-insurance") {
				// HIPAA COMPLIANT: No longer calling eligibility workflow directly from browser
				// Eligibility will be checked server-side by the user creation workflow
				console.log("📋 Insurance information collected - will be processed server-side for HIPAA compliance");
			}

			// Check if this is the contact step completion
			if (currentStep.id === "step-contact") {
				// HIPAA COMPLIANT: Only call user creation workflow
				// This will handle eligibility checking server-side to keep PHI data secure
				console.log("👤 Starting HIPAA-compliant user creation workflow (includes server-side eligibility check)");
				this._triggerUserCreationWorkflow();
				this.finishQuiz();
				return;
			}

			if (this.currentStepIndex < this.quizData.steps.length - 1) {
				this.currentStepIndex++;
				this.currentQuestionIndex = 0;
				this.renderCurrentStep();
				this.updateNavigation();
			} else {
				this.finishQuiz();
			}
			return;
		}

		if (currentStep.questions && this.currentQuestionIndex < currentStep.questions.length - 1) {
			this.currentQuestionIndex++;
			this.renderCurrentStep();
			this.updateNavigation();
			return;
		}

		if (this.currentStepIndex === this.quizData.steps.length - 1) {
			this.finishQuiz();
		} else {
			this.currentStepIndex++;
			this.currentQuestionIndex = 0;
			this.renderCurrentStep();
			this.updateNavigation();
		}
	}

	updateNavigation() {
		const step = this.getCurrentStep();
		if (!step) {
			this.nextButton.disabled = true;
			return;
		}

		const isFormStep = this.isFormStep(step.id);
		const currentQuestion = step.questions?.[this.currentQuestionIndex];

		// Always show navigation for non-required multiple choice questions
		const isNonRequiredMultipleChoice = currentQuestion?.type === "multiple-choice" && !currentQuestion.required;
		const isCurrentQuestionAutoAdvance = currentQuestion && this._shouldAutoAdvance(currentQuestion);

		const shouldShowNavigation = isNonRequiredMultipleChoice || !isCurrentQuestionAutoAdvance || isFormStep;
		this._setNavigationVisibility(shouldShowNavigation);

		if (!shouldShowNavigation) return;

		const isLastStep = this.currentStepIndex === this.quizData.steps.length - 1;
		const isLastQuestionInStep = isFormStep ? true : step.questions ? this.currentQuestionIndex === step.questions.length - 1 : true;

		if (isLastStep && isLastQuestionInStep) {
			this.nextButton.innerHTML = step.ctaText || "Finish Quiz";
		} else {
			this.nextButton.innerHTML = this._getStepButtonText(step);
		}

		if (isFormStep && step.questions) {
			this._setNavigationVisibility(false);
			const formButton = this.questionContainer.querySelector("#quiz-form-next-button");
			if (formButton) {
				formButton.disabled = this.submitting;
			}
			return;
		}

		const hasAnswer = this._hasValidAnswer(step);
		this.nextButton.disabled = !hasAnswer || this.submitting;
	}

	_getStepButtonText(step) {
		const question = step.questions[this.currentQuestionIndex];

		// Handle multiple choice questions that are not required
		if (question?.type === "multiple-choice" && !question.required) {
			const response = this.responses.find(r => r.questionId === question.id);
			const hasSelection = response && response.answer;
			return hasSelection ? step.ctaText || "Continue" : "Skip";
		}

		// Handle checkbox questions (like medical step)
		if (question?.type === "checkbox") {
			const response = this.responses.find(r => r.questionId === question.id);
			const hasSelection = response && Array.isArray(response.answer) && response.answer.length > 0;
			return hasSelection ? step.ctaText || "Continue" : "Skip";
		}

		return step.ctaText || "Continue";
	}

	_hasValidAnswer(step) {
		if (step.info && (!step.questions || step.questions.length === 0)) {
			return true;
		}

		if (step.questions?.length > 0) {
			const question = step.questions[this.currentQuestionIndex];
			if (!question) return false;

			if (!question.required) return true;

			const response = this.responses.find(r => r.questionId === question.id);
			if (!response || response.answer === null || response.answer === undefined) {
				return false;
			}

			if (question.type === "checkbox") {
				return Array.isArray(response.answer) && response.answer.length > 0;
			}

			if (typeof response.answer === "string") {
				return response.answer.trim() !== "";
			}

			return true;
		}

		return false;
	}

	_shouldAutoAdvance(question) {
		// Don't auto-advance multiple choice if it's not required
		if (question.type === "multiple-choice" && !question.required) {
			return false;
		}
		return question.type === "multiple-choice" || question.type === "dropdown";
	}

	handleAnswer(answer) {
		if (!this.quizData) return;

		const step = this.getCurrentStep();
		if (!step) return;

		if (step.questions?.length > 0) {
			const question = step.questions[this.currentQuestionIndex];
			if (!question) return;

			this._updateResponse(question.id, answer, step.id);

			if (this._shouldAutoAdvance(question)) {
				this._handleAutoAdvance(answer);
			} else if (question.type === "checkbox") {
				this._updateCheckboxVisualState(question, answer);
			} else {
				this.renderCurrentStep();
			}
		} else if (step.info) {
			this._updateResponse(step.id, answer || "info-acknowledged", step.id);
			this.nextButton.disabled = false;
		}

		this.updateNavigation();
	}

	handleFormAnswer(questionId, answer) {
		const step = this.getCurrentStep();
		if (step?.questions) {
			this._updateResponse(questionId, answer, step.id);
		}
	}

	_updateResponse(questionId, answer, stepId) {
		const responseIndex = this.responses.findIndex(r => r.questionId === questionId);
		if (responseIndex !== -1) {
			this.responses[responseIndex].answer = answer;
		} else {
			this.responses.push({ stepId, questionId, answer });
		}
	}

	_handleAutoAdvance(answer) {
		const allOptionButtons = this.questionContainer.querySelectorAll(".quiz-option-button");
		allOptionButtons.forEach(button => {
			button.classList.remove("selected", "processing", "auto-advance-feedback");
			const existingCheckmark = button.querySelector(".quiz-checkmark");
			if (existingCheckmark) {
				existingCheckmark.remove();
			}
		});

		const selectedElement = this.questionContainer.querySelector(`input[value="${answer}"]:checked`);
		if (selectedElement) {
			const optionButton = selectedElement.closest(".quiz-option-card")?.querySelector(".quiz-option-button");
			if (optionButton) {
				optionButton.classList.add("selected", "processing");
				optionButton.innerHTML += this._getCheckmarkSVG();
				optionButton.classList.add("auto-advance-feedback");
			}
		}

		setTimeout(() => {
			this.goToNextStep();
		}, this.config.autoAdvanceDelay || 600);
	}

	_updateCheckboxVisualState(question, answer) {
		if (!Array.isArray(answer)) return;

		const allCheckboxes = this.questionContainer.querySelectorAll(`input[name="question-${question.id}"]`);
		allCheckboxes.forEach(checkbox => {
			const optionCard = checkbox.closest(".quiz-option-card");
			const optionButton = optionCard?.querySelector(".quiz-option-button");

			if (optionButton) {
				const shouldBeSelected = answer.includes(checkbox.value);
				const isCurrentlySelected = optionButton.classList.contains("selected");

				if (shouldBeSelected !== isCurrentlySelected) {
					if (shouldBeSelected) {
						optionButton.classList.add("selected");
						checkbox.checked = true;
						if (!optionButton.querySelector(".quiz-checkmark")) {
							optionButton.innerHTML += this._getCheckmarkSVG();
						}
					} else {
						optionButton.classList.remove("selected");
						checkbox.checked = false;
						const checkmark = optionButton.querySelector(".quiz-checkmark");
						if (checkmark) {
							checkmark.remove();
						}
					}
				}
			}
		});

		this.updateNavigation();
	}

	_handleStepAcknowledgment(step) {
		if (!step.info) return;

		const infoResponse = this.responses.find(r => r.stepId === step.id && r.questionId === step.id);
		if (infoResponse) {
			infoResponse.answer = "info-acknowledged";
		} else {
			this.responses.push({
				stepId: step.id,
				questionId: step.id,
				answer: "info-acknowledged"
			});
		}

		if (!step.questions || step.questions.length === 0) {
			setTimeout(() => {
				this.nextButton.disabled = false;
			}, 0);
		}
	}

	_attachStepEventListeners(step) {
		if (!step.questions || step.questions.length === 0) return;

		if (this.isFormStep(step.id)) {
			step.questions.forEach(question => {
				this._attachFormQuestionListener(question);
			});

			const formButton = this.questionContainer.querySelector("#quiz-form-next-button");
			if (formButton) {
				formButton.removeEventListener("click", this.formButtonHandler);
				this.formButtonHandler = () => {
					if (!formButton.disabled) {
						this.goToNextStep();
					}
				};
				formButton.addEventListener("click", this.formButtonHandler);
			}
		} else {
			const currentQuestion = step.questions[this.currentQuestionIndex];
			if (currentQuestion) {
				this._attachQuestionEventListeners(currentQuestion);
			}
		}
	}

	_attachQuestionEventListeners(question) {
		if (!question) return;

		const handlers = {
			"multiple-choice": () => this._attachInputGroupListeners(question, "change", input => this.handleAnswer(input.value)),
			checkbox: () => this._attachCheckboxListeners(question),
			dropdown: () => this._attachDropdownListeners(question),
			"date-part": () => this._attachDropdownListeners(question),
			text: () => this._attachTextInputListeners(question),
			date: () => this._attachTextInputListeners(question),
			textarea: () => this._attachSingleInputListener(question, "input", input => this.handleAnswer(input.value)),
			rating: () => this._attachSingleInputListener(question, "input", input => this.handleAnswer(parseInt(input.value, 10))),
			"payer-search": () => this._attachPayerSearchListeners(question)
		};

		handlers[question.type]?.();
	}

	_attachInputGroupListeners(question, eventType, callback) {
		const inputs = this.questionContainer.querySelectorAll(`input[name="question-${question.id}"]`);
		inputs.forEach(input => input.addEventListener(eventType, () => callback(input)));
	}

	_attachSingleInputListener(question, eventType, callback) {
		const input = this.questionContainer.querySelector(`#question-${question.id}`);
		if (input) input.addEventListener(eventType, () => callback(input));
	}

	_attachCheckboxListeners(question) {
		const checkboxInputs = this.questionContainer.querySelectorAll(`input[name="question-${question.id}"]`);
		const getSelectedValues = () =>
			Array.from(checkboxInputs)
				.filter(cb => cb.checked)
				.map(cb => cb.value);

		checkboxInputs.forEach(input => {
			input.removeEventListener("change", input._changeHandler);
			input._changeHandler = () => this.handleAnswer(getSelectedValues());
			input.addEventListener("change", input._changeHandler);
		});
	}

	_attachDropdownListeners(question) {
		const dropdown = this.questionContainer.querySelector(`#question-${question.id}`);
		if (!dropdown) return;

		dropdown.addEventListener("change", () => {
			this.handleFormAnswer(question.id, dropdown.value);
			this._updateDropdownColor(dropdown);
			this._clearFieldError(question.id, dropdown);
		});
		this._updateDropdownColor(dropdown);
	}

	_attachTextInputListeners(question) {
		const textInput = this.questionContainer.querySelector(`#question-${question.id}`);
		if (!textInput) return;

		const validate = () => {
			const validationResult = this._validateFieldValue(question, textInput.value);
			this._updateFieldValidationState(textInput, question, validationResult);
		};

		this._removeExistingHandlers(textInput, ["input", "blur", "change"]);

		textInput._inputHandler = () => this.handleFormAnswer(question.id, textInput.value);
		textInput._blurHandler = validate;
		textInput._changeHandler = validate;

		["input", "blur", "change"].forEach((event, i) => {
			const handler = [textInput._inputHandler, textInput._blurHandler, textInput._changeHandler][i];
			textInput.addEventListener(event, handler);
		});
	}

	_removeExistingHandlers(element, events) {
		events.forEach(event => element.removeEventListener(event, element[`_${event}Handler`]));
	}

	_attachFormQuestionListener(question) {
		const formHandlers = {
			dropdown: () => this._attachDropdownListeners(question),
			"date-part": () => this._attachDropdownListeners(question),
			text: () => this._attachTextInputListeners(question),
			date: () => this._attachTextInputListeners(question),
			checkbox: () => this._attachFormCheckboxListeners(question),
			"payer-search": () => this._attachPayerSearchFormListeners(question)
		};

		formHandlers[question.type]?.();
	}

	_attachFormCheckboxListeners(question) {
		const checkboxInputs = this.questionContainer.querySelectorAll(`input[name="question-${question.id}"]`);
		const getFormValue = input =>
			question.options.length === 1
				? input.checked
					? [input.value]
					: []
				: Array.from(checkboxInputs)
						.filter(cb => cb.checked)
						.map(cb => cb.value);

		checkboxInputs.forEach(input => {
			input.onclick = () => this.handleFormAnswer(question.id, getFormValue(input));
		});
	}

	_validateFormStep(step) {
		const validationErrors = step.questions.map(question => this._validateQuestionInForm(question)).filter(error => error);

		if (validationErrors.length > 0) {
			this._displayValidationErrors(validationErrors);
			return false;
		}
		return true;
	}

	_validateQuestionInForm(question) {
		const response = this.responses.find(r => r.questionId === question.id);
		const currentValue = response?.answer;

		if (question.required && this._isEmptyValue(currentValue, question.type)) {
			return {
				questionId: question.id,
				message: this.quizData.ui?.errorMessages?.validationRequired || "This field is required"
			};
		}

		if (currentValue && question.type !== "payer-search") {
			const validationResult = this._validateFieldValue(question, currentValue);
			if (!validationResult.isValid) {
				return {
					questionId: question.id,
					message: validationResult.errorMessage
				};
			}
		}

		return null;
	}

	_isEmptyValue(value, questionType) {
		if (!value) return true;
		if (questionType === "checkbox") return !Array.isArray(value) || value.length === 0;
		if (typeof value === "string") return value.trim() === "";
		return false;
	}

	_displayValidationErrors(validationErrors) {
		let firstInvalidField = null;

		validationErrors.forEach((error, index) => {
			const { input, errorEl } = this._getValidationElements(error.questionId);

			if (input) {
				input.classList.add("quiz-input-error");
				input.classList.remove("quiz-input-valid");
				if (index === 0) firstInvalidField = input;
			}

			if (errorEl) {
				errorEl.textContent = error.message;
				errorEl.classList.remove("quiz-error-hidden");
				errorEl.classList.add("quiz-error-visible");
			}
		});

		if (firstInvalidField) {
			this._scrollToInvalidField(firstInvalidField);
		}
	}

	_getValidationElements(questionId) {
		return {
			input: this.questionContainer.querySelector(`#question-${questionId}`),
			errorEl: this.questionContainer.querySelector(`#error-${questionId}`)
		};
	}

	_validateFieldValue(question, value) {
		const errorMessages = this.quizData.ui?.errorMessages || {};

		if (question.type === "payer-search") {
			return this._validateRequired(question, value) ? { isValid: true, errorMessage: null } : { isValid: false, errorMessage: errorMessages.validationInsurance || "Please select an insurance plan" };
		}

		if (question.required && !this._hasValue(value)) {
			return { isValid: false, errorMessage: errorMessages.validationRequired || "This field is required" };
		}

		if (!this._hasValue(value)) {
			return { isValid: true, errorMessage: null };
		}

		return this._validateFieldFormat(question, value.trim(), errorMessages);
	}

	_hasValue(value) {
		return value && (typeof value !== "string" || value.trim() !== "");
	}

	_validateRequired(question, value) {
		return !question.required || this._hasValue(value);
	}

	_validateFieldFormat(question, trimmedValue, errorMessages) {
		const patterns = this.quizData.validation?.patterns || {};
		const validations = {
			q4: { pattern: patterns.memberId || "^.{6,20}$", message: errorMessages.validationMemberId || "Minimum 6 characters" },
			q4_group: { pattern: patterns.groupNumber || "^$|^.{5,15}$", message: errorMessages.validationGroupNumber || "Minimum 5 characters" },
			q7: { pattern: patterns.name || "^[A-Za-z\\s]{1,100}$", message: errorMessages.validationName || "Use only A–Z letters and spaces" },
			q8: { pattern: patterns.name || "^[A-Za-z\\s]{1,100}$", message: errorMessages.validationName || "Use only A–Z letters and spaces" },
			q9: { pattern: patterns.email || "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", message: errorMessages.validationEmail || "Enter valid email" },
			q10: { custom: () => this._validatePhoneNumber(trimmedValue), message: errorMessages.validationPhone || "Enter valid phone" }
		};

		const validation = validations[question.id];
		if (validation) {
			const isValid = validation.custom ? validation.custom() : new RegExp(validation.pattern).test(trimmedValue);
			return isValid ? { isValid: true, errorMessage: null } : { isValid: false, errorMessage: validation.message };
		}

		if (question.validation?.pattern) {
			const isValid = new RegExp(question.validation.pattern).test(trimmedValue);
			return isValid ? { isValid: true, errorMessage: null } : { isValid: false, errorMessage: question.validation.message || "Invalid format" };
		}

		return { isValid: true, errorMessage: null };
	}

	_validatePhoneNumber(phone) {
		const cleanPhone = phone.replace(/[\s\-\(\)\.]/g, "");

		const patterns = [
			/^[0-9]{10}$/,
			/^1[0-9]{10}$/,
			/^\+1[0-9]{10}$/,
			/^\+[1-9][0-9]{7,14}$/,
			/^\+[0-9]{8,15}$/,
			/^[0-9]{3}-[0-9]{3}-[0-9]{4}$/,
			/^\([0-9]{3}\)\s[0-9]{3}-[0-9]{4}$/,
			/^[0-9]{3}\.[0-9]{3}\.[0-9]{4}$/,
			/^[0-9]{3}\s[0-9]{3}\s[0-9]{4}$/,
			/^\+1\s[0-9]{3}-[0-9]{3}-[0-9]{4}$/,
			/^1-[0-9]{3}-[0-9]{3}-[0-9]{4}$/
		];

		return patterns.some(pattern => pattern.test(cleanPhone)) || patterns.some(pattern => pattern.test(phone));
	}

	_updateFieldValidationState(input, question, validationResult) {
		const errorEl = this.questionContainer.querySelector(`#error-${question.id}`);
		const isValid = validationResult.isValid;

		input.classList.toggle("quiz-input-error", !isValid);
		input.classList.toggle("quiz-input-valid", isValid);

		if (errorEl) {
			if (isValid) {
				errorEl.classList.add("quiz-error-hidden");
				errorEl.classList.remove("quiz-error-visible");
			} else if (validationResult.errorMessage) {
				errorEl.textContent = validationResult.errorMessage;
				errorEl.classList.remove("quiz-error-hidden");
				errorEl.classList.add("quiz-error-visible");
			}
		}

		return isValid;
	}

	_clearFieldError(questionId, input) {
		if (input.value && input.value !== "") {
			const errorEl = this.questionContainer.querySelector(`#error-${questionId}`);
			if (errorEl) {
				input.classList.remove("quiz-input-error");
				input.classList.add("quiz-input-valid");
				errorEl.classList.add("quiz-error-hidden");
				errorEl.classList.remove("quiz-error-visible");
			}
		}
	}

	_updateDropdownColor(dropdown) {
		const hasSelection = dropdown.value && dropdown.value !== dropdown.options[0].value;
		dropdown.style.color = hasSelection ? "var(--quiz-text-primary)" : "#B0B0B0";
		dropdown.classList.toggle("quiz-dropdown-selected", hasSelection);
	}

	_scrollToInvalidField(fieldElement) {
		if (!fieldElement) return;

		const isMobile = window.innerWidth <= 768;
		if (isMobile) {
			const fieldRect = fieldElement.getBoundingClientRect();
			const offset = 100;
			const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
			const targetScrollY = currentScrollY + fieldRect.top - offset;

			window.scrollTo({
				top: Math.max(0, targetScrollY),
				behavior: "smooth"
			});

			setTimeout(() => {
				if (fieldElement.focus) {
					fieldElement.focus();
				}
			}, 300);
		}
	}

	async finishQuiz() {
		const resultUrl = this.container.getAttribute("data-result-url") || this.container.getAttribute("data-booking-url") || "/quiz-complete";

		try {
			this.submitting = true;
			this.nextButton.disabled = true;

			this._toggleElement(this.navigationButtons, false);
			this._toggleElement(this.progressSection, false);

			// Start the comprehensive loading sequence
			await this._showComprehensiveLoadingSequence();

			// Check if eligibility workflow is complete
			let eligibilityResult = null;
			if (this.eligibilityWorkflowPromise) {
				if (this.eligibilityWorkflowResult) {
					// Already completed
					eligibilityResult = this.eligibilityWorkflowResult;
					console.log("Using cached eligibility result:", eligibilityResult);
				} else {
					// Still running - wait for it
					try {
						eligibilityResult = await this.eligibilityWorkflowPromise;
						console.log("Waited for eligibility result:", eligibilityResult);
					} catch (error) {
						console.error("Eligibility workflow failed:", error);
						eligibilityResult = this._createErrorEligibilityData("Eligibility check failed");
					}
				}
			} else {
				// No eligibility check was triggered - use default processing status
				eligibilityResult = this._createProcessingEligibilityData();
				console.log("No eligibility workflow, using processing status");
			}

			// Process the result consistently
			let finalResult;
			if (eligibilityResult) {
				// Check if this is already processed eligibility data or a raw webhook response
				if (eligibilityResult.eligibilityStatus && typeof eligibilityResult.eligibilityStatus === "string") {
					// This is already processed eligibility data - use it directly
					finalResult = eligibilityResult;
					console.log("Using eligibility result directly (already processed):", finalResult);
				} else {
					// This is a raw webhook response - process it
					finalResult = this._processWebhookResult(eligibilityResult);
					console.log("Processed webhook result:", finalResult);
				}
			} else {
				// No eligibility check was run - use default processing status
				finalResult = this._createProcessingEligibilityData();
				console.log("No eligibility result, using processing status");
			}

			console.log("Processing eligibility result in finishQuiz:", {
				eligibilityResult: finalResult,
				hasError: !!finalResult?.error,
				status: finalResult?.eligibilityStatus,
				isEligible: finalResult?.isEligible
			});

			// Test mode comprehensive finish notification
			if (this.isTestMode) {
				const workflowStatus = this.eligibilityWorkflowPromise ? (this.eligibilityWorkflowResult ? "✅ Completed" : "⏳ In Progress") : "❌ Not Started";

				const userCreationStatus = this.userCreationWorkflowPromise ? "✅ Started" : "❌ Not Started";

				this._showBackgroundProcessNotification(
					`
					🧪 TEST MODE - Quiz Completion Status<br>
			// Basic info
			firstName: data.firstName,
			lastName: data.lastName,
			customerEmail: data.customerEmail,
			phoneNumber: data.phoneNumber,
			dateOfBirth: data.dateOfBirth,
			state: data.state,

			// Address fields required by Beluga
			address: data.address,
			city: data.city,
			zip: data.zip,
			sex: data.sex,

			// Quiz responses
			mainReasons: data.mainReasons,
			medicalConditions: data.medicalConditions,
			allResponses: this.responses,

			// Metadata
			workflowType: "scheduling",
			testMode: this.isTestMode,
			triggeredAt: new Date().toISOString(),
			quizId: this.quizData?.id || "dietitian-quiz",
			quizTitle: this.quizData?.title || "Find Your Perfect Dietitian"
		};
	}

	_showSchedulingResults(result) {
		const schedulingData = result?.schedulingData;

		if (result?.success && schedulingData?.status === "SCHEDULED") {
			// Success - show scheduling success page
			const successHTML = this._generateSchedulingSuccessHTML(schedulingData);
			this.questionContainer.innerHTML = successHTML;
		} else {
			// Error - show scheduling error page
			const errorMessage = schedulingData?.message || "Unknown scheduling error";
			this._showSchedulingError(errorMessage, schedulingData);
		}
	}

	_showSchedulingError(errorMessage, schedulingData = null) {
		const errorHTML = this._generateSchedulingErrorHTML(errorMessage, schedulingData);
		this.questionContainer.innerHTML = errorHTML;
	}

	_generateSchedulingSuccessHTML(schedulingData) {
		const scheduleLink = schedulingData?.scheduleLink || "#";
		const masterId = schedulingData?.masterId || "";

		return `
			<div class="quiz-results-container">
				<div class="quiz-results-header">
					<h2 class="quiz-results-title">🎉 Appointment Request Submitted!</h2>
					<p class="quiz-results-subtitle">Great news! Your request has been successfully processed and your dietitian appointment is ready to be scheduled.</p>
				</div>

				<div class="quiz-action-section">
					<div class="quiz-action-content">
						<div class="quiz-action-header">
							<h3 class="quiz-action-title">Next: Choose Your Appointment Time</h3>
						</div>
						<div class="quiz-action-details">
							<div class="quiz-action-info">
								<div class="quiz-action-info-text">
									Click below to access your personalized scheduling portal where you can select from available appointment times that work best for your schedule.
								</div>
							</div>
							<a href="${scheduleLink}" target="_blank" class="quiz-booking-button">
								<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M6.66666 2.5V5.83333M13.3333 2.5V5.83333M2.5 9.16667H17.5M4.16666 3.33333H15.8333C16.7538 3.33333 17.5 4.07952 17.5 5V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16666C3.24619 18.3333 2.5 17.5871 2.5 16.6667V5C2.5 4.07952 3.24619 3.33333 4.16666 3.33333Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								Schedule Your Appointment
							</a>
							${masterId ? '<p class="quiz-text-xs" style="margin-top: 16px; color: #666; font-family: monospace;">Reference ID: ' + masterId + '</p>' : ""}
						</div>
					</div>
				</div>

				<div class="quiz-coverage-card">
					<div class="quiz-coverage-card-title">What to Expect</div>
					<div class="quiz-coverage-benefits">
						<div class="quiz-coverage-benefit">
							<div class="quiz-coverage-benefit-icon">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M12 8V12L15 15" stroke="#306E51" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
									<circle cx="12" cy="12" r="9" stroke="#306E51" stroke-width="2"/>
								</svg>
							</div>
							<div class="quiz-coverage-benefit-text">
								<strong>30-60 Minutes</strong><br>
								Comprehensive nutrition consultation tailored to your specific health goals
							</div>
						</div>
						<div class="quiz-coverage-benefit">
							<div class="quiz-coverage-benefit-icon">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M17 3V0M12 3V0M7 3V0M3 7H21M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="#306E51" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
							</div>
							<div class="quiz-coverage-benefit-text">
								<strong>Flexible Scheduling</strong><br>
								Choose from morning, afternoon, or evening slots that fit your lifestyle
							</div>
						</div>
						<div class="quiz-coverage-benefit">
							<div class="quiz-coverage-benefit-icon">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M9 12L11 14L22 3M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3.89543 3 5 3 5 3H16" stroke="#306E51" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
							</div>
							<div class="quiz-coverage-benefit-text">
								<strong>Personalized Plan</strong><br>
								Receive a custom nutrition plan based on your quiz responses and health profile
							</div>
						</div>
						<div class="quiz-coverage-benefit">
							<div class="quiz-coverage-benefit-icon">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M18.3333 14.1667C18.3333 15.0871 17.5871 15.8333 16.6667 15.8333H5.83333L1.66666 20V3.33333C1.66666 2.41286 2.41285 1.66667 3.33333 1.66667H16.6667C17.5871 1.66667 18.3333 2.41286 18.3333 3.33333V14.1667Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
							</div>
							<div class="quiz-coverage-benefit-text">
								<strong>Ongoing Support</strong><br>
								Follow-up resources and support to help you achieve your health goals
							</div>
						</div>
					</div>
				</div>

				<div class="quiz-action-section" style="background-color: #f8f9fa;">
					<div class="quiz-action-content">
						<div class="quiz-action-header">
							<h3 class="quiz-action-title">Need Assistance?</h3>
						</div>
						<div class="quiz-action-details">
							<div class="quiz-action-info">
								<div class="quiz-action-info-text">
									Our support team is here to help if you have any questions about scheduling or preparing for your appointment.
								</div>
							</div>
							<div class="quiz-action-feature">
								<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M18.3333 5.83333L10 11.6667L1.66666 5.83333" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									<path d="M1.66666 5.83333H18.3333V15C18.3333 15.442 18.1577 15.866 17.8452 16.1785C17.5327 16.491 17.1087 16.6667 16.6667 16.6667H3.33333C2.89131 16.6667 2.46738 16.491 2.15482 16.1785C1.84226 15.866 1.66666 15.442 1.66666 15V5.83333Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-feature-text">Email: support@curalife.com</div>
							</div>
							<div class="quiz-action-feature">
								<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M18.3081 14.2233C17.1569 14.2233 16.0346 14.0397 14.9845 13.6971C14.6449 13.5878 14.2705 13.6971 14.0579 13.9427L12.8372 15.6772C10.3023 14.4477 8.55814 12.7138 7.32326 10.1581L9.10465 8.89535C9.34884 8.68372 9.45814 8.30233 9.34884 7.96279C9.00581 6.91628 8.82209 5.79186 8.82209 4.64535C8.82209 4.28953 8.53256 4 8.17674 4H4.64535C4.28953 4 4 4.28953 4 4.64535C4 12.1715 10.1831 18.3953 17.6628 18.3953C18.0186 18.3953 18.3081 18.1058 18.3081 17.75V14.2233Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-feature-text">Phone: 1-800-CURALIFE</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		`;
	}

	_generateSchedulingErrorHTML(errorMessage, schedulingData = null) {
		const errorStatus = schedulingData?.status || "ERROR";
		const isValidationError = errorStatus === "VALIDATION_ERROR";
		const isDuplicateError = errorStatus === "DUPLICATE_ERROR";
		const isAuthError = errorStatus === "AUTH_ERROR";
		const isServerError = errorStatus === "SERVER_ERROR";
		const isConfigError = errorStatus === "CONFIG_ERROR";

		if (isDuplicateError) {
			return `
				<div class="quiz-results-container">
					<div class="quiz-results-header">
						<h2 class="quiz-results-title">⚠️ Appointment Already Exists</h2>
						<p class="quiz-results-subtitle">Good news! You already have an appointment scheduled with our dietitian.</p>
					</div>

					<div class="quiz-coverage-card">
						<div class="quiz-coverage-card-title">What's Next?</div>
						<div class="quiz-coverage-benefits">
							<div class="quiz-coverage-benefit">
								<div class="quiz-coverage-benefit-icon">
									<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M18 5.83333L10 11.6667L2 5.83333" stroke="#306E51" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
										<path d="M2 5.83333H18V15C18 15.442 17.824 15.866 17.512 16.1785C17.199 16.491 16.775 16.6667 16.333 16.6667H3.667C3.225 16.6667 2.801 16.491 2.488 16.1785C2.176 15.866 2 15.442 2 15V5.83333Z" stroke="#306E51" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
									</svg>
								</div>
								<div class="quiz-coverage-benefit-text">
									<strong>Check Your Email</strong><br>
									Your appointment confirmation and scheduling details have been sent to your email address
								</div>
							</div>
							<div class="quiz-coverage-benefit">
								<div class="quiz-coverage-benefit-icon">
									<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M8 2V6M16 2V6M3.5 10H20.5M5 4H19C20.105 4 21 4.895 21 6V20C21 21.105 20.105 22 19 22H5C3.895 22 3 21.105 3 20V6C3 4.895 3.895 4 5 4Z" stroke="#306E51" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
									</svg>
								</div>
								<div class="quiz-coverage-benefit-text">
									<strong>Reschedule if Needed</strong><br>
									If you need to change your appointment time, use the link in your confirmation email
								</div>
							</div>
						</div>
					</div>

					<div class="quiz-action-section" style="background-color: #f8f9fa;">
						<div class="quiz-action-content">
							<div class="quiz-action-header">
								<h3 class="quiz-action-title">Need Help?</h3>
							</div>
							<div class="quiz-action-details">
								<div class="quiz-action-feature">
									<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M18.3333 5.83333L10 11.6667L1.66666 5.83333" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
										<path d="M1.66666 5.83333H18.3333V15C18.3333 15.442 18.1577 15.866 17.8452 16.1785C17.5327 16.491 17.1087 16.6667 16.6667 16.6667H3.33333C2.89131 16.6667 2.46738 16.491 2.15482 16.1785C1.84226 15.866 1.66666 15.442 1.66666 15V5.83333Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									</svg>
									<div class="quiz-action-feature-text">Email: support@curalife.com</div>
								</div>
								<div class="quiz-action-feature">
									<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M18.3081 14.2233C17.1569 14.2233 16.0346 14.0397 14.9845 13.6971C14.6449 13.5878 14.2705 13.6971 14.0579 13.9427L12.8372 15.6772C10.3023 14.4477 8.55814 12.7138 7.32326 10.1581L9.10465 8.89535C9.34884 8.68372 9.45814 8.30233 9.34884 7.96279C9.00581 6.91628 8.82209 5.79186 8.82209 4.64535C8.82209 4.28953 8.53256 4 8.17674 4H4.64535C4.28953 4 4 4.28953 4 4.64535C4 12.1715 10.1831 18.3953 17.6628 18.3953C18.0186 18.3953 18.3081 18.1058 18.3081 17.75V14.2233Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									</svg>
									<div class="quiz-action-feature-text">Phone: 1-800-CURALIFE</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			`;
		}

		if (isValidationError) {
			return `
				<div class="quiz-results-container">
					<div class="quiz-results-header">
						<h2 class="quiz-results-title">❌ Information Needs Review</h2>
						<p class="quiz-results-subtitle">${errorMessage}</p>
					</div>

					<div class="quiz-coverage-card">
						<div class="quiz-coverage-card-title">Common Issues & Solutions</div>
						<div class="quiz-coverage-benefits">
							<div class="quiz-coverage-benefit">
								<div class="quiz-coverage-benefit-icon">📞</div>
								<div class="quiz-coverage-benefit-text">
									<strong>Phone Number:</strong> Use 10-digit format (e.g., 5551234567)
								</div>
							</div>
							<div class="quiz-coverage-benefit">
								<div class="quiz-coverage-benefit-icon">📅</div>
								<div class="quiz-coverage-benefit-text">
									<strong>Date of Birth:</strong> Ensure month/day/year are correct
								</div>
							</div>
							<div class="quiz-coverage-benefit">
								<div class="quiz-coverage-benefit-icon">🏠</div>
								<div class="quiz-coverage-benefit-text">
									<strong>Address:</strong> Include street number and name
								</div>
							</div>
							<div class="quiz-coverage-benefit">
								<div class="quiz-coverage-benefit-icon">📍</div>
								<div class="quiz-coverage-benefit-text">
									<strong>ZIP Code:</strong> Use 5-digit format (e.g., 12345)
								</div>
							</div>
						</div>
					</div>

					<div class="quiz-action-section">
						<div class="quiz-action-content">
							<div class="quiz-action-header">
								<h3 class="quiz-action-title">Try Again</h3>
							</div>
							<div class="quiz-action-details">
								<div class="quiz-action-info">
									<div class="quiz-action-info-text">
										Go back and double-check your information, then submit again.
									</div>
								</div>
								<button onclick="window.location.reload()" class="quiz-booking-button">
									<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M1.66666 10H5L3.33333 8.33333M3.33333 8.33333L1.66666 6.66667M3.33333 8.33333C4.09938 6.54467 5.40818 5.06585 7.07084 4.10926C8.7335 3.15266 10.6668 2.76579 12.5729 3.00632C14.479 3.24685 16.2671 4.10239 17.6527 5.43174C19.0382 6.76109 19.9501 8.50173 20.2612 10.3889C20.5723 12.2761 20.2661 14.2137 19.3884 15.9271C18.5107 17.6405 17.1075 19.0471 15.3804 19.9429C13.6533 20.8388 11.6875 21.1795 9.76666 20.9204C7.84586 20.6613 6.06666 19.8167 4.66666 18.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									</svg>
									Try Again
								</button>
							</div>
						</div>
					</div>

					<div class="quiz-action-section" style="background-color: #f8f9fa;">
						<div class="quiz-action-content">
							<div class="quiz-action-header">
								<h3 class="quiz-action-title">Still Having Issues?</h3>
							</div>
							<div class="quiz-action-details">
								<div class="quiz-action-feature">
									<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M18.3333 5.83333L10 11.6667L1.66666 5.83333" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
										<path d="M1.66666 5.83333H18.3333V15C18.3333 15.442 18.1577 15.866 17.8452 16.1785C17.5327 16.491 17.1087 16.6667 16.6667 16.6667H3.33333C2.89131 16.6667 2.46738 16.491 2.15482 16.1785C1.84226 15.866 1.66666 15.442 1.66666 15V5.83333Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									</svg>
									<div class="quiz-action-feature-text">Email: support@curalife.com</div>
								</div>
								<div class="quiz-action-feature">
									<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M18.3081 14.2233C17.1569 14.2233 16.0346 14.0397 14.9845 13.6971C14.6449 13.5878 14.2705 13.6971 14.0579 13.9427L12.8372 15.6772C10.3023 14.4477 8.55814 12.7138 7.32326 10.1581L9.10465 8.89535C9.34884 8.68372 9.45814 8.30233 9.34884 7.96279C9.00581 6.91628 8.82209 5.79186 8.82209 4.64535C8.82209 4.28953 8.53256 4 8.17674 4H4.64535C4.28953 4 4 4.28953 4 4.64535C4 12.1715 10.1831 18.3953 17.6628 18.3953C18.0186 18.3953 18.3081 18.1058 18.3081 17.75V14.2233Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									</svg>
									<div class="quiz-action-feature-text">Phone: 1-800-CURALIFE</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			`;
		}

		// Service/Auth errors or general errors
		const isServiceError = isAuthError || isConfigError;
		const errorTitle = isServiceError ? "🔧 Service Temporarily Unavailable" : "⚠️ Scheduling Assistance Needed";
		const errorDescription = isServiceError ? "We're experiencing a temporary issue with our scheduling system." : "We encountered an unexpected issue, but we're here to help.";

		return `
			<div class="quiz-results-container">
				<div class="quiz-results-header">
					<h2 class="quiz-results-title">${errorTitle}</h2>
					<p class="quiz-results-subtitle">${errorDescription}</p>
				</div>

				<div class="quiz-action-section">
					<div class="quiz-action-content">
						<div class="quiz-action-header">
							<h3 class="quiz-action-title">We've Got You Covered</h3>
						</div>
						<div class="quiz-action-details">
							<div class="quiz-action-info">
								<div class="quiz-action-info-text">
									Your request has been recorded and our team will personally contact you within <strong>24 hours</strong> to schedule your appointment.
								</div>
							</div>
						</div>
					</div>
				</div>

				<div class="quiz-coverage-card">
					<div class="quiz-coverage-card-title">What Happens Next</div>
					<div class="quiz-coverage-benefits">
						<div class="quiz-coverage-benefit">
							<div class="quiz-coverage-benefit-icon">
								<div style="background: #306e51; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px;">1</div>
							</div>
							<div class="quiz-coverage-benefit-text">
								<strong>Within 4 Hours:</strong> You'll receive a confirmation email with your request details
							</div>
						</div>
						<div class="quiz-coverage-benefit">
							<div class="quiz-coverage-benefit-icon">
								<div style="background: #306e51; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px;">2</div>
							</div>
							<div class="quiz-coverage-benefit-text">
								<strong>Within 24 Hours:</strong> A team member will call to schedule your appointment
							</div>
						</div>
						<div class="quiz-coverage-benefit">
							<div class="quiz-coverage-benefit-icon">
								<div style="background: #306e51; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px;">3</div>
							</div>
							<div class="quiz-coverage-benefit-text">
								<strong>Your Appointment:</strong> Meet with your registered dietitian at the scheduled time
							</div>
						</div>
					</div>
				</div>

				<div class="quiz-action-section" style="background-color: #f8f9fa;">
					<div class="quiz-action-content">
						<div class="quiz-action-header">
							<h3 class="quiz-action-title">Questions? We're Here to Help</h3>
						</div>
						<div class="quiz-action-details">
							<div class="quiz-action-info">
								<div class="quiz-action-info-text">
									Our support team is available Monday-Friday, 9 AM - 6 PM EST
								</div>
							</div>
							<div class="quiz-action-feature">
								<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M18.3333 5.83333L10 11.6667L1.66666 5.83333" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									<path d="M1.66666 5.83333H18.3333V15C18.3333 15.442 18.1577 15.866 17.8452 16.1785C17.5327 16.491 17.1087 16.6667 16.6667 16.6667H3.33333C2.89131 16.6667 2.46738 16.491 2.15482 16.1785C1.84226 15.866 1.66666 15.442 1.66666 15V5.83333Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-feature-text">Email: support@curalife.com</div>
							</div>
							<div class="quiz-action-feature">
								<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M18.3081 14.2233C17.1569 14.2233 16.0346 14.0397 14.9845 13.6971C14.6449 13.5878 14.2705 13.6971 14.0579 13.9427L12.8372 15.6772C10.3023 14.4477 8.55814 12.7138 7.32326 10.1581L9.10465 8.89535C9.34884 8.68372 9.45814 8.30233 9.34884 7.96279C9.00581 6.91628 8.82209 5.79186 8.82209 4.64535C8.82209 4.28953 8.53256 4 8.17674 4H4.64535C4.28953 4 4 4.28953 4 4.64535C4 12.1715 10.1831 18.3953 17.6628 18.3953C18.0186 18.3953 18.3081 18.1058 18.3081 17.75V14.2233Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-feature-text">Phone: 1-800-CURALIFE</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		`;
	}

	showError(title, message) {
		this._stopLoadingMessages();
		this._toggleElement(this.questions, false);
		this._toggleElement(this.error, true);

		const errorTitle = this.error.querySelector("h3");
		const errorMessage = this.error.querySelector("p");

		if (errorTitle) errorTitle.textContent = title;
		if (errorMessage) errorMessage.textContent = message;
	}

	_processWebhookResult(result) {
		console.log("Processing webhook result:", {
			result,
			hasSuccess: "success" in result,
			hasBody: "body" in result,
			hasEligibilityData: result?.eligibilityData || result?.body?.eligibilityData,
			resultKeys: Object.keys(result || {}),
			bodyKeys: result?.body ? Object.keys(result.body) : "no body"
		});

		// Handle nested response format (like from Google Cloud Function)
		if (result?.body && typeof result.body === "object") {
			console.log("Processing nested response format with body");
			const bodyResult = result.body;

			if (bodyResult?.success === true && bodyResult.eligibilityData) {
				const eligibilityData = bodyResult.eligibilityData;

				// Handle generic ERROR status first
				if (eligibilityData.eligibilityStatus === "ERROR") {
					const errorMessage =
						eligibilityData.userMessage || eligibilityData.error?.message || eligibilityData.error || "There was an error checking your eligibility. Please contact customer support.";
					console.log("Processing generic ERROR status with message:", errorMessage);
					return this._createErrorEligibilityData(errorMessage);
				}

				// Handle AAA_ERROR status from workflow
				if (eligibilityData.eligibilityStatus === "AAA_ERROR") {
					// Try multiple ways to extract the error code
					const errorCode = eligibilityData.error?.code || eligibilityData.aaaErrorCode || eligibilityData.error?.allErrors?.[0]?.code || "Unknown";

					console.log("Processing AAA_ERROR with code:", errorCode, "from eligibilityData:", eligibilityData);
					return this._createAAAErrorEligibilityData(errorCode, eligibilityData.userMessage);
				}

				return eligibilityData;
			}
		}

		// Handle direct response format
		if (result?.success === true && result.eligibilityData) {
			// Check if this is an AAA error from the workflow response
			const eligibilityData = result.eligibilityData;

			// Handle generic ERROR status first
			if (eligibilityData.eligibilityStatus === "ERROR") {
				const errorMessage = eligibilityData.userMessage || eligibilityData.error?.message || eligibilityData.error || "There was an error checking your eligibility. Please contact customer support.";
				console.log("Processing generic ERROR status with message:", errorMessage);
				return this._createErrorEligibilityData(errorMessage);
			}

			// Handle AAA_ERROR status from workflow
			if (eligibilityData.eligibilityStatus === "AAA_ERROR") {
				// Try multiple ways to extract the error code
				const errorCode = eligibilityData.error?.code || eligibilityData.aaaErrorCode || eligibilityData.error?.allErrors?.[0]?.code || "Unknown";

				console.log("Processing AAA_ERROR with code:", errorCode, "from eligibilityData:", eligibilityData);
				return this._createAAAErrorEligibilityData(errorCode, eligibilityData.userMessage);
			}

			return eligibilityData;
		}

		// Handle error cases
		if (result?.success === false) {
			const errorMessage = result.error || result.message || "Unknown error from eligibility service";
			return this._createErrorEligibilityData(errorMessage);
		}

		// Fallback for unknown formats
		console.warn("Unknown webhook result format:", result);
		return this._createProcessingEligibilityData();
	}

	_createErrorEligibilityData(message) {
		return {
			isEligible: false,
			sessionsCovered: 0,
			deductible: { individual: 0 },
			eligibilityStatus: "ERROR",
			userMessage: message || "There was an error checking your eligibility. Please contact customer support.",
			planBegin: "",
			planEnd: ""
		};
	}

	_createAAAErrorEligibilityData(aaaError, errorMessage) {
		const aaaErrorMappings = {
			42: {
				title: "Service Temporarily Unavailable",
				message: "Your insurance company's system is temporarily unavailable. Please try again in a few minutes, or we can manually verify your coverage.",
				actionTitle: "Alternative Options",
				actionText: "Our team can verify your coverage manually while the system is down."
			},
			43: {
				title: "Provider Registration Issue",
				message: "Your insurance plan requires additional provider verification. Our team will contact you to complete the eligibility check.",
				actionTitle: "Manual Verification Required",
				actionText: "We'll verify your provider status and coverage details manually."
			},
			72: {
				title: "Member ID Not Found",
				message: "The member ID provided does not match our records. Please verify your member ID and try again.",
				actionTitle: "ID Verification Required",
				actionText: "Double-check your member ID matches exactly what's on your insurance card."
			},
			73: {
				title: "Name Mismatch",
				message: "The name provided doesn't match our records. Please verify the name matches exactly as shown on your insurance card.",
				actionTitle: "Name Verification Required",
				actionText: "Ensure the name matches exactly as it appears on your insurance card."
			},
			75: {
				title: "Member Not Found",
				message: "We couldn't find your insurance information in our system. This might be due to a recent plan change.",
				actionTitle: "Manual Verification Required",
				actionText: "Our team will manually verify your current insurance status."
			},
			76: {
				title: "Duplicate Member ID",
				message: "We found a duplicate member ID in the insurance database. This might be due to multiple plan records.",
				actionTitle: "Account Verification Required",
				actionText: "Our team will verify your current coverage status and resolve any account duplicates."
			},
			79: {
				title: "System Connection Issue",
				message: "There's a technical issue connecting with your insurance provider. Our team will manually verify your coverage.",
				actionTitle: "Manual Verification",
				actionText: "We'll process your eligibility manually and contact you with results."
			}
		};

		// Convert error code to number for lookup
		const numericErrorCode = parseInt(aaaError) || aaaError;
		const errorInfo = aaaErrorMappings[numericErrorCode] || aaaErrorMappings[String(numericErrorCode)];

		const finalMessage = errorMessage || errorInfo?.message || "There was an issue verifying your insurance coverage automatically. Our team will manually verify your coverage.";

		return {
			isEligible: false,
			sessionsCovered: 0,
			deductible: { individual: 0 },
			eligibilityStatus: "AAA_ERROR",
			userMessage: finalMessage,
			planBegin: "",
			planEnd: "",
			aaaErrorCode: String(aaaError),
			error: {
				code: String(aaaError),
				message: finalMessage,
				isAAAError: true,
				...errorInfo
			}
		};
	}

	_createProcessingEligibilityData() {
		const processingMessages = this.quizData?.ui?.statusMessages?.processing || {};

		return {
			isEligible: null,
			sessionsCovered: 0,
			deductible: { individual: 0 },
			eligibilityStatus: "PROCESSING",
			userMessage:
				processingMessages.userMessage ||
				"Your eligibility check and account setup is still processing in the background. This can take up to 3 minutes for complex insurance verifications and account creation. Please proceed with booking - we'll contact you with your coverage details shortly.",
			planBegin: "",
			planEnd: ""
		};
	}

	showResults(resultUrl, webhookSuccess = true, resultData = null, errorMessage = "") {
		console.log("showResults called with:", {
			webhookSuccess,
			resultData,
			eligibilityStatus: resultData?.eligibilityStatus,
			isEligible: resultData?.isEligible,
			errorMessage
		});

		this._stopLoadingMessages();

		// Hide loading screen and show results
		this._toggleElement(this.loading, false);
		this._toggleElement(this.questions, true);
		this._toggleElement(this.navigationButtons, false);
		this._toggleElement(this.progressSection, false);

		// Keep nav header visible for back button functionality
		this._toggleElement(this.navHeader, true);

		const quizType = this.quizData?.type || "general";
		const resultsHTML = webhookSuccess ? this._generateResultsHTML(quizType, resultData, resultUrl) : this._generateErrorResultsHTML(resultUrl, errorMessage);

		this.questionContainer.innerHTML = resultsHTML;
		this._attachFAQListeners();
		this._attachBookingButtonListeners();

		// Scroll to top of results
		window.scrollTo({ top: 0, behavior: "smooth" });
	}

	_stopLoadingMessages() {
		// Clear any loading intervals
		if (this.loadingInterval) {
			clearInterval(this.loadingInterval);
			this.loadingInterval = null;
		}
	}

	_generateResultsHTML(quizType, resultData, resultUrl) {
		// Determine if this quiz should show insurance results
		if (this._isEligibilityQuiz(quizType, resultData)) {
			return this._generateInsuranceResultsHTML(resultData, resultUrl);
		}

		// For other quiz types, generate appropriate results
		switch (quizType) {
			case "assessment":
				return this._generateAssessmentResultsHTML(resultData, resultUrl);
			case "recommendation":
				return this._generateRecommendationResultsHTML(resultData, resultUrl);
			default:
				return this._generateGenericResultsHTML(resultData, resultUrl);
		}
	}

	_isEligibilityQuiz(quizType, resultData) {
		// Check if this quiz has eligibility data or is specifically an eligibility quiz
		return !!(resultData?.eligibilityStatus || resultData?.isEligible !== undefined || quizType === "eligibility" || this.quizData?.features?.eligibilityCheck);
	}

	_generateInsuranceResultsHTML(resultData, resultUrl) {
		console.log("_generateInsuranceResultsHTML called with:", {
			resultData,
			isEligible: resultData?.isEligible,
			eligibilityStatus: resultData?.eligibilityStatus,
			hasError: !!resultData?.error
		});

		if (!resultData) {
			console.log("No resultData, using generic results");
			return this._generateGenericResultsHTML(resultData, resultUrl);
		}

		const isEligible = resultData.isEligible === true;
		const eligibilityStatus = resultData.eligibilityStatus || "UNKNOWN";

		console.log("Processing eligibility status:", eligibilityStatus, "isEligible:", isEligible);

		if (isEligible && eligibilityStatus === "ELIGIBLE") {
			console.log("Generating eligible insurance results");
			return this._generateEligibleInsuranceResultsHTML(resultData, resultUrl);
		}

		if (eligibilityStatus === "AAA_ERROR") {
			console.log("Generating AAA error results");
			return this._generateAAAErrorResultsHTML(resultData, resultUrl);
		}

		if (eligibilityStatus === "TEST_DATA_ERROR") {
			console.log("Generating test data error results");
			return this._generateTestDataErrorResultsHTML(resultData, resultUrl);
		}

		if (eligibilityStatus === "ERROR") {
			console.log("Generating generic error results");
			return this._generateErrorResultsHTML(resultUrl, resultData.userMessage || resultData.error || "There was an error checking your eligibility. Please contact customer support.");
		}

		if (eligibilityStatus === "NOT_COVERED" || (resultData.isEligible === false && eligibilityStatus === "ELIGIBLE")) {
			console.log("Generating not covered insurance results");
			return this._generateNotCoveredInsuranceResultsHTML(resultData, resultUrl);
		}

		console.log("Generating ineligible insurance results (fallback)");
		return this._generateIneligibleInsuranceResultsHTML(resultData, resultUrl);
	}

	_generateGenericResultsHTML(resultData, resultUrl) {
		return `
			<div class="quiz-results-container">
				<div class="quiz-results-header">
					<h2 class="quiz-results-title">Quiz Complete</h2>
					<p class="quiz-results-subtitle">Thank you for completing the assessment.</p>
				</div>
				<div class="quiz-action-section">
					<div class="quiz-action-content">
						<div class="quiz-action-header">
							<h3 class="quiz-action-title">Next Steps</h3>
						</div>
						<div class="quiz-action-details">
							<div class="quiz-action-info">
								<div class="quiz-action-info-text">We've received your information and will be in touch soon with your personalized recommendations.</div>
							</div>
						</div>
						<a href="${resultUrl}" class="quiz-booking-button">Continue</a>
					</div>
				</div>
			</div>
		`;
	}

	_generateAssessmentResultsHTML(resultData, resultUrl) {
		// Implementation for assessment results
		return this._generateGenericResultsHTML(resultData, resultUrl);
	}

	_generateRecommendationResultsHTML(resultData, resultUrl) {
		// Implementation for recommendation results
		return this._generateGenericResultsHTML(resultData, resultUrl);
	}

	get isTestMode() {
		const testParam = new URLSearchParams(window.location.search).get("test");
		return testParam !== null && testParam !== "false";
	}

	// Debug method to manually test the enhanced notification system
	_testNotificationSystem() {
		console.log("🎯 Testing SMART notification system...");

		// Force create a questionContainer if it doesn't exist (for testing)
		if (!this.questionContainer) {
			console.log("🔧 Creating temporary questionContainer for testing");
			this.questionContainer = document.createElement("div");
			this.questionContainer.style.display = "none";
			document.body.appendChild(this.questionContainer);
		}

		// Test notifications that demonstrate the smart filtering/collapsing
		// Mix of simple and detailed notifications to show smart behavior

		console.log("📝 Creating test notifications...");

		// Simple notifications (no details to collapse)
		this._showBackgroundProcessNotification("Starting process...", "info");
		this._showBackgroundProcessNotification("Connected successfully", "success");
		this._showBackgroundProcessNotification("Authentication failed", "error");

		setTimeout(() => {
			// Detailed notifications (can be auto-collapsed)
			this._showBackgroundProcessNotification("Extraction Result<br>• Email: jane.humana@example.com<br>• Name: Jane Doe<br>• Missing fields: groupNumber", "info", "WARNING");

			this._showBackgroundProcessNotification("Processing Result<br>• Final status: ELIGIBLE<br>• Is eligible: true<br>• Has error: false", "info");

			this._showBackgroundProcessNotification(
				"Eligibility Result<br>✅ Status: ELIGIBLE<br>• Eligible: true<br>• Sessions: 10<br>• Message: Good news! Based on your insurance information, you are eligible for dietitian sessions.",
				"success"
			);
		}, 500);

		setTimeout(() => {
			// Critical notification (always stays expanded)
			this._showBackgroundProcessNotification("Critical system failure detected!<br>• Database: Offline<br>• Immediate action required<br>• Contact IT support", "error", "CRITICAL");
		}, 1000);

		setTimeout(() => {
			console.log("✅ Test complete! Enhanced notification system features:");
			console.log("   🔍 Filter buttons: Show only relevant notification types");
			console.log("   📦 Show All: Restores ALL notifications (even auto-removed ones)");
			console.log("   📱 Auto-collapse: Only affects detailed notifications");
			console.log("   ⚡ Simple notifications: Always visible (no collapse needed)");
			console.log("   🚨 Critical/Error: Always stay expanded");
			console.log("   🛡️ Smart prevention: Auto-removal disabled when 'Show All' is active");
			console.log("");
			console.log("🧪 Try filtering to 'Show All' to see all notifications restored!");
			console.log("   testNotifications() - Run this test again");
		}, 1500);
	}
}

document.addEventListener("DOMContentLoaded", () => {
	const quiz = new ModularQuiz();
	window.productQuiz = quiz;

	// Add test method to global scope for debugging
	window.testNotifications = () => quiz._testNotificationSystem();
});

