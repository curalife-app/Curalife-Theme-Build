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
			return "";
		}
	}

	// Get quiz-specific styles
	async getQuizStyles() {
		return this.loadStyles("/assets/quiz.css");
	}

	// Create a style element with the shared styles
	createStyleElement(additionalCSS = "") {
		const styleElement = document.createElement("style");

		// Load shared styles asynchronously and update
		this.getQuizStyles()
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
}

// Create singleton instance
const sharedStyles = new SharedStyles();

export default sharedStyles;
