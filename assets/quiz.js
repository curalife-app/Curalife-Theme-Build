/**
 * Modular Quiz System for Shopify
 */

// Remove static import and use dynamic import instead
// import { NotificationManager } from '../utils/notifications.js';

var ELEMENT_SELECTORS = {
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
		this._initializeNotificationManager().thenfunction(() {
			this.init();
		});
	}

	async _initializeNotificationManager() {
		try {
			// Get the notifications.js URL from the data attribute set by Liquid
			var notificationsUrl = this.container.getAttribute("data-notifications-url");

			if (!notificationsUrl) {
				throw new Error("Notifications asset URL not found");
			}

			console.log("🔗 Loading notification system from:", notificationsUrl);

			// Dynamic import of the NotificationManager using the asset URL
			var NotificationManager = await import(notificationsUrl).NotificationManager;

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
				show: function(text, type = "info", priority = null) {
					console.log(`📢 Notification (${type}):", text);\n					return null;\n				},\n				clear: function() { return console.log(\"🧹 Clear notifications\"); },\n				exportNotifications: function() { return console.log(\"📤 Export notifications\"); }\n			};\n\n			return false;\n		}\n	}\n\n	_initializeDOMElements() {\n		this.container = document.querySelector(ELEMENT_SELECTORS.MAIN_CONTAINER);\n		if (!this.container) {\n			console.error(\"ModularQuiz: Main container not found. Quiz cannot start.\");\n			this._isInitialized = false;\n			return;\n		}\n\n		this.dataUrl = this.container.getAttribute(\"data-quiz-url\") || \"/apps/quiz/data.json\";\n\n		Object.keys(ELEMENT_SELECTORS).forEach(function(key) {\n			if (key !== \"MAIN_CONTAINER\") {\n				var selector = ELEMENT_SELECTORS[key];\n				this[this._selectorToProperty(key)] = this.container.querySelector(selector);\n			}\n		});\n\n		this.navHeader = this.container.querySelector(\"#quiz-nav-header\");\n		this.progressSection = this.container.querySelector(\"#quiz-progress-section\");\n		this._isInitialized = true;\n	}\n\n	_selectorToProperty(selectorKey) {\n		return selectorKey\n			.toLowerCase()\n			.split(\"_\")\n			.mapfunction((word, index) { return (index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))); }\n			.join(\"\");\n	}\n\n	_validateEssentialElements() {\n		var essentialElements = [\"questions\", \"results\", \"error\", \"loading\", \"progressBar\", \"questionContainer\", \"navigationButtons\", \"nextButton\"];\n\n		for (var element of essentialElements) {\n			if (!this[element]) {\n				this._displayCriticalError("Essential element "${element}" is missing");\n				return false;\n			}\n		}\n		return true;\n	}\n\n	_displayCriticalError(message) {\n		this.container.innerHTML = "
            <div class="quiz-error quiz-critical-error">
                <h3 class="quiz-subtitle quiz-error-text">Quiz Error</h3>
                <p class="quiz-text">${message}. Please refresh or contact support.</p>
            </div>
        ";\n		this._isInitialized = false;\n	}\n\n	async init() {\n		if (!this._isInitialized) return;\n\n		this._attachBackButtonListener();\n		this._attachNextButtonListener();\n		this._loadAndDisplayFirstStep();\n	}\n\n	_attachBackButtonListener() {\n		if (!this.navHeader) return;\n\n		var backButton = this.navHeader.querySelector(\"#quiz-back-button\");\n		if (backButton) {\n			backButton.addEventListenerfunction(\"click\", () {\n				// If we're showing results, go back to the last step\n				if (this.questionContainer.querySelector(\".quiz-results-container\")) {\n					this.currentStepIndex = this.quizData.steps.length - 1;\n					this.currentQuestionIndex = 0;\n					this.renderCurrentStep();\n					this.updateNavigation();\n				} else if (this.currentStepIndex === 0) {\n					window.location.href = \"/pages/telemedicine\";\n				} else {\n					this.goToPreviousStep();\n				}\n			});\n		}\n	}\n\n	_attachNextButtonListener() {\n		if (!this.nextButton) return;\n\n		this.nextButtonHandler = function(e) {\n			if (!this.nextButton.disabled) {\n				this.goToNextStep();\n			}\n		};\n\n		this.nextButton.addEventListener(\"click\", this.nextButtonHandler);\n	}\n\n	async _loadAndDisplayFirstStep() {\n		this._toggleElement(this.questions, false);\n		this._toggleElement(this.loading, true);\n\n		try {\n			await this.loadQuizData();\n			this._initializeResponses();\n			this._applyTestDataIfEnabled();\n\n			this._toggleElement(this.loading, false);\n			this._toggleElement(this.questions, true);\n			this._toggleElement(this.navHeader, true);\n			this._toggleElement(this.progressSection, true);\n\n			this.renderCurrentStep();\n			this.updateNavigation();\n		} catch (error) {\n			console.error(\"Failed to load quiz:\", error);\n			this._toggleElement(this.loading, false);\n			this._toggleElement(this.error, true);\n		}\n	}\n\n	async loadQuizData() {\n		var response = await fetch(this.dataUrl);\n		if (!response.ok) {\n			throw new Error("HTTP error! status: ${response.status}");\n		}\n\n		var text = await response.text();\n		this.quizData = JSON.parse(text);\n		this.config = this.quizData.config || {};\n\n		return this.quizData;\n	}\n\n	_initializeResponses() {\n		this.responses = this.quizData.steps.flatMap(step =>\n			step.questions ? step.questions.map(question => ({ stepId: step.id, questionId: question.id, answer: null })) : [{ stepId: step.id, questionId: step.id, answer: null }]\n		);\n	}\n\n	_applyTestDataIfEnabled() {\n		var testMode = new URLSearchParams(window.location.search).get(\"test\");\n\n		if (testMode && this.quizData.testData) {\n			var testDataKey = \"default\";\n			var displayName = testMode;\n\n			// Support different test scenarios\n			if (testMode === \"true\") {\n				testDataKey = \"default\";\n				displayName = \"TEST API - UHC Test Data\";\n			} else if (testMode === \"not-covered\") {\n				testDataKey = \"notCovered\";\n				displayName = \"TEST API - Not Covered Test\";\n			} else if (this.quizData.testData[testMode]) {\n				testDataKey = testMode;\n				// Create display names for better UX\n				var displayNames = {\n					default: \"TEST API - UHC Test Data\",\n					notCovered: \"TEST API - Not Covered Test\",\n					aetna_dependent: \"TEST API - Aetna Test Data\",\n					anthem_dependent: \"TEST API - Anthem Test Data\",\n					bcbstx_dependent: \"TEST API - BCBS TX Test Data\",\n					cigna_dependent: \"TEST API - Cigna Test Data\",\n					oscar_dependent: \"TEST API - Oscar Test Data\",\n					error_42: \"TEST API - Error 42 Test Data\",\n					error_43: \"TEST API - Error 43 Test Data\",\n					error_72: \"TEST API - Error 72 Test Data\",\n					error_73: \"TEST API - Error 73 Test Data\",\n					error_75: \"TEST API - Error 75 Test Data\",\n					error_79: \"TEST API - Error 79 Test Data\"\n				};\n				displayName = displayNames[testMode] || "TEST API - ${testMode.toUpperCase()}";\n			}\n\n			var testData = this.quizData.testData[testDataKey] || this.quizData.testData.default || this.quizData.testData;\n\n			if (testData) {\n				Object.keys(testData).forEach(function(questionId) {\n					var responseIndex = this.responses.findIndex(r => r.questionId === questionId);\n					if (responseIndex !== -1) {\n						this.responses[responseIndex].answer = testData[questionId];\n					}\n				});\n				this._addTestModeIndicator("🔬 ${displayName}");\n			}\n		}\n	}\n\n	_addTestModeIndicator(text = \"🧪 TEST MODE\") {\n		if (document.querySelector(\".quiz-test-mode-indicator\")) return;\n\n		var indicator = document.createElement(\"div\");\n		indicator.className = \"quiz-test-mode-indicator\";\n		indicator.innerHTML = text;\n		indicator.style.cssText = "
            position: fixed; top: 10px; right: 10px; background: #4CAF50;
            color: white; padding: 8px 12px; border-radius: 4px; font-weight: bold;
            font-size: 12px; z-index: 9999; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        ";\n		document.body.appendChild(indicator);\n		setTimeoutfunction(() { return indicator.remove(); }, 5000);\n	}\n\n	_showBackgroundProcessNotification(text, type = \"info\", priority = null) {\n		console.log(\"📢 Creating notification:\", { text: text.substring(0, 50) + \"...\", type, priority });\n\n		// Only show notifications if we have a container\n		if (!this.questionContainer) {\n			console.log(\"❌ No questionContainer found, skipping notification\");\n			return;\n		}\n\n		// Delegate completely to the modular notification system\n		return this.notificationManager.show(text, type, priority);\n	}\n\n	clearNotifications() {\n		return this.notificationManager.clear();\n	}\n\n	exportNotifications(format = \"text\", filter = \"all\") {\n		return this.notificationManager.exportNotifications(format, filter);\n	}\n\n	getCurrentStep() {\n		return this.(quizData && quizData.(steps && steps.[this.currentStepIndex] || null;\n	}\n\n	getCurrentQuestion() {\n		var step = this.getCurrentStep();\n		return (step && step.(questions && questions.[this.currentQuestionIndex] || null;\n	}\n\n	getResponseForCurrentQuestion() {\n		var step = this.getCurrentStep();\n		var questionId = step.questions ? step.questions[this.currentQuestionIndex].id : step.id;\n\n		return (\n			this.responses.find(r => r.questionId === questionId) || {\n				stepId: step.id,\n				questionId: questionId,\n				answer: null\n			}\n		);\n	}\n\n	isFormStep(stepId) {\n		return this.config.(formSteps && formSteps.includes(stepId) || false;\n	}\n\n	renderCurrentStep() {\n		var step = this.getCurrentStep();\n		if (!step) return;\n\n		this.questionContainer.className = \"quiz-question-container\";\n		this.questionContainer.classList.add("quiz-step-${this.currentStepIndex + 1}");\n		this.questionContainer.classList.add("quiz-step-${step.id}");\n\n		this._updateProgressBar();\n\n		var stepHTML = this._generateStepHTML(step);\n		this.questionContainer.innerHTML = stepHTML;\n\n		this._handleStepAcknowledgment(step);\n		this._attachStepEventListeners(step);\n		this.updateNavigation();\n\n		if (step.legal && !this.isFormStep(step.id)) {\n			this._addLegalTextAfterNavigation(step.legal);\n		}\n\n		window.scrollTo({ top: 0, behavior: \"smooth\" });\n	}\n\n	_updateProgressBar() {\n		var progress = ((this.currentStepIndex + 1) / this.quizData.steps.length) * 100;\n		if (this.progressBar) {\n			this.progressBar.classList.add(\"quiz-progress-bar-animated\");\n			this.progressBar.style.setProperty(\"--progress-width\", "${progress}%");\n\n			var progressIndicator = this.container.querySelector(\".quiz-progress-indicator\");\n			if (progressIndicator) {\n				var progressContainer = this.container.querySelector(\".quiz-progress-container\");\n				var containerWidth = (progressContainer && progressContainer.offsetWidth || 480;\n				var isMobile = window.innerWidth <= 768;\n				var indicatorHalfWidth = isMobile ? 16 : 26;\n				var indicatorPosition = (progress / 100) * containerWidth - indicatorHalfWidth;\n\n				progressIndicator.style.left = "${indicatorPosition}px";\n				progressIndicator.classList.toggle(\"visible\", progress > 0);\n			}\n		}\n	}\n\n	_generateStepHTML(step) {\n		var stepHTML = "<div class="animate-fade-in">";\n		stepHTML += this._generateStepInfoHTML(step);\n\n		if (step.(questions && questions.length > 0) {\n			stepHTML += this.isFormStep(step.id) ? this._generateFormStepHTML(step) : this._generateWizardStepHTML(step);\n		} else if (!step.info) {\n			stepHTML += "<p class="quiz-error-text">Step configuration error. Please contact support.</p>";\n		}\n\n		stepHTML += \"</div>\";\n		return stepHTML;\n	}\n\n	_generateStepInfoHTML(step) {\n		if (!step.info) return \"\";\n\n		return "
            <h3 class="quiz-title">${step.info.heading}</h3>
            <p class="quiz-text">${step.info.text}</p>
            ${step.info.subtext ? `<p class="quiz-subtext">${step.info.subtext}</p>" : \"\"}\n        ";
	}

	_generateFormStepHTML(step) {
		var isLastStep = this.currentStepIndex === this.quizData.steps.length - 1;
		var buttonText = isLastStep ? step.ctaText || "Finish Quiz" : step.ctaText || "Continue";

		return `
            ${step.(info && info.formSubHeading ? `<h4 class="quiz-heading quiz-heading-mobile-outside">${step.info.formSubHeading}</h4>` : ""}
			<div class="quiz-form-container">
                ${step.(info && info.formSubHeading ? `<h4 class="quiz-heading quiz-heading-desktop-inside">${step.info.formSubHeading}</h4>` : ""}
				<div class="quiz-space-y-6">
					${this._processFormQuestions(step.questions)}
				</div>
				<button class="quiz-nav-button quiz-nav-button--primary quiz-form-button" id="quiz-form-next-button">
					${buttonText}
				</button>
				${step.legal ? `<p class="quiz-legal-form">${step.legal}</p>" : \"\"}\n			</div>\n		";
	}

	_generateWizardStepHTML(step) {
		var question = step.questions[this.currentQuestionIndex];
		var response = this.getResponseForCurrentQuestion();

		if (!question) {
			return "<p class=\"quiz-error-text\">Question not found. Please try again.</p>";
		}

		var html = "";

		if (!step.info) {
			html += `
				<h3 class="quiz-title">${question.text}</h3>
				${question.helpText ? `<p class="quiz-text">${question.helpText}</p>" : \"\"}\n			";
		} else {
			html += `
				<div class="quiz-divider">
					<h4 class="quiz-heading">${question.text}</h4>
					${question.helpText ? `<p class="quiz-text-sm">${question.helpText}</p>" : \"\"}\n				</div>\n			";
		}

		html += this._renderQuestionByType(question, response);
		return html;
	}

	_toggleElement(element, show) {
		(element && element.classList.toggle("hidden", !show);
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
				return `<p class="quiz-error-text">Unsupported field type: ${question.type}</p>";\n		}\n	}\n\n	renderMultipleChoice(question, response) {\n		return this._renderCardOptions(question, response, \"radio\");\n	}\n\n	renderCheckbox(question, response) {\n		var selectedOptions = Array.isArray(response.answer) ? response.answer : [];\n\n		if (question.id === \"consent\") {\n			return this._renderSimpleCheckboxes(question, selectedOptions);\n		}\n		return this._renderCardOptions(question, response, \"checkbox\");\n	}\n\n	_renderCardOptions(question, response, inputType) {\n		var selectedOptions = inputType === \"checkbox\" ? (Array.isArray(response.answer) ? response.answer : []) : null;\n		var isSelected = option => (inputType === \"checkbox\" ? selectedOptions.includes(option.id) : response.answer === option.id);\n\n		var html = '<div class=\"quiz-grid-2\">';\n		question.options.forEach(function(option) {\n			var selected = isSelected(option);\n			html += "
				<label for="${option.id}" class="quiz-option-card">
					<input type="${inputType}" id="${option.id}" name="question-${question.id}" value="${option.id}" class="quiz-sr-only" ${selected ? "checked" : ""}>
					<div class="quiz-option-button ${selected ? "selected" : ""}">
						<div class="quiz-option-text">
							<div class="quiz-option-text-content">${option.text}</div>
						</div>
						${selected ? this._getCheckmarkSVG() : ""}
					</div>
				</label>
			";\n		});\n		return html + \"</div>\";\n	}\n\n	_renderSimpleCheckboxes(question, selectedOptions) {\n		var html = '<div class=\"quiz-space-y-3 quiz-spacing-container\">';\n		question.options.forEach(function(option) {\n			html += "
				<div class="quiz-checkbox-container">
					<input type="checkbox" id="${option.id}" name="question-${question.id}" value="${option.id}" class="quiz-checkbox-input" ${selectedOptions.includes(option.id) ? "checked" : ""}>
					<label class="quiz-checkbox-label" for="${option.id}">${option.text}</label>
				</div>
			";\n		});\n		return html + \"</div>\";\n	}\n\n	renderDropdown(question, response) {\n		var options = question.options || [];\n		var placeholder = question.placeholder || \"Select an option\";\n		var optionsHTML = options.map(option => "<option value="${option.id}" ${response.answer === option.id ? "selected" : ""}>${option.text}</option>").join(\"\");\n\n		return "
			<div>
				<select id="question-${question.id}" class="quiz-select">
					<option value="">${placeholder}</option>
					${optionsHTML}
				</select>
				${this._getErrorElement(question.id)}
			</div>
        ";\n	}\n\n	renderTextInput(question, response) {\n		return "
			<div>
				<input type="text" id="question-${question.id}" class="quiz-input"
					placeholder="${question.placeholder || "Type your answer here..."}"
					value="${response.answer || ""}"
					aria-describedby="error-${question.id}">
				${this._getErrorElement(question.id)}
			</div>
		";\n	}\n\n	_getErrorElement(questionId) {\n		return "<p id="error-${questionId}" class="quiz-error-text quiz-error-hidden"></p>";\n	}\n\n	renderDatePart(question, response) {\n		var part = question.part;\n		var options = this._getDatePartOptions(part);\n		var placeholder = question.placeholder || "Select ${part}";\n\n		return "
            <div>
                <select id="question-${question.id}" class="quiz-select">
                    <option value="">${placeholder}</option>
                    ${options.map(option => `<option value="${option.id}" ${response.answer === option.id ? "selected" : ""}>${option.text}</option>").join(\"\")}\n                </select>\n			</div>\n		";
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
			return Array.fromfunction({ length: 31 }, (_, i) {
				var day = String(i + 1).padStart(2, "0");
				return { id: day, text: day };
			});
		} else if (part === "year") {
			var endYear = 2007;
			var startYear = 1920;
			var yearCount = endYear - startYear + 1;
			return Array.fromfunction({ length: yearCount }, (_, i) {
				var year = String(endYear - i);
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
		";\n	}\n\n	renderRating(question, response) {\n		return "
			<div class="quiz-spacing-container">
				<input type="range" id="question-${question.id}" class="quiz-range"
					min="1" max="10" step="1" value="${response.answer || 5}">
				<div class="quiz-range-labels">
                    <span>1</span><span>5</span><span>10</span>
				</div>
			</div>
		";\n	}\n\n	renderDateInput(question, response) {\n		return "
            <div class="quiz-question-section">
                <input type="date" id="question-${question.id}" class="quiz-input"
                    placeholder="${question.helpText || "MM/DD/YYYY"}"
                    value="${response.answer || ""}"
                    aria-describedby="error-${question.id}">
                ${this._getErrorElement(question.id)}
                ${question.helpText ? `<p class="quiz-text-sm">${question.helpText}</p>" : \"\"}\n            </div>\n        ";
	}

	_getCheckmarkSVG() {
		return "<div class=\"quiz-checkmark\">\n            <svg width=\"19\" height=\"19\" viewBox=\"0 0 19 19\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                <path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M9.79158 18.75C4.84404 18.75 0.833252 14.7393 0.833252 9.79168C0.833252 4.84413 4.84404 0.833344 9.79158 0.833344C14.7392 0.833344 18.7499 4.84413 18.7499 9.79168C18.7499 14.7393 14.7392 18.75 9.79158 18.75ZM13.7651 7.82516C14.0598 7.47159 14.012 6.94613 13.6584 6.65148C13.3048 6.35685 12.7793 6.40462 12.4848 6.75818L8.90225 11.0572L7.04751 9.20243C6.72207 8.87701 6.19444 8.87701 5.86899 9.20243C5.54356 9.52784 5.54356 10.0555 5.86899 10.3809L8.369 12.8809C8.53458 13.0465 8.76208 13.1348 8.996 13.1242C9.22992 13.1135 9.44858 13.005 9.59842 12.8252L13.7651 7.82516Z\" fill=\"#418865\"/>\n            </svg>\n        </div>";
	}

	goToPreviousStep() {
		if (this.currentStepIndex <= 0) return;

		this.currentStepIndex--;
		this.currentQuestionIndex = 0;
		this.renderCurrentStep();
		this.updateNavigation();
	}

	goToNextStep() {
		var currentStep = this.getCurrentStep();
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
		var step = this.getCurrentStep();
		if (!step) {
			this.nextButton.disabled = true;
			return;
		}

		var isFormStep = this.isFormStep(step.id);
		var currentQuestion = step.(questions && questions.[this.currentQuestionIndex];

		// Always show navigation for non-required multiple choice questions
		var isNonRequiredMultipleChoice = (currentQuestion && currentQuestion.type === "multiple-choice" && !currentQuestion.required;
		var isCurrentQuestionAutoAdvance = currentQuestion && this._shouldAutoAdvance(currentQuestion);

		var shouldShowNavigation = isNonRequiredMultipleChoice || !isCurrentQuestionAutoAdvance || isFormStep;
		this._setNavigationVisibility(shouldShowNavigation);

		if (!shouldShowNavigation) return;

		var isLastStep = this.currentStepIndex === this.quizData.steps.length - 1;
		var isLastQuestionInStep = isFormStep ? true : step.questions ? this.currentQuestionIndex === step.questions.length - 1 : true;

		if (isLastStep && isLastQuestionInStep) {
			this.nextButton.innerHTML = step.ctaText || "Finish Quiz";
		} else {
			this.nextButton.innerHTML = this._getStepButtonText(step);
		}

		if (isFormStep && step.questions) {
			this._setNavigationVisibility(false);
			var formButton = this.questionContainer.querySelector("#quiz-form-next-button");
			if (formButton) {
				formButton.disabled = this.submitting;
			}
			return;
		}

		var hasAnswer = this._hasValidAnswer(step);
		this.nextButton.disabled = !hasAnswer || this.submitting;
	}

	_getStepButtonText(step) {
		var question = step.questions[this.currentQuestionIndex];

		// Handle multiple choice questions that are not required
		if ((question && question.type === "multiple-choice" && !question.required) {
			var response = this.responses.find(r => r.questionId === question.id);
			var hasSelection = response && response.answer;
			return hasSelection ? step.ctaText || "Continue" : "Skip";
		}

		// Handle checkbox questions (like medical step)
		if ((question && question.type === "checkbox") {
			var response = this.responses.find(r => r.questionId === question.id);
			var hasSelection = response && Array.isArray(response.answer) && response.answer.length > 0;
			return hasSelection ? step.ctaText || "Continue" : "Skip";
		}

		return step.ctaText || "Continue";
	}

	_hasValidAnswer(step) {
		if (step.info && (!step.questions || step.questions.length === 0)) {
			return true;
		}

		if (step.(questions && questions.length > 0) {
			var question = step.questions[this.currentQuestionIndex];
			if (!question) return false;

			if (!question.required) return true;

			var response = this.responses.find(r => r.questionId === question.id);
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

		var step = this.getCurrentStep();
		if (!step) return;

		if (step.(questions && questions.length > 0) {
			var question = step.questions[this.currentQuestionIndex];
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
		var step = this.getCurrentStep();
		if ((step && step.questions) {
			this._updateResponse(questionId, answer, step.id);
		}
	}

	_updateResponse(questionId, answer, stepId) {
		var responseIndex = this.responses.findIndex(r => r.questionId === questionId);
		if (responseIndex !== -1) {
			this.responses[responseIndex].answer = answer;
		} else {
			this.responses.push({ stepId, questionId, answer });
		}
	}

	_handleAutoAdvance(answer) {
		var allOptionButtons = this.questionContainer.querySelectorAll(".quiz-option-button");
		allOptionButtons.forEach(function(button) {
			button.classList.remove("selected", "processing", "auto-advance-feedback");
			var existingCheckmark = button.querySelector(".quiz-checkmark");
			if (existingCheckmark) {
				existingCheckmark.remove();
			}
		});

		var selectedElement = this.questionContainer.querySelector(`input[value="${answer}"]:checked");\n		if (selectedElement) {\n			var optionButton = selectedElement.closest(\".quiz-option-card\")?.querySelector(\".quiz-option-button\");\n			if (optionButton) {\n				optionButton.classList.add(\"selected\", \"processing\");\n				optionButton.innerHTML += this._getCheckmarkSVG();\n				optionButton.classList.add(\"auto-advance-feedback\");\n			}\n		}\n\n		setTimeoutfunction(() {\n			this.goToNextStep();\n		}, this.config.autoAdvanceDelay || 600);\n	}\n\n	_updateCheckboxVisualState(question, answer) {\n		if (!Array.isArray(answer)) return;\n\n		var allCheckboxes = this.questionContainer.querySelectorAll("input[name="question-${question.id}"]");\n		allCheckboxes.forEach(function(checkbox) {\n			var optionCard = checkbox.closest(\".quiz-option-card\");\n			var optionButton = (optionCard && optionCard.querySelector(\".quiz-option-button\");\n\n			if (optionButton) {\n				var shouldBeSelected = answer.includes(checkbox.value);\n				var isCurrentlySelected = optionButton.classList.contains(\"selected\");\n\n				if (shouldBeSelected !== isCurrentlySelected) {\n					if (shouldBeSelected) {\n						optionButton.classList.add(\"selected\");\n						checkbox.checked = true;\n						if (!optionButton.querySelector(\".quiz-checkmark\")) {\n							optionButton.innerHTML += this._getCheckmarkSVG();\n						}\n					} else {\n						optionButton.classList.remove(\"selected\");\n						checkbox.checked = false;\n						var checkmark = optionButton.querySelector(\".quiz-checkmark\");\n						if (checkmark) {\n							checkmark.remove();\n						}\n					}\n				}\n			}\n		});\n\n		this.updateNavigation();\n	}\n\n	_handleStepAcknowledgment(step) {\n		if (!step.info) return;\n\n		var infoResponse = this.responses.find(r => r.stepId === step.id && r.questionId === step.id);\n		if (infoResponse) {\n			infoResponse.answer = \"info-acknowledged\";\n		} else {\n			this.responses.push({\n				stepId: step.id,\n				questionId: step.id,\n				answer: \"info-acknowledged\"\n			});\n		}\n\n		if (!step.questions || step.questions.length === 0) {\n			setTimeoutfunction(() {\n				this.nextButton.disabled = false;\n			}, 0);\n		}\n	}\n\n	_attachStepEventListeners(step) {\n		if (!step.questions || step.questions.length === 0) return;\n\n		if (this.isFormStep(step.id)) {\n			step.questions.forEach(function(question) {\n				this._attachFormQuestionListener(question);\n			});\n\n			var formButton = this.questionContainer.querySelector(\"#quiz-form-next-button\");\n			if (formButton) {\n				formButton.removeEventListener(\"click\", this.formButtonHandler);\n				this.formButtonHandler = function() {\n					if (!formButton.disabled) {\n						this.goToNextStep();\n					}\n				};\n				formButton.addEventListener(\"click\", this.formButtonHandler);\n			}\n		} else {\n			var currentQuestion = step.questions[this.currentQuestionIndex];\n			if (currentQuestion) {\n				this._attachQuestionEventListeners(currentQuestion);\n			}\n		}\n	}\n\n	_attachQuestionEventListeners(question) {\n		if (!question) return;\n\n		var handlers = {\n			\"multiple-choice\": function() { return this._attachInputGroupListeners(question; }, \"change\", input => this.handleAnswer(input.value)),\n			checkbox: function() { return this._attachCheckboxListeners(question); },\n			dropdown: function() { return this._attachDropdownListeners(question); },\n			\"date-part\": function() { return this._attachDropdownListeners(question); },\n			text: function() { return this._attachTextInputListeners(question); },\n			date: function() { return this._attachTextInputListeners(question); },\n			textarea: function() { return this._attachSingleInputListener(question; }, \"input\", input => this.handleAnswer(input.value)),\n			rating: function() { return this._attachSingleInputListener(question; }, \"input\", input => this.handleAnswer(parseInt(input.value, 10))),\n			\"payer-search\": function() { return this._attachPayerSearchListeners(question); }\n		};\n\n		handlers[question.type]?.();\n	}\n\n	_attachInputGroupListeners(question, eventType, callback) {\n		var inputs = this.questionContainer.querySelectorAll("input[name="question-${question.id}"]");\n		inputs.forEachfunction(input => input.addEventListener(eventType, () { return callback(input))); };\n	}\n\n	_attachSingleInputListener(question, eventType, callback) {\n		var input = this.questionContainer.querySelector("#question-${question.id}");\n		if (input) input.addEventListenerfunction(eventType, () { return callback(input)); };\n	}\n\n	_attachCheckboxListeners(question) {\n		var checkboxInputs = this.questionContainer.querySelectorAll("input[name="question-${question.id}"]");\n		var getSelectedValues = function() { return Array.from(checkboxInputs); }\n				.filter(cb => cb.checked)\n				.map(cb => cb.value);\n\n		checkboxInputs.forEach(function(input) {\n			input.removeEventListener(\"change\", input._changeHandler);\n			input._changeHandler = function() { return this.handleAnswer(getSelectedValues()); };\n			input.addEventListener(\"change\", input._changeHandler);\n		});\n	}\n\n	_attachDropdownListeners(question) {\n		var dropdown = this.questionContainer.querySelector("#question-${question.id}");\n		if (!dropdown) return;\n\n		dropdown.addEventListenerfunction(\"change\", () {\n			this.handleFormAnswer(question.id, dropdown.value);\n			this._updateDropdownColor(dropdown);\n			this._clearFieldError(question.id, dropdown);\n		});\n		this._updateDropdownColor(dropdown);\n	}\n\n	_attachTextInputListeners(question) {\n		var textInput = this.questionContainer.querySelector("#question-${question.id}");\n		if (!textInput) return;\n\n		var validate = function() {\n			var validationResult = this._validateFieldValue(question, textInput.value);\n			this._updateFieldValidationState(textInput, question, validationResult);\n		};\n\n		this._removeExistingHandlers(textInput, [\"input\", \"blur\", \"change\"]);\n\n		textInput._inputHandler = function() { return this.handleFormAnswer(question.id; }, textInput.value);\n		textInput._blurHandler = validate;\n		textInput._changeHandler = validate;\n\n		[\"input\", \"blur\", \"change\"].forEachfunction((event, i) {\n			var handler = [textInput._inputHandler, textInput._blurHandler, textInput._changeHandler][i];\n			textInput.addEventListener(event, handler);\n		});\n	}\n\n	_removeExistingHandlers(element, events) {\n		events.forEach(event => element.removeEventListener(event, element["_${event}Handler"]));\n	}\n\n	_attachFormQuestionListener(question) {\n		var formHandlers = {\n			dropdown: function() { return this._attachDropdownListeners(question); },\n			\"date-part\": function() { return this._attachDropdownListeners(question); },\n			text: function() { return this._attachTextInputListeners(question); },\n			date: function() { return this._attachTextInputListeners(question); },\n			checkbox: function() { return this._attachFormCheckboxListeners(question); },\n			\"payer-search\": function() { return this._attachPayerSearchFormListeners(question); }\n		};\n\n		formHandlers[question.type]?.();\n	}\n\n	_attachFormCheckboxListeners(question) {\n		var checkboxInputs = this.questionContainer.querySelectorAll("input[name="question-${question.id}"]");\n		var getFormValue = input =>\n			question.options.length === 1\n				? input.checked\n					? [input.value]\n					: []\n				: Array.from(checkboxInputs)\n						.filter(cb => cb.checked)\n						.map(cb => cb.value);\n\n		checkboxInputs.forEach(function(input) {\n			input.onclick = function() { return this.handleFormAnswer(question.id; }, getFormValue(input));\n		});\n	}\n\n	_validateFormStep(step) {\n		var validationErrors = step.questions.map(question => this._validateQuestionInForm(question)).filter(error => error);\n\n		if (validationErrors.length > 0) {\n			this._displayValidationErrors(validationErrors);\n			return false;\n		}\n		return true;\n	}\n\n	_validateQuestionInForm(question) {\n		var response = this.responses.find(r => r.questionId === question.id);\n		var currentValue = (response && response.answer;\n\n		if (question.required && this._isEmptyValue(currentValue, question.type)) {\n			return {\n				questionId: question.id,\n				message: this.quizData.(ui && ui.(errorMessages && errorMessages.validationRequired || \"This field is required\"\n			};\n		}\n\n		if (currentValue && question.type !== \"payer-search\") {\n			var validationResult = this._validateFieldValue(question, currentValue);\n			if (!validationResult.isValid) {\n				return {\n					questionId: question.id,\n					message: validationResult.errorMessage\n				};\n			}\n		}\n\n		return null;\n	}\n\n	_isEmptyValue(value, questionType) {\n		if (!value) return true;\n		if (questionType === \"checkbox\") return !Array.isArray(value) || value.length === 0;\n		if (typeof value === \"string\") return value.trim() === \"\";\n		return false;\n	}\n\n	_displayValidationErrors(validationErrors) {\n		var firstInvalidField = null;\n\n		validationErrors.forEachfunction((error, index) {\n			var input = this._getValidationElements(error.questionId).input;\nvar errorEl = this._getValidationElements(error.questionId).errorEl;\n\n			if (input) {\n				input.classList.add(\"quiz-input-error\");\n				input.classList.remove(\"quiz-input-valid\");\n				if (index === 0) firstInvalidField = input;\n			}\n\n			if (errorEl) {\n				errorEl.textContent = error.message;\n				errorEl.classList.remove(\"quiz-error-hidden\");\n				errorEl.classList.add(\"quiz-error-visible\");\n			}\n		});\n\n		if (firstInvalidField) {\n			this._scrollToInvalidField(firstInvalidField);\n		}\n	}\n\n	_getValidationElements(questionId) {\n		return {\n			input: this.questionContainer.querySelector("#question-${questionId}"),\n			errorEl: this.questionContainer.querySelector("#error-${questionId}`)
		};
	}

	_validateFieldValue(question, value) {
		var errorMessages = this.quizData.(ui && ui.errorMessages || {};

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
		var patterns = this.quizData.function(validation && validation.patterns || {};
		var validations = {
			q4: { pattern: patterns.memberId || "^.{6,20}$", message: errorMessages.validationMemberId || "Minimum 6 characters" },
			q4_group: { pattern: patterns.groupNumber || "^$|^.{5,15}$", message: errorMessages.validationGroupNumber || "Minimum 5 characters" },
			q7: { pattern: patterns.name || "^[A-Za-z\\s]{1,100}$", message: errorMessages.validationName || "Use only A–Z letters and spaces" },
			q8: { pattern: patterns.name || "^[A-Za-z\\s]{1,100}$", message: errorMessages.validationName || "Use only A–Z letters and spaces" },
			q9: { pattern: patterns.email || "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", message: errorMessages.validationEmail || "Enter valid email" },
			q10: { custom: () { return this._validatePhoneNumber(trimmedValue); }, message: errorMessages.validationPhone || "Enter valid phone" }
		};

		var validation = validations[question.id];
		if (validation) {
			var isValid = validation.custom ? validation.custom() : new RegExp(validation.pattern).test(trimmedValue);
			return isValid ? { isValid: true, errorMessage: null } : { isValid: false, errorMessage: validation.message };
		}

		if (question.(validation && validation.pattern) {
			var isValid = new RegExp(question.validation.pattern).test(trimmedValue);
			return isValid ? { isValid: true, errorMessage: null } : { isValid: false, errorMessage: question.validation.message || "Invalid format" };
		}

		return { isValid: true, errorMessage: null };
	}

	_validatePhoneNumber(phone) {
		var cleanPhone = phone.replace(/[\s\-\(\)\.]/g, "");

		var patterns = [
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
		var errorEl = this.questionContainer.querySelector(`#error-${question.id}");\n		var isValid = validationResult.isValid;\n\n		input.classList.toggle(\"quiz-input-error\", !isValid);\n		input.classList.toggle(\"quiz-input-valid\", isValid);\n\n		if (errorEl) {\n			if (isValid) {\n				errorEl.classList.add(\"quiz-error-hidden\");\n				errorEl.classList.remove(\"quiz-error-visible\");\n			} else if (validationResult.errorMessage) {\n				errorEl.textContent = validationResult.errorMessage;\n				errorEl.classList.remove(\"quiz-error-hidden\");\n				errorEl.classList.add(\"quiz-error-visible\");\n			}\n		}\n\n		return isValid;\n	}\n\n	_clearFieldError(questionId, input) {\n		if (input.value && input.value !== \"\") {\n			var errorEl = this.questionContainer.querySelector("#error-${questionId}");\n			if (errorEl) {\n				input.classList.remove(\"quiz-input-error\");\n				input.classList.add(\"quiz-input-valid\");\n				errorEl.classList.add(\"quiz-error-hidden\");\n				errorEl.classList.remove(\"quiz-error-visible\");\n			}\n		}\n	}\n\n	_updateDropdownColor(dropdown) {\n		var hasSelection = dropdown.value && dropdown.value !== dropdown.options[0].value;\n		dropdown.style.color = hasSelection ? \"var(--quiz-text-primary)\" : \"#B0B0B0\";\n		dropdown.classList.toggle(\"quiz-dropdown-selected\", hasSelection);\n	}\n\n	_scrollToInvalidField(fieldElement) {\n		if (!fieldElement) return;\n\n		var isMobile = window.innerWidth <= 768;\n		if (isMobile) {\n			var fieldRect = fieldElement.getBoundingClientRect();\n			var offset = 100;\n			var currentScrollY = window.pageYOffset || document.documentElement.scrollTop;\n			var targetScrollY = currentScrollY + fieldRect.top - offset;\n\n			window.scrollTo({\n				top: Math.max(0, targetScrollY),\n				behavior: \"smooth\"\n			});\n\n			setTimeoutfunction(() {\n				if (fieldElement.focus) {\n					fieldElement.focus();\n				}\n			}, 300);\n		}\n	}\n\n	async finishQuiz() {\n		var resultUrl = this.container.getAttribute(\"data-result-url\") || this.container.getAttribute(\"data-booking-url\") || \"/quiz-complete\";\n\n		try {\n			this.submitting = true;\n			this.nextButton.disabled = true;\n\n			this._toggleElement(this.navigationButtons, false);\n			this._toggleElement(this.progressSection, false);\n\n			// Start the comprehensive loading sequence\n			await this._showComprehensiveLoadingSequence();\n\n			// Check if eligibility workflow is complete\n			var eligibilityResult = null;\n			if (this.eligibilityWorkflowPromise) {\n				if (this.eligibilityWorkflowResult) {\n					// Already completed\n					eligibilityResult = this.eligibilityWorkflowResult;\n					console.log(\"Using cached eligibility result:\", eligibilityResult);\n				} else {\n					// Still running - wait for it\n					try {\n						eligibilityResult = await this.eligibilityWorkflowPromise;\n						console.log(\"Waited for eligibility result:\", eligibilityResult);\n					} catch (error) {\n						console.error(\"Eligibility workflow failed:\", error);\n						eligibilityResult = this._createErrorEligibilityData(\"Eligibility check failed\");\n					}\n				}\n			} else {\n				// No eligibility check was triggered - use default processing status\n				eligibilityResult = this._createProcessingEligibilityData();\n				console.log(\"No eligibility workflow, using processing status\");\n			}\n\n			// Process the result consistently\n			var finalResult;\n			if (eligibilityResult) {\n				// Check if this is already processed eligibility data or a raw webhook response\n				if (eligibilityResult.eligibilityStatus && typeof eligibilityResult.eligibilityStatus === \"string\") {\n					// This is already processed eligibility data - use it directly\n					finalResult = eligibilityResult;\n					console.log(\"Using eligibility result directly (already processed):\", finalResult);\n				} else {\n					// This is a raw webhook response - process it\n					finalResult = this._processWebhookResult(eligibilityResult);\n					console.log(\"Processed webhook result:\", finalResult);\n				}\n			} else {\n				// No eligibility check was run - use default processing status\n				finalResult = this._createProcessingEligibilityData();\n				console.log(\"No eligibility result, using processing status\");\n			}\n\n			console.log(\"Processing eligibility result in finishQuiz:\", {\n				eligibilityResult: finalResult,\n				hasError: !!(finalResult && finalResult.error,\n				status: (finalResult && finalResult.eligibilityStatus,\n				isEligible: (finalResult && finalResult.isEligible\n			});\n\n			// Test mode comprehensive finish notification\n			if (this.isTestMode) {\n				var workflowStatus = this.eligibilityWorkflowPromise ? (this.eligibilityWorkflowResult ? \"✅ Completed\" : \"⏳ In Progress\") : \"❌ Not Started\";\n\n				var userCreationStatus = this.userCreationWorkflowPromise ? \"✅ Started\" : \"❌ Not Started\";\n\n				this._showBackgroundProcessNotification(\n					"
					🧪 TEST MODE - Quiz Completion Status<br>
					• Eligibility Workflow: ${workflowStatus}<br>
					• User Creation: ${userCreationStatus}<br>
					• Final Status: ${(finalResult && finalResult.eligibilityStatus || "Unknown"}<br>
					• Is Eligible: ${(finalResult && finalResult.isEligible}<br>
					• Result URL: ${resultUrl}<br>
					• Total Responses: ${this.(responses && responses.length || 0}
				",\n					\"info\"\n				);\n			}\n\n			console.log(\"Showing results with data:\", {\n				resultData: finalResult,\n				eligibilityStatus: (finalResult && finalResult.eligibilityStatus,\n				webhookSuccess: true\n			});\n\n			this.showResults(resultUrl, true, finalResult);\n		} catch (error) {\n			console.error(\"Error finishing quiz:\", error);\n\n			// Test mode error notification\n			if (this.isTestMode) {\n				this._showBackgroundProcessNotification(\n					"
					🧪 TEST MODE - Quiz Finish Error<br>
					❌ ${error.message}<br>
					• Check console for details
				",\n					\"error\"\n				);\n			}\n\n			this.showResults(resultUrl, false, null, error.message);\n		}\n	}\n\n	// Comprehensive loading sequence with animated status updates\n	async _showComprehensiveLoadingSequence() {\n		// Show the loading screen with progress steps\n		this._showLoadingScreen();\n\n		var loadingSteps = [\n			{ title: \"Processing Your Answers\", description: \"Analyzing your health information...\" },\n			{ title: \"Checking Insurance Coverage\", description: \"Verifying your benefits...\" },\n			{ title: \"Finding Your Dietitian\", description: \"Matching you with the right expert...\" },\n			{ title: \"Preparing Your Results\", description: \"Finalizing your personalized plan...\" }\n		];\n\n		for (var i = 0; i < loadingSteps.length; i++) {\n			var step = loadingSteps[i];\n			this._updateLoadingStep(step);\n\n			// Wait between steps for realistic loading feel\n			await new Promise(resolve => setTimeout(resolve, 900));\n		}\n\n		// Final completion step\n		this._updateLoadingStep({ title: \"Almost Ready!\", description: \"Preparing your personalized results...\" });\n\n		// Final wait before showing results\n		await new Promise(resolve => setTimeout(resolve, 800));\n	}\n\n	_showLoadingScreen() {\n		// Hide quiz content and show loading screen\n		this._toggleElement(this.questions, false);\n		this._toggleElement(this.results, false);\n		this._toggleElement(this.error, false);\n\n		// Show loading container (using the correct property name 'loading')\n		if (this.loading) {\n			this.loading.innerHTML = "
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
			";\n			this._toggleElement(this.loading, true);\n		} else {\n			// Fallback: update next button\n			this.nextButton.innerHTML = "<div class="quiz-spinner"></div>Processing...";\n		}\n	}\n\n	_updateLoadingStep(step) {\n		var titleElement = document.querySelector(\".quiz-loading-step-title\");\n		var descriptionElement = document.querySelector(\".quiz-loading-step-description\");\n\n		if (titleElement && descriptionElement) {\n			// Animate out\n			titleElement.style.opacity = \"0\";\n			descriptionElement.style.opacity = \"0\";\n\n			setTimeoutfunction(() {\n				// Update content\n				titleElement.textContent = step.title;\n				descriptionElement.textContent = step.description;\n\n				// Animate in\n				titleElement.style.opacity = \"1\";\n				descriptionElement.style.opacity = \"1\";\n			}, 300);\n		}\n	}\n\n	// HIPAA COMPLIANCE: This method has been removed to prevent PHI data from being sent directly to eligibility workflow from browser\n	// Eligibility checking is now handled server-side within the user creation workflow\n	_triggerEligibilityWorkflow() {\n		console.warn(\"⚠️ HIPAA COMPLIANCE: Direct eligibility workflow calls from browser are disabled. Eligibility will be checked server-side.\");\n		// Show user-friendly notification\n		this._showBackgroundProcessNotification(\"🔒 Insurance verification will be processed securely server-side\", \"info\");\n	}\n\n	_triggerUserCreationWorkflow() {\n		try {\n			// HIPAA COMPLIANT: Start orchestrator workflow with status tracking\n			console.log(\"🔒 Starting HIPAA-compliant orchestrator workflow with status tracking\");\n			this._startOrchestratorWorkflow();\n		} catch (error) {\n			console.error(\"Failed to trigger orchestrator workflow:\", error);\n		}\n	}\n\n	// =======================================================================\n	// Orchestrator Workflow Methods (HIPAA Compliant)\n	// =======================================================================\n\n	/**\n	 * Starts the orchestrator workflow (simplified version)\n	 * This method triggers the orchestrator cloud function which coordinates\n	 * all workflows while maintaining HIPAA compliance.\n	 */\n	_startOrchestratorWorkflow() {\n		var orchestratorUrl = this._getOrchestratorUrl();\n		var payload = this._buildWorkflowPayload();\n\n		console.log(\"🚀 Starting orchestrator workflow...\", { orchestratorUrl, payload });\n\n		// Show loading state\n		this._showLoadingScreen();\n\n		// Call orchestrator and handle response directly (no status polling)\n		this._submitOrchestratorToWebhook(orchestratorUrl, payload)\n					.then(function(result) {\n				console.log(\"✅ Orchestrator workflow completed:\", result);\n				this._handleWorkflowCompletion(result);\n			})\n			.catch(function(error) {\n				console.error(\"❌ Orchestrator workflow failed:\", error);\n				this._handleWorkflowError(error);\n			});\n	}\n\n	/**\n	 * Handles successful workflow completion\n	 */\n	_handleWorkflowCompletion(result) {\n		console.log(\"Processing workflow completion result:\", result);\n\n		// Stop loading messages\n		this._stopLoadingMessages();\n\n		// Show results based on the orchestrator response\n		if (result && result.success) {\n			var resultData = result.data || result;\n			this.showResults(\n				this.config.resultUrl,\n				true, // webhookSuccess\n				resultData,\n				result.message || \"Account creation completed successfully!\"\n			);\n			} else {\n			this.showResults(\n				this.config.resultUrl,\n				false, // webhookSuccess\n				null,\n				result.error || \"There was an error processing your request.\"\n			);\n		}\n	}\n\n	/**\n	 * Handles workflow errors\n	 */\n	_handleWorkflowError(error) {\n		console.error(\"Handling workflow error:\", error);\n\n		// Stop loading messages\n		this._stopLoadingMessages();\n\n		// Show error results\n		this.showResults(\n			this.config.resultUrl,\n			false, // webhookSuccess\n			null,\n			error.message || error.error || \"There was an error processing your request.\"\n		);\n	}\n\n	/**\n	 * Gets the orchestrator URL\n	 */\n	_getOrchestratorUrl() {\n		var container = document.getElementById('quiz-container');\n		return (container && container.(dataset && dataset.orchestratorUrl || 'https://workflow-orchestrator-xxn52lyizq-uc.a.run.app';\n	}\n\n	// =======================================================================\n	// Status Polling Methods (Simplified - Mock Implementation)\n	// =======================================================================\n\n	/**\n	 * Start mock status polling for enhanced user experience\n	 * This provides visual feedback while the orchestrator runs\n	 */\n	_startStatusPolling(statusTrackingId) {\n		console.log(\"🔄 Starting mock status polling for:\", statusTrackingId);\n\n		this.statusTrackingId = statusTrackingId;\n		this.pollingAttempts = 0;\n		this.maxPollingAttempts = 20; // 40 seconds max\n\n		// Show initial status message\n		this._showBackgroundProcessNotification(\"🚀 Starting user creation process...\", \"info\");\n\n		// Start polling every 2 seconds for visual feedback\n		this.statusPollingInterval = setIntervalfunction(() {\n			this._pollWorkflowStatus();\n		}, 2000);\n	}\n\n	/**\n	 * Mock status polling to provide user feedback\n	 */\n	async _pollWorkflowStatus() {\n		if (!this.statusTrackingId) {\n			this._stopStatusPolling();\n			return;\n		}\n\n		this.pollingAttempts++;\n\n		try {\n			var statusUrl = this._getStatusPollingUrl();\n			var response = await fetch(statusUrl, {\n				method: 'POST',\n				headers: {\n					'Content-Type': 'application/json',\n				},\n				body: JSON.stringify({\n					statusTrackingId: this.statusTrackingId\n				})\n			});\n\n			if (response.ok) {\n				var statusData = await response.json();\n				console.log(\"📊 Status update:\", statusData);\n\n				if (statusData.success && statusData.statusData) {\n					this._updateWorkflowStatus(statusData.statusData);\n\n					// Stop polling when completed or max attempts reached\n					if (statusData.statusData.completed || this.pollingAttempts >= this.maxPollingAttempts) {\n						this._stopStatusPolling();\n					}\n				}\n			} else {\n				console.warn(\"Status polling failed:\", response.status);\n				// Continue polling on failures (non-critical)\n			}\n		} catch (error) {\n			console.warn(\"Status polling error:\", error);\n			// Continue polling on errors (non-critical)\n		}\n\n		// Stop if we've reached max attempts\n		if (this.pollingAttempts >= this.maxPollingAttempts) {\n			this._stopStatusPolling();\n		}\n	}\n\n	/**\n	 * Update UI with mock status information\n	 */\n	_updateWorkflowStatus(statusData) {\n		if (!statusData) return;\n\n		console.log(\"📱 Updating UI with status:\", statusData);\n\n		// Update loading progress if available\n		if (statusData.progress !== undefined) {\n			this._updateLoadingProgress(statusData.progress);\n		}\n\n		// Show status message to user\n		if (statusData.message) {\n			this._showBackgroundProcessNotification(statusData.message, \"info\");\n		}\n\n		// Handle completion\n		if (statusData.completed) {\n			console.log(\"✅ Workflow completed according to status\");\n			// The actual workflow completion will be handled by the orchestrator response\n		}\n	}\n\n	/**\n	 * Stop status polling\n	 */\n	_stopStatusPolling() {\n		if (this.statusPollingInterval) {\n			clearInterval(this.statusPollingInterval);\n			this.statusPollingInterval = null;\n			console.log(\"⏹️ Status polling stopped\");\n		}\n	}\n\n	/**\n	 * Get the status polling URL\n	 */\n	_getStatusPollingUrl() {\n		var container = document.getElementById('quiz-container');\n		return (container && container.(dataset && dataset.statusPollingUrl || 'https://workflow-status-polling-xxn52lyizq-uc.a.run.app';\n	}\n\n	/**\n	 * Update loading progress indicator\n	 */\n	_updateLoadingProgress(progress) {\n		// Find progress elements and update them\n		var progressBars = document.querySelectorAll('.loading-progress-bar, .progress-bar');\n		var progressTexts = document.querySelectorAll('.loading-progress-text, .progress-text');\n\n		progressBars.forEach(function(bar) {\n			bar.style.width = "${progress}%";\n		});\n\n		progressTexts.forEach(function(text) {\n			text.textContent = "${progress}%";\n		});\n	}\n\n	// =======================================================================\n	// Orchestrator Helper Methods\n	// =======================================================================\n\n	/**\n	 * Build payload for the orchestrator workflow\n	 */\n	_buildWorkflowPayload() {\n		var payload = {\n			timestamp: Date.now(),\n			hasInsurance: this._hasInsurance(),\n			customerEmail: this._getResponseValue('customer_email'),\n			responses: this.responses || []\n		};\n\n		// Add form data if available\n		var formData = this._collectFormData();\n		if (formData && Object.keys(formData).length > 0) {\n			payload.formData = formData;\n		}\n\n		// Add insurance data if user has insurance\n		if (payload.hasInsurance) {\n			var insuranceData = this._collectInsuranceData();\n			if (insuranceData) {\n				payload.insuranceData = insuranceData;\n			}\n		}\n\n		console.log(\"Built workflow payload:\", payload);\n		return payload;\n	}\n\n	/**\n	 * Submit orchestrator payload to webhook\n	 */\n	async _submitOrchestratorToWebhook(url, payload) {\n		try {\n			console.log(\"Submitting to orchestrator:\", { url, payload });\n\n			var response = await fetch(url, {\n				method: 'POST',\n				headers: {\n					'Content-Type': 'application/json',\n				},\n				body: JSON.stringify(payload)\n			});\n\n			if (!response.ok) {\n				throw new Error("HTTP ${response.status}: ${response.statusText}");\n			}\n\n			var result = await response.json();\n			console.log(\"Orchestrator response:\", result);\n\n			return result;\n		} catch (error) {\n			console.error(\"Orchestrator submission failed:\", error);\n			throw error;\n		}\n	}\n\n	/**\n	 * Check if user has insurance\n	 */\n	_hasInsurance() {\n		var insuranceResponse = this._getResponseValue('has_insurance');\n		return insuranceResponse === 'yes' || insuranceResponse === true || insuranceResponse === 'Yes';\n	}\n\n	/**\n	 * Get response value by question ID\n	 */\n	_getResponseValue(questionId) {\n		var response = this.responses.find(r => r.questionId === questionId);\n		return response ? response.answer : null;\n	}\n\n	/**\n	 * Collect form data from responses\n	 */\n	_collectFormData() {\n		var formData = {};\n\n		// Map common form fields\n		var fieldMappings = {\n			'customer_first_name': 'firstName',\n			'customer_last_name': 'lastName',\n			'customer_email': 'email',\n			'customer_phone': 'phone',\n			'customer_address': 'address',\n			'customer_city': 'city',\n			'customer_state': 'state',\n			'customer_zip': 'zipCode',\n			'date_of_birth_month': 'birthMonth',\n			'date_of_birth_day': 'birthDay',\n			'date_of_birth_year': 'birthYear'\n		};\n\n		this.responses.forEach(function(response) {\n			var mappedField = fieldMappings[response.questionId];\n			if (mappedField) {\n				formData[mappedField] = response.answer;\n			}\n		});\n\n		return formData;\n	}\n\n	/**\n	 * Collect insurance data from responses\n	 */\n	_collectInsuranceData() {\n		var insuranceData = {};\n\n		// Map insurance fields\n		var insuranceFieldMappings = {\n			'insurance_provider': 'provider',\n			'form_member_id': 'memberId',\n			'subscriber_group_id': 'groupId',\n			'plan_group_id': 'planGroupId'\n		};\n\n		this.responses.forEach(function(response) {\n			var mappedField = insuranceFieldMappings[response.questionId];\n			if (mappedField) {\n				insuranceData[mappedField] = response.answer;\n			}\n		});\n\n		return Object.keys(insuranceData).length > 0 ? insuranceData : null;\n	}\n\n	_showBackgroundProcessNotification(text, type = \"info\", priority = null) {\n		console.log(\"📢 Creating notification:\", { text: text.substring(0, 50) + \"...\", type, priority });\n\n		// Only show notifications if we have a container\n		if (!this.questionContainer) {\n			console.log(\"❌ No questionContainer found, skipping notification\");\n			return;\n		}\n\n		// Delegate completely to the modular notification system\n		return this.notificationManager.show(text, type, priority);\n	}\n\n	clearNotifications() {\n		return this.notificationManager.clear();\n	}\n\n	exportNotifications(format = \"text\", filter = \"all\") {\n		return this.notificationManager.exportNotifications(format, filter);\n	}\n\n	getCurrentStep() {\n		return this.(quizData && quizData.(steps && steps.[this.currentStepIndex] || null;\n	}\n\n	getCurrentQuestion() {\n		var step = this.getCurrentStep();\n		return (step && step.(questions && questions.[this.currentQuestionIndex] || null;\n	}\n\n	getResponseForCurrentQuestion() {\n		var step = this.getCurrentStep();\n		var questionId = step.questions ? step.questions[this.currentQuestionIndex].id : step.id;\n\n		return (\n			this.responses.find(r => r.questionId === questionId) || {\n				stepId: step.id,\n				questionId: questionId,\n				answer: null\n			}\n		);\n	}\n\n	isFormStep(stepId) {\n		return this.config.(formSteps && formSteps.includes(stepId) || false;\n	}\n\n	renderCurrentStep() {\n		var step = this.getCurrentStep();\n		if (!step) return;\n\n		this.questionContainer.className = \"quiz-question-container\";\n		this.questionContainer.classList.add("quiz-step-${this.currentStepIndex + 1}");\n		this.questionContainer.classList.add("quiz-step-${step.id}");\n\n		this._updateProgressBar();\n\n		var stepHTML = this._generateStepHTML(step);\n		this.questionContainer.innerHTML = stepHTML;\n\n		this._handleStepAcknowledgment(step);\n		this._attachStepEventListeners(step);\n		this.updateNavigation();\n\n		if (step.legal && !this.isFormStep(step.id)) {\n			this._addLegalTextAfterNavigation(step.legal);\n		}\n\n		window.scrollTo({ top: 0, behavior: \"smooth\" });\n	}\n\n	_updateProgressBar() {\n		var progress = ((this.currentStepIndex + 1) / this.quizData.steps.length) * 100;\n		if (this.progressBar) {\n			this.progressBar.classList.add(\"quiz-progress-bar-animated\");\n			this.progressBar.style.setProperty(\"--progress-width\", "${progress}%");\n\n			var progressIndicator = this.container.querySelector(\".quiz-progress-indicator\");\n			if (progressIndicator) {\n				var progressContainer = this.container.querySelector(\".quiz-progress-container\");\n				var containerWidth = (progressContainer && progressContainer.offsetWidth || 480;\n				var isMobile = window.innerWidth <= 768;\n				var indicatorHalfWidth = isMobile ? 16 : 26;\n				var indicatorPosition = (progress / 100) * containerWidth - indicatorHalfWidth;\n\n				progressIndicator.style.left = "${indicatorPosition}px";\n				progressIndicator.classList.toggle(\"visible\", progress > 0);\n			}\n		}\n	}\n\n	_generateStepHTML(step) {\n		var stepHTML = "<div class="animate-fade-in">";\n		stepHTML += this._generateStepInfoHTML(step);\n\n		if (step.(questions && questions.length > 0) {\n			stepHTML += this.isFormStep(step.id) ? this._generateFormStepHTML(step) : this._generateWizardStepHTML(step);\n		} else if (!step.info) {\n			stepHTML += "<p class="quiz-error-text">Step configuration error. Please contact support.</p>";\n		}\n\n		stepHTML += \"</div>\";\n		return stepHTML;\n	}\n\n	_generateStepInfoHTML(step) {\n		if (!step.info) return \"\";\n\n		return "
            <h3 class="quiz-title">${step.info.heading}</h3>
            <p class="quiz-text">${step.info.text}</p>
            ${step.info.subtext ? `<p class="quiz-subtext">${step.info.subtext}</p>" : \"\"}\n        ";
	}

	_generateFormStepHTML(step) {
		var isLastStep = this.currentStepIndex === this.quizData.steps.length - 1;
		var buttonText = isLastStep ? step.ctaText || "Finish Quiz" : step.ctaText || "Continue";

		return `
            ${step.(info && info.formSubHeading ? `<h4 class="quiz-heading quiz-heading-mobile-outside">${step.info.formSubHeading}</h4>` : ""}
			<div class="quiz-form-container">
                ${step.(info && info.formSubHeading ? `<h4 class="quiz-heading quiz-heading-desktop-inside">${step.info.formSubHeading}</h4>` : ""}
				<div class="quiz-space-y-6">
					${this._processFormQuestions(step.questions)}
				</div>
				<button class="quiz-nav-button quiz-nav-button--primary quiz-form-button" id="quiz-form-next-button">
					${buttonText}
				</button>
				${step.legal ? `<p class="quiz-legal-form">${step.legal}</p>" : \"\"}\n			</div>\n		";
	}

	_generateWizardStepHTML(step) {
		var question = step.questions[this.currentQuestionIndex];
		var response = this.getResponseForCurrentQuestion();

		if (!question) {
			return "<p class=\"quiz-error-text\">Question not found. Please try again.</p>";
		}

		var html = "";

		if (!step.info) {
			html += `
				<h3 class="quiz-title">${question.text}</h3>
				${question.helpText ? `<p class="quiz-text">${question.helpText}</p>" : \"\"}\n			";
			} else {
			html += `
				<div class="quiz-divider">
					<h4 class="quiz-heading">${question.text}</h4>
					${question.helpText ? `<p class="quiz-text-sm">${question.helpText}</p>" : \"\"}\n				</div>\n			";
		}

		html += this._renderQuestionByType(question, response);
		return html;
	}

	_toggleElement(element, show) {
		(element && element.classList.toggle("hidden", !show);
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
				return `<p class="quiz-error-text">Unsupported field type: ${question.type}</p>";\n		}\n	}\n\n	renderMultipleChoice(question, response) {\n		return this._renderCardOptions(question, response, \"radio\");\n	}\n\n	renderCheckbox(question, response) {\n		var selectedOptions = Array.isArray(response.answer) ? response.answer : [];\n\n		if (question.id === \"consent\") {\n			return this._renderSimpleCheckboxes(question, selectedOptions);\n		}\n		return this._renderCardOptions(question, response, \"checkbox\");\n	}\n\n	_renderCardOptions(question, response, inputType) {\n		var selectedOptions = inputType === \"checkbox\" ? (Array.isArray(response.answer) ? response.answer : []) : null;\n		var isSelected = option => (inputType === \"checkbox\" ? selectedOptions.includes(option.id) : response.answer === option.id);\n\n		var html = '<div class=\"quiz-grid-2\">';\n		question.options.forEach(function(option) {\n			var selected = isSelected(option);\n			html += "
				<label for="${option.id}" class="quiz-option-card">
					<input type="${inputType}" id="${option.id}" name="question-${question.id}" value="${option.id}" class="quiz-sr-only" ${selected ? "checked" : ""}>
					<div class="quiz-option-button ${selected ? "selected" : ""}">
						<div class="quiz-option-text">
							<div class="quiz-option-text-content">${option.text}</div>
				</div>
						${selected ? this._getCheckmarkSVG() : ""}
				</div>
				</label>
			";\n		});\n		return html + \"</div>\";\n	}\n\n	_renderSimpleCheckboxes(question, selectedOptions) {\n		var html = '<div class=\"quiz-space-y-3 quiz-spacing-container\">';\n		question.options.forEach(function(option) {\n			html += "
				<div class="quiz-checkbox-container">
					<input type="checkbox" id="${option.id}" name="question-${question.id}" value="${option.id}" class="quiz-checkbox-input" ${selectedOptions.includes(option.id) ? "checked" : ""}>
					<label class="quiz-checkbox-label" for="${option.id}">${option.text}</label>
			</div>
		";\n		});\n		return html + \"</div>\";\n	}\n\n	renderDropdown(question, response) {\n		var options = question.options || [];\n		var placeholder = question.placeholder || \"Select an option\";\n		var optionsHTML = options.map(option => "<option value="${option.id}" ${response.answer === option.id ? "selected" : ""}>${option.text}</option>").join(\"\");\n\n		return "
			<div>
				<select id="question-${question.id}" class="quiz-select">
					<option value="">${placeholder}</option>
					${optionsHTML}
				</select>
				${this._getErrorElement(question.id)}
			</div>
        ";\n	}\n\n	renderTextInput(question, response) {\n		return "
			<div>
				<input type="text" id="question-${question.id}" class="quiz-input"
					placeholder="${question.placeholder || "Type your answer here..."}"
					value="${response.answer || ""}"
					aria-describedby="error-${question.id}">
				${this._getErrorElement(question.id)}
				</div>
		";\n	}\n\n	_getErrorElement(questionId) {\n		return "<p id="error-${questionId}" class="quiz-error-text quiz-error-hidden"></p>";\n	}\n\n	renderDatePart(question, response) {\n		var part = question.part;\n		var options = this._getDatePartOptions(part);\n		var placeholder = question.placeholder || "Select ${part}";\n\n		return "
            <div>
                <select id="question-${question.id}" class="quiz-select">
                    <option value="">${placeholder}</option>
                    ${options.map(option => `<option value="${option.id}" ${response.answer === option.id ? "selected" : ""}>${option.text}</option>").join(\"\")}\n                </select>\n			</div>\n		";
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
			return Array.fromfunction({ length: 31 }, (_, i) {
				var day = String(i + 1).padStart(2, "0");
				return { id: day, text: day };
			});
		} else if (part === "year") {
			var endYear = 2007;
			var startYear = 1920;
			var yearCount = endYear - startYear + 1;
			return Array.fromfunction({ length: yearCount }, (_, i) {
				var year = String(endYear - i);
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
		";\n	}\n\n	renderRating(question, response) {\n		return "
			<div class="quiz-spacing-container">
				<input type="range" id="question-${question.id}" class="quiz-range"
					min="1" max="10" step="1" value="${response.answer || 5}">
				<div class="quiz-range-labels">
                    <span>1</span><span>5</span><span>10</span>
							</div>
							</div>
		";\n	}\n\n	renderDateInput(question, response) {\n		return "
            <div class="quiz-question-section">
                <input type="date" id="question-${question.id}" class="quiz-input"
                    placeholder="${question.helpText || "MM/DD/YYYY"}"
                    value="${response.answer || ""}"
                    aria-describedby="error-${question.id}">
                ${this._getErrorElement(question.id)}
                ${question.helpText ? `<p class="quiz-text-sm">${question.helpText}</p>" : \"\"}\n			</div>\n		";
	}

	_getCheckmarkSVG() {
		return "<div class=\"quiz-checkmark\">\n            <svg width=\"19\" height=\"19\" viewBox=\"0 0 19 19\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n                <path fill-rule=\"evenodd\" clip-rule=\"evenodd\" d=\"M9.79158 18.75C4.84404 18.75 0.833252 14.7393 0.833252 9.79168C0.833252 4.84413 4.84404 0.833344 9.79158 0.833344C14.7392 0.833344 18.7499 4.84413 18.7499 9.79168C18.7499 14.7393 14.7392 18.75 9.79158 18.75ZM13.7651 7.82516C14.0598 7.47159 14.012 6.94613 13.6584 6.65148C13.3048 6.35685 12.7793 6.40462 12.4848 6.75818L8.90225 11.0572L7.04751 9.20243C6.72207 8.87701 6.19444 8.87701 5.86899 9.20243C5.54356 9.52784 5.54356 10.0555 5.86899 10.3809L8.369 12.8809C8.53458 13.0465 8.76208 13.1348 8.996 13.1242C9.22992 13.1135 9.44858 13.005 9.59842 12.8252L13.7651 7.82516Z\" fill=\"#418865\"/>\n            </svg>\n        </div>";
	}

	goToPreviousStep() {
		if (this.currentStepIndex <= 0) return;

		this.currentStepIndex--;
		this.currentQuestionIndex = 0;
		this.renderCurrentStep();
		this.updateNavigation();
	}

	goToNextStep() {
		var currentStep = this.getCurrentStep();
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
		var step = this.getCurrentStep();
		if (!step) {
			this.nextButton.disabled = true;
			return;
		}

		var isFormStep = this.isFormStep(step.id);
		var currentQuestion = step.(questions && questions.[this.currentQuestionIndex];

		// Always show navigation for non-required multiple choice questions
		var isNonRequiredMultipleChoice = (currentQuestion && currentQuestion.type === "multiple-choice" && !currentQuestion.required;
		var isCurrentQuestionAutoAdvance = currentQuestion && this._shouldAutoAdvance(currentQuestion);

		var shouldShowNavigation = isNonRequiredMultipleChoice || !isCurrentQuestionAutoAdvance || isFormStep;
		this._setNavigationVisibility(shouldShowNavigation);

		if (!shouldShowNavigation) return;

		var isLastStep = this.currentStepIndex === this.quizData.steps.length - 1;
		var isLastQuestionInStep = isFormStep ? true : step.questions ? this.currentQuestionIndex === step.questions.length - 1 : true;

		if (isLastStep && isLastQuestionInStep) {
			this.nextButton.innerHTML = step.ctaText || "Finish Quiz";
		} else {
			this.nextButton.innerHTML = this._getStepButtonText(step);
		}

		if (isFormStep && step.questions) {
			this._setNavigationVisibility(false);
			var formButton = this.questionContainer.querySelector("#quiz-form-next-button");
			if (formButton) {
				formButton.disabled = this.submitting;
			}
			return;
		}

		var hasAnswer = this._hasValidAnswer(step);
		this.nextButton.disabled = !hasAnswer || this.submitting;
	}

	_getStepButtonText(step) {
		var question = step.questions[this.currentQuestionIndex];

		// Handle multiple choice questions that are not required
		if ((question && question.type === "multiple-choice" && !question.required) {
			var response = this.responses.find(r => r.questionId === question.id);
			var hasSelection = response && response.answer;
			return hasSelection ? step.ctaText || "Continue" : "Skip";
		}

		// Handle checkbox questions (like medical step)
		if ((question && question.type === "checkbox") {
			var response = this.responses.find(r => r.questionId === question.id);
			var hasSelection = response && Array.isArray(response.answer) && response.answer.length > 0;
			return hasSelection ? step.ctaText || "Continue" : "Skip";
		}

		return step.ctaText || "Continue";
	}

	_hasValidAnswer(step) {
		if (step.info && (!step.questions || step.questions.length === 0)) {
			return true;
		}

		if (step.(questions && questions.length > 0) {
			var question = step.questions[this.currentQuestionIndex];
			if (!question) return false;

			if (!question.required) return true;

			var response = this.responses.find(r => r.questionId === question.id);
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

		var step = this.getCurrentStep();
		if (!step) return;

		if (step.(questions && questions.length > 0) {
			var question = step.questions[this.currentQuestionIndex];
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
		var step = this.getCurrentStep();
		if ((step && step.questions) {
			this._updateResponse(questionId, answer, step.id);
		}
	}

	_updateResponse(questionId, answer, stepId) {
		var responseIndex = this.responses.findIndex(r => r.questionId === questionId);
		if (responseIndex !== -1) {
			this.responses[responseIndex].answer = answer;
		} else {
			this.responses.push({ stepId, questionId, answer });
		}
	}

	_handleAutoAdvance(answer) {
		var allOptionButtons = this.questionContainer.querySelectorAll(".quiz-option-button");
		allOptionButtons.forEach(function(button) {
			button.classList.remove("selected", "processing", "auto-advance-feedback");
			var existingCheckmark = button.querySelector(".quiz-checkmark");
			if (existingCheckmark) {
				existingCheckmark.remove();
			}
		});

		var selectedElement = this.questionContainer.querySelector(`input[value="${answer}"]:checked");\n		if (selectedElement) {\n			var optionButton = selectedElement.closest(\".quiz-option-card\")?.querySelector(\".quiz-option-button\");\n			if (optionButton) {\n				optionButton.classList.add(\"selected\", \"processing\");\n				optionButton.innerHTML += this._getCheckmarkSVG();\n				optionButton.classList.add(\"auto-advance-feedback\");\n			}\n		}\n\n		setTimeoutfunction(() {\n			this.goToNextStep();\n		}, this.config.autoAdvanceDelay || 600);\n	}\n\n	_updateCheckboxVisualState(question, answer) {\n		if (!Array.isArray(answer)) return;\n\n		var allCheckboxes = this.questionContainer.querySelectorAll("input[name="question-${question.id}"]");\n		allCheckboxes.forEach(function(checkbox) {\n			var optionCard = checkbox.closest(\".quiz-option-card\");\n			var optionButton = (optionCard && optionCard.querySelector(\".quiz-option-button\");\n\n			if (optionButton) {\n				var shouldBeSelected = answer.includes(checkbox.value);\n				var isCurrentlySelected = optionButton.classList.contains(\"selected\");\n\n				if (shouldBeSelected !== isCurrentlySelected) {\n					if (shouldBeSelected) {\n						optionButton.classList.add(\"selected\");\n						checkbox.checked = true;\n						if (!optionButton.querySelector(\".quiz-checkmark\")) {\n							optionButton.innerHTML += this._getCheckmarkSVG();\n						}\n			} else {\n						optionButton.classList.remove(\"selected\");\n						checkbox.checked = false;\n						var checkmark = optionButton.querySelector(\".quiz-checkmark\");\n						if (checkmark) {\n							checkmark.remove();\n						}\n					}\n				}\n			}\n		});\n\n		this.updateNavigation();\n	}\n\n	_handleStepAcknowledgment(step) {\n		if (!step.info) return;\n\n		var infoResponse = this.responses.find(r => r.stepId === step.id && r.questionId === step.id);\n		if (infoResponse) {\n			infoResponse.answer = \"info-acknowledged\";\n		} else {\n			this.responses.push({\n				stepId: step.id,\n				questionId: step.id,\n				answer: \"info-acknowledged\"\n			});\n		}\n\n		if (!step.questions || step.questions.length === 0) {\n			setTimeoutfunction(() {\n				this.nextButton.disabled = false;\n			}, 0);\n		}\n	}\n\n	_attachStepEventListeners(step) {\n		if (!step.questions || step.questions.length === 0) return;\n\n		if (this.isFormStep(step.id)) {\n			step.questions.forEach(function(question) {\n				this._attachFormQuestionListener(question);\n			});\n\n			var formButton = this.questionContainer.querySelector(\"#quiz-form-next-button\");\n			if (formButton) {\n				formButton.removeEventListener(\"click\", this.formButtonHandler);\n				this.formButtonHandler = function() {\n					if (!formButton.disabled) {\n						this.goToNextStep();\n					}\n				};\n				formButton.addEventListener(\"click\", this.formButtonHandler);\n			}\n		} else {\n			var currentQuestion = step.questions[this.currentQuestionIndex];\n			if (currentQuestion) {\n				this._attachQuestionEventListeners(currentQuestion);\n			}\n		}\n	}\n\n	_attachQuestionEventListeners(question) {\n		if (!question) return;\n\n		var handlers = {\n			\"multiple-choice\": function() { return this._attachInputGroupListeners(question; }, \"change\", input => this.handleAnswer(input.value)),\n			checkbox: function() { return this._attachCheckboxListeners(question); },\n			dropdown: function() { return this._attachDropdownListeners(question); },\n			\"date-part\": function() { return this._attachDropdownListeners(question); },\n			text: function() { return this._attachTextInputListeners(question); },\n			date: function() { return this._attachTextInputListeners(question); },\n			textarea: function() { return this._attachSingleInputListener(question; }, \"input\", input => this.handleAnswer(input.value)),\n			rating: function() { return this._attachSingleInputListener(question; }, \"input\", input => this.handleAnswer(parseInt(input.value, 10))),\n			\"payer-search\": function() { return this._attachPayerSearchListeners(question); }\n		};\n\n		handlers[question.type]?.();\n	}\n\n	_attachInputGroupListeners(question, eventType, callback) {\n		var inputs = this.questionContainer.querySelectorAll("input[name="question-${question.id}"]");\n		inputs.forEachfunction(input => input.addEventListener(eventType, () { return callback(input))); };\n	}\n\n	_attachSingleInputListener(question, eventType, callback) {\n		var input = this.questionContainer.querySelector("#question-${question.id}");\n		if (input) input.addEventListenerfunction(eventType, () { return callback(input)); };\n	}\n\n	_attachCheckboxListeners(question) {\n		var checkboxInputs = this.questionContainer.querySelectorAll("input[name="question-${question.id}"]");\n		var getSelectedValues = function() { return Array.from(checkboxInputs); }\n				.filter(cb => cb.checked)\n				.map(cb => cb.value);\n\n		checkboxInputs.forEach(function(input) {\n			input.removeEventListener(\"change\", input._changeHandler);\n			input._changeHandler = function() { return this.handleAnswer(getSelectedValues()); };\n			input.addEventListener(\"change\", input._changeHandler);\n		});\n	}\n\n	_attachDropdownListeners(question) {\n		var dropdown = this.questionContainer.querySelector("#question-${question.id}");\n		if (!dropdown) return;\n\n		dropdown.addEventListenerfunction(\"change\", () {\n			this.handleFormAnswer(question.id, dropdown.value);\n			this._updateDropdownColor(dropdown);\n			this._clearFieldError(question.id, dropdown);\n		});\n		this._updateDropdownColor(dropdown);\n	}\n\n	_attachTextInputListeners(question) {\n		var textInput = this.questionContainer.querySelector("#question-${question.id}");\n		if (!textInput) return;\n\n		var validate = function() {\n			var validationResult = this._validateFieldValue(question, textInput.value);\n			this._updateFieldValidationState(textInput, question, validationResult);\n		};\n\n		this._removeExistingHandlers(textInput, [\"input\", \"blur\", \"change\"]);\n\n		textInput._inputHandler = function() { return this.handleFormAnswer(question.id; }, textInput.value);\n		textInput._blurHandler = validate;\n		textInput._changeHandler = validate;\n\n		[\"input\", \"blur\", \"change\"].forEachfunction((event, i) {\n			var handler = [textInput._inputHandler, textInput._blurHandler, textInput._changeHandler][i];\n			textInput.addEventListener(event, handler);\n		});\n	}\n\n	_removeExistingHandlers(element, events) {\n		events.forEach(event => element.removeEventListener(event, element["_${event}Handler"]));\n	}\n\n	_attachFormQuestionListener(question) {\n		var formHandlers = {\n			dropdown: function() { return this._attachDropdownListeners(question); },\n			\"date-part\": function() { return this._attachDropdownListeners(question); },\n			text: function() { return this._attachTextInputListeners(question); },\n			date: function() { return this._attachTextInputListeners(question); },\n			checkbox: function() { return this._attachFormCheckboxListeners(question); },\n			\"payer-search\": function() { return this._attachPayerSearchFormListeners(question); }\n		};\n\n		formHandlers[question.type]?.();\n	}\n\n	_attachFormCheckboxListeners(question) {\n		var checkboxInputs = this.questionContainer.querySelectorAll("input[name="question-${question.id}"]");\n		var getFormValue = input =>\n			question.options.length === 1\n				? input.checked\n					? [input.value]\n					: []\n				: Array.from(checkboxInputs)\n						.filter(cb => cb.checked)\n						.map(cb => cb.value);\n\n		checkboxInputs.forEach(function(input) {\n			input.onclick = function() { return this.handleFormAnswer(question.id; }, getFormValue(input));\n		});\n	}\n\n	_validateFormStep(step) {\n		var validationErrors = step.questions.map(question => this._validateQuestionInForm(question)).filter(error => error);\n\n		if (validationErrors.length > 0) {\n			this._displayValidationErrors(validationErrors);\n			return false;\n		}\n		return true;\n	}\n\n	_validateQuestionInForm(question) {\n		var response = this.responses.find(r => r.questionId === question.id);\n		var currentValue = (response && response.answer;\n\n		if (question.required && this._isEmptyValue(currentValue, question.type)) {\n				return {\n				questionId: question.id,\n				message: this.quizData.(ui && ui.(errorMessages && errorMessages.validationRequired || \"This field is required\"\n			};\n		}\n\n		if (currentValue && question.type !== \"payer-search\") {\n			var validationResult = this._validateFieldValue(question, currentValue);\n			if (!validationResult.isValid) {\n				return {\n					questionId: question.id,\n					message: validationResult.errorMessage\n				};\n			}\n		}\n\n		return null;\n	}\n\n	_isEmptyValue(value, questionType) {\n		if (!value) return true;\n		if (questionType === \"checkbox\") return !Array.isArray(value) || value.length === 0;\n		if (typeof value === \"string\") return value.trim() === \"\";\n		return false;\n	}\n\n	_displayValidationErrors(validationErrors) {\n		var firstInvalidField = null;\n\n		validationErrors.forEachfunction((error, index) {\n			var input = this._getValidationElements(error.questionId).input;\nvar errorEl = this._getValidationElements(error.questionId).errorEl;\n\n			if (input) {\n				input.classList.add(\"quiz-input-error\");\n				input.classList.remove(\"quiz-input-valid\");\n				if (index === 0) firstInvalidField = input;\n			}\n\n			if (errorEl) {\n				errorEl.textContent = error.message;\n				errorEl.classList.remove(\"quiz-error-hidden\");\n				errorEl.classList.add(\"quiz-error-visible\");\n			}\n		});\n\n		if (firstInvalidField) {\n			this._scrollToInvalidField(firstInvalidField);\n		}\n	}\n\n	_getValidationElements(questionId) {\n		return {\n			input: this.questionContainer.querySelector("#question-${questionId}"),\n			errorEl: this.questionContainer.querySelector("#error-${questionId}`)
		};
	}

	_validateFieldValue(question, value) {
		var errorMessages = this.quizData.(ui && ui.errorMessages || {};

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
		var patterns = this.quizData.function(validation && validation.patterns || {};
		var validations = {
			q4: { pattern: patterns.memberId || "^.{6,20}$", message: errorMessages.validationMemberId || "Minimum 6 characters" },
			q4_group: { pattern: patterns.groupNumber || "^$|^.{5,15}$", message: errorMessages.validationGroupNumber || "Minimum 5 characters" },
			q7: { pattern: patterns.name || "^[A-Za-z\\s]{1,100}$", message: errorMessages.validationName || "Use only A–Z letters and spaces" },
			q8: { pattern: patterns.name || "^[A-Za-z\\s]{1,100}$", message: errorMessages.validationName || "Use only A–Z letters and spaces" },
			q9: { pattern: patterns.email || "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", message: errorMessages.validationEmail || "Enter valid email" },
			q10: { custom: () { return this._validatePhoneNumber(trimmedValue); }, message: errorMessages.validationPhone || "Enter valid phone" }
		};

		var validation = validations[question.id];
		if (validation) {
			var isValid = validation.custom ? validation.custom() : new RegExp(validation.pattern).test(trimmedValue);
			return isValid ? { isValid: true, errorMessage: null } : { isValid: false, errorMessage: validation.message };
		}

		if (question.(validation && validation.pattern) {
			var isValid = new RegExp(question.validation.pattern).test(trimmedValue);
			return isValid ? { isValid: true, errorMessage: null } : { isValid: false, errorMessage: question.validation.message || "Invalid format" };
		}

		return { isValid: true, errorMessage: null };
	}

	_validatePhoneNumber(phone) {
		var cleanPhone = phone.replace(/[\s\-\(\)\.]/g, "");

		var patterns = [
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
		var errorEl = this.questionContainer.querySelector(`#error-${question.id}");\n		var isValid = validationResult.isValid;\n\n		input.classList.toggle(\"quiz-input-error\", !isValid);\n		input.classList.toggle(\"quiz-input-valid\", isValid);\n\n		if (errorEl) {\n			if (isValid) {\n				errorEl.classList.add(\"quiz-error-hidden\");\n				errorEl.classList.remove(\"quiz-error-visible\");\n			} else if (validationResult.errorMessage) {\n				errorEl.textContent = validationResult.errorMessage;\n				errorEl.classList.remove(\"quiz-error-hidden\");\n				errorEl.classList.add(\"quiz-error-visible\");\n			}\n		}\n\n		return isValid;\n	}\n\n	_clearFieldError(questionId, input) {\n		if (input.value && input.value !== \"\") {\n			var errorEl = this.questionContainer.querySelector("#error-${questionId}");\n			if (errorEl) {\n				input.classList.remove(\"quiz-input-error\");\n				input.classList.add(\"quiz-input-valid\");\n				errorEl.classList.add(\"quiz-error-hidden\");\n				errorEl.classList.remove(\"quiz-error-visible\");\n			}\n		}\n	}\n\n	_updateDropdownColor(dropdown) {\n		var hasSelection = dropdown.value && dropdown.value !== dropdown.options[0].value;\n		dropdown.style.color = hasSelection ? \"var(--quiz-text-primary)\" : \"#B0B0B0\";\n		dropdown.classList.toggle(\"quiz-dropdown-selected\", hasSelection);\n	}\n\n	_scrollToInvalidField(fieldElement) {\n		if (!fieldElement) return;\n\n		var isMobile = window.innerWidth <= 768;\n		if (isMobile) {\n			var fieldRect = fieldElement.getBoundingClientRect();\n			var offset = 100;\n			var currentScrollY = window.pageYOffset || document.documentElement.scrollTop;\n			var targetScrollY = currentScrollY + fieldRect.top - offset;\n\n			window.scrollTo({\n				top: Math.max(0, targetScrollY),\n				behavior: \"smooth\"\n			});\n\n			setTimeoutfunction(() {\n				if (fieldElement.focus) {\n					fieldElement.focus();\n				}\n			}, 300);\n		}\n	}\n\n	async finishQuiz() {\n		var resultUrl = this.container.getAttribute(\"data-result-url\") || this.container.getAttribute(\"data-booking-url\") || \"/quiz-complete\";\n\n		try {\n			this.submitting = true;\n			this.nextButton.disabled = true;\n\n			this._toggleElement(this.navigationButtons, false);\n			this._toggleElement(this.progressSection, false);\n\n			// Start the comprehensive loading sequence\n			await this._showComprehensiveLoadingSequence();\n\n			// Check if eligibility workflow is complete\n			var eligibilityResult = null;\n			if (this.eligibilityWorkflowPromise) {\n				if (this.eligibilityWorkflowResult) {\n					// Already completed\n					eligibilityResult = this.eligibilityWorkflowResult;\n					console.log(\"Using cached eligibility result:\", eligibilityResult);\n				} else {\n					// Still running - wait for it\n					try {\n						eligibilityResult = await this.eligibilityWorkflowPromise;\n						console.log(\"Waited for eligibility result:\", eligibilityResult);\n					} catch (error) {\n						console.error(\"Eligibility workflow failed:\", error);\n						eligibilityResult = this._createErrorEligibilityData(\"Eligibility check failed\");\n					}\n				}\n			} else {\n				// No eligibility check was triggered - use default processing status\n				eligibilityResult = this._createProcessingEligibilityData();\n				console.log(\"No eligibility workflow, using processing status\");\n			}\n\n			// Process the result consistently\n			var finalResult;\n			if (eligibilityResult) {\n				// Check if this is already processed eligibility data or a raw webhook response\n				if (eligibilityResult.eligibilityStatus && typeof eligibilityResult.eligibilityStatus === \"string\") {\n					// This is already processed eligibility data - use it directly\n					finalResult = eligibilityResult;\n					console.log(\"Using eligibility result directly (already processed):\", finalResult);\n		} else {\n					// This is a raw webhook response - process it\n					finalResult = this._processWebhookResult(eligibilityResult);\n					console.log(\"Processed webhook result:\", finalResult);\n				}\n			} else {\n				// No eligibility check was run - use default processing status\n				finalResult = this._createProcessingEligibilityData();\n				console.log(\"No eligibility result, using processing status\");\n			}\n\n			console.log(\"Processing eligibility result in finishQuiz:\", {\n				eligibilityResult: finalResult,\n				hasError: !!(finalResult && finalResult.error,\n				status: (finalResult && finalResult.eligibilityStatus,\n				isEligible: (finalResult && finalResult.isEligible\n			});\n\n			// Test mode comprehensive finish notification\n			if (this.isTestMode) {\n				var workflowStatus = this.eligibilityWorkflowPromise ? (this.eligibilityWorkflowResult ? \"✅ Completed\" : \"⏳ In Progress\") : \"❌ Not Started\";\n\n				var userCreationStatus = this.userCreationWorkflowPromise ? \"✅ Started\" : \"❌ Not Started\";\n\n				this._showBackgroundProcessNotification(\n					"
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
			quizId: this.(quizData && quizData.id || "dietitian-quiz",
			quizTitle: this.(quizData && quizData.title || "Find Your Perfect Dietitian"
		};
	}

	_showSchedulingResults(result) {
		var schedulingData = (result && result.schedulingData;

		if ((result && result.success && (schedulingData && schedulingData.status === "SCHEDULED") {
			// Success - show scheduling success page
			var successHTML = this._generateSchedulingSuccessHTML(schedulingData);
			this.questionContainer.innerHTML = successHTML;
		} else {
			// Error - show scheduling error page
			var errorMessage = (schedulingData && schedulingData.message || "Unknown scheduling error";
			this._showSchedulingError(errorMessage, schedulingData);
		}
	}

	_showSchedulingError(errorMessage, schedulingData = null) {
		var errorHTML = this._generateSchedulingErrorHTML(errorMessage, schedulingData);
		this.questionContainer.innerHTML = errorHTML;
	}

	_generateSchedulingSuccessHTML(schedulingData) {
		// Fallback for ES5 compatibility - using regular variables and string concatenation
		var scheduleLink = (schedulingData && schedulingData.scheduleLink) ? schedulingData.scheduleLink : "#";
		var masterId = (schedulingData && schedulingData.masterId) ? schedulingData.masterId : "";
		var referenceHtml = masterId ? ('<p class="quiz-text-xs" style="margin-top: 16px; color: #666; font-family: monospace;">Reference ID: ' + masterId + '</p>') : "";

		var html = "";
		html += '<div class="quiz-results-container">';
		html += '<div class="quiz-results-header">';
		html += '<h2 class="quiz-results-title">🎉 Appointment Request Submitted!</h2>';
		html += '<p class="quiz-results-subtitle">Great news! Your request has been successfully processed and your dietitian appointment is ready to be scheduled.</p>';
		html += '</div>';
		html += '<div class="quiz-action-section">';
		html += '<div class="quiz-action-content">';
		html += '<div class="quiz-action-header">';
		html += '<h3 class="quiz-action-title">Next: Choose Your Appointment Time</h3>';
		html += '</div>';
		html += '<div class="quiz-action-details">';
		html += '<div class="quiz-action-info">';
		html += '<div class="quiz-action-info-text">';
		html += 'Click below to access your personalized scheduling portal where you can select from available appointment times that work best for your schedule.';
		html += '</div>';
		html += '</div>';
		html += '<a href="' + scheduleLink + '" target="_blank" class="quiz-booking-button">';
		html += '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">';
		html += '<path d="M6.66666 2.5V5.83333M13.3333 2.5V5.83333M2.5 9.16667H17.5M4.16666 3.33333H15.8333C16.7538 3.33333 17.5 4.07952 17.5 5V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16666C3.24619 18.3333 2.5 17.5871 2.5 16.6667V5C2.5 4.07952 3.24619 3.33333 4.16666 3.33333Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>';
		html += '</svg>';
		html += 'Schedule Your Appointment';
		html += '</a>';
		html += referenceHtml;
		html += '</div>';
		html += '</div>';
		html += '</div>';
		// Rest of HTML for coverage card and contact info would continue here...
		html += '<div class="quiz-coverage-card">';
		html += '<div class="quiz-coverage-card-title">What to Expect</div>';
		html += '<div class="quiz-coverage-benefits">';
		html += '<div class="quiz-coverage-benefit">';
		html += '<div class="quiz-coverage-benefit-icon">';
		html += '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">';
		html += '<path d="M12 8V12L15 15" stroke="#306E51" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
		html += '<circle cx="12" cy="12" r="9" stroke="#306E51" stroke-width="2"/>';
		html += '</svg>';
		html += '</div>';
		html += '<div class="quiz-coverage-benefit-text">';
		html += '<strong>30-60 Minutes</strong><br/>';
		html += 'Comprehensive nutrition consultation tailored to your specific health goals';
		html += '</div>';
		html += '</div>';
		html += '<div class="quiz-coverage-benefit">';
		html += '<div class="quiz-coverage-benefit-icon">';
		html += '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">';
		html += '<path d="M17 3V0M12 3V0M7 3V0M3 7H21M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="#306E51" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
		html += '</svg>';
		html += '</div>';
		html += '<div class="quiz-coverage-benefit-text">';
		html += '<strong>Flexible Scheduling</strong><br/>';
		html += 'Choose from morning, afternoon, or evening slots that fit your lifestyle';
		html += '</div>';
		html += '</div>';
		html += '<div class="quiz-coverage-benefit">';
		html += '<div class="quiz-coverage-benefit-icon">';
		html += '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">';
		html += '<path d="M9 12L11 14L22 3M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3.89543 3 5 3 5 3H16" stroke="#306E51" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
		html += '</svg>';
		html += '</div>';
		html += '<div class="quiz-coverage-benefit-text">';
		html += '<strong>Personalized Plan</strong><br/>';
		html += 'Receive a custom nutrition plan based on your quiz responses and health profile';
		html += '</div>';
		html += '</div>';
		html += '<div class="quiz-coverage-benefit">';
		html += '<div class="quiz-coverage-benefit-icon">';
		html += '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">';
		html += '<path d="M18.3333 14.1667C18.3333 15.0871 17.5871 15.8333 16.6667 15.8333H5.83333L1.66666 20V3.33333C1.66666 2.41286 2.41285 1.66667 3.33333 1.66667H16.6667C17.5871 1.66667 18.3333 2.41286 18.3333 3.33333V14.1667Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>';
		html += '</svg>';
		html += '</div>';
		html += '<div class="quiz-coverage-benefit-text">';
		html += '<strong>Ongoing Support</strong><br/>';
		html += 'Follow-up resources and support to help you achieve your health goals';
		html += '</div>';
		html += '</div>';
		html += '</div>';
		html += '</div>';
		html += '<div class="quiz-action-section" style="background-color: #f8f9fa;">';
		html += '<div class="quiz-action-content">';
		html += '<div class="quiz-action-header">';
		html += '<h3 class="quiz-action-title">Need Assistance?</h3>';
		html += '</div>';
		html += '<div class="quiz-action-details">';
		html += '<div class="quiz-action-info">';
		html += '<div class="quiz-action-info-text">';
		html += 'Our support team is here to help if you have any questions about scheduling or preparing for your appointment.';
		html += '</div>';
		html += '</div>';
		html += '<div class="quiz-action-feature">';
		html += '<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">';
		html += '<path d="M18.3333 5.83333L10 11.6667L1.66666 5.83333" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>';
		html += '<path d="M1.66666 5.83333H18.3333V15C18.3333 15.442 18.1577 15.866 17.8452 16.1785C17.5327 16.491 17.1087 16.6667 16.6667 16.6667H3.33333C2.89131 16.6667 2.46738 16.491 2.15482 16.1785C1.84226 15.866 1.66666 15.442 1.66666 15V5.83333Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>';
		html += '</svg>';
		html += '<div class="quiz-action-feature-text">Email: support@curalife.com</div>';
		html += '</div>';
		html += '<div class="quiz-action-feature">';
		html += '<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">';
		html += '<path d="M18.3081 14.2233C17.1569 14.2233 16.0346 14.0397 14.9845 13.6971C14.6449 13.5878 14.2705 13.6971 14.0579 13.9427L12.8372 15.6772C10.3023 14.4477 8.55814 12.7138 7.32326 10.1581L9.10465 8.89535C9.34884 8.68372 9.45814 8.30233 9.34884 7.96279C9.00581 6.91628 8.82209 5.79186 8.82209 4.64535C8.82209 4.28953 8.53256 4 8.17674 4H4.64535C4.28953 4 4 4.28953 4 4.64535C4 12.1715 10.1831 18.3953 17.6628 18.3953C18.0186 18.3953 18.3081 18.1058 18.3081 17.75V14.2233Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>';
		html += '</svg>';
		html += '<div class="quiz-action-feature-text">Phone: 1-800-CURALIFE</div>';
		html += '</div>';
		html += '</div>';
		html += '</div>';
		html += '</div>';
		html += '</div>';

		return html;
	}

	_generateSchedulingErrorHTML(errorMessage, schedulingData = null) {
		var errorStatus = (schedulingData && schedulingData.status || "ERROR";
		var isValidationError = errorStatus === "VALIDATION_ERROR";
		var isDuplicateError = errorStatus === "DUPLICATE_ERROR";
		var isAuthError = errorStatus === "AUTH_ERROR";
		var isServerError = errorStatus === "SERVER_ERROR";
		var isConfigError = errorStatus === "CONFIG_ERROR";

		if (isDuplicateError) {
			return "\n				<div class=\"quiz-results-container\">\n					<div class=\"quiz-results-header\">\n						<h2 class=\"quiz-results-title\">⚠️ Appointment Already Exists</h2>\n						<p class=\"quiz-results-subtitle\">Good news! You already have an appointment scheduled with our dietitian.</p>\n					</div>\n\n					<div class=\"quiz-coverage-card\">\n						<div class=\"quiz-coverage-card-title\">What's Next?</div>\n						<div class=\"quiz-coverage-benefits\">\n							<div class=\"quiz-coverage-benefit\">\n								<div class=\"quiz-coverage-benefit-icon\">\n									<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n										<path d=\"M18 5.83333L10 11.6667L2 5.83333\" stroke=\"#306E51\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n										<path d=\"M2 5.83333H18V15C18 15.442 17.824 15.866 17.512 16.1785C17.199 16.491 16.775 16.6667 16.333 16.6667H3.667C3.225 16.6667 2.801 16.491 2.488 16.1785C2.176 15.866 2 15.442 2 15V5.83333Z\" stroke=\"#306E51\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n									</svg>\n								</div>\n								<div class=\"quiz-coverage-benefit-text\">\n									<strong>Check Your Email</strong><br/>\n									Your appointment confirmation and scheduling details have been sent to your email address\n								</div>\n							</div>\n							<div class=\"quiz-coverage-benefit\">\n								<div class=\"quiz-coverage-benefit-icon\">\n									<svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n										<path d=\"M8 2V6M16 2V6M3.5 10H20.5M5 4H19C20.105 4 21 4.895 21 6V20C21 21.105 20.105 22 19 22H5C3.895 22 3 21.105 3 20V6C3 4.895 3.895 4 5 4Z\" stroke=\"#306E51\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n									</svg>\n								</div>\n								<div class=\"quiz-coverage-benefit-text\">\n									<strong>Reschedule if Needed</strong><br/>\n									If you need to change your appointment time, use the link in your confirmation email\n								</div>\n							</div>\n						</div>\n					</div>\n\n					<div class=\"quiz-action-section\" style=\"background-color: #f8f9fa;\">\n						<div class=\"quiz-action-content\">\n							<div class=\"quiz-action-header\">\n								<h3 class=\"quiz-action-title\">Need Help?</h3>\n							</div>\n							<div class=\"quiz-action-details\">\n								<div class=\"quiz-action-feature\">\n									<svg class=\"quiz-action-feature-icon\" width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n										<path d=\"M18.3333 5.83333L10 11.6667L1.66666 5.83333\" stroke=\"#306E51\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n										<path d=\"M1.66666 5.83333H18.3333V15C18.3333 15.442 18.1577 15.866 17.8452 16.1785C17.5327 16.491 17.1087 16.6667 16.6667 16.6667H3.33333C2.89131 16.6667 2.46738 16.491 2.15482 16.1785C1.84226 15.866 1.66666 15.442 1.66666 15V5.83333Z\" stroke=\"#306E51\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n									</svg>\n									<div class=\"quiz-action-feature-text\">Email: support@curalife.com</div>\n								</div>\n								<div class=\"quiz-action-feature\">\n									<svg class=\"quiz-action-feature-icon\" width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n										<path d=\"M18.3081 14.2233C17.1569 14.2233 16.0346 14.0397 14.9845 13.6971C14.6449 13.5878 14.2705 13.6971 14.0579 13.9427L12.8372 15.6772C10.3023 14.4477 8.55814 12.7138 7.32326 10.1581L9.10465 8.89535C9.34884 8.68372 9.45814 8.30233 9.34884 7.96279C9.00581 6.91628 8.82209 5.79186 8.82209 4.64535C8.82209 4.28953 8.53256 4 8.17674 4H4.64535C4.28953 4 4 4.28953 4 4.64535C4 12.1715 10.1831 18.3953 17.6628 18.3953C18.0186 18.3953 18.3081 18.1058 18.3081 17.75V14.2233Z\" stroke=\"#306E51\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n									</svg>\n									<div class=\"quiz-action-feature-text\">Phone: 1-800-CURALIFE</div>\n								</div>\n							</div>\n						</div>\n					</div>\n				</div>\n			";
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
			";\n		}\n\n		// Service/Auth errors or general errors\n		var isServiceError = isAuthError || isConfigError;\n		var errorTitle = isServiceError ? \"🔧 Service Temporarily Unavailable\" : \"⚠️ Scheduling Assistance Needed\";\n		var errorDescription = isServiceError ? \"We're experiencing a temporary issue with our scheduling system.\" : \"We encountered an unexpected issue, but we're here to help.\";\n\n		return "
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
		";\n	}\n\n	showError(title, message) {\n		this._stopLoadingMessages();\n		this._toggleElement(this.questions, false);\n		this._toggleElement(this.error, true);\n\n		var errorTitle = this.error.querySelector(\"h3\");\n		var errorMessage = this.error.querySelector(\"p\");\n\n		if (errorTitle) errorTitle.textContent = title;\n		if (errorMessage) errorMessage.textContent = message;\n	}\n\n	_processWebhookResult(result) {\n		console.log(\"Processing webhook result:\", {\n			result,\n			hasSuccess: \"success\" in result,\n			hasBody: \"body\" in result,\n			hasEligibilityData: (result && result.eligibilityData || (result && result.(body && body.eligibilityData,\n			resultKeys: Object.keys(result || {}),\n			bodyKeys: (result && result.body ? Object.keys(result.body) : \"no body\"\n		});\n\n		// Handle nested response format (like from Google Cloud Function)\n		if ((result && result.body && typeof result.body === \"object\") {\n			console.log(\"Processing nested response format with body\");\n			var bodyResult = result.body;\n\n			if ((bodyResult && bodyResult.success === true && bodyResult.eligibilityData) {\n				var eligibilityData = bodyResult.eligibilityData;\n\n				// Handle generic ERROR status first\n				if (eligibilityData.eligibilityStatus === \"ERROR\") {\n					var errorMessage =\n						eligibilityData.userMessage || eligibilityData.(error && error.message || eligibilityData.error || \"There was an error checking your eligibility. Please contact customer support.\";\n					console.log(\"Processing generic ERROR status with message:\", errorMessage);\n					return this._createErrorEligibilityData(errorMessage);\n				}\n\n				// Handle AAA_ERROR status from workflow\n				if (eligibilityData.eligibilityStatus === \"AAA_ERROR\") {\n					// Try multiple ways to extract the error code\n					var errorCode = eligibilityData.(error && error.code || eligibilityData.aaaErrorCode || eligibilityData.(error && error.(allErrors && allErrors.[0]?.code || \"Unknown\";\n\n					console.log(\"Processing AAA_ERROR with code:\", errorCode, \"from eligibilityData:\", eligibilityData);\n					return this._createAAAErrorEligibilityData(errorCode, eligibilityData.userMessage);\n				}\n\n				return eligibilityData;\n			}\n		}\n\n		// Handle direct response format\n		if ((result && result.success === true && result.eligibilityData) {\n			// Check if this is an AAA error from the workflow response\n			var eligibilityData = result.eligibilityData;\n\n			// Handle generic ERROR status first\n			if (eligibilityData.eligibilityStatus === \"ERROR\") {\n				var errorMessage = eligibilityData.userMessage || eligibilityData.(error && error.message || eligibilityData.error || \"There was an error checking your eligibility. Please contact customer support.\";\n				console.log(\"Processing generic ERROR status with message:\", errorMessage);\n				return this._createErrorEligibilityData(errorMessage);\n			}\n\n			// Handle AAA_ERROR status from workflow\n			if (eligibilityData.eligibilityStatus === \"AAA_ERROR\") {\n				// Try multiple ways to extract the error code\n				var errorCode = eligibilityData.(error && error.code || eligibilityData.aaaErrorCode || eligibilityData.(error && error.(allErrors && allErrors.[0]?.code || \"Unknown\";\n\n				console.log(\"Processing AAA_ERROR with code:\", errorCode, \"from eligibilityData:\", eligibilityData);\n				return this._createAAAErrorEligibilityData(errorCode, eligibilityData.userMessage);\n			}\n\n			return eligibilityData;\n		}\n\n		// Handle error cases\n		if ((result && result.success === false) {\n			var errorMessage = result.error || result.message || \"Unknown error from eligibility service\";\n			return this._createErrorEligibilityData(errorMessage);\n		}\n\n		// Fallback for unknown formats\n		console.warn(\"Unknown webhook result format:\", result);\n		return this._createProcessingEligibilityData();\n	}\n\n	_createErrorEligibilityData(message) {\n		return {\n			isEligible: false,\n			sessionsCovered: 0,\n			deductible: { individual: 0 },\n			eligibilityStatus: \"ERROR\",\n			userMessage: message || \"There was an error checking your eligibility. Please contact customer support.\",\n			planBegin: \"\",\n			planEnd: \"\"\n		};\n	}\n\n	_createAAAErrorEligibilityData(aaaError, errorMessage) {\n		var aaaErrorMappings = {\n			42: {\n				title: \"Service Temporarily Unavailable\",\n				message: \"Your insurance company's system is temporarily unavailable. Please try again in a few minutes, or we can manually verify your coverage.\",\n				actionTitle: \"Alternative Options\",\n				actionText: \"Our team can verify your coverage manually while the system is down.\"\n			},\n			43: {\n				title: \"Provider Registration Issue\",\n				message: \"Your insurance plan requires additional provider verification. Our team will contact you to complete the eligibility check.\",\n				actionTitle: \"Manual Verification Required\",\n				actionText: \"We'll verify your provider status and coverage details manually.\"\n			},\n			72: {\n				title: \"Member ID Not Found\",\n				message: \"The member ID provided does not match our records. Please verify your member ID and try again.\",\n				actionTitle: \"ID Verification Required\",\n				actionText: \"Double-check your member ID matches exactly what's on your insurance card.\"\n			},\n			73: {\n				title: \"Name Mismatch\",\n				message: \"The name provided doesn't match our records. Please verify the name matches exactly as shown on your insurance card.\",\n				actionTitle: \"Name Verification Required\",\n				actionText: \"Ensure the name matches exactly as it appears on your insurance card.\"\n			},\n			75: {\n				title: \"Member Not Found\",\n				message: \"We couldn't find your insurance information in our system. This might be due to a recent plan change.\",\n				actionTitle: \"Manual Verification Required\",\n				actionText: \"Our team will manually verify your current insurance status.\"\n			},\n			76: {\n				title: \"Duplicate Member ID\",\n				message: \"We found a duplicate member ID in the insurance database. This might be due to multiple plan records.\",\n				actionTitle: \"Account Verification Required\",\n				actionText: \"Our team will verify your current coverage status and resolve any account duplicates.\"\n			},\n			79: {\n				title: \"System Connection Issue\",\n				message: \"There's a technical issue connecting with your insurance provider. Our team will manually verify your coverage.\",\n				actionTitle: \"Manual Verification\",\n				actionText: \"We'll process your eligibility manually and contact you with results.\"\n			}\n		};\n\n		// Convert error code to number for lookup\n		var numericErrorCode = parseInt(aaaError) || aaaError;\n		var errorInfo = aaaErrorMappings[numericErrorCode] || aaaErrorMappings[String(numericErrorCode)];\n\n		var finalMessage = errorMessage || (errorInfo && errorInfo.message || \"There was an issue verifying your insurance coverage automatically. Our team will manually verify your coverage.\";\n\n		return {\n			isEligible: false,\n			sessionsCovered: 0,\n			deductible: { individual: 0 },\n			eligibilityStatus: \"AAA_ERROR\",\n			userMessage: finalMessage,\n			planBegin: \"\",\n			planEnd: \"\",\n			aaaErrorCode: String(aaaError),\n			error: {\n				code: String(aaaError),\n				message: finalMessage,\n				isAAAError: true,\n				...errorInfo\n			}\n		};\n	}\n\n	_createProcessingEligibilityData() {\n		var processingMessages = this.(quizData && quizData.(ui && ui.(statusMessages && statusMessages.processing || {};\n\n		return {\n			isEligible: null,\n			sessionsCovered: 0,\n			deductible: { individual: 0 },\n			eligibilityStatus: \"PROCESSING\",\n			userMessage:\n				processingMessages.userMessage ||\n				\"Your eligibility check and account setup is still processing in the background. This can take up to 3 minutes for complex insurance verifications and account creation. Please proceed with booking - we'll contact you with your coverage details shortly.\",\n			planBegin: \"\",\n			planEnd: \"\"\n		};\n	}\n\n	showResults(resultUrl, webhookSuccess = true, resultData = null, errorMessage = \"\") {\n		console.log(\"showResults called with:\", {\n			webhookSuccess,\n			resultData,\n			eligibilityStatus: (resultData && resultData.eligibilityStatus,\n			isEligible: (resultData && resultData.isEligible,\n			errorMessage\n		});\n\n		this._stopLoadingMessages();\n\n		// Hide loading screen and show results\n		this._toggleElement(this.loading, false);\n		this._toggleElement(this.questions, true);\n		this._toggleElement(this.navigationButtons, false);\n		this._toggleElement(this.progressSection, false);\n\n		// Keep nav header visible for back button functionality\n		this._toggleElement(this.navHeader, true);\n\n		var quizType = this.(quizData && quizData.type || \"general\";\n		var resultsHTML = webhookSuccess ? this._generateResultsHTML(quizType, resultData, resultUrl) : this._generateErrorResultsHTML(resultUrl, errorMessage);\n\n		this.questionContainer.innerHTML = resultsHTML;\n		this._attachFAQListeners();\n		this._attachBookingButtonListeners();\n\n		// Scroll to top of results\n		window.scrollTo({ top: 0, behavior: \"smooth\" });\n	}\n\n	_stopLoadingMessages() {\n		// Clear any loading intervals\n		if (this.loadingInterval) {\n			clearInterval(this.loadingInterval);\n			this.loadingInterval = null;\n		}\n	}\n\n	_generateResultsHTML(quizType, resultData, resultUrl) {\n		// Determine if this quiz should show insurance results\n		if (this._isEligibilityQuiz(quizType, resultData)) {\n			return this._generateInsuranceResultsHTML(resultData, resultUrl);\n		}\n\n		// For other quiz types, generate appropriate results\n		switch (quizType) {\n			case \"assessment\":\n				return this._generateAssessmentResultsHTML(resultData, resultUrl);\n			case \"recommendation\":\n				return this._generateRecommendationResultsHTML(resultData, resultUrl);\n			default:\n				return this._generateGenericResultsHTML(resultData, resultUrl);\n		}\n	}\n\n	_isEligibilityQuiz(quizType, resultData) {\n		// Check if this quiz has eligibility data or is specifically an eligibility quiz\n		return !!((resultData && resultData.eligibilityStatus || (resultData && resultData.isEligible !== undefined || quizType === \"eligibility\" || this.(quizData && quizData.(features && features.eligibilityCheck);\n	}\n\n	_generateInsuranceResultsHTML(resultData, resultUrl) {\n		console.log(\"_generateInsuranceResultsHTML called with:\", {\n			resultData,\n			isEligible: (resultData && resultData.isEligible,\n			eligibilityStatus: (resultData && resultData.eligibilityStatus,\n			hasError: !!(resultData && resultData.error\n		});\n\n		if (!resultData) {\n			console.log(\"No resultData, using generic results\");\n			return this._generateGenericResultsHTML(resultData, resultUrl);\n		}\n\n		var isEligible = resultData.isEligible === true;\n		var eligibilityStatus = resultData.eligibilityStatus || \"UNKNOWN\";\n\n		console.log(\"Processing eligibility status:\", eligibilityStatus, \"isEligible:\", isEligible);\n\n		if (isEligible && eligibilityStatus === \"ELIGIBLE\") {\n			console.log(\"Generating eligible insurance results\");\n			return this._generateEligibleInsuranceResultsHTML(resultData, resultUrl);\n		}\n\n		if (eligibilityStatus === \"AAA_ERROR\") {\n			console.log(\"Generating AAA error results\");\n			return this._generateAAAErrorResultsHTML(resultData, resultUrl);\n		}\n\n		if (eligibilityStatus === \"TEST_DATA_ERROR\") {\n			console.log(\"Generating test data error results\");\n			return this._generateTestDataErrorResultsHTML(resultData, resultUrl);\n		}\n\n		if (eligibilityStatus === \"ERROR\") {\n			console.log(\"Generating generic error results\");\n			return this._generateErrorResultsHTML(resultUrl, resultData.userMessage || resultData.error || \"There was an error checking your eligibility. Please contact customer support.\");\n		}\n\n		if (eligibilityStatus === \"NOT_COVERED\" || (resultData.isEligible === false && eligibilityStatus === \"ELIGIBLE\")) {\n			console.log(\"Generating not covered insurance results\");\n			return this._generateNotCoveredInsuranceResultsHTML(resultData, resultUrl);\n		}\n\n		console.log(\"Generating ineligible insurance results (fallback)\");\n		return this._generateIneligibleInsuranceResultsHTML(resultData, resultUrl);\n	}\n\n	_generateGenericResultsHTML(resultData, resultUrl) {\n		return "
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
		var testParam = new URLSearchParams(window.location.search).get("test");
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

		setTimeoutfunction(() {
			// Detailed notifications (can be auto-collapsed)
			this._showBackgroundProcessNotification("Extraction Result<br>• Email: jane.humana@example.com<br>• Name: Jane Doe<br>• Missing fields: groupNumber", "info", "WARNING");

			this._showBackgroundProcessNotification("Processing Result<br>• Final status: ELIGIBLE<br>• Is eligible: true<br>• Has error: false", "info");

			this._showBackgroundProcessNotification(
				"Eligibility Result<br>✅ Status: ELIGIBLE<br>• Eligible: true<br>• Sessions: 10<br>• Message: Good news! Based on your insurance information, you are eligible for dietitian sessions.",
				"success"
			);
		}, 500);

		setTimeoutfunction(() {
			// Critical notification (always stays expanded)
			this._showBackgroundProcessNotification("Critical system failure detected!<br>• Database: Offline<br>• Immediate action required<br>• Contact IT support", "error", "CRITICAL");
		}, 1000);

		setTimeoutfunction(() {
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

document.addEventListenerfunction("DOMContentLoaded", () {
	var quiz = new ModularQuiz();
	window.productQuiz = quiz;

	// Add test method to global scope for debugging
	window.testNotifications = function() { return quiz._testNotificationSystem(); };
});

