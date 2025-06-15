/**
 * Quiz Scheduling Result Component
 *
 * Replaces _generateSchedulingSuccessHTML() and _generateSchedulingErrorHTML() methods from quiz.js
 * Handles both success and error states for scheduling workflow results
 */

import { QuizBaseComponent } from "../base/quiz-base-component.js";

export class QuizSchedulingResult extends QuizBaseComponent {
	static get observedAttributes() {
		return ["result-type", "scheduling-data", "error-message"];
	}

	getTemplate() {
		const resultType = this.getAttribute("result-type") || "success";
		const schedulingData = this.getSchedulingData();
		const errorMessage = this.getAttribute("error-message") || "";

		if (resultType === "success") {
			return this.renderSuccessResult(schedulingData);
		} else {
			return this.renderErrorResult(errorMessage, schedulingData);
		}
	}

	getStyles() {
		return `
			${super.getStyles()}

			.quiz-scheduling-container {
				display: flex;
				flex-direction: column;
				gap: 24px;
				max-width: 600px;
				margin: 0 auto;
			}

			.quiz-scheduling-header {
				text-align: center;
				padding: 24px;
				background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
				border-radius: var(--quiz-border-radius);
				border: 1px solid #bae6fd;
			}

			.quiz-scheduling-title {
				font-family: "PP Radio Grotesk", sans-serif;
				font-size: 28px;
				font-weight: 700;
				color: #0c4a6e;
				margin: 0 0 8px 0;
			}

			.quiz-scheduling-subtitle {
				font-size: 16px;
				color: #0369a1;
				margin: 0;
			}

			.quiz-appointment-card {
				background: white;
				border: 2px solid #22c55e;
				border-radius: var(--quiz-border-radius);
				padding: 24px;
				box-shadow: var(--quiz-shadow);
			}

			.quiz-appointment-header {
				display: flex;
				align-items: center;
				gap: 12px;
				margin-bottom: 16px;
			}

			.quiz-appointment-icon {
				width: 32px;
				height: 32px;
				background: #22c55e;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.quiz-appointment-title {
				font-family: "PP Radio Grotesk", sans-serif;
				font-size: 20px;
				font-weight: 600;
				color: #166534;
				margin: 0;
			}

			.quiz-appointment-details {
				display: flex;
				flex-direction: column;
				gap: 12px;
			}

			.quiz-appointment-detail {
				display: flex;
				align-items: center;
				gap: 8px;
				padding: 8px 0;
				border-bottom: 1px solid #f3f4f6;
			}

			.quiz-appointment-detail:last-child {
				border-bottom: none;
			}

			.quiz-appointment-detail-icon {
				width: 20px;
				height: 20px;
				color: #6b7280;
			}

			.quiz-appointment-detail-text {
				font-size: 14px;
				color: #374151;
			}

			.quiz-appointment-detail-value {
				font-weight: 600;
				color: #111827;
			}

			.quiz-next-steps {
				background: #f8fafc;
				border: 1px solid #e2e8f0;
				border-radius: var(--quiz-border-radius);
				padding: 20px;
			}

			.quiz-next-steps-title {
				font-family: "PP Radio Grotesk", sans-serif;
				font-size: 18px;
				font-weight: 600;
				color: #1e293b;
				margin: 0 0 12px 0;
			}

			.quiz-next-steps-list {
				list-style: none;
				padding: 0;
				margin: 0;
			}

			.quiz-next-steps-item {
				display: flex;
				align-items: flex-start;
				gap: 8px;
				margin-bottom: 8px;
				font-size: 14px;
				color: #475569;
			}

			.quiz-next-steps-item:last-child {
				margin-bottom: 0;
			}

			.quiz-next-steps-number {
				background: #3b82f6;
				color: white;
				width: 20px;
				height: 20px;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 12px;
				font-weight: 600;
				flex-shrink: 0;
			}

			.quiz-error-card {
				background: #fef2f2;
				border: 2px solid #fca5a5;
				border-radius: var(--quiz-border-radius);
				padding: 24px;
			}

			.quiz-error-header {
				display: flex;
				align-items: center;
				gap: 12px;
				margin-bottom: 16px;
			}

			.quiz-error-icon {
				width: 32px;
				height: 32px;
				background: #ef4444;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
			}

			.quiz-error-title {
				font-family: "PP Radio Grotesk", sans-serif;
				font-size: 20px;
				font-weight: 600;
				color: #dc2626;
				margin: 0;
			}

			.quiz-error-message {
				font-size: 16px;
				color: #991b1b;
				line-height: 1.5;
				margin-bottom: 16px;
			}

			.quiz-support-info {
				background: white;
				border: 1px solid #fca5a5;
				border-radius: var(--quiz-border-radius);
				padding: 16px;
			}

			.quiz-support-title {
				font-weight: 600;
				color: #dc2626;
				margin: 0 0 8px 0;
			}

			.quiz-support-text {
				font-size: 14px;
				color: #7f1d1d;
				margin: 0;
			}

			.quiz-action-buttons {
				display: flex;
				gap: 12px;
				justify-content: center;
				margin-top: 24px;
			}

			.quiz-button {
				padding: 12px 24px;
				border-radius: var(--quiz-border-radius);
				font-weight: 600;
				text-decoration: none;
				transition: var(--quiz-transition);
				cursor: pointer;
				border: none;
				font-size: 16px;
			}

			.quiz-button--primary {
				background: #3b82f6;
				color: white;
			}

			.quiz-button--primary:hover {
				background: #2563eb;
			}

			.quiz-button--secondary {
				background: white;
				color: #3b82f6;
				border: 2px solid #3b82f6;
			}

			.quiz-button--secondary:hover {
				background: #eff6ff;
			}

			@media (max-width: 768px) {
				.quiz-scheduling-title {
					font-size: 24px;
				}

				.quiz-appointment-details {
					gap: 8px;
				}

				.quiz-action-buttons {
					flex-direction: column;
				}
			}
		`;
	}

