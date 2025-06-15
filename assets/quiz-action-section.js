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
		return ["title", "type", "background-color"];
	}

	getTemplate() {
		const title = this.getAttribute("title") || "";
		const type = this.getAttribute("type") || "default";

		return `
      <div class="quiz-action-section" data-type="${type}">
        <div class="quiz-action-content">
          ${
						title
							? `
            <div class="quiz-action-header">
              <h3 class="quiz-action-title">${this.sanitizeHTML(title)}</h3>
            </div>
          `
							: ""
					}

          <div class="quiz-action-details">
            <slot name="info"></slot>
          </div>

          <div class="quiz-action-buttons">
            <slot name="action"></slot>
          </div>

          <!-- Default slot for any additional content -->
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
        background: #f8f9fa;
        border-radius: var(--quiz-border-radius);
        padding: 32px 24px;
        text-align: center;
        transition: var(--quiz-transition);
      }

      :host([type="primary"]) .quiz-action-section {
        background: linear-gradient(135deg, #f1f8f4, #e8f5e8);
        border: 1px solid #d4edda;
      }

      :host([type="secondary"]) .quiz-action-section {
        background: linear-gradient(135deg, #f8f9fa, #e9ecef);
        border: 1px solid #dee2e6;
      }

      :host([type="warning"]) .quiz-action-section {
        background: linear-gradient(135deg, #fffaf0, #fef5e7);
        border: 1px solid #ffeaa7;
      }

      /* Custom background color support */
      :host([background-color]) .quiz-action-section {
        background: attr(background-color);
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
        color: var(--quiz-primary-color);
        margin: 0 0 8px 0;
        line-height: 1.3;
      }

      .quiz-action-details {
        margin-bottom: 24px;
      }

      .quiz-action-details ::slotted(*) {
        margin-bottom: 12px;
      }

      .quiz-action-buttons {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }

      /* Style slotted booking buttons */
      .quiz-action-buttons ::slotted(.quiz-booking-button) {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--quiz-secondary-color);
        color: white;
        padding: 16px 32px;
        border-radius: var(--quiz-border-radius);
        text-decoration: none;
        font-weight: 600;
        font-size: 16px;
        transition: var(--quiz-transition);
        border: none;
        cursor: pointer;
        min-width: 200px;
      }

      .quiz-action-buttons ::slotted(.quiz-booking-button:hover) {
        background: #2a5d42;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(48, 110, 81, 0.3);
      }

      .quiz-action-buttons ::slotted(.quiz-booking-button:active) {
        transform: translateY(0);
      }

      .quiz-action-buttons ::slotted(.quiz-booking-button:disabled) {
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

        .quiz-action-buttons ::slotted(.quiz-booking-button) {
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

        .quiz-action-buttons ::slotted(.quiz-booking-button) {
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
