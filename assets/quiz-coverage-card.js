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

		this.renderTemplate();
	}

	getTemplate() {
		const title = this.getAttribute("title") || "Here's Your Offer";
		const sessionsCovered = this.getAttribute("sessions-covered") || "5";
		const planEnd = this.getAttribute("plan-end") || "Dec 31, 2025";

		return `
			<div class="quiz-coverage-card">
				<div class="quiz-coverage-card-title">${title}</div>
				<div class="quiz-coverage-pricing">
					<div class="quiz-coverage-service-item">
						<div class="quiz-coverage-service">${sessionsCovered} sessions with a Registered Dietitian</div>
						<div class="quiz-coverage-cost">
							<div class="quiz-coverage-copay">$0 copay</div>
							<div class="quiz-coverage-original-price">$1,200</div>
						</div>
					</div>
				</div>
				<div class="quiz-coverage-divider"></div>
				<div class="quiz-coverage-benefits">
					<div class="quiz-coverage-benefit">
						<quiz-checkmark-icon class="quiz-coverage-benefit-icon"></quiz-checkmark-icon>
						<div class="quiz-coverage-benefit-text">${sessionsCovered} sessions covered</div>
					</div>
					<div class="quiz-coverage-benefit">
						<quiz-calendar-icon class="quiz-coverage-benefit-icon"></quiz-calendar-icon>
						<div class="quiz-coverage-benefit-text">Coverage expires ${planEnd}</div>
					</div>
				</div>
			</div>
		`;
	}

	getStyles() {
		return `
				:host {
					display: block;
				}

				.quiz-coverage-card {
					border: 1px solid #bdddc9;
					border-radius: 20px;
					padding: 32px;
					background-color: white;
					margin-bottom: 36px;
					align-self: stretch;
				}

				.quiz-coverage-card-title {
					font-family: "PP Radio Grotesk", sans-serif;
					font-size: 24px;
					font-weight: 700;
					line-height: 1.3333333333333333em;
					color: #121212;
					margin-bottom: 16px;
				}

				.quiz-coverage-pricing {
					display: flex;
					flex-direction: column;
					gap: 8px;
					margin-bottom: 16px;
					width: fit-content;
				}

				.quiz-coverage-service-item {
					display: flex;
					align-items: center;
					gap: 32px;
					width: fit-content;
				}

				.quiz-coverage-service {
					font-family: "DM Sans", sans-serif;
					font-size: 18px;
					font-weight: 400;
					line-height: 1.4444444444444444em;
					color: #121212;
					flex: 1;
					width: 312px;
				}

				.quiz-coverage-cost {
					display: flex;
					align-items: center;
					gap: 4px;
				}

				.quiz-coverage-copay {
					font-family: "DM Sans", sans-serif;
					font-size: 18px;
					font-weight: 800;
					line-height: 1.4444444444444444em;
					color: #121212;
				}

				.quiz-coverage-original-price {
					font-family: "DM Sans", sans-serif;
					font-size: 18px;
					font-weight: 400;
					line-height: 1.3333333333333333em;
					color: #6d6d6d;
					text-decoration: line-through;
				}

				.quiz-coverage-divider {
					width: 100%;
					height: 0.5px;
					background-color: #bdddc9;
					margin: 16px 0;
				}

				.quiz-coverage-benefits {
					display: flex;
					flex-direction: column;
					gap: 12px;
				}

				.quiz-coverage-benefit {
					display: flex;
					align-items: center;
					gap: 8px;
				}

				.quiz-coverage-benefit-icon {
					width: 20px;
					height: 20px;
					flex-shrink: 0;
				}

				.quiz-coverage-benefit-text {
					font-family: "DM Sans", sans-serif;
					font-size: 16px;
					font-weight: 400;
					line-height: 1.5em;
					color: #4f4f4f;
				}

				@media (max-width: 768px) {
					.quiz-coverage-card {
						padding: 20px;
						margin-bottom: 28px;
						align-self: stretch;
						width: 100%;
					}

					.quiz-coverage-card-title {
						font-size: 24px;
						line-height: 1.3333333333333333em;
						margin-bottom: 12px;
					}

					.quiz-coverage-pricing {
						flex-direction: column;
						gap: 16px;
						align-items: stretch;
						margin-bottom: 16px;
					}

					.quiz-coverage-service-item {
						display: flex;
						flex-direction: column;
						gap: 8px;
						width: 100%;
						align-items: start;
					}

					.quiz-coverage-service {
						font-size: 18px;
						line-height: 1.3333333333333333em;
						width: unset;
					}

					.quiz-coverage-cost {
						display: flex;
						align-items: center;
						gap: 4px;
					}

					.quiz-coverage-copay {
						font-size: 18px;
						font-weight: 700;
						line-height: 1.3333333333333333em;
					}

					.quiz-coverage-original-price {
						font-size: 18px;
						line-height: 1.3333333333333333em;
					}

					.quiz-coverage-benefits {
						gap: 12px;
					}

					.quiz-coverage-benefit-text {
						font-size: 16px;
						line-height: 1.5em;
					}

					.quiz-coverage-divider {
						margin: 16px 0;
					}
				}
		`;
	}
}

// Register the component
if (!customElements.get("quiz-coverage-card")) {
	quizComponentRegistry.register("quiz-coverage-card", QuizCoverageCard);
}

export default QuizCoverageCard;
