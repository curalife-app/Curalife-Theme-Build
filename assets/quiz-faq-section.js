import { SharedStyles } from "../utils/shared-styles.js";

export class QuizFAQSection extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.faqData = [];
	}

	static get observedAttributes() {
		return ["faq-data"];
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (name === "faq-data" && newValue) {
			try {
				this.faqData = JSON.parse(newValue);
				this.render();
			} catch (error) {
				console.error("Invalid FAQ data:", error);
			}
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
		if (!this.faqData || this.faqData.length === 0) {
			return "<div></div>";
		}

		return `
			<div class="quiz-faq-section">
				<div class="quiz-faq-divider"></div>
				${this.faqData
					.map(
						faq => `
					<div class="quiz-faq-item" data-faq="${faq.id}" tabindex="0" role="button" aria-expanded="false">
						<div class="quiz-faq-content">
							<div class="quiz-faq-question-collapsed">${faq.question}</div>
							<div class="quiz-faq-answer">${faq.answer}</div>
						</div>
						<div class="quiz-faq-toggle">
							<svg class="quiz-faq-toggle-icon" width="32" height="32" viewBox="0 0 32 32" fill="none">
								<path d="M4 16H28" stroke="#4f4f4f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
								<path d="M16 4V28" stroke="#4f4f4f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</div>
					</div>
					<div class="quiz-faq-divider"></div>
				`
					)
					.join("")}
			</div>
		`;
	}

	getStyles() {
		return `
			:host {
				display: block;
			}
		`;
	}

	attachEventListeners() {
		const faqItems = this.shadowRoot.querySelectorAll(".quiz-faq-item");
		faqItems.forEach(item => {
			item.addEventListener("click", () => {
				const isExpanded = item.classList.contains("expanded");

				if (!isExpanded) {
					item.classList.add("expanded");
					item.setAttribute("aria-expanded", "true");
					const question = item.querySelector(".quiz-faq-question, .quiz-faq-question-collapsed");
					if (question) question.className = "quiz-faq-question";
				} else {
					item.classList.remove("expanded");
					item.setAttribute("aria-expanded", "false");
					const question = item.querySelector(".quiz-faq-question, .quiz-faq-question-collapsed");
					if (question) question.className = "quiz-faq-question-collapsed";
				}
			});

			// Keyboard support
			item.addEventListener("keydown", e => {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					item.click();
				}
			});
		});
	}

	// Public API for setting FAQ data
	setFAQData(faqData) {
		this.faqData = faqData;
		this.render();
	}
}

if (!customElements.get("quiz-faq-section")) {
	customElements.define("quiz-faq-section", QuizFAQSection);
}

export default QuizFAQSection;
