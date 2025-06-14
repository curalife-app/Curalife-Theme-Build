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
		this.loadingInterval = null; // Used for comprehensive loading sequence steps

		// New state for background processing orchestration and polling
		this.statusTrackingId = null;
		this.pollingAttempts = 0;
		this.maxPollingAttempts = 20; // 40 seconds max (2 sec interval * 20 attempts)
		this.statusPollingInterval = null;
		this.pollingTimeout = null; // Overall timeout for the polling process
		this.workflowCompletionResolve = null; // To resolve the promise returned by _startOrchestratorWorkflow
		this.workflowCompletionReject = null; // To reject the promise returned by _startOrchestratorWorkflow
		this._lastStatusMessage = ""; // To prevent duplicate notifications for same status

		// Initialize the modular notification system and Stedi error mappings asynchronously
		Promise.all([this._initializeNotificationManager(), this._initializeStediErrorMappings(), this._initializeWebComponents()]).then(() => {
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

	async _initializeStediErrorMappings() {
		try {
			// Get the stedi error mappings URL from the data attribute set by Liquid
			const stediErrorMappingsUrl = this.container.getAttribute("data-stedi-mappings-url");

			if (!stediErrorMappingsUrl) {
				console.warn("Stedi error mappings URL not found, using fallback error handling");
				return false;
			}

			console.log("🔗 Loading Stedi error mappings from:", stediErrorMappingsUrl);

			// Dynamic import of the Stedi error mappings
			const { getStediErrorMapping, createStediErrorEligibilityData, getErrorTitle, isUserCorrectableError } = await import(stediErrorMappingsUrl);

			this.stediErrorMappings = {
				getMapping: getStediErrorMapping,
				createEligibilityData: createStediErrorEligibilityData,
				getTitle: getErrorTitle,
				isUserCorrectable: isUserCorrectableError
			};

			console.log("✅ Stedi error mappings loaded successfully");
			return true;
		} catch (error) {
			console.error("❌ Failed to load Stedi error mappings:", error);
			this.stediErrorMappings = null;
			return false;
		}
	}

	_loadScript(url) {
		return new Promise((resolve, reject) => {
			// Check if script is already loaded
			const existingScript = document.querySelector(`script[src="${url}"]`);
			if (existingScript) {
				resolve();
				return;
			}

			const script = document.createElement("script");
			script.src = url;
			script.type = "text/javascript";
			script.onload = () => resolve();
			script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
			document.head.appendChild(script);
		});
	}

	async _initializeWebComponents() {
		try {
			// Get the quiz components URL from the data attribute set by Liquid
			const quizComponentsUrl = this.container.getAttribute("data-quiz-components-url");

			if (!quizComponentsUrl) {
				console.warn("Quiz components URL not found, Web Components will not be available");
				return false;
			}

			console.log("🔗 Loading Quiz Web Components from:", quizComponentsUrl);

			// Load the script and wait for it to be available
			await this._loadScript(quizComponentsUrl);

			// Wait for the global QuizComponentsInit to be available
			let attempts = 0;
			const maxAttempts = 50; // 5 seconds max wait
			while (!window.QuizComponentsInit && attempts < maxAttempts) {
				await new Promise(resolve => setTimeout(resolve, 100));
				attempts++;
			}

			if (!window.QuizComponentsInit) {
				throw new Error("QuizComponentsInit not available after loading script");
			}

			// Use the global QuizComponentsInit
			this.webComponentsInit = window.QuizComponentsInit;

			// Validate that we have a valid initialization object
			if (!this.webComponentsInit || typeof this.webComponentsInit.init !== "function") {
				throw new Error("Invalid QuizComponentsInit object");
			}

			// Get CSS URL from container data attribute
			const cssUrl = this.container.getAttribute("data-quiz-css-url");

			await this.webComponentsInit.init({
				cssUrl: cssUrl,
				debug: this.isTestMode
			});

			console.log("✅ Quiz Web Components loaded successfully");
			return true;
		} catch (error) {
			console.error("❌ Failed to load Quiz Web Components:", error);
			this.webComponentsInit = null;
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

		// Store quiz instance on container for web components access
		this.container._quizInstance = this;

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

	// HIPAA COMPLIANCE: This method has been removed to prevent PHI data from being sent directly to eligibility workflow from browser
	// Eligibility checking is now handled server-side within the user creation workflow
	_triggerEligibilityWorkflow() {
		console.warn("⚠️ HIPAA COMPLIANCE: Direct eligibility workflow calls from browser are disabled. Eligibility will be checked server-side.");
		// Show user-friendly notification
		this._showBackgroundProcessNotification("🔒 Insurance verification will be processed securely server-side", "info");
	}

	async finishQuiz() {
		const resultUrl = this.container.getAttribute("data-result-url") || this.container.getAttribute("data-booking-url") || "/quiz-complete";

		try {
			this.submitting = true;
			this.nextButton.disabled = true;

			this._toggleElement(this.navigationButtons, false);
			this._toggleElement(this.progressSection, false);

			// Start the comprehensive loading sequence (UI only)
			this._showComprehensiveLoadingSequence();

			// Trigger the orchestrator workflow and await its *final* completion (including polling)
			const orchestratorResult = await this._startOrchestratorWorkflow();

			// Process the final result from the orchestrator
			const finalResult = this._processWebhookResult(orchestratorResult);
			console.log("Processed final result:", finalResult);

			// Test mode comprehensive finish notification
			if (this.isTestMode) {
				const workflowStatus = orchestratorResult ? "✅ Completed" : "❌ Failed"; // Simplistic based on success of awaited promise

				this._showBackgroundProcessNotification(
					`
					🧪 TEST MODE - Quiz Completion Status<br>
					• Orchestrator Workflow: ${workflowStatus}<br>
					• Final Status: ${finalResult?.eligibilityStatus || "Unknown"}<br>
					• Is Eligible: ${finalResult?.isEligible}<br>
					• Result URL: ${resultUrl}<br>
					• Total Responses: ${this.responses?.length || 0}
				`,
					"info"
				);
			}

			console.log("Calling showResults with:", { resultUrl, finalResult });

			// Add debugging to see if showResults is actually being called
			try {
				console.log("About to call showResults...");
				this.showResults(resultUrl, true, finalResult);
				console.log("showResults called successfully");
			} catch (showResultsError) {
				console.error("Error in showResults:", showResultsError);
				throw showResultsError;
			}
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

			// Use _handleWorkflowError to ensure loading is stopped and proper error results are shown
			this._handleWorkflowError(error);
		} finally {
			this.submitting = false;
			this.nextButton.disabled = false;
			// Note: Don't stop polling here as it should continue until workflow completes
			// Polling will be stopped by the workflow completion or error handlers
		}
	}

	// Comprehensive loading sequence with animated status updates
	async _showComprehensiveLoadingSequence() {
		// Show the loading screen with initial state
		this._showLoadingScreen();

		const loadingSteps = [
			{ title: "Processing Your Answers", description: "Analyzing your health information..." },
			{ title: "Checking Insurance Coverage", description: "Verifying your benefits..." },
			{ title: "Finding Your Dietitian", description: "Matching you with the right expert..." },
			{ title: "Preparing Your Results", description: "Finalizing your personalized plan..." }
		];

		// This loop primarily provides initial animation.
		// Real updates will come from _updateWorkflowStatus during polling.
		// Keep it simple and let polling handle the main flow.
		let stepIndex = 0;
		this._updateLoadingStep(loadingSteps[stepIndex]); // Initial step

		// Animate through initial steps if no real status comes through fast
		this.loadingInterval = setInterval(() => {
			stepIndex = (stepIndex + 1) % loadingSteps.length;
			this._updateLoadingStep(loadingSteps[stepIndex]);
		}, 1800); // Slower interval for initial animation
	}

	_showLoadingScreen() {
		// Hide quiz content and show loading screen
		this._toggleElement(this.questions, false);
		this._toggleElement(this.results, false);
		this._toggleElement(this.error, false);

		// Show loading container using Web Component
		if (this.loading) {
			// Create loading display component
			const loadingDisplay = document.createElement("quiz-loading-display");
			loadingDisplay.setAttribute("mode", "comprehensive");
			loadingDisplay.setAttribute("title", "Starting...");
			loadingDisplay.setAttribute("message", "Preparing to process your information");

			this.loading.innerHTML = "";
			this.loading.appendChild(loadingDisplay);
			this._toggleElement(this.loading, true);
		} else {
			// Fallback: update next button
			this.nextButton.innerHTML = `<div class="quiz-spinner"></div>Processing...`;
		}
	}

	_updateLoadingStep(step) {
		const loadingDisplay = document.querySelector("quiz-loading-display");

		if (loadingDisplay) {
			// Update step content via attributes
			loadingDisplay.setAttribute("title", step.title);
			loadingDisplay.setAttribute("message", step.description);
		}
	}

	_triggerUserCreationWorkflow() {
		// This is now redundant as orchestrator is directly called in finishQuiz
		console.warn("⚠️ _triggerUserCreationWorkflow is deprecated. Orchestrator is now triggered in finishQuiz.");
	}

	// =======================================================================
	// Orchestrator Workflow Methods (HIPAA Compliant)
	// =======================================================================

	/**
	 * Starts the orchestrator workflow and polls for its completion.
	 * This method triggers the orchestrator cloud function which coordinates
	 * all workflows while maintaining HIPAA compliance.
	 * Returns a Promise that resolves with the final workflow result.
	 */
	_startOrchestratorWorkflow() {
		const orchestratorUrl = this._getOrchestratorUrl();
		const payload = this._extractResponseData();

		// Store for emergency fallback
		this._lastOrchestratorUrl = orchestratorUrl;
		this._lastOrchestratorPayload = payload;

		// Report workflow initialization
		this._reportWorkflowStage("WORKFLOW_INIT", "Starting eligibility and user creation workflow", {
			url: orchestratorUrl,
			hasInsurance: this._hasInsurance(),
			payloadSize: JSON.stringify(payload).length
		});

		// Ensure any previous workflow state is cleaned up
		this._stopStatusPolling();
		this._stopFallbackChecking();

		// Return a new Promise that will resolve when the workflow truly completes
		return new Promise(async (resolve, reject) => {
			// Clear any existing resolvers before setting new ones
			if (this.workflowCompletionResolve || this.workflowCompletionReject) {
				console.warn("Replacing existing workflow completion resolvers");
			}

			this.workflowCompletionResolve = resolve;
			this.workflowCompletionReject = reject;

			try {
				// Report payload preparation
				this._reportWorkflowStage("PAYLOAD_BUILT", "Request data prepared and validated", {
					fields: Object.keys(payload),
					hasInsurance: payload.insurance ? "Yes" : "No"
				});

				// Report orchestrator call
				this._reportWorkflowStage("ORCHESTRATOR_CALL", "Initiating workflow orchestrator", {
					url: orchestratorUrl,
					method: "POST"
				});

				// 1. Initial call to the orchestrator to kick off the process
				const startTime = Date.now();
				const initialResponse = await fetch(orchestratorUrl, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload)
				});

				const duration = `${Date.now() - startTime}ms`;

				if (!initialResponse.ok) {
					const errorText = await initialResponse.text();
					const error = new Error(`Orchestrator initial call failed: HTTP ${initialResponse.status} - ${errorText}`);
					error.status = initialResponse.status;
					error.url = orchestratorUrl;
					this._reportWorkflowError(error, {
						stage: "ORCHESTRATOR_CALL",
						duration,
						responseText: errorText
					});
					throw error;
				}

				// Report successful connection
				this._reportWorkflowStage("ORCHESTRATOR_SUCCESS", "Connected to workflow service successfully", {
					status: initialResponse.status,
					duration
				});

				const initialResult = await initialResponse.json();

				// 2. Check for a statusTrackingId to begin polling, or if final data is immediately available
				if (initialResult.success && initialResult.statusTrackingId) {
					this._reportWorkflowStage("POLLING_START", "Status tracking initiated", {
						trackingId: initialResult.statusTrackingId,
						mode: "Standard Polling"
					});
					this._startStatusPolling(initialResult.statusTrackingId);
				} else if (initialResult.success && initialResult.data) {
					// If orchestrator immediately returns final data (e.g., for simple, fast workflows)
					this._reportWorkflowStage("WORKFLOW_COMPLETE", "Workflow completed immediately", {
						type: "Fast Track",
						hasData: "Yes"
					});
					this._stopLoadingMessages(); // Dismiss loading as it's truly done
					resolve(initialResult.data); // Resolve the promise with the final data
				} else if (initialResult.success) {
					// Workflow started but no immediate data - set up polling with fallback
					this._reportWorkflowStage("POLLING_START", "Status tracking initiated with fallback", {
						trackingId: initialResult.statusTrackingId,
						mode: "Polling + Fallback"
					});

					// Start polling as usual
					this._startStatusPolling(initialResult.statusTrackingId);

					// BUT ALSO set up a fallback check to periodically test if the orchestrator completed
					this._setupOrchestrationFallback(orchestratorUrl, payload, initialResult.statusTrackingId);
				} else {
					// Initial call failed or didn't provide tracking ID/data
					const error = new Error(initialResult.error || "Orchestrator did not provide status tracking ID or final data.");
					this._reportWorkflowError(error, {
						stage: "ORCHESTRATOR_RESPONSE",
						result: initialResult
					});
					throw error;
				}
			} catch (error) {
				console.error("Error initiating orchestrator workflow:", error);
				this._reportWorkflowError(error, {
					stage: "WORKFLOW_INIT",
					url: orchestratorUrl
				});
				this._stopLoadingMessages(); // Ensure loading is dismissed on immediate error
				reject(error); // Reject the promise
			}
		});
	}

	/**
	 * Handles workflow errors
	 */
	_handleWorkflowError(error) {
		console.error("Handling workflow error:", error);

		// Report the workflow failure with detailed context
		this._reportWorkflowError(error, {
			stage: "WORKFLOW_ERROR_HANDLER",
			pollingAttempts: this.pollingAttempts,
			statusTrackingId: this.statusTrackingId,
			workflowType: this._hasInsurance() ? "Full Workflow" : "Simple Workflow"
		});

		// Stop loading messages and status polling
		this._stopLoadingMessages();
		this._stopStatusPolling();
		this._stopFallbackChecking();

		// Reject the workflow promise if it's still pending
		if (this.workflowCompletionReject) {
			this.workflowCompletionReject(error);
			this.workflowCompletionReject = null;
			this.workflowCompletionResolve = null;
		}

		// Create proper error result data
		const errorResultData = {
			eligibilityStatus: "ERROR",
			isEligible: false,
			userMessage: error.message || error.error || "There was an error processing your request.",
			error: error
		};

		// Report final workflow failure
		this._reportWorkflowStage("WORKFLOW_FAILED", "Workflow terminated due to error", {
			errorType: error.name || "UnknownError",
			errorMessage: error.message || "Unknown error",
			errorCode: error.code,
			statusCode: error.status
		});

		// Show error results
		this.showResults(
			this.config.resultUrl,
			false, // webhookSuccess
			errorResultData,
			error.message || error.error || "There was an error processing your request."
		);
	}

	/**
	 * Gets the orchestrator URL
	 */
	_getOrchestratorUrl() {
		const container = document.getElementById("quiz-container");
		return container?.dataset?.orchestratorUrl || "https://us-central1-telemedicine-458913.cloudfunctions.net/workflowOrchestratorV2";
	}

	// =======================================================================
	// Orchestrator Fallback Methods
	// =======================================================================

	/**
	 * Set up a fallback mechanism to directly check orchestrator completion
	 * This handles cases where status polling fails but the workflow completes
	 */
	_setupOrchestrationFallback(orchestratorUrl, payload, statusTrackingId) {
		// Check every 10 seconds starting after 20 seconds (sooner due to stale status issues)
		this._reportWorkflowStage("FALLBACK_TRIGGERED", "Setting up fallback mechanism", {
			delay: "20 seconds",
			interval: "10 seconds",
			maxAttempts: 6
		});

		this.fallbackTimeout = setTimeout(() => {
			this._startFallbackChecking(orchestratorUrl, payload, statusTrackingId);
		}, 20000);
	}

	_startFallbackChecking(orchestratorUrl, payload, statusTrackingId) {
		let fallbackAttempts = 0;
		const maxFallbackAttempts = 6; // 6 attempts = 1 minute of checking

		this._reportWorkflowStage("FALLBACK_TRIGGERED", "Starting fallback polling", {
			url: orchestratorUrl,
			maxAttempts: maxFallbackAttempts,
			trackingId: statusTrackingId
		});

		this.fallbackInterval = setInterval(async () => {
			fallbackAttempts++;

			try {
				this._reportWorkflowStage("FALLBACK_TRIGGERED", `Fallback check attempt ${fallbackAttempts}`, {
					attempt: fallbackAttempts,
					maxAttempts: maxFallbackAttempts,
					url: orchestratorUrl
				});

				// Try calling the orchestrator again to see if it's completed
				const startTime = Date.now();
				const response = await fetch(orchestratorUrl, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ ...payload, fallbackCheck: true, statusTrackingId })
				});
				const duration = `${Date.now() - startTime}ms`;

				if (response.ok) {
					const result = await response.json();

					// If we get final data, resolve the workflow
					if (result.success && result.data) {
						this._reportWorkflowStage("WORKFLOW_COMPLETE", "Workflow completed via fallback", {
							attempt: fallbackAttempts,
							duration,
							method: "Fallback Polling"
						});

						this._stopFallbackChecking();
						this._stopStatusPolling();
						this._stopLoadingMessages();

						if (this.workflowCompletionResolve) {
							this.workflowCompletionResolve(result.data);
							this.workflowCompletionResolve = null;
						}
						return;
					}
				} else {
					this._reportWorkflowStage("FALLBACK_TRIGGERED", `Fallback check failed`, {
						attempt: fallbackAttempts,
						status: response.status,
						duration
					});
				}
			} catch (error) {
				this._reportWorkflowError(error, {
					stage: "FALLBACK_CHECK",
					attempt: fallbackAttempts,
					maxAttempts: maxFallbackAttempts
				});
			}

			// Stop fallback checking after max attempts
			if (fallbackAttempts >= maxFallbackAttempts) {
				this._reportWorkflowStage("FALLBACK_TRIGGERED", "Fallback attempts exhausted", {
					attempts: fallbackAttempts,
					status: "Max attempts reached"
				});
				this._stopFallbackChecking();
			}
		}, 10000); // Check every 10 seconds
	}

	_stopFallbackChecking() {
		if (this.fallbackInterval) {
			clearInterval(this.fallbackInterval);
			this.fallbackInterval = null;
		}
		if (this.fallbackTimeout) {
			clearTimeout(this.fallbackTimeout);
			this.fallbackTimeout = null;
			this._reportWorkflowStage("FALLBACK_TRIGGERED", "Fallback mechanism stopped", {
				reason: "Cleanup or completion"
			});
		}
	}

	/**
	 * Emergency fallback when stale status is detected
	 */
	_triggerEmergencyFallback() {
		// Use the stored orchestrator data from the initial call
		if (this._lastOrchestratorUrl && this._lastOrchestratorPayload) {
			this._reportWorkflowStage("EMERGENCY_FALLBACK", "Triggering emergency fallback due to stale status", {
				url: this._lastOrchestratorUrl,
				hasPayload: !!this._lastOrchestratorPayload,
				trackingId: this.statusTrackingId
			});
			this._startFallbackChecking(this._lastOrchestratorUrl, this._lastOrchestratorPayload, this.statusTrackingId);
		} else {
			this._reportWorkflowStage("EMERGENCY_FALLBACK", "Emergency fallback failed - missing data", {
				hasUrl: !!this._lastOrchestratorUrl,
				hasPayload: !!this._lastOrchestratorPayload,
				trackingId: this.statusTrackingId
			});

			// Fallback to timeout error
			setTimeout(() => {
				if (this.workflowCompletionReject) {
					const error = new Error("Status polling failed and emergency fallback unavailable");
					this._reportWorkflowError(error, {
						stage: "EMERGENCY_FALLBACK_FAILURE"
					});
					this.workflowCompletionReject(error);
				}
			}, 1000);
		}
	}

	// =======================================================================
	// Status Polling Methods
	// =======================================================================

	/**
	 * Start status polling for enhanced user experience and final workflow completion.
	 * This function will eventually resolve the workflowCompletionPromise.
	 */
	_startStatusPolling(statusTrackingId) {
		// Clear any existing polling interval to prevent duplicates (but preserve statusTrackingId)
		if (this.statusPollingInterval) {
			console.log("Clearing existing polling interval");
			clearInterval(this.statusPollingInterval);
			this.statusPollingInterval = null;
		}
		if (this.pollingTimeout) {
			console.log("Clearing existing polling timeout");
			clearTimeout(this.pollingTimeout);
			this.pollingTimeout = null;
		}

		// Set tracking variables AFTER clearing intervals but WITHOUT calling _stopStatusPolling
		this.statusTrackingId = statusTrackingId;
		this.pollingAttempts = 0;
		this.maxPollingAttempts = 60; // 120 seconds max (2 sec interval * 60 attempts)
		this._lastStatusMessage = "";

		// Start with an immediate poll, then continue every 2 seconds
		this._pollWorkflowStatus();

		this.statusPollingInterval = setInterval(() => {
			this._pollWorkflowStatus();
		}, 2000);

		// Set a overall timeout for the polling
		this.pollingTimeout = setTimeout(
			() => {
				this._stopStatusPolling();
				this._stopLoadingMessages(); // Stop loading on timeout
				console.warn("Polling timed out. Workflow status unknown or took too long.");
				const timeoutError = new Error("Workflow processing took too long. Please contact support.");
				// Reject the original workflow promise if it hasn't been resolved/rejected yet
				if (this.workflowCompletionReject) {
					this.workflowCompletionReject(timeoutError);
					this.workflowCompletionReject = null; // Prevent multiple rejections
				} else {
					console.error("WorkflowCompletionReject not set, cannot reject promise on timeout.");
				}
			},
			this.maxPollingAttempts * 2000 + 10000
		); // Max attempts * interval + a buffer (130 seconds total)
	}

	/**
	 * Polls for workflow status and updates UI.
	 * This function will eventually resolve the workflowCompletionPromise.
	 */
	async _pollWorkflowStatus() {
		if (!this.statusTrackingId) {
			this._stopStatusPolling();
			return;
		}

		if (this.pollingAttempts >= this.maxPollingAttempts) {
			this._reportWorkflowStage("POLLING_ERROR", "Maximum polling attempts reached", {
				attempts: this.pollingAttempts,
				maxAttempts: this.maxPollingAttempts,
				trackingId: this.statusTrackingId
			});
			this._stopStatusPolling(); // Stop polling, overall timeout will handle the promise
			return;
		}

		this.pollingAttempts++;

		try {
			const statusUrl = this._getStatusPollingUrl();
			const payload = { statusTrackingId: this.statusTrackingId };

			const startTime = Date.now();
			const response = await fetch(statusUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload)
			});
			const pollDuration = `${Date.now() - startTime}ms`;

			if (response.ok) {
				const statusData = await response.json();

				// Check for important warnings
				if (statusData.statusData?.debug?.eligibilityTimeout) {
					this._reportWorkflowStage("ELIGIBILITY_TIMEOUT", "Insurance check timed out, workflow continuing", {
						timeout: statusData.statusData.debug.eligibilityTimeout,
						step: statusData.statusData.currentStep
					});
				}

				if (statusData.statusData?.debug?.warnings) {
					statusData.statusData.debug.warnings.forEach(warning => {
						this._reportWorkflowStage("POLLING_WARNING", `Workflow warning: ${warning}`, {
							attempt: this.pollingAttempts,
							step: statusData.statusData.currentStep
						});
					});
				}

				if (statusData.success && statusData.statusData) {
					// Report progress update
					this._reportWorkflowStage("POLLING_UPDATE", `Progress: ${statusData.statusData.progress || 0}%`, {
						step: statusData.statusData.currentStep,
						status: statusData.statusData.currentStatus,
						progress: statusData.statusData.progress,
						attempt: this.pollingAttempts,
						duration: pollDuration
					});

					this._updateWorkflowStatus(statusData.statusData);

					// Track stale status but don't trigger emergency fallback (causes duplicate workflows)
					if (statusData.statusData.currentStep === "processing" && statusData.statusData.progress === 25 && this.pollingAttempts > 15) {
						this._reportWorkflowStage("STALE_STATUS", "Potentially stale status detected", {
							step: statusData.statusData.currentStep,
							progress: statusData.statusData.progress,
							attempts: this.pollingAttempts,
							duration: `${this.pollingAttempts * 2}s`
						});
					}

					if (statusData.statusData.completed) {
						// Extract the final result data properly
						const finalResult = statusData.statusData.finalData || statusData.statusData.finalResult || statusData.statusData;

						// Store the result for debugging
						this.workflowResult = finalResult;

						// Report completion
						this._reportWorkflowStage("WORKFLOW_COMPLETE", "Workflow completed successfully via polling", {
							attempts: this.pollingAttempts,
							totalTime: `${this.pollingAttempts * 2}s`,
							finalStatus: statusData.statusData.currentStatus,
							hasData: finalResult ? "Yes" : "No"
						});

						// Resolve the original workflow promise with the final result from polling BEFORE stopping polling
						if (this.workflowCompletionResolve) {
							this.workflowCompletionResolve(finalResult);
						} else {
							console.warn("WorkflowCompletionResolve not set - workflow may have already completed or been reset.");
						}

						// Now stop polling and cleanup (this will clear the resolvers)
						this._stopStatusPolling();
						this._stopFallbackChecking(); // Stop fallback since polling succeeded
						this._stopLoadingMessages(); // Stop loading since workflow is complete
					}
				} else {
					this._reportWorkflowStage("POLLING_ERROR", "Invalid response from status service", {
						success: statusData.success,
						hasData: !!statusData.statusData,
						error: statusData.error,
						attempt: this.pollingAttempts
					});

					// Non-critical, continue polling unless it's a hard error
					if (statusData.error) {
						this._showBackgroundProcessNotification(`Polling error: ${statusData.error}`, "error", "info");
					}
				}
			} else {
				const errorText = await response.text();
				this._reportWorkflowStage("POLLING_ERROR", `HTTP error during status check`, {
					status: response.status,
					statusText: response.statusText,
					responseText: errorText.substring(0, 200),
					attempt: this.pollingAttempts,
					duration: pollDuration
				});

				// Non-critical, continue polling on network/HTTP errors
				this._showBackgroundProcessNotification(`Network error during status check (${response.status}). Retrying...`, "warning", "info");
			}
		} catch (error) {
			this._reportWorkflowError(error, {
				stage: "STATUS_POLLING",
				attempt: this.pollingAttempts,
				trackingId: this.statusTrackingId
			});

			// Non-critical, continue polling on JS errors
			this._showBackgroundProcessNotification(`An error occurred during status check. Retrying...`, "warning", "info");
		}
	}

	/**
	 * Update UI with real status information from polling
	 */
	_updateWorkflowStatus(statusData) {
		if (!statusData) return;

		const loadingStepsMap = {
			INITIATED: { title: "Processing Your Answers", description: "Analyzing your health information..." },
			ELIGIBILITY_CHECK_STARTED: { title: "Checking Insurance Coverage", description: "Verifying your benefits..." },
			ELIGIBILITY_CHECK_COMPLETED: { title: "Insurance Checked!", description: "Eligibility verification complete." },
			USER_CREATION_STARTED: { title: "Creating Your Account", description: "Setting up your personalized profile..." },
			USER_CREATION_COMPLETED: { title: "Account Created!", description: "Your profile is ready." },
			SCHEDULING_STARTED: { title: "Finding Your Dietitian", description: "Matching you with the right expert..." },
			COMPLETED: { title: "Almost Ready!", description: "Preparing your personalized results..." }, // Final state for success
			FAILED: { title: "Something Went Wrong!", description: "We encountered an issue. Please contact support." } // Final state for failure
		};

		const currentStepInfo = loadingStepsMap[statusData.currentStatus] || {
			title: "Processing...",
			description: statusData.message || "Please wait while we process your request."
		};

		this._updateLoadingStep(currentStepInfo);

		// Show enhanced status notifications with proper types
		if (statusData.message && statusData.message !== this._lastStatusMessage) {
			let notificationType = "info";
			let priority = "info";

			// Determine notification type based on status
			if (statusData.currentStatus?.includes("COMPLETED") || statusData.currentStatus?.includes("SUCCESS")) {
				notificationType = "success";
				priority = "success";
			} else if (statusData.currentStatus?.includes("FAILED") || statusData.currentStatus?.includes("ERROR")) {
				notificationType = "error";
				priority = "error";
			} else if (statusData.currentStatus?.includes("STARTED") || statusData.currentStatus?.includes("PROGRESS")) {
				notificationType = "info";
				priority = "info";
			}

			// Map specific statuses to workflow stages
			const statusToStageMap = {
				INITIATED: "WORKFLOW_INIT",
				ELIGIBILITY_CHECK_STARTED: "ELIGIBILITY_START",
				ELIGIBILITY_CHECK_COMPLETED: "ELIGIBILITY_SUCCESS",
				USER_CREATION_STARTED: "USER_CREATION_START",
				USER_CREATION_COMPLETED: "USER_CREATION_SUCCESS",
				SCHEDULING_STARTED: "SCHEDULING_START",
				COMPLETED: "WORKFLOW_COMPLETE",
				FAILED: "WORKFLOW_FAILED"
			};

			const stage = statusToStageMap[statusData.currentStatus] || "POLLING_UPDATE";

			this._reportWorkflowStage(stage, statusData.message, {
				currentStep: statusData.currentStep,
				progress: statusData.progress,
				elapsedTime: statusData.debug?.elapsedTime,
				workflowPath: statusData.debug?.workflowPath
			});

			this._lastStatusMessage = statusData.message;
		}

		// Update progress bar
		if (statusData.progress !== undefined) {
			this._updateLoadingProgress(statusData.progress);
		}
	}

	/**
	 * Stop status polling
	 */
	_stopStatusPolling() {
		if (this.statusPollingInterval) {
			clearInterval(this.statusPollingInterval);
			this.statusPollingInterval = null;
		}
		if (this.pollingTimeout) {
			clearTimeout(this.pollingTimeout);
			this.pollingTimeout = null;
		}
		// Reset tracking variables
		this.statusTrackingId = null;
		this.pollingAttempts = 0;
		this._lastStatusMessage = "";

		// Clear workflow completion resolvers to prevent memory leaks and errors
		// Note: These should already be null if the workflow completed successfully
		if (this.workflowCompletionResolve || this.workflowCompletionReject) {
			this.workflowCompletionResolve = null;
			this.workflowCompletionReject = null;
		}
	}

	/**
	 * Get the status polling URL
	 */
	_getStatusPollingUrl() {
		const container = document.getElementById("quiz-container");
		// Ensure this points to your actual backend status polling endpoint
		return container?.dataset?.statusPollingUrl || "https://us-central1-telemedicine-458913.cloudfunctions.net/workflow_status_polling";
	}

	/**
	 * Update loading progress indicator
	 */
	_updateLoadingProgress(progress) {
		// Find progress elements and update them
		const progressBars = document.querySelectorAll(".loading-progress-bar, .progress-bar");
		const progressTexts = document.querySelectorAll(".loading-progress-text, .progress-text");

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

	_extractResponseData(showNotifications = false) {
		const fieldMapping = {
			q9: "customerEmail",
			q7: "firstName",
			q8: "lastName",
			q10: "phoneNumber",
			q5: "state",
			q3: ["insurance", "insurancePrimaryPayerId"],
			q4: "insuranceMemberId",
			q4_group: "groupNumber",
			q1: "mainReasons",
			q2: "medicalConditions",
			// New address fields for Beluga scheduling
			q11: "address",
			q12: "city",
			q13: "zip",
			q14: "sex"
		};

		const data = {
			customerEmail: "",
			firstName: "",
			lastName: "",
			phoneNumber: "",
			state: "",
			insurance: "",
			insurancePrimaryPayerId: "",
			insuranceMemberId: "",
			groupNumber: "",
			mainReasons: [],
			medicalConditions: [],
			dateOfBirth: "",
			consent: true,
			// New address fields for Beluga scheduling
			address: "",
			city: "",
			zip: "",
			sex: ""
		};

		const dobParts = {};

		console.log("Extracting response data from responses:", this.responses);

		// Test mode detailed extraction notification - only show if requested
		if (this.isTestMode && showNotifications) {
			const responsesSummary = this.responses?.map(r => `${r.questionId}: ${Array.isArray(r.answer) ? r.answer.join(",") : r.answer}`).join("<br>• ") || "None";

			this._showBackgroundProcessNotification(
				`
				🧪 TEST MODE - Data Extraction<br>
				• Total responses: ${this.responses?.length || 0}<br>
				• Expected questions: ${Object.keys(fieldMapping).join(", ")}<br>
				• Responses:<br>• ${responsesSummary}
			`,
				"info"
			);
		}

		// Process responses
		if (this.responses && Array.isArray(this.responses)) {
			for (const response of this.responses) {
				const questionId = response.questionId;
				const answer = response.answer;

				// Handle date of birth parts
				if (questionId && (questionId.startsWith("q6_") || questionId.startsWith("q11_") || questionId.includes("birth") || questionId.includes("dob"))) {
					if (questionId.includes("month")) dobParts.month = answer;
					if (questionId.includes("day")) dobParts.day = answer;
					if (questionId.includes("year")) dobParts.year = answer;
					continue;
				}

				// Handle mapped fields
				const fieldName = fieldMapping[questionId];
				if (fieldName) {
					if (Array.isArray(fieldName)) {
						// Handle payer search (q3) mapping to both insurance and insurancePrimaryPayerId
						data[fieldName[0]] = answer;
						data[fieldName[1]] = answer;
					} else {
						data[fieldName] = answer;
					}
				}
			}
		}

		// Construct date of birth
		if (dobParts.month && dobParts.day && dobParts.year) {
			const month = String(dobParts.month).padStart(2, "0");
			const day = String(dobParts.day).padStart(2, "0");
			data.dateOfBirth = `${dobParts.year}${month}${day}`;
		}

		console.log("Extracted response data:", data);

		// Test mode extraction result notification - only show if requested
		if (this.isTestMode && showNotifications) {
			// groupNumber is optional, so exclude it from required field checks
			const missingFields = Object.entries(data)
				.filter(([key, value]) => !value && !["mainReasons", "medicalConditions", "consent", "groupNumber"].includes(key))
				.map(([key]) => key);

			const optionalFields = [];
			if (!data.groupNumber) {
				optionalFields.push("groupNumber");
			}

			this._showBackgroundProcessNotification(
				`
				🧪 TEST MODE - Extraction Result<br>
				• Email: ${data.customerEmail || "❌ Missing"}<br>
				• Name: ${data.firstName} ${data.lastName}<br>
				• Insurance: ${data.insurance || "❌ Missing"}<br>
				• Member ID: ${data.insuranceMemberId || "❌ Missing"}<br>
				• Missing required: ${missingFields.length ? missingFields.join(", ") : "None"}<br>
				• Optional fields: ${optionalFields.length ? optionalFields.join(", ") : "All present"}
			`,
				missingFields.length > 0 ? "error" : "success"
			);
		}

		return data;
	}

	/**
	 * Build payload for the orchestrator workflow
	 */
	_buildWorkflowPayload() {
		const payload = {
			timestamp: Date.now(),
			hasInsurance: this._hasInsurance(),
			customerEmail: this._getResponseValue("customer_email"),
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
				method: "POST",
				headers: {
					"Content-Type": "application/json"
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
		const insuranceResponse = this._getResponseValue("has_insurance");
		return insuranceResponse === "yes" || insuranceResponse === true || insuranceResponse === "Yes";
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
			customer_first_name: "firstName",
			customer_last_name: "lastName",
			customer_email: "email",
			customer_phone: "phone",
			customer_address: "address",
			customer_city: "city",
			customer_state: "state",
			customer_zip: "zipCode",
			date_of_birth_month: "birthMonth",
			date_of_birth_day: "birthDay",
			date_of_birth_year: "birthYear"
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
			insurance_provider: "provider",
			form_member_id: "memberId",
			subscriber_group_id: "groupId",
			plan_group_id: "planGroupId"
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

		// Ensure step container gets quiz data after DOM insertion
		const stepContainer = this.questionContainer.querySelector("quiz-step-container");
		if (stepContainer && this.quizData) {
			stepContainer.setAttribute("quiz-data", JSON.stringify(this.quizData));
		}

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
		const stepContainer = document.createElement("quiz-step-container");
		stepContainer.setAttribute("step-data", JSON.stringify(step));
		stepContainer.setAttribute("responses", JSON.stringify(this.responses));
		stepContainer.setAttribute("current-question-index", this.currentQuestionIndex.toString());
		stepContainer.setAttribute("is-form-step", this.isFormStep(step.id).toString());

		stepContainer.setAttribute("quiz-data", JSON.stringify(this.quizData));

		// Add validation errors if any
		const validationErrors = this._getValidationErrorsForStep(step);
		if (validationErrors.length > 0) {
			stepContainer.setAttribute("validation-errors", JSON.stringify(validationErrors));
		}

		// Check if this is the last step
		const isLastStep = this.currentStepIndex === this.quizData.steps.length - 1;
		if (isLastStep) {
			stepContainer.setAttribute("is-last-step", "true");
		}

		return stepContainer.outerHTML;
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
		// Web Components should always be available - no fallbacks needed!
		return this._renderQuestionWithWebComponent(question, response);
	}

	_renderQuestionWithWebComponent(question, response) {
		const questionData = JSON.stringify(question);

		switch (question.type) {
			case "multiple-choice":
				return `<quiz-multiple-choice
					question-data='${questionData}'
					selected-value="${response.answer || ""}"
				></quiz-multiple-choice>`;

			case "checkbox":
				const selectedValues = Array.isArray(response.answer) ? response.answer : [];
				const layout = question.id === "consent" ? "simple" : "cards";
				return `<quiz-checkbox-group
					question-data='${questionData}'
					selected-values='${JSON.stringify(selectedValues)}'
					layout="${layout}"
				></quiz-checkbox-group>`;

			case "dropdown":
				return `<quiz-dropdown
					question-data='${questionData}'
					selected-value="${response.answer || ""}"
				></quiz-dropdown>`;

			case "text":
				return `<quiz-text-input
					question-data='${questionData}'
					value="${response.answer || ""}"
				></quiz-text-input>`;

			case "rating":
				return `<quiz-rating
					question-data='${questionData}'
					value="${response.answer || 5}"
				></quiz-rating>`;

			case "payer-search":
				return `<quiz-payer-search
					question-id="${question.id}"
					placeholder="${question.placeholder || "Start typing to search for your insurance plan..."}"
					common-payers='${JSON.stringify(this.quizData.commonPayers || [])}'
					quiz-data='${JSON.stringify({ config: this.quizData.config, commonPayers: this.quizData.commonPayers })}'
					${response.answer ? `selected-payer="${response.answer}"` : ""}
					${response.answer ? `selected-display-name="${this._resolvePayerDisplayName(response.answer) || ""}"` : ""}
				></quiz-payer-search>`;

			case "date":
				return this.renderDateInput(question, response); // No Web Component yet

			case "date-part":
				return this.renderDatePart(question, response); // No Web Component yet

			case "textarea":
				return this.renderTextarea(question, response); // No Web Component yet

			default:
				return `<p class="quiz-error-text">Unsupported field type: ${question.type}</p>`;
		}
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

	_getErrorElement(questionId) {
		return `<p id="error-${questionId}" class="quiz-error-text quiz-error-hidden"></p>`;
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
				// Removed direct _triggerUserCreationWorkflow call here, as it's now handled by finishQuiz
				// The orchestrator is initiated by finishQuiz, which then waits for its completion.
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
		// Web Components handle their own visual feedback
		setTimeout(() => {
			this.goToNextStep();
		}, this.config.autoAdvanceDelay || 600);
	}

	_updateCheckboxVisualState(question, answer) {
		// Web Components handle their own visual state
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
			"multiple-choice": () => this._attachWebComponentListener(question, "quiz-multiple-choice", "answer-selected"),
			checkbox: () => this._attachWebComponentListener(question, "quiz-checkbox-group", "answer-selected"),
			dropdown: () => this._attachWebComponentListener(question, "quiz-dropdown", "answer-selected"),
			text: () => this._attachWebComponentListener(question, "quiz-text-input", "answer-selected"),
			rating: () => this._attachWebComponentListener(question, "quiz-rating", "answer-selected"),
			"payer-search": () =>
				this._attachWebComponentListener(question, "quiz-payer-search", "payer-selected", event => {
					const { questionId, payer } = event.detail;
					if (questionId === question.id) {
						this.handleAnswer(payer.stediId || payer.id);
					}
				}),
			// Legacy components (no Web Components yet)
			"date-part": () => this._attachLegacyDropdownListener(question),
			date: () => this._attachLegacyTextInputListener(question),
			textarea: () => this._attachLegacyTextInputListener(question)
		};

		handlers[question.type]?.();
	}

	_attachWebComponentListener(question, componentTag, eventName, customHandler = null) {
		const webComponent = this.questionContainer.querySelector(componentTag);
		if (webComponent) {
			const handler =
				customHandler ||
				(event => {
					const { questionId, value } = event.detail;
					if (questionId === question.id) {
						this.handleAnswer(value);
					}
				});
			webComponent.addEventListener(eventName, handler);
		}
	}

	_attachWebComponentValidationListener(question, componentTag) {
		const webComponent = this.questionContainer.querySelector(componentTag);
		if (webComponent) {
			webComponent.addEventListener("validation-requested", event => {
				const { questionId } = event.detail;
				if (questionId === question.id) {
					// Get the current value directly from the Web Component to ensure accuracy
					let currentValue;
					if (webComponent.getValue) {
						currentValue = webComponent.getValue();
					} else if (webComponent.getSelectedValue) {
						currentValue = webComponent.getSelectedValue();
					} else {
						// Fallback to event value
						currentValue = event.detail.value;
					}

					this._validateAndUpdateField(question, currentValue);
				}
			});
		}
	}

	_attachLegacyDropdownListener(question) {
		const dropdown = this.questionContainer.querySelector(`#question-${question.id}`);
		if (dropdown) {
			dropdown.addEventListener("change", event => {
				this.handleAnswer(event.target.value);
			});
		}
	}

	_attachLegacyTextInputListener(question) {
		const input = this.questionContainer.querySelector(`#question-${question.id}`);
		if (input) {
			input.addEventListener("input", event => {
				this.handleAnswer(event.target.value);
			});
		}
	}

	_attachLegacyFormDropdownListener(question) {
		const dropdown = this.questionContainer.querySelector(`#question-${question.id}`);
		if (dropdown) {
			dropdown.addEventListener("change", event => {
				event.preventDefault(); // Prevent form submission
				this.handleFormAnswer(question.id, event.target.value);
				this.updateNavigation();
			});
		}
	}

	_attachLegacyFormTextInputListener(question) {
		const input = this.questionContainer.querySelector(`#question-${question.id}`);
		if (input) {
			input.addEventListener("input", event => {
				event.preventDefault(); // Prevent form submission
				this.handleFormAnswer(question.id, event.target.value);
				this.updateNavigation();
			});
		}
	}

	_attachPayerSearchFormListeners(question) {
		setTimeout(() => {
			const webComponent = this.questionContainer.querySelector(`quiz-payer-search[question-id="${question.id}"]`);
			if (webComponent) {
				webComponent.addEventListener("payer-selected", event => {
					const { questionId, payer } = event.detail;
					if (questionId === question.id) {
						this.handleFormAnswer(question.id, payer.primaryPayerId || payer.stediId);
						this.updateNavigation();
					}
				});
			}
		}, 100);
	}

	_resolvePayerDisplayName(primaryPayerId) {
		const commonPayers = this.quizData.commonPayers || [];
		const matchingPayer = commonPayers.find(payer => payer.primaryPayerId === primaryPayerId);
		return matchingPayer?.displayName || null;
	}

	_attachFormQuestionListener(question) {
		const formHandlers = {
			// Web Components
			dropdown: () => {
				this._attachWebComponentListener(question, "quiz-dropdown", "answer-selected", event => {
					const { questionId, value } = event.detail;
					if (questionId === question.id) {
						this.handleFormAnswer(question.id, value);
						this.updateNavigation();
					}
				});
				this._attachWebComponentValidationListener(question, "quiz-dropdown");
			},
			text: () => {
				this._attachWebComponentListener(question, "quiz-text-input", "answer-selected", event => {
					const { questionId, value } = event.detail;
					if (questionId === question.id) {
						this.handleFormAnswer(question.id, value);
						this.updateNavigation();
					}
				});
				this._attachWebComponentValidationListener(question, "quiz-text-input");
			},
			checkbox: () => {
				this._attachWebComponentListener(question, "quiz-checkbox-group", "answer-selected", event => {
					const { questionId, value } = event.detail;
					if (questionId === question.id) {
						this.handleFormAnswer(question.id, value);
						this.updateNavigation();
					}
				});
				this._attachWebComponentValidationListener(question, "quiz-checkbox-group");
			},
			"payer-search": () => {
				this._attachPayerSearchFormListeners(question);
				this._attachWebComponentValidationListener(question, "quiz-payer-search");
			},
			// Legacy components
			"date-part": () => this._attachLegacyFormDropdownListener(question),
			date: () => this._attachLegacyFormTextInputListener(question)
		};

		formHandlers[question.type]?.();
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
			// Try Web Component first
			const webComponent = this.questionContainer.querySelector(`[question-id="${error.questionId}"]`);

			if (webComponent) {
				// Update Web Component validation state
				webComponent.setAttribute("show-error", "true");
				webComponent.setAttribute("error-message", error.message);

				// Find the actual input element for scrolling
				const input = webComponent.querySelector("input, select");
				if (input && index === 0) firstInvalidField = input;
			} else {
				// Fallback to legacy elements
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

	_getValidationErrorsForStep(step) {
		// Helper method to collect validation errors for a step
		// This would be populated during validation
		return this.currentValidationErrors || [];
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

	_validateAndUpdateField(question, value) {
		const validationResult = this._validateFieldValue(question, value);
		const webComponent = this.questionContainer.querySelector(`[question-id="${question.id}"]`);

		if (webComponent) {
			// Update Web Component validation state
			if (validationResult.isValid) {
				webComponent.removeAttribute("show-error");
				webComponent.removeAttribute("error-message");
			} else {
				webComponent.setAttribute("show-error", "true");
				webComponent.setAttribute("error-message", validationResult.errorMessage);
			}
		}

		return validationResult.isValid;
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

	_showSchedulingResults(result) {
		const schedulingData = result?.schedulingData;

		// Use Web Component if available, otherwise fallback to legacy HTML
		if (this.webComponentsInit && this.webComponentsInit.isInitialized()) {
			const schedulingResult = document.createElement("quiz-scheduling-result");

			if (result?.success && schedulingData?.scheduleLink) {
				// Success case
				schedulingResult.setAttribute("result-type", "success");
				schedulingResult.setAttribute("scheduling-data", JSON.stringify(schedulingData));
			} else {
				// Error case
				const errorMessage = schedulingData?.message || result?.error || "Unknown scheduling error";
				schedulingResult.setAttribute("result-type", "error");
				schedulingResult.setAttribute("error-message", errorMessage);
				if (schedulingData) {
					schedulingResult.setAttribute("scheduling-data", JSON.stringify(schedulingData));
				}
			}

			this.questionContainer.innerHTML = schedulingResult.outerHTML;
			return;
		}

		// Legacy fallback
		if (result?.success && schedulingData?.scheduleLink) {
			// Success - show scheduling success page when we have a schedule link
			const successHTML = this._generateSchedulingSuccessHTML(schedulingData);
			this.questionContainer.innerHTML = successHTML;
		} else {
			// Error - show scheduling error page
			const errorMessage = schedulingData?.message || result?.error || "Unknown scheduling error";
			this._showSchedulingError(errorMessage, schedulingData);
		}
	}

	_showSchedulingError(errorMessage, schedulingData = null) {
		// Use Web Component if available, otherwise fallback to legacy HTML
		if (this.webComponentsInit && this.webComponentsInit.isInitialized()) {
			const schedulingResult = document.createElement("quiz-scheduling-result");
			schedulingResult.setAttribute("result-type", "error");
			schedulingResult.setAttribute("error-message", errorMessage);
			if (schedulingData) {
				schedulingResult.setAttribute("scheduling-data", JSON.stringify(schedulingData));
			}
			this.questionContainer.innerHTML = schedulingResult.outerHTML;
			return;
		}

		// Legacy fallback
		const errorHTML = this._generateSchedulingErrorHTML(errorMessage, schedulingData);
		this.questionContainer.innerHTML = errorHTML;
	}

	_handleSchedulingAction(action) {
		// Handle actions from the scheduling result Web Component
		switch (action) {
			case "retry":
				// Retry the scheduling workflow
				this._triggerSchedulingWorkflow(this._getSchedulingUrl());
				break;
			case "contact-support":
				// Open support contact (could be email, phone, or chat)
				window.open("mailto:support@curalife.com?subject=Scheduling%20Assistance%20Needed", "_blank");
				break;
			case "add-to-calendar":
				// Add appointment to calendar (would need appointment data)
				console.log("Add to calendar action triggered");
				break;
			case "view-details":
				// Show detailed appointment information
				console.log("View details action triggered");
				break;
			case "continue":
				// Continue to next step or close
				console.log("Continue action triggered");
				break;
			default:
				console.warn("Unknown scheduling action:", action);
		}
	}

	_generateSchedulingSuccessHTML(schedulingData) {
		// Fallback for ES5 compatibility - using regular variables and string concatenation
		var scheduleLink = schedulingData && schedulingData.scheduleLink ? schedulingData.scheduleLink : "#";
		var masterId = schedulingData && schedulingData.masterId ? schedulingData.masterId : "";
		var referenceHtml = masterId ? '<p class="quiz-text-xs" style="margin-top: 16px; color: #666; font-family: monospace;">Reference ID: ' + masterId + "</p>" : "";

		var html = "";
		html += '<div class="quiz-results-container">';
		html += '<div class="quiz-results-header">';
		html += '<h2 class="quiz-results-title">🎉 Appointment Request Submitted!</h2>';
		html += '<p class="quiz-results-subtitle">Great news! Your request has been successfully processed and your dietitian appointment is ready to be scheduled.</p>';
		html += "</div>";
		html += '<div class="quiz-action-section">';
		html += '<div class="quiz-action-content">';
		html += '<div class="quiz-action-header">';
		html += '<h3 class="quiz-action-title">Next: Choose Your Appointment Time</h3>';
		html += "</div>";
		html += '<div class="quiz-action-details">';
		html += '<div class="quiz-action-info">';
		html += '<div class="quiz-action-info-text">';
		html += "Click below to access your personalized scheduling portal where you can select from available appointment times that work best for your schedule.";
		html += "</div>";
		html += "</div>";
		html += '<a href="' + scheduleLink + '" target="_blank" class="quiz-booking-button">';
		html += '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">';
		html +=
			'<path d="M6.66666 2.5V5.83333M13.3333 2.5V5.83333M2.5 9.16667H17.5M4.16666 3.33333H15.8333C16.7538 3.33333 17.5 4.07952 17.5 5V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16666C3.24619 18.3333 2.5 17.5871 2.5 16.6667V5C2.5 4.07952 3.24619 3.33333 4.16666 3.33333Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>';
		html += "</svg>";
		html += "Schedule Your Appointment";
		html += "</a>";
		html += referenceHtml;
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += '<div class="quiz-coverage-card">';
		html += '<div class="quiz-coverage-card-title">What to Expect</div>';
		html += '<div class="quiz-coverage-benefits">';
		html += '<div class="quiz-coverage-benefit">';
		html += '<div class="quiz-coverage-benefit-icon">';
		html += '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">';
		html += '<path d="M12 8V12L15 15" stroke="#306E51" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
		html += '<circle cx="12" cy="12" r="9" stroke="#306E51" stroke-width="2"/>';
		html += "</svg>";
		html += "</div>";
		html += '<div class="quiz-coverage-benefit-text">';
		html += "<strong>30-60 Minutes</strong><br/>";
		html += "Comprehensive nutrition consultation tailored to your specific health goals";
		html += "</div>";
		html += "</div>";
		html += '<div class="quiz-coverage-benefit">';
		html += '<div class="quiz-coverage-benefit-icon">';
		html += '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">';
		html +=
			'<path d="M17 3V0M12 3V0M7 3V0M3 7H21M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="#306E51" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
		html += "</svg>";
		html += "</div>";
		html += '<div class="quiz-coverage-benefit-text">';
		html += "<strong>Flexible Scheduling</strong><br/>";
		html += "Choose from morning, afternoon, or evening slots that fit your lifestyle";
		html += "</div>";
		html += "</div>";
		html += '<div class="quiz-coverage-benefit">';
		html += '<div class="quiz-coverage-benefit-icon">';
		html += '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">';
		html +=
			'<path d="M9 12L11 14L22 3M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3.89543 3 5 3 5 3H16" stroke="#306E51" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
		html += "</svg>";
		html += "</div>";
		html += '<div class="quiz-coverage-benefit-text">';
		html += "<strong>Personalized Plan</strong><br/>";
		html += "Receive a custom nutrition plan based on your quiz responses and health profile";
		html += "</div>";
		html += "</div>";
		html += '<div class="quiz-coverage-benefit">';
		html += '<div class="quiz-coverage-benefit-icon">';
		html += '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">';
		html +=
			'<path d="M18.3333 14.1667C18.3333 15.0871 17.5871 15.8333 16.6667 15.8333H5.83333L1.66666 20V3.33333C1.66666 2.41286 2.41285 1.66667 3.33333 1.66667H16.6667C17.5871 1.66667 18.3333 2.41286 18.3333 3.33333V14.1667Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>';
		html += "</svg>";
		html += "</div>";
		html += '<div class="quiz-coverage-benefit-text">';
		html += "<strong>Ongoing Support</strong><br/>";
		html += "Follow-up resources and support to help you achieve your health goals";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += '<div class="quiz-action-section" style="background-color: #f8f9fa;">';
		html += '<div class="quiz-action-content">';
		html += '<div class="quiz-action-header">';
		html += '<h3 class="quiz-action-title">Need Assistance?</h3>';
		html += "</div>";
		html += '<div class="quiz-action-details">';
		html += '<div class="quiz-action-info">';
		html += '<div class="quiz-action-info-text">';
		html += "Our support team is here to help if you have any questions about scheduling or preparing for your appointment.";
		html += "</div>";
		html += "</div>";
		html += '<div class="quiz-action-feature">';
		html += '<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">';
		html += '<path d="M18.3333 5.83333L10 11.6667L1.66666 5.83333" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>';
		html +=
			'<path d="M1.66666 5.83333H18.3333V15C18.3333 15.442 18.1577 15.866 17.8452 16.1785C17.5327 16.491 17.1087 16.6667 16.6667 16.6667H3.33333C2.89131 16.6667 2.46738 16.491 2.15482 16.1785C1.84226 15.866 1.66666 15.442 1.66666 15V5.83333Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>';
		html += "</svg>";
		html += '<div class="quiz-action-feature-text">Email: support@curalife.com</div>';
		html += "</div>";
		html += '<div class="quiz-action-feature">';
		html += '<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">';
		html +=
			'<path d="M18.3081 14.2233C17.1569 14.2233 16.0346 14.0397 14.9845 13.6971C14.6449 13.5878 14.2705 13.6971 14.0579 13.9427L12.8372 15.6772C10.3023 14.4477 8.55814 12.7138 7.32326 10.1581L9.10465 8.89535C9.34884 8.68372 9.45814 8.30233 9.34884 7.96279C9.00581 6.91628 8.82209 5.79186 8.82209 4.64535C8.82209 4.28953 8.53256 4 8.17674 4H4.64535C4.28953 4 4 4.28953 4 4.64535C4 12.1715 10.1831 18.3953 17.6628 18.3953C18.0186 18.3953 18.3081 18.1058 18.3081 17.75V14.2233Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>';
		html += "</svg>";
		html += '<div class="quiz-action-feature-text">Phone: 1-800-CURALIFE</div>';
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";
		html += "</div>";

		return html; // Proper return statement
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
									<strong>Check Your Email</strong><br/>
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
									<strong>Reschedule if Needed</strong><br/>
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
			hasEligibility: result?.eligibility,
			resultKeys: Object.keys(result || {}),
			bodyKeys: result?.body ? Object.keys(result.body) : "no body"
		});

		// Handle new workflow orchestrator format with eligibility, insurancePlan, userCreation
		if (result?.eligibility && typeof result.eligibility === "object") {
			console.log("Processing new workflow orchestrator format");
			const eligibilityResult = result.eligibility;

			if (eligibilityResult?.success === true && eligibilityResult.eligibilityData) {
				const eligibilityData = eligibilityResult.eligibilityData;
				console.log("Extracted eligibility data from orchestrator result:", eligibilityData);

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
					return this._createStediErrorEligibilityData(errorCode, eligibilityData.userMessage);
				}

				// Handle STEDI_ERROR status from workflow
				if (eligibilityData.eligibilityStatus === "STEDI_ERROR") {
					// Extract the Stedi error code
					const errorCode = eligibilityData.error?.code || eligibilityData.stediErrorCode || "Unknown";

					console.log("Processing STEDI_ERROR with code:", errorCode, "from eligibilityData:", eligibilityData);
					return this._createStediErrorEligibilityData(errorCode, eligibilityData.userMessage);
				}

				return eligibilityData;
			}
		}

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
					return this._createStediErrorEligibilityData(errorCode, eligibilityData.userMessage);
				}

				// Handle STEDI_ERROR status from workflow
				if (eligibilityData.eligibilityStatus === "STEDI_ERROR") {
					// Extract the Stedi error code
					const errorCode = eligibilityData.error?.code || eligibilityData.stediErrorCode || "Unknown";

					console.log("Processing STEDI_ERROR with code:", errorCode, "from eligibilityData:", eligibilityData);
					return this._createStediErrorEligibilityData(errorCode, eligibilityData.userMessage);
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
				return this._createStediErrorEligibilityData(errorCode, eligibilityData.userMessage);
			}

			// Handle STEDI_ERROR status from workflow
			if (eligibilityData.eligibilityStatus === "STEDI_ERROR") {
				// Extract the Stedi error code
				const errorCode = eligibilityData.error?.code || eligibilityData.stediErrorCode || "Unknown";

				console.log("Processing STEDI_ERROR with code:", errorCode, "from eligibilityData:", eligibilityData);
				return this._createStediErrorEligibilityData(errorCode, eligibilityData.userMessage);
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

	_createStediErrorEligibilityData(errorCode, customMessage = null) {
		// Use the Stedi error mappings if available, otherwise fall back to generic handling
		if (this.stediErrorMappings?.createEligibilityData) {
			console.log("Using Stedi error mappings for error code:", errorCode);
			return this.stediErrorMappings.createEligibilityData(errorCode, customMessage);
		}

		// Fallback to existing AAA error handling for backward compatibility
		console.log("Falling back to AAA error handling for error code:", errorCode);
		return this._createAAAErrorEligibilityData(errorCode, customMessage);
	}

	showResults(resultUrl, webhookSuccess = true, resultData = null, errorMessage = "") {
		try {
			this._stopLoadingMessages();
			this._stopStatusPolling(); // Ensure polling is stopped

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
		} catch (error) {
			console.error("Error in showResults:", error);
			throw error;
		}
	}

	_stopLoadingMessages() {
		// Clear any comprehensive loading sequence intervals
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

		console.log("Processing eligibility status:", eligibilityStatus, "isEligible:", isEligible, "raw isEligible:", resultData.isEligible);

		if (isEligible && (eligibilityStatus === "ELIGIBLE" || eligibilityStatus === "ACTIVE")) {
			console.log("Generating eligible insurance results");
			return this._generateEligibleInsuranceResultsHTML(resultData, resultUrl);
		}

		if (eligibilityStatus === "AAA_ERROR") {
			console.log("Generating AAA error results");
			return this._generateAAAErrorResultsHTML(resultData, resultUrl);
		}

		if (eligibilityStatus === "TECHNICAL_PROBLEM") {
			console.log("Generating technical problem results");
			return this._generateTechnicalProblemResultsHTML(resultData, resultUrl);
		}

		if (eligibilityStatus === "INSURANCE_PLANS_ERROR") {
			console.log("Generating insurance plans error results");
			return this._generateInsurancePlansErrorResultsHTML(resultData, resultUrl);
		}

		if (eligibilityStatus === "TEST_DATA_ERROR") {
			console.log("Generating test data error results");
			return this._generateTestDataErrorResultsHTML(resultData, resultUrl);
		}

		if (eligibilityStatus === "PROCESSING") {
			console.log("Generating processing insurance results");
			return this._generateProcessingInsuranceResultsHTML(resultData, resultUrl);
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
		// Use Web Component if available, otherwise fallback to legacy HTML
		if (this.webComponentsInit && this.webComponentsInit.isInitialized()) {
			const resultCard = document.createElement("quiz-result-card");
			resultCard.setAttribute("result-type", "generic");
			resultCard.setAttribute("result-data", JSON.stringify(resultData || {}));
			resultCard.setAttribute("result-url", resultUrl);
			return resultCard.outerHTML;
		}

		// Legacy fallback HTML (original implementation)
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

	_generateErrorResultsHTML(resultUrl, errorMessage) {
		// Use Web Component if available, otherwise fallback to legacy HTML
		if (this.webComponentsInit && this.webComponentsInit.isInitialized()) {
			const resultCard = document.createElement("quiz-result-card");
			resultCard.setAttribute("result-type", "error");
			resultCard.setAttribute("result-data", JSON.stringify({ error: errorMessage }));
			resultCard.setAttribute("result-url", resultUrl);
			return resultCard.outerHTML;
		}

		// Legacy fallback HTML (original implementation)
		return `
			<div class="quiz-results-container">
				<div class="quiz-results-header">
					<h2 class="quiz-results-title">Quiz Complete</h2>
					<p class="quiz-results-subtitle">We've received your information.</p>
				</div>
				<div class="quiz-coverage-card" style="border-left: 4px solid #f56565; background-color: #fed7d7;">
                    <h3 class="quiz-coverage-card-title" style="color: #c53030;">⚠️ Eligibility Check Error</h3>
                    <p style="color: #c53030;">There was an error checking your insurance eligibility.</p>
				</div>
				<div class="quiz-action-section">
					<div class="quiz-action-content">
						<div class="quiz-action-header">
							<h3 class="quiz-action-title">Need assistance?</h3>
						</div>
						<div class="quiz-action-details">
							<div class="quiz-action-info">
								<svg class="quiz-action-info-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									<path d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-info-text">Our support team will manually verify your insurance coverage and help you get connected with the right dietitian.</div>
							</div>
							<div class="quiz-action-feature">
								<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M18.3333 14.1667C18.3333 15.0871 17.5871 15.8333 16.6667 15.8333H5.83333L1.66666 20V3.33333C1.66666 2.41286 2.41285 1.66667 3.33333 1.66667H16.6667C17.5871 1.66667 18.3333 2.41286 18.3333 3.33333V14.1667Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-feature-text">Direct support to help resolve any coverage questions</div>
							</div>
							<div class="quiz-action-feature">
								<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M6.66666 2.5V5.83333M13.3333 2.5V5.83333M2.5 9.16667H17.5M4.16666 3.33333H15.8333C16.7538 3.33333 17.5 4.07952 17.5 5V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16666C3.24619 18.3333 2.5 17.5871 2.5 16.6667V5C2.5 4.07952 3.24619 3.33333 4.16666 3.33333Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-feature-text">Quick resolution to get you scheduled with a dietitian</div>
							</div>
						</div>
						<a href="${resultUrl}" class="quiz-booking-button">Continue to Support</a>
					</div>
				</div>
			</div>
		`;
	}

	_generateEligibleInsuranceResultsHTML(resultData, resultUrl) {
		// Use Web Component if available, otherwise fallback to legacy HTML
		if (this.webComponentsInit && this.webComponentsInit.isInitialized()) {
			const resultCard = document.createElement("quiz-result-card");
			resultCard.setAttribute("result-type", "eligible");
			resultCard.setAttribute("result-data", JSON.stringify(resultData));
			resultCard.setAttribute("result-url", resultUrl);
			return resultCard.outerHTML;
		}

		// Legacy fallback HTML (original implementation)
		const sessionsCovered = resultData.sessionsCovered || 5;
		const planEnd = resultData.planEnd || "Dec 31, 2025";

		// Create coverage card component
		const coverageCard = document.createElement("quiz-coverage-card");
		coverageCard.setAttribute("title", "Here's Your Offer");
		coverageCard.setAttribute("sessions-covered", sessionsCovered);
		coverageCard.setAttribute("plan-end", planEnd);

		// Create action section component
		const actionSection = document.createElement("quiz-action-section");
		actionSection.setAttribute("title", "Schedule your initial online consultation now");
		actionSection.setAttribute("background-color", "#F1F8F4");
		actionSection.setAttribute("result-url", resultUrl);

		// Create container and assemble
		const container = document.createElement("div");
		container.className = "quiz-results-container";
		container.innerHTML = `
			<div class="quiz-results-header">
				<h2 class="quiz-results-title">Great news! You're covered</h2>
				<p class="quiz-results-subtitle">As of today, your insurance fully covers your online dietitian consultations*</p>
			</div>
		`;

		container.appendChild(coverageCard);
		container.appendChild(actionSection);
		container.insertAdjacentHTML("beforeend", this._generateFAQHTML());

		return container.outerHTML;
	}

	_generateNotCoveredInsuranceResultsHTML(resultData, resultUrl) {
		// Use Web Component if available, otherwise fallback to legacy HTML
		if (this.webComponentsInit && this.webComponentsInit.isInitialized()) {
			const resultCard = document.createElement("quiz-result-card");
			resultCard.setAttribute("result-type", "not-covered");
			resultCard.setAttribute("result-data", JSON.stringify(resultData));
			resultCard.setAttribute("result-url", resultUrl);
			return resultCard.outerHTML;
		}

		// Legacy fallback HTML (original implementation)
		const messages = this.quizData.ui?.resultMessages?.notCovered || {};
		const userMessage = resultData.userMessage || "Your insurance plan doesn't cover nutrition counseling, but we have affordable options available.";

		return `
			<div class="quiz-results-container">
				<div class="quiz-results-header">
					<h2 class="quiz-results-title">${messages.title || "Thanks for completing the quiz!"}</h2>
					<p class="quiz-results-subtitle">${messages.subtitle || "We have options for you."}</p>
				</div>
				<div class="quiz-coverage-card" style="border-left: 4px solid #ed8936; background-color: #fffaf0;">
					<h3 class="quiz-coverage-card-title" style="color: #c05621;">💡 Coverage Information</h3>
					<p style="color: #c05621;">${userMessage}</p>
				</div>
				<div class="quiz-action-section">
					<div class="quiz-action-content">
						<div class="quiz-action-header">
							<h3 class="quiz-action-title">Alternative Options</h3>
						</div>
						<div class="quiz-action-details">
							<div class="quiz-action-info">
								<svg class="quiz-action-info-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									<path d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-info-text">We offer affordable self-pay options and payment plans to make nutrition counseling accessible.</div>
							</div>
							<div class="quiz-action-feature">
								<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M18.3333 14.1667C18.3333 15.0871 17.5871 15.8333 16.6667 15.8333H5.83333L1.66666 20V3.33333C1.66666 2.41286 2.41285 1.66667 3.33333 1.66667H16.6667C17.5871 1.66667 18.3333 2.41286 18.3333 3.33333V14.1667Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-feature-text">Competitive rates and flexible payment options</div>
							</div>
							<div class="quiz-action-feature">
								<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M6.66666 2.5V5.83333M13.3333 2.5V5.83333M2.5 9.16667H17.5M4.16666 3.33333H15.8333C16.7538 3.33333 17.5 4.07952 17.5 5V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16666C3.24619 18.3333 2.5 17.5871 2.5 16.6667V5C2.5 4.07952 3.24619 3.33333 4.16666 3.33333Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-feature-text">Same quality care from registered dietitians</div>
							</div>
						</div>
						<a href="${resultUrl}" class="quiz-booking-button">Explore Options</a>
					</div>
				</div>
			</div>
		`;
	}

	_generateAAAErrorResultsHTML(resultData, resultUrl) {
		// Use Web Component if available, otherwise fallback to legacy HTML
		if (this.webComponentsInit && this.webComponentsInit.isInitialized()) {
			const resultCard = document.createElement("quiz-result-card");
			resultCard.setAttribute("result-type", "aaa-error");
			resultCard.setAttribute("result-data", JSON.stringify(resultData));
			resultCard.setAttribute("result-url", resultUrl);
			return resultCard.outerHTML;
		}

		// Legacy fallback HTML (original implementation)
		const messages = this.quizData.ui?.resultMessages?.aaaError || {};
		const error = resultData.error || {};
		const errorCode = error.code || resultData.aaaErrorCode || "Unknown";
		const userMessage = resultData.userMessage || error.message || "There was an issue verifying your insurance coverage automatically.";
		const errorTitle = error.title || this._getErrorTitle(errorCode);

		return `
			<div class="quiz-results-container">
				<div class="quiz-results-header">
					<h2 class="quiz-results-title">${messages.title || "Thanks for completing the quiz!"}</h2>
					<p class="quiz-results-subtitle">${messages.subtitle || "We're here to help."}</p>
				</div>
				<div class="quiz-coverage-card" style="border-left: 4px solid #f56565; background-color: #fed7d7;">
					<h3 class="quiz-coverage-card-title" style="color: #c53030;">⚠️ ${errorTitle}</h3>
					<p style="color: #c53030;">${userMessage}</p>
					${errorCode !== "Unknown" ? `<p style="color: #c53030; font-size: 0.9em; margin-top: 8px;">Error Code: ${errorCode}</p>` : ""}
				</div>
				<div class="quiz-action-section">
					<div class="quiz-action-content">
						<div class="quiz-action-header">
							<h3 class="quiz-action-title">We'll help resolve this</h3>
						</div>
						<div class="quiz-action-details">
							<div class="quiz-action-info">
								<svg class="quiz-action-info-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									<path d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-info-text">Our team will manually verify your insurance coverage and resolve any verification issues.</div>
							</div>
							<div class="quiz-action-feature">
								<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M18.3333 14.1667C18.3333 15.0871 17.5871 15.8333 16.6667 15.8333H5.83333L1.66666 20V3.33333C1.66666 2.41286 2.41285 1.66667 3.33333 1.66667H16.6667C17.5871 1.66667 18.3333 2.41286 18.3333 3.33333V14.1667Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-feature-text">Direct support to resolve coverage verification</div>
							</div>
							<div class="quiz-action-feature">
								<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M6.66666 2.5V5.83333M13.3333 2.5V5.83333M2.5 9.16667H17.5M4.16666 3.33333H15.8333C16.7538 3.33333 17.5 4.07952 17.5 5V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16666C3.24619 18.3333 2.5 17.5871 2.5 16.6667V5C2.5 4.07952 3.24619 3.33333 4.16666 3.33333Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-feature-text">Quick resolution to get you connected with a dietitian</div>
							</div>
						</div>
						<a href="${resultUrl}" class="quiz-booking-button">Continue with Support</a>
					</div>
				</div>
			</div>
		`;
	}

	_generateTestDataErrorResultsHTML(resultData, resultUrl) {
		// Use Web Component if available, otherwise fallback to legacy HTML
		if (this.webComponentsInit && this.webComponentsInit.isInitialized()) {
			const resultCard = document.createElement("quiz-result-card");
			resultCard.setAttribute("result-type", "test-data-error");
			resultCard.setAttribute("result-data", JSON.stringify(resultData));
			resultCard.setAttribute("result-url", resultUrl);
			return resultCard.outerHTML;
		}

		// Legacy fallback HTML (original implementation)
		const messages = this.quizData.ui?.resultMessages?.testDataError || {};
		const userMessage = resultData.userMessage || "Test data was detected in your submission. Please use real insurance information for accurate verification.";

		return `
			<div class="quiz-results-container">
				<div class="quiz-results-header">
					<h2 class="quiz-results-title">${messages.title || "Please use real information"}</h2>
					<p class="quiz-results-subtitle">${messages.subtitle || "We need accurate details for verification."}</p>
				</div>
				<div class="quiz-coverage-card" style="border-left: 4px solid #ed8936; background-color: #fffaf0;">
					<h3 class="quiz-coverage-card-title" style="color: #c05621;">⚠️ Test Data Detected</h3>
					<p style="color: #c05621;">${userMessage}</p>
				</div>
				<div class="quiz-action-section">
					<div class="quiz-action-content">
						<div class="quiz-action-header">
							<h3 class="quiz-action-title">Next Steps</h3>
						</div>
						<div class="quiz-action-details">
							<div class="quiz-action-info">
								<svg class="quiz-action-info-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									<path d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-info-text">Please retake the quiz with your actual insurance information for accurate coverage verification.</div>
							</div>
							<div class="quiz-action-feature">
								<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M18.3333 14.1667C18.3333 15.0871 17.5871 15.8333 16.6667 15.8333H5.83333L1.66666 20V3.33333C1.66666 2.41286 2.41285 1.66667 3.33333 1.66667H16.6667C17.5871 1.66667 18.3333 2.41286 18.3333 3.33333V14.1667Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-feature-text">Use information exactly as it appears on your insurance card</div>
							</div>
							<div class="quiz-action-feature">
								<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M6.66666 2.5V5.83333M13.3333 2.5V5.83333M2.5 9.16667H17.5M4.16666 3.33333H15.8333C16.7538 3.33333 17.5 4.07952 17.5 5V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16666C3.24619 18.3333 2.5 17.5871 2.5 16.6667V5C2.5 4.07952 3.24619 3.33333 4.16666 3.33333Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-feature-text">Get accurate coverage details for your plan</div>
							</div>
						</div>
						<a href="${resultUrl}" class="quiz-booking-button">Continue</a>
					</div>
				</div>
			</div>
		`;
	}

	_generateTechnicalProblemResultsHTML(resultData, resultUrl) {
		// Use Web Component if available, otherwise fallback to legacy HTML
		if (this.webComponentsInit && this.webComponentsInit.isInitialized()) {
			const resultCard = document.createElement("quiz-result-card");
			resultCard.setAttribute("result-type", "technical-problem");
			resultCard.setAttribute("result-data", JSON.stringify(resultData));
			resultCard.setAttribute("result-url", resultUrl);
			return resultCard.outerHTML;
		}

		// Legacy fallback HTML (original implementation)
		const messages = this.quizData.ui?.resultMessages?.technicalProblem || {};
		const error = resultData.error || {};
		const errorCode = error.code || resultData.stediErrorCode || "Unknown";
		const userMessage = resultData.userMessage || error.message || "There was a technical issue processing your insurance verification.";
		const actionTitle = error.actionTitle || "Technical Issue Detected";
		const detailedDescription = error.detailedDescription || "Our systems encountered an unexpected error while processing your request.";

		// Create error display component
		const errorDisplay = document.createElement("quiz-error-display");
		errorDisplay.setAttribute("severity", "technical");
		errorDisplay.setAttribute("title", actionTitle);
		errorDisplay.setAttribute("message", userMessage);
		errorDisplay.setAttribute("details", detailedDescription);
		if (errorCode !== "Unknown") {
			errorDisplay.setAttribute("error-code", errorCode);
		}

		// Add action button
		errorDisplay.innerHTML = `
			<div slot="actions">
				<a href="${resultUrl}" class="quiz-booking-button">Continue with Support</a>
			</div>
		`;

		// Create container
		const container = document.createElement("div");
		container.className = "quiz-results-container";
		container.innerHTML = `
			<div class="quiz-results-header">
				<h2 class="quiz-results-title">${messages.title || "Technical Issue Detected"}</h2>
				<p class="quiz-results-subtitle">${messages.subtitle || "We're resolving this for you."}</p>
			</div>
		`;

		container.appendChild(errorDisplay);
		return container.outerHTML;
	}

	_generateInsurancePlansErrorResultsHTML(resultData, resultUrl) {
		const messages = this.quizData.ui?.resultMessages?.insurancePlansError || {};
		const error = resultData.error || {};
		const errorCode = error.code || resultData.stediErrorCode || "Unknown";
		const userMessage = resultData.userMessage || error.message || "There was an issue with your insurance information.";
		const actionTitle = error.actionTitle || "Insurance Information Review";
		const canRetry = error.canRetry || false;

		return `
			<div class="quiz-results-container">
				<div class="quiz-results-header">
					<h2 class="quiz-results-title">${messages.title || "Insurance Information Review"}</h2>
					<p class="quiz-results-subtitle">${messages.subtitle || "Let's verify your details."}</p>
				</div>
				<div class="quiz-coverage-card" style="border-left: 4px solid #ed8936; background-color: #fffaf0;">
					<h3 class="quiz-coverage-card-title" style="color: #c05621;">📋 ${actionTitle}</h3>
					<p style="color: #c05621;">${userMessage}</p>
					${errorCode !== "Unknown" ? `<p style="color: #c05621; font-size: 0.9em; margin-top: 8px;">Error Code: ${errorCode}</p>` : ""}
					${error.detailedDescription ? `<p style="color: #c05621; font-size: 0.85em; margin-top: 4px;">${error.detailedDescription}</p>` : ""}
				</div>
				<div class="quiz-action-section">
					<div class="quiz-action-content">
						<div class="quiz-action-header">
							<h3 class="quiz-action-title">${canRetry ? "Verification Options" : "Next Steps"}</h3>
						</div>
						<div class="quiz-action-details">
							<div class="quiz-action-info">
								<svg class="quiz-action-info-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									<path d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-info-text">${error.actionText || "Please verify your insurance details match your card exactly, or our team can help verify your coverage manually."}</div>
							</div>
							<div class="quiz-action-feature">
								<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M18.3333 14.1667C18.3333 15.0871 17.5871 15.8333 16.6667 15.8333H5.83333L1.66666 20V3.33333C1.66666 2.41286 2.41285 1.66667 3.33333 1.66667H16.6667C17.5871 1.66667 18.3333 2.41286 18.3333 3.33333V14.1667Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-feature-text">${canRetry ? "Double-check your information matches your insurance card exactly" : "Our team will verify your insurance information manually"}</div>
							</div>
							<div class="quiz-action-feature">
								<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M6.66666 2.5V5.83333M13.3333 2.5V5.83333M2.5 9.16667H17.5M4.16666 3.33333H15.8333C16.7538 3.33333 17.5 4.07952 17.5 5V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16666C3.24619 18.3333 2.5 17.5871 2.5 16.6667V5C2.5 4.07952 3.24619 3.33333 4.16666 3.33333Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-feature-text">Get accurate coverage details for your plan</div>
							</div>
						</div>
						<a href="${resultUrl}" class="quiz-booking-button">Continue with Verification</a>
					</div>
				</div>
			</div>
		`;
	}

	_generateProcessingInsuranceResultsHTML(resultData, resultUrl) {
		// Use Web Component if available, otherwise fallback to legacy HTML
		if (this.webComponentsInit && this.webComponentsInit.isInitialized()) {
			const resultCard = document.createElement("quiz-result-card");
			resultCard.setAttribute("result-type", "processing");
			resultCard.setAttribute("result-data", JSON.stringify(resultData));
			resultCard.setAttribute("result-url", resultUrl);
			return resultCard.outerHTML;
		}

		// Legacy fallback HTML (original implementation)
		const messages = this.quizData.ui?.resultMessages?.processing || {};
		const userMessage =
			resultData.userMessage ||
			"Your eligibility check and account setup is still processing in the background. This can take up to 3 minutes for complex insurance verifications and account creation. Please proceed with booking - we'll contact you with your coverage details shortly.";

		return `
			<div class="quiz-results-container">
				<div class="quiz-results-header">
					<h2 class="quiz-results-title">${messages.title || "Thanks for completing the quiz!"}</h2>
					<p class="quiz-results-subtitle">${messages.subtitle || "We're processing your information."}</p>
				</div>
				<div class="quiz-coverage-card" style="border-left: 4px solid #3182ce; background-color: #ebf8ff;">
					<h3 class="quiz-coverage-card-title" style="color: #2c5282;">⏳ Processing Your Information</h3>
					<p style="color: #2c5282;">${userMessage}</p>
				</div>
				<div class="quiz-action-section">
					<div class="quiz-action-content">
						<div class="quiz-action-header">
							<h3 class="quiz-action-title">What's happening now?</h3>
						</div>
						<div class="quiz-action-details">
							<div class="quiz-action-info">
								<svg class="quiz-action-info-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									<path d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-info-text">We're verifying your insurance coverage and setting up your account in the background.</div>
							</div>
							<div class="quiz-action-feature">
								<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M18.3333 14.1667C18.3333 15.0871 17.5871 15.8333 16.6667 15.8333H5.83333L1.66666 20V3.33333C1.66666 2.41286 2.41285 1.66667 3.33333 1.66667H16.6667C17.5871 1.66667 18.3333 2.41286 18.3333 3.33333V14.1667Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-feature-text">You'll receive an update with your coverage details shortly</div>
							</div>
							<div class="quiz-action-feature">
								<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M6.66666 2.5V5.83333M13.3333 2.5V5.83333M2.5 9.16667H17.5M4.16666 3.33333H15.8333C16.7538 3.33333 17.5 4.07952 17.5 5V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16666C3.24619 18.3333 2.5 17.5871 2.5 16.6667V5C2.5 4.07952 3.24619 3.33333 4.16666 3.33333Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-feature-text">You can proceed with booking while we complete the verification</div>
							</div>
						</div>
						<a href="${resultUrl}" class="quiz-booking-button">Continue to Booking</a>
					</div>
				</div>
			</div>
		`;
	}

	_generateIneligibleInsuranceResultsHTML(eligibilityData, resultUrl) {
		// Use Web Component if available, otherwise fallback to legacy HTML
		if (this.webComponentsInit && this.webComponentsInit.isInitialized()) {
			const resultCard = document.createElement("quiz-result-card");
			resultCard.setAttribute("result-type", "ineligible");
			resultCard.setAttribute("result-data", JSON.stringify(eligibilityData));
			resultCard.setAttribute("result-url", resultUrl);
			return resultCard.outerHTML;
		}

		// Legacy fallback HTML (original implementation)
		const messages = this.quizData.ui?.resultMessages?.notEligible || {};
		const userMessage = eligibilityData.userMessage || "Your eligibility check is complete.";
		const error = eligibilityData.error || {};
		const errorCode = error.code || "Unknown";
		const errorMessage = error.message || "";
		const errorDetails = error.details || "";

		// Check if this is actually an error scenario that needs detailed display
		const hasDetailedError = error.code || error.message || error.details;
		const isErrorScenario = eligibilityData.eligibilityStatus === "PAYER_ERROR" || hasDetailedError;

		// Generate detailed error information if available
		const errorDetailsHTML = hasDetailedError ? this._generateErrorDetailsHTML(error, errorCode, errorMessage, errorDetails, false) : "";

		return `
			<div class="quiz-results-container">
				<div class="quiz-results-header">
                    <h2 class="quiz-results-title">${messages.title || "Thanks for completing the quiz!"}</h2>
                    <p class="quiz-results-subtitle">${messages.subtitle || "We're ready to help you."}</p>
				</div>
                <div class="quiz-coverage-card ${isErrorScenario ? "quiz-error-card" : ""}">
                    <h3 class="quiz-coverage-card-title ${isErrorScenario ? "quiz-error-card-title" : ""}">${isErrorScenario ? "⚠️ " : ""}Insurance Coverage Check${errorCode !== "Unknown" ? ` (Error ${errorCode})` : ""}</h3>

					${
						isErrorScenario && errorMessage
							? `
						<div class="quiz-error-main-message">
							<p class="quiz-error-primary-text">${errorMessage}</p>
							<p class="quiz-error-secondary-text">${userMessage}</p>
						</div>
						${errorDetailsHTML}
					`
							: `<p>${userMessage}</p>`
					}
				</div>
				<div class="quiz-action-section">
					<div class="quiz-action-content">
						<div class="quiz-action-header">
							<h3 class="quiz-action-title">What's next?</h3>
						</div>
						<div class="quiz-action-details">
							<div class="quiz-action-info">
								<svg class="quiz-action-info-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									<path d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-info-text">We'll help you connect with a registered dietitian and explore your options for coverage and consultation.</div>
							</div>
							<div class="quiz-action-feature">
								<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M18.3333 14.1667C18.3333 15.0871 17.5871 15.8333 16.6667 15.8333H5.83333L1.66666 20V3.33333C1.66666 2.41286 2.41285 1.66667 3.33333 1.66667H16.6667C17.5871 1.66667 18.3333 2.41286 18.3333 3.33333V14.1667Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-feature-text">Personal consultation to review your coverage options</div>
							</div>
							<div class="quiz-action-feature">
								<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M6.66666 2.5V5.83333M13.3333 2.5V5.83333M2.5 9.16667H17.5M4.16666 3.33333H15.8333C16.7538 3.33333 17.5 4.07952 17.5 5V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16666C3.24619 18.3333 2.5 17.5871 2.5 16.6667V5C2.5 4.07952 3.24619 3.33333 4.16666 3.33333Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-feature-text">Flexible scheduling that works with your availability</div>
							</div>
						</div>
						<a href="${resultUrl}" class="quiz-booking-button">Continue with Next Steps</a>
					</div>
				</div>
			</div>
		`;
	}

	_generateErrorDetailsHTML(error, errorCode, errorMessage, errorDetails, hasMultipleErrors) {
		let detailsHTML = "";

		// Add technical details if available
		if (errorDetails && errorDetails !== errorMessage) {
			detailsHTML += `
				<div class="quiz-error-technical-section">
					<p class="quiz-error-section-title"><strong>Technical Details:</strong></p>
					<p class="quiz-error-details-text">${errorDetails}</p>
				</div>
			`;
		}

		// Add error metadata if available
		const metadata = [];
		if (error.isAAAError) metadata.push("Verification Issue");
		if (hasMultipleErrors) metadata.push(`Multiple Issues (${error.totalErrors})`);
		if (errorCode && errorCode !== "Unknown") metadata.push(`Error Code: ${errorCode}`);

		if (metadata.length > 0) {
			detailsHTML += `
				<div class="quiz-error-metadata-section">
					<p class="quiz-error-section-title"><strong>Issue Details:</strong></p>
					<div class="quiz-error-metadata-badges">
						${metadata.map(item => `<span class="quiz-error-badge">${item}</span>`).join("")}
					</div>
				</div>
			`;
		}

		// Add specific guidance based on error code
		const guidance = this._getErrorGuidance(errorCode);
		if (guidance) {
			detailsHTML += `
				<div class="quiz-error-guidance-section">
					<p class="quiz-error-section-title"><strong>What This Means:</strong></p>
					<p class="quiz-error-guidance-text">${guidance}</p>
				</div>
			`;
		}

		return detailsHTML;
	}

	_getErrorTitle(errorCode) {
		const errorTitles = {
			42: "Service Temporarily Unavailable",
			43: "Provider Registration Issue",
			72: "Member ID Verification Needed",
			73: "Name Verification Needed",
			75: "Subscriber Not Found",
			76: "Duplicate Member ID Found",
			79: "System Connection Issue"
		};

		return errorTitles[errorCode] || "Insurance Verification Issue";
	}

	_getErrorGuidance(errorCode) {
		const errorGuidance = {
			42: "Your insurance company's system is temporarily down for maintenance. This is usually resolved within a few hours.",
			43: "Your insurance plan requires our provider to be specifically registered. We'll handle this registration process for you.",
			72: "The member ID entered doesn't match records. Please verify the ID exactly as shown on your insurance card, including any letters or special characters.",
			73: "The name entered doesn't match your insurance records. Make sure the name matches exactly as it appears on your insurance card.",
			75: "Your insurance information wasn't found in the system. This could be due to a recent plan change, new enrollment, or data sync delay.",
			76: "Your member ID appears multiple times in the insurance database. This often happens when you have multiple plan types or recent changes. Our team will identify your current active plan.",
			79: "There's a temporary technical issue connecting with your insurance provider's verification system. This is typically resolved quickly."
		};

		return errorGuidance[errorCode] || null;
	}

	_generateFAQHTML() {
		const defaultFAQData = [
			{
				id: "credit-card",
				question: "Why do I need to provide my credit card?",
				answer:
					"You'll be able to attend your consultation right away, while the co-pay will be charged later, only after your insurance is billed. We require your card for this purpose. If you cancel or reschedule with less than 24 hours' notice, or miss your appointment, your card will be charged the full consultation fee."
			},
			{
				id: "coverage-change",
				question: "Can my coverage or co-pay change after booking?",
				answer:
					"Your coverage details are verified at the time of booking. However, insurance benefits can change due to plan updates, deductible changes, or other factors. We'll always verify your current benefits before each appointment and notify you of any changes."
			}
		];

		const faqData = this.quizData.ui?.faq || defaultFAQData;
		if (faqData.length === 0) return "";

		// Use Web Component if available, otherwise fallback to legacy HTML
		if (this.webComponentsInit && this.webComponentsInit.isInitialized()) {
			const faqComponent = document.createElement("quiz-faq-section");
			faqComponent.setAttribute("faq-data", JSON.stringify(faqData));
			return faqComponent.outerHTML;
		}

		// Legacy fallback HTML (original implementation)
		return `
			<div class="quiz-faq-section">
				<div class="quiz-faq-divider"></div>
                ${faqData
									.map(
										faq => `
                    <div class="quiz-faq-item" data-faq="${faq.id}" tabindex="0" role="button" aria-expanded="false">
					<div class="quiz-faq-content">
                            <div class="quiz-faq-question-collapsed">${faq.question}</div>
                            <div class="quiz-faq-answer">${faq.answer}</div>
					</div>
					<div class="quiz-faq-toggle">
                            <svg class="quiz-faq-toggle-icon" width="32" height="32" viewBox="0 0 32 32" fill="none">
							<path d="M4 16H28" stroke="#4f4f4f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M16 4V28" stroke="#4f4f4f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</div>
				</div>
				<div class="quiz-faq-divider"></div>
                `
									)
									.join("")}
			</div>
		`;
	}

	_attachFAQListeners() {
		// Check if Web Component is being used
		const webComponent = this.questionContainer.querySelector("quiz-faq-section");

		if (webComponent) {
			// Web Component handles its own events, no additional listeners needed
			console.log("FAQ Web Component detected, using built-in event handling");
		} else {
			// Legacy HTML handling
			const faqItems = this.questionContainer.querySelectorAll(".quiz-faq-item");
			faqItems.forEach(item => {
				item.addEventListener("click", () => {
					const isExpanded = item.classList.contains("expanded");

					// Toggle expanded state immediately for smooth animation
					if (!isExpanded) {
						item.classList.add("expanded");
						const question = item.querySelector(".quiz-faq-question, .quiz-faq-question-collapsed");
						if (question) question.className = "quiz-faq-question";
					} else {
						item.classList.remove("expanded");
						const question = item.querySelector(".quiz-faq-question, .quiz-faq-question-collapsed");
						if (question) question.className = "quiz-faq-question-collapsed";
					}
				});
			});
		}
	}

	_attachBookingButtonListeners() {
		const bookingButtons = this.questionContainer.querySelectorAll(".quiz-booking-button");
		bookingButtons.forEach(button => {
			button.addEventListener("click", this._handleBookingButtonClick.bind(this));
		});
	}

	async _handleBookingButtonClick(event) {
		event.preventDefault();
		const button = event.currentTarget;

		console.log("Booking button clicked");

		// Show loading state
		this._showBookingLoadingState(button);

		try {
			// Debug: Log all data attributes on the container
			console.log("Container data attributes:", {
				orchestratorUrl: this.container.getAttribute("data-orchestrator-url"),
				statusPollingUrl: this.container.getAttribute("data-status-polling-url"),
				schedulingUrl: this.container.getAttribute("data-scheduling-url"),
				resultUrl: this.container.getAttribute("data-result-url"),
				quizUrl: this.container.getAttribute("data-quiz-url")
			});

			// Get scheduling URL with fallback
			const schedulingUrl = this.container.getAttribute("data-scheduling-url") || "https://us-central1-telemedicine-458913.cloudfunctions.net/workflow_scheduling";

			// Handle empty string case
			const finalSchedulingUrl = schedulingUrl.trim() || "https://us-central1-telemedicine-458913.cloudfunctions.net/workflow_scheduling";

			console.log("Using scheduling URL:", finalSchedulingUrl);

			// Trigger scheduling workflow
			const schedulingResult = await this._triggerSchedulingWorkflow(finalSchedulingUrl);

			// Show scheduling results
			this._showSchedulingResults(schedulingResult);
		} catch (error) {
			console.error("Scheduling error:", error);

			// Test mode error notification
			if (this.isTestMode) {
				this._showBackgroundProcessNotification(
					`
					🧪 TEST MODE - Scheduling Error<br>
					❌ ${error.message}<br>
					• Check console for details
				`,
					"error"
				);
			}

			this._showSchedulingError(error.message);
		}
	}

	_showBookingLoadingState(button) {
		// Store original button content
		if (!button.dataset.originalContent) {
			button.dataset.originalContent = button.innerHTML;
		}

		// Show loading state
		button.innerHTML = `
			<div class="quiz-spinner" style="width: 20px; height: 20px; margin-right: 8px;"></div>
			Setting up your appointment...
		`;
		button.disabled = true;
		button.style.cursor = "not-allowed";
	}

	async _triggerSchedulingWorkflow(schedulingUrl) {
		console.log("Triggering scheduling workflow...");

		// Extract all required data
		const extractedData = this._extractResponseData(this.isTestMode);
		const payload = this._buildSchedulingPayload(extractedData);

		console.log("Scheduling payload:", payload);

		// Test mode notification
		if (this.isTestMode) {
			this._showBackgroundProcessNotification(
				`
				🧪 TEST MODE - Scheduling Request<br>
				• URL: ${schedulingUrl}<br>
				• Required fields: ${Object.keys(payload)
					.filter(k => k !== "allResponses")
					.join(", ")}<br>
				• Address: ${payload.address || "❌ Missing"}<br>
				• City: ${payload.city || "❌ Missing"}<br>
				• ZIP: ${payload.zip || "❌ Missing"}<br>
				• Sex: ${payload.sex || "❌ Missing"}
			`,
				"info"
			);
		}

		const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Scheduling request timed out")), 45000));

		const fetchPromise = fetch(schedulingUrl, {
			method: "POST",
			mode: "cors",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				"X-Workflow-Type": "scheduling"
			},
			body: JSON.stringify(payload)
		});

		const response = await Promise.race([fetchPromise, timeoutPromise]);

		console.log("Raw scheduling response:", {
			ok: response.ok,
			status: response.status,
			statusText: response.statusText
		});

		if (response.ok) {
			const result = await response.json();
			console.log("Parsed scheduling response:", result);

			// Test mode response notification
			if (this.isTestMode) {
				const schedulingData = result?.schedulingData;
				const workflowSuccess = result?.success;
				const schedulingSuccess = schedulingData?.success;

				this._showBackgroundProcessNotification(
					`
					🧪 TEST MODE - Scheduling Response<br>
					• HTTP Status: ${response.status} ${response.statusText}<br>
					• Workflow Success: ${workflowSuccess}<br>
					• Scheduling Success: ${schedulingSuccess}<br>
					• Scheduling Status: ${schedulingData?.status || "Unknown"}<br>
					• Has Schedule Link: ${!!schedulingData?.scheduleLink}<br>
					• Message: ${schedulingData?.message || "No message"}<br>
					• Error: ${schedulingData?.error || "None"}
				`,
					schedulingSuccess ? "success" : "error"
				);
			}

			return result;
		} else {
			const errorText = await response.text();
			throw new Error(`HTTP ${response.status}: ${errorText}`);
		}
	}

	_buildSchedulingPayload(extractedData = null) {
		const data = extractedData || this._extractResponseData();

		return {
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

	get isTestMode() {
		const testParam = new URLSearchParams(window.location.search).get("test");
		return testParam !== null && testParam !== "false";
	}

	// Debug method to manually test the enhanced notification system

	// =======================================================================
	// Enhanced Notification System for Workflow Reporting
	// =======================================================================

	/**
	 * Enhanced notification system for better workflow reporting
	 */
	_showWorkflowNotification(message, type = "info", priority = null, details = null) {
		if (!this.notificationManager) {
			console.warn("Notification manager not available");
			return;
		}

		// Build detailed message with context
		let fullMessage = message;
		if (details) {
			if (typeof details === "object") {
				// Create structured details
				const detailParts = [];
				if (details.step) detailParts.push(`Step: ${details.step}`);
				if (details.duration) detailParts.push(`Duration: ${details.duration}`);
				if (details.status) detailParts.push(`Status: ${details.status}`);
				if (details.data) detailParts.push(`Data: ${JSON.stringify(details.data, null, 2)}`);
				if (details.error) detailParts.push(`Error: ${details.error}`);
				if (details.url) detailParts.push(`URL: ${details.url}`);

				if (detailParts.length > 0) {
					fullMessage += `<br><strong>Details:</strong><br>${detailParts.join("<br>")}`;
				}
			} else {
				fullMessage += `<br><strong>Details:</strong> ${details}`;
			}
		}

		return this.notificationManager.show(fullMessage, type, priority);
	}

	/**
	 * Show workflow stage notification with proper colors and context
	 */
	_reportWorkflowStage(stage, status, details = null) {
		const stageConfig = {
			// Initialization stages
			WORKFLOW_INIT: {
				type: "info",
				priority: "info",
				emoji: "🚀",
				title: "Workflow Initialized"
			},
			PAYLOAD_BUILT: {
				type: "info",
				priority: "info",
				emoji: "📦",
				title: "Request Data Prepared"
			},

			// Network stages
			ORCHESTRATOR_CALL: {
				type: "info",
				priority: "info",
				emoji: "📡",
				title: "Contacting Workflow Service"
			},
			ORCHESTRATOR_SUCCESS: {
				type: "success",
				priority: "success",
				emoji: "✓",
				title: "Workflow Service Connected"
			},
			ORCHESTRATOR_ERROR: {
				type: "error",
				priority: "error",
				emoji: "❌",
				title: "Workflow Service Connection Failed"
			},

			// Status polling stages
			POLLING_START: {
				type: "info",
				priority: "info",
				emoji: "⏱️",
				title: "Status Tracking Started"
			},
			POLLING_UPDATE: {
				type: "info",
				priority: "info",
				emoji: "🔄",
				title: "Progress Update"
			},
			POLLING_WARNING: {
				type: "warning",
				priority: "warning",
				emoji: "⚠️",
				title: "Polling Warning"
			},
			POLLING_ERROR: {
				type: "error",
				priority: "error",
				emoji: "🚨",
				title: "Status Polling Error"
			},

			// Eligibility stages
			ELIGIBILITY_START: {
				type: "info",
				priority: "info",
				emoji: "🏥",
				title: "Insurance Check Starting"
			},
			ELIGIBILITY_SUCCESS: {
				type: "success",
				priority: "success",
				emoji: "✅",
				title: "Insurance Verified Successfully"
			},
			ELIGIBILITY_ERROR: {
				type: "error",
				priority: "error",
				emoji: "⛔",
				title: "Insurance Verification Failed"
			},
			ELIGIBILITY_TIMEOUT: {
				type: "warning",
				priority: "warning",
				emoji: "⏰",
				title: "Insurance Check Timeout"
			},

			// User creation stages
			USER_CREATION_START: {
				type: "info",
				priority: "info",
				emoji: "👤",
				title: "Creating User Account"
			},
			USER_CREATION_SUCCESS: {
				type: "success",
				priority: "success",
				emoji: "✅",
				title: "User Account Created"
			},
			USER_CREATION_ERROR: {
				type: "error",
				priority: "error",
				emoji: "❌",
				title: "User Creation Failed"
			},

			// Scheduling stages
			SCHEDULING_START: {
				type: "info",
				priority: "info",
				emoji: "📅",
				title: "Scheduling Appointment"
			},
			SCHEDULING_SUCCESS: {
				type: "success",
				priority: "success",
				emoji: "🎉",
				title: "Appointment Scheduled"
			},
			SCHEDULING_ERROR: {
				type: "error",
				priority: "error",
				emoji: "❌",
				title: "Scheduling Failed"
			},

			// Completion stages
			WORKFLOW_COMPLETE: {
				type: "success",
				priority: "success",
				emoji: "🏁",
				title: "Workflow Complete"
			},
			WORKFLOW_FAILED: {
				type: "error",
				priority: "error",
				emoji: "💥",
				title: "Workflow Failed"
			}
		};

		const config = stageConfig[stage];
		if (!config) {
			console.warn(`Unknown workflow stage: ${stage}`);
			return;
		}

		// Build comprehensive message
		let message = `${config.emoji} ${config.title}`;
		if (status) {
			message += ` - ${status}`;
		}

		// Show notification with proper type and priority
		return this._showWorkflowNotification(message, config.type, config.priority, details);
	}

	/**
	 * Enhanced error reporting with proper types and detailed context
	 */
	_reportWorkflowError(error, context = {}) {
		let errorType = "error";
		let priority = "error";
		let emoji = "❌";
		let title = "Workflow Error";

		// Determine error severity and type
		if (error.message?.includes("timeout") || error.code === "ECONNABORTED") {
			errorType = "warning";
			priority = "warning";
			emoji = "⏰";
			title = "Request Timeout";
		} else if (error.message?.includes("network") || error.message?.includes("fetch")) {
			errorType = "error";
			priority = "error";
			emoji = "🌐";
			title = "Network Error";
		} else if (error.status >= 500) {
			errorType = "error";
			priority = "critical";
			emoji = "🚨";
			title = "Server Error";
		} else if (error.status >= 400 && error.status < 500) {
			errorType = "warning";
			priority = "warning";
			emoji = "⚠️";
			title = "Request Error";
		}

		const errorMessage = error.message || error.error || "Unknown error occurred";
		const message = `${emoji} ${title}: ${errorMessage}`;

		const details = {
			...context,
			status: error.status,
			code: error.code,
			url: error.url,
			timestamp: new Date().toISOString()
		};

		return this._showWorkflowNotification(message, errorType, priority, details);
	}

	_showBackgroundProcessNotification(text, type = "info", priority = null) {
		// Only show notifications if we have a container
		if (!this.questionContainer) {
			return;
		}

		// Delegate completely to the modular notification system
		return this.notificationManager.show(text, type, priority);
	}
}

document.addEventListener("DOMContentLoaded", () => {
	const quiz = new ModularQuiz();
	window.productQuiz = quiz;
});
