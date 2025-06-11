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
if (!customElements.get("media-gallery")) {
  customElements.define("media-gallery", class MediaGallery extends HTMLElement {
    constructor() {
      super();
      this.elements = {
        liveRegion: this.querySelector('[id^="GalleryStatus"]'),
        viewer: this.querySelector('[id^="GalleryViewer"]'),
        thumbnails: this.querySelector('[id^="GalleryThumbnails"]')
      };
      this.mql = window.matchMedia("(min-width: 750px)");
      if (!this.elements.thumbnails) return;
      this.elements.viewer.addEventListener("slideChanged", debounce(this.onSlideChanged.bind(this), 500));
      this.elements.thumbnails.querySelectorAll("[data-target]").forEach((mediaToSwitch) => {
        mediaToSwitch.querySelector("button").addEventListener("click", this.setActiveMedia.bind(this, mediaToSwitch.dataset.target, false));
      });
      if (this.dataset.desktopLayout.includes("thumbnail") && this.mql.matches) this.removeListSemantic();
    }
    onSlideChanged(event) {
      const thumbnail = this.elements.thumbnails.querySelector('[data-target="'.concat(event.detail.currentElement.dataset.mediaId, '"]'));
      this.setActiveThumbnail(thumbnail);
    }
    setActiveMedia(mediaId, prepend) {
      const activeMedia = this.elements.viewer.querySelector('[data-media-id="'.concat(mediaId, '"]'));
      this.elements.viewer.querySelectorAll("[data-media-id]").forEach((element) => {
        element.classList.remove("is-active");
      });
      activeMedia.classList.add("is-active");
      if (prepend) {
        activeMedia.parentElement.prepend(activeMedia);
        if (this.elements.thumbnails) {
          const activeThumbnail2 = this.elements.thumbnails.querySelector('[data-target="'.concat(mediaId, '"]'));
          activeThumbnail2.parentElement.prepend(activeThumbnail2);
        }
        if (this.elements.viewer.slider) this.elements.viewer.resetPages();
      }
      this.preventStickyHeader();
      window.setTimeout(() => {
        if (this.elements.thumbnails) {
          activeMedia.parentElement.scrollTo({ left: activeMedia.offsetLeft });
        }
        if (!this.elements.thumbnails || this.dataset.desktopLayout === "stacked") {
          activeMedia.scrollIntoView({ behavior: "smooth" });
        }
      });
      this.playActiveMedia(activeMedia);
      if (!this.elements.thumbnails) return;
      const activeThumbnail = this.elements.thumbnails.querySelector('[data-target="'.concat(mediaId, '"]'));
      this.setActiveThumbnail(activeThumbnail);
      this.announceLiveRegion(activeMedia, activeThumbnail.dataset.mediaPosition);
    }
    setActiveThumbnail(thumbnail) {
      if (!this.elements.thumbnails || !thumbnail) return;
      this.elements.thumbnails.querySelectorAll("button").forEach((element) => element.removeAttribute("aria-current"));
      thumbnail.querySelector("button").setAttribute("aria-current", true);
      if (this.elements.thumbnails.isSlideVisible(thumbnail, 10)) return;
      this.elements.thumbnails.slider.scrollTo({ left: thumbnail.offsetLeft });
    }
    announceLiveRegion(activeItem, position) {
      const image = activeItem.querySelector(".product__modal-opener--image img");
      if (!image) return;
      image.onload = () => {
        this.elements.liveRegion.setAttribute("aria-hidden", false);
        this.elements.liveRegion.innerHTML = window.accessibilityStrings.imageAvailable.replace(
          "[index]",
          position
        );
        setTimeout(() => {
          this.elements.liveRegion.setAttribute("aria-hidden", true);
        }, 2e3);
      };
      image.src = image.src;
    }
    playActiveMedia(activeItem) {
      window.pauseAllMedia();
      const deferredMedia = activeItem.querySelector(".deferred-media");
      if (deferredMedia) deferredMedia.loadContent(false);
    }
    preventStickyHeader() {
      this.stickyHeader = this.stickyHeader || document.querySelector("sticky-header");
      if (!this.stickyHeader) return;
      this.stickyHeader.dispatchEvent(new Event("preventHeaderReveal"));
    }
    removeListSemantic() {
      if (!this.elements.viewer.slider) return;
      this.elements.viewer.slider.setAttribute("role", "presentation");
      this.elements.viewer.sliderItems.forEach((slide) => slide.setAttribute("role", "presentation"));
    }
  });
}
function createOverlay(image) {
  overlay = document.createElement("div");
  overlay.setAttribute("class", "image-magnify-full-size");
  overlay.setAttribute("aria-hidden", "true");
  overlay.style.backgroundImage = "url('".concat(image.src, "')");
  image.parentElement.insertBefore(overlay, image);
  return overlay;
}
function moveWithHover(image, event, zoomRatio) {
  const ratio = image.height / image.width;
  const container = event.target.getBoundingClientRect();
  const xPosition = event.clientX - container.left;
  const yPosition = event.clientY - container.top;
  const xPercent = "".concat(xPosition / (overlay.clientWidth / 100), "%");
  const yPercent = "".concat(yPosition / (overlay.clientWidth * ratio / 100), "%");
  overlay.style.backgroundPosition = "".concat(xPercent, " ").concat(yPercent);
  overlay.style.backgroundSize = "".concat(image.width * zoomRatio, "px");
}
function magnify(image, zoomRatio) {
  const overlay2 = createOverlay(image);
  overlay2.onclick = () => overlay2.remove();
  overlay2.onmousemove = (event) => moveWithHover(image, event, zoomRatio);
  overlay2.onmouseleave = () => overlay2.remove();
}
function enableZoomOnHover(zoomRatio) {
  const images = document.querySelectorAll(".image-magnify-hover");
  images.forEach((image) => {
    image.onclick = (event) => {
      magnify(image, zoomRatio);
      moveWithHover(image, event, zoomRatio);
    };
  });
}
enableZoomOnHover(2);
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
