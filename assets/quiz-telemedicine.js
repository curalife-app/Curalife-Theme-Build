/**
 * Telemedicine Workflow Module
 * Handles HIPAA-compliant dietitian workflow orchestration and status polling
 */

export class TelemedicineWorkflow {
	constructor(container, responses) {
		this.container = container;
		this.responses = responses;

		// Workflow state
		this.eligibilityWorkflowPromise = null;
		this.eligibilityWorkflowResult = null;
		this.eligibilityWorkflowError = null;
		this.userCreationWorkflowPromise = null;
		this.statusPollingInterval = null;
		this.statusTrackingId = null;

		// Test mode
		this.isTestMode = this.container.hasAttribute("data-test-mode");
	}

	async startWorkflow() {
		try {
			console.log("🚀 Starting telemedicine workflow orchestration");

			// Show initial loading
			this._showLoadingScreen();

			// Start the orchestrator workflow
			const result = await this._startOrchestratorWorkflow();

			console.log("✅ Workflow orchestration completed:", result);
			return result;
		} catch (error) {
			console.error("❌ Workflow orchestration failed:", error);
			return this._handleWorkflowError(error);
		}
	}

	async _startOrchestratorWorkflow() {
		const url = this._getOrchestratorUrl();
		const payload = this._buildWorkflowPayload();

		console.log("📤 Submitting workflow to orchestrator:", { url, payload });

		try {
			const result = await this._submitOrchestratorToWebhook(url, payload);

			if (result.statusTrackingId) {
				this.statusTrackingId = result.statusTrackingId;
				console.log("📋 Starting status polling with ID:", this.statusTrackingId);
				this._startStatusPolling(this.statusTrackingId);
			}

			return this._handleWorkflowCompletion(result);
		} catch (error) {
			console.error("❌ Orchestrator workflow submission failed:", error);
			throw error;
		}
	}

	_buildWorkflowPayload() {
		const formData = this._collectFormData();
		const insuranceData = this._collectInsuranceData();

		return {
			responses: this.responses,
			formData: formData,
			insuranceData: insuranceData,
			hasInsurance: this._hasInsurance(),
			metadata: {
				timestamp: new Date().toISOString(),
				userAgent: navigator.userAgent,
				referrer: document.referrer || "direct",
				testMode: this.isTestMode
			}
		};
	}

	_collectFormData() {
		const formData = {};

		this.responses.forEach((stepResponses, stepIndex) => {
			Object.entries(stepResponses).forEach(([questionId, response]) => {
				// Map common form fields
				const fieldMappings = {
					"first-name": "firstName",
					"last-name": "lastName",
					email: "email",
					phone: "phone",
					address: "address",
					city: "city",
					state: "state",
					zip: "zipCode",
					"date-of-birth": "dateOfBirth"
				};

				const mappedField = fieldMappings[questionId] || questionId;
				formData[mappedField] = response;
			});
		});

		return formData;
	}

	_collectInsuranceData() {
		const insuranceData = {};

		this.responses.forEach(stepResponses => {
			Object.entries(stepResponses).forEach(([questionId, response]) => {
				if (questionId.includes("insurance") || questionId.includes("coverage")) {
					insuranceData[questionId] = response;
				}
			});
		});

		return insuranceData;
	}

	_hasInsurance() {
		return this._getResponseValue("has-insurance") === "yes" || this._getResponseValue("insurance-status") === "yes";
	}

	_getResponseValue(questionId) {
		for (const stepResponses of this.responses) {
			if (stepResponses[questionId] !== undefined) {
				return stepResponses[questionId];
			}
		}
		return null;
	}

