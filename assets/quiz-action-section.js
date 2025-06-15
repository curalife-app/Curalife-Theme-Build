import { QuizBaseComponent, quizComponentRegistry } from "../base/quiz-base-component.js";

/**
 * Action Section Component
 *
 * A reusable component for displaying call-to-action sections with buttons,
 * information text, and feature highlights.
 *
 * Usage:
 * <quiz-action-section title="Schedule your consultation" type="primary">
 *   <div slot="info">
 *     <quiz-benefit-item icon="checkmark" text="Usually recommend 6 consultations"></quiz-benefit-item>
 *   </div>
 *   <div slot="action">
 *     <a href="/booking" class="quiz-booking-button">Proceed to booking</a>
 *   </div>
 * </quiz-action-section>
 */
class QuizActionSection extends QuizBaseComponent {
	static get observedAttributes() {
		return ["title", "type", "background-color", "result-url"];
	}

	getTemplate() {
		const title = this.getAttribute("title") || "Schedule your initial online consultation now";
		const type = this.getAttribute("type") || "default";
		const backgroundColor = this.getAttribute("background-color") || "#F1F8F4";
		const resultUrl = this.getAttribute("result-url") || "#";

		return `
      <div class="quiz-action-section" data-type="${type}" style="background-color: ${backgroundColor};">
        <div class="quiz-action-content">
          <div class="quiz-action-header">
            <h3 class="quiz-action-title">${this.sanitizeHTML(title)}</h3>
          </div>
          <div class="quiz-action-details">
            <div class="quiz-action-info">
              <div class="quiz-action-info-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.58 4.17L15.83 15.42L2.08 1.67L17.83 13.75L8.33 16.25" stroke="#418865" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="quiz-action-info-text">Our dietitians usually recommend minimum 6 consultations over 6 months, Today, just book your first.</div>
            </div>
            <div class="quiz-action-feature">
              <div class="quiz-action-feature-icon">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1.67 2.5L18.33 18.17L13.33 1.67L5 5L6.67 10.42" stroke="#418865" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div class="quiz-action-feature-text">Free cancellation up to 24h before</div>
            </div>
          </div>
          <a href="${resultUrl}" class="quiz-booking-button">Proceed to booking</a>

          <!-- Slots for additional content -->
          <slot></slot>
        </div>
      </div>
    `;
	}

	getStyles() {
		return `
      ${super.getStyles()}

      :host {
        display: block;
        margin-bottom: 72px;
        align-self: stretch;
      }

      .quiz-action-section {
        background-color: #f1f8f4;
        border-radius: 20px;
        padding: 32px;
        align-self: stretch;
      }

      .quiz-action-content {
        display: flex;
        flex-direction: column;
        gap: 28px;
        align-self: stretch;
      }

      .quiz-action-header {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .quiz-action-title {
        font-family: "PP Radio Grotesk", sans-serif;
        font-size: 24px;
        font-weight: 700;
        line-height: 1.3333333333333333em;
        color: #121212;
      }

      .quiz-action-details {
        display: flex;
        flex-direction: column;
        gap: 12px;
        align-self: stretch;
        max-width: 550px;
      }

      .quiz-action-info {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        align-self: stretch;
      }

      .quiz-action-info-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        margin-top: 2px;
      }

      .quiz-action-info-text {
        line-height: 1.4444444444444444em;
        color: #121212;
        flex: 1;
      }

      .quiz-action-feature {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .quiz-action-feature-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      .quiz-action-feature-text {
        font-family: "DM Sans", sans-serif;
        font-size: 18px;
        font-weight: 400;
        line-height: 1.4444444444444444em;
        color: #121212;
      }

      .quiz-booking-button {
        background-color: #306e51;
        color: white;
        border: none;
        border-radius: 300px;
        padding: 14px 40px;
        font-family: "DM Sans", sans-serif;
        font-size: 18px;
        font-weight: 600;
        line-height: 1.3333333333333333em;
        text-align: center;
        cursor: pointer;
        transition: all var(--quiz-transition-fast);
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: fit-content;
        margin-top: 0;
      }

      .quiz-booking-button:hover {
        background-color: var(--quiz-primary-hover);
        transform: translateY(-1px);
      }

      .quiz-booking-button:disabled {
        background-color: #6c757d;
        cursor: not-allowed;
        transform: none;
      }

      .quiz-booking-button:disabled:hover {
        background-color: #6c757d;
        transform: none;
      }

      /* Mobile responsive styles */
      @media (max-width: 768px) {
        :host {
          margin-bottom: 72px;
        }

        .quiz-action-section {
          padding: 32px;
        }

        .quiz-action-title {
          font-size: 24px;
        }

        .quiz-action-details {
          gap: 12px;
        }

        .quiz-booking-button {
          padding: 14px 40px;
          font-size: 18px;
          margin-top: 0;
        }
      }
    `;
	}

	render() {
		this.renderTemplate();
		this.updateBackgroundColor();
	}

	handleAttributeChange(name, oldValue, newValue) {
		if (name === "background-color") {
			this.updateBackgroundColor();
		}
	}

	updateBackgroundColor() {
		const backgroundColor = this.getAttribute("background-color");
		if (backgroundColor) {
			const section = this.querySelector(".quiz-action-section");
			if (section) {
				section.style.background = backgroundColor;
			}
		}
	}

	onConnected() {
		// Dispatch event when action section is ready
		this.dispatchCustomEvent("quiz-action-section-ready", {
			title: this.getAttribute("title"),
			type: this.getAttribute("type")
		});
	}

	/**
	 * Utility method to set action data programmatically
	 */
	setAction(title, type = "default", backgroundColor = null) {
		this.setAttributes({
			title,
			type,
			"background-color": backgroundColor
		});
	}

	/**
	 * Get action data
	 */
	getAction() {
		return {
			title: this.getAttribute("title"),
			type: this.getAttribute("type"),
			backgroundColor: this.getAttribute("background-color")
		};
	}
}

// Register the component
if (!customElements.get("quiz-action-section")) {
	quizComponentRegistry.register("quiz-action-section", QuizActionSection);
}

export default QuizActionSection;
