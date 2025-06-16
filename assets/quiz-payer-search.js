import { QuizFormFieldBase } from "../base/quiz-form-field-base.js";

/**
 * Quiz Payer Search Component - Refactored
 * Extends QuizFormFieldBase for common form field functionality
 */
export class QuizPayerSearch extends QuizFormFieldBase {
	constructor() {
		super();
		this.selectedPayer = "";
		this.placeholder = "Start typing to search for your insurance plan...";
		this.commonPayers = [];
		this.searchTimeout = null;
		this.quizData = null;
	}

	static get observedAttributes() {
		return [...super.observedAttributes, "question-id", "placeholder", "selected-payer", "common-payers", "quiz-data"];
	}

	initialize() {
		this.parseAttributes();
		this.getQuizDataFromParent();
	}

	getQuizDataFromParent() {
		// Try to get quiz data from the parent quiz component
		const quizContainer = document.querySelector("#quiz-container");
		if (quizContainer && window.ModularQuiz) {
			// Access the quiz instance if available
			const quizInstance = quizContainer._quizInstance;
			if (quizInstance && quizInstance.quizData) {
				this.quizData = quizInstance.quizData;
			}
		}
	}

	parseAttributes() {
		this.parseCommonAttributes();
		this.questionId = this.getAttribute("question-id") || "";
		this.placeholder = this.getAttribute("placeholder") || "Start typing to search for your insurance plan...";
		this.selectedPayer = this.getAttribute("selected-payer") || "";
		this.currentValue = this.selectedPayer;

		try {
			const commonPayersAttr = this.getAttribute("common-payers");
			this.commonPayers = commonPayersAttr ? JSON.parse(commonPayersAttr) : [];
		} catch (error) {
			console.error("Invalid common payers data:", error);
			this.commonPayers = [];
		}

		try {
			const quizDataAttr = this.getAttribute("quiz-data");
			if (quizDataAttr) {
				this.quizData = JSON.parse(quizDataAttr);
			}
		} catch (error) {
			console.error("Invalid quiz data:", error);
		}
	}

	handleAttributeChange(name, oldValue, newValue) {
		// Handle common attributes
		this.handleCommonAttributeChange(name, oldValue, newValue);

		// Handle component-specific attributes
		switch (name) {
			case "question-id":
			case "placeholder":
			case "selected-payer":
			case "common-payers":
			case "quiz-data":
				this.parseAttributes();
				break;
		}
	}

	getFieldType() {
		return "payer-search";
	}

	getValue() {
		return this.selectedPayer;
	}

	setValue(value) {
		this.selectedPayer = value || "";
		this.currentValue = this.selectedPayer;
		this.setAttribute("selected-payer", this.selectedPayer);

		const searchInput = this.getInputElement();
		if (searchInput) {
			searchInput.value = this.resolvePayerDisplayName(this.selectedPayer);
		}
	}

	getInputElement() {
		return this.root.querySelector(".quiz-payer-search-input");
	}

	hasValidValue() {
		return this.selectedPayer && this.selectedPayer.trim() !== "";
	}

	getTemplate() {
		const selectedDisplayName = this.resolvePayerDisplayName(this.selectedPayer);

		return `
			<div class="quiz-payer-search-container">
				<div class="quiz-payer-search-input-wrapper">
					<input
						type="text"
						id="question-${this.questionId}"
						class="quiz-payer-search-input ${this.showError ? "quiz-input-error" : ""}"
						placeholder="${this.placeholder}"
						value="${selectedDisplayName}"
						autocomplete="off"
						aria-describedby="error-${this.questionId}"
					>
					<svg class="quiz-payer-search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
						<path d="M13.1667 13.1667L16.5 16.5M14.8333 8.16667C14.8333 4.48477 11.8486 1.5 8.16667 1.5C4.48477 1.5 1.5 4.48477 1.5 8.16667C1.5 11.8486 4.48477 14.8333 8.16667 14.8333C11.8486 14.8333 14.8333 11.8486 14.8333 8.16667Z" stroke="#121212" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</div>
				<div class="quiz-payer-search-dropdown" id="search-dropdown-${this.questionId}" style="display: none;">
					<div class="quiz-payer-search-dropdown-header">
						<span class="quiz-payer-search-dropdown-title">Suggestions</span>
						<button class="quiz-payer-search-close-btn" type="button" aria-label="Close dropdown">
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M12 4L4 12M4 4L12 12" stroke="#6B7280" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</button>
					</div>
					<div class="quiz-payer-search-results"></div>
				</div>
				${this.getErrorElementHTML(this.questionId)}
			</div>
		`;
	}

