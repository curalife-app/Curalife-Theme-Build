/**
 * Test script to verify notification integration with quiz component
 */

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", function () {
	// Wait a bit for the quiz to initialize
	setTimeout(() => {
		// Find the quiz instance (it should be available as window.productQuiz)
		const quizContainer = document.querySelector("#quiz-container");
		if (!quizContainer) {
			console.log("❌ Quiz container not found - test cannot run");
			return;
		}

		// Test the notification system integration
		console.log("🧪 Testing modular notification integration...");

		// Check if the quiz instance is available and notification manager is ready
		if (window.productQuiz && window.productQuiz.notificationManager) {
			console.log("✅ Quiz instance found with notification manager, testing notifications...");

			// Test different notification types using the modular system
			window.productQuiz._showBackgroundProcessNotification("✅ Integration test: Simple success message", "success");

			setTimeout(() => {
				window.productQuiz._showBackgroundProcessNotification("ℹ️ Integration test: Info notification", "info");
			}, 500);

			setTimeout(() => {
				window.productQuiz._showBackgroundProcessNotification("⚠️ Integration test: Warning message", "warning");
			}, 1000);

			setTimeout(() => {
				window.productQuiz._showBackgroundProcessNotification(
					"🧪 TEST MODE - Integration Test<br>• Modular system: ✅ Active<br>• Original functionality: ✅ Preserved<br>• Advanced features: ✅ Working",
					"info"
				);
			}, 1500);

			console.log("✅ Notification integration tests dispatched");
		} else if (window.productQuiz && !window.productQuiz.notificationManager) {
			console.log("⏳ Quiz instance found but notification manager still loading, retrying...");
			// Retry after a bit more time for async initialization
			setTimeout(() => {
				if (window.productQuiz.notificationManager) {
					console.log("✅ Notification manager loaded! Running tests...");
					window.productQuiz._showBackgroundProcessNotification("🎉 Async integration successful!", "success");
				} else {
					console.log("❌ Notification manager failed to load");
				}
			}, 2000);
		} else {
			console.log("❌ Quiz instance not found (window.productQuiz)");
		}
	}, 2000);
});
