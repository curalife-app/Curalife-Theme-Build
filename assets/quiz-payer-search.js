import { SharedStyles } from "../utils/shared-styles.js";

export class QuizPayerSearch extends HTMLElement {
	constructor() {
		super();
		this.attachShadow({ mode: "open" });
		this.selectedPayer = "";
		this.placeholder = "Start typing to search for your insurance plan...";
		this.commonPayers = [];
		this.questionId = "";
		this.searchTimeout = null;
	}

	static get observedAttributes() {
		return ["question-id", "placeholder", "selected-payer", "common-payers"];
	}

	attributeChangedCallback(name, oldValue, newValue) {
		switch (name) {
			case "question-id":
				this.questionId = newValue || "";
				break;
			case "placeholder":
				this.placeholder = newValue || "Start typing to search for your insurance plan...";
				break;
			case "selected-payer":
				this.selectedPayer = newValue || "";
				break;
			case "common-payers":
				try {
					this.commonPayers = newValue ? JSON.parse(newValue) : [];
				} catch (error) {
					console.error("Invalid common payers data:", error);
					this.commonPayers = [];
				}
				break;
		}
		if (this.shadowRoot.innerHTML) {
			this.render();
		}
	}

	connectedCallback() {
		this.render();
	}

	async render() {
		const sharedStyles = await SharedStyles.getQuizStyles();
		const template = this.getTemplate();
		const styles = this.getStyles();

		this.shadowRoot.innerHTML = `
			<style>
				${sharedStyles}
				${styles}
			</style>
			${template}
		`;

		this.attachEventListeners();
	}

	getTemplate() {
		const selectedDisplayName = this.resolvePayerDisplayName(this.selectedPayer);

		return `
			<div class="quiz-payer-search-container">
				<div class="quiz-payer-search-input-wrapper">
					<input
						type="text"
						id="question-${this.questionId}"
						class="quiz-payer-search-input"
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
				<p id="error-${this.questionId}" class="quiz-error-text quiz-error-hidden"></p>
			</div>
		`;
	}

	getStyles() {
		return `
			:host {
				display: block;
			}
		`;
	}

	attachEventListeners() {
		const searchInput = this.shadowRoot.querySelector(".quiz-payer-search-input");
		const dropdown = this.shadowRoot.querySelector(".quiz-payer-search-dropdown");
		const closeBtn = this.shadowRoot.querySelector(".quiz-payer-search-close-btn");
		const container = this.shadowRoot.querySelector(".quiz-payer-search-container");

		// Search input events
		searchInput.addEventListener("input", e => {
			const query = e.target.value.trim();
			this.handleSearch(query, dropdown);
		});

		searchInput.addEventListener("focus", () => {
			if (searchInput.value.trim() === "") {
				this.showInitialPayerList(dropdown);
			}
			this.openDropdown(dropdown, container, searchInput);
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
		// First try common payers
		const commonResults = this.filterCommonPayers(query);

		// If we have good common results, return them
		if (commonResults.length > 0) {
			return commonResults;
		}

		// Otherwise, try API search
		try {
			return await this.searchPayersAPI(query);
		} catch (error) {
			console.error("API search failed:", error);
			return commonResults; // Fallback to common payers even if empty
		}
	}

	filterCommonPayers(query) {
		const queryLower = query.toLowerCase();
		return this.commonPayers.filter(payer => {
			const nameMatch = payer.displayName.toLowerCase().includes(queryLower);
			const aliasMatch = payer.aliases?.some(alias => alias.toLowerCase().includes(queryLower));
			return nameMatch || aliasMatch;
		});
	}

	async searchPayersAPI(query) {
		// This would integrate with the actual API
		// For now, return empty array as fallback
		return [];
	}

	showInitialPayerList(dropdown) {
		const resultsContainer = dropdown.querySelector(".quiz-payer-search-results");
		resultsContainer.innerHTML = this.commonPayers
			.map(
				payer => `
			<div class="quiz-payer-search-item" data-payer-id="${payer.stediId}" data-payer-name="${payer.displayName}">
				<div class="quiz-payer-search-item-name">${payer.displayName}</div>
				<div class="quiz-payer-search-item-details">ID: ${payer.primaryPayerId}</div>
			</div>
		`
			)
			.join("");

		this.attachResultListeners(dropdown);
	}

	renderSearchResults(results, query, dropdown) {
		const resultsContainer = dropdown.querySelector(".quiz-payer-search-results");

		if (results.length === 0) {
			resultsContainer.innerHTML = `
				<div class="quiz-payer-search-no-results">
					No insurance plans found for "${query}"
				</div>
			`;
			return;
		}

		resultsContainer.innerHTML = results
			.map(
				payer => `
			<div class="quiz-payer-search-item" data-payer-id="${payer.stediId}" data-payer-name="${payer.displayName}">
				<div class="quiz-payer-search-item-name">${this.highlightSearchTerm(payer.displayName, query)}</div>
				<div class="quiz-payer-search-item-details">ID: ${payer.primaryPayerId}</div>
			</div>
		`
			)
			.join("");

		this.attachResultListeners(dropdown);
	}

	attachResultListeners(dropdown) {
		const items = dropdown.querySelectorAll(".quiz-payer-search-item");
		items.forEach(item => {
			item.addEventListener("click", () => {
				const payerId = item.dataset.payerId;
				const payerName = item.dataset.payerName;
				this.selectPayer({ stediId: payerId, displayName: payerName });
			});
		});
	}

	selectPayer(payer) {
		const searchInput = this.shadowRoot.querySelector(".quiz-payer-search-input");
		const dropdown = this.shadowRoot.querySelector(".quiz-payer-search-dropdown");
		const container = this.shadowRoot.querySelector(".quiz-payer-search-container");

		searchInput.value = payer.displayName;
		this.selectedPayer = payer.stediId;
		this.closeDropdown(dropdown, container, searchInput);

		// Dispatch custom event for parent component
		this.dispatchEvent(
			new CustomEvent("payer-selected", {
				detail: {
					questionId: this.questionId,
					payer: payer
				},
				bubbles: true
			})
		);
	}

	openDropdown(dropdown, container, searchInput) {
		dropdown.style.display = "block";
		container.classList.add("dropdown-open");
		searchInput.classList.add("dropdown-open");
	}

	closeDropdown(dropdown, container, searchInput) {
		dropdown.style.display = "none";
		container.classList.remove("dropdown-open");
		searchInput.classList.remove("dropdown-open");
	}

	showSearchError(dropdown) {
		const resultsContainer = dropdown.querySelector(".quiz-payer-search-results");
		resultsContainer.innerHTML = `
			<div class="quiz-payer-search-error">
				Unable to search at this time. Please try again.
			</div>
		`;
	}

	highlightSearchTerm(text, searchTerm) {
		if (!searchTerm) return text;
		const regex = new RegExp(`(${searchTerm})`, "gi");
		return text.replace(regex, '<span class="quiz-payer-search-highlight">$1</span>');
	}

	resolvePayerDisplayName(payerId) {
		if (!payerId) return "";
		const payer = this.commonPayers.find(p => p.stediId === payerId || p.primaryPayerId === payerId);
		return payer ? payer.displayName : payerId;
	}

	// Public API
	setValue(value) {
		this.selectedPayer = value;
		const searchInput = this.shadowRoot.querySelector(".quiz-payer-search-input");
		if (searchInput) {
			searchInput.value = this.resolvePayerDisplayName(value);
		}
	}

	getValue() {
		return this.selectedPayer;
	}
}

customElements.define("quiz-payer-search", QuizPayerSearch);