	getStyles() {
		// Styles are handled globally by quiz.css since we're using light DOM
		return "";
	}

	async render() {
		await this.renderTemplate();
		this.setupEventListeners();
	}

	setupEventListeners() {
		const searchInput = this.getInputElement();
		const dropdown = this.root.querySelector(".quiz-payer-search-dropdown");
		const closeBtn = this.root.querySelector(".quiz-payer-search-close-btn");
		const container = this.root.querySelector(".quiz-payer-search-container");

		if (!searchInput || !dropdown || !closeBtn || !container) return;

		// Search input events
		searchInput.addEventListener("input", e => {
			const query = e.target.value.trim();
			this.handleSearch(query, dropdown);

			// Clear error if user starts typing
			if ((this.showError || this.hasVisualError()) && query.length > 0) {
				this.clearError();
			}
		});

		searchInput.addEventListener("focus", () => {
			if (searchInput.value.trim() === "") {
				this.showInitialPayerList(dropdown);
			}
			this.openDropdown(dropdown, container, searchInput);
		});

		searchInput.addEventListener("blur", e => {
			// Use timeout to allow click events on dropdown items to fire first
			setTimeout(() => {
				if (!container.contains(document.activeElement)) {
					this.handleInputBlur();
				}
			}, 150);
		});

		// Close button
		closeBtn.addEventListener("click", () => {
			this.closeDropdown(dropdown, container, searchInput);
		});

		// Click outside to close
		document.addEventListener("click", e => {
			if (!container.contains(e.target)) {
				this.closeDropdown(dropdown, container, searchInput);
			}
		});
	}

	handleSearch(query, dropdown) {
		clearTimeout(this.searchTimeout);

		if (query.length === 0) {
			this.showInitialPayerList(dropdown);
			return;
		}

		// Debounce search
		this.searchTimeout = setTimeout(async () => {
			try {
				const results = await this.searchPayers(query);
				this.renderSearchResults(results, query, dropdown);
			} catch (error) {
				console.error("Search error:", error);
				this.showSearchError(dropdown);
			}
		}, 300);
	}

	async searchPayers(query) {
		// First try API search if available
		try {
			const apiResults = await this.searchPayersAPI(query);
			if (apiResults && apiResults.length > 0) {
				return apiResults.map(item => item.payer);
			}
		} catch (error) {
			console.warn("API search failed, falling back to local search:", error);
		}

		// Fallback to common payers
		return this.filterCommonPayers(query);
	}

	filterCommonPayers(query) {
		if (!query || query.length === 0) {
			return this.commonPayers;
		}

		const queryLower = query.toLowerCase();
		return this.commonPayers.filter(payer => {
			const nameMatch = payer.displayName.toLowerCase().includes(queryLower);
			const aliasMatch = payer.aliases?.some(alias => alias.toLowerCase().includes(queryLower));
			return nameMatch || aliasMatch;
		});
	}

	async searchPayersAPI(query) {
		// Get API configuration from quiz data
		if (!this.quizData) {
			this.getQuizDataFromParent();
		}

		const config = this.quizData?.config?.apiConfig || {};
		const apiKey = config.stediApiKey;

		if (!apiKey || apiKey.trim() === "") {
			console.warn("Stedi API key not configured or empty, using local search only");
			return null;
		}

		const baseUrl = "https://healthcare.us.stedi.com/2024-04-01/payers/search";
		const params = new URLSearchParams({
			query: query,
			pageSize: "10",
			eligibilityCheck: "SUPPORTED"
		});

		const url = `${baseUrl}?${params}`;

		const response = await fetch(url, {
			method: "GET",
			headers: {
				Authorization: apiKey,
				Accept: "application/json"
			}
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`API request failed: ${response.status} - ${errorText}`);
		}

		const data = await response.json();

		const transformedResults =
			data.items?.map(item => ({
				payer: {
					stediId: item.payer.stediId,
					displayName: item.payer.displayName,
					primaryPayerId: item.payer.primaryPayerId,
					aliases: item.payer.aliases || [],
					score: item.score
				}
			})) || [];

		return transformedResults;
	}

	showInitialPayerList(dropdown) {
		const results = this.commonPayers;
		this.renderSearchResults(results, "", dropdown);
	}

