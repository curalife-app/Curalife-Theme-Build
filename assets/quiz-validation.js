/**
 * Quiz Validation Module
 * Handles form validation logic for quiz questions and form steps
 */

export class QuizValidation {
	constructor(container) {
		this.container = container;
	}

	validateFormStep(step, responses) {
		const validationErrors = [];

		step.questions.forEach(question => {
			const response = responses[question.id];
			const validationResult = this._validateQuestionInForm(question, response);

			if (!validationResult.isValid) {
				validationErrors.push({
					questionId: question.id,
					messages: validationResult.errors
				});
			}
		});

		if (validationErrors.length > 0) {
			this._displayValidationErrors(validationErrors);
			return false;
		}

		return true;
	}

	_validateQuestionInForm(question, response) {
		const errorMessages = [];
		const value = response;

		// Required field validation
		if (question.required && this._isEmptyValue(value, question.type)) {
			const requiredError = this._validateRequired(question, value);
			if (requiredError) {
				errorMessages.push(requiredError);
			}
		}

		// Format validation (only if field has a value)
		if (this._hasValue(value)) {
			const trimmedValue = typeof value === "string" ? value.trim() : value;
			this._validateFieldFormat(question, trimmedValue, errorMessages);
		}

		return {
			isValid: errorMessages.length === 0,
			errors: errorMessages
		};
	}

	_isEmptyValue(value, questionType) {
		if (questionType === "checkbox") {
			return !Array.isArray(value) || value.length === 0;
		}
		if (questionType === "date-part") {
			return !value || !value.month || !value.day || !value.year;
		}
		return value === undefined || value === null || value === "";
	}

	_displayValidationErrors(validationErrors) {
		// Clear previous errors
		this.container.querySelectorAll(".quiz-field-error").forEach(errorElement => {
			errorElement.textContent = "";
			errorElement.style.display = "none";
		});

		// Display new errors
		validationErrors.forEach(({ questionId, messages }) => {
			const { errorElement, inputElement } = this._getValidationElements(questionId);

			if (errorElement) {
				errorElement.textContent = messages[0]; // Show first error
				errorElement.style.display = "block";
			}

			if (inputElement) {
				inputElement.classList.add("quiz-field-error-state");
				this._scrollToInvalidField(inputElement);
			}
		});
	}

	_getValidationElements(questionId) {
		const errorElement = this.container.querySelector(`#error-${questionId}`);
		const inputElement = this.container.querySelector(
			`[name="${questionId}"], [name="${questionId}_month"], [data-question-id="${questionId}"] input, [data-question-id="${questionId}"] select, [data-question-id="${questionId}"] textarea`
		);

		return { errorElement, inputElement };
	}

	_validateFieldValue(question, value) {
		const trimmedValue = typeof value === "string" ? value.trim() : value;
		const errorMessages = [];

		// Required validation
		if (question.required && !this._hasValue(value)) {
			const requiredError = this._validateRequired(question, value);
			if (requiredError) {
				errorMessages.push(requiredError);
			}
		}

		// Format validation
		if (this._hasValue(value)) {
			this._validateFieldFormat(question, trimmedValue, errorMessages);
		}

		return {
			isValid: errorMessages.length === 0,
			errors: errorMessages
		};
	}

	_hasValue(value) {
		return value !== undefined && value !== null && value !== "";
	}

	_validateRequired(question, value) {
		if (!this._hasValue(value)) {
			return `${question.text} is required`;
		}
		return null;
	}

	_validateFieldFormat(question, trimmedValue, errorMessages) {
		// Email validation
		if (question.type === "email" || question.id === "email") {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(trimmedValue)) {
				errorMessages.push("Please enter a valid email address");
			}
		}

		// Phone validation
		if (question.type === "phone" || question.id === "phone") {
			if (!this._validatePhoneNumber(trimmedValue)) {
				errorMessages.push("Please enter a valid 10-digit phone number");
			}
		}

		// ZIP code validation
		if (question.id === "zip" || question.id === "zipCode") {
			const zipRegex = /^\d{5}(-\d{4})?$/;
			if (!zipRegex.test(trimmedValue)) {
				errorMessages.push("Please enter a valid ZIP code (e.g., 12345 or 12345-6789)");
			}
		}

