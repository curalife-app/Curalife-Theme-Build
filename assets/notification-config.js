/**
 * Notification System Configuration
 * Default settings and constants for the modular notification system
 */

export const NOTIFICATION_DEFAULTS = {
	// Basic settings
	containerSelector: ".quiz-background-notifications",
	position: "top-right",
	autoCollapse: true,
	maxNotifications: 50,
	defaultDuration: 5000,
	enableFiltering: true,
	enableCopy: true,

	// Animation settings
	animationDuration: 400,
	expandDuration: 8000,
	removeDuration: 300,

	// Display thresholds
	expandableTextLength: 100,

	// Z-index values
	containerZIndex: 1000,
	buttonZIndex: 10000,
	menuZIndex: 10001
};

export const NOTIFICATION_TYPES = {
	SUCCESS: "success",
	ERROR: "error",
	WARNING: "warning",
	INFO: "info"
};

export const NOTIFICATION_PRIORITIES = {
	CRITICAL: "critical",
	ERROR: "error",
	WARNING: "warning",
	SUCCESS: "success",
	INFO: "info"
};

export const NOTIFICATION_POSITIONS = {
	TOP_RIGHT: "top-right",
	TOP_LEFT: "top-left",
	BOTTOM_RIGHT: "bottom-right",
	BOTTOM_LEFT: "bottom-left",
	TOP_CENTER: "top-center",
	BOTTOM_CENTER: "bottom-center"
};

export const EXPORT_FORMATS = {
	TEXT: "text",
	JSON: "json",
	CSV: "csv"
};

export const FILTER_OPTIONS = {
	ALL: "all",
	ERROR: "error",
	SUCCESS: "success",
	WARNING: "warning",
	INFO: "info"
};

export const PRIORITY_CONFIGS = {
	[NOTIFICATION_PRIORITIES.CRITICAL]: {
		color: "#dc2626",
		shouldPulse: true,
		gradient: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)"
	},
	[NOTIFICATION_PRIORITIES.ERROR]: {
		color: "#dc2626",
		shouldPulse: false,
		gradient: "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)"
	},
	[NOTIFICATION_PRIORITIES.WARNING]: {
		color: "#f59e0b",
		shouldPulse: false,
		gradient: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
	},
	[NOTIFICATION_PRIORITIES.SUCCESS]: {
		color: "#059669",
		shouldPulse: false,
		gradient: "linear-gradient(135deg, #059669 0%, #10b981 100%)"
	},
	[NOTIFICATION_PRIORITIES.INFO]: {
		color: "#2563eb",
		shouldPulse: false,
		gradient: "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)"
	}
};

export const TYPE_ICONS = {
	[NOTIFICATION_TYPES.SUCCESS]: "✓",
	[NOTIFICATION_TYPES.ERROR]: "✗",
	[NOTIFICATION_TYPES.WARNING]: "⚠",
	[NOTIFICATION_TYPES.INFO]: "ℹ"
};

export const FILTER_EMOJIS = {
	[FILTER_OPTIONS.ALL]: "🔍",
	[FILTER_OPTIONS.ERROR]: "❌",
	[FILTER_OPTIONS.SUCCESS]: "✅",
	[FILTER_OPTIONS.WARNING]: "⚠️",
	[FILTER_OPTIONS.INFO]: "ℹ️"
};

export const CSS_CLASSES = {
	// Container classes
	CONTAINER: "quiz-background-notifications",

	// Notification classes
	NOTIFICATION: "quiz-notification",
	NOTIFICATION_SUCCESS: "quiz-notification-success",
	NOTIFICATION_ERROR: "quiz-notification-error",
	NOTIFICATION_WARNING: "quiz-notification-warning",
	NOTIFICATION_INFO: "quiz-notification-info",

	// Animation classes
	ANIMATE_IN: "animate-in",
	ANIMATE_OUT: "animate-out",
	FILTER_HIDDEN: "filter-hidden",
	FILTER_VISIBLE: "filter-visible",

	// Structure classes
	HEADER: "quiz-notification-header",
	CONTENT: "quiz-notification-content",
	ICON: "quiz-notification-icon",
	SIMPLE_ICON: "quiz-notification-simple-icon",
	TITLE: "quiz-notification-title",
	TOGGLE: "quiz-notification-toggle",
	DETAILS: "quiz-notification-details",
	DETAILS_CONTENT: "quiz-notification-details-content",
	CLOSE: "quiz-notification-close",
	SHIMMER: "quiz-notification-shimmer",
	SIMPLE: "quiz-notification-simple",
	SIMPLE_TEXT: "quiz-notification-simple-text",

	// Control classes
	COPY_BUTTON: "quiz-notification-copy-button",
	FILTER_BUTTON: "quiz-notification-filter-button",
	COPY_MENU: "quiz-copy-options-menu",
	FILTER_MENU: "quiz-filter-options-menu",
	MENU_ITEM: "quiz-copy-options-menu-item",
	FILTER_MENU_ITEM: "quiz-filter-options-menu-item",
	MENU_DIVIDER: "quiz-copy-options-menu-divider",

	// Priority classes
	PRIORITY_CRITICAL: "quiz-notification-priority-critical",
	PRIORITY_ERROR: "quiz-notification-priority-error",
	PRIORITY_WARNING: "quiz-notification-priority-warning",
	PRIORITY_SUCCESS: "quiz-notification-priority-success",
	PRIORITY_INFO: "quiz-notification-priority-info",

	// State classes
	EXPANDED: "expanded",
	SUCCESS: "success",
	ERROR: "error",
	ACTIVE: "active"
};

