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
		this.currentStepIndex = 0;
		this.currentQuestionIndex = 0; // For steps with multiple questions
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
			this.prevButton.addEventListener("click", () => this.goToPreviousStep());
		}

		if (this.nextButton) {
			this.nextButton.addEventListener("click", () => this.goToNextStep());
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

			// Initialize responses array
			this.responses = [];

			// Initialize responses for all questions across all steps
			this.quizData.steps.forEach(step => {
				if (step.questions) {
					step.questions.forEach(question => {
						this.responses.push({
							stepId: step.id,
							questionId: question.id,
							answer: null
						});
					});
				} else {
					// For info-only steps
					this.responses.push({
						stepId: step.id,
						questionId: step.id,
						answer: null
					});
				}
			});

			// Hide loading indicator
			this.loading.style.display = "none";

			// Render the first step
			this.renderCurrentStep();
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

	// Get the current step
	getCurrentStep() {
		return this.quizData.steps[this.currentStepIndex];
	}

	// Get the current question (if the step has questions)
	getCurrentQuestion() {
		const step = this.getCurrentStep();
		if (step.questions) {
			return step.questions[this.currentQuestionIndex];
		}
		return null;
	}

	// Get response for the current question
	getResponseForCurrentQuestion() {
		const step = this.getCurrentStep();
		const questionId = step.questions ? step.questions[this.currentQuestionIndex].id : step.id;

		return (
			this.responses.find(r => r.questionId === questionId) || {
				stepId: step.id,
				questionId: questionId,
				answer: null
			}
		);
	}

	renderCurrentStep() {
		const step = this.getCurrentStep();

		// Update progress bar
		const progress = ((this.currentStepIndex + 1) / this.quizData.steps.length) * 100;
		this.progressBar.style.width = `${progress}%`;

		// Create step HTML
		let stepHTML = `<div class="quiz-fade-in">`;

		// Check if this is an info-only step or has questions
		if (step.info) {
			// Info-only step
			stepHTML += `
				<h3 class="quiz-question-title">${step.info.heading}</h3>
				<p class="quiz-question-description">${step.info.text}</p>
				${step.info.subtext ? `<p class="quiz-subtext">${step.info.subtext}</p>` : ""}
			`;
			// Update this step's response to acknowledge it was seen
			const infoResponse = this.responses.find(r => r.stepId === step.id);
			if (infoResponse) {
				infoResponse.answer = "info-acknowledged";
			} else {
				this.responses.push({
					stepId: step.id,
					questionId: step.id,
					answer: "info-acknowledged"
				});
			}
		} else if (step.questions) {
			// Step with questions - render current question
			const question = step.questions[this.currentQuestionIndex];
			const response = this.getResponseForCurrentQuestion();

			stepHTML += `
				<h3 class="quiz-question-title">${question.text}</h3>
				${question.helpText ? `<p class="quiz-question-description">${question.helpText}</p>` : ""}
			`;

			// Add question type specific HTML
			switch (question.type) {
				case "multiple-choice":
					stepHTML += this.renderMultipleChoice(question, response);
					break;
				case "checkbox":
					stepHTML += this.renderCheckbox(question, response);
					break;
				case "dropdown":
					stepHTML += this.renderDropdown(question, response);
					break;
				case "text":
					stepHTML += this.renderTextInput(question, response);
					break;
				case "date":
					stepHTML += this.renderDateInput(question, response);
					break;
				case "textarea":
					stepHTML += this.renderTextarea(question, response);
					break;
				case "rating":
					stepHTML += this.renderRating(question, response);
					break;
				default:
					stepHTML += '<p class="quiz-error">Unknown question type</p>';
			}
		}

		// Add legal text if present
		if (step.legal) {
			stepHTML += `<p class="quiz-legal">${step.legal}</p>`;
		}

		stepHTML += "</div>";

		// Set the HTML
		this.questionContainer.innerHTML = stepHTML;

		// Add event listeners for the questions in the step
		if (step.questions) {
			this.attachQuestionEventListeners(step.questions[this.currentQuestionIndex]);
		}
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

	renderDropdown(question, response) {
		let options = question.options || [];

		let html = `
			<div class="quiz-dropdown">
				<select id="question-${question.id}" class="quiz-select">
					<option value="">Select an option</option>
		`;

		options.forEach(option => {
			html += `<option value="${option.id}" ${response.answer === option.id ? "selected" : ""}>${option.text}</option>`;
		});

		html += `
				</select>
			</div>
		`;
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

	renderDateInput(question, response) {
		return `
			<div class="quiz-text-answer">
				<input type="date" id="question-${question.id}" class="quiz-text-input"
					placeholder="${question.helpText || "MM/DD/YYYY"}"
					value="${response.answer || ""}">
				${question.helpText ? `<p class="quiz-help-text">${question.helpText}</p>` : ""}
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
		// Skip event listeners for info-only steps
		if (!question) return;

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

			case "dropdown":
				const dropdownInput = this.questionContainer.querySelector(`#question-${question.id}`);
				dropdownInput.addEventListener("change", () => {
					this.handleAnswer(dropdownInput.value);
				});
				break;

			case "text":
			case "date":
				const textInput = this.questionContainer.querySelector(`#question-${question.id}`);
				textInput.addEventListener("input", () => {
					// If there's validation, check it
					if (question.validation && question.validation.pattern) {
						const regex = new RegExp(question.validation.pattern);
						if (regex.test(textInput.value)) {
							textInput.classList.remove("quiz-input-error");
							this.handleAnswer(textInput.value);
						} else {
							textInput.classList.add("quiz-input-error");
							this.handleAnswer(null); // Invalid input
						}
					} else {
						this.handleAnswer(textInput.value);
					}
				});
				break;

			case "textarea":
				const textareaInput = this.questionContainer.querySelector(`#question-${question.id}`);
				textareaInput.addEventListener("input", () => {
					this.handleAnswer(textareaInput.value);
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

		const step = this.getCurrentStep();

		// If it's a step with questions, update the response for the current question
		if (step.questions) {
			const question = step.questions[this.currentQuestionIndex];
			const responseIndex = this.responses.findIndex(r => r.questionId === question.id);

			if (responseIndex !== -1) {
				this.responses[responseIndex].answer = answer;
			} else {
				this.responses.push({
					stepId: step.id,
					questionId: question.id,
					answer
				});
			}
		} else {
			// For info-only steps, mark as acknowledged
			const responseIndex = this.responses.findIndex(r => r.stepId === step.id);
			if (responseIndex !== -1) {
				this.responses[responseIndex].answer = answer;
			} else {
				this.responses.push({
					stepId: step.id,
					questionId: step.id,
					answer
				});
			}
		}

		this.updateNavigation();
	}

	updateNavigation() {
		// Disable/enable previous button
		this.prevButton.disabled = this.currentStepIndex === 0 || this.submitting;

		const step = this.getCurrentStep();

		// Check if we need to show Next or Finish
		const isLastStep = this.currentStepIndex === this.quizData.steps.length - 1;
		const isLastQuestionInStep = step.questions ? this.currentQuestionIndex === step.questions.length - 1 : true;

		// Update the button text based on the current step's ctaText
		if (isLastStep && isLastQuestionInStep) {
			this.nextButton.innerHTML = step.ctaText || "Finish Quiz";
		} else {
			this.nextButton.innerHTML =
				step.ctaText ||
				'Next <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
		}

		// Check if current question has an answer
		let hasAnswer = true;

		if (step.questions) {
			const question = step.questions[this.currentQuestionIndex];
			const response = this.responses.find(r => r.questionId === question.id);

			// Check if the question is required and has an answer
			if (question.required) {
				hasAnswer = response && response.answer !== null && (typeof response.answer !== "string" || response.answer.trim() !== "") && (!Array.isArray(response.answer) || response.answer.length > 0);
			}
		}

		this.nextButton.disabled = !hasAnswer || this.submitting;
	}

	goToPreviousStep() {
		const currentStep = this.getCurrentStep();

		// If we have multiple questions in the current step and not on the first one
		if (currentStep.questions && this.currentQuestionIndex > 0) {
			this.currentQuestionIndex--;
			this.renderCurrentStep();
			this.updateNavigation();
			return;
		}

		// Otherwise, go to the previous step
		if (this.currentStepIndex > 0) {
			this.currentStepIndex--;
			// If the previous step has questions, position at the last question
			const prevStep = this.quizData.steps[this.currentStepIndex];
			this.currentQuestionIndex = prevStep.questions ? prevStep.questions.length - 1 : 0;

			this.renderCurrentStep();
			this.updateNavigation();
		}
	}

	goToNextStep() {
		const currentStep = this.getCurrentStep();

		// If we have multiple questions in the current step and not on the last one
		if (currentStep.questions && this.currentQuestionIndex < currentStep.questions.length - 1) {
			this.currentQuestionIndex++;
			this.renderCurrentStep();
			this.updateNavigation();
			return;
		}

		// If this is the last step, finish the quiz
		if (this.currentStepIndex === this.quizData.steps.length - 1) {
			this.finishQuiz();
			return;
		}

		// Otherwise, go to the next step
		this.currentStepIndex++;
		this.currentQuestionIndex = 0; // Reset question index for the new step
		this.renderCurrentStep();
		this.updateNavigation();
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

		// Prepare the quiz data payload
		const payload = {
			quizId: this.quizData.id,
			quizTitle: this.quizData.title,
			responses: this.responses,
			completedAt: new Date().toISOString()
		};

		// Get the webhook URL
		const n8nWebhookUrl = this.container.getAttribute("data-n8n-webhook") || "https://n8n.curalife.com/webhook-test/quiz-webhook";

		// Log for debugging
		console.log("Submitting quiz data to:", n8nWebhookUrl);

		// Send data to backend - attempt multiple methods if needed
		let dataSent = false;

		try {
			// Try the form submission approach first (most reliable for CORS issues)
			const formSubmitResult = await this.submitViaForm(n8nWebhookUrl, payload);
			if (formSubmitResult) {
				console.log("Quiz data sent successfully via form");
				dataSent = true;
			}
		} catch (formError) {
			console.warn("Form submission failed:", formError);
		}

		if (!dataSent) {
			try {
				// Fall back to XMLHttpRequest
				const xhr = new XMLHttpRequest();
				xhr.open("POST", n8nWebhookUrl, true);
				xhr.setRequestHeader("Content-Type", "application/json");

				// Set up a promise to track completion
				const xhrPromise = new Promise((resolve, reject) => {
					xhr.onload = function () {
						if (this.status >= 200 && this.status < 300) {
							console.log("Quiz data sent successfully via XHR");
							dataSent = true;
							resolve(true);
						} else {
							console.warn(`Server returned ${this.status} ${this.statusText}`, this.responseText);
							reject(new Error(`Server error: ${this.status}`));
						}
					};

					xhr.onerror = function () {
						console.error("Network error occurred with XHR");
						reject(new Error("Network error"));
					};
				});

				// Send the request
				xhr.send(JSON.stringify(payload));

				// Wait for completion or timeout after 3 seconds
				await Promise.race([xhrPromise, new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000))]);
			} catch (error) {
				console.warn("XHR failed:", error.message);

				// Try navigator.sendBeacon as fallback
				if (!dataSent) {
					try {
						const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
						dataSent = navigator.sendBeacon(n8nWebhookUrl, blob);
						if (dataSent) {
							console.log("Quiz data sent successfully via Beacon API");
						} else {
							console.warn("Beacon API failed to send data");
						}
					} catch (beaconError) {
						console.warn("Beacon API error:", beaconError);
					}
				}
			}
		}

		// Wait a moment to make the loading state visible
		await new Promise(resolve => setTimeout(resolve, 500));

		// Check if we should redirect to appointment booking
		const lastStep = this.quizData.steps[this.quizData.steps.length - 1];
		if (lastStep.id === "step-eligibility") {
			// Get the booking URL from the section settings or use a default
			const bookingUrl = this.container.getAttribute("data-booking-url") || "/appointment-booking";
			// Redirect to appointment booking page
			window.location.href = bookingUrl;
			return;
		}

		// Otherwise show completion message
		this.questions.style.display = "none";
		this.results.style.display = "block";
		this.results.innerHTML = `
			<div class="quiz-results-header quiz-fade-in">
				<h2>Quiz Complete!</h2>
				<p>Thank you for taking the quiz.</p>
				<button class="quiz-btn quiz-btn-primary" onclick="window.location.reload()">Take Again</button>
				<a href="/" class="quiz-btn quiz-btn-secondary">Return Home</a>
			</div>
		`;

		this.submitting = false;
	}

	// Helper method to submit data via a hidden form (gets around CORS)
	submitViaForm(url, data) {
		return new Promise((resolve, reject) => {
			try {
				// Create a hidden iframe to target the form
				const iframeId = "quiz-submit-iframe";
				let iframe = document.getElementById(iframeId);

				if (!iframe) {
					iframe = document.createElement("iframe");
					iframe.id = iframeId;
					iframe.name = iframeId;
					iframe.style.display = "none";
					document.body.appendChild(iframe);
				}

				// Create a form
				const form = document.createElement("form");
				form.method = "POST";
				form.action = url;
				form.target = iframeId;
				form.style.display = "none";

				// Add the data field
				const input = document.createElement("input");
				input.type = "hidden";
				input.name = "data";
				input.value = JSON.stringify(data);
				form.appendChild(input);

				// Add the form to the document
				document.body.appendChild(form);

				// Handle iframe load event
				iframe.onload = () => {
					try {
						resolve(true);
					} catch (err) {
						resolve(true); // Assume success even if we can't read the iframe content
					}

					// Clean up after a delay
					setTimeout(() => {
						if (form && form.parentNode) {
							form.parentNode.removeChild(form);
						}
					}, 1000);
				};

				// Set a timeout in case iframe never loads
				setTimeout(() => {
					resolve(true); // Assume success after timeout
				}, 3000);

				// Submit the form
				form.submit();
			} catch (error) {
				console.error("Error in submitViaForm:", error);
				reject(error);
			}
		});
	}
}

// Initialize the quiz when the DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
	new ProductQuiz();
});
