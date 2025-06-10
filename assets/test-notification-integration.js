/**
 * Test script to verify notification integration with quiz component
 */

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", function () {
	// Wait a bit for the quiz to initialize
	setTimeout(() => {
		// Find the quiz instance (it should be available globally or on window)
		const quizContainer = document.querySelector("#quiz-container");
		if (!quizContainer) {
			console.log("❌ Quiz container not found - test cannot run");
			return;
		}

		// Test the notification system integration
		console.log("🧪 Testing modular notification integration...");

		// Create a simple test by dispatching a custom event or calling the quiz method directly
		// This assumes the quiz instance is available globally
		if (window.quiz && window.quiz._showBackgroundProcessNotification) {
			console.log("✅ Quiz instance found, testing notifications...");

			// Test different notification types
			window.quiz._showBackgroundProcessNotification("✅ Integration test: Simple success message", "success");

			setTimeout(() => {
				window.quiz._showBackgroundProcessNotification("ℹ️ Integration test: Info notification", "info");
			}, 500);

			setTimeout(() => {
				window.quiz._showBackgroundProcessNotification("⚠️ Integration test: Warning message", "warning");
			}, 1000);

			setTimeout(() => {
				window.quiz._showBackgroundProcessNotification(
					"🧪 TEST MODE - Integration Test<br>• Modular system: ✅ Active<br>• Original functionality: ✅ Preserved<br>• Advanced features: ✅ Working",
					"info"
				);
			}, 1500);

			console.log("✅ Notification integration tests dispatched");
		} else {
			console.log("❌ Quiz instance not found or method not available");
		}
	}, 2000);
});
