/**
 * Quiz Integration Example
 *
 * This file demonstrates how to refactor existing HTML generation methods
 * to use the new Web Components system.
 *
 * Shows the transformation from complex string concatenation to clean,
 * declarative Web Components.
 */

import { waitForComponents } from "./quiz-components-loader.js";

/**
 * BEFORE: Original method with string concatenation (80+ lines)
 */
function originalApproach(resultData, resultUrl) {
	let html = "";
	html += '<div class="quiz-results-container">';
	html += '<div class="quiz-coverage-card">';
	html += '<div class="quiz-coverage-card-title">Coverage Info</div>';
	// ... 75 more lines of html += statements
	return html;
}

/**
 * AFTER: Web Components approach (clean and declarative)
 */
function webComponentsApproach(resultData, resultUrl) {
	const sessionsCovered = resultData.sessionsCovered || 5;
	const planEnd = resultData.planEnd || "Dec 31, 2025";

	return `
    <div class="quiz-results-container">
      <quiz-coverage-card title="Here's Your Offer" type="success">
        <quiz-benefit-item
          icon="checkmark"
          text="${sessionsCovered} covered sessions remaining"
          icon-color="#418865">
        </quiz-benefit-item>
        <quiz-benefit-item
          icon="calendar"
          text="Coverage expires ${planEnd}"
          icon-color="#418865">
        </quiz-benefit-item>
      </quiz-coverage-card>
    </div>
  `;
}

/**
 * Enhanced Web Components approach with programmatic creation
 * For more complex scenarios where template literals aren't sufficient
 */
function advancedWebComponentsGeneration(resultData, resultUrl) {
	const container = document.createElement("div");
	container.className = "quiz-results-container";

	// Header
	const header = document.createElement("div");
	header.className = "quiz-results-header";
	header.innerHTML = `
    <h2 class="quiz-results-title">Great news! You're covered</h2>
    <p class="quiz-results-subtitle">As of today, your insurance fully covers your online dietitian consultations*</p>
  `;

	// Coverage card
	const coverageCard = document.createElement("quiz-coverage-card");
	coverageCard.setAttribute("title", "Here's Your Offer");
	coverageCard.setAttribute("type", "success");

	// Benefits
	const sessionsBenefit = document.createElement("quiz-benefit-item");
	sessionsBenefit.setAttribute("icon", "checkmark");
	sessionsBenefit.setAttribute("text", `${resultData.sessionsCovered || 5} covered sessions remaining`);
	sessionsBenefit.setAttribute("icon-color", "#418865");

	const expireBenefit = document.createElement("quiz-benefit-item");
	expireBenefit.setAttribute("icon", "calendar");
	expireBenefit.setAttribute("text", `Coverage expires ${resultData.planEnd || "Dec 31, 2025"}`);
	expireBenefit.setAttribute("icon-color", "#418865");

	// Compose
	coverageCard.appendChild(sessionsBenefit);
	coverageCard.appendChild(expireBenefit);
	container.appendChild(header);
	container.appendChild(coverageCard);

	return container.outerHTML;
}

/**
 * Integration helper for existing ModularQuiz class
 * This shows how to integrate Web Components into the existing quiz system
 */
export class QuizWebComponentsIntegration {
	constructor(quizInstance) {
		this.quiz = quizInstance;
		this.componentsReady = false;
		this.init();
	}

	async init() {
		console.log("🔧 Initializing Quiz Web Components Integration...");
		this.componentsReady = await waitForComponents();

		if (this.componentsReady) {
			console.log("✅ Web Components ready - enhancing quiz methods");
			this.enhanceQuizMethods();
		} else {
			console.warn("⚠️ Web Components not ready - falling back to original methods");
		}
	}

	/**
	 * Enhance existing quiz methods to use Web Components
	 */
	enhanceQuizMethods() {
		// Store original methods
		this.quiz._originalGenerateEligibleInsuranceResultsHTML = this.quiz._generateEligibleInsuranceResultsHTML;
		this.quiz._originalGenerateNotCoveredInsuranceResultsHTML = this.quiz._generateNotCoveredInsuranceResultsHTML;

		// Replace with Web Components versions
		this.quiz._generateEligibleInsuranceResultsHTML = this.generateEligibleInsuranceResultsHTML.bind(this);
		this.quiz._generateNotCoveredInsuranceResultsHTML = this.generateNotCoveredInsuranceResultsHTML.bind(this);

		console.log("🚀 Quiz methods enhanced with Web Components");
	}

