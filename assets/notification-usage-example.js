/**
 * Notification System Usage Examples
 * Demonstrates how to use the modular notification system across different components
 */

import { NotificationManager, NotificationUtils } from "../utils/notifications.js";
import { NOTIFICATION_TYPES, NOTIFICATION_POSITIONS, NOTIFICATION_DEFAULTS } from "../utils/notification-config.js";

// Example 1: Basic Usage
export function basicNotificationExample() {
	// Create a basic notification manager with default settings
	const notifications = new NotificationManager();

	// Show different types of notifications
	notifications.show("Operation completed successfully!", NOTIFICATION_TYPES.SUCCESS);
	notifications.show("Warning: Check your input", NOTIFICATION_TYPES.WARNING);
	notifications.show("An error occurred while processing", NOTIFICATION_TYPES.ERROR);
	notifications.show("Additional information available", NOTIFICATION_TYPES.INFO);

	return notifications;
}

// Example 2: Custom Configuration
export function customConfigurationExample() {
	const notifications = new NotificationManager({
		position: NOTIFICATION_POSITIONS.BOTTOM_RIGHT,
		maxNotifications: 10,
		defaultDuration: 3000,
		autoCollapse: false,
		enableFiltering: false,
		enableCopy: false
	});

	notifications.show("Custom positioned notification", NOTIFICATION_TYPES.INFO);

	return notifications;
}

// Example 3: E-commerce Component Integration
export function ecommerceComponentExample() {
	const cartNotifications = new NotificationManager({
		containerSelector: ".cart-notifications",
		position: NOTIFICATION_POSITIONS.TOP_RIGHT,
		maxNotifications: 5,
		defaultDuration: 4000
	});

	// Simulate cart operations
	function addToCart(productName) {
		cartNotifications.show(`${productName} added to cart`, NOTIFICATION_TYPES.SUCCESS, null, 3000);
	}

	function removeFromCart(productName) {
		cartNotifications.show(`${productName} removed from cart`, NOTIFICATION_TYPES.INFO, null, 2000);
	}

	function cartError(message) {
		cartNotifications.show(
			`Cart Error: ${message}`,
			NOTIFICATION_TYPES.ERROR,
			"error",
			0 // Never auto-remove errors
		);
	}

	return { cartNotifications, addToCart, removeFromCart, cartError };
}

// Example 4: Form Validation Component
export function formValidationExample() {
	const formNotifications = new NotificationManager({
		containerSelector: ".form-notifications",
		position: NOTIFICATION_POSITIONS.TOP_CENTER,
		maxNotifications: 3,
		defaultDuration: 5000,
		enableFiltering: false,
		enableCopy: false
	});

	function validateForm(formData) {
		const errors = [];

		if (!formData.email) {
			errors.push("Email is required");
		}
		if (!formData.password) {
			errors.push("Password is required");
		}
		if (formData.password && formData.password.length < 8) {
			errors.push("Password must be at least 8 characters");
		}

		if (errors.length > 0) {
			const errorMessage = errors.join("\n");
			formNotifications.show(`Form Validation Errors:\n${errorMessage}`, NOTIFICATION_TYPES.ERROR, "error");
			return false;
		}

		formNotifications.show("Form submitted successfully!", NOTIFICATION_TYPES.SUCCESS);
		return true;
	}

	return { formNotifications, validateForm };
}

// Example 5: API Status Component
export function apiStatusExample() {
	const apiNotifications = new NotificationManager({
		containerSelector: ".api-status-notifications",
		position: NOTIFICATION_POSITIONS.BOTTOM_LEFT,
		maxNotifications: 20,
		defaultDuration: 0, // Keep all notifications
		enableFiltering: true,
		enableCopy: true
	});

	function logApiCall(endpoint, method, status, responseTime) {
		let type = NOTIFICATION_TYPES.INFO;
		let priority = "info";

		if (status >= 200 && status < 300) {
			type = NOTIFICATION_TYPES.SUCCESS;
			priority = "success";
		} else if (status >= 400 && status < 500) {
			type = NOTIFICATION_TYPES.WARNING;
			priority = "warning";
		} else if (status >= 500) {
			type = NOTIFICATION_TYPES.ERROR;
			priority = "error";
		}

		const message = `API Call: ${method} ${endpoint}\nStatus: ${status}\nResponse Time: ${responseTime}ms`;

		apiNotifications.show(message, type, priority);
	}

	function logCriticalError(error) {
		apiNotifications.show(`Critical API Error: ${error.message}\nStack: ${error.stack}`, NOTIFICATION_TYPES.ERROR, "critical");
	}

	return { apiNotifications, logApiCall, logCriticalError };
}

