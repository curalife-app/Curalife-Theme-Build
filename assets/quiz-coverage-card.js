import { QuizBaseComponent } from "../quiz-base-component.js";

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
export class QuizCoverageCard extends QuizBaseComponent {
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
		const title = this.getAttribute("title") || "Coverage Details";
		const sessionsCovered = this.getAttribute("sessions-covered") || "5";
		const planEnd = this.getAttribute("plan-end") || "Dec 31, 2025";

		this.shadowRoot.innerHTML = `
			<style>
				:host {
					display: block;
					margin: 1.5rem 0;
				}

				.coverage-card {
					background: white;
					border-radius: 8px;
					border: 1px solid #e5e7eb;
					padding: 1.5rem;
					box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
				}

				.coverage-title {
					font-size: 1.25rem;
					font-weight: 600;
					color: #1f2937;
					margin-bottom: 1rem;
					text-align: center;
				}

				.coverage-pricing {
					margin-bottom: 1.5rem;
				}

				.service-item {
					display: flex;
					justify-content: space-between;
					align-items: center;
					padding: 0.75rem 0;
					border-bottom: 1px solid #f3f4f6;
				}

				.service-item:last-child {
					border-bottom: none;
				}

				.service-name {
					font-weight: 500;
					color: #374151;
				}

				.service-cost {
					display: flex;
					flex-direction: column;
					align-items: flex-end;
				}

				.copay {
					font-weight: 600;
					color: #059669;
					font-size: 1.1rem;
				}

				.original-price {
					font-size: 0.875rem;
					color: #9ca3af;
					text-decoration: line-through;
				}

				.divider {
					height: 1px;
					background: #e5e7eb;
					margin: 1rem 0;
				}

				.benefits {
					display: flex;
					flex-direction: column;
					gap: 0.75rem;
				}

				.benefit {
					display: flex;
					align-items: center;
					gap: 0.75rem;
				}

				.benefit-icon {
					flex-shrink: 0;
					width: 20px;
					height: 20px;
					color: #059669;
				}

				.benefit-text {
					font-size: 0.875rem;
					color: #374151;
				}

				@media (max-width: 768px) {
					.coverage-card {
						padding: 1rem;
					}

					.coverage-title {
						font-size: 1.125rem;
					}

					.service-item {
						flex-direction: column;
						align-items: flex-start;
						gap: 0.5rem;
					}

					.service-cost {
						align-items: flex-start;
					}
				}
			</style>

			<div class="coverage-card">
				<div class="coverage-title">${title}</div>

				<div class="coverage-pricing">
					<div class="service-item">
						<div class="service-name">Initial consultation – 60 minutes</div>
						<div class="service-cost">
							<div class="copay">Co-pay: $0*</div>
							<div class="original-price">$100</div>
						</div>
					</div>
					<div class="service-item">
						<div class="service-name">Follow-up consultation – 30 minutes</div>
						<div class="service-cost">
							<div class="copay">Co-pay: $0*</div>
							<div class="original-price">$50</div>
						</div>
					</div>
				</div>

				<div class="divider"></div>

				<div class="benefits">
					<div class="benefit">
						<div class="benefit-icon">
							<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M7.08 1.67L3.33 1.67L3.33 18.33L10.83 18.33L10 7.5L16.67 5" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</div>
						<div class="benefit-text">${sessionsCovered} covered sessions remaining</div>
					</div>
					<div class="benefit">
						<div class="benefit-icon">
							<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M10.83 11.67L6.25 1.67L13.75 3.33L2.5 18.33L17.5 8.33" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</div>
						<div class="benefit-text">Coverage expires ${planEnd}</div>
					</div>
				</div>
			</div>
		`;
	}
}
