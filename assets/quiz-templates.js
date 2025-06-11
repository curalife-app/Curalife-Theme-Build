class QuizTemplates {
  constructor() {
  }
  generateSuccessfulSchedulingHTML(schedulingData) {
    const scheduleLink = schedulingData && schedulingData.scheduleLink ? schedulingData.scheduleLink : "#";
    const masterId = schedulingData && schedulingData.masterId ? schedulingData.masterId : "";
    const html = [
      '<div class="quiz-results-container">',
      '<div class="quiz-results-header">',
      '<h2 class="quiz-results-title">🎉 Appointment Request Submitted!</h2>',
      '<p class="quiz-results-subtitle">Great news! Your request has been successfully processed and your dietitian appointment is ready to be scheduled.</p>',
      "</div>",
      '<div class="quiz-action-section">',
      '<div class="quiz-action-content">',
      '<div class="quiz-action-header">',
      '<h3 class="quiz-action-title">Next: Choose Your Appointment Time</h3>',
      "</div>",
      '<div class="quiz-action-details">',
      '<div class="quiz-action-info">',
      '<div class="quiz-action-info-text">',
      "Click below to access your personalized scheduling portal where you can select from available appointment times that work best for your schedule.",
      "</div>",
      "</div>",
      '<a href="' + scheduleLink + '" target="_blank" class="quiz-booking-button">',
      '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">',
      '<path d="M6.66666 2.5V5.83333M13.3333 2.5V5.83333M2.5 9.16667H17.5M4.16666 3.33333H15.8333C16.7538 3.33333 17.5 4.07952 17.5 5V16.6667C17.5 17.5871 16.7538 18.3333 15.8333 18.3333H4.16666C3.24619 18.3333 2.5 17.5871 2.5 16.6667V5C2.5 4.07952 3.24619 3.33333 4.16666 3.33333Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
      "</svg>",
      "Schedule Your Appointment",
      "</a>",
      masterId ? '<p class="quiz-text-xs" style="margin-top: 16px; color: #666; font-family: monospace;">Reference ID: ' + masterId + "</p>" : "",
      "</div>",
      "</div>",
      "</div>",
      this._generateExpectationsCard(),
      this._generateSupportSection(),
      "</div>"
    ].join("");
    return html;
  }
  generateSchedulingErrorHTML(errorData) {
    const errorTitle = errorData && errorData.title ? errorData.title : "⚠️ Scheduling Temporarily Unavailable";
    const errorDescription = errorData && errorData.description ? errorData.description : "We're experiencing temporary difficulties with our scheduling system.";
    const isDuplicateError = errorData && errorData.type === "duplicate";
    const isValidationError = errorData && errorData.type === "validation";
    const errorMessage = errorData && errorData.message ? errorData.message : "";
    if (isDuplicateError) {
      return this._generateDuplicateAppointmentHTML();
    }
    if (isValidationError) {
      return this._generateValidationErrorHTML(errorMessage);
    }
    return this._generateGeneralErrorHTML(errorTitle, errorDescription);
  }
  _generateDuplicateAppointmentHTML() {
    const html = [
      '<div class="quiz-results-container">',
      '<div class="quiz-results-header">',
      '<h2 class="quiz-results-title">⚠️ Appointment Already Exists</h2>',
      '<p class="quiz-results-subtitle">Good news! You already have an appointment scheduled with our dietitian.</p>',
      "</div>",
      '<div class="quiz-coverage-card">',
      `<div class="quiz-coverage-card-title">What's Next?</div>`,
      '<div class="quiz-coverage-benefits">',
      '<div class="quiz-coverage-benefit">',
      '<div class="quiz-coverage-benefit-icon">',
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">',
      '<path d="M18 5.83333L10 11.6667L2 5.83333" stroke="#306E51" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      '<path d="M2 5.83333H18V15C18 15.442 17.824 15.866 17.512 16.1785C17.199 16.491 16.775 16.6667 16.333 16.6667H3.667C3.225 16.6667 2.801 16.491 2.488 16.1785C2.176 15.866 2 15.442 2 15V5.83333Z" stroke="#306E51" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      "</svg>",
      "</div>",
      '<div class="quiz-coverage-benefit-text">',
      "<strong>Check Your Email</strong><br/>",
      "Your appointment confirmation and scheduling details have been sent to your email address",
      "</div>",
      "</div>",
      '<div class="quiz-coverage-benefit">',
      '<div class="quiz-coverage-benefit-icon">',
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">',
      '<path d="M8 2V6M16 2V6M3.5 10H20.5M5 4H19C20.105 4 21 4.895 21 6V20C21 21.105 20.105 22 19 22H5C3.895 22 3 21.105 3 20V6C3 4.895 3.895 4 5 4Z" stroke="#306E51" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      "</svg>",
      "</div>",
      '<div class="quiz-coverage-benefit-text">',
      "<strong>Reschedule if Needed</strong><br/>",
      "If you need to change your appointment time, use the link in your confirmation email",
      "</div>",
      "</div>",
      "</div>",
      "</div>",
      this._generateSupportSection(),
      "</div>"
    ].join("");
    return html;
  }
  _generateValidationErrorHTML(errorMessage) {
    const html = [
      '<div class="quiz-results-container">',
      '<div class="quiz-results-header">',
      '<h2 class="quiz-results-title">❌ Information Needs Review</h2>',
      '<p class="quiz-results-subtitle">' + errorMessage + "</p>",
      "</div>",
      '<div class="quiz-coverage-card">',
      '<div class="quiz-coverage-card-title">Common Issues &amp; Solutions</div>',
      '<div class="quiz-coverage-benefits">',
      '<div class="quiz-coverage-benefit">',
      '<div class="quiz-coverage-benefit-icon">📞</div>',
      '<div class="quiz-coverage-benefit-text">',
      "<strong>Phone Number:</strong> Use 10-digit format (e.g., 5551234567)",
      "</div>",
      "</div>",
      '<div class="quiz-coverage-benefit">',
      '<div class="quiz-coverage-benefit-icon">📅</div>',
      '<div class="quiz-coverage-benefit-text">',
      "<strong>Date of Birth:</strong> Ensure month/day/year are correct",
      "</div>",
      "</div>",
      '<div class="quiz-coverage-benefit">',
      '<div class="quiz-coverage-benefit-icon">🏠</div>',
      '<div class="quiz-coverage-benefit-text">',
      "<strong>Address:</strong> Include street number and name",
      "</div>",
      "</div>",
      '<div class="quiz-coverage-benefit">',
      '<div class="quiz-coverage-benefit-icon">📍</div>',
      '<div class="quiz-coverage-benefit-text">',
      "<strong>ZIP Code:</strong> Use 5-digit format (e.g., 12345)",
      "</div>",
      "</div>",
      "</div>",
      "</div>",
      '<div class="quiz-action-section">',
      '<div class="quiz-action-content">',
      '<div class="quiz-action-header">',
      '<h3 class="quiz-action-title">Try Again</h3>',
      "</div>",
      '<div class="quiz-action-details">',
      '<div class="quiz-action-info">',
      '<div class="quiz-action-info-text">',
      "Go back and double-check your information, then submit again.",
      "</div>",
      "</div>",
      '<button onclick="window.location.reload()" class="quiz-booking-button">',
      '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">',
      '<path d="M1.66666 10H5L3.33333 8.33333M3.33333 8.33333L1.66666 6.66667M3.33333 8.33333C4.09938 6.54467 5.40818 5.06585 7.07084 4.10926C8.7335 3.15266 10.6668 2.76579 12.5729 3.00632C14.479 3.24685 16.2671 4.10239 17.6527 5.43174C19.0382 6.76109 19.9501 8.50173 20.2612 10.3889C20.5723 12.2761 20.2661 14.2137 19.3884 15.9271C18.5107 17.6405 17.1075 19.0471 15.3804 19.9429C13.6533 20.8388 11.6875 21.1795 9.76666 20.9204C7.84586 20.6613 6.06666 19.8167 4.66666 18.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
      "</svg>",
      "Try Again",
      "</button>",
      "</div>",
      "</div>",
      "</div>",
      this._generateSupportSection(),
      "</div>"
    ].join("");
    return html;
  }
  _generateGeneralErrorHTML(errorTitle, errorDescription) {
    const html = [
      '<div class="quiz-results-container">',
      '<div class="quiz-results-header">',
      '<h2 class="quiz-results-title">' + errorTitle + "</h2>",
      '<p class="quiz-results-subtitle">' + errorDescription + "</p>",
      "</div>",
      '<div class="quiz-action-section">',
      '<div class="quiz-action-content">',
      '<div class="quiz-action-header">',
      `<h3 class="quiz-action-title">We've Got You Covered</h3>`,
      "</div>",
      '<div class="quiz-action-details">',
      '<div class="quiz-action-info">',
      '<div class="quiz-action-info-text">',
      "Your request has been recorded and our team will personally contact you within <strong>24 hours</strong> to schedule your appointment.",
      "</div>",
      "</div>",
      "</div>",
      "</div>",
      "</div>",
      '<div class="quiz-coverage-card">',
      '<div class="quiz-coverage-card-title">What Happens Next</div>',
      '<div class="quiz-coverage-benefits">',
      '<div class="quiz-coverage-benefit">',
      '<div class="quiz-coverage-benefit-icon">',
      '<div style="background: #306e51; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px;">1</div>',
      "</div>",
      '<div class="quiz-coverage-benefit-text">',
      "<strong>Within 4 Hours:</strong> You'll receive a confirmation email with your request details",
      "</div>",
      "</div>",
      '<div class="quiz-coverage-benefit">',
      '<div class="quiz-coverage-benefit-icon">',
      '<div style="background: #306e51; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px;">2</div>',
      "</div>",
      '<div class="quiz-coverage-benefit-text">',
      "<strong>Within 24 Hours:</strong> A team member will call to schedule your appointment",
      "</div>",
      "</div>",
      '<div class="quiz-coverage-benefit">',
      '<div class="quiz-coverage-benefit-icon">',
      '<div style="background: #306e51; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px;">3</div>',
      "</div>",
      '<div class="quiz-coverage-benefit-text">',
      "<strong>Your Appointment:</strong> Meet with your registered dietitian at the scheduled time",
      "</div>",
      "</div>",
      "</div>",
      "</div>",
      this._generateSupportSection(),
      "</div>"
    ].join("");
    return html;
  }
  _generateExpectationsCard() {
    return [
      '<div class="quiz-coverage-card">',
      '<div class="quiz-coverage-card-title">What to Expect</div>',
      '<div class="quiz-coverage-benefits">',
      '<div class="quiz-coverage-benefit">',
      '<div class="quiz-coverage-benefit-icon">',
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">',
      '<path d="M12 8V12L15 15" stroke="#306E51" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      '<circle cx="12" cy="12" r="9" stroke="#306E51" stroke-width="2"/>',
      "</svg>",
      "</div>",
      '<div class="quiz-coverage-benefit-text">',
      "<strong>30-60 Minutes</strong><br/>",
      "Comprehensive nutrition consultation tailored to your specific health goals",
      "</div>",
      "</div>",
      '<div class="quiz-coverage-benefit">',
      '<div class="quiz-coverage-benefit-icon">',
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">',
      '<path d="M17 3V0M12 3V0M7 3V0M3 7H21M5 21H19C20.1046 21 21 20.1046 21 19V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V19C3 20.1046 3.89543 21 5 21Z" stroke="#306E51" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      "</svg>",
      "</div>",
      '<div class="quiz-coverage-benefit-text">',
      "<strong>Flexible Scheduling</strong><br/>",
      "Choose from morning, afternoon, or evening slots that fit your lifestyle",
      "</div>",
      "</div>",
      '<div class="quiz-coverage-benefit">',
      '<div class="quiz-coverage-benefit-icon">',
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">',
      '<path d="M9 12L11 14L22 3M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3.89543 3 5 3 5 3H16" stroke="#306E51" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
      "</svg>",
      "</div>",
      '<div class="quiz-coverage-benefit-text">',
      "<strong>Personalized Plan</strong><br/>",
      "Receive a custom nutrition plan based on your quiz responses and health profile",
      "</div>",
      "</div>",
      '<div class="quiz-coverage-benefit">',
      '<div class="quiz-coverage-benefit-icon">',
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">',
      '<path d="M18.3333 14.1667C18.3333 15.0871 17.5871 15.8333 16.6667 15.8333H5.83333L1.66666 20V3.33333C1.66666 2.41286 2.41285 1.66667 3.33333 1.66667H16.6667C17.5871 1.66667 18.3333 2.41286 18.3333 3.33333V14.1667Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
      "</svg>",
      "</div>",
      '<div class="quiz-coverage-benefit-text">',
      "<strong>Ongoing Support</strong><br/>",
      "Follow-up resources and support to help you achieve your health goals",
      "</div>",
      "</div>",
      "</div>",
      "</div>"
    ].join("");
  }
  _generateSupportSection() {
    return [
      '<div class="quiz-action-section" style="background-color: #f8f9fa;">',
      '<div class="quiz-action-content">',
      '<div class="quiz-action-header">',
      '<h3 class="quiz-action-title">Need Help?</h3>',
      "</div>",
      '<div class="quiz-action-details">',
      '<div class="quiz-action-info">',
      '<div class="quiz-action-info-text">',
      "Our support team is available Monday-Friday, 9 AM - 6 PM EST",
      "</div>",
      "</div>",
      '<div class="quiz-action-feature">',
      '<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">',
      '<path d="M18.3333 5.83333L10 11.6667L1.66666 5.83333" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
      '<path d="M1.66666 5.83333H18.3333V15C18.3333 15.442 18.1577 15.866 17.8452 16.1785C17.5327 16.491 17.1087 16.6667 16.6667 16.6667H3.33333C2.89131 16.6667 2.46738 16.491 2.15482 16.1785C1.84226 15.866 1.66666 15.442 1.66666 15V5.83333Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
      "</svg>",
      '<div class="quiz-action-feature-text">Email: support@curalife.com</div>',
      "</div>",
      '<div class="quiz-action-feature">',
      '<svg class="quiz-action-feature-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">',
      '<path d="M18.3081 14.2233C17.1569 14.2233 16.0346 14.0397 14.9845 13.6971C14.6449 13.5878 14.2705 13.6971 14.0579 13.9427L12.8372 15.6772C10.3023 14.4477 8.55814 12.7138 7.32326 10.1581L9.10465 8.89535C9.34884 8.68372 9.45814 8.30233 9.34884 7.96279C9.00581 6.91628 8.82209 5.79186 8.82209 4.64535C8.82209 4.28953 8.53256 4 8.17674 4H4.64535C4.28953 4 4 4.28953 4 4.64535C4 12.1715 10.1831 18.3953 17.6628 18.3953C18.0186 18.3953 18.3081 18.1058 18.3081 17.75V14.2233Z" stroke="#306E51" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
      "</svg>",
      '<div class="quiz-action-feature-text">Phone: 1-800-CURALIFE</div>',
      "</div>",
      "</div>",
      "</div>",
      "</div>"
    ].join("");
  }
  generateLoadingHTML() {
    return [
      '<div class="quiz-loading-container">',
      '<div class="quiz-loading-content">',
      '<div class="quiz-loading-spinner">',
      '<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">',
      '<circle cx="20" cy="20" r="18" fill="none" stroke="#e5e7eb" stroke-width="4"/>',
      '<circle cx="20" cy="20" r="18" fill="none" stroke="#306e51" stroke-width="4" stroke-linecap="round" stroke-dasharray="113" stroke-dashoffset="113">',
      '<animate attributeName="stroke-dashoffset" dur="2s" values="113;0;113" repeatCount="indefinite"/>',
      "</circle>",
      "</svg>",
      "</div>",
      '<h3 class="quiz-loading-title">Processing Your Request...</h3>',
      '<p class="quiz-loading-step">Analyzing your responses...</p>',
      '<div class="quiz-loading-progress">',
      '<div class="quiz-loading-progress-bar" style="width: 0%;"></div>',
      "</div>",
      '<div class="quiz-loading-progress-text">0%</div>',
      "</div>",
      "</div>"
    ].join("");
  }
  generateTestModeIndicator(text) {
    text = text || "🧪 TEST MODE";
    return ['<div class="quiz-test-mode-indicator">', '<span class="quiz-test-mode-text">' + text + "</span>", "</div>"].join("");
  }
}
export {
  QuizTemplates as Q
};
//# sourceMappingURL=quiz-templates.js.map