export const SELECTORS = {
	NOTIFICATION_TEXT: ".quiz-notification-title, .quiz-notification-simple-text",
	NOTIFICATION_DETAILS: ".quiz-notification-details-content",
	EXPANDABLE_DETAILS: ".quiz-notification-details",
	CONTROL_BUTTONS: ".quiz-notification-copy-button, .quiz-notification-filter-button",
	CONTEXT_MENUS: ".quiz-copy-options-menu, .quiz-filter-options-menu"
};

export const KEYBOARD_SHORTCUTS = {
	EXPAND_ALL: "e",
	COLLAPSE_ALL: "c",
	CLEAR_ALL: "x",
	TOGGLE_FILTER: "f",
	COPY_ALL: "ctrl+c"
};

export const ARIA_LABELS = {
	CONTAINER: "Notification center",
	NOTIFICATION: "Notification",
	EXPAND_BUTTON: "Expand notification details",
	COLLAPSE_BUTTON: "Collapse notification details",
	CLOSE_BUTTON: "Close notification",
	COPY_BUTTON: "Copy notifications to clipboard",
	FILTER_BUTTON: "Filter notifications by type",
	COPY_MENU: "Copy options menu",
	FILTER_MENU: "Filter options menu"
};

export const POSITION_STYLES = {
	[NOTIFICATION_POSITIONS.TOP_RIGHT]: {
		top: "20px",
		right: "20px",
		left: "auto",
		bottom: "auto"
	},
	[NOTIFICATION_POSITIONS.TOP_LEFT]: {
		top: "20px",
		left: "20px",
		right: "auto",
		bottom: "auto"
	},
	[NOTIFICATION_POSITIONS.BOTTOM_RIGHT]: {
		bottom: "20px",
		right: "20px",
		top: "auto",
		left: "auto"
	},
	[NOTIFICATION_POSITIONS.BOTTOM_LEFT]: {
		bottom: "20px",
		left: "20px",
		top: "auto",
		right: "auto"
	},
	[NOTIFICATION_POSITIONS.TOP_CENTER]: {
		top: "20px",
		left: "50%",
		transform: "translateX(-50%)",
		right: "auto",
		bottom: "auto"
	},
	[NOTIFICATION_POSITIONS.BOTTOM_CENTER]: {
		bottom: "20px",
		left: "50%",
		transform: "translateX(-50%)",
		top: "auto",
		right: "auto"
	}
};

export const MOBILE_BREAKPOINT = 768;

export const MOBILE_OVERRIDES = {
	maxNotifications: 10,
	buttonSize: 44,
	buttonSpacing: 84,
	containerPadding: 10
};

export const ACCESSIBILITY_CONFIG = {
	enableKeyboardNavigation: true,
	enableAriaLabels: true,
	enableFocusManagement: true,
	respectReducedMotion: true
};

export const VALIDATION_RULES = {
	maxTextLength: 10000,
	maxNotifications: 100,
	minDuration: 100,
	maxDuration: 60000
};

// Utility function to get CSS class with prefix
export function getNotificationClass(baseClass, prefix = "quiz-notification") {
	return `${prefix}-${baseClass}`;
}

// Utility function to validate configuration
export function validateConfig(config) {
	const errors = [];

	if (config.maxNotifications > VALIDATION_RULES.maxNotifications) {
		errors.push(`maxNotifications exceeds limit of ${VALIDATION_RULES.maxNotifications}`);
	}

	if (config.defaultDuration < VALIDATION_RULES.minDuration || config.defaultDuration > VALIDATION_RULES.maxDuration) {
		errors.push(`defaultDuration must be between ${VALIDATION_RULES.minDuration} and ${VALIDATION_RULES.maxDuration}ms`);
	}

	if (config.position && !Object.values(NOTIFICATION_POSITIONS).includes(config.position)) {
		errors.push(`Invalid position: ${config.position}`);
	}

	return {
		isValid: errors.length === 0,
		errors
	};
}

export default {
	NOTIFICATION_DEFAULTS,
	NOTIFICATION_TYPES,
	NOTIFICATION_PRIORITIES,
	NOTIFICATION_POSITIONS,
	EXPORT_FORMATS,
	FILTER_OPTIONS,
	PRIORITY_CONFIGS,
	TYPE_ICONS,
	FILTER_EMOJIS,
	CSS_CLASSES,
	SELECTORS,
	KEYBOARD_SHORTCUTS,
	ARIA_LABELS,
	POSITION_STYLES,
	MOBILE_BREAKPOINT,
	MOBILE_OVERRIDES,
	ACCESSIBILITY_CONFIG,
	VALIDATION_RULES,
	getNotificationClass,
	validateConfig
};
