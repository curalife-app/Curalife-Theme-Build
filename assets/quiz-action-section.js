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
        margin: 24px 0;
      }

      .quiz-action-section {
        background: #F1F8F4;
        border-radius: 8px;
        padding: 32px 24px;
        transition: var(--quiz-transition);
      }

      .quiz-action-content {
        max-width: 600px;
        margin: 0 auto;
      }

      .quiz-action-header {
        margin-bottom: 20px;
      }

      .quiz-action-title {
        font-size: 24px;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 8px 0;
        line-height: 1.3;
      }

      .quiz-action-details {
        margin-bottom: 24px;
      }

      .quiz-action-info {
        display: flex;
        align-items: flex-start;
        margin-bottom: 16px;
        gap: 12px;
      }

      .quiz-action-info-icon {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        margin-top: 2px;
      }

      .quiz-action-info-text {
        color: #374151;
        font-size: 14px;
        line-height: 1.5;
      }

      .quiz-action-feature {
        display: flex;
        align-items: flex-start;
        margin-bottom: 12px;
        gap: 12px;
      }

      .quiz-action-feature-icon {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        margin-top: 2px;
      }

      .quiz-action-feature-text {
        color: #374151;
        font-size: 14px;
        line-height: 1.5;
      }

      .quiz-booking-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: #306E51;
        color: white;
        padding: 16px 32px;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 600;
        font-size: 16px;
        transition: all 0.2s ease;
        border: none;
        cursor: pointer;
        min-width: 200px;
      }

      .quiz-booking-button:hover {
        background: #2a5d42;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(48, 110, 81, 0.3);
      }

      .quiz-booking-button:active {
        transform: translateY(0);
      }

      .quiz-booking-button:disabled {
        background: #6c757d;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }

      /* Responsive design */
      @media (max-width: 768px) {
        .quiz-action-section {
          padding: 24px 20px;
          margin: 20px 0;
        }

        .quiz-action-title {
          font-size: 20px;
        }

        .quiz-booking-button {
          padding: 14px 24px;
          font-size: 15px;
          min-width: 180px;
        }
      }

      @media (max-width: 480px) {
        .quiz-action-section {
          padding: 20px 16px;
        }

        .quiz-action-title {
          font-size: 18px;
        }

        .quiz-booking-button {
          width: 100%;
          max-width: 280px;
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
