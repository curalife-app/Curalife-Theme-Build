class TelemedicineWorkflow {
  constructor(container, responses) {
    this.container = container;
    this.responses = responses;
    this.eligibilityWorkflowPromise = null;
    this.eligibilityWorkflowResult = null;
    this.eligibilityWorkflowError = null;
    this.userCreationWorkflowPromise = null;
    this.statusPollingInterval = null;
    this.statusTrackingId = null;
    this.isTestMode = this.container.hasAttribute("data-test-mode");
  }
  async startWorkflow() {
    try {
      console.log("🚀 Starting telemedicine workflow orchestration");
      this._showLoadingScreen();
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
      formData,
      insuranceData,
      hasInsurance: this._hasInsurance(),
      metadata: {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
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
    this.responses.forEach((stepResponses) => {
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
      if (stepResponses[questionId] !== void 0) {
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
    var _a, _b;
    const orchestratorUrl = (_b = (_a = this.container) == null ? void 0 : _a.dataset) == null ? void 0 : _b.orchestratorUrl;
    if (orchestratorUrl) {
      console.log("🔗 Using orchestrator URL from data attribute:", orchestratorUrl);
      return orchestratorUrl;
    }
    const fallbackUrl = "https://workflow-orchestrator-xxn52lyizq-uc.a.run.app";
    console.log("🔗 Using fallback orchestrator URL:", fallbackUrl);
    return fallbackUrl;
  }
  _startStatusPolling(statusTrackingId) {
    if (this.statusPollingInterval) {
      clearInterval(this.statusPollingInterval);
    }
    this._pollWorkflowStatus();
    this.statusPollingInterval = setInterval(() => {
      this._pollWorkflowStatus();
    }, 3e3);
    setTimeout(() => {
      this._stopStatusPolling();
    }, 3e5);
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
      if (statusData.completed || statusData.error) {
        this._stopStatusPolling();
        if (statusData.error) {
          throw new Error(statusData.error);
        }
      }
    } catch (error) {
      console.error("❌ Status polling error:", error);
    }
  }
  _updateWorkflowStatus(statusData) {
    if (statusData.progress !== void 0) {
      this._updateLoadingProgress(statusData.progress);
    }
    if (statusData.message) {
      this._updateLoadingStep(statusData.message);
    }
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
    var _a, _b;
    const statusPollingUrl = (_b = (_a = this.container) == null ? void 0 : _a.dataset) == null ? void 0 : _b.statusPollingUrl;
    if (statusPollingUrl) {
      console.log("🔗 Using status polling URL from data attribute:", statusPollingUrl);
      return statusPollingUrl;
    }
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
    const questionsElement = this.container.querySelector(".quiz-questions");
    if (questionsElement) {
      questionsElement.style.display = "none";
    }
    this._showComprehensiveLoadingSequence();
  }
  async _showComprehensiveLoadingSequence() {
    const steps = [
      { text: "Processing your responses...", duration: 2e3 },
      { text: "Checking insurance eligibility...", duration: 3e3 },
      { text: "Creating your profile...", duration: 2500 },
      { text: "Scheduling your consultation...", duration: 3e3 },
      { text: "Finalizing your appointment...", duration: 2e3 }
    ];
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      this._updateLoadingStep(step.text);
      this._updateLoadingProgress((i + 1) / steps.length * 80);
      await new Promise((resolve) => setTimeout(resolve, step.duration));
    }
  }
  _handleWorkflowCompletion(result) {
    console.log("✅ Workflow completed successfully:", result);
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
    var _a, _b, _c;
    console.error("❌ Workflow error:", error);
    let errorType = "general";
    let errorMessage = "We're experiencing technical difficulties. Please try again or contact support.";
    if ((_a = error.message) == null ? void 0 : _a.includes("validation")) {
      errorType = "validation";
      errorMessage = "Please check your information and try again.";
    } else if ((_b = error.message) == null ? void 0 : _b.includes("duplicate")) {
      errorType = "duplicate";
      errorMessage = "It looks like you already have an appointment scheduled.";
    } else if ((_c = error.message) == null ? void 0 : _c.includes("eligibility")) {
      errorType = "eligibility";
      errorMessage = "We're having trouble verifying your insurance. Our team will contact you within 24 hours.";
    }
    return {
      success: false,
      error: true,
      errorType,
      errorMessage,
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
export {
  TelemedicineWorkflow as T
};
//# sourceMappingURL=quiz-telemedicine.js.map