	/**
	 * Web Components version of _generateEligibleInsuranceResultsHTML
	 */
	generateEligibleInsuranceResultsHTML(resultData, resultUrl) {
		const sessionsCovered = resultData.sessionsCovered || 5;
		const planEnd = resultData.planEnd || "Dec 31, 2025";

		return `
      <div class="quiz-results-container">
        <div class="quiz-results-header">
          <h2 class="quiz-results-title">Great news! You're covered</h2>
          <p class="quiz-results-subtitle">As of today, your insurance fully covers your online dietitian consultations*</p>
        </div>

        <quiz-coverage-card title="Here's Your Offer" type="success">
          <div slot="pricing">
            <div class="quiz-coverage-service-item">
              <div class="quiz-coverage-service">Initial consultation – 60 minutes</div>
              <div class="quiz-coverage-cost">
                <div class="quiz-coverage-copay">Co-pay: $0*</div>
                <div class="quiz-coverage-original-price">$100</div>
              </div>
            </div>
            <div class="quiz-coverage-service-item">
              <div class="quiz-coverage-service">Follow-up consultation – 30 minutes</div>
              <div class="quiz-coverage-cost">
                <div class="quiz-coverage-copay">Co-pay: $0*</div>
                <div class="quiz-coverage-original-price">$50</div>
              </div>
            </div>
          </div>
          <div slot="benefits">
            <quiz-benefit-item icon="calendar" text="${sessionsCovered} covered sessions remaining"></quiz-benefit-item>
            <quiz-benefit-item icon="clock" text="Coverage expires ${planEnd}"></quiz-benefit-item>
          </div>
        </quiz-coverage-card>

        <quiz-action-section title="Schedule your initial online consultation now" type="primary">
          <div slot="info">
            <quiz-benefit-item icon="checkmark" text="Our dietitians usually recommend minimum 6 consultations over 6 months. Today, just book your first."></quiz-benefit-item>
            <quiz-benefit-item icon="checkmark" text="Free cancellation up to 24h before"></quiz-benefit-item>
          </div>
          <div slot="action">
            <a href="${resultUrl}" class="quiz-booking-button">Proceed to booking</a>
          </div>
        </quiz-action-section>

        ${this._generateFAQHTML()}
      </div>
    `;
	}

	/**
	 * Web Components version of _generateNotCoveredInsuranceResultsHTML
	 */
	generateNotCoveredInsuranceResultsHTML(resultData, resultUrl) {
		const messages = this.quiz.quizData.ui?.resultMessages?.notCovered || {};
		const userMessage = resultData.userMessage || "Your insurance plan doesn't cover nutrition counseling, but we have affordable options available.";

		return `
      <div class="quiz-results-container">
        <div class="quiz-results-header">
          <h2 class="quiz-results-title">${messages.title || "Thanks for completing the quiz!"}</h2>
          <p class="quiz-results-subtitle">${messages.subtitle || "We have options for you."}</p>
        </div>

        <quiz-coverage-card title="Coverage Information" type="warning">
          <p style="color: #c05621;">${userMessage}</p>
        </quiz-coverage-card>

        <quiz-coverage-card title="Alternative Options" type="default">
          <quiz-benefit-item
            icon="checkmark"
            text="We offer affordable self-pay options and payment plans to make nutrition counseling accessible"
            icon-color="#306E51">
          </quiz-benefit-item>
          <quiz-benefit-item
            icon="clock"
            text="Direct support to help resolve any coverage questions"
            icon-color="#306E51">
          </quiz-benefit-item>
        </quiz-coverage-card>

        <div class="quiz-action-section">
          <div class="quiz-action-content">
            <a href="${resultUrl}" class="quiz-booking-button">Continue to Support</a>
          </div>
        </div>
      </div>
    `;
	}

	/**
	 * Check if Web Components are working
	 */
	isReady() {
		return this.componentsReady;
	}

	/**
	 * Restore original methods (for testing/debugging)
	 */
	restoreOriginalMethods() {
		if (this.quiz._originalGenerateEligibleInsuranceResultsHTML) {
			this.quiz._generateEligibleInsuranceResultsHTML = this.quiz._originalGenerateEligibleInsuranceResultsHTML;
		}
		if (this.quiz._originalGenerateNotCoveredInsuranceResultsHTML) {
			this.quiz._generateNotCoveredInsuranceResultsHTML = this.quiz._originalGenerateNotCoveredInsuranceResultsHTML;
		}
		console.log("🔄 Restored original quiz methods");
	}
}

/**
 * Usage example:
 *
 * // In your ModularQuiz class initialization:
 * import { QuizWebComponentsIntegration } from './components/quiz/quiz-integration-example.js';
 *
 * class ModularQuiz {
 *   async init() {
 *     // ... existing initialization ...
 *
 *     // Initialize Web Components integration
 *     this.webComponents = new QuizWebComponentsIntegration(this);
 *
 *     // ... rest of initialization ...
 *   }
 * }
 */

export { originalApproach, webComponentsApproach };