	async _submitOrchestratorToWebhook(url, payload) {
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json"
			},
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error("Orchestrator submission failed:", {
				status: response.status,
				statusText: response.statusText,
				body: errorText
			});
			throw new Error(`Orchestrator submission failed: ${response.status} ${response.statusText}`);
		}

		const result = await response.json();
		console.log("📨 Orchestrator response received:", result);

		return result;
	}

	_getOrchestratorUrl() {
		// Try to get URL from data attribute first
		const orchestratorUrl = this.container?.dataset?.orchestratorUrl;

		if (orchestratorUrl) {
			console.log("🔗 Using orchestrator URL from data attribute:", orchestratorUrl);
			return orchestratorUrl;
		}

		// Fallback to hardcoded URL (for development/testing)
		const fallbackUrl = "https://workflow-orchestrator-xxn52lyizq-uc.a.run.app";
		console.log("🔗 Using fallback orchestrator URL:", fallbackUrl);
		return fallbackUrl;
	}

	_startStatusPolling(statusTrackingId) {
		if (this.statusPollingInterval) {
			clearInterval(this.statusPollingInterval);
		}

		// Start polling immediately, then every 3 seconds
		this._pollWorkflowStatus();
		this.statusPollingInterval = setInterval(() => {
			this._pollWorkflowStatus();
		}, 3000);

		// Stop polling after 5 minutes to prevent infinite polling
		setTimeout(() => {
			this._stopStatusPolling();
		}, 300000);
	}

	async _pollWorkflowStatus() {
		if (!this.statusTrackingId) return;

		try {
			const url = this._getStatusPollingUrl();
			const response = await fetch(`${url}?statusTrackingId=${this.statusTrackingId}`, {
				method: "GET",
				headers: {
					Accept: "application/json"
				}
			});

			if (!response.ok) {
				console.warn("Status polling request failed:", response.status);
				return;
			}

			const statusData = await response.json();
			console.log("📊 Status polling response:", statusData);

			this._updateWorkflowStatus(statusData);

			// Check if workflow is complete
			if (statusData.completed || statusData.error) {
				this._stopStatusPolling();

				if (statusData.error) {
					throw new Error(statusData.error);
				}
			}
		} catch (error) {
			console.error("❌ Status polling error:", error);
			// Don't stop polling for network errors, but log them
		}
	}

	_updateWorkflowStatus(statusData) {
		// Update loading progress if available
		if (statusData.progress !== undefined) {
			this._updateLoadingProgress(statusData.progress);
		}

		// Update status message if available
		if (statusData.message) {
			this._updateLoadingStep(statusData.message);
		}

		// Store latest status data
		this.latestStatusData = statusData;
	}

	_stopStatusPolling() {
		if (this.statusPollingInterval) {
			clearInterval(this.statusPollingInterval);
			this.statusPollingInterval = null;
			console.log("⏹️ Status polling stopped");
		}
	}

	_getStatusPollingUrl() {
		// Try to get URL from data attribute first
		const statusPollingUrl = this.container?.dataset?.statusPollingUrl;

		if (statusPollingUrl) {
			console.log("🔗 Using status polling URL from data attribute:", statusPollingUrl);
			return statusPollingUrl;
		}

		// Fallback to hardcoded URL
		const fallbackUrl = "https://workflow-status-polling-xxn52lyizq-uc.a.run.app";
		console.log("🔗 Using fallback status polling URL:", fallbackUrl);
		return fallbackUrl;
	}

	_updateLoadingProgress(progress) {
		const progressBar = this.container.querySelector(".quiz-loading-progress-bar");
		if (progressBar) {
			progressBar.style.width = `${Math.min(progress, 100)}%`;
		}

		const progressText = this.container.querySelector(".quiz-loading-progress-text");
		if (progressText) {
			progressText.textContent = `${Math.round(progress)}%`;
		}
	}

	_updateLoadingStep(step) {
		const stepElement = this.container.querySelector(".quiz-loading-step");
		if (stepElement) {
			stepElement.textContent = step;
		}
	}

	_showLoadingScreen() {
		const loadingElement = this.container.querySelector(".quiz-loading");
		if (loadingElement) {
			loadingElement.style.display = "block";
		}

		// Hide other sections
		const questionsElement = this.container.querySelector(".quiz-questions");
		if (questionsElement) {
			questionsElement.style.display = "none";
		}

		this._showComprehensiveLoadingSequence();
	}

	async _showComprehensiveLoadingSequence() {
		const steps = [
			{ text: "Processing your responses...", duration: 2000 },
			{ text: "Checking insurance eligibility...", duration: 3000 },
			{ text: "Creating your profile...", duration: 2500 },
			{ text: "Scheduling your consultation...", duration: 3000 },
			{ text: "Finalizing your appointment...", duration: 2000 }
		];

		for (let i = 0; i < steps.length; i++) {
			const step = steps[i];
			this._updateLoadingStep(step.text);
			this._updateLoadingProgress(((i + 1) / steps.length) * 80); // Cap at 80% during sequence

			await new Promise(resolve => setTimeout(resolve, step.duration));
		}
	}

	_handleWorkflowCompletion(result) {
		console.log("✅ Workflow completed successfully:", result);

		// Process the result and return structured data
		return {
			success: true,
			eligibilityStatus: result.eligibilityStatus || "eligible",
			isEligible: result.isEligible !== false,
			schedulingData: result.schedulingData,
			message: result.message || "Your appointment request has been processed successfully!",
			statusTrackingId: result.statusTrackingId
		};
	}

	_handleWorkflowError(error) {
		console.error("❌ Workflow error:", error);

		// Determine error type and create appropriate response
		let errorType = "general";
		let errorMessage = "We're experiencing technical difficulties. Please try again or contact support.";

		if (error.message?.includes("validation")) {
			errorType = "validation";
			errorMessage = "Please check your information and try again.";
		} else if (error.message?.includes("duplicate")) {
			errorType = "duplicate";
			errorMessage = "It looks like you already have an appointment scheduled.";
		} else if (error.message?.includes("eligibility")) {
			errorType = "eligibility";
			errorMessage = "We're having trouble verifying your insurance. Our team will contact you within 24 hours.";
		}

		return {
			success: false,
			error: true,
			errorType: errorType,
			errorMessage: errorMessage,
			eligibilityStatus: "processing",
			isEligible: false
		};
	}

	// Method to create mock processing status (for fallback scenarios)
	_createProcessingEligibilityData() {
		return {
			success: true,
			eligibilityStatus: "processing",
			isEligible: true,
			message: "Your request is being processed. Our team will contact you within 24 hours to schedule your appointment.",
			requiresManualReview: true
		};
	}

	// Method to process webhook results
	_processWebhookResult(webhookResult) {
		if (!webhookResult) {
			return this._createProcessingEligibilityData();
		}

		// Handle different response formats
		if (webhookResult.eligibilityStatus) {
			return {
				success: !webhookResult.error,
				eligibilityStatus: webhookResult.eligibilityStatus,
				isEligible: webhookResult.isEligible !== false,
				schedulingData: webhookResult.schedulingData,
				message: webhookResult.message,
				errorType: webhookResult.errorType,
				errorMessage: webhookResult.errorMessage
			};
		}

		// Legacy format support
		return {
			success: true,
			eligibilityStatus: "eligible",
			isEligible: true,
			message: "Your appointment request has been processed successfully!"
		};
	}

	// Cleanup method
	cleanup() {
		this._stopStatusPolling();
		this.eligibilityWorkflowPromise = null;
		this.eligibilityWorkflowResult = null;
		this.eligibilityWorkflowError = null;
		this.userCreationWorkflowPromise = null;
	}
}
