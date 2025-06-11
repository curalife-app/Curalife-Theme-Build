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
import "./pubsub-chunk.js";
if (!customElements.get("product-form")) {
  customElements.define(
    "product-form",
    class ProductForm extends HTMLElement {
      constructor() {
        super();
        this.form = this.querySelector("form");
        this.form.querySelector("[name=id]").disabled = false;
        this.form.addEventListener("submit", this.onSubmitHandler.bind(this));
        this.cart = document.querySelector("cart-notification") || document.querySelector("cart-drawer");
        this.submitButton = this.querySelector('[type="submit"]');
        if (document.querySelector("cart-drawer")) this.submitButton.setAttribute("aria-haspopup", "dialog");
        this.hideErrors = this.dataset.hideErrors === "true";
      }
      onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute("aria-disabled") === "true") return;
        this.handleErrorMessage();
        this.submitButton.setAttribute("aria-disabled", true);
        this.submitButton.classList.add("loading");
        this.querySelector(".submit-title").classList.add("hidden");
        this.querySelector(".loading-overlay__spinner").classList.remove("hidden");
        const config = fetchConfig("javascript");
        config.headers["X-Requested-With"] = "XMLHttpRequest";
        delete config.headers["Content-Type"];
        const formData = new FormData(this.form);
        if (this.cart) {
          if (typeof this.cart.getSectionsToRender === "function") {
            formData.append(
              "sections",
              this.cart.getSectionsToRender().map((section) => section.id)
            );
          } else {
            formData.append("sections", "");
          }
          formData.append("sections_url", window.location.pathname);
          if (typeof this.cart.setActiveElement === "function") {
            this.cart.setActiveElement(document.activeElement);
          }
        }
        config.body = formData;
        fetch("".concat(routes.cart_add_url), config).then((response) => response.json()).then((response) => {
          if (response.status) {
            if (typeof publish === "function") {
              publish(PUB_SUB_EVENTS.cartError, {
                source: "product-form",
                productVariantId: formData.get("id"),
                errors: response.errors || response.description,
                message: response.message
              });
            }
            this.handleErrorMessage(response.description);
            const soldOutMessage = this.submitButton.querySelector(".sold-out-message");
            if (!soldOutMessage) return;
            this.submitButton.setAttribute("aria-disabled", true);
            this.submitButton.querySelector("span").classList.add("hidden");
            soldOutMessage.classList.remove("hidden");
            this.error = true;
            return;
          } else if (!this.cart) {
            window.location = window.routes.cart_url;
            return;
          }
          if (!this.error && typeof publish === "function") publish(PUB_SUB_EVENTS.cartUpdate, { source: "product-form", productVariantId: formData.get("id"), cartData: response });
          this.error = false;
          const quickAddModal = this.closest("quick-add-modal");
          if (quickAddModal) {
            document.body.addEventListener(
              "modalClosed",
              () => {
                setTimeout(() => {
                  if (typeof this.cart.renderContents === "function") {
                    this.cart.renderContents(response);
                  }
                });
              },
              { once: true }
            );
            quickAddModal.hide(true);
          } else {
            if (typeof this.cart.renderContents === "function") {
              this.cart.renderContents(response);
            }
          }
        }).catch((e) => {
          console.error(e);
        }).finally(() => {
          this.submitButton.classList.remove("loading");
          if (this.cart && this.cart.classList.contains("is-empty")) this.cart.classList.remove("is-empty");
          if (!this.error) this.submitButton.removeAttribute("aria-disabled");
          this.querySelector(".submit-title").classList.remove("hidden");
          this.querySelector(".loading-overlay__spinner").classList.add("hidden");
          let quantityElement = this.form.querySelector("[name=quantity]");
          if (quantityElement) quantityElement.value = 1;
        });
      }
      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;
        this.errorMessageWrapper = this.errorMessageWrapper || this.querySelector(".product-form__error-message-wrapper");
        if (!this.errorMessageWrapper) return;
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector(".product-form__error-message");
        this.errorMessageWrapper.toggleAttribute("hidden", !errorMessage);
        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }
    }
  );
}
class QuantityInput extends HTMLElement {
  constructor() {
    super();
    __publicField(this, "quantityUpdateUnsubscriber");
    this.input = this.querySelector("input");
    this.changeEvent = new Event("change", { bubbles: true });
    this.input.addEventListener("change", this.onInputChange.bind(this));
    this.querySelectorAll("button").forEach((button) => button.addEventListener("click", this.onButtonClick.bind(this)));
  }
  connectedCallback() {
    this.validateQtyRules();
    this.quantityUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.quantityUpdate, this.validateQtyRules.bind(this));
  }
  disconnectedCallback() {
    if (this.quantityUpdateUnsubscriber) {
      this.quantityUpdateUnsubscriber();
    }
  }
  onInputChange(event) {
    this.validateQtyRules();
  }
  onButtonClick(event) {
    event.preventDefault();
    const previousValue = this.input.value;
    event.target.name === "plus" ? this.input.stepUp() : this.input.stepDown();
    if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);
  }
  validateQtyRules() {
    const value = parseInt(this.input.value);
    if (this.input.min) {
      const min = parseInt(this.input.min);
      const buttonMinus = this.querySelector(".quantity__button[name='minus']");
      buttonMinus.classList.toggle("disabled", value <= min);
    }
    if (this.input.max) {
      const max = parseInt(this.input.max);
      const buttonPlus = this.querySelector(".quantity__button[name='plus']");
      buttonPlus.classList.toggle("disabled", value >= max);
    }
  }
}
customElements.define("quantity-input", QuantityInput);
if (!customElements.get("product-info")) {
  customElements.define(
    "product-info",
    class ProductInfo extends HTMLElement {
      constructor() {
        super();
        __publicField(this, "cartUpdateUnsubscriber");
        __publicField(this, "variantChangeUnsubscriber");
        this.input = this.querySelector(".quantity__input");
        this.currentVariant = this.querySelector(".product-variant-id");
        this.variantSelects = this.querySelector("variant-radios");
        this.submitButton = this.querySelector('[type="submit"]');
      }
      connectedCallback() {
        if (!this.input) return;
        this.quantityForm = this.querySelector(".product-form__quantity");
        if (!this.quantityForm) return;
        this.setQuantityBoundries();
        if (!this.dataset.originalSection) {
          this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, this.fetchQuantityRules.bind(this));
        }
        this.variantChangeUnsubscriber = subscribe(PUB_SUB_EVENTS.variantChange, (event) => {
          const sectionId = this.dataset.originalSection ? this.dataset.originalSection : this.dataset.section;
          if (event.data.sectionId !== sectionId) return;
          this.updateQuantityRules(event.data.sectionId, event.data.html);
          this.setQuantityBoundries();
        });
      }
      disconnectedCallback() {
        if (this.cartUpdateUnsubscriber) {
          this.cartUpdateUnsubscriber();
        }
        if (this.variantChangeUnsubscriber) {
          this.variantChangeUnsubscriber();
        }
      }
      setQuantityBoundries() {
        const data = {
          cartQuantity: this.input.dataset.cartQuantity ? parseInt(this.input.dataset.cartQuantity) : 0,
          min: this.input.dataset.min ? parseInt(this.input.dataset.min) : 1,
          max: this.input.dataset.max ? parseInt(this.input.dataset.max) : null,
          step: this.input.step ? parseInt(this.input.step) : 1
        };
        let min = data.min;
        const max = data.max === null ? data.max : data.max - data.cartQuantity;
        if (max !== null) min = Math.min(min, max);
        if (data.cartQuantity >= data.min) min = Math.min(min, data.step);
        this.input.min = min;
        this.input.max = max;
        this.input.value = min;
        publish(PUB_SUB_EVENTS.quantityUpdate, void 0);
      }
      fetchQuantityRules() {
        if (!this.currentVariant || !this.currentVariant.value) return;
        this.querySelector(".quantity__rules-cart .loading-overlay").classList.remove("hidden");
        fetch("".concat(this.dataset.url, "?variant=").concat(this.currentVariant.value, "&section_id=").concat(this.dataset.section)).then((response) => {
          return response.text();
        }).then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, "text/html");
          this.updateQuantityRules(this.dataset.section, html);
          this.setQuantityBoundries();
        }).catch((e) => {
          console.error(e);
        }).finally(() => {
          this.querySelector(".quantity__rules-cart .loading-overlay").classList.add("hidden");
        });
      }
      updateQuantityRules(sectionId, html) {
        const quantityFormUpdated = html.getElementById("Quantity-Form-".concat(sectionId));
        const selectors = [".quantity__input", ".quantity__rules", ".quantity__label"];
        for (let selector of selectors) {
          const current = this.quantityForm.querySelector(selector);
          const updated = quantityFormUpdated.querySelector(selector);
          if (!current || !updated) continue;
          if (selector === ".quantity__input") {
            const attributes = ["data-cart-quantity", "data-min", "data-max", "step"];
            for (let attribute of attributes) {
              const valueUpdated = updated.getAttribute(attribute);
              if (valueUpdated !== null) current.setAttribute(attribute, valueUpdated);
            }
          } else {
            current.innerHTML = updated.innerHTML;
          }
        }
      }
    }
  );
}
if (!customElements.get("product-modal")) {
  customElements.define("product-modal", class ProductModal extends ModalDialog {
    constructor() {
      super();
    }
    hide() {
      super.hide();
    }
    show(opener) {
      super.show(opener);
      this.showActiveMedia();
    }
    showActiveMedia() {
      this.querySelectorAll('[data-media-id]:not([data-media-id="'.concat(this.openedBy.getAttribute("data-media-id"), '"])')).forEach(
        (element) => {
          element.classList.remove("active");
        }
      );
      const activeMedia = this.querySelector('[data-media-id="'.concat(this.openedBy.getAttribute("data-media-id"), '"]'));
      const activeMediaTemplate = activeMedia.querySelector("template");
      const activeMediaContent = activeMediaTemplate ? activeMediaTemplate.content : null;
      activeMedia.classList.add("active");
      activeMedia.scrollIntoView();
      const container = this.querySelector('[role="document"]');
      container.scrollLeft = (activeMedia.width - container.clientWidth) / 2;
      if (activeMedia.nodeName == "DEFERRED-MEDIA" && activeMediaContent && activeMediaContent.querySelector(".js-youtube"))
        activeMedia.loadContent();
    }
  });
}
if (!customElements.get("product-model")) {
  customElements.define("product-model", class ProductModel extends DeferredMedia {
    constructor() {
      super();
    }
    loadContent() {
      super.loadContent();
      Shopify.loadFeatures([
        {
          name: "model-viewer-ui",
          version: "1.0",
          onLoad: this.setupModelViewerUI.bind(this)
        }
      ]);
    }
    setupModelViewerUI(errors) {
      if (errors) return;
      this.modelViewerUI = new Shopify.ModelViewerUI(this.querySelector("model-viewer"));
    }
  });
}
window.ProductModel = {
  loadShopifyXR() {
    Shopify.loadFeatures([
      {
        name: "shopify-xr",
        version: "1.0",
        onLoad: this.setupShopifyXR.bind(this)
      }
    ]);
  },
  setupShopifyXR(errors) {
    if (errors) return;
    if (!window.ShopifyXR) {
      document.addEventListener(
        "shopify_xr_initialized",
        () => this.setupShopifyXR()
      );
      return;
    }
    document.querySelectorAll('[id^="ProductJSON-"]').forEach((modelJSON) => {
      window.ShopifyXR.addModels(JSON.parse(modelJSON.textContent));
      modelJSON.remove();
    });
    window.ShopifyXR.setupXRElements();
  }
};
window.addEventListener("DOMContentLoaded", () => {
  if (window.ProductModel) window.ProductModel.loadShopifyXR();
});
if (!customElements.get("quick-add-modal")) {
  customElements.define("quick-add-modal", class QuickAddModal extends ModalDialog {
    constructor() {
      super();
      this.modalContent = this.querySelector('[id^="QuickAddInfo-"]');
    }
    hide(preventFocus = false) {
      const cartNotification = document.querySelector("cart-notification") || document.querySelector("cart-drawer");
      if (cartNotification) cartNotification.setActiveElement(this.openedBy);
      this.modalContent.innerHTML = "";
      if (preventFocus) this.openedBy = null;
      super.hide();
    }
    show(opener) {
      opener.setAttribute("aria-disabled", true);
      opener.classList.add("loading");
      opener.querySelector(".loading-overlay__spinner").classList.remove("hidden");
      fetch(opener.getAttribute("data-product-url")).then((response) => response.text()).then((responseText) => {
        const responseHTML = new DOMParser().parseFromString(responseText, "text/html");
        this.productElement = responseHTML.querySelector('section[id^="MainProduct-"]');
        this.preventDuplicatedIDs();
        this.removeDOMElements();
        this.setInnerHTML(this.modalContent, this.productElement.innerHTML);
        if (window.Shopify && Shopify.PaymentButton) {
          Shopify.PaymentButton.init();
        }
        if (window.ProductModel) window.ProductModel.loadShopifyXR();
        this.removeGalleryListSemantic();
        this.updateImageSizes();
        this.preventVariantURLSwitching();
        super.show(opener);
      }).finally(() => {
        opener.removeAttribute("aria-disabled");
        opener.classList.remove("loading");
        opener.querySelector(".loading-overlay__spinner").classList.add("hidden");
      });
    }
    setInnerHTML(element, html) {
      element.innerHTML = html;
      element.querySelectorAll("script").forEach((oldScriptTag) => {
        const newScriptTag = document.createElement("script");
        Array.from(oldScriptTag.attributes).forEach((attribute) => {
          newScriptTag.setAttribute(attribute.name, attribute.value);
        });
        newScriptTag.appendChild(document.createTextNode(oldScriptTag.innerHTML));
        oldScriptTag.parentNode.replaceChild(newScriptTag, oldScriptTag);
      });
    }
    preventVariantURLSwitching() {
      const variantPicker = this.modalContent.querySelector("variant-radios,variant-selects");
      if (!variantPicker) return;
      variantPicker.setAttribute("data-update-url", "false");
    }
    removeDOMElements() {
      const pickupAvailability = this.productElement.querySelector("pickup-availability");
      if (pickupAvailability) pickupAvailability.remove();
      const productModal = this.productElement.querySelector("product-modal");
      if (productModal) productModal.remove();
      const modalDialog = this.productElement.querySelectorAll("modal-dialog");
      if (modalDialog) modalDialog.forEach((modal) => modal.remove());
    }
    preventDuplicatedIDs() {
      const sectionId = this.productElement.dataset.section;
      this.productElement.innerHTML = this.productElement.innerHTML.replaceAll(sectionId, "quickadd-".concat(sectionId));
      this.productElement.querySelectorAll("variant-selects, variant-radios, product-info").forEach((element) => {
        element.dataset.originalSection = sectionId;
      });
    }
    removeGalleryListSemantic() {
      const galleryList = this.modalContent.querySelector('[id^="Slider-Gallery"]');
      if (!galleryList) return;
      galleryList.setAttribute("role", "presentation");
      galleryList.querySelectorAll('[id^="Slide-"]').forEach((li) => li.setAttribute("role", "presentation"));
    }
    updateImageSizes() {
      const product = this.modalContent.querySelector(".product");
      const desktopColumns = product.classList.contains("product--columns");
      if (!desktopColumns) return;
      const mediaImages = product.querySelectorAll(".product__media img");
      if (!mediaImages.length) return;
      let mediaImageSizes = "(min-width: 1000px) 715px, (min-width: 750px) calc((100vw - 11.5rem) / 2), calc(100vw - 4rem)";
      if (product.classList.contains("product--medium")) {
        mediaImageSizes = mediaImageSizes.replace("715px", "605px");
      } else if (product.classList.contains("product--small")) {
        mediaImageSizes = mediaImageSizes.replace("715px", "495px");
      }
      mediaImages.forEach((img) => img.setAttribute("sizes", mediaImageSizes));
    }
  });
}
if (!customElements.get("pickup-availability")) {
  customElements.define("pickup-availability", class PickupAvailability extends HTMLElement {
    constructor() {
      super();
      if (!this.hasAttribute("available")) return;
      this.errorHtml = this.querySelector("template").content.firstElementChild.cloneNode(true);
      this.onClickRefreshList = this.onClickRefreshList.bind(this);
      this.fetchAvailability(this.dataset.variantId);
    }
    fetchAvailability(variantId) {
      let rootUrl = this.dataset.rootUrl;
      if (!rootUrl.endsWith("/")) {
        rootUrl = rootUrl + "/";
      }
      const variantSectionUrl = "".concat(rootUrl, "variants/").concat(variantId, "/?section_id=pickup-availability");
      fetch(variantSectionUrl).then((response) => response.text()).then((text) => {
        const sectionInnerHTML = new DOMParser().parseFromString(text, "text/html").querySelector(".shopify-section");
        this.renderPreview(sectionInnerHTML);
      }).catch((e) => {
        const button = this.querySelector("button");
        if (button) button.removeEventListener("click", this.onClickRefreshList);
        this.renderError();
      });
    }
    onClickRefreshList(evt) {
      this.fetchAvailability(this.dataset.variantId);
    }
    renderError() {
      this.innerHTML = "";
      this.appendChild(this.errorHtml);
      this.querySelector("button").addEventListener("click", this.onClickRefreshList);
    }
    renderPreview(sectionInnerHTML) {
      const drawer = document.querySelector("pickup-availability-drawer");
      if (drawer) drawer.remove();
      if (!sectionInnerHTML.querySelector("pickup-availability-preview")) {
        this.innerHTML = "";
        this.removeAttribute("available");
        return;
      }
      this.innerHTML = sectionInnerHTML.querySelector("pickup-availability-preview").outerHTML;
      this.setAttribute("available", "");
      document.body.appendChild(sectionInnerHTML.querySelector("pickup-availability-drawer"));
      const button = this.querySelector("button");
      if (button) button.addEventListener("click", (evt) => {
        document.querySelector("pickup-availability-drawer").show(evt.target);
      });
    }
  });
}
if (!customElements.get("pickup-availability-drawer")) {
  customElements.define("pickup-availability-drawer", class PickupAvailabilityDrawer extends HTMLElement {
    constructor() {
      super();
      this.onBodyClick = this.handleBodyClick.bind(this);
      this.querySelector("button").addEventListener("click", () => {
        this.hide();
      });
      this.addEventListener("keyup", (event) => {
        if (event.code.toUpperCase() === "ESCAPE") this.hide();
      });
    }
    handleBodyClick(evt) {
      const target = evt.target;
      if (target != this && !target.closest("pickup-availability-drawer") && target.id != "ShowPickupAvailabilityDrawer") {
        this.hide();
      }
    }
    hide() {
      this.removeAttribute("open");
      document.body.removeEventListener("click", this.onBodyClick);
      document.body.classList.remove("overflow-hidden");
      removeTrapFocus(this.focusElement);
    }
    show(focusElement) {
      this.focusElement = focusElement;
      this.setAttribute("open", "");
      document.body.addEventListener("click", this.onBodyClick);
      document.body.classList.add("overflow-hidden");
      trapFocus(this);
    }
  });
}
const CartCache = {
  data: null,
  lastFetched: 0,
  maxAge: 2e3,
  // 2 seconds
  async getCart(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && this.data && now - this.lastFetched < this.maxAge) {
      return this.data;
    }
    try {
      const res = await fetch("/cart.js?t=" + now, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache"
        }
      });
      if (!res.ok) throw new Error("Failed to fetch cart");
      this.data = await res.json();
      this.lastFetched = now;
      return this.data;
    } catch (err) {
      console.error("Error fetching cart:", err);
      throw err;
    }
  },
  invalidate() {
    this.data = null;
    this.lastFetched = 0;
  }
};
const DOMUtils = {
  updateProperty(element, property, newValue) {
    if (!element) return false;
    if (element[property] !== newValue) {
      element[property] = newValue;
      return true;
    }
    return false;
  },
  updateAttribute(element, attribute, newValue) {
    if (!element) return false;
    const currentValue = element.getAttribute(attribute);
    if (currentValue !== newValue) {
      element.setAttribute(attribute, newValue);
      return true;
    }
    return false;
  },
  toggleClass(element, className, shouldHave) {
    if (!element) return false;
    const hasClass = element.classList.contains(className);
    if (shouldHave && !hasClass) {
      element.classList.add(className);
      return true;
    } else if (!shouldHave && hasClass) {
      element.classList.remove(className);
      return true;
    }
    return false;
  },
  updateStyle(element, property, newValue) {
    if (!element) return false;
    if (element.style[property] !== newValue) {
      element.style[property] = newValue;
      return true;
    }
    return false;
  },
  createElement(tagName, properties = {}, parent = null) {
    const element = document.createElement(tagName);
    Object.entries(properties).forEach(([key, value]) => {
      if (key === "className") {
        element.className = value;
      } else if (key === "innerHTML") {
        element.innerHTML = value;
      } else if (key === "textContent") {
        element.textContent = value;
      } else if (key === "style" && typeof value === "object") {
        Object.entries(value).forEach(([prop, val]) => {
          element.style[prop] = val;
        });
      } else if (key.startsWith("data-")) {
        element.setAttribute(key, value);
      } else if (key.startsWith("on") && typeof value === "function") {
        const eventName = key.substring(2).toLowerCase();
        element.addEventListener(eventName, value);
      } else {
        element[key] = value;
      }
    });
    if (parent) {
      parent.appendChild(element);
    }
    return element;
  }
};
function showNotification(msg, type = "error") {
  const note = document.createElement("div");
  note.className = "\n		cart-notification ".concat(type, "\n		fixed bottom-4 left-1/2 transform -translate-x-1/2\n		p-4 rounded-lg shadow-lg z-[2147483640]\n		transition-opacity duration-300\n	").replace(/\s+/g, " ");
  if (type === "error") {
    note.classList.add("bg-red-100", "border", "border-red-400", "text-red-700");
  } else {
    note.classList.add("bg-green-100", "border", "border-green-400", "text-green-700");
  }
  note.innerHTML = '\n		<div class="flex items-center">\n			<div class="mr-3">'.concat(type === "error" ? "⚠️" : "✅", '</div>\n			<div class="text-sm font-medium">').concat(msg, '</div>\n			<button\n				class="hover:text-gray-500 ml-auto text-gray-400"\n				onclick="this.parentElement.parentElement.remove()"\n			>\n				✕\n			</button>\n		</div>\n	');
  document.body.appendChild(note);
  setTimeout(() => {
    note.classList.add("opacity-0");
    setTimeout(() => note.remove(), 300);
  }, 5e3);
}
function parseErrorMessage(error, context = "") {
  var _a, _b, _c, _d;
  console.error("Error in ".concat(context, ":"), {
    message: error.message,
    response: error.response,
    stack: error.stack,
    originalError: error
  });
  if (error.response && typeof error.response === "object") {
    if (error.response.description) return error.response.description;
    if (error.response.message) return error.response.message;
  }
  if ((_a = error.message) == null ? void 0 : _a.includes("network")) return "Network connection issue. Please check your internet connection and try again.";
  if ((_b = error.message) == null ? void 0 : _b.includes("timeout")) return "Request timed out. Please try again.";
  if ((_c = error.message) == null ? void 0 : _c.includes("sold out")) return "This product is currently sold out. Please try again later.";
  if ((_d = error.message) == null ? void 0 : _d.includes("variant")) return "There was an issue with the selected option. Please try selecting a different option.";
  switch (context) {
    case "cart-add":
      return "Unable to add items to your cart. Please try again.";
    case "checkout":
      return "Unable to proceed to checkout. Please try again.";
    case "frequency-selection":
      return "Unable to update subscription frequency. Please try again.";
    default:
      return "Something went wrong. Please try again or contact customer support.";
  }
}
async function getCart(forceRefresh = false) {
  try {
    return await CartCache.getCart(forceRefresh);
  } catch (err) {
    console.error("Error in getCart:", err);
    throw new Error("Unable to access your cart");
  }
}
async function clearCart() {
  try {
    const res = await fetch("/cart/clear.js", {
      method: "POST",
      cache: "no-store",
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" }
    });
    if (!res.ok) {
      const errorData = await res.json();
      throw Object.assign(new Error("Failed to clear cart"), { response: errorData });
    }
    CartCache.invalidate();
    return res.json();
  } catch (err) {
    console.error("Error clearing cart:", err);
    throw err;
  }
}
function extractFrequency(planName) {
  if (!planName) return { value: 1, unit: "month" };
  let daysMatch = planName.match(/(\d+)\s*Day/i);
  if (daysMatch) {
    return { value: parseInt(daysMatch[1], 10), unit: "day" };
  }
  let weeksMatch = planName.match(/(\d+)\s*Week/i);
  if (weeksMatch) {
    return { value: parseInt(weeksMatch[1], 10), unit: "week" };
  }
  let monthsMatch = planName.match(/(\d+)\s*Month/i);
  if (monthsMatch) {
    return { value: parseInt(monthsMatch[1], 10), unit: "month" };
  }
  return { value: 1, unit: "month" };
}
const BuyBoxNewInstances = /* @__PURE__ */ new Map();
class BuyBoxNew {
  constructor(container, config) {
    if (BuyBoxNewInstances.has(config.SID)) {
      return BuyBoxNewInstances.get(config.SID);
    }
    this.container = container;
    this.config = config;
    this.elements = {};
    this.state = {
      selectedBox: null,
      selectedFrequency: null,
      isInitialLoad: true,
      isLoading: false,
      isRedirectingToCheckout: false,
      productId: null,
      variantId: null,
      sellingPlanId: null,
      purchaseType: null,
      currencySymbol: this.config.currencySymbol || "$",
      loadingButton: null
      // Track which button is loading: 'submit', 'oneTime', or null
    };
    if (!this.container) {
      return;
    }
    BuyBoxNewInstances.set(config.SID, this);
    this.bindElements();
    this.storeInitialProductData();
    this.initState();
    this.attachEventListeners();
    this.moveCtaTextIfNeeded();
  }
  bindElements() {
    this.elements.productActions = this.container;
    if (!this.elements.productActions || !this.elements.productActions.classList.contains("product-actions")) {
      return;
    }
    this.elements.purchaseOptionBoxes = this.elements.productActions.querySelectorAll(".variant-box");
    this.elements.submitButton = this.elements.productActions.querySelector(".checkout-button button");
    this.elements.submitSellingPlanId = this.elements.productActions.querySelector(".submit-selling-plan-id");
    this.elements.submitVariantId = this.elements.productActions.querySelector(".submit-variant-id");
    this.elements.sellingPlanInput = this.elements.productActions.querySelector('input[name="selling_plan"]');
    this.elements.oneTimeButton = this.elements.productActions.querySelector(".one-time-add-to-cart");
    this.elements.frequencyContainer = this.elements.productActions.querySelector("[data-frequency-container]");
    this.elements.frequencyOptions = this.elements.productActions.querySelector("#frequency-options-".concat(this.config.SID));
    this.elements.frequencyDropdown = this.elements.productActions.querySelector("#frequency-dropdown-".concat(this.config.SID));
    this.elements.frequencyDescription = this.elements.productActions.querySelector(".frequency-description");
    this.elements.priceDisplays = this.elements.productActions.querySelectorAll(".price-display");
    this.elements.ctaText = this.container.querySelector(".cta-text");
    this.elements.giftContainer = this.elements.productActions.querySelector(".gift-container");
  }
  storeInitialProductData() {
    var _a;
    if (!window.productData) window.productData = {};
    const productIdFromData = this.container.dataset.productId;
    if (!productIdFromData) {
      return;
    }
    this.state.productId = productIdFromData;
    if ((_a = window.productData[productIdFromData]) == null ? void 0 : _a.initialized) {
      this.config.product = window.productData[productIdFromData];
    } else {
      if (!window.productData[productIdFromData]) {
        window.productData[productIdFromData] = { id: productIdFromData, variants: [], initialized: false };
      }
    }
  }
  setState(updates) {
    const previousState = { ...this.state };
    Object.assign(this.state, updates);
    this.updateUI(updates, previousState);
  }
  updateUI(changes, previousState) {
    if ("isLoading" in changes) this.updateLoadingState(this.state.isLoading);
    if ("selectedBox" in changes && this.state.selectedBox !== previousState.selectedBox) {
      this.updateSelectedBoxUI(this.state.selectedBox);
    }
    if ("selectedFrequency" in changes || "sellingPlanId" in changes) {
      this.updateFrequencyUI();
    }
  }
  updateSelectedBoxUI(boxElement) {
    if (!boxElement || !this.elements.productActions) return;
    const isSub = boxElement.dataset.purchaseType === "subscribe";
    const variantId = boxElement.dataset.variant;
    let planId = isSub ? boxElement.dataset.subscriptionSellingPlanId : null;
    if (this.elements.submitSellingPlanId) this.elements.submitSellingPlanId.value = planId || "";
    if (this.elements.submitVariantId) this.elements.submitVariantId.value = variantId || "";
    if (this.elements.sellingPlanInput) {
      this.elements.sellingPlanInput.value = planId || "";
    }
    this.setState({
      sellingPlanId: planId,
      variantId,
      purchaseType: boxElement.dataset.purchaseType,
      productId: boxElement.dataset.product
    });
    this.elements.purchaseOptionBoxes.forEach((box) => {
      const isSelected = box === boxElement;
      box.setAttribute("aria-selected", isSelected ? "true" : "false");
      const radio = box.querySelector('input[type="radio"]');
      if (radio) DOMUtils.updateProperty(radio, "checked", isSelected);
    });
    this.updateBuyButtonTracking(boxElement);
    this.updatePriceDisplay(boxElement);
    this.handleFrequencySelectorVisibility(isSub, boxElement);
    if (this.config.isSlideVariant) {
      this.updateVariantImage(boxElement);
    }
  }
  updateFrequencyUI() {
    var _a;
    const sellingPlanId = this.state.sellingPlanId;
    if (!sellingPlanId) return;
    const uiType = ((_a = this.elements.frequencyContainer) == null ? void 0 : _a.dataset.uiType) || "tabs";
    if (uiType === "tabs" && this.elements.frequencyOptions) {
      this.elements.frequencyOptions.querySelectorAll("div[data-selling-plan-id]").forEach((box) => {
        const boxId = box.getAttribute("data-selling-plan-id");
        const isSelected = boxId === sellingPlanId;
        box.setAttribute("aria-selected", isSelected ? "true" : "false");
      });
    } else if (uiType === "dropdown" && this.elements.frequencyDropdown) {
      if (this.elements.frequencyDropdown.value !== sellingPlanId) {
        this.elements.frequencyDropdown.value = sellingPlanId;
      }
    }
    this.updateFrequencyDescription();
  }
  updateLoadingState(isLoading) {
    const { loadingButton } = this.state;
    if (this.elements.submitButton) {
      const isSubmitLoading = isLoading && loadingButton === "submit";
      this.elements.submitButton.setAttribute("aria-busy", isSubmitLoading ? "true" : "false");
      this.elements.submitButton.disabled = isSubmitLoading;
      if (isSubmitLoading) {
        this.elements.submitButton.innerHTML = '<div class="border-white/20 border-t-white animate-spin inline-block w-6 h-6 mx-auto border-2 rounded-full"></div>';
      } else {
        this.elements.submitButton.innerHTML = this.elements.submitButton.getAttribute("data-original-text") || "Add To Cart";
      }
    }
    if (this.elements.oneTimeButton) {
      const isOneTimeLoading = isLoading && loadingButton === "oneTime";
      this.elements.oneTimeButton.setAttribute("aria-busy", isOneTimeLoading ? "true" : "false");
      this.elements.oneTimeButton.disabled = isOneTimeLoading;
      if (isOneTimeLoading) {
        this.elements.oneTimeButton.innerHTML = '<div class="border-primary/20 border-t-primary animate-spin inline-block w-4 h-4 mr-2 align-middle border-2 rounded-full"></div> Adding...';
      } else {
        this.elements.oneTimeButton.innerHTML = this.elements.oneTimeButton.getAttribute("data-original-text") || "One-Time Purchase";
      }
    }
    if (this.elements.productActions) {
      this.elements.productActions.setAttribute("data-processing", isLoading ? "true" : "false");
    }
  }
  handleFrequencySelectorVisibility(isSubscription, selectedBoxElement) {
    if (!this.elements.frequencyContainer) return;
    if (isSubscription) {
      DOMUtils.toggleClass(this.elements.frequencyContainer, "hidden", false);
      if (this.elements.frequencyContainer.style.display === "none") {
        this.elements.frequencyContainer.style.display = "block";
      }
      this.populateFrequencySelector(selectedBoxElement);
    } else {
      DOMUtils.toggleClass(this.elements.frequencyContainer, "hidden", true);
    }
  }
  initState() {
    var _a;
    if (!this.elements.productActions || !((_a = this.elements.purchaseOptionBoxes) == null ? void 0 : _a.length) > 0) {
      return;
    }
    const defaultIdx = parseInt(this.elements.productActions.dataset.defaultVariantIndex, 10) || 0;
    let defaultBox = null;
    if (defaultIdx > 0 && this.elements.purchaseOptionBoxes.length >= defaultIdx) {
      defaultBox = this.elements.purchaseOptionBoxes[defaultIdx - 1];
    }
    if (!defaultBox) {
      defaultBox = Array.from(this.elements.purchaseOptionBoxes).find((box) => box.dataset.purchaseType === "subscribe") || this.elements.purchaseOptionBoxes[0];
    }
    if (this.elements.submitButton) {
      this.elements.submitButton.setAttribute("data-original-text", this.elements.submitButton.textContent);
    }
    if (this.elements.oneTimeButton) {
      this.elements.oneTimeButton.setAttribute("data-original-text", this.elements.oneTimeButton.textContent);
    }
    if (defaultBox) {
      this.state.selectedBox = defaultBox;
      this.state.purchaseType = defaultBox.dataset.purchaseType || null;
      this.state.variantId = defaultBox.dataset.variant || null;
      this.state.productId = defaultBox.dataset.product || null;
      if (this.state.purchaseType === "subscribe") {
        this.state.sellingPlanId = null;
      } else {
        this.state.sellingPlanId = null;
      }
      this.updateSelectedBoxUI(defaultBox);
      if (this.state.purchaseType === "subscribe") {
        this.handleFrequencySelectorVisibility(true, defaultBox);
      }
    }
    setTimeout(() => this.setState({ isInitialLoad: false }), 100);
  }
  attachEventListeners() {
    if (!this.elements.productActions) {
      return;
    }
    this.elements.productActions.addEventListener("click", (e) => {
      const box = e.target.closest(".variant-boxes .variant-box");
      if (box && box.getAttribute("aria-selected") !== "true") {
        e.preventDefault();
        this.setState({ selectedBox: box });
      }
    });
    this.elements.productActions.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const box = e.target.closest(".variant-boxes .variant-box");
      if (box && box.getAttribute("aria-selected") !== "true") {
        e.preventDefault();
        this.setState({ selectedBox: box });
      }
    });
    if (this.elements.frequencyOptions) {
      this.elements.frequencyOptions.addEventListener("click", (e) => {
        const option = e.target.closest(".frequency-box[data-selling-plan-id]");
        if (option) {
          this.selectFrequencyOption(option);
        }
      });
      this.elements.frequencyOptions.addEventListener("keydown", (e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        const option = e.target.closest(".frequency-box[data-selling-plan-id]");
        if (option) {
          e.preventDefault();
          this.selectFrequencyOption(option);
        }
      });
    }
    if (this.elements.frequencyDropdown) {
      this.elements.frequencyDropdown.addEventListener("change", (e) => {
        this.selectFrequencyOption(e.target.options[e.target.selectedIndex]);
        e.target.blur();
      });
    }
    if (this.elements.submitButton) {
      this.elements.submitButton.addEventListener("click", async (e) => {
        e.preventDefault();
        if (this.state.isLoading || this.state.isRedirectingToCheckout) return;
        this.setState({ isLoading: true, loadingButton: "submit" });
        try {
          const items = this.prepareItemsForCart();
          if (!items) {
            this.setState({ isLoading: false, loadingButton: null });
            return;
          }
          if (this.config.buyType === "buy_now") {
            await this.handleBuyNowFlow(items);
          } else {
            await this.addValidItemsToCart(items);
            this.setState({ isLoading: false, loadingButton: null });
          }
        } catch (err) {
          console.error("Submit error:", err);
          showNotification(parseErrorMessage(err, "checkout"), "error");
          this.setState({ isLoading: false, loadingButton: null });
        }
      });
    }
    if (this.elements.oneTimeButton) {
      this.elements.oneTimeButton.addEventListener("click", async (e) => {
        var _a;
        e.preventDefault();
        if (this.state.isLoading || this.state.isRedirectingToCheckout) return;
        this.setState({ isLoading: true, loadingButton: "oneTime" });
        try {
          const variantId = this.elements.oneTimeButton.dataset.variantId;
          if (!variantId) throw new Error("Invalid variant ID for one-time purchase");
          let items = [{ id: parseInt(variantId, 10), quantity: 1 }];
          if (this.config.isOneTimeGift) {
            const selectedGift = this.getSelectedGiftId(false);
            if (selectedGift && selectedGift.id) {
              const giftItem = {
                id: parseInt(selectedGift.id, 10),
                quantity: 1,
                properties: { _gift: "true" }
              };
              if (selectedGift.selling_plan_id) {
                giftItem.selling_plan = selectedGift.selling_plan_id;
                console.log("Adding one-time gift with selling plan: ".concat(selectedGift.selling_plan_id));
              }
              items.push(giftItem);
            } else if (((_a = this.elements.productActions) == null ? void 0 : _a.dataset.giftsAmount) > 0) {
            }
          }
          if (this.config.buyType === "buy_now") {
            await this.handleBuyNowFlow(items);
          } else {
            await this.addValidItemsToCart(items);
            this.elements.oneTimeButton.innerHTML = "✓ Added!";
            this.elements.oneTimeButton.classList.add("text-green-700", "border-green-700");
            this.elements.oneTimeButton.classList.remove("text-red-600", "border-red-600");
            setTimeout(() => {
              this.setState({ isLoading: false, loadingButton: null });
              this.elements.oneTimeButton.classList.remove("text-green-700", "border-green-700");
            }, 2e3);
          }
        } catch (err) {
          console.error("One-time add error:", err);
          showNotification(parseErrorMessage(err, "cart-add"), "error");
          this.elements.oneTimeButton.innerHTML = "⚠ Failed";
          this.elements.oneTimeButton.classList.add("text-red-600", "border-red-600");
          this.elements.oneTimeButton.classList.remove("text-green-700", "border-green-700");
          setTimeout(() => {
            this.setState({ isLoading: false, loadingButton: null });
            this.elements.oneTimeButton.classList.remove("text-red-600", "border-red-600");
          }, 2e3);
        }
      });
    }
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        setTimeout(() => {
          if (this.state.selectedBox && this.state.purchaseType === "subscribe") {
            this.handleFrequencySelectorVisibility(true, this.state.selectedBox);
          }
        }, 100);
      }
    });
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) {
        if (this.state.selectedBox) {
          this.updateSelectedBoxUI(this.state.selectedBox);
        }
      }
    });
  }
  prepareItemsForCart() {
    var _a, _b;
    const selectedBox = this.state.selectedBox;
    if (!selectedBox) {
      showNotification("Please select a purchase option");
      return null;
    }
    const variantId = this.state.variantId;
    const isSub = this.state.purchaseType === "subscribe";
    const sellingPlanId = isSub ? this.state.sellingPlanId : null;
    if (!variantId) {
      showNotification("Invalid product option selected");
      return null;
    }
    if (isSub && !sellingPlanId) {
      const variantData = this.findVariantInProductData(variantId);
      if (((_a = variantData == null ? void 0 : variantData.selling_plan_allocations) == null ? void 0 : _a.length) > 0) {
        this.state.sellingPlanId = variantData.selling_plan_allocations[0].selling_plan.id;
      } else {
        showNotification("Please select a subscription frequency");
        return null;
      }
    }
    let items = [
      {
        id: parseInt(variantId, 10),
        quantity: 1,
        ...isSub && this.state.sellingPlanId ? { selling_plan: this.state.sellingPlanId } : {}
      }
    ];
    const giftsAmount = parseInt(((_b = this.elements.productActions) == null ? void 0 : _b.dataset.giftsAmount) || "0", 10);
    if (giftsAmount > 0) {
      const selectedGift = this.getSelectedGiftId(isSub);
      if (!selectedGift || !selectedGift.id) {
        showNotification("Please select your free gift");
        return null;
      }
      const giftItem = {
        id: parseInt(selectedGift.id, 10),
        quantity: 1,
        properties: { _gift: "true" }
      };
      if (selectedGift.selling_plan_id) {
        giftItem.selling_plan = selectedGift.selling_plan_id;
        console.log("Adding gift with selling plan: ".concat(selectedGift.selling_plan_id));
      }
      items.push(giftItem);
    }
    return items;
  }
  getSelectedGiftId(isSubscription) {
    if (!this.elements.giftContainer) {
      return null;
    }
    const selectedGiftBox = this.elements.giftContainer.querySelector(".gift-box.selected");
    if (!selectedGiftBox) {
      return null;
    }
    const selectedGiftOption = selectedGiftBox.querySelector(".gift-option-border");
    if (!selectedGiftOption) {
      return null;
    }
    const giftId = isSubscription ? selectedGiftOption.dataset.giftIdSubscription : selectedGiftOption.dataset.giftId;
    const sellingPlanId = isSubscription ? selectedGiftOption.dataset.giftSellingPlanIdSubscription : selectedGiftOption.dataset.giftSellingPlanId;
    return {
      id: giftId,
      selling_plan_id: sellingPlanId ? parseInt(sellingPlanId, 10) : null
    };
  }
  async handleBuyNowFlow(items) {
    try {
      this.setState({ isRedirectingToCheckout: true });
      const cartPopup = document.getElementById("upCart");
      if (cartPopup) cartPopup.remove();
      await clearCart();
      const addRes = await fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
        cache: "no-store"
      });
      if (!addRes.ok) {
        const errorData = await addRes.json();
        throw Object.assign(new Error("Failed to add items for buy now"), { response: errorData });
      }
      CartCache.invalidate();
      try {
        const cartData = await getCart(true);
        console.log("=== CHECKOUT DEBUG INFO ===");
        console.log("Cart Items:", cartData.items);
        console.log("Item Count:", cartData.item_count);
        console.log("Total Price:", cartData.total_price);
        console.log("Items Detail:");
        cartData.items.forEach((item, index) => {
          console.log("Item ".concat(index + 1, ":"), {
            title: item.title,
            variant_title: item.variant_title,
            quantity: item.quantity,
            price: item.price,
            line_price: item.line_price,
            final_price: item.final_price,
            discounted_price: item.discounted_price,
            selling_plan_allocation: item.selling_plan_allocation,
            variant_id: item.variant_id,
            sku: item.sku,
            properties: item.properties
          });
        });
        console.log("Cart Attributes:", cartData.attributes);
        console.log("Original Total Price:", cartData.original_total_price);
        console.log("Cart Token:", cartData.token);
        console.log("=== END CHECKOUT DEBUG INFO ===");
      } catch (debugErr) {
        console.warn("Failed to log checkout debug info:", debugErr);
      }
      this.setState({ isRedirectingToCheckout: false, isLoading: false, loadingButton: null });
      setTimeout(() => {
        window.location.href = "/checkout";
      }, 50);
    } catch (err) {
      console.error("handleBuyNowFlow error:", err);
      this.setState({ isRedirectingToCheckout: false, isLoading: false, loadingButton: null });
      throw err;
    }
  }
  async addValidItemsToCart(items) {
    try {
      const subItemToAdd = items.find((i) => i.selling_plan);
      if (subItemToAdd) {
        let cart = await getCart(true);
        const variantIdToAdd = subItemToAdd.id;
        const itemsToRemove = {};
        cart.items.forEach((item) => {
          if (item.selling_plan_allocation && item.variant_id === variantIdToAdd) {
            itemsToRemove[item.key] = 0;
          }
        });
        if (Object.keys(itemsToRemove).length > 0) {
          await fetch("/cart/update.js", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
            cache: "no-store",
            body: JSON.stringify({ updates: itemsToRemove })
          });
          CartCache.invalidate();
        }
      }
      const res = await fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
        cache: "no-store",
        body: JSON.stringify({ items })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw Object.assign(new Error("Failed to add items to cart"), { response: errorData });
      }
      CartCache.invalidate();
      if (typeof window.updateCart === "function") window.updateCart();
      showNotification("Items added to cart!", "success");
      return res.json();
    } catch (err) {
      console.error("Error in addValidItemsToCart:", err);
      throw err;
    }
  }
  updatePriceDisplay(el) {
    if (!this.elements.priceDisplays || this.elements.priceDisplays.length === 0 || !el) return;
    parseFloat(el.dataset.subscriptionItemPrice) || 0;
    parseFloat(el.dataset.subscriptionPrice) || 0;
    const origItemCap = parseFloat(el.dataset.originalItemCap) || 0;
    const bottles = parseInt(el.dataset.bottleQuantity, 10) || 1;
    if (origItemCap === 0) return;
    const totalOrigCap = origItemCap * bottles;
    const subscriptionDiscountPercent = parseFloat(el.dataset.subscriptionDiscount) || 0;
    const firstMonthDiscountPercent = parseFloat(el.dataset.firstMonthDiscount) || 0;
    const effectiveDiscountPercent = subscriptionDiscountPercent + firstMonthDiscountPercent;
    const effectiveMultiplier = (100 - effectiveDiscountPercent) / 100;
    const firstMonthItemPrice = origItemCap * effectiveMultiplier;
    const firstMonthTotalPrice = totalOrigCap * effectiveMultiplier;
    const regularMultiplier = (100 - subscriptionDiscountPercent) / 100;
    const regularItemPrice = origItemCap * regularMultiplier;
    const regularTotalPrice = totalOrigCap * regularMultiplier;
    const displayItemPrice = this.config.priceFormat === "per_bottle" ? firstMonthItemPrice : firstMonthTotalPrice;
    const displayOrigPrice = this.config.priceFormat === "per_bottle" ? origItemCap : totalOrigCap;
    const displayRegularPrice = this.config.priceFormat === "per_bottle" ? regularItemPrice : regularTotalPrice;
    const saveAmount = displayOrigPrice - displayItemPrice;
    const saveAmountDollars = saveAmount / 100;
    const roundedSaveAmountDollars = Math.round(saveAmountDollars);
    const savingsText = roundedSaveAmountDollars > 0 ? "SAVE ".concat(this.state.currencySymbol).concat(roundedSaveAmountDollars) : "";
    const formatMoney = (amount) => "".concat(this.state.currencySymbol).concat((amount / 100).toFixed(2));
    const newMainPriceText = formatMoney(displayItemPrice);
    const newComparePriceText = formatMoney(displayOrigPrice);
    const regularPriceFormatted = formatMoney(displayRegularPrice);
    const newFuturePriceText = firstMonthDiscountPercent > 0 ? "Special price for first order. Refills for ".concat(regularPriceFormatted).concat(this.config.priceFormat === "per_bottle" ? "/bottle" : "", ".") : "";
    const newTotalLineHTML = this.config.priceFormat === "per_bottle" && firstMonthTotalPrice !== firstMonthItemPrice ? "Total ".concat(formatMoney(firstMonthTotalPrice / 100), ' <span class="total-price-cap text-gray-500 line-through">').concat(formatMoney(totalOrigCap / 100), "</span>") : "";
    this.elements.priceDisplays.forEach((display) => {
      const mainPriceEl = display.querySelector(".main-price .price");
      const capEl = display.querySelector(".cap");
      const discountBadgeEl = display.querySelector(".discount-badge");
      const totalLineEl = display.querySelector(".total-line");
      const futurePriceEl = display.querySelector(".future-price-notice");
      const perText = display.querySelector(".per-text");
      const hasContentChanged = mainPriceEl && mainPriceEl.textContent !== newMainPriceText || capEl && capEl.textContent !== newComparePriceText || discountBadgeEl && discountBadgeEl.textContent !== savingsText || totalLineEl && totalLineEl.innerHTML !== newTotalLineHTML || futurePriceEl && futurePriceEl.textContent !== newFuturePriceText;
      display.setAttribute("data-price-format", this.config.priceFormat);
      display.setAttribute("data-has-savings", saveAmount > 0 ? "true" : "false");
      if (hasContentChanged && !this.state.isInitialLoad) {
        display.setAttribute("data-updating", "true");
        setTimeout(() => {
          if (mainPriceEl) mainPriceEl.textContent = newMainPriceText;
          if (capEl) capEl.textContent = newComparePriceText;
          if (discountBadgeEl) {
            discountBadgeEl.textContent = savingsText;
            discountBadgeEl.setAttribute("data-visible", saveAmount > 0 && this.config.priceFormat === "total" ? "true" : "false");
          }
          if (totalLineEl) totalLineEl.innerHTML = newTotalLineHTML;
          if (futurePriceEl) futurePriceEl.textContent = newFuturePriceText;
          if (perText) {
            perText.style.display = this.config.priceFormat === "total" ? "none" : "";
          }
          display.setAttribute("data-updating", "false");
        }, 220);
      } else {
        if (mainPriceEl) mainPriceEl.textContent = newMainPriceText;
        if (capEl) capEl.textContent = newComparePriceText;
        if (discountBadgeEl) {
          discountBadgeEl.textContent = savingsText;
          discountBadgeEl.setAttribute("data-visible", saveAmount > 0 && this.config.priceFormat === "total" ? "true" : "false");
        }
        if (totalLineEl) totalLineEl.innerHTML = newTotalLineHTML;
        if (futurePriceEl) futurePriceEl.textContent = newFuturePriceText;
        if (perText) {
          perText.style.display = this.config.priceFormat === "total" ? "none" : "";
        }
      }
    });
  }
  performSlideUpdate(slider, variantId) {
    try {
      if (!slider || !variantId) return;
      const slideIndex = Array.from(slider.slides).findIndex((s) => s.dataset.variantId === variantId);
      if (slideIndex !== -1 && slider.activeIndex !== slideIndex) {
        slider.update();
        requestAnimationFrame(() => {
          slider.slideTo(slideIndex, 300);
        });
      }
    } catch (err) {
      console.error("Swiper slide update error:", err);
    }
  }
  updateVariantImage(el) {
    var _a;
    const variantId = el.dataset.variant;
    if (!variantId) return;
    const sliderInstanceId = "productSliderAllInOne".concat(this.config.SID);
    let slider = window[sliderInstanceId];
    if ((_a = slider == null ? void 0 : slider.slides) == null ? void 0 : _a.length) {
      this.performSlideUpdate(slider, variantId);
    } else {
      let attempts = 0;
      const maxAttempts = 50;
      const interval = setInterval(() => {
        var _a2;
        slider = window[sliderInstanceId];
        if ((_a2 = slider == null ? void 0 : slider.slides) == null ? void 0 : _a2.length) {
          clearInterval(interval);
          this.performSlideUpdate(slider, variantId);
        } else if (++attempts >= maxAttempts) {
          clearInterval(interval);
          console.warn("Swiper instance ".concat(sliderInstanceId, " not found after ").concat(maxAttempts, " attempts."));
        }
      }, 100);
    }
  }
  updateBuyButtonTracking(el) {
    if (!this.elements.submitButton || !el) return;
    const sku = el.dataset.sku;
    const purchaseType = el.dataset.purchaseType;
    const currentName = this.elements.submitButton.getAttribute("name") || "";
    if (currentName.startsWith("track:")) {
      const parts = currentName.split("|");
      const action = parts[0];
      const params = {};
      parts.slice(1).forEach((p) => {
        const [k, v] = p.split(":");
        if (k) params[k] = v;
      });
      params["variant-sku"] = sku;
      params["purchase-type"] = purchaseType;
      const newName = "".concat(action, "|").concat(Object.entries(params).map(([k, v]) => "".concat(k, ":").concat(v)).join("|"));
      DOMUtils.updateAttribute(this.elements.submitButton, "name", newName);
    }
    DOMUtils.updateAttribute(this.elements.submitButton, "data-sku", sku);
    DOMUtils.updateAttribute(this.elements.submitButton, "data-purchase-type", purchaseType);
  }
  selectFrequencyOption(optionElementOrValue) {
    if (!optionElementOrValue) return;
    let newSellingPlanId = null;
    let selectedOptionElement = null;
    if (typeof optionElementOrValue === "string") {
      newSellingPlanId = optionElementOrValue;
      if (this.elements.frequencyOptions) {
        selectedOptionElement = this.elements.frequencyOptions.querySelector('[data-selling-plan-id="'.concat(newSellingPlanId, '"]'));
      } else if (this.elements.frequencyDropdown) {
        selectedOptionElement = Array.from(this.elements.frequencyDropdown.options).find((opt) => opt.value === newSellingPlanId);
      }
    } else if (optionElementOrValue.nodeType === 1) {
      selectedOptionElement = optionElementOrValue;
      newSellingPlanId = selectedOptionElement.dataset.sellingPlanId || selectedOptionElement.value;
    }
    if (!newSellingPlanId || newSellingPlanId === this.state.sellingPlanId) return;
    this.setState({
      selectedFrequency: selectedOptionElement,
      // Store element for potential UI use
      sellingPlanId: newSellingPlanId
    });
    if (this.elements.submitSellingPlanId) {
      this.elements.submitSellingPlanId.value = newSellingPlanId;
    }
    if (this.elements.sellingPlanInput) {
      this.elements.sellingPlanInput.value = newSellingPlanId;
    }
    if (this.state.selectedBox && this.state.selectedBox.dataset.purchaseType === "subscribe") {
      this.state.selectedBox.dataset.subscriptionSellingPlanId = newSellingPlanId;
    }
  }
  populateFrequencySelector(selectedVariantBox) {
    var _a, _b, _c;
    if (!selectedVariantBox || selectedVariantBox.dataset.purchaseType !== "subscribe" || !this.elements.frequencyContainer) {
      if (this.elements.frequencyContainer) this.elements.frequencyContainer.classList.add("hidden");
      return;
    }
    const variantId = selectedVariantBox.dataset.originalVariant || selectedVariantBox.dataset.variant;
    const allowedPlansAttr = selectedVariantBox.dataset.allowedSellingPlans;
    const allowedPlanIds = allowedPlansAttr ? allowedPlansAttr.split(",").map((id) => id.trim()) : null;
    const uiType = this.elements.frequencyContainer.dataset.uiType || "tabs";
    const optionsContainer = uiType === "dropdown" ? this.elements.frequencyDropdown : this.elements.frequencyOptions;
    if (!optionsContainer) {
      console.error("Frequency options container not found for UI type: ".concat(uiType));
      this.elements.frequencyContainer.classList.add("hidden");
      return;
    }
    optionsContainer.innerHTML = "";
    const variantData = this.findVariantInProductData(variantId);
    if (!((_a = variantData == null ? void 0 : variantData.selling_plan_allocations) == null ? void 0 : _a.length)) {
      console.warn("No selling plan allocations found for variant ".concat(variantId, ". Hiding frequency selector."));
      this.handleFallbackFrequencyOptions(selectedVariantBox, optionsContainer, this.elements.frequencyContainer);
      return;
    }
    let plans = variantData.selling_plan_allocations;
    if (allowedPlanIds) {
      plans = plans.filter((alloc) => allowedPlanIds.includes(alloc.selling_plan.id.toString()));
      if (plans.length === 0) {
        console.warn("No selling plans matched the allowed list for variant ".concat(variantId, ":"), allowedPlansAttr);
        this.handleFallbackFrequencyOptions(selectedVariantBox, optionsContainer, this.elements.frequencyContainer);
        return;
      }
    }
    plans.sort((a, b) => {
      const freqA = extractFrequency(a.selling_plan.name);
      const freqB = extractFrequency(b.selling_plan.name);
      const daysA = freqA.unit === "month" ? freqA.value * 30 : freqA.unit === "week" ? freqA.value * 7 : freqA.value;
      const daysB = freqB.unit === "month" ? freqB.value * 30 : freqB.unit === "week" ? freqB.value * 7 : freqB.value;
      return daysA - daysB;
    });
    const bottleQuantity = parseInt(selectedVariantBox.dataset.bottleQuantity || "1", 10);
    let recommendedPlanId = null;
    plans.forEach((alloc) => {
      const { value, unit } = extractFrequency(alloc.selling_plan.name);
      if (unit === "month" && value === bottleQuantity || bottleQuantity === 1 && unit === "day" && value === 30 || unit === "week" && value === 4) {
        recommendedPlanId = alloc.selling_plan.id.toString();
      }
    });
    if (this.state.isInitialLoad || !this.state.sellingPlanId) {
      let planIdToSelect = recommendedPlanId || this.state.sellingPlanId || selectedVariantBox.dataset.subscriptionSellingPlanId || ((_b = plans[0]) == null ? void 0 : _b.selling_plan.id.toString());
      this.state.sellingPlanId = planIdToSelect;
      if (this.elements.submitSellingPlanId) {
        this.elements.submitSellingPlanId.value = planIdToSelect;
      }
      if (this.elements.sellingPlanInput) {
        this.elements.sellingPlanInput.value = planIdToSelect;
      }
      selectedVariantBox.dataset.subscriptionSellingPlanId = planIdToSelect;
    } else {
      this.state.sellingPlanId || selectedVariantBox.dataset.subscriptionSellingPlanId || recommendedPlanId || ((_c = plans[0]) == null ? void 0 : _c.selling_plan.id.toString());
    }
    console.log("populateFrequencySelector: bottleQuantity=".concat(bottleQuantity, ", recommendedPlanId=").concat(recommendedPlanId, ", planIdToSelect=").concat(this.state.sellingPlanId));
    plans.forEach((allocation) => {
      const plan = allocation.selling_plan;
      const { value, unit } = extractFrequency(plan.name);
      const isSelected = plan.id.toString() === this.state.sellingPlanId;
      const isRecommended = plan.id.toString() === recommendedPlanId;
      if (uiType === "dropdown") {
        let optionText = "Every ".concat(value, " ").concat(unit).concat(value > 1 ? "s" : "");
        if (isRecommended) {
          optionText += " (Recommended use)";
        }
        const option = DOMUtils.createElement("option", {
          value: plan.id,
          textContent: optionText,
          selected: isSelected,
          className: isRecommended ? "text-primary" : "",
          "data-frequency-value": value,
          "data-frequency-unit": unit
        });
        optionsContainer.appendChild(option);
      } else {
        const freqBox = DOMUtils.createElement("div", {
          className: "frequency-box rounded border-2 border-primary-lighter cursor-pointer py-2 px-3 min-w-[90px] max-w-[168px] text-center w-full transition-all duration-300 ease-in-out aria-selected:bg-primary aria-selected:text-white aria-[selected=false]:bg-white aria-[selected=false]:text-primary hover:bg-gray-100",
          "data-selling-plan-id": plan.id,
          "data-frequency-value": value,
          "data-frequency-unit": unit,
          "aria-selected": isSelected ? "true" : "false",
          role: "tab",
          tabindex: "0",
          // Make focusable for keyboard navigation
          innerHTML: '<span class="font-semibold text-[14px] block">Every '.concat(value, '</span><span class="text-[12px] block">').concat(unit).concat(value > 1 ? "s" : "", "</span>")
        });
        optionsContainer.appendChild(freqBox);
      }
    });
    if (uiType === "dropdown" && this.elements.frequencyDropdown) {
      this.elements.frequencyDropdown.value = this.state.sellingPlanId;
    }
    this.updateFrequencyDescription();
    this.elements.frequencyContainer.classList.remove("hidden");
  }
  handleFallbackFrequencyOptions(el, frequencyOptions, frequencyContainer) {
    if (!frequencyOptions || !frequencyContainer) return;
    const currentSellingPlanId = el.dataset.subscriptionSellingPlanId;
    const bottleQuantity = parseInt(el.dataset.bottleQuantity || "1", 10);
    if (el.dataset.purchaseType === "subscribe" && currentSellingPlanId) {
      frequencyOptions.innerHTML = "";
      const uiType = frequencyContainer.dataset.uiType || "tabs";
      const isDropdown = uiType === "dropdown";
      let frequencyValue = bottleQuantity;
      let frequencyUnit = "month";
      if (el.dataset.frequencyValue && el.dataset.frequencyUnit) {
        frequencyValue = parseInt(el.dataset.frequencyValue, 10);
        frequencyUnit = el.dataset.frequencyUnit;
      }
      const fallbackText = "Every ".concat(frequencyValue, " ").concat(frequencyUnit).concat(frequencyValue > 1 ? "s" : "");
      if (isDropdown) {
        const option = DOMUtils.createElement("option", {
          value: currentSellingPlanId,
          textContent: fallbackText,
          selected: true,
          "data-selling-plan-id": currentSellingPlanId,
          "data-frequency-value": frequencyValue.toString(),
          "data-frequency-unit": frequencyUnit
        });
        frequencyOptions.appendChild(option);
      } else {
        const fallbackBox = DOMUtils.createElement("div", {
          className: "frequency-box rounded border-2 border-primary-lighter cursor-pointer py-2 px-3 min-w-[90px] max-w-[168px] text-center w-full transition-all duration-300 ease-in-out aria-selected:bg-primary aria-selected:text-white aria-[selected=false]:bg-white aria-[selected=false]:text-primary hover:bg-gray-100",
          "data-selling-plan-id": currentSellingPlanId,
          "data-frequency-value": frequencyValue.toString(),
          "data-frequency-unit": frequencyUnit,
          "aria-selected": "true",
          // Always selected in fallback
          role: "tab",
          tabindex: "0",
          // Make focusable for keyboard navigation
          innerHTML: '<span class="font-semibold text-[14px] block">Every '.concat(frequencyValue, '</span><span class="text-[12px] block">').concat(frequencyUnit).concat(frequencyValue > 1 ? "s" : "", "</span>")
        });
        frequencyOptions.appendChild(fallbackBox);
      }
      frequencyContainer.classList.remove("hidden");
      setTimeout(() => this.updateFrequencyDescription(), 50);
    } else {
      frequencyContainer.classList.add("hidden");
      frequencyOptions.innerHTML = "";
    }
  }
  updateFrequencyDescription() {
    var _a, _b;
    if (!this.elements.frequencyDescription || !this.state.selectedBox) return;
    const uiType = ((_a = this.elements.frequencyContainer) == null ? void 0 : _a.dataset.uiType) || "tabs";
    if (uiType === "dropdown") {
      this.elements.frequencyDescription.innerHTML = "";
      this.elements.frequencyDescription.style.display = "none";
      return;
    }
    const selectedBox = this.state.selectedBox;
    const bottleQuantity = parseInt(selectedBox.dataset.bottleQuantity || "1", 10);
    let selectedValue, selectedUnit;
    if (this.state.sellingPlanId) {
      let selectedOption;
      if (uiType === "tabs" && this.elements.frequencyOptions) {
        selectedOption = this.elements.frequencyOptions.querySelector('[data-selling-plan-id="'.concat(this.state.sellingPlanId, '"]'));
      }
      if ((selectedOption == null ? void 0 : selectedOption.dataset.frequencyValue) && (selectedOption == null ? void 0 : selectedOption.dataset.frequencyUnit)) {
        selectedValue = parseInt(selectedOption.dataset.frequencyValue, 10);
        selectedUnit = selectedOption.dataset.frequencyUnit;
      } else {
        const variantData = this.findVariantInProductData(this.state.variantId);
        const allocation = (_b = variantData == null ? void 0 : variantData.selling_plan_allocations) == null ? void 0 : _b.find((a) => a.selling_plan.id.toString() === this.state.sellingPlanId);
        if (allocation) {
          const freq = extractFrequency(allocation.selling_plan.name);
          selectedValue = freq.value;
          selectedUnit = freq.unit;
        }
      }
    }
    let description = "";
    if (selectedValue && selectedUnit && !(selectedUnit === "month" && selectedValue === bottleQuantity)) {
      description = "Recommended - ".concat(bottleQuantity, " month").concat(bottleQuantity > 1 ? "s" : "");
    }
    if (this.elements.frequencyDescription.innerHTML !== description) {
      this.elements.frequencyDescription.setAttribute("data-changing", "true");
      setTimeout(() => {
        this.elements.frequencyDescription.innerHTML = description;
        setTimeout(() => {
          this.elements.frequencyDescription.setAttribute("data-changing", "false");
        }, 20);
      }, 200);
    }
  }
  findVariantInProductData(variantId) {
    if (!window.productData || !variantId) return null;
    const numVariantId = parseInt(variantId, 10);
    const product = window.productData[this.state.productId];
    if (product == null ? void 0 : product.variants) {
      let variant = product.variants.find((v) => parseInt(v.id, 10) === numVariantId);
      if (variant) return variant;
      const selectedBox = this.state.selectedBox;
      if (selectedBox && selectedBox.dataset.originalVariant) {
        const originalVariantId = parseInt(selectedBox.dataset.originalVariant, 10);
        if (originalVariantId === numVariantId) {
          const actualVariantId = parseInt(selectedBox.dataset.variant, 10);
          variant = product.variants.find((v) => parseInt(v.id, 10) === actualVariantId);
          if (variant) return variant;
        } else {
          variant = product.variants.find((v) => parseInt(v.id, 10) === originalVariantId);
          if (variant) return variant;
        }
      }
    }
    console.warn("Variant ".concat(variantId, " not found in product data for product ").concat(this.state.productId));
    return null;
  }
  moveCtaTextIfNeeded() {
    if (window.innerWidth < 768 && this.elements.ctaText && this.elements.productActions) {
      if (this.elements.ctaText.parentElement !== this.elements.productActions) {
        this.elements.productActions.insertAdjacentElement("afterbegin", this.elements.ctaText);
      }
    }
  }
  // Optional: Add a static method to retrieve instances
  static getInstance(sid) {
    return BuyBoxNewInstances.get(sid);
  }
  // Optional: Add a static method to retrieve all instances
  static getAllInstances() {
    return Array.from(BuyBoxNewInstances.values());
  }
}
document.addEventListener("DOMContentLoaded", () => {
  const buyBoxContainers = document.querySelectorAll("[data-buy-box-new-root]");
  buyBoxContainers.forEach((container, index) => {
    var _a;
    const config = {
      SID: container.dataset.sid,
      buyType: container.dataset.buyType,
      priceFormat: container.dataset.priceFormat || "per_bottle",
      isSlideVariant: container.dataset.isSlideVariant === "true",
      isOneTimeGift: container.dataset.isOneTimeGift === "true",
      isOneTimePurchaseLink: container.dataset.isOneTimePurchaseLink === "true",
      currencySymbol: container.dataset.currencySymbol || "$",
      product: (_a = window.productData) == null ? void 0 : _a[container.dataset.productId]
      // Pass initial product data if available
    };
    if (!config.SID) {
      return;
    }
    if (!config.product && container.dataset.productId) {
      console.warn("BuyBoxNew (".concat(config.SID, "): Product data for ID ").concat(container.dataset.productId, " not found in window.productData during initialization."));
    }
    new BuyBoxNew(container, config);
  });
});
if (!customElements.get("share-button")) {
  customElements.define("share-button", class ShareButton extends DetailsDisclosure {
    constructor() {
      super();
      this.elements = {
        shareButton: this.querySelector("button"),
        shareSummary: this.querySelector("summary"),
        closeButton: this.querySelector(".share-button__close"),
        successMessage: this.querySelector('[id^="ShareMessage"]'),
        urlInput: this.querySelector("input")
      };
      this.urlToShare = this.elements.urlInput ? this.elements.urlInput.value : document.location.href;
      if (navigator.share) {
        this.mainDetailsToggle.setAttribute("hidden", "");
        this.elements.shareButton.classList.remove("hidden");
        this.elements.shareButton.addEventListener("click", () => {
          navigator.share({ url: this.urlToShare, title: document.title });
        });
      } else {
        this.mainDetailsToggle.addEventListener("toggle", this.toggleDetails.bind(this));
        this.mainDetailsToggle.querySelector(".share-button__copy").addEventListener("click", this.copyToClipboard.bind(this));
        this.mainDetailsToggle.querySelector(".share-button__close").addEventListener("click", this.close.bind(this));
      }
    }
    toggleDetails() {
      if (!this.mainDetailsToggle.open) {
        this.elements.successMessage.classList.add("hidden");
        this.elements.successMessage.textContent = "";
        this.elements.closeButton.classList.add("hidden");
        this.elements.shareSummary.focus();
      }
    }
    copyToClipboard() {
      navigator.clipboard.writeText(this.elements.urlInput.value).then(() => {
        this.elements.successMessage.classList.remove("hidden");
        this.elements.successMessage.textContent = window.accessibilityStrings.shareSuccess;
        this.elements.closeButton.classList.remove("hidden");
        this.elements.closeButton.focus();
      });
    }
    updateUrl(url) {
      this.urlToShare = url;
      this.elements.urlInput.value = url;
    }
  });
}
class ShowMoreButton extends HTMLElement {
  constructor() {
    super();
    const button = this.querySelector("button");
    button.addEventListener("click", (event) => {
      this.expandShowMore(event);
      const nextElementToFocus = event.target.closest(".parent-display").querySelector(".show-more-item");
      if (nextElementToFocus && !nextElementToFocus.classList.contains("hidden")) {
        nextElementToFocus.querySelector("input").focus();
      }
    });
  }
  expandShowMore(event) {
    const parentDisplay = event.target.closest('[id^="Show-More-"]').closest(".parent-display");
    parentDisplay.querySelector(".parent-wrap");
    this.querySelectorAll(".label-text").forEach((element) => element.classList.toggle("hidden"));
    parentDisplay.querySelectorAll(".show-more-item").forEach((item) => item.classList.toggle("hidden"));
  }
}
customElements.define("show-more-button", ShowMoreButton);
console.log("📦 Product bundle loaded - Product page functionality initialized");
export {
  __vite_legacy_guard
};
