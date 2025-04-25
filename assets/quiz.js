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
		this.productGrid = this.container.querySelector(".quiz-product-grid");
		this.shareButton = this.container.querySelector("#quiz-share-button");

		// Options
		this.dataUrl = options.dataUrl || this.container.getAttribute("data-quiz-url") || "/apps/product-quiz/data.json";
		this.redirectToProduct = options.redirectToProduct || false;

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

		if (this.shareButton) {
			this.shareButton.addEventListener("click", () => this.shareResults());
		}

		// Check if we should show results directly (if coming back from a shared link)
		const urlParams = new URLSearchParams(window.location.search);
		if (urlParams.has("quiz-results")) {
			this.showResults();
			return;
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
			? "See Results"
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
			this.handleSubmit();
		}
	}

	async handleSubmit() {
		if (!this.quizData || this.submitting) return;

		this.submitting = true;
		this.updateNavigation();

		try {
			// Show loading state
			this.nextButton.innerHTML = '<span class="quiz-spinner-small"></span> Submitting...';

			// Store responses in sessionStorage
			sessionStorage.setItem("quizResponses", JSON.stringify(this.responses));
			sessionStorage.setItem("quizId", this.quizData.id);

			// In a real implementation, you would send the responses to your server
			// and get personalized recommendations back.
			// For this demo, we'll just simulate a network delay
			await new Promise(resolve => setTimeout(resolve, 1000));

			// Show results
			this.showResults();
		} catch (error) {
			console.error("Failed to submit quiz responses:", error);
			this.submitting = false;
			this.updateNavigation();

			// Show error message
			alert("Failed to submit quiz. Please try again.");
		}
	}

	async showResults() {
		// Hide questions, show results
		this.questions.style.display = "none";
		this.intro.style.display = "none";
		this.results.style.display = "block";
		this.loading.style.display = "flex";

		try {
			// If we don't have quiz data yet, load it
			if (!this.quizData) {
				await this.loadQuizData();
			}

			// Get stored responses
			const responses = JSON.parse(sessionStorage.getItem("quizResponses")) || [];

			// In a real app, you would send the responses to the server
			// and get personalized recommendations back.
			// For this demo, we'll just use the recommendations from the JSON file.
			const recommendations = this.quizData.recommendations;

			// Hide loading indicator
			this.loading.style.display = "none";

			// Render product recommendations
			this.renderProductRecommendations(recommendations);

			// Update URL with a parameter to indicate we're showing results
			// This allows sharing the results page
			if (history.pushState) {
				const newUrl = new URL(window.location.href);
				newUrl.searchParams.set("quiz-results", "true");
				window.history.pushState({ path: newUrl.href }, "", newUrl.href);
			}
		} catch (error) {
			console.error("Failed to load quiz results:", error);
			this.loading.style.display = "none";
			this.error.style.display = "block";
		}
	}

	renderProductRecommendations(products) {
		let productsHTML = "";

		products.forEach(product => {
			productsHTML += `
        <div class="quiz-product-card">
          <div class="quiz-product-image">Product Image</div>
          <div class="quiz-product-details">
            <h3 class="quiz-product-title">${product.name}</h3>
            <p class="quiz-product-category">${product.category}</p>
            <p class="quiz-product-description">${product.description}</p>
            <div class="quiz-product-price">
              $${product.price.toFixed(2)}
              ${product.matchScore ? `<span class="quiz-match-badge">${product.matchScore}% Match</span>` : ""}
            </div>
          </div>
          <div class="quiz-product-footer">
            <button class="quiz-btn quiz-btn-primary" data-product-id="${product.id}">View Details</button>
          </div>
        </div>
      `;
		});

		this.productGrid.innerHTML = productsHTML;

		// Add event listeners to product buttons
		const productButtons = this.productGrid.querySelectorAll(".quiz-btn");
		productButtons.forEach(button => {
			button.addEventListener("click", () => {
				const productId = button.getAttribute("data-product-id");
				// In a real implementation, you would redirect to the product page
				if (this.redirectToProduct) {
					window.location.href = `/products/${productId}`;
				} else {
					console.log("View product:", productId);
				}
			});
		});
	}

	shareResults() {
		if (navigator.share) {
			navigator
				.share({
					title: "My Product Recommendations",
					text: "Check out these product recommendations I got from the quiz!",
					url: window.location.href
				})
				.catch(error => console.log("Error sharing:", error));
		} else {
			// Fallback for browsers that don't support the Web Share API
			navigator.clipboard
				.writeText(window.location.href)
				.then(() => alert("Link copied to clipboard!"))
				.catch(err => console.error("Failed to copy link:", err));
		}
	}
}

// Initialize the quiz when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
	new ProductQuiz();
});
