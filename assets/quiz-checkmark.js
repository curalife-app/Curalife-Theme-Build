/**
 * Quiz Checkmark Component
 *
 * A reusable Web Component for displaying animated checkmarks in quiz questions.
 * Provides consistent styling and smooth animations across all question types.
 *
 * Features:
 * - Smooth appear/disappear animations
 * - Consistent green circular design
 * - Configurable animation timing
 * - Accessible markup
 *
 * Usage:
 * <quiz-checkmark></quiz-checkmark>
 * <quiz-checkmark animation="bounce"></quiz-checkmark>
 * <quiz-checkmark size="small"></quiz-checkmark>
 */

export class QuizCheckmarkComponent extends HTMLElement {
	static get observedAttributes() {
		return ["animation", "size"];
	}

	constructor() {
		super();
		this.animationType = "bounce"; // bounce, fade, scale
		this.size = "normal"; // small, normal, large
	}

	connectedCallback() {
		this.render();
		this.setupAttributes();
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue !== newValue) {
			this.handleAttributeChange(name, newValue);
		}
	}

	setupAttributes() {
		this.animationType = this.getAttribute("animation") || "bounce";
		this.size = this.getAttribute("size") || "normal";
	}

	handleAttributeChange(name, newValue) {
		switch (name) {
			case "animation":
				this.animationType = newValue || "bounce";
				break;
			case "size":
				this.size = newValue || "normal";
				break;
		}
		this.updateStyles();
	}

	render() {
		this.innerHTML = `
			<div class="quiz-checkmark-container">
				<svg class="quiz-checkmark-svg" viewBox="0 0 19 19" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path fill-rule="evenodd" clip-rule="evenodd" d="M9.79158 18.75C4.84404 18.75 0.833252 14.7393 0.833252 9.79168C0.833252 4.84413 4.84404 0.833344 9.79158 0.833344C14.7392 0.833344 18.7499 4.84413 18.7499 9.79168C18.7499 14.7393 14.7392 18.75 9.79158 18.75ZM13.7651 7.82516C14.0598 7.47159 14.012 6.94613 13.6584 6.65148C13.3048 6.35685 12.7793 6.40462 12.4848 6.75818L8.90225 11.0572L7.04751 9.20243C6.72207 8.87701 6.19444 8.87701 5.86899 9.20243C5.54356 9.52784 5.54356 10.0555 5.86899 10.3809L8.369 12.8809C8.53458 13.0465 8.76208 13.1348 8.996 13.1242C9.22992 13.1135 9.44858 13.005 9.59842 12.8252L13.7651 7.82516Z" fill="#418865"/>
				</svg>
			</div>
		`;

		this.addStyles();
		this.updateStyles();
	}

	addStyles() {
		if (!document.getElementById("quiz-checkmark-styles")) {
			const style = document.createElement("style");
			style.id = "quiz-checkmark-styles";
			style.textContent = `
				quiz-checkmark {
					display: inline-block;
					flex-shrink: 0;
				}

				.quiz-checkmark-container {
					display: flex;
					align-items: center;
					justify-content: center;
				}

				.quiz-checkmark-svg {
					display: block;
				}

				/* Size variants */
				quiz-checkmark[size="small"] .quiz-checkmark-svg {
					width: 16px;
					height: 16px;
				}

				quiz-checkmark[size="normal"] .quiz-checkmark-svg {
					width: 19px;
					height: 19px;
				}

				quiz-checkmark[size="large"] .quiz-checkmark-svg {
					width: 24px;
					height: 24px;
				}

				/* Animation variants */
				quiz-checkmark[animation="bounce"] {
					animation: checkmarkBounce 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
				}

				quiz-checkmark[animation="fade"] {
					animation: checkmarkFade 0.3s ease-out;
				}

				quiz-checkmark[animation="scale"] {
					animation: checkmarkScale 0.3s ease-out;
				}

				quiz-checkmark[animation="none"] {
					animation: none;
				}

				/* Keyframe animations */
				@keyframes checkmarkBounce {
					0% {
						opacity: 0;
						transform: scale(0.3);
					}
					50% {
						opacity: 1;
						transform: scale(1.1);
					}
					100% {
						opacity: 1;
						transform: scale(1);
					}
				}

				@keyframes checkmarkFade {
					0% {
						opacity: 0;
					}
					100% {
						opacity: 1;
					}
				}

				@keyframes checkmarkScale {
					0% {
						opacity: 0;
						transform: scale(0.8);
					}
					100% {
						opacity: 1;
						transform: scale(1);
					}
				}

				/* Disappear animations */
				quiz-checkmark.disappearing[animation="bounce"] {
					animation: checkmarkBounceOut 0.2s ease-out forwards;
				}

				quiz-checkmark.disappearing[animation="fade"] {
					animation: checkmarkFadeOut 0.2s ease-out forwards;
				}

				quiz-checkmark.disappearing[animation="scale"] {
					animation: checkmarkScaleOut 0.2s ease-out forwards;
				}

				@keyframes checkmarkBounceOut {
					0% {
						opacity: 1;
						transform: scale(1);
					}
					100% {
						opacity: 0;
						transform: scale(0.3);
					}
				}

				@keyframes checkmarkFadeOut {
					0% {
						opacity: 1;
					}
					100% {
						opacity: 0;
					}
				}

				@keyframes checkmarkScaleOut {
					0% {
						opacity: 1;
						transform: scale(1);
					}
					100% {
						opacity: 0;
						transform: scale(0.8);
					}
				}
			`;
			document.head.appendChild(style);
		}
	}

	updateStyles() {
		// Update attributes for CSS selectors
		this.setAttribute("animation", this.animationType);
		this.setAttribute("size", this.size);
	}

	// Public API methods
	show(animationType = null) {
		if (animationType) {
			this.animationType = animationType;
		}
		this.classList.remove("disappearing");
		this.updateStyles();
		this.style.display = "inline-block";
	}

	hide(animationType = null, callback = null) {
		if (animationType) {
			this.animationType = animationType;
		}
		this.classList.add("disappearing");
		this.updateStyles();

		const duration = 200; // Match the animation duration
		setTimeout(() => {
			this.style.display = "none";
			this.classList.remove("disappearing");
			if (callback) callback();
		}, duration);
	}

	setSize(size) {
		this.size = size;
		this.updateStyles();
	}

	setAnimation(animationType) {
		this.animationType = animationType;
		this.updateStyles();
	}
}

// Register the component
if (!customElements.get("quiz-checkmark")) {
	customElements.define("quiz-checkmark", QuizCheckmarkComponent);
}

export default QuizCheckmarkComponent;