	render() {
		this.renderTemplate();
		this.attachEventListeners();
	}

	attachEventListeners() {
		// Handle button clicks
		const buttons = this.root.querySelectorAll(".quiz-button");
		buttons.forEach(button => {
			button.addEventListener("click", e => {
				const action = button.getAttribute("data-action");
				if (action) {
					this.dispatchEvent(
						new CustomEvent("scheduling-action", {
							detail: { action, target: e.target },
							bubbles: true
						})
					);
				}
			});
		});
	}

	renderSuccessResult(schedulingData) {
		if (!schedulingData) {
			return this.renderGenericSuccess();
		}

		const appointment = schedulingData.appointment || {};
		const dietitian = schedulingData.dietitian || {};

		return `
			<div class="quiz-scheduling-container">
				<div class="quiz-scheduling-header">
					<h2 class="quiz-scheduling-title">🎉 Appointment Confirmed!</h2>
					<p class="quiz-scheduling-subtitle">Your consultation has been successfully scheduled</p>
				</div>

				<div class="quiz-appointment-card">
					<div class="quiz-appointment-header">
						<div class="quiz-appointment-icon">
							<svg width="20" height="20" viewBox="0 0 20 20" fill="white">
								<path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
							</svg>
						</div>
						<h3 class="quiz-appointment-title">Your Appointment Details</h3>
					</div>

					<div class="quiz-appointment-details">
						${
							appointment.date
								? `
							<div class="quiz-appointment-detail">
								<svg class="quiz-appointment-detail-icon" viewBox="0 0 20 20" fill="currentColor">
									<path d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zM4 9h12v8H4V9z"/>
								</svg>
								<span class="quiz-appointment-detail-text">Date: <span class="quiz-appointment-detail-value">${appointment.date}</span></span>
							</div>
						`
								: ""
						}

						${
							appointment.time
								? `
							<div class="quiz-appointment-detail">
								<svg class="quiz-appointment-detail-icon" viewBox="0 0 20 20" fill="currentColor">
									<path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V5z"/>
								</svg>
								<span class="quiz-appointment-detail-text">Time: <span class="quiz-appointment-detail-value">${appointment.time}</span></span>
							</div>
						`
								: ""
						}

						${
							dietitian.name
								? `
							<div class="quiz-appointment-detail">
								<svg class="quiz-appointment-detail-icon" viewBox="0 0 20 20" fill="currentColor">
									<path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
								</svg>
								<span class="quiz-appointment-detail-text">Dietitian: <span class="quiz-appointment-detail-value">${dietitian.name}</span></span>
							</div>
						`
								: ""
						}

						${
							appointment.type
								? `
							<div class="quiz-appointment-detail">
								<svg class="quiz-appointment-detail-icon" viewBox="0 0 20 20" fill="currentColor">
									<path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
								</svg>
								<span class="quiz-appointment-detail-text">Type: <span class="quiz-appointment-detail-value">${appointment.type}</span></span>
							</div>
						`
								: ""
						}
					</div>
				</div>

				<div class="quiz-next-steps">
					<h4 class="quiz-next-steps-title">What happens next?</h4>
					<ul class="quiz-next-steps-list">
						<li class="quiz-next-steps-item">
							<span class="quiz-next-steps-number">1</span>
							<span>You'll receive a confirmation email with your appointment details and preparation instructions</span>
						</li>
						<li class="quiz-next-steps-item">
							<span class="quiz-next-steps-number">2</span>
							<span>Your dietitian will call you at the scheduled time for your consultation</span>
						</li>
						<li class="quiz-next-steps-item">
							<span class="quiz-next-steps-number">3</span>
							<span>After your consultation, you'll receive a personalized nutrition plan</span>
						</li>
					</ul>
				</div>

				<div class="quiz-action-buttons">
					<button class="quiz-button quiz-button--primary" data-action="add-to-calendar">
						Add to Calendar
					</button>
					<button class="quiz-button quiz-button--secondary" data-action="view-details">
						View Full Details
					</button>
				</div>
			</div>
		`;
	}