		// Name validation (no numbers)
		if (question.id === "first-name" || question.id === "last-name") {
			const nameRegex = /^[a-zA-Z\s\-'\.]+$/;
			if (!nameRegex.test(trimmedValue)) {
				errorMessages.push("Name should only contain letters, spaces, hyphens, apostrophes, and periods");
			}
		}

		// Date of birth validation
		if (question.id === "date-of-birth" && question.type === "date-part") {
			const { month, day, year } = trimmedValue;
			const birthDate = new Date(year, month - 1, day);
			const today = new Date();
			const age = today.getFullYear() - birthDate.getFullYear();

			if (age < 18 || age > 120) {
				errorMessages.push("Please enter a valid date of birth (must be 18+ years old)");
			}
		}

		// Custom validation rules
		if (question.validation) {
			if (question.validation.minLength && trimmedValue.length < question.validation.minLength) {
				errorMessages.push(`Must be at least ${question.validation.minLength} characters`);
			}

			if (question.validation.maxLength && trimmedValue.length > question.validation.maxLength) {
				errorMessages.push(`Must be no more than ${question.validation.maxLength} characters`);
			}

			if (question.validation.pattern) {
				const regex = new RegExp(question.validation.pattern);
				if (!regex.test(trimmedValue)) {
					errorMessages.push(question.validation.message || "Invalid format");
				}
			}
		}
	}

	_validatePhoneNumber(phone) {
		// Remove all non-digit characters
		const cleaned = phone.replace(/\D/g, "");

		// Check if it's a valid 10-digit US phone number
		if (cleaned.length === 10) {
			return true;
		}

		// Check if it's a valid 11-digit number starting with 1 (US country code)
		if (cleaned.length === 11 && cleaned.startsWith("1")) {
			return true;
		}

		return false;
	}

	updateFieldValidationState(input, question, validationResult) {
		// Clear previous error state
		this._clearFieldError(question.id, input);

		if (!validationResult.isValid) {
			// Add error state
			input.classList.add("quiz-field-error-state");

			// Show error message
			const errorElement = this.container.querySelector(`#error-${question.id}`);
			if (errorElement) {
				errorElement.textContent = validationResult.errors[0];
				errorElement.style.display = "block";
			}
		} else {
			// Add success state for some field types
			if (question.type === "email" || question.type === "phone") {
				input.classList.add("quiz-field-success-state");
			}
		}

		// Update dropdown color for better UX
		if (input.tagName === "SELECT") {
			this._updateDropdownColor(input);
		}
	}

	_clearFieldError(questionId, input) {
		if (input) {
			input.classList.remove("quiz-field-error-state", "quiz-field-success-state");
		}

		const errorElement = this.container.querySelector(`#error-${questionId}`);
		if (errorElement) {
			errorElement.textContent = "";
			errorElement.style.display = "none";
		}
	}

	_updateDropdownColor(dropdown) {
		if (dropdown.value) {
			dropdown.style.color = "#333";
		} else {
			dropdown.style.color = "#999";
		}
	}

	_scrollToInvalidField(fieldElement) {
		if (!fieldElement) return;

		// Find the question container
		const questionContainer = fieldElement.closest(".quiz-question") || fieldElement;

		// Scroll to the field with some offset for better visibility
		const elementTop = questionContainer.getBoundingClientRect().top + window.pageYOffset;
		const offset = 100; // Offset for header/navigation

		window.scrollTo({
			top: elementTop - offset,
			behavior: "smooth"
		});

		// Focus the field after scrolling
		setTimeout(() => {
			if (fieldElement.focus) {
				fieldElement.focus();
			}
		}, 500);
	}

	// Real-time validation for individual fields
	attachRealTimeValidation(question, input) {
		if (!input || !question) return;

		const validateField = () => {
			const value = input.value;
			const validationResult = this._validateFieldValue(question, value);
			this.updateFieldValidationState(input, question, validationResult);
			return validationResult.isValid;
		};

		// Validate on blur (when user leaves the field)
		input.addEventListener("blur", validateField);

		// For some field types, validate on input as well
		if (question.type === "email" || question.type === "phone") {
			let debounceTimer;
			input.addEventListener("input", () => {
				clearTimeout(debounceTimer);
				debounceTimer = setTimeout(validateField, 500); // Debounce for 500ms
			});
		}

		return validateField;
	}

	// Validate all visible fields in a container
	validateAllFields(container = this.container) {
		const inputs = container.querySelectorAll("input, select, textarea");
		let allValid = true;

		inputs.forEach(input => {
			const questionElement = input.closest("[data-question-id]");
			if (!questionElement) return;

			const questionId = questionElement.getAttribute("data-question-id");
			// This would need question data - simplified for now
			const isFieldValid = input.value.trim() !== "";

			if (!isFieldValid) {
				allValid = false;
				input.classList.add("quiz-field-error-state");
			} else {
				input.classList.remove("quiz-field-error-state");
			}
		});

		return allValid;
	}
}
