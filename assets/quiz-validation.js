class QuizValidation {
  constructor(container) {
    this.container = container;
  }
  validateFormStep(step, responses) {
    const validationErrors = [];
    step.questions.forEach((question) => {
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
    if (question.required && this._isEmptyValue(value, question.type)) {
      const requiredError = this._validateRequired(question, value);
      if (requiredError) {
        errorMessages.push(requiredError);
      }
    }
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
    return value === void 0 || value === null || value === "";
  }
  _displayValidationErrors(validationErrors) {
    this.container.querySelectorAll(".quiz-field-error").forEach((errorElement) => {
      errorElement.textContent = "";
      errorElement.style.display = "none";
    });
    validationErrors.forEach(({ questionId, messages }) => {
      const { errorElement, inputElement } = this._getValidationElements(questionId);
      if (errorElement) {
        errorElement.textContent = messages[0];
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
    if (question.required && !this._hasValue(value)) {
      const requiredError = this._validateRequired(question, value);
      if (requiredError) {
        errorMessages.push(requiredError);
      }
    }
    if (this._hasValue(value)) {
      this._validateFieldFormat(question, trimmedValue, errorMessages);
    }
    return {
      isValid: errorMessages.length === 0,
      errors: errorMessages
    };
  }
  _hasValue(value) {
    return value !== void 0 && value !== null && value !== "";
  }
  _validateRequired(question, value) {
    if (!this._hasValue(value)) {
      return `${question.text} is required`;
    }
    return null;
  }
  _validateFieldFormat(question, trimmedValue, errorMessages) {
    if (question.type === "email" || question.id === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedValue)) {
        errorMessages.push("Please enter a valid email address");
      }
    }
    if (question.type === "phone" || question.id === "phone") {
      if (!this._validatePhoneNumber(trimmedValue)) {
        errorMessages.push("Please enter a valid 10-digit phone number");
      }
    }
    if (question.id === "zip" || question.id === "zipCode") {
      const zipRegex = /^\d{5}(-\d{4})?$/;
      if (!zipRegex.test(trimmedValue)) {
        errorMessages.push("Please enter a valid ZIP code (e.g., 12345 or 12345-6789)");
      }
    }
    if (question.id === "first-name" || question.id === "last-name") {
      const nameRegex = /^[a-zA-Z\s\-'\.]+$/;
      if (!nameRegex.test(trimmedValue)) {
        errorMessages.push("Name should only contain letters, spaces, hyphens, apostrophes, and periods");
      }
    }
    if (question.id === "date-of-birth" && question.type === "date-part") {
      const { month, day, year } = trimmedValue;
      const birthDate = new Date(year, month - 1, day);
      const today = /* @__PURE__ */ new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18 || age > 120) {
        errorMessages.push("Please enter a valid date of birth (must be 18+ years old)");
      }
    }
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
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return true;
    }
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      return true;
    }
    return false;
  }
  updateFieldValidationState(input, question, validationResult) {
    this._clearFieldError(question.id, input);
    if (!validationResult.isValid) {
      input.classList.add("quiz-field-error-state");
      const errorElement = this.container.querySelector(`#error-${question.id}`);
      if (errorElement) {
        errorElement.textContent = validationResult.errors[0];
        errorElement.style.display = "block";
      }
    } else {
      if (question.type === "email" || question.type === "phone") {
        input.classList.add("quiz-field-success-state");
      }
    }
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
    const questionContainer = fieldElement.closest(".quiz-question") || fieldElement;
    const elementTop = questionContainer.getBoundingClientRect().top + window.pageYOffset;
    const offset = 100;
    window.scrollTo({
      top: elementTop - offset,
      behavior: "smooth"
    });
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
    input.addEventListener("blur", validateField);
    if (question.type === "email" || question.type === "phone") {
      let debounceTimer;
      input.addEventListener("input", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(validateField, 500);
      });
    }
    return validateField;
  }
  // Validate all visible fields in a container
  validateAllFields(container = this.container) {
    const inputs = container.querySelectorAll("input, select, textarea");
    let allValid = true;
    inputs.forEach((input) => {
      const questionElement = input.closest("[data-question-id]");
      if (!questionElement) return;
      questionElement.getAttribute("data-question-id");
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
export {
  QuizValidation as Q
};
//# sourceMappingURL=quiz-validation.js.map
