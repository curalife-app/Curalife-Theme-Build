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

		// Orchestrator workflow state
		this.orchestratorWorkflowPromise = null;
		this.orchestratorWorkflowResult = null;

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

	// HIPAA COMPLIANCE: This method has been removed to prevent PHI data from being sent directly to eligibility workflow from browser
	// Eligibility checking is now handled server-side within the user creation workflow
	_triggerEligibilityWorkflow() {
		console.warn("⚠️ HIPAA COMPLIANCE: Direct eligibility workflow calls from browser are disabled. Eligibility will be checked server-side.");
		// Show user-friendly notification
		this._showBackgroundProcessNotification("🔒 Insurance verification will be processed securely server-side", "info");
	}

	// =======================================================================
	// Orchestrator Workflow Methods (HIPAA Compliant)
	// =======================================================================

	/**
	 * Starts the orchestrator workflow with status tracking
	 */
	_startOrchestratorWorkflow() {
		const orchestratorUrl = this._getOrchestratorUrl();
		const payload = this._extractResponseData();

		console.log("🚀 Starting orchestrator workflow...", { orchestratorUrl, payload });

		// Show loading state
		this._showLoadingScreen();

		// Store the orchestrator workflow promise for finishQuiz to wait for
		this.orchestratorWorkflowPromise = this._submitOrchestratorToWebhook(orchestratorUrl, payload)
			.then(result => {
				console.log("✅ Orchestrator workflow completed:", result);
				this.orchestratorWorkflowResult = result;
				return result;
			})
			.catch(error => {
				console.error("❌ Orchestrator workflow failed:", error);
				throw error;
			});

		// Don't handle completion here - let finishQuiz handle it
		console.log("🔄 Orchestrator workflow promise stored, finishQuiz will wait for completion");
	}

	_handleWorkflowCompletion(result) {
		console.log("🎉 Workflow completed successfully:", result);

		// Store the result
		this.orchestratorWorkflowResult = result;

		// Stop status polling if it was started
		this._stopStatusPolling();

		// Process the result and show appropriate UI
		const processedResult = this._processWebhookResult(result);
		console.log("📊 Processed workflow result:", processedResult);
	}

	_handleWorkflowError(error) {
		console.error("Handling workflow error:", error);

		// Stop loading messages and status polling
		this._stopLoadingMessages();
		this._stopStatusPolling();

		// Create proper error result data instead of null
		const errorResultData = {
			eligibilityStatus: "ERROR",
			isEligible: false,
			userMessage: error.message || error.error || "There was an error processing your request.",
			error: error
		};

		// Show error results
		this.showResults(
			this.container.getAttribute("data-result-url") || "/quiz-complete",
			false, // webhookSuccess
			errorResultData,
			error.message || error.error || "There was an error processing your request."
		);
	}

	_getOrchestratorUrl() {
		const orchestratorUrl = this.container.getAttribute("data-orchestrator-url");
		if (!orchestratorUrl) {
			console.error("❌ Orchestrator URL not configured");
			throw new Error("Orchestrator URL not configured");
		}
		return orchestratorUrl;
	}

	_startStatusPolling(statusTrackingId) {
		if (!statusTrackingId) {
			console.warn("⚠️ No status tracking ID provided for polling");
			return;
		}

		console.log("🔄 Starting status polling for ID:", statusTrackingId);
		this.statusTrackingId = statusTrackingId;
		this.statusPollingInterval = setInterval(() => {
			this._pollWorkflowStatus();
		}, 2000); // Poll every 2 seconds
	}

	async _pollWorkflowStatus() {
		if (!this.statusTrackingId) {
			console.warn("⚠️ No status tracking ID available for polling");
			this._stopStatusPolling();
			return;
		}

		try {
			const statusUrl = this._getStatusPollingUrl();
			const response = await fetch(statusUrl, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({
					statusTrackingId: this.statusTrackingId
				})
			});

			if (response.ok) {
				const statusData = await response.json();
				console.log("📊 Status update:", statusData);

				this._updateWorkflowStatus(statusData);

				// Check if workflow is complete
				if (statusData.completed) {
					console.log("✅ Workflow completed via status polling");
					this._stopStatusPolling();

					if (statusData.error) {
						this._handleWorkflowError(statusData);
					} else {
						this._handleWorkflowCompletion(statusData);
					}
				}
			} else {
				console.warn("⚠️ Status polling failed:", response.status, response.statusText);
			}
		} catch (error) {
			console.error("❌ Status polling error:", error);
		}
	}

	_updateWorkflowStatus(statusData) {
		// Update loading progress if available
		if (statusData.progress !== undefined) {
			this._updateLoadingProgress(statusData.progress);
		}

		// Update loading message if available
		if (statusData.message) {
			this._updateLoadingStep({
				title: statusData.currentStep || "Processing...",
				description: statusData.message
			});
		}

		// Show test mode notifications
		if (this.isTestMode) {
			this._showBackgroundProcessNotification(
				`🔄 Status Update: ${statusData.currentStep || "Processing"}<br>Progress: ${statusData.progress || 0}%<br>Message: ${statusData.message || "No message"}`,
				statusData.error ? "error" : "info"
			);
		}
	}

	_stopStatusPolling() {
		if (this.statusPollingInterval) {
			clearInterval(this.statusPollingInterval);
			this.statusPollingInterval = null;
			console.log("🛑 Status polling stopped");
		}
	}

	_getStatusPollingUrl() {
		const statusUrl = this.container.getAttribute("data-status-url");
		if (!statusUrl) {
			console.error("❌ Status polling URL not configured");
			throw new Error("Status polling URL not configured");
		}
		return statusUrl;
	}

	_updateLoadingProgress(progress) {
		// Update any progress indicators
		const progressElements = document.querySelectorAll(".quiz-loading-progress");
		progressElements.forEach(element => {
			element.style.width = `${progress}%`;
		});
	}

	/**
	 * Extracts response data for the orchestrator workflow
	 */
	_extractResponseData(showNotifications = false) {
		const data = {
			timestamp: Date.now(),
			hasInsurance: this._hasInsurance(),
			customerEmail: this._getResponseValue("customer_email"),
			firstName: this._getResponseValue("first_name"),
			lastName: this._getResponseValue("last_name"),
			phoneNumber: this._getResponseValue("phone_number"),
			dateOfBirth: this._getResponseValue("date_of_birth"),
			state: this._getResponseValue("state"),
			address: this._getResponseValue("address"),
			city: this._getResponseValue("city"),
			zip: this._getResponseValue("zip"),
			sex: this._getResponseValue("sex"),
			insurance: this._getResponseValue("insurance"),
			insuranceMemberId: this._getResponseValue("insurance_member_id"),
			groupNumber: this._getResponseValue("group_number"),
			mainReasons: this._getResponseValue("main_reasons"),
			medicalConditions: this._getResponseValue("medical_conditions"),
			allResponses: this.responses
		};

		if (showNotifications && this.isTestMode) {
			this._showBackgroundProcessNotification(
				`🔍 Extracted Data:<br>• Email: ${data.customerEmail}<br>• Name: ${data.firstName} ${data.lastName}<br>• Insurance: ${data.insurance}<br>• Has Insurance: ${data.hasInsurance}`,
				"info"
			);
		}

		return data;
	}

	async _submitOrchestratorToWebhook(url, payload) {
		console.log("📤 Submitting to orchestrator workflow:", { url, payload });

		const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Orchestrator request timed out")), 60000));

		const fetchPromise = fetch(url, {
			method: "POST",
			mode: "cors",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				"X-Workflow-Type": "orchestrator"
			},
			body: JSON.stringify(payload)
		});

		const response = await Promise.race([fetchPromise, timeoutPromise]);

		if (response.ok) {
			const result = await response.json();
			console.log("✅ Orchestrator response received:", result);

			// Start status polling if statusTrackingId is provided
			if (result.statusTrackingId) {
				this._startStatusPolling(result.statusTrackingId);
			}

			return result;
		} else {
			const errorText = await response.text();
			throw new Error(`HTTP ${response.status}: ${errorText}`);
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

			// Check if orchestrator workflow is complete
			let orchestratorResult = null;
			if (this.orchestratorWorkflowPromise) {
				if (this.orchestratorWorkflowResult) {
					// Already completed
					orchestratorResult = this.orchestratorWorkflowResult;
					console.log("Using cached orchestrator result:", orchestratorResult);
				} else {
					// Still running - wait for it
					try {
						console.log("⏳ Waiting for orchestrator workflow to complete...");
						orchestratorResult = await this.orchestratorWorkflowPromise;
						console.log("✅ Orchestrator workflow completed:", orchestratorResult);
					} catch (error) {
						console.error("❌ Orchestrator workflow failed:", error);
						orchestratorResult = this._createErrorEligibilityData("Orchestrator workflow failed");
					}
				}
			} else {
				// No orchestrator workflow was triggered - use default processing status
				orchestratorResult = this._createProcessingEligibilityData();
				console.log("No orchestrator workflow, using processing status");
			}

			// Process the result consistently
			let finalResult;
			if (orchestratorResult) {
				// Check if this is already processed eligibility data or a raw webhook response
				if (orchestratorResult.eligibilityStatus && typeof orchestratorResult.eligibilityStatus === "string") {
					// This is already processed eligibility data - use it directly
					finalResult = orchestratorResult;
					console.log("Using orchestrator result directly (already processed):", finalResult);
				} else {
					// This is a raw webhook response - process it
					finalResult = this._processWebhookResult(orchestratorResult);
					console.log("Processed webhook result:", finalResult);
				}
			} else {
				// No orchestrator workflow was run - use default processing status
				finalResult = this._createProcessingEligibilityData();
				console.log("No orchestrator result, using processing status");
			}

			console.log("Processing orchestrator result in finishQuiz:", {
				orchestratorResult: finalResult,
				hasError: !!finalResult?.error,
				status: finalResult?.eligibilityStatus,
				isEligible: finalResult?.isEligible
			});

			// Test mode comprehensive finish notification
			if (this.isTestMode) {
				const workflowStatus = this.orchestratorWorkflowPromise ? (this.orchestratorWorkflowResult ? "✅ Completed" : "⏳ In Progress") : "❌ Not Started";

				const userCreationStatus = this.userCreationWorkflowPromise ? "✅ Started" : "❌ Not Started";

				this._showBackgroundProcessNotification(
					`
					🧪 TEST MODE - Quiz Completion Status<br>
					• Orchestrator Workflow: ${workflowStatus}<br>
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

		console.log("Processing eligibility status:", eligibilityStatus, "isEligible:", isEligible, "raw isEligible:", resultData.isEligible);

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

	_generateProcessingInsuranceResultsHTML(resultData, resultUrl) {
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

	_generateEligibleInsuranceResultsHTML(eligibilityData, resultUrl) {
		const messages = this.quizData.ui?.resultMessages?.eligible || {};
		const userMessage = eligibilityData.userMessage || "Great news! You're eligible for dietitian sessions.";
		const sessionsCovered = eligibilityData.sessionsCovered || 0;
		const deductible = eligibilityData.deductible?.individual || 0;

		return `
			<div class="quiz-results-container">
				<div class="quiz-results-header">
					<h2 class="quiz-results-title">${messages.title || "🎉 You're Covered!"}</h2>
					<p class="quiz-results-subtitle">${messages.subtitle || "Your insurance covers dietitian sessions."}</p>
				</div>
				<div class="quiz-coverage-card" style="border-left: 4px solid #48bb78; background-color: #f0fff4;">
					<h3 class="quiz-coverage-card-title" style="color: #2f855a;">✅ Insurance Coverage Confirmed</h3>
					<p style="color: #2f855a;">${userMessage}</p>
					${sessionsCovered > 0 ? `<p style="color: #2f855a; margin-top: 8px;"><strong>Sessions Covered:</strong> ${sessionsCovered}</p>` : ""}
					${deductible > 0 ? `<p style="color: #2f855a; margin-top: 4px;"><strong>Deductible:</strong> $${deductible}</p>` : ""}
				</div>
				<div class="quiz-action-section">
					<div class="quiz-action-content">
						<div class="quiz-action-header">
							<h3 class="quiz-action-title">Ready to Schedule?</h3>
						</div>
						<div class="quiz-action-details">
							<div class="quiz-action-info">
								<svg class="quiz-action-info-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									<path d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-info-text">Your insurance covers dietitian consultations. Let's get you connected with a registered dietitian who can help you achieve your health goals.</div>
							</div>
							<div class="quiz-action-feature">
								<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M6.66666 2.5V5.83333M13.3333 2.5V5.83333M2.5 9.16667H17.5M4.16666 3.33333H15.8333C16.7538 3.33333 17.5 4.07952 17.5 5V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16666C3.24619 18.3333 2.5 17.5871 2.5 16.6667V5C2.5 4.07952 3.24619 3.33333 4.16666 3.33333Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-feature-text">Schedule your first consultation at no cost to you</div>
							</div>
							<div class="quiz-action-feature">
								<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M18.3333 14.1667C18.3333 15.0871 17.5871 15.8333 16.6667 15.8333H5.83333L1.66666 20V3.33333C1.66666 2.41286 2.41285 1.66667 3.33333 1.66667H16.6667C17.5871 1.66667 18.3333 2.41286 18.3333 3.33333V14.1667Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-feature-text">Get personalized nutrition guidance from certified professionals</div>
							</div>
						</div>
						<a href="${resultUrl}" class="quiz-booking-button">Schedule Your Appointment</a>
					</div>
				</div>
			</div>
		`;
	}

	_generateNotCoveredInsuranceResultsHTML(eligibilityData, resultUrl) {
		const messages = this.quizData.ui?.resultMessages?.notCovered || {};
		const userMessage = eligibilityData.userMessage || "Your current insurance plan doesn't cover dietitian sessions, but we have other options.";

		return `
			<div class="quiz-results-container">
				<div class="quiz-results-header">
					<h2 class="quiz-results-title">${messages.title || "Thanks for completing the quiz!"}</h2>
					<p class="quiz-results-subtitle">${messages.subtitle || "We're here to help you explore your options."}</p>
				</div>
				<div class="quiz-coverage-card" style="border-left: 4px solid #ed8936; background-color: #fffaf0;">
					<h3 class="quiz-coverage-card-title" style="color: #c05621;">ℹ️ Insurance Coverage Status</h3>
					<p style="color: #c05621;">${userMessage}</p>
				</div>
				<div class="quiz-action-section">
					<div class="quiz-action-content">
						<div class="quiz-action-header">
							<h3 class="quiz-action-title">Alternative Options Available</h3>
						</div>
						<div class="quiz-action-details">
							<div class="quiz-action-info">
								<svg class="quiz-action-info-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									<path d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-info-text">Don't worry! We offer affordable self-pay options and can help you explore other coverage possibilities.</div>
							</div>
							<div class="quiz-action-feature">
								<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M2.5 7.5L10 12.5L17.5 7.5" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									<path d="M2.5 7.5H17.5V15C17.5 15.442 17.324 15.866 17.012 16.1785C16.699 16.491 16.275 16.6667 15.833 16.6667H4.167C3.725 16.6667 3.301 16.491 2.988 16.1785C2.676 15.866 2.5 15.442 2.5 15V7.5Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-feature-text">Competitive self-pay rates for nutrition consultations</div>
							</div>
							<div class="quiz-action-feature">
								<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M18.3333 14.1667C18.3333 15.0871 17.5871 15.8333 16.6667 15.8333H5.83333L1.66666 20V3.33333C1.66666 2.41286 2.41285 1.66667 3.33333 1.66667H16.6667C17.5871 1.66667 18.3333 2.41286 18.3333 3.33333V14.1667Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-feature-text">Personal consultation to review all your options</div>
							</div>
						</div>
						<a href="${resultUrl}" class="quiz-booking-button">Explore Your Options</a>
					</div>
				</div>
			</div>
		`;
	}

	_generateAAAErrorResultsHTML(eligibilityData, resultUrl) {
		const error = eligibilityData.error || {};
		const errorCode = error.code || eligibilityData.aaaErrorCode || "Unknown";
		const userMessage = eligibilityData.userMessage || error.message || "There was an issue verifying your insurance coverage.";
		const errorTitle = error.title || this._getErrorTitle(errorCode);
		const actionTitle = error.actionTitle || "Manual Verification";
		const actionText = error.actionText || "Our team will verify your coverage manually and contact you with results.";

		return `
			<div class="quiz-results-container">
				<div class="quiz-results-header">
					<h2 class="quiz-results-title">Thanks for completing the quiz!</h2>
					<p class="quiz-results-subtitle">We're processing your insurance verification.</p>
				</div>
				<div class="quiz-coverage-card" style="border-left: 4px solid #f56565; background-color: #fed7d7;">
					<h3 class="quiz-coverage-card-title" style="color: #c53030;">⚠️ ${errorTitle}</h3>
					<p style="color: #c53030;">${userMessage}</p>
				</div>
				<div class="quiz-action-section">
					<div class="quiz-action-content">
						<div class="quiz-action-header">
							<h3 class="quiz-action-title">${actionTitle}</h3>
						</div>
						<div class="quiz-action-details">
							<div class="quiz-action-info">
								<svg class="quiz-action-info-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
									<path d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-info-text">${actionText}</div>
							</div>
							<div class="quiz-action-feature">
								<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M18.3333 14.1667C18.3333 15.0871 17.5871 15.8333 16.6667 15.8333H5.83333L1.66666 20V3.33333C1.66666 2.41286 2.41285 1.66667 3.33333 1.66667H16.6667C17.5871 1.66667 18.3333 2.41286 18.3333 3.33333V14.1667Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-feature-text">Personal assistance to resolve verification issues</div>
							</div>
							<div class="quiz-action-feature">
								<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M6.66666 2.5V5.83333M13.3333 2.5V5.83333M2.5 9.16667H17.5M4.16666 3.33333H15.8333C16.7538 3.33333 17.5 4.07952 17.5 5V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16666C3.24619 18.3333 2.5 17.5871 2.5 16.6667V5C2.5 4.07952 3.24619 3.33333 4.16666 3.33333Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<div class="quiz-action-feature-text">Quick resolution to get you scheduled with a dietitian</div>
							</div>
						</div>
						<a href="${resultUrl}" class="quiz-booking-button">Continue with Support</a>
					</div>
				</div>
			</div>
		`;
	}

	_generateTestDataErrorResultsHTML(eligibilityData, resultUrl) {
		const userMessage = eligibilityData.userMessage || "Test data error encountered during eligibility check.";

		return `
			<div class="quiz-results-container">
				<div class="quiz-results-header">
					<h2 class="quiz-results-title">🧪 Test Mode - Data Error</h2>
					<p class="quiz-results-subtitle">This is a test scenario demonstrating error handling.</p>
				</div>
				<div class="quiz-coverage-card" style="border-left: 4px solid #9f7aea; background-color: #faf5ff;">
					<h3 class="quiz-coverage-card-title" style="color: #6b46c1;">🧪 Test Data Error</h3>
					<p style="color: #6b46c1;">${userMessage}</p>
				</div>
				<div class="quiz-action-section">
					<div class="quiz-action-content">
						<div class="quiz-action-header">
							<h3 class="quiz-action-title">Test Mode Information</h3>
						</div>
						<div class="quiz-action-details">
							<div class="quiz-action-info">
								<div class="quiz-action-info-text">This is a test scenario to demonstrate how the system handles various error conditions. In production, users would receive appropriate support.</div>
							</div>
						</div>
						<a href="${resultUrl}" class="quiz-booking-button">Continue Test</a>
					</div>
				</div>
			</div>
		`;
	}

	_generateIneligibleInsuranceResultsHTML(eligibilityData, resultUrl) {
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
		const faqData = this.quizData.ui?.faq || [];
		if (faqData.length === 0) return "";

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
                            <svg class="quiz-faq-toggle-icon" width="24" height="24" viewBox="0 0 24 24" fill="none">
							<path d="M4 12H20" stroke="#4f4f4f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							<path d="M12 4V20" stroke="#4f4f4f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
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
			// Get scheduling URL
			const schedulingUrl = this.container.getAttribute("data-scheduling-url");
			if (!schedulingUrl) {
				throw new Error("Scheduling URL not configured");
			}

			// Trigger scheduling workflow
			const schedulingResult = await this._triggerSchedulingWorkflow(schedulingUrl);

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

	// =======================================================================
	// Utility Methods for Data Extraction
	// =======================================================================

	_hasInsurance() {
		const insuranceResponse = this._getResponseValue("insurance");
		return insuranceResponse && insuranceResponse !== "no" && insuranceResponse !== "none";
	}

	_getResponseValue(questionId) {
		const response = this.responses.find(r => r.questionId === questionId);
		return response ? response.answer : null;
	}

	// =======================================================================
	// Loading Screen Methods
	// =======================================================================

	_showLoadingScreen() {
		this._toggleElement(this.questions, false);
		this._toggleElement(this.loading, true);
		this._toggleElement(this.navigationButtons, false);
		this._toggleElement(this.progressSection, false);
	}

	_updateLoadingStep(step) {
		// Update loading step display if elements exist
		const loadingTitle = this.loading?.querySelector(".quiz-loading-title");
		const loadingDescription = this.loading?.querySelector(".quiz-loading-description");

		if (loadingTitle && step.title) {
			loadingTitle.textContent = step.title;
		}

		if (loadingDescription && step.description) {
			loadingDescription.textContent = step.description;
		}
	}

	// =======================================================================
	// Background Process Notification Methods
	// =======================================================================

	_showBackgroundProcessNotification(message, type = "info", priority = null) {
		if (this.notificationManager && this.notificationManager.show) {
			return this.notificationManager.show(message, type, priority);
		} else {
			// Fallback for when notification system isn't loaded
			console.log(`📢 Background Process (${type}):`, message.replace(/<br\/?>/g, "\n"));
			return null;
		}
	}

	// =======================================================================
	// Comprehensive Loading Sequence
	// =======================================================================

	async _showComprehensiveLoadingSequence() {
		console.log("🔄 Starting comprehensive loading sequence...");

		// Show initial loading state
		this._showLoadingScreen();

		// Start the orchestrator workflow if not already started
		if (!this.orchestratorWorkflowPromise) {
			console.log("🚀 Starting orchestrator workflow from loading sequence...");
			this._startOrchestratorWorkflow();
		}

		// Show loading messages
		this._startLoadingMessages();

		// Wait a moment for the loading sequence to be visible
		await new Promise(resolve => setTimeout(resolve, 500));

		console.log("✅ Comprehensive loading sequence started");
	}

	_startLoadingMessages() {
		const loadingMessages = [
			{ title: "Processing Your Information", description: "Analyzing your quiz responses..." },
			{ title: "Verifying Insurance Coverage", description: "Checking your eligibility with your insurance provider..." },
			{ title: "Setting Up Your Account", description: "Creating your personalized profile..." },
			{ title: "Finalizing Details", description: "Preparing your results and next steps..." }
		];

		let messageIndex = 0;

		// Show first message immediately
		this._updateLoadingStep(loadingMessages[messageIndex]);

		// Cycle through messages every 3 seconds
		this.loadingInterval = setInterval(() => {
			messageIndex = (messageIndex + 1) % loadingMessages.length;
			this._updateLoadingStep(loadingMessages[messageIndex]);
		}, 3000);
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
