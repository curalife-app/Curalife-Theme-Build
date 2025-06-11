function __vite_legacy_guard() {
  import.meta.url;
  import("_").catch(() => 1);
  (async function* () {
  })().next();
}
;
class PredictiveSearch extends SearchForm {
  constructor() {
    super();
    this.cachedResults = {};
    this.predictiveSearchResults = this.querySelector("[data-predictive-search]");
    this.allPredictiveSearchInstances = document.querySelectorAll("predictive-search");
    this.isOpen = false;
    this.abortController = new AbortController();
    this.searchTerm = "";
    this.setupEventListeners();
  }
  setupEventListeners() {
    this.input.form.addEventListener("submit", this.onFormSubmit.bind(this));
    this.input.addEventListener("focus", this.onFocus.bind(this));
    this.addEventListener("focusout", this.onFocusOut.bind(this));
    this.addEventListener("keyup", this.onKeyup.bind(this));
    this.addEventListener("keydown", this.onKeydown.bind(this));
  }
  getQuery() {
    return this.input.value.trim();
  }
  onChange() {
    var _a;
    super.onChange();
    const newSearchTerm = this.getQuery();
    if (!this.searchTerm || !newSearchTerm.startsWith(this.searchTerm)) {
      (_a = this.querySelector("#predictive-search-results-groups-wrapper")) == null ? void 0 : _a.remove();
    }
    this.updateSearchForTerm(this.searchTerm, newSearchTerm);
    this.searchTerm = newSearchTerm;
    if (!this.searchTerm.length) {
      this.close(true);
      return;
    }
    this.getSearchResults(this.searchTerm);
  }
  onFormSubmit(event) {
    if (!this.getQuery().length || this.querySelector('[aria-selected="true"] a')) event.preventDefault();
  }
  onFormReset(event) {
    super.onFormReset(event);
    if (super.shouldResetForm()) {
      this.searchTerm = "";
      this.abortController.abort();
      this.abortController = new AbortController();
      this.closeResults(true);
    }
  }
  onFocus() {
    const currentSearchTerm = this.getQuery();
    if (!currentSearchTerm.length) return;
    if (this.searchTerm !== currentSearchTerm) {
      this.onChange();
    } else if (this.getAttribute("results") === "true") {
      this.open();
    } else {
      this.getSearchResults(this.searchTerm);
    }
  }
  onFocusOut() {
    setTimeout(() => {
      if (!this.contains(document.activeElement)) this.close();
    });
  }
  onKeyup(event) {
    if (!this.getQuery().length) this.close(true);
    event.preventDefault();
    switch (event.code) {
      case "ArrowUp":
        this.switchOption("up");
        break;
      case "ArrowDown":
        this.switchOption("down");
        break;
      case "Enter":
        this.selectOption();
        break;
    }
  }
  onKeydown(event) {
    if (event.code === "ArrowUp" || event.code === "ArrowDown") {
      event.preventDefault();
    }
  }
  updateSearchForTerm(previousTerm, newTerm) {
    const searchForTextElement = this.querySelector(
      "[data-predictive-search-search-for-text]"
    );
    const currentButtonText = searchForTextElement == null ? void 0 : searchForTextElement.innerText;
    if (currentButtonText) {
      if (currentButtonText.match(new RegExp(previousTerm, "g")).length > 1) {
        return;
      }
      const newButtonText = currentButtonText.replace(previousTerm, newTerm);
      searchForTextElement.innerText = newButtonText;
    }
  }
  switchOption(direction) {
    if (!this.getAttribute("open")) return;
    const moveUp = direction === "up";
    const selectedElement = this.querySelector('[aria-selected="true"]');
    const allVisibleElements = Array.from(
      this.querySelectorAll("li, button.predictive-search__item")
    ).filter((element) => element.offsetParent !== null);
    let activeElementIndex = 0;
    if (moveUp && !selectedElement) return;
    let selectedElementIndex = -1;
    let i = 0;
    while (selectedElementIndex === -1 && i <= allVisibleElements.length) {
      if (allVisibleElements[i] === selectedElement) {
        selectedElementIndex = i;
      }
      i++;
    }
    this.statusElement.textContent = "";
    if (!moveUp && selectedElement) {
      activeElementIndex = selectedElementIndex === allVisibleElements.length - 1 ? 0 : selectedElementIndex + 1;
    } else if (moveUp) {
      activeElementIndex = selectedElementIndex === 0 ? allVisibleElements.length - 1 : selectedElementIndex - 1;
    }
    if (activeElementIndex === selectedElementIndex) return;
    const activeElement = allVisibleElements[activeElementIndex];
    activeElement.setAttribute("aria-selected", true);
    if (selectedElement) selectedElement.setAttribute("aria-selected", false);
    this.input.setAttribute("aria-activedescendant", activeElement.id);
  }
  selectOption() {
    const selectedOption = this.querySelector(
      '[aria-selected="true"] a, button[aria-selected="true"]'
    );
    if (selectedOption) selectedOption.click();
  }
  getSearchResults(searchTerm) {
    const queryKey = searchTerm.replace(" ", "-").toLowerCase();
    this.setLiveRegionLoadingState();
    if (this.cachedResults[queryKey]) {
      this.renderSearchResults(this.cachedResults[queryKey]);
      return;
    }
    fetch(
      "".concat(routes.predictive_search_url, "?q=").concat(encodeURIComponent(
        searchTerm
      ), "&section_id=predictive-search"),
      { signal: this.abortController.signal }
    ).then((response) => {
      if (!response.ok) {
        var error = new Error(response.status);
        this.close();
        throw error;
      }
      return response.text();
    }).then((text) => {
      const resultsMarkup = new DOMParser().parseFromString(text, "text/html").querySelector("#shopify-section-predictive-search").innerHTML;
      this.allPredictiveSearchInstances.forEach(
        (predictiveSearchInstance) => {
          predictiveSearchInstance.cachedResults[queryKey] = resultsMarkup;
        }
      );
      this.renderSearchResults(resultsMarkup);
    }).catch((error) => {
      if ((error == null ? void 0 : error.code) === 20) {
        return;
      }
      this.close();
      throw error;
    });
  }
  setLiveRegionLoadingState() {
    this.statusElement = this.statusElement || this.querySelector(".predictive-search-status");
    this.loadingText = this.loadingText || this.getAttribute("data-loading-text");
    this.setLiveRegionText(this.loadingText);
    this.setAttribute("loading", true);
  }
  setLiveRegionText(statusText) {
    this.statusElement.setAttribute("aria-hidden", "false");
    this.statusElement.textContent = statusText;
    setTimeout(() => {
      this.statusElement.setAttribute("aria-hidden", "true");
    }, 1e3);
  }
  renderSearchResults(resultsMarkup) {
    this.predictiveSearchResults.innerHTML = resultsMarkup;
    this.setAttribute("results", true);
    this.setLiveRegionResults();
    this.open();
  }
  setLiveRegionResults() {
    this.removeAttribute("loading");
    this.setLiveRegionText(this.querySelector("[data-predictive-search-live-region-count-value]").textContent);
  }
  getResultsMaxHeight() {
    this.resultsMaxHeight = window.innerHeight - document.querySelector(".section-header").getBoundingClientRect().bottom;
    return this.resultsMaxHeight;
  }
  open() {
    this.predictiveSearchResults.style.maxHeight = this.resultsMaxHeight || "".concat(this.getResultsMaxHeight(), "px");
    this.setAttribute("open", true);
    this.input.setAttribute("aria-expanded", true);
    this.isOpen = true;
  }
  close(clearSearchTerm = false) {
    this.closeResults(clearSearchTerm);
    this.isOpen = false;
  }
  closeResults(clearSearchTerm = false) {
    if (clearSearchTerm) {
      this.input.value = "";
      this.removeAttribute("results");
    }
    const selected = this.querySelector('[aria-selected="true"]');
    if (selected) selected.setAttribute("aria-selected", false);
    this.input.setAttribute("aria-activedescendant", "");
    this.removeAttribute("loading");
    this.removeAttribute("open");
    this.input.setAttribute("aria-expanded", false);
    this.resultsMaxHeight = false;
    this.predictiveSearchResults.removeAttribute("style");
  }
}
customElements.define("predictive-search", PredictiveSearch);
let SearchForm$1 = class SearchForm2 extends HTMLElement {
  constructor() {
    super();
    this.input = this.querySelector('input[type="search"]');
    this.resetButton = this.querySelector('button[type="reset"]');
    if (this.input) {
      this.input.form.addEventListener("reset", this.onFormReset.bind(this));
      this.input.addEventListener("input", debounce((event) => {
        this.onChange(event);
      }, 300).bind(this));
    }
  }
  toggleResetButton() {
    const resetIsHidden = this.resetButton.classList.contains("hidden");
    if (this.input.value.length > 0 && resetIsHidden) {
      this.resetButton.classList.remove("hidden");
    } else if (this.input.value.length === 0 && !resetIsHidden) {
      this.resetButton.classList.add("hidden");
    }
  }
  onChange() {
    this.toggleResetButton();
  }
  shouldResetForm() {
    return !document.querySelector('[aria-selected="true"] a');
  }
  onFormReset(event) {
    event.preventDefault();
    if (this.shouldResetForm()) {
      this.input.value = "";
      this.input.focus();
      this.toggleResetButton();
    }
  }
};
customElements.define("search-form", SearchForm$1);
class MainSearch extends SearchForm {
  constructor() {
    super();
    this.allSearchInputs = document.querySelectorAll('input[type="search"]');
    this.setupEventListeners();
  }
  setupEventListeners() {
    let allSearchForms = [];
    this.allSearchInputs.forEach((input) => allSearchForms.push(input.form));
    this.input.addEventListener("focus", this.onInputFocus.bind(this));
    if (allSearchForms.length < 2) return;
    allSearchForms.forEach(
      (form) => form.addEventListener("reset", this.onFormReset.bind(this))
    );
    this.allSearchInputs.forEach(
      (input) => input.addEventListener("input", this.onInput.bind(this))
    );
  }
  onFormReset(event) {
    super.onFormReset(event);
    if (super.shouldResetForm()) {
      this.keepInSync("", this.input);
    }
  }
  onInput(event) {
    const target = event.target;
    this.keepInSync(target.value, target);
  }
  onInputFocus() {
    const isSmallScreen = window.innerWidth < 750;
    if (isSmallScreen) {
      this.scrollIntoView({ behavior: "smooth" });
    }
  }
  keepInSync(value, target) {
    this.allSearchInputs.forEach((input) => {
      if (input !== target) {
        input.value = value;
      }
    });
  }
}
customElements.define("main-search", MainSearch);
class FacetFiltersForm extends HTMLElement {
  constructor() {
    super();
    this.onActiveFilterClick = this.onActiveFilterClick.bind(this);
    this.debouncedOnSubmit = debounce((event) => {
      this.onSubmitHandler(event);
    }, 500);
    const facetForm = this.querySelector("form");
    facetForm.addEventListener("input", this.debouncedOnSubmit.bind(this));
    const facetWrapper = this.querySelector("#FacetsWrapperDesktop");
    if (facetWrapper) facetWrapper.addEventListener("keyup", onKeyUpEscape);
  }
  static setListeners() {
    const onHistoryChange = (event) => {
      const searchParams = event.state ? event.state.searchParams : FacetFiltersForm.searchParamsInitial;
      if (searchParams === FacetFiltersForm.searchParamsPrev) return;
      FacetFiltersForm.renderPage(searchParams, null, false);
    };
    window.addEventListener("popstate", onHistoryChange);
  }
  static toggleActiveFacets(disable = true) {
    document.querySelectorAll(".js-facet-remove").forEach((element) => {
      element.classList.toggle("disabled", disable);
    });
  }
  static renderPage(searchParams, event, updateURLHash = true) {
    FacetFiltersForm.searchParamsPrev = searchParams;
    const sections = FacetFiltersForm.getSections();
    const countContainer = document.getElementById("ProductCount");
    const countContainerDesktop = document.getElementById("ProductCountDesktop");
    document.getElementById("ProductGridContainer").querySelector(".collection").classList.add("loading");
    if (countContainer) {
      countContainer.classList.add("loading");
    }
    if (countContainerDesktop) {
      countContainerDesktop.classList.add("loading");
    }
    sections.forEach((section) => {
      const url = "".concat(window.location.pathname, "?section_id=").concat(section.section, "&").concat(searchParams);
      const filterDataUrl = (element) => element.url === url;
      FacetFiltersForm.filterData.some(filterDataUrl) ? FacetFiltersForm.renderSectionFromCache(filterDataUrl, event) : FacetFiltersForm.renderSectionFromFetch(url, event);
    });
    if (updateURLHash) FacetFiltersForm.updateURLHash(searchParams);
  }
  static renderSectionFromFetch(url, event) {
    fetch(url).then((response) => response.text()).then((responseText) => {
      const html = responseText;
      FacetFiltersForm.filterData = [...FacetFiltersForm.filterData, { html, url }];
      FacetFiltersForm.renderFilters(html, event);
      FacetFiltersForm.renderProductGridContainer(html);
      FacetFiltersForm.renderProductCount(html);
    });
  }
  static renderSectionFromCache(filterDataUrl, event) {
    const html = FacetFiltersForm.filterData.find(filterDataUrl).html;
    FacetFiltersForm.renderFilters(html, event);
    FacetFiltersForm.renderProductGridContainer(html);
    FacetFiltersForm.renderProductCount(html);
  }
  static renderProductGridContainer(html) {
    document.getElementById("ProductGridContainer").innerHTML = new DOMParser().parseFromString(html, "text/html").getElementById("ProductGridContainer").innerHTML;
  }
  static renderProductCount(html) {
    const count = new DOMParser().parseFromString(html, "text/html").getElementById("ProductCount").innerHTML;
    const container = document.getElementById("ProductCount");
    const containerDesktop = document.getElementById("ProductCountDesktop");
    container.innerHTML = count;
    container.classList.remove("loading");
    if (containerDesktop) {
      containerDesktop.innerHTML = count;
      containerDesktop.classList.remove("loading");
    }
  }
  static renderFilters(html, event) {
    const parsedHTML = new DOMParser().parseFromString(html, "text/html");
    const facetDetailsElements = parsedHTML.querySelectorAll("#FacetFiltersForm .js-filter, #FacetFiltersFormMobile .js-filter, #FacetFiltersPillsForm .js-filter");
    const matchesIndex = (element) => {
      const jsFilter = event ? event.target.closest(".js-filter") : void 0;
      return jsFilter ? element.dataset.index === jsFilter.dataset.index : false;
    };
    const facetsToRender = Array.from(facetDetailsElements).filter((element) => !matchesIndex(element));
    const countsToRender = Array.from(facetDetailsElements).find(matchesIndex);
    facetsToRender.forEach((element) => {
      document.querySelector('.js-filter[data-index="'.concat(element.dataset.index, '"]')).innerHTML = element.innerHTML;
    });
    FacetFiltersForm.renderActiveFacets(parsedHTML);
    FacetFiltersForm.renderAdditionalElements(parsedHTML);
    if (countsToRender) FacetFiltersForm.renderCounts(countsToRender, event.target.closest(".js-filter"));
  }
  static renderActiveFacets(html) {
    const activeFacetElementSelectors = [".active-facets-mobile", ".active-facets-desktop"];
    activeFacetElementSelectors.forEach((selector) => {
      const activeFacetsElement = html.querySelector(selector);
      if (!activeFacetsElement) return;
      document.querySelector(selector).innerHTML = activeFacetsElement.innerHTML;
    });
    FacetFiltersForm.toggleActiveFacets(false);
  }
  static renderAdditionalElements(html) {
    const mobileElementSelectors = [".mobile-facets__open", ".mobile-facets__count", ".sorting"];
    mobileElementSelectors.forEach((selector) => {
      if (!html.querySelector(selector)) return;
      document.querySelector(selector).innerHTML = html.querySelector(selector).innerHTML;
    });
    document.getElementById("FacetFiltersFormMobile").closest("menu-drawer").bindEvents();
  }
  static renderCounts(source, target) {
    const targetElement = target.querySelector(".facets__selected");
    const sourceElement = source.querySelector(".facets__selected");
    const targetElementAccessibility = target.querySelector(".facets__summary");
    const sourceElementAccessibility = source.querySelector(".facets__summary");
    if (sourceElement && targetElement) {
      target.querySelector(".facets__selected").outerHTML = source.querySelector(".facets__selected").outerHTML;
    }
    if (targetElementAccessibility && sourceElementAccessibility) {
      target.querySelector(".facets__summary").outerHTML = source.querySelector(".facets__summary").outerHTML;
    }
  }
  static updateURLHash(searchParams) {
    history.pushState({ searchParams }, "", "".concat(window.location.pathname).concat(searchParams && "?".concat(searchParams)));
  }
  static getSections() {
    return [
      {
        section: document.getElementById("product-grid").dataset.id
      }
    ];
  }
  createSearchParams(form) {
    const formData = new FormData(form);
    return new URLSearchParams(formData).toString();
  }
  onSubmitForm(searchParams, event) {
    FacetFiltersForm.renderPage(searchParams, event);
  }
  onSubmitHandler(event) {
    event.preventDefault();
    const sortFilterForms = document.querySelectorAll("facet-filters-form form");
    if (event.srcElement.className == "mobile-facets__checkbox") {
      const searchParams = this.createSearchParams(event.target.closest("form"));
      this.onSubmitForm(searchParams, event);
    } else {
      const forms = [];
      const isMobile = event.target.closest("form").id === "FacetFiltersFormMobile";
      sortFilterForms.forEach((form) => {
        if (!isMobile) {
          if (form.id === "FacetSortForm" || form.id === "FacetFiltersForm" || form.id === "FacetSortDrawerForm") {
            const noJsElements = document.querySelectorAll(".no-js-list");
            noJsElements.forEach((el) => el.remove());
            forms.push(this.createSearchParams(form));
          }
        } else if (form.id === "FacetFiltersFormMobile") {
          forms.push(this.createSearchParams(form));
        }
      });
      this.onSubmitForm(forms.join("&"), event);
    }
  }
  onActiveFilterClick(event) {
    event.preventDefault();
    FacetFiltersForm.toggleActiveFacets();
    const url = event.currentTarget.href.indexOf("?") == -1 ? "" : event.currentTarget.href.slice(event.currentTarget.href.indexOf("?") + 1);
    FacetFiltersForm.renderPage(url);
  }
}
FacetFiltersForm.filterData = [];
FacetFiltersForm.searchParamsInitial = window.location.search.slice(1);
FacetFiltersForm.searchParamsPrev = window.location.search.slice(1);
customElements.define("facet-filters-form", FacetFiltersForm);
FacetFiltersForm.setListeners();
class PriceRange extends HTMLElement {
  constructor() {
    super();
    this.querySelectorAll("input").forEach((element) => element.addEventListener("change", this.onRangeChange.bind(this)));
    this.setMinAndMaxValues();
  }
  onRangeChange(event) {
    this.adjustToValidValues(event.currentTarget);
    this.setMinAndMaxValues();
  }
  setMinAndMaxValues() {
    const inputs = this.querySelectorAll("input");
    const minInput = inputs[0];
    const maxInput = inputs[1];
    if (maxInput.value) minInput.setAttribute("max", maxInput.value);
    if (minInput.value) maxInput.setAttribute("min", minInput.value);
    if (minInput.value === "") maxInput.setAttribute("min", 0);
    if (maxInput.value === "") minInput.setAttribute("max", maxInput.getAttribute("max"));
  }
  adjustToValidValues(input) {
    const value = Number(input.value);
    const min = Number(input.getAttribute("min"));
    const max = Number(input.getAttribute("max"));
    if (value < min) input.value = min;
    if (value > max) input.value = max;
  }
}
customElements.define("price-range", PriceRange);
class FacetRemove extends HTMLElement {
  constructor() {
    super();
    const facetLink = this.querySelector("a");
    facetLink.setAttribute("role", "button");
    facetLink.addEventListener("click", this.closeFilter.bind(this));
    facetLink.addEventListener("keyup", (event) => {
      event.preventDefault();
      if (event.code.toUpperCase() === "SPACE") this.closeFilter(event);
    });
  }
  closeFilter(event) {
    event.preventDefault();
    const form = this.closest("facet-filters-form") || document.querySelector("facet-filters-form");
    form.onActiveFilterClick(event);
  }
}
customElements.define("facet-remove", FacetRemove);
console.log("🔍 Search bundle loaded - Search functionality initialized");
export {
  __vite_legacy_guard
};
