import { SharedStyles } from "../utils/shared-styles.js";

export class QuizResultCard extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.resultType = "generic";
		this.resultData = {};
		this.resultUrl = "";
	}

	static get observedAttributes() {
		return ["result-type", "result-data", "result-url"];
	}

	attributeChangedCallback(name, oldValue, newValue) {
		switch (name) {
			case "result-type":
				this.resultType = newValue || "generic";
				break;
			case "result-data":
				try {
					this.resultData = newValue ? JSON.parse(newValue) : {};
				} catch (error) {
					console.error("Invalid result data:", error);
					this.resultData = {};
				}
				break;
			case "result-url":
				this.resultUrl = newValue || "";
				break;
		}
		if (this.shadowRoot.innerHTML) {
			this.render();
		}
	}

	connectedCallback() {
		this.render();
	}

	async render() {
		const sharedStyles = await SharedStyles.getQuizStyles();
		const template = this.getTemplate();
		const styles = this.getStyles();

		this.shadowRoot.innerHTML = `
			<style>
				${sharedStyles}
				${styles}
			</style>
			${template}
		`;

		this.attachEventListeners();
	}

	getTemplate() {
		switch (this.resultType) {
			case "eligible":
				return this.getEligibleTemplate();
			case "not-covered":
				return this.getNotCoveredTemplate();
			case "aaa-error":
				return this.getAAAErrorTemplate();
			case "test-data-error":
				return this.getTestDataErrorTemplate();
			case "technical-problem":
				return this.getTechnicalProblemTemplate();
			case "processing":
				return this.getProcessingTemplate();
			case "ineligible":
				return this.getIneligibleTemplate();
			default:
				return this.getGenericTemplate();
		}
	}

	getStyles() {
		return `
			:host {
				display: block;
			}

			.result-card {
				background: white;
				border-radius: 12px;
				padding: 24px;
				margin-bottom: 24px;
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
			}

			.result-header {
				margin-bottom: 20px;
			}

			.result-title {
				font-family: "PP Radio Grotesk", sans-serif;
				font-size: 24px;
				font-weight: 700;
				line-height: 1.3;
				color: #121212;
				margin: 0 0 8px 0;
			}

			.result-subtitle {
				font-family: "DM Sans", sans-serif;
				font-size: 16px;
				color: #666;
				margin: 0;
			}

			.result-content {
				margin-bottom: 20px;
			}

			.result-actions {
				display: flex;
				gap: 12px;
				flex-wrap: wrap;
			}

			.result-button {
				background-color: #306e51;
				color: white;
				border: none;
				border-radius: 300px;
				padding: 14px 40px;
				font-family: "DM Sans", sans-serif;
				font-size: 18px;
				font-weight: 600;
				text-decoration: none;
				display: inline-flex;
				align-items: center;
				justify-content: center;
				cursor: pointer;
				transition: all 0.2s ease;
			}

			.result-button:hover {
				background-color: #245a42;
				transform: translateY(-1px);
			}

			.error-card {
				border-left: 4px solid #f56565;
				background-color: #fed7d7;
			}

			.warning-card {
				border-left: 4px solid #ed8936;
				background-color: #fffaf0;
			}

			.success-card {
				border-left: 4px solid #48bb78;
				background-color: #f0fff4;
			}

			.info-card {
				border-left: 4px solid #4299e1;
				background-color: #ebf8ff;
			}

			.feature-list {
				list-style: none;
				padding: 0;
				margin: 16px 0;
			}

			.feature-item {
				display: flex;
				align-items: center;
				gap: 12px;
				margin-bottom: 12px;
				font-family: "DM Sans", sans-serif;
				font-size: 16px;
				color: #333;
			}

			.feature-icon {
				width: 20px;
				height: 20px;
				flex-shrink: 0;
			}

			.error-details {
				margin-top: 16px;
				padding: 12px;
				background: rgba(0, 0, 0, 0.05);
				border-radius: 8px;
				font-family: "DM Sans", sans-serif;
				font-size: 14px;
				color: #666;
			}
		`;
	}

	getEligibleTemplate() {
		const sessionsCovered = this.resultData.sessionsCovered || 5;
		const planEnd = this.resultData.planEnd || "Dec 31, 2025";

		return `
			<div class="result-card success-card">
				<div class="result-header">
					<h2 class="result-title">Great news! You're covered</h2>
					<p class="result-subtitle">As of today, your insurance fully covers your online dietitian consultations*</p>
				</div>
				<div class="result-content">
					<ul class="feature-list">
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z" stroke="#48bb78" stroke-width="1.5"/>
								<path d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329" stroke="#48bb78" stroke-width="1.5"/>
							</svg>
							Up to ${sessionsCovered} sessions covered through ${planEnd}
						</li>
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z" stroke="#48bb78" stroke-width="1.5"/>
								<path d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329" stroke="#48bb78" stroke-width="1.5"/>
							</svg>
							Licensed registered dietitians
						</li>
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z" stroke="#48bb78" stroke-width="1.5"/>
								<path d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329" stroke="#48bb78" stroke-width="1.5"/>
							</svg>
							Personalized nutrition plans
						</li>
					</ul>
				</div>
				<div class="result-actions">
					<a href="${this.resultUrl}" class="result-button">Schedule Your Consultation</a>
				</div>
			</div>
		`;
	}

	getNotCoveredTemplate() {
		const userMessage = this.resultData.userMessage || "Your insurance plan doesn't cover nutrition counseling, but we have affordable options available.";

		return `
			<div class="result-card warning-card">
				<div class="result-header">
					<h2 class="result-title">Thanks for completing the quiz!</h2>
					<p class="result-subtitle">We have options for you.</p>
				</div>
				<div class="result-content">
					<p><strong>💡 Coverage Information:</strong></p>
					<p>${userMessage}</p>
					<ul class="feature-list">
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z" stroke="#ed8936" stroke-width="1.5"/>
								<path d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329" stroke="#ed8936" stroke-width="1.5"/>
							</svg>
							Affordable self-pay options available
						</li>
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M18.3333 14.1667C18.3333 15.0871 17.5871 15.8333 16.6667 15.8333H5.83333L1.66666 20V3.33333C1.66666 2.41286 2.41285 1.66667 3.33333 1.66667H16.6667C17.5871 1.66667 18.3333 2.41286 18.3333 3.33333V14.1667Z" stroke="#ed8936" stroke-width="1.5"/>
							</svg>
							Flexible payment plans
						</li>
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M6.66666 2.5V5.83333M13.3333 2.5V5.83333M2.5 9.16667H17.5M4.16666 3.33333H15.8333C16.7538 3.33333 17.5 4.07952 17.5 5V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16666C3.24619 18.3333 2.5 17.5871 2.5 16.6667V5C2.5 4.07952 3.24619 3.33333 4.16666 3.33333Z" stroke="#ed8936" stroke-width="1.5"/>
							</svg>
							Same quality care from registered dietitians
						</li>
					</ul>
				</div>
				<div class="result-actions">
					<a href="${this.resultUrl}" class="result-button">Explore Options</a>
				</div>
			</div>
		`;
	}

	getAAAErrorTemplate() {
		const error = this.resultData.error || {};
		const errorCode = error.code || this.resultData.aaaErrorCode || "Unknown";
		const userMessage = this.resultData.userMessage || error.message || "There was an issue verifying your insurance coverage automatically.";
		const errorTitle = error.title || this.getErrorTitle(errorCode);

		return `
			<div class="result-card error-card">
				<div class="result-header">
					<h2 class="result-title">Thanks for completing the quiz!</h2>
					<p class="result-subtitle">We're here to help.</p>
				</div>
				<div class="result-content">
					<p><strong>⚠️ ${errorTitle}:</strong></p>
					<p>${userMessage}</p>
					${errorCode !== "Unknown" ? `<div class="error-details">Error Code: ${errorCode}</div>` : ""}
					<ul class="feature-list">
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z" stroke="#f56565" stroke-width="1.5"/>
								<path d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329" stroke="#f56565" stroke-width="1.5"/>
							</svg>
							Manual verification by our team
						</li>
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M18.3333 14.1667C18.3333 15.0871 17.5871 15.8333 16.6667 15.8333H5.83333L1.66666 20V3.33333C1.66666 2.41286 2.41285 1.66667 3.33333 1.66667H16.6667C17.5871 1.66667 18.3333 2.41286 18.3333 3.33333V14.1667Z" stroke="#f56565" stroke-width="1.5"/>
							</svg>
							Direct support to resolve issues
						</li>
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M6.66666 2.5V5.83333M13.3333 2.5V5.83333M2.5 9.16667H17.5M4.16666 3.33333H15.8333C16.7538 3.33333 17.5 4.07952 17.5 5V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16666C3.24619 18.3333 2.5 17.5871 2.5 16.6667V5C2.5 4.07952 3.24619 3.33333 4.16666 3.33333Z" stroke="#f56565" stroke-width="1.5"/>
							</svg>
							Quick resolution to connect you with a dietitian
						</li>
					</ul>
				</div>
				<div class="result-actions">
					<a href="${this.resultUrl}" class="result-button">Continue with Support</a>
				</div>
			</div>
		`;
	}

	getTestDataErrorTemplate() {
		const userMessage = this.resultData.userMessage || "Test data was detected in your submission. Please use real insurance information for accurate verification.";

		return `
			<div class="result-card warning-card">
				<div class="result-header">
					<h2 class="result-title">Please use real information</h2>
					<p class="result-subtitle">We need accurate details for verification.</p>
				</div>
				<div class="result-content">
					<p><strong>⚠️ Test Data Detected:</strong></p>
					<p>${userMessage}</p>
					<ul class="feature-list">
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M10 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 10 1.66663C5.39762 1.66663 1.66666 5.39759 1.66666 9.99996C1.66666 14.6023 5.39762 18.3333 10 18.3333Z" stroke="#ed8936" stroke-width="1.5"/>
								<path d="M7.5 9.99996L9.16667 11.6666L12.5 8.33329" stroke="#ed8936" stroke-width="1.5"/>
							</svg>
							Retake quiz with real insurance information
						</li>
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M18.3333 14.1667C18.3333 15.0871 17.5871 15.8333 16.6667 15.8333H5.83333L1.66666 20V3.33333C1.66666 2.41286 2.41285 1.66667 3.33333 1.66667H16.6667C17.5871 1.66667 18.3333 2.41286 18.3333 3.33333V14.1667Z" stroke="#ed8936" stroke-width="1.5"/>
							</svg>
							Use information exactly as it appears on your card
						</li>
						<li class="feature-item">
							<svg class="feature-icon" viewBox="0 0 20 20" fill="none">
								<path d="M6.66666 2.5V5.83333M13.3333 2.5V5.83333M2.5 9.16667H17.5M4.16666 3.33333H15.8333C16.7538 3.33333 17.5 4.07952 17.5 5V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16666C3.24619 18.3333 2.5 17.5871 2.5 16.6667V5C2.5 4.07952 3.24619 3.33333 4.16666 3.33333Z" stroke="#ed8936" stroke-width="1.5"/>
							</svg>
							Get accurate coverage details for your plan
						</li>
					</ul>
				</div>
				<div class="result-actions">
					<a href="${this.resultUrl}" class="result-button">Continue</a>
				</div>
			</div>
		`;
	}

	getTechnicalProblemTemplate() {
		const error = this.resultData.error || {};
		const errorCode = error.code || this.resultData.stediErrorCode || "Unknown";
		const userMessage = this.resultData.userMessage || error.message || "There was a technical issue processing your insurance verification.";

		return `
			<div class="result-card error-card">
				<div class="result-header">
					<h2 class="result-title">Technical Issue</h2>
					<p class="result-subtitle">We're working to resolve this quickly.</p>
				</div>
				<div class="result-content">
					<p>${userMessage}</p>
					${errorCode !== "Unknown" ? `<div class="error-details">Error Code: ${errorCode}</div>` : ""}
				</div>
				<div class="result-actions">
					<a href="${this.resultUrl}" class="result-button">Continue with Support</a>
				</div>
			</div>
		`;
	}

	getProcessingTemplate() {
		return `
			<div class="result-card info-card">
				<div class="result-header">
					<h2 class="result-title">Thanks for completing the quiz!</h2>
					<p class="result-subtitle">We're ready to connect you with a registered dietitian.</p>
				</div>
				<div class="result-content">
					<p>Your eligibility check and account setup is still processing in the background. This can take up to 3 minutes for complex insurance verifications and account creation. Please proceed with booking - we'll contact you with your coverage details shortly.</p>
				</div>
				<div class="result-actions">
					<a href="${this.resultUrl}" class="result-button">Continue to Booking</a>
				</div>
			</div>
		`;
	}

	getIneligibleTemplate() {
		return `
			<div class="result-card warning-card">
				<div class="result-header">
					<h2 class="result-title">Thanks for completing the quiz!</h2>
					<p class="result-subtitle">We're ready to connect you with a registered dietitian.</p>
				</div>
				<div class="result-content">
					<p>Based on your insurance information, you may not be eligible for covered nutrition counseling. However, we have affordable self-pay options available.</p>
				</div>
				<div class="result-actions">
					<a href="${this.resultUrl}" class="result-button">Explore Options</a>
				</div>
			</div>
		`;
	}

	getGenericTemplate() {
		return `
			<div class="result-card">
				<div class="result-header">
					<h2 class="result-title">Thanks for completing the quiz!</h2>
					<p class="result-subtitle">We're ready to help you on your health journey.</p>
				</div>
				<div class="result-actions">
					<a href="${this.resultUrl}" class="result-button">Continue</a>
				</div>
			</div>
		`;
	}

	getErrorTitle(errorCode) {
		const errorTitles = {
			42: "Insurance Information Issue",
			43: "Coverage Verification Problem",
			72: "Plan Details Unavailable",
			73: "Eligibility Check Failed",
			75: "Coverage Status Unknown",
			79: "Verification Timeout"
		};
		return errorTitles[errorCode] || "Verification Issue";
	}

	attachEventListeners() {
		const buttons = this.shadowRoot.querySelectorAll(".result-button");
		buttons.forEach(button => {
			button.addEventListener("click", e => {
				this.dispatchEvent(
					new CustomEvent("result-action", {
						detail: {
							resultType: this.resultType,
							action: "button-click",
							url: button.href
						},
						bubbles: true
					})
				);
			});
		});
	}

	setResultData(type, data, url) {
		this.resultType = type;
		this.resultData = data;
		this.resultUrl = url;
		this.render();
	}
}

customElements.define("quiz-result-card", QuizResultCard);
