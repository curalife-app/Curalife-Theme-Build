import { QuizBaseComponent, quizComponentRegistry } from "../base/quiz-base-component.js";

/**
 * Coverage Card Component
 *
 * A reusable card component for displaying insurance coverage information.
 * Supports different types (success, error, warning) with appropriate styling.
 *
 * Usage:
 * <quiz-coverage-card title="What's Covered" type="success">
 *   <quiz-benefit-item icon="checkmark" text="5 sessions covered"></quiz-benefit-item>
 *   <quiz-benefit-item icon="calendar" text="Coverage expires Dec 31, 2025"></quiz-benefit-item>
 * </quiz-coverage-card>
 */
class QuizCoverageCard extends QuizBaseComponent {
	static get observedAttributes() {
		return ["title", "sessions-covered", "plan-end"];
	}

	connectedCallback() {
		this.render();
	}

	attributeChangedCallback() {
		if (this.isConnected) {
			this.render();
		}
	}

	render() {
		const title = this.getAttribute("title") || "Here's Your Offer";
		const sessionsCovered = this.getAttribute("sessions-covered") || "5";
		const planEnd = this.getAttribute("plan-end") || "Dec 31, 2025";

		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: block;
					margin: 1.5rem 0;
				}

				.quiz-coverage-card {
					background: white;
					border-radius: 8px;
					border: 1px solid #e5e7eb;
					padding: 1.5rem;
					box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
				}

				.quiz-coverage-card-title {
					font-size: 1.25rem;
					font-weight: 600;
					color: #1f2937;
					margin-bottom: 1rem;
				}

				.quiz-coverage-pricing {
					margin-bottom: 1.5rem;
				}

				.quiz-coverage-service-item {
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding: 0.75rem 0;
					border-bottom: 1px solid #f3f4f6;
				}

				.quiz-coverage-service-item:last-child {
					border-bottom: none;
				}

				.quiz-coverage-service {
					font-weight: 500;
					color: #374151;
				}

				.quiz-coverage-cost {
					display: flex;
					flex-direction: column;
					align-items: flex-end;
				}

				.quiz-coverage-copay {
					font-weight: 600;
					color: #059669;
					font-size: 1.1rem;
				}

				.quiz-coverage-original-price {
					font-size: 0.875rem;
					color: #9ca3af;
					text-decoration: line-through;
				}

				.quiz-coverage-divider {
					height: 1px;
					background: #e5e7eb;
					margin: 1rem 0;
				}

				.quiz-coverage-benefits {
					display: flex;
					flex-direction: column;
					gap: 0.75rem;
				}

				.quiz-coverage-benefit {
					display: flex;
					align-items: center;
					gap: 0.75rem;
				}

				.quiz-coverage-benefit-icon {
					flex-shrink: 0;
					width: 20px;
					height: 20px;
					color: #418865;
				}

				.quiz-coverage-benefit-text {
					font-size: 0.875rem;
					color: #374151;
				}

				@media (max-width: 768px) {
					.quiz-coverage-card {
						padding: 1rem;
					}

					.quiz-coverage-card-title {
						font-size: 1.125rem;
					}

					.quiz-coverage-service-item {
						flex-direction: column;
						align-items: flex-start;
						gap: 0.5rem;
					}

					.quiz-coverage-cost {
						align-items: flex-start;
					}
				}
			</style>

			<div class="quiz-coverage-card">
				<div class="quiz-coverage-card-title">${title}</div>

				<div class="quiz-coverage-pricing">
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

				<div class="quiz-coverage-divider"></div>

				<div class="quiz-coverage-benefits">
					<div class="quiz-coverage-benefit">
						<div class="quiz-coverage-benefit-icon">
							<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M7.08 1.67L3.33 1.67L3.33 18.33L10.83 18.33L10 7.5L16.67 5" stroke="#418865" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</div>
						<div class="quiz-coverage-benefit-text">${sessionsCovered} covered sessions remaining</div>
					</div>
					<div class="quiz-coverage-benefit">
						<div class="quiz-coverage-benefit-icon">
							<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M10.83 11.67L6.25 1.67L13.75 3.33L2.5 18.33L17.5 8.33" stroke="#418865" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</div>
						<div class="quiz-coverage-benefit-text">Coverage expires ${planEnd}</div>
					</div>
				</div>
			</div>
		`;
	}
}

// Register the component
if (!customElements.get("quiz-coverage-card")) {
	quizComponentRegistry.register("quiz-coverage-card", QuizCoverageCard);
}

export default QuizCoverageCard;
