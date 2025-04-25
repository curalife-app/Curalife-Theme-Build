/**
 * Product Quiz for Shopify
 *
 * This script handles the product quiz functionality.
 * It loads quiz data from a JSON file and guides the user through
 * a series of questions to provide product recommendations.
 */

class ProductQuiz {
	constructor(options = {}) {
		// DOM elements
		this.container = document.getElementById("product-quiz");
		if (!this.container) return;

		this.intro = this.container.querySelector(".quiz-intro");
		this.questions = this.container.querySelector(".quiz-questions");
		this.results = this.container.querySelector(".quiz-results");
		this.error = this.container.querySelector(".quiz-error");
		this.loading = this.container.querySelector(".quiz-loading");

		this.progressBar = this.container.querySelector(".quiz-progress-bar");
		this.questionContainer = this.container.querySelector(".quiz-question-container");
		this.navigationButtons = this.container.querySelector(".quiz-navigation");
		this.prevButton = this.container.querySelector("#quiz-prev-button");
		this.nextButton = this.container.querySelector("#quiz-next-button");
		this.startButton = this.container.querySelector("#quiz-start-button");

		// Options
		this.dataUrl = options.dataUrl || this.container.getAttribute("data-quiz-url") || "/apps/product-quiz/data.json";

		// State
		this.quizData = null;
		this.currentQuestionIndex = 0;
		this.responses = [];
		this.submitting = false;

		// Initialize
		this.init();
	}

	async init() {
		// Add event listeners
		if (this.startButton) {
			this.startButton.addEventListener("click", () => this.startQuiz());
		}

		if (this.prevButton) {
			this.prevButton.addEventListener("click", () => this.goToPreviousQuestion());
		}

		if (this.nextButton) {
			this.nextButton.addEventListener("click", () => this.goToNextQuestion());
		}
	}

	async startQuiz() {
		// Hide intro, show questions
		this.intro.style.display = "none";
		this.questions.style.display = "block";
		this.loading.style.display = "flex";

		try {
			// Fetch quiz data
			await this.loadQuizData();

			// Initialize responses array with empty values
			this.responses = this.quizData.questions.map(q => ({ questionId: q.id, answer: null }));

			// Hide loading indicator
			this.loading.style.display = "none";

			// Render the first question
			this.renderCurrentQuestion();
			this.updateNavigation();
		} catch (error) {
			console.error("Failed to load quiz data:", error);
			this.loading.style.display = "none";
			this.error.style.display = "block";
		}
	}

	async loadQuizData() {
		const response = await fetch(this.dataUrl);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		this.quizData = await response.json();
		return this.quizData;
	}

	renderCurrentQuestion() {
		const question = this.quizData.questions[this.currentQuestionIndex];
		const response = this.responses[this.currentQuestionIndex];

		// Update progress bar
		const progress = ((this.currentQuestionIndex + 1) / this.quizData.questions.length) * 100;
		this.progressBar.style.width = `${progress}%`;

		// Create question HTML
		let questionHTML = `
      <div class="quiz-fade-in">
        <h3 class="quiz-question-title">${question.text}</h3>
        ${question.description ? `<p class="quiz-question-description">${question.description}</p>` : ""}
    `;

		// Add question type specific HTML
		switch (question.type) {
			case "multiple-choice":
				questionHTML += this.renderMultipleChoice(question, response);
				break;
			case "checkbox":
				questionHTML += this.renderCheckbox(question, response);
				break;
			case "text":
				questionHTML += this.renderTextInput(question, response);
				break;
			case "textarea":
				questionHTML += this.renderTextarea(question, response);
				break;
			case "rating":
				questionHTML += this.renderRating(question, response);
				break;
			default:
				questionHTML += '<p class="quiz-error">Unknown question type</p>';
		}

		questionHTML += "</div>";

		// Set the HTML
		this.questionContainer.innerHTML = questionHTML;

		// Add event listeners for the new question
		this.attachQuestionEventListeners(question);
	}

	renderMultipleChoice(question, response) {
		let html = '<div class="quiz-options">';

		question.options.forEach(option => {
			html += `
        <div class="quiz-option-item">
          <input type="radio" id="${option.id}" name="question-${question.id}" value="${option.id}"
            ${response.answer === option.id ? "checked" : ""}>
          <label class="quiz-option-label" for="${option.id}">${option.text}</label>
        </div>
      `;
		});

		html += "</div>";
		return html;
	}

	renderCheckbox(question, response) {
		const selectedOptions = Array.isArray(response.answer) ? response.answer : [];

		let html = '<div class="quiz-options">';

		question.options.forEach(option => {
			html += `
        <div class="quiz-option-item">
          <input type="checkbox" id="${option.id}" name="question-${question.id}" value="${option.id}"
            ${selectedOptions.includes(option.id) ? "checked" : ""}>
          <label class="quiz-option-label" for="${option.id}">${option.text}</label>
        </div>
      `;
		});

		html += "</div>";
		return html;
	}

	renderTextInput(question, response) {
		return `
      <div class="quiz-text-answer">
        <input type="text" id="question-${question.id}" class="quiz-text-input"
          placeholder="${question.placeholder || "Type your answer here..."}"
          value="${response.answer || ""}">
      </div>
    `;
	}