	renderSearchResults(results, query, dropdown) {
		const resultsContainer = dropdown.querySelector(".quiz-payer-search-results");

		if (results.length === 0) {
			resultsContainer.innerHTML = `<div class="quiz-payer-search-no-results">No insurance plans found. Try a different search term.</div>`;
		} else {
			const resultsHTML = results
				.map((payer, index) => {
					const highlightedName = this.highlightSearchTerm(payer.displayName, query);
					const isApiResult = payer.score !== undefined;

					return `
					<div class="quiz-payer-search-item" data-index="${index}">
						<div class="quiz-payer-search-item-name">
							${highlightedName}
						</div>
						<div class="quiz-payer-search-item-details">
							<span class="quiz-payer-search-item-id">${payer.stediId}</span>
							${payer.aliases?.length > 0 ? `• ${payer.aliases.slice(0, 2).join(", ")}` : ""}
							${isApiResult && payer.score ? `• Score: ${payer.score.toFixed(1)}` : ""}
						</div>
					</div>
				`;
				})
				.join("");

			resultsContainer.innerHTML = resultsHTML;

			const resultItems = resultsContainer.querySelectorAll(".quiz-payer-search-item");
			resultItems.forEach((item, index) => {
				item.addEventListener("click", () => {
					this.selectPayer(results[index]);
				});
			});
		}

		dropdown.classList.add("visible");
		dropdown.style.display = "block";
	}

	selectPayer(payer) {
		const searchInput = this.getInputElement();
		const dropdown = this.root.querySelector(".quiz-payer-search-dropdown");
		const container = this.root.querySelector(".quiz-payer-search-container");

		// Update the search input with the selected payer name
		searchInput.value = payer.displayName;
		searchInput.classList.add("quiz-input-valid");

		// Use primaryPayerId if available, otherwise fall back to stediId
		this.selectedPayer = payer.primaryPayerId || payer.stediId;
		this.currentValue = this.selectedPayer;
		this.closeDropdown(dropdown, container, searchInput);

		// Clear error state when user makes a valid selection
		if ((this.showError || this.hasVisualError()) && this.selectedPayer) {
			this.clearError();
		}

		// Dispatch custom event for parent component
		this.dispatchEvent(
			new CustomEvent("payer-selected", {
				detail: {
					questionId: this.questionId,
					payer: {
						...payer,
						// Ensure we have both IDs for compatibility
						stediId: payer.stediId || payer.primaryPayerId,
						primaryPayerId: payer.primaryPayerId || payer.stediId
					}
				},
				bubbles: true
			})
		);

		// Also dispatch standard answer selected event
		this.dispatchAnswerSelected(this.selectedPayer);
	}

	openDropdown(dropdown, container, searchInput) {
		dropdown.classList.add("visible");
		dropdown.style.display = "block";
		container.classList.add("open");

		// Mobile scroll behavior
		const isMobile = window.innerWidth <= 768;
		if (isMobile) {
			setTimeout(() => {
				const inputRect = searchInput.getBoundingClientRect();
				const offset = 20;
				const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
				const targetScrollY = currentScrollY + inputRect.top - offset;

				window.scrollTo({
					top: Math.max(0, targetScrollY),
					behavior: "smooth"
				});
			}, 100);
		}
	}

	closeDropdown(dropdown, container, searchInput) {
		dropdown.classList.remove("visible");
		dropdown.style.display = "none";
		container.classList.remove("open");
	}

	showSearchError(dropdown) {
		const resultsContainer = dropdown.querySelector(".quiz-payer-search-results");
		resultsContainer.innerHTML = `<div class="quiz-payer-search-error">Error searching. Please try again.</div>`;
	}

	highlightSearchTerm(text, searchTerm) {
		if (!searchTerm || !text) return text;
		const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
		return text.replace(regex, '<span class="quiz-payer-search-highlight">$1</span>');
	}

	resolvePayerDisplayName(payerId) {
		if (!payerId) return "";
		const payer = this.commonPayers.find(p => p.stediId === payerId || p.primaryPayerId === payerId);
		return payer ? payer.displayName : payerId;
	}

	updateFieldErrorStyling() {
		const input = this.getInputElement();
		if (input) {
			if (this.showError) {
				input.classList.add("quiz-input-error");
			} else {
				input.classList.remove("quiz-input-error");
			}
		}
	}

	clearVisualErrorState() {
		super.clearVisualErrorState();

		const input = this.getInputElement();
		if (input) {
			input.classList.remove("quiz-input-error");
		}
	}
}

if (!customElements.get("quiz-payer-search")) {
	customElements.define("quiz-payer-search", QuizPayerSearch);
}

export default QuizPayerSearch;