	renderGenericSuccess() {
		return `
			<div class="quiz-scheduling-container">
				<div class="quiz-scheduling-header">
					<h2 class="quiz-scheduling-title">🎉 Success!</h2>
					<p class="quiz-scheduling-subtitle">Your request has been processed successfully</p>
				</div>

				<div class="quiz-appointment-card">
					<div class="quiz-appointment-header">
						<div class="quiz-appointment-icon">
							<svg width="20" height="20" viewBox="0 0 20 20" fill="white">
								<path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
							</svg>
						</div>
						<h3 class="quiz-appointment-title">Request Completed</h3>
					</div>
					<p class="quiz-appointment-detail-text">We've received your information and will be in touch soon with next steps.</p>
				</div>

				<div class="quiz-action-buttons">
					<button class="quiz-button quiz-button--primary" data-action="continue">
						Continue
					</button>
				</div>
			</div>
		`;
	}

	renderErrorResult(errorMessage, schedulingData) {
		return `
			<div class="quiz-scheduling-container">
				<div class="quiz-scheduling-header">
					<h2 class="quiz-scheduling-title">⚠️ Scheduling Issue</h2>
					<p class="quiz-scheduling-subtitle">We encountered a problem with your appointment</p>
				</div>

				<div class="quiz-error-card">
					<div class="quiz-error-header">
						<div class="quiz-error-icon">
							<svg width="20" height="20" viewBox="0 0 20 20" fill="white">
								<path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/>
							</svg>
						</div>
						<h3 class="quiz-error-title">Unable to Complete Scheduling</h3>
					</div>

					<p class="quiz-error-message">
						${errorMessage || "There was an unexpected error while trying to schedule your appointment. Please try again or contact our support team for assistance."}
					</p>

					<div class="quiz-support-info">
						<h4 class="quiz-support-title">Need Help?</h4>
						<p class="quiz-support-text">
							Our support team is available to help you schedule your appointment manually.
							Contact us at support@curalife.com or call (555) 123-4567.
						</p>
					</div>
				</div>

				<div class="quiz-action-buttons">
					<button class="quiz-button quiz-button--primary" data-action="retry">
						Try Again
					</button>
					<button class="quiz-button quiz-button--secondary" data-action="contact-support">
						Contact Support
					</button>
				</div>
			</div>
		`;
	}

	// Utility methods
	getSchedulingData() {
		try {
			const dataAttr = this.getAttribute("scheduling-data");
			return dataAttr ? JSON.parse(dataAttr) : null;
		} catch (error) {
			console.error("Error parsing scheduling data:", error);
			return null;
		}
	}

	handleAttributeChange(name, oldValue, newValue) {
		if (["result-type", "scheduling-data", "error-message"].includes(name)) {
			this.render();
		}
	}
}

// Register the component
if (!customElements.get("quiz-scheduling-result")) {
	customElements.define("quiz-scheduling-result", QuizSchedulingResult);
}

export default QuizSchedulingResult;