// Example 6: Quick Notifications (No persistent manager)
export function quickNotificationExample() {
	// For simple, one-off notifications
	NotificationUtils.showQuickNotification("Quick success message!", NOTIFICATION_TYPES.SUCCESS);

	setTimeout(() => {
		NotificationUtils.showQuickNotification("Quick info message!", NOTIFICATION_TYPES.INFO);
	}, 1000);
}

// Example 7: Multi-Component Application
export class ApplicationNotificationSystem {
	constructor() {
		// Global notification manager for app-wide messages
		this.global = new NotificationManager({
			containerSelector: ".global-notifications",
			position: NOTIFICATION_POSITIONS.TOP_RIGHT,
			maxNotifications: 15,
			defaultDuration: 5000
		});

		// Feature-specific managers
		this.auth = new NotificationManager({
			containerSelector: ".auth-notifications",
			position: NOTIFICATION_POSITIONS.TOP_CENTER,
			maxNotifications: 3,
			defaultDuration: 4000,
			enableFiltering: false,
			enableCopy: false
		});

		this.debug = new NotificationManager({
			containerSelector: ".debug-notifications",
			position: NOTIFICATION_POSITIONS.BOTTOM_RIGHT,
			maxNotifications: 50,
			defaultDuration: 0,
			enableFiltering: true,
			enableCopy: true
		});
	}

	// Global app messages
	showGlobalMessage(message, type = NOTIFICATION_TYPES.INFO) {
		this.global.show(message, type);
	}

	// Authentication related
	showAuthSuccess(message) {
		this.auth.show(message, NOTIFICATION_TYPES.SUCCESS);
	}

	showAuthError(message) {
		this.auth.show(message, NOTIFICATION_TYPES.ERROR, "error", 0);
	}

	// Debug messages (only in development)
	showDebugMessage(message, type = NOTIFICATION_TYPES.INFO) {
		if (process.env.NODE_ENV === "development") {
			this.debug.show(`[DEBUG] ${message}`, type);
		}
	}

	// Clear all notifications
	clearAll() {
		this.global.clear();
		this.auth.clear();
		this.debug.clear();
	}

	// Destroy all managers
	destroy() {
		this.global.destroy();
		this.auth.destroy();
		this.debug.destroy();
	}
}

// Example 8: Integration with existing quiz component
export function integrateWithQuizComponent(quizInstance) {
	// Replace the quiz's notification system with the modular one
	const notifications = new NotificationManager({
		containerSelector: ".quiz-background-notifications",
		maxNotifications: 50,
		defaultDuration: 5000,
		enableFiltering: true,
		enableCopy: true
	});

	// Create a wrapper function that mimics the original quiz method
	quizInstance._showBackgroundProcessNotification = function (text, type = "info", priority = null) {
		return notifications.show(text, type, priority);
	};

	// Add additional methods to the quiz instance
	quizInstance.clearNotifications = function () {
		notifications.clear();
	};

	quizInstance.exportNotifications = function (format = "text", filter = "all") {
		const copyButton = document.querySelector(".quiz-notification-copy-button");
		if (copyButton) {
			notifications.exportNotifications(format, filter, copyButton);
		}
	};

	return notifications;
}

// Example 9: React Component Integration (if using React)
export function createReactNotificationHook() {
	return function useNotifications(options = {}) {
		const [manager] = useState(() => new NotificationManager(options));

		useEffect(() => {
			return () => manager.destroy();
		}, [manager]);

		const showNotification = useCallback(
			(text, type, priority, duration) => {
				return manager.show(text, type, priority, duration);
			},
			[manager]
		);

		const clearNotifications = useCallback(() => {
			manager.clear();
		}, [manager]);

		return {
			showNotification,
			clearNotifications,
			manager
		};
	};
}

// Example 10: Event-driven notifications
export function eventDrivenNotificationExample() {
	const notifications = new NotificationManager();

	// Listen for custom events
	document.addEventListener("user:login", event => {
		notifications.show(`Welcome back, ${event.detail.username}!`, NOTIFICATION_TYPES.SUCCESS);
	});

	document.addEventListener("user:logout", () => {
		notifications.show("You have been logged out", NOTIFICATION_TYPES.INFO);
	});

	document.addEventListener("error:api", event => {
		notifications.show(`API Error: ${event.detail.message}`, NOTIFICATION_TYPES.ERROR, "error");
	});

	document.addEventListener("warning:performance", event => {
		notifications.show(`Performance Warning: ${event.detail.message}`, NOTIFICATION_TYPES.WARNING, "warning");
	});

	return notifications;
}

// Export all examples for easy import
export default {
	basicNotificationExample,
	customConfigurationExample,
	ecommerceComponentExample,
	formValidationExample,
	apiStatusExample,
	quickNotificationExample,
	ApplicationNotificationSystem,
	integrateWithQuizComponent,
	createReactNotificationHook,
	eventDrivenNotificationExample
};
