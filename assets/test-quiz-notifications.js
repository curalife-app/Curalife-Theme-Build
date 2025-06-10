/**
 * Test script to verify the modular notification integration with quiz
 * This script tests different notification types and formats
 */

// Test the notification system when the quiz loads
document.addEventListener("DOMContentLoaded", function () {
	// Wait for quiz to initialize
	setTimeout(() => {
		console.log("🧪 Testing quiz notification integration...");

		// Test if quiz is available
		if (typeof window.productQuiz !== "undefined" && window.productQuiz) {
			const quiz = window.productQuiz;

			// Test 1: Simple notification
			console.log("Test 1: Simple notification");
			quiz._showBackgroundProcessNotification("✅ Simple notification test", "success");

			// Test 2: Test mode notification with details
			setTimeout(() => {
				console.log("Test 2: Test mode notification");
				quiz._showBackgroundProcessNotification(
					"🧪 TEST MODE - Complex notification<br>This is a detailed test notification<br>With multiple lines of content<br>To verify expandable functionality",
					"info"
				);
			}, 1000);

			// Test 3: Error notification
			setTimeout(() => {
				console.log("Test 3: Error notification");
				quiz._showBackgroundProcessNotification("❌ Error notification test", "error");
			}, 2000);

			// Test 4: Warning notification
			setTimeout(() => {
				console.log("Test 4: Warning notification");
				quiz._showBackgroundProcessNotification("⚠️ Warning notification test", "warning");
			}, 3000);

			console.log("✅ All notification tests completed!");
		} else {
			console.log("❌ Quiz not found - cannot test notifications");
		}
	}, 2000);
});
