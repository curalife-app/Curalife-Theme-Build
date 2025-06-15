/**
 * Quiz Web Components Initialization Utility
 *
 * Provides initialization and debugging utilities for quiz Web Components.
 * Handles configuration validation and provides fallback mechanisms.
 */

import sharedStyles from "./shared-styles.js";

// Import all quiz Web Components
import "../content/quiz-coverage-card.js";
import "../content/quiz-action-section.js";
import "../content/quiz-loading-display.js";
import "../content/quiz-faq-section.js";
import "../content/quiz-payer-search.js";
import "../content/quiz-result-card.js";

class QuizComponentsInit {
	constructor() {
		this.initialized = false;
		this.config = null;
	}

	/**
	 * Initialize quiz components with configuration
	 */
	async init(config = {}) {
		if (this.initialized) {
			console.warn("Quiz components already initialized");
			return;
		}

		// Merge provided config with global config
		this.config = {
			cssUrl: config.cssUrl || window.QUIZ_CSS_URL || window.QUIZ_CONFIG?.cssUrl,
			debug: config.debug || window.QUIZ_CONFIG?.debug || false,
			fallbackCssUrl: config.fallbackCssUrl || "/assets/quiz.css",
			...config
		};

		// Set global CSS URL if provided
		if (this.config.cssUrl) {
			sharedStyles.setQuizCssUrl(this.config.cssUrl);
		}

		// Debug logging
		if (this.config.debug) {
			console.log("🎯 Quiz Web Components Initialization:", this.config);
			await this.validateConfiguration();
		}

		this.initialized = true;
	}

	/**
	 * Validate configuration and CSS accessibility
	 */
	async validateConfiguration() {
		const cssUrl = this.config.cssUrl || this.config.fallbackCssUrl;

		console.log("🔍 Validating quiz components configuration...");
		console.log("📍 CSS URL:", cssUrl);

		try {
			// Test CSS loading
			const styles = await sharedStyles.getQuizStyles(cssUrl);
			if (styles && styles.length > 0) {
				console.log("✅ Quiz CSS loaded successfully:", `${styles.length} characters`);
			} else {
				console.warn("⚠️ Quiz CSS loaded but appears empty");
			}
		} catch (error) {
			console.error("❌ Failed to load quiz CSS:", error);
			console.log("🔄 Will attempt fallback loading when components render");
		}

		// Check for required global variables
		const checks = [
			{ name: "QUIZ_CSS_URL", value: window.QUIZ_CSS_URL },
			{ name: "QUIZ_CONFIG", value: window.QUIZ_CONFIG }
		];

		checks.forEach(check => {
			if (check.value) {
				console.log(`✅ ${check.name}:`, check.value);
			} else {
				console.warn(`⚠️ ${check.name} not found`);
			}
		});
	}

	/**
	 * Get current configuration
	 */
	getConfig() {
		return this.config;
	}

	/**
	 * Check if components are initialized
	 */
	isInitialized() {
		return this.initialized;
	}

	/**
	 * Manually set CSS URL (useful for testing)
	 */
	setCssUrl(url) {
		if (this.config) {
			this.config.cssUrl = url;
		}
		sharedStyles.setQuizCssUrl(url);

		if (this.config?.debug) {
			console.log("🎨 CSS URL updated to:", url);
		}
	}
}

// Create singleton instance
const quizComponentsInit = new QuizComponentsInit();

// Auto-initialize if global config is available
if (typeof window !== "undefined") {
	// Wait for DOM to be ready
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", () => {
			if (window.QUIZ_CONFIG || window.QUIZ_CSS_URL) {
				quizComponentsInit.init();
			}
		});
	} else {
		// DOM is already ready
		if (window.QUIZ_CONFIG || window.QUIZ_CSS_URL) {
			quizComponentsInit.init();
		}
	}
}

export default quizComponentsInit;
