// Shared styles utility for quiz components
class SharedStyles {
	constructor() {
		this.stylesCache = new Map();
		this.loadingPromises = new Map();
	}

	async loadStyles(cssPath) {
		// Return cached styles if already loaded
		if (this.stylesCache.has(cssPath)) {
			return this.stylesCache.get(cssPath);
		}

		// Return existing promise if already loading
		if (this.loadingPromises.has(cssPath)) {
			return this.loadingPromises.get(cssPath);
		}

		// Create new loading promise
		const loadingPromise = this.fetchStyles(cssPath);
		this.loadingPromises.set(cssPath, loadingPromise);

		try {
			const styles = await loadingPromise;
			this.stylesCache.set(cssPath, styles);
			this.loadingPromises.delete(cssPath);
			return styles;
		} catch (error) {
			this.loadingPromises.delete(cssPath);
			throw error;
		}
	}

	async fetchStyles(cssPath) {
		try {
			const response = await fetch(cssPath);
			if (!response.ok) {
				throw new Error(`Failed to load CSS: ${response.status}`);
			}
			return await response.text();
		} catch (error) {
			console.warn(`Could not load shared styles from ${cssPath}:`, error);

			// Try alternative paths if the main path fails
			if (cssPath.includes("/assets/quiz.css")) {
				const alternatives = [cssPath.replace("/assets/", "/assets/"), "./assets/quiz.css", "../assets/quiz.css"];

				for (const altPath of alternatives) {
					if (altPath !== cssPath) {
						try {
							const altResponse = await fetch(altPath);
							if (altResponse.ok) {
								console.log(`✓ Loaded styles from alternative path: ${altPath}`);
								return await altResponse.text();
							}
						} catch (altError) {
							// Continue to next alternative
						}
					}
				}
			}

			return "";
		}
	}

	// Get quiz-specific styles with configurable URL
	async getQuizStyles(cssUrl = null) {
		// Use provided URL or try to get from global config
		const url = cssUrl || window.QUIZ_CSS_URL || "/assets/quiz.css";

		// Debug logging
		if (window.QUIZ_CONFIG?.debug) {
			console.log(`🎨 Loading quiz styles from: ${url}`);
		}

		return this.loadStyles(url);
	}

	// Create a style element with the shared styles
	createStyleElement(additionalCSS = "", cssUrl = null) {
		const styleElement = document.createElement("style");

		// Load shared styles asynchronously and update
		this.getQuizStyles(cssUrl)
			.then(sharedCSS => {
				styleElement.textContent = sharedCSS + "\n" + additionalCSS;
			})
			.catch(() => {
				// Fallback to just additional CSS if shared styles fail
				styleElement.textContent = additionalCSS;
			});

		// Set initial content with just additional CSS
		styleElement.textContent = additionalCSS;

		return styleElement;
	}

	// Set global CSS URL for all components
	setQuizCssUrl(url) {
		window.QUIZ_CSS_URL = url;
	}
}

// Create singleton instance
const sharedStyles = new SharedStyles();

export default sharedStyles;