	renderTextarea(question, response) {
		return `
      <div class="quiz-text-answer">
        <textarea id="question-${question.id}" class="quiz-textarea" rows="4"
          placeholder="${question.placeholder || "Type your answer here..."}">${response.answer || ""}</textarea>
      </div>
    `;
	}

	renderRating(question, response) {
		return `
      <div class="quiz-rating-answer">
        <input type="range" id="question-${question.id}" class="quiz-rating-slider"
          min="1" max="10" step="1" value="${response.answer || 5}">
        <div class="quiz-rating-labels">
          <span>1</span>
          <span>5</span>
          <span>10</span>
        </div>
      </div>
    `;
	}

	attachQuestionEventListeners(question) {
		switch (question.type) {
			case "multiple-choice":
				const radioInputs = this.questionContainer.querySelectorAll(`input[name="question-${question.id}"]`);
				radioInputs.forEach(input => {
					input.addEventListener("change", () => {
						this.handleAnswer(input.value);
					});
				});
				break;

			case "checkbox":
				const checkboxInputs = this.questionContainer.querySelectorAll(`input[name="question-${question.id}"]`);
				checkboxInputs.forEach(input => {
					input.addEventListener("change", () => {
						const selectedOptions = Array.from(checkboxInputs)
							.filter(cb => cb.checked)
							.map(cb => cb.value);
						this.handleAnswer(selectedOptions);
					});
				});
				break;

			case "text":
			case "textarea":
				const textInput = this.questionContainer.querySelector(`#question-${question.id}`);
				textInput.addEventListener("input", () => {
					this.handleAnswer(textInput.value);
				});
				break;

			case "rating":
				const ratingInput = this.questionContainer.querySelector(`#question-${question.id}`);
				ratingInput.addEventListener("input", () => {
					this.handleAnswer(Number.parseInt(ratingInput.value, 10));
				});
				break;
		}
	}

	handleAnswer(answer) {
		if (!this.quizData) return;

		this.responses[this.currentQuestionIndex] = {
			questionId: this.quizData.questions[this.currentQuestionIndex].id,
			answer
		};

		this.updateNavigation();
	}

	updateNavigation() {
		// Disable/enable previous button
		this.prevButton.disabled = this.currentQuestionIndex === 0 || this.submitting;

		// Update next button text and state
		const isLastQuestion = this.currentQuestionIndex === this.quizData.questions.length - 1;
		this.nextButton.innerHTML = isLastQuestion
			? "Finish Quiz"
			: 'Next <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';

		// Check if current question has an answer
		const currentResponse = this.responses[this.currentQuestionIndex];
		const hasAnswer = currentResponse && currentResponse.answer !== null && (typeof currentResponse.answer !== "string" || currentResponse.answer.trim() !== "");

		this.nextButton.disabled = !hasAnswer || this.submitting;
	}

	goToPreviousQuestion() {
		if (this.currentQuestionIndex > 0) {
			this.currentQuestionIndex--;
			this.renderCurrentQuestion();
			this.updateNavigation();
		}
	}

	goToNextQuestion() {
		const currentQuestion = this.quizData.questions[this.currentQuestionIndex];
		const currentResponse = this.responses[this.currentQuestionIndex];

		// Check for conditional logic
		if (currentQuestion.conditionalNext && currentResponse.answer) {
			const nextQuestionId = currentQuestion.conditionalNext[currentResponse.answer.toString()];
			if (nextQuestionId) {
				const nextIndex = this.quizData.questions.findIndex(q => q.id === nextQuestionId);
				if (nextIndex !== -1) {
					this.currentQuestionIndex = nextIndex;
					this.renderCurrentQuestion();
					this.updateNavigation();
					return;
				}
			}
		}

		// If no conditional logic or condition not met, go to next question
		if (this.currentQuestionIndex < this.quizData.questions.length - 1) {
			this.currentQuestionIndex++;
			this.renderCurrentQuestion();
			this.updateNavigation();
		} else {
			// Submit the quiz
			this.finishQuiz();
		}
	}

	async finishQuiz() {
		if (!this.quizData || this.submitting) return;

		this.submitting = true;
		this.updateNavigation();

		// Show completion state
		this.nextButton.innerHTML = '<span class="quiz-spinner-small"></span> Finishing...';
		this.nextButton.disabled = true;
		this.prevButton.disabled = true;

		// Store responses (optional, maybe useful for analytics later)
		sessionStorage.setItem("quizResponses", JSON.stringify(this.responses));
		sessionStorage.setItem("quizId", this.quizData.id);

		// Simulate a short delay
		await new Promise(resolve => setTimeout(resolve, 500));

		// Hide questions and show a completion message
		this.questions.style.display = "none";
		this.results.style.display = "block"; // Re-purpose the results container
		this.results.innerHTML = `
      <div class="quiz-results-header quiz-fade-in">
        <h2>Quiz Complete!</h2>
        <p>Thank you for taking the quiz.</p>
        <button class="quiz-btn quiz-btn-primary" onclick="window.location.reload()">Take Again</button>
				<a href="/" class="quiz-btn quiz-btn-secondary">Return Home</a>
      </div>
    `;

		this.submitting = false; // Reset submitting state (though UI is now different)
	}
}

// Initialize the quiz when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
	new ProductQuiz();
});
