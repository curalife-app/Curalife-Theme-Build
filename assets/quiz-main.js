import { Q as QuizCore } from "./quiz-core.js";
import { T as TelemedicineWorkflow } from "./quiz-telemedicine.js";
import { Q as QuizValidation } from "./quiz-validation.js";
import { Q as QuizTemplates } from "./quiz-templates.js";
class ModularQuiz {
  constructor(options = {}) {
    this.container = document.querySelector("#quiz-container");
    if (!this.container) {
      console.error("Quiz container not found");
      return;
    }
    this.core = new QuizCore(this.container, options);
    this.validation = new QuizValidation(this.container);
    this.templates = new QuizTemplates();
    this.telemedicine = null;
    this.isTestMode = this.container.hasAttribute("data-test-mode");
    this._initializeNotificationManager().then(() => {
      this.init();
    });
  }
  async _initializeNotificationManager() {
    try {
      const notificationsUrl = this.container.getAttribute("data-notifications-url");
      if (!notificationsUrl) {
        throw new Error("Notifications asset URL not found");
      }
      console.log("🔗 Loading notification system from:", notificationsUrl);
      const { NotificationManager } = await import(notificationsUrl);
      this.notificationManager = new NotificationManager(this.container, {
        maxNotifications: 3,
        displayDuration: 5e3,
        animationDuration: 300,
        defaultType: "info",
        testMode: this.isTestMode
      });
      console.log("✅ Notification system initialized");
    } catch (error) {
      console.error("❌ Failed to initialize notification system:", error);
    }
  }
  async init() {
    try {
      if (!this.core._validateEssentialElements()) {
        return;
      }
      const dataLoaded = await this.core.loadQuizData();
      if (!dataLoaded) return;
      if (this.isTestMode) {
        this._applyTestDataIfEnabled();
        this._addTestModeIndicator();
      }
      this._attachNavigationListeners();
      this.core.renderCurrentStep();
      console.log("✅ Quiz initialized successfully");
    } catch (error) {
      console.error("❌ Quiz initialization failed:", error);
      this.core._displayCriticalError("Failed to initialize quiz");
    }
  }
  _applyTestDataIfEnabled() {
    const testData = {
      "first-name": "Test",
      "last-name": "User",
      email: "test@example.com",
      phone: "5551234567",
      address: "123 Test St",
      city: "Test City",
      state: "CA",
      zip: "12345",
      "date-of-birth": { month: "01", day: "15", year: "1990" }
    };
    this.core.responses.forEach((stepResponses, stepIndex) => {
      const step = this.core.quizData.steps[stepIndex];
      if (step && step.type === "form") {
        step.questions.forEach((question) => {
          if (testData[question.id]) {
            stepResponses[question.id] = testData[question.id];
          }
        });
      }
    });
    console.log("🧪 Test data applied to form fields");
  }
  _addTestModeIndicator(text = "🧪 TEST MODE") {
    const existingIndicator = this.container.querySelector(".quiz-test-mode-indicator");
    if (existingIndicator) {
      existingIndicator.remove();
    }
    const indicatorHTML = this.templates.generateTestModeIndicator(text);
    this.container.insertAdjacentHTML("afterbegin", indicatorHTML);
  }
  _attachNavigationListeners() {
    const backButton = this.container.querySelector("#quiz-back-button");
    if (backButton) {
      backButton.addEventListener("click", () => this.core.goToPreviousStep());
    }
    const nextButton = this.container.querySelector("#quiz-next-button");
    if (nextButton) {
      nextButton.addEventListener("click", () => this._handleNextButtonClick());
    }
    this.container.addEventListener("quizComplete", (event) => {
      this.finishQuiz();
    });
  }
  _handleNextButtonClick() {
    const step = this.core.getCurrentStep();
    if (!step) return;
    if (step.type === "form") {
      const isValid = this.validation.validateFormStep(step, this.core.responses[this.core.currentStepIndex]);
      if (!isValid) {
        return;
      }
    }
    const isLastStep = this.core.currentStepIndex === this.core.quizData.steps.length - 1;
    const isLastQuestion = step.type !== "form" && this.core.currentQuestionIndex === step.questions.length - 1;
    if (isLastStep && (step.type === "form" || isLastQuestion)) {
      this.finishQuiz();
    } else {
      this.core.goToNextStep();
    }
  }
  async finishQuiz() {
    try {
      console.log("🏁 Starting quiz completion process");
      if (!this.telemedicine) {
        this.telemedicine = new TelemedicineWorkflow(this.container, this.core.responses);
      }
      this._showLoadingScreen();
      const workflowResult = await this.telemedicine.startWorkflow();
      this._showResults(workflowResult);
    } catch (error) {
      console.error("❌ Quiz completion failed:", error);
      this._showResults({
        success: false,
        error: true,
        errorType: "general",
        errorMessage: "We're experiencing technical difficulties. Please try again or contact support."
      });
    }
  }
  _showLoadingScreen() {
    const loadingElement = this.core.loading;
    const questionsElement = this.core.questions;
    const navigationElement = this.core.navigationButtons;
    if (loadingElement) {
      loadingElement.innerHTML = this.templates.generateLoadingHTML();
      loadingElement.style.display = "block";
    }
    if (questionsElement) {
      questionsElement.style.display = "none";
    }
    if (navigationElement) {
      navigationElement.style.display = "none";
    }
  }
  _showResults(resultData) {
    console.log("📊 Displaying quiz results:", resultData);
    if (this.core.loading) {
      this.core.loading.style.display = "none";
    }
    if (this.core.results) {
      this.core.results.style.display = "block";
      this.core.results.innerHTML = this._generateResultsHTML(resultData);
    }
    if (this.isTestMode && this.notificationManager) {
      const statusText = resultData.success ? "✅ Completed" : "❌ Failed";
      this.notificationManager.show("🧪 TEST MODE - Quiz Completion: " + statusText, "info");
    }
  }
  _generateResultsHTML(resultData) {
    if (resultData.success && resultData.schedulingData) {
      return this.templates.generateSuccessfulSchedulingHTML(resultData.schedulingData);
    } else if (resultData.error) {
      return this.templates.generateSchedulingErrorHTML({
        type: resultData.errorType,
        message: resultData.errorMessage,
        title: this._getErrorTitle(resultData.errorType),
        description: this._getErrorDescription(resultData.errorType)
      });
    } else {
      return this.templates.generateSchedulingErrorHTML({
        type: "processing",
        title: "⏳ Processing Your Request",
        description: "Your request is being processed. Our team will contact you within 24 hours to schedule your appointment."
      });
    }
  }
  _getErrorTitle(errorType) {
    const errorTitles = {
      duplicate: "⚠️ Appointment Already Exists",
      validation: "❌ Information Needs Review",
      eligibility: "⏳ Insurance Verification Needed",
      general: "⚠️ Scheduling Temporarily Unavailable"
    };
    return errorTitles[errorType] || errorTitles.general;
  }
  _getErrorDescription(errorType) {
    const errorDescriptions = {
      duplicate: "Good news! You already have an appointment scheduled with our dietitian.",
      validation: "Please check your information and try again.",
      eligibility: "We're having trouble verifying your insurance. Our team will contact you within 24 hours.",
      general: "We're experiencing temporary difficulties with our scheduling system."
    };
    return errorDescriptions[errorType] || errorDescriptions.general;
  }
  // Public API methods for external access
  getCurrentStep() {
    return this.core.getCurrentStep();
  }
  getCurrentQuestion() {
    return this.core.getCurrentQuestion();
  }
  getResponses() {
    return this.core.responses;
  }
  isFormStep() {
    return this.core.isFormStep();
  }
  showNotification(message, type = "info") {
    if (this.notificationManager) {
      this.notificationManager.show(message, type);
    }
  }
  clearNotifications() {
    if (this.notificationManager) {
      this.notificationManager.clear();
    }
  }
  // Cleanup method
  cleanup() {
    if (this.telemedicine) {
      this.telemedicine.cleanup();
    }
    if (this.notificationManager) {
      this.notificationManager.clear();
    }
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const quizContainer = document.querySelector("#quiz-container");
  if (quizContainer) {
    window.curaQuiz = new ModularQuiz();
  }
});
//# sourceMappingURL=quiz-main.js.map
