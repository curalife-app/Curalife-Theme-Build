var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
function __vite_legacy_guard() {
  import.meta.url;
  import("_").catch(() => 1);
  (async function* () {
  })().next();
}
;
class CartRemoveButton extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("click", (event) => {
      event.preventDefault();
      const cartItems = this.closest("cart-items") || this.closest("cart-drawer-items");
      cartItems.updateQuantity(this.dataset.index, 0);
    });
  }
}
customElements.define("cart-remove-button", CartRemoveButton);
let CartItems$1 = class CartItems2 extends HTMLElement {
  constructor() {
    super();
    __publicField(this, "cartUpdateUnsubscriber");
    this.lineItemStatusElement = document.getElementById("shopping-cart-line-item-status") || document.getElementById("CartDrawer-LineItemStatus");
    const debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, ON_CHANGE_DEBOUNCE_TIMER);
    this.addEventListener("change", debouncedOnChange.bind(this));
  }
  connectedCallback() {
    this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
      if (event.source === "cart-items") {
        return;
      }
      this.onCartUpdate();
    });
  }
  disconnectedCallback() {
    if (this.cartUpdateUnsubscriber) {
      this.cartUpdateUnsubscriber();
    }
  }
  onChange(event) {
    this.updateQuantity(event.target.dataset.index, event.target.value, document.activeElement.getAttribute("name"));
  }
  onCartUpdate() {
    fetch("/cart?section_id=main-cart-items").then((response) => response.text()).then((responseText) => {
      const html = new DOMParser().parseFromString(responseText, "text/html");
      const sourceQty = html.querySelector("cart-items");
      this.innerHTML = sourceQty.innerHTML;
    }).catch((e) => {
      console.error(e);
    });
  }
  getSectionsToRender() {
    return [
      {
        id: "main-cart-items",
        section: document.getElementById("main-cart-items").dataset.id,
        selector: ".js-contents"
      },
      {
        id: "cart-icon-bubble",
        section: "cart-icon-bubble",
        selector: ".shopify-section"
      },
      {
        id: "cart-live-region-text",
        section: "cart-live-region-text",
        selector: ".shopify-section"
      },
      {
        id: "main-cart-footer",
        section: document.getElementById("main-cart-footer").dataset.id,
        selector: ".js-contents"
      }
    ];
  }
  updateQuantity(line, quantity, name) {
    this.enableLoading(line);
    const body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname
    });
    fetch("".concat(routes.cart_change_url), { ...fetchConfig(), ...{ body } }).then((response) => {
      return response.text();
    }).then((state) => {
      const parsedState = JSON.parse(state);
      const quantityElement = document.getElementById("Quantity-".concat(line)) || document.getElementById("Drawer-quantity-".concat(line));
      const items = document.querySelectorAll(".cart-item");
      if (parsedState.errors) {
        quantityElement.value = quantityElement.getAttribute("value");
        this.updateLiveRegions(line, parsedState.errors);
        return;
      }
      this.classList.toggle("is-empty", parsedState.item_count === 0);
      const cartDrawerWrapper = document.querySelector("cart-drawer");
      const cartFooter = document.getElementById("main-cart-footer");
      if (cartFooter) cartFooter.classList.toggle("is-empty", parsedState.item_count === 0);
      if (cartDrawerWrapper) cartDrawerWrapper.classList.toggle("is-empty", parsedState.item_count === 0);
      this.getSectionsToRender().forEach((section) => {
        const elementToReplace = document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);
        elementToReplace.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.section], section.selector);
      });
      const updatedValue = parsedState.items[line - 1] ? parsedState.items[line - 1].quantity : void 0;
      let message = "";
      if (items.length === parsedState.items.length && updatedValue !== parseInt(quantityElement.value)) {
        if (typeof updatedValue === "undefined") {
          message = window.cartStrings.error;
        } else {
          message = window.cartStrings.quantityError.replace("[quantity]", updatedValue);
        }
      }
      this.updateLiveRegions(line, message);
      const lineItem = document.getElementById("CartItem-".concat(line)) || document.getElementById("CartDrawer-Item-".concat(line));
      if (lineItem && lineItem.querySelector('[name="'.concat(name, '"]'))) {
        cartDrawerWrapper ? trapFocus(cartDrawerWrapper, lineItem.querySelector('[name="'.concat(name, '"]'))) : lineItem.querySelector('[name="'.concat(name, '"]')).focus();
      } else if (parsedState.item_count === 0 && cartDrawerWrapper) {
        trapFocus(cartDrawerWrapper.querySelector(".drawer__inner-empty"), cartDrawerWrapper.querySelector("a"));
      } else if (document.querySelector(".cart-item") && cartDrawerWrapper) {
        trapFocus(cartDrawerWrapper, document.querySelector(".cart-item__name"));
      }
      publish(PUB_SUB_EVENTS.cartUpdate, { source: "cart-items" });
    }).catch(() => {
      this.querySelectorAll(".loading-overlay").forEach((overlay) => overlay.classList.add("hidden"));
      const errors = document.getElementById("cart-errors") || document.getElementById("CartDrawer-CartErrors");
      errors.textContent = window.cartStrings.error;
    }).finally(() => {
      this.disableLoading(line);
    });
  }
  updateLiveRegions(line, message) {
    const lineItemError = document.getElementById("Line-item-error-".concat(line)) || document.getElementById("CartDrawer-LineItemError-".concat(line));
    if (lineItemError) lineItemError.querySelector(".cart-item__error-text").innerHTML = message;
    this.lineItemStatusElement.setAttribute("aria-hidden", true);
    const cartStatus = document.getElementById("cart-live-region-text") || document.getElementById("CartDrawer-LiveRegionText");
    cartStatus.setAttribute("aria-hidden", false);
    setTimeout(() => {
      cartStatus.setAttribute("aria-hidden", true);
    }, 1e3);
  }
  getSectionInnerHTML(html, selector) {
    return new DOMParser().parseFromString(html, "text/html").querySelector(selector).innerHTML;
  }
  enableLoading(line) {
    const mainCartItems = document.getElementById("main-cart-items") || document.getElementById("CartDrawer-CartItems");
    mainCartItems.classList.add("cart__items--disabled");
    const cartItemElements = this.querySelectorAll("#CartItem-".concat(line, " .loading-overlay"));
    const cartDrawerItemElements = this.querySelectorAll("#CartDrawer-Item-".concat(line, " .loading-overlay"));
    [...cartItemElements, ...cartDrawerItemElements].forEach((overlay) => overlay.classList.remove("hidden"));
    document.activeElement.blur();
    this.lineItemStatusElement.setAttribute("aria-hidden", false);
  }
  disableLoading(line) {
    const mainCartItems = document.getElementById("main-cart-items") || document.getElementById("CartDrawer-CartItems");
    mainCartItems.classList.remove("cart__items--disabled");
    const cartItemElements = this.querySelectorAll("#CartItem-".concat(line, " .loading-overlay"));
    const cartDrawerItemElements = this.querySelectorAll("#CartDrawer-Item-".concat(line, " .loading-overlay"));
    cartItemElements.forEach((overlay) => overlay.classList.add("hidden"));
    cartDrawerItemElements.forEach((overlay) => overlay.classList.add("hidden"));
  }
};
customElements.define("cart-items", CartItems$1);
if (!customElements.get("cart-note")) {
  customElements.define("cart-note", class CartNote extends HTMLElement {
    constructor() {
      super();
      this.addEventListener("change", debounce((event) => {
        const body = JSON.stringify({ note: event.target.value });
        fetch("".concat(routes.cart_update_url), { ...fetchConfig(), ...{ body } });
      }, ON_CHANGE_DEBOUNCE_TIMER));
    }
  });
}
class CartDrawer extends HTMLElement {
  constructor() {
    super();
    this.addEventListener("keyup", (evt) => evt.code === "Escape" && this.close());
    this.querySelector("#CartDrawer-Overlay").addEventListener("click", this.close.bind(this));
    this.setHeaderCartIconAccessibility();
  }
  setHeaderCartIconAccessibility() {
    const cartLink = document.querySelector("#cart-icon-bubble");
    cartLink.setAttribute("role", "button");
    cartLink.setAttribute("aria-haspopup", "dialog");
    cartLink.addEventListener("click", (event) => {
      event.preventDefault();
      this.open(cartLink);
    });
    cartLink.addEventListener("keydown", (event) => {
      if (event.code.toUpperCase() === "SPACE") {
        event.preventDefault();
        this.open(cartLink);
      }
    });
  }
  open(triggeredBy) {
    if (triggeredBy) this.setActiveElement(triggeredBy);
    const cartDrawerNote = this.querySelector('[id^="Details-"] summary');
    if (cartDrawerNote && !cartDrawerNote.hasAttribute("role")) this.setSummaryAccessibility(cartDrawerNote);
    setTimeout(() => {
      this.classList.add("animate", "active");
    });
    this.addEventListener("transitionend", () => {
      const containerToTrapFocusOn = this.classList.contains("is-empty") ? this.querySelector(".drawer__inner-empty") : document.getElementById("CartDrawer");
      const focusElement = this.querySelector(".drawer__inner") || this.querySelector(".drawer__close");
      trapFocus(containerToTrapFocusOn, focusElement);
    }, { once: true });
    document.body.classList.add("overflow-hidden");
  }
  close() {
    this.classList.remove("active");
    removeTrapFocus(this.activeElement);
    document.body.classList.remove("overflow-hidden");
  }
  setSummaryAccessibility(cartDrawerNote) {
    cartDrawerNote.setAttribute("role", "button");
    cartDrawerNote.setAttribute("aria-expanded", "false");
    if (cartDrawerNote.nextElementSibling.getAttribute("id")) {
      cartDrawerNote.setAttribute("aria-controls", cartDrawerNote.nextElementSibling.id);
    }
    cartDrawerNote.addEventListener("click", (event) => {
      event.currentTarget.setAttribute("aria-expanded", !event.currentTarget.closest("details").hasAttribute("open"));
    });
    cartDrawerNote.parentElement.addEventListener("keyup", onKeyUpEscape);
  }
  renderContents(parsedState) {
    this.querySelector(".drawer__inner").classList.contains("is-empty") && this.querySelector(".drawer__inner").classList.remove("is-empty");
    this.productId = parsedState.id;
    this.getSectionsToRender().forEach((section) => {
      const sectionElement = section.selector ? document.querySelector(section.selector) : document.getElementById(section.id);
      sectionElement.innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
    });
    setTimeout(() => {
      this.querySelector("#CartDrawer-Overlay").addEventListener("click", this.close.bind(this));
      this.open();
    });
  }
  getSectionInnerHTML(html, selector = ".shopify-section") {
    return new DOMParser().parseFromString(html, "text/html").querySelector(selector).innerHTML;
  }
  getSectionsToRender() {
    return [
      {
        id: "cart-drawer",
        selector: "#CartDrawer"
      },
      {
        id: "cart-icon-bubble"
      }
    ];
  }
  getSectionDOM(html, selector = ".shopify-section") {
    return new DOMParser().parseFromString(html, "text/html").querySelector(selector);
  }
  setActiveElement(element) {
    this.activeElement = element;
  }
}
customElements.define("cart-drawer", CartDrawer);
class CartDrawerItems extends CartItems {
  getSectionsToRender() {
    return [
      {
        id: "CartDrawer",
        section: "cart-drawer",
        selector: ".drawer__inner"
      },
      {
        id: "cart-icon-bubble",
        section: "cart-icon-bubble",
        selector: ".shopify-section"
      }
    ];
  }
}
customElements.define("cart-drawer-items", CartDrawerItems);
class CartNotification extends HTMLElement {
  constructor() {
    super();
    this.notification = document.getElementById("cart-notification");
    this.header = document.querySelector("sticky-header");
    this.onBodyClick = this.handleBodyClick.bind(this);
    this.notification.addEventListener("keyup", (evt) => evt.code === "Escape" && this.close());
    this.querySelectorAll('button[type="button"]').forEach(
      (closeButton) => closeButton.addEventListener("click", this.close.bind(this))
    );
  }
  open() {
    this.notification.classList.add("animate", "active");
    this.notification.addEventListener("transitionend", () => {
      this.notification.focus();
      trapFocus(this.notification);
    }, { once: true });
    document.body.addEventListener("click", this.onBodyClick);
  }
  close() {
    this.notification.classList.remove("active");
    document.body.removeEventListener("click", this.onBodyClick);
    removeTrapFocus(this.activeElement);
  }
  renderContents(parsedState) {
    this.cartItemKey = parsedState.key;
    this.getSectionsToRender().forEach((section) => {
      document.getElementById(section.id).innerHTML = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
    });
    if (this.header) this.header.reveal();
    this.open();
  }
  getSectionsToRender() {
    return [
      {
        id: "cart-notification-product",
        selector: '[id="cart-notification-product-'.concat(this.cartItemKey, '"]')
      },
      {
        id: "cart-notification-button"
      },
      {
        id: "cart-icon-bubble"
      }
    ];
  }
  getSectionInnerHTML(html, selector = ".shopify-section") {
    return new DOMParser().parseFromString(html, "text/html").querySelector(selector).innerHTML;
  }
  handleBodyClick(evt) {
    const target = evt.target;
    if (target !== this.notification && !target.closest("cart-notification")) {
      const disclosure = target.closest("details-disclosure, header-menu");
      this.activeElement = disclosure ? disclosure.querySelector("summary") : null;
      this.close();
    }
  }
  setActiveElement(element) {
    this.activeElement = element;
  }
}
customElements.define("cart-notification", CartNotification);
console.log("🛒 Cart bundle loaded - Cart functionality initialized");
export {
  __vite_legacy_guard
};
