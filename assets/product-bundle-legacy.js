;
(function () {
  function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
  function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
  function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
  function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
  function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
  function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
  function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
  function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
  function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
  function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i.return) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
  function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { if (r) i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n;else { var o = function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); }; o("next", 0), o("throw", 1), o("return", 2); } }, _regeneratorDefine2(e, r, n, t); }
  function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
  function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
  function _superPropGet(t, o, e, r) { var p = _get(_getPrototypeOf(1 & r ? t.prototype : t), o, e); return 2 & r && "function" == typeof p ? function (t) { return p.apply(e, t); } : p; }
  function _get() { return _get = "undefined" != typeof Reflect && Reflect.get ? Reflect.get.bind() : function (e, t, r) { var p = _superPropBase(e, t); if (p) { var n = Object.getOwnPropertyDescriptor(p, t); return n.get ? n.get.call(arguments.length < 3 ? e : r) : n.value; } }, _get.apply(null, arguments); }
  function _superPropBase(t, o) { for (; !{}.hasOwnProperty.call(t, o) && null !== (t = _getPrototypeOf(t));); return t; }
  function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
  function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
  function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
  function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
  function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
  function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
  function _callSuper(t, o, e) { return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e)); }
  function _possibleConstructorReturn(t, e) { if (e && ("object" == _typeof(e) || "function" == typeof e)) return e; if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined"); return _assertThisInitialized(t); }
  function _assertThisInitialized(e) { if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); return e; }
  function _inherits(t, e) { if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function"); t.prototype = Object.create(e && e.prototype, { constructor: { value: t, writable: !0, configurable: !0 } }), Object.defineProperty(t, "prototype", { writable: !1 }), e && _setPrototypeOf(t, e); }
  function _wrapNativeSuper(t) { var r = "function" == typeof Map ? new Map() : void 0; return _wrapNativeSuper = function _wrapNativeSuper(t) { if (null === t || !_isNativeFunction(t)) return t; if ("function" != typeof t) throw new TypeError("Super expression must either be null or a function"); if (void 0 !== r) { if (r.has(t)) return r.get(t); r.set(t, Wrapper); } function Wrapper() { return _construct(t, arguments, _getPrototypeOf(this).constructor); } return Wrapper.prototype = Object.create(t.prototype, { constructor: { value: Wrapper, enumerable: !1, writable: !0, configurable: !0 } }), _setPrototypeOf(Wrapper, t); }, _wrapNativeSuper(t); }
  function _construct(t, e, r) { if (_isNativeReflectConstruct()) return Reflect.construct.apply(null, arguments); var o = [null]; o.push.apply(o, e); var p = new (t.bind.apply(t, o))(); return r && _setPrototypeOf(p, r.prototype), p; }
  function _isNativeReflectConstruct() { try { var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); } catch (t) {} return (_isNativeReflectConstruct = function _isNativeReflectConstruct() { return !!t; })(); }
  function _isNativeFunction(t) { try { return -1 !== Function.toString.call(t).indexOf("[native code]"); } catch (n) { return "function" == typeof t; } }
  function _setPrototypeOf(t, e) { return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) { return t.__proto__ = e, t; }, _setPrototypeOf(t, e); }
  function _getPrototypeOf(t) { return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) { return t.__proto__ || Object.getPrototypeOf(t); }, _getPrototypeOf(t); }
  System.register(['./pubsub-legacy-chunk.js'], function (exports, module) {
    'use strict';

    return {
      setters: [null],
      execute: function execute() {
        if (!customElements.get("product-form")) {
          customElements.define("product-form", /*#__PURE__*/function (_HTMLElement) {
            function ProductForm() {
              var _this;
              _classCallCheck(this, ProductForm);
              _this = _callSuper(this, ProductForm);
              _this.form = _this.querySelector("form");
              _this.form.querySelector("[name=id]").disabled = false;
              _this.form.addEventListener("submit", _this.onSubmitHandler.bind(_this));
              _this.cart = document.querySelector("cart-notification") || document.querySelector("cart-drawer");
              _this.submitButton = _this.querySelector('[type="submit"]');
              if (document.querySelector("cart-drawer")) _this.submitButton.setAttribute("aria-haspopup", "dialog");
              _this.hideErrors = _this.dataset.hideErrors === "true";
              return _this;
            }
            _inherits(ProductForm, _HTMLElement);
            return _createClass(ProductForm, [{
              key: "onSubmitHandler",
              value: function onSubmitHandler(evt) {
                var _this2 = this;
                evt.preventDefault();
                if (this.submitButton.getAttribute("aria-disabled") === "true") return;
                this.handleErrorMessage();
                this.submitButton.setAttribute("aria-disabled", true);
                this.submitButton.classList.add("loading");
                this.querySelector(".submit-title").classList.add("hidden");
                this.querySelector(".loading-overlay__spinner").classList.remove("hidden");
                var config = fetchConfig("javascript");
                config.headers["X-Requested-With"] = "XMLHttpRequest";
                delete config.headers["Content-Type"];
                var formData = new FormData(this.form);
                if (this.cart) {
                  if (typeof this.cart.getSectionsToRender === "function") {
                    formData.append("sections", this.cart.getSectionsToRender().map(function (section) {
                      return section.id;
                    }));
                  } else {
                    formData.append("sections", "");
                  }
                  formData.append("sections_url", window.location.pathname);
                  if (typeof this.cart.setActiveElement === "function") {
                    this.cart.setActiveElement(document.activeElement);
                  }
                }
                config.body = formData;
                fetch("".concat(routes.cart_add_url), config).then(function (response) {
                  return response.json();
                }).then(function (response) {
                  if (response.status) {
                    if (typeof publish === "function") {
                      publish(PUB_SUB_EVENTS.cartError, {
                        source: "product-form",
                        productVariantId: formData.get("id"),
                        errors: response.errors || response.description,
                        message: response.message
                      });
                    }
                    _this2.handleErrorMessage(response.description);
                    var soldOutMessage = _this2.submitButton.querySelector(".sold-out-message");
                    if (!soldOutMessage) return;
                    _this2.submitButton.setAttribute("aria-disabled", true);
                    _this2.submitButton.querySelector("span").classList.add("hidden");
                    soldOutMessage.classList.remove("hidden");
                    _this2.error = true;
                    return;
                  } else if (!_this2.cart) {
                    window.location = window.routes.cart_url;
                    return;
                  }
                  if (!_this2.error && typeof publish === "function") publish(PUB_SUB_EVENTS.cartUpdate, {
                    source: "product-form",
                    productVariantId: formData.get("id"),
                    cartData: response
                  });
                  _this2.error = false;
                  var quickAddModal = _this2.closest("quick-add-modal");
                  if (quickAddModal) {
                    document.body.addEventListener("modalClosed", function () {
                      setTimeout(function () {
                        if (typeof _this2.cart.renderContents === "function") {
                          _this2.cart.renderContents(response);
                        }
                      });
                    }, {
                      once: true
                    });
                    quickAddModal.hide(true);
                  } else {
                    if (typeof _this2.cart.renderContents === "function") {
                      _this2.cart.renderContents(response);
                    }
                  }
                }).catch(function (e) {
                  console.error(e);
                }).finally(function () {
                  _this2.submitButton.classList.remove("loading");
                  if (_this2.cart && _this2.cart.classList.contains("is-empty")) _this2.cart.classList.remove("is-empty");
                  if (!_this2.error) _this2.submitButton.removeAttribute("aria-disabled");
                  _this2.querySelector(".submit-title").classList.remove("hidden");
                  _this2.querySelector(".loading-overlay__spinner").classList.add("hidden");
                  var quantityElement = _this2.form.querySelector("[name=quantity]");
                  if (quantityElement) quantityElement.value = 1;
                });
              }
            }, {
              key: "handleErrorMessage",
              value: function handleErrorMessage() {
                var errorMessage = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
                if (this.hideErrors) return;
                this.errorMessageWrapper = this.errorMessageWrapper || this.querySelector(".product-form__error-message-wrapper");
                if (!this.errorMessageWrapper) return;
                this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector(".product-form__error-message");
                this.errorMessageWrapper.toggleAttribute("hidden", !errorMessage);
                if (errorMessage) {
                  this.errorMessage.textContent = errorMessage;
                }
              }
            }]);
          }(/*#__PURE__*/_wrapNativeSuper(HTMLElement)));
        }

        // Constants and pubsub functions moved to constants.js and pubsub.js
        var QuantityInput = /*#__PURE__*/function (_HTMLElement2) {
          function QuantityInput() {
            var _this3;
            _classCallCheck(this, QuantityInput);
            _this3 = _callSuper(this, QuantityInput);
            _defineProperty(_this3, "quantityUpdateUnsubscriber", undefined);
            _this3.input = _this3.querySelector("input");
            _this3.changeEvent = new Event("change", {
              bubbles: true
            });
            _this3.input.addEventListener("change", _this3.onInputChange.bind(_this3));
            _this3.querySelectorAll("button").forEach(function (button) {
              return button.addEventListener("click", _this3.onButtonClick.bind(_this3));
            });
            return _this3;
          }
          _inherits(QuantityInput, _HTMLElement2);
          return _createClass(QuantityInput, [{
            key: "connectedCallback",
            value: function connectedCallback() {
              this.validateQtyRules();
              this.quantityUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.quantityUpdate, this.validateQtyRules.bind(this));
            }
          }, {
            key: "disconnectedCallback",
            value: function disconnectedCallback() {
              if (this.quantityUpdateUnsubscriber) {
                this.quantityUpdateUnsubscriber();
              }
            }
          }, {
            key: "onInputChange",
            value: function onInputChange(event) {
              this.validateQtyRules();
            }
          }, {
            key: "onButtonClick",
            value: function onButtonClick(event) {
              event.preventDefault();
              var previousValue = this.input.value;
              event.target.name === "plus" ? this.input.stepUp() : this.input.stepDown();
              if (previousValue !== this.input.value) this.input.dispatchEvent(this.changeEvent);
            }
          }, {
            key: "validateQtyRules",
            value: function validateQtyRules() {
              var value = parseInt(this.input.value);
              if (this.input.min) {
                var min = parseInt(this.input.min);
                var buttonMinus = this.querySelector(".quantity__button[name='minus']");
                buttonMinus.classList.toggle("disabled", value <= min);
              }
              if (this.input.max) {
                var max = parseInt(this.input.max);
                var buttonPlus = this.querySelector(".quantity__button[name='plus']");
                buttonPlus.classList.toggle("disabled", value >= max);
              }
            }
          }]);
        }(/*#__PURE__*/_wrapNativeSuper(HTMLElement));
        customElements.define("quantity-input", QuantityInput);

        // debounce function moved to constants.js

        // fetchConfig function moved to constants.js

        if (!customElements.get('product-info')) {
          customElements.define('product-info', /*#__PURE__*/function (_HTMLElement3) {
            function ProductInfo() {
              var _this4;
              _classCallCheck(this, ProductInfo);
              _this4 = _callSuper(this, ProductInfo);
              _defineProperty(_this4, "cartUpdateUnsubscriber", undefined);
              _defineProperty(_this4, "variantChangeUnsubscriber", undefined);
              _this4.input = _this4.querySelector('.quantity__input');
              _this4.currentVariant = _this4.querySelector('.product-variant-id');
              _this4.variantSelects = _this4.querySelector('variant-radios');
              _this4.submitButton = _this4.querySelector('[type="submit"]');
              return _this4;
            }
            _inherits(ProductInfo, _HTMLElement3);
            return _createClass(ProductInfo, [{
              key: "connectedCallback",
              value: function connectedCallback() {
                var _this5 = this;
                if (!this.input) return;
                this.quantityForm = this.querySelector('.product-form__quantity');
                if (!this.quantityForm) return;
                this.setQuantityBoundries();
                if (!this.dataset.originalSection) {
                  this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, this.fetchQuantityRules.bind(this));
                }
                this.variantChangeUnsubscriber = subscribe(PUB_SUB_EVENTS.variantChange, function (event) {
                  var sectionId = _this5.dataset.originalSection ? _this5.dataset.originalSection : _this5.dataset.section;
                  if (event.data.sectionId !== sectionId) return;
                  _this5.updateQuantityRules(event.data.sectionId, event.data.html);
                  _this5.setQuantityBoundries();
                });
              }
            }, {
              key: "disconnectedCallback",
              value: function disconnectedCallback() {
                if (this.cartUpdateUnsubscriber) {
                  this.cartUpdateUnsubscriber();
                }
                if (this.variantChangeUnsubscriber) {
                  this.variantChangeUnsubscriber();
                }
              }
            }, {
              key: "setQuantityBoundries",
              value: function setQuantityBoundries() {
                var data = {
                  cartQuantity: this.input.dataset.cartQuantity ? parseInt(this.input.dataset.cartQuantity) : 0,
                  min: this.input.dataset.min ? parseInt(this.input.dataset.min) : 1,
                  max: this.input.dataset.max ? parseInt(this.input.dataset.max) : null,
                  step: this.input.step ? parseInt(this.input.step) : 1
                };
                var min = data.min;
                var max = data.max === null ? data.max : data.max - data.cartQuantity;
                if (max !== null) min = Math.min(min, max);
                if (data.cartQuantity >= data.min) min = Math.min(min, data.step);
                this.input.min = min;
                this.input.max = max;
                this.input.value = min;
                publish(PUB_SUB_EVENTS.quantityUpdate, undefined);
              }
            }, {
              key: "fetchQuantityRules",
              value: function fetchQuantityRules() {
                var _this6 = this;
                if (!this.currentVariant || !this.currentVariant.value) return;
                this.querySelector('.quantity__rules-cart .loading-overlay').classList.remove('hidden');
                fetch("".concat(this.dataset.url, "?variant=").concat(this.currentVariant.value, "&section_id=").concat(this.dataset.section)).then(function (response) {
                  return response.text();
                }).then(function (responseText) {
                  var html = new DOMParser().parseFromString(responseText, 'text/html');
                  _this6.updateQuantityRules(_this6.dataset.section, html);
                  _this6.setQuantityBoundries();
                }).catch(function (e) {
                  console.error(e);
                }).finally(function () {
                  _this6.querySelector('.quantity__rules-cart .loading-overlay').classList.add('hidden');
                });
              }
            }, {
              key: "updateQuantityRules",
              value: function updateQuantityRules(sectionId, html) {
                var quantityFormUpdated = html.getElementById("Quantity-Form-".concat(sectionId));
                var selectors = ['.quantity__input', '.quantity__rules', '.quantity__label'];
                for (var _i = 0, _selectors = selectors; _i < _selectors.length; _i++) {
                  var selector = _selectors[_i];
                  var current = this.quantityForm.querySelector(selector);
                  var updated = quantityFormUpdated.querySelector(selector);
                  if (!current || !updated) continue;
                  if (selector === '.quantity__input') {
                    var attributes = ['data-cart-quantity', 'data-min', 'data-max', 'step'];
                    for (var _i2 = 0, _attributes = attributes; _i2 < _attributes.length; _i2++) {
                      var attribute = _attributes[_i2];
                      var valueUpdated = updated.getAttribute(attribute);
                      if (valueUpdated !== null) current.setAttribute(attribute, valueUpdated);
                    }
                  } else {
                    current.innerHTML = updated.innerHTML;
                  }
                }
              }
            }]);
          }(/*#__PURE__*/_wrapNativeSuper(HTMLElement)));
        }
        if (!customElements.get('product-modal')) {
          customElements.define('product-modal', /*#__PURE__*/function (_ModalDialog) {
            function ProductModal() {
              _classCallCheck(this, ProductModal);
              return _callSuper(this, ProductModal);
            }
            _inherits(ProductModal, _ModalDialog);
            return _createClass(ProductModal, [{
              key: "hide",
              value: function hide() {
                _superPropGet(ProductModal, "hide", this, 3)([]);
              }
            }, {
              key: "show",
              value: function show(opener) {
                _superPropGet(ProductModal, "show", this, 3)([opener]);
                this.showActiveMedia();
              }
            }, {
              key: "showActiveMedia",
              value: function showActiveMedia() {
                this.querySelectorAll("[data-media-id]:not([data-media-id=\"".concat(this.openedBy.getAttribute("data-media-id"), "\"])")).forEach(function (element) {
                  element.classList.remove('active');
                });
                var activeMedia = this.querySelector("[data-media-id=\"".concat(this.openedBy.getAttribute("data-media-id"), "\"]"));
                var activeMediaTemplate = activeMedia.querySelector('template');
                var activeMediaContent = activeMediaTemplate ? activeMediaTemplate.content : null;
                activeMedia.classList.add('active');
                activeMedia.scrollIntoView();
                var container = this.querySelector('[role="document"]');
                container.scrollLeft = (activeMedia.width - container.clientWidth) / 2;
                if (activeMedia.nodeName == 'DEFERRED-MEDIA' && activeMediaContent && activeMediaContent.querySelector('.js-youtube')) activeMedia.loadContent();
              }
            }]);
          }(ModalDialog));
        }
        if (!customElements.get('product-model')) {
          customElements.define('product-model', /*#__PURE__*/function (_DeferredMedia) {
            function ProductModel() {
              _classCallCheck(this, ProductModel);
              return _callSuper(this, ProductModel);
            }
            _inherits(ProductModel, _DeferredMedia);
            return _createClass(ProductModel, [{
              key: "loadContent",
              value: function loadContent() {
                _superPropGet(ProductModel, "loadContent", this, 3)([]);
                Shopify.loadFeatures([{
                  name: 'model-viewer-ui',
                  version: '1.0',
                  onLoad: this.setupModelViewerUI.bind(this)
                }]);
              }
            }, {
              key: "setupModelViewerUI",
              value: function setupModelViewerUI(errors) {
                if (errors) return;
                this.modelViewerUI = new Shopify.ModelViewerUI(this.querySelector('model-viewer'));
              }
            }]);
          }(DeferredMedia));
        }
        window.ProductModel = {
          loadShopifyXR: function loadShopifyXR() {
            Shopify.loadFeatures([{
              name: 'shopify-xr',
              version: '1.0',
              onLoad: this.setupShopifyXR.bind(this)
            }]);
          },
          setupShopifyXR: function setupShopifyXR(errors) {
            var _this7 = this;
            if (errors) return;
            if (!window.ShopifyXR) {
              document.addEventListener('shopify_xr_initialized', function () {
                return _this7.setupShopifyXR();
              });
              return;
            }
            document.querySelectorAll('[id^="ProductJSON-"]').forEach(function (modelJSON) {
              window.ShopifyXR.addModels(JSON.parse(modelJSON.textContent));
              modelJSON.remove();
            });
            window.ShopifyXR.setupXRElements();
          }
        };
        window.addEventListener('DOMContentLoaded', function () {
          if (window.ProductModel) window.ProductModel.loadShopifyXR();
        });
        if (!customElements.get('quick-add-modal')) {
          customElements.define('quick-add-modal', /*#__PURE__*/function (_ModalDialog2) {
            function QuickAddModal() {
              var _this8;
              _classCallCheck(this, QuickAddModal);
              _this8 = _callSuper(this, QuickAddModal);
              _this8.modalContent = _this8.querySelector('[id^="QuickAddInfo-"]');
              return _this8;
            }
            _inherits(QuickAddModal, _ModalDialog2);
            return _createClass(QuickAddModal, [{
              key: "hide",
              value: function hide() {
                var preventFocus = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
                var cartNotification = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
                if (cartNotification) cartNotification.setActiveElement(this.openedBy);
                this.modalContent.innerHTML = '';
                if (preventFocus) this.openedBy = null;
                _superPropGet(QuickAddModal, "hide", this, 3)([]);
              }
            }, {
              key: "show",
              value: function show(opener) {
                var _this9 = this;
                opener.setAttribute('aria-disabled', true);
                opener.classList.add('loading');
                opener.querySelector('.loading-overlay__spinner').classList.remove('hidden');
                fetch(opener.getAttribute('data-product-url')).then(function (response) {
                  return response.text();
                }).then(function (responseText) {
                  var responseHTML = new DOMParser().parseFromString(responseText, 'text/html');
                  _this9.productElement = responseHTML.querySelector('section[id^="MainProduct-"]');
                  _this9.preventDuplicatedIDs();
                  _this9.removeDOMElements();
                  _this9.setInnerHTML(_this9.modalContent, _this9.productElement.innerHTML);
                  if (window.Shopify && Shopify.PaymentButton) {
                    Shopify.PaymentButton.init();
                  }
                  if (window.ProductModel) window.ProductModel.loadShopifyXR();
                  _this9.removeGalleryListSemantic();
                  _this9.updateImageSizes();
                  _this9.preventVariantURLSwitching();
                  _superPropGet(QuickAddModal, "show", _this9, 3)([opener]);
                }).finally(function () {
                  opener.removeAttribute('aria-disabled');
                  opener.classList.remove('loading');
                  opener.querySelector('.loading-overlay__spinner').classList.add('hidden');
                });
              }
            }, {
              key: "setInnerHTML",
              value: function setInnerHTML(element, html) {
                element.innerHTML = html;

                // Reinjects the script tags to allow execution. By default, scripts are disabled when using element.innerHTML.
                element.querySelectorAll('script').forEach(function (oldScriptTag) {
                  var newScriptTag = document.createElement('script');
                  Array.from(oldScriptTag.attributes).forEach(function (attribute) {
                    newScriptTag.setAttribute(attribute.name, attribute.value);
                  });
                  newScriptTag.appendChild(document.createTextNode(oldScriptTag.innerHTML));
                  oldScriptTag.parentNode.replaceChild(newScriptTag, oldScriptTag);
                });
              }
            }, {
              key: "preventVariantURLSwitching",
              value: function preventVariantURLSwitching() {
                var variantPicker = this.modalContent.querySelector('variant-radios,variant-selects');
                if (!variantPicker) return;
                variantPicker.setAttribute('data-update-url', 'false');
              }
            }, {
              key: "removeDOMElements",
              value: function removeDOMElements() {
                var pickupAvailability = this.productElement.querySelector('pickup-availability');
                if (pickupAvailability) pickupAvailability.remove();
                var productModal = this.productElement.querySelector('product-modal');
                if (productModal) productModal.remove();
                var modalDialog = this.productElement.querySelectorAll('modal-dialog');
                if (modalDialog) modalDialog.forEach(function (modal) {
                  return modal.remove();
                });
              }
            }, {
              key: "preventDuplicatedIDs",
              value: function preventDuplicatedIDs() {
                var sectionId = this.productElement.dataset.section;
                this.productElement.innerHTML = this.productElement.innerHTML.replaceAll(sectionId, "quickadd-".concat(sectionId));
                this.productElement.querySelectorAll('variant-selects, variant-radios, product-info').forEach(function (element) {
                  element.dataset.originalSection = sectionId;
                });
              }
            }, {
              key: "removeGalleryListSemantic",
              value: function removeGalleryListSemantic() {
                var galleryList = this.modalContent.querySelector('[id^="Slider-Gallery"]');
                if (!galleryList) return;
                galleryList.setAttribute('role', 'presentation');
                galleryList.querySelectorAll('[id^="Slide-"]').forEach(function (li) {
                  return li.setAttribute('role', 'presentation');
                });
              }
            }, {
              key: "updateImageSizes",
              value: function updateImageSizes() {
                var product = this.modalContent.querySelector('.product');
                var desktopColumns = product.classList.contains('product--columns');
                if (!desktopColumns) return;
                var mediaImages = product.querySelectorAll('.product__media img');
                if (!mediaImages.length) return;
                var mediaImageSizes = '(min-width: 1000px) 715px, (min-width: 750px) calc((100vw - 11.5rem) / 2), calc(100vw - 4rem)';
                if (product.classList.contains('product--medium')) {
                  mediaImageSizes = mediaImageSizes.replace('715px', '605px');
                } else if (product.classList.contains('product--small')) {
                  mediaImageSizes = mediaImageSizes.replace('715px', '495px');
                }
                mediaImages.forEach(function (img) {
                  return img.setAttribute('sizes', mediaImageSizes);
                });
              }
            }]);
          }(ModalDialog));
        }
        if (!customElements.get('pickup-availability')) {
          customElements.define('pickup-availability', /*#__PURE__*/function (_HTMLElement4) {
            function PickupAvailability() {
              var _this0;
              _classCallCheck(this, PickupAvailability);
              _this0 = _callSuper(this, PickupAvailability);
              if (!_this0.hasAttribute('available')) return _possibleConstructorReturn(_this0);
              _this0.errorHtml = _this0.querySelector('template').content.firstElementChild.cloneNode(true);
              _this0.onClickRefreshList = _this0.onClickRefreshList.bind(_this0);
              _this0.fetchAvailability(_this0.dataset.variantId);
              return _this0;
            }
            _inherits(PickupAvailability, _HTMLElement4);
            return _createClass(PickupAvailability, [{
              key: "fetchAvailability",
              value: function fetchAvailability(variantId) {
                var _this1 = this;
                var rootUrl = this.dataset.rootUrl;
                if (!rootUrl.endsWith("/")) {
                  rootUrl = rootUrl + "/";
                }
                var variantSectionUrl = "".concat(rootUrl, "variants/").concat(variantId, "/?section_id=pickup-availability");
                fetch(variantSectionUrl).then(function (response) {
                  return response.text();
                }).then(function (text) {
                  var sectionInnerHTML = new DOMParser().parseFromString(text, 'text/html').querySelector('.shopify-section');
                  _this1.renderPreview(sectionInnerHTML);
                }).catch(function (e) {
                  var button = _this1.querySelector('button');
                  if (button) button.removeEventListener('click', _this1.onClickRefreshList);
                  _this1.renderError();
                });
              }
            }, {
              key: "onClickRefreshList",
              value: function onClickRefreshList(evt) {
                this.fetchAvailability(this.dataset.variantId);
              }
            }, {
              key: "renderError",
              value: function renderError() {
                this.innerHTML = '';
                this.appendChild(this.errorHtml);
                this.querySelector('button').addEventListener('click', this.onClickRefreshList);
              }
            }, {
              key: "renderPreview",
              value: function renderPreview(sectionInnerHTML) {
                var drawer = document.querySelector('pickup-availability-drawer');
                if (drawer) drawer.remove();
                if (!sectionInnerHTML.querySelector('pickup-availability-preview')) {
                  this.innerHTML = "";
                  this.removeAttribute('available');
                  return;
                }
                this.innerHTML = sectionInnerHTML.querySelector('pickup-availability-preview').outerHTML;
                this.setAttribute('available', '');
                document.body.appendChild(sectionInnerHTML.querySelector('pickup-availability-drawer'));
                var button = this.querySelector('button');
                if (button) button.addEventListener('click', function (evt) {
                  document.querySelector('pickup-availability-drawer').show(evt.target);
                });
              }
            }]);
          }(/*#__PURE__*/_wrapNativeSuper(HTMLElement)));
        }
        if (!customElements.get('pickup-availability-drawer')) {
          customElements.define('pickup-availability-drawer', /*#__PURE__*/function (_HTMLElement5) {
            function PickupAvailabilityDrawer() {
              var _this10;
              _classCallCheck(this, PickupAvailabilityDrawer);
              _this10 = _callSuper(this, PickupAvailabilityDrawer);
              _this10.onBodyClick = _this10.handleBodyClick.bind(_this10);
              _this10.querySelector('button').addEventListener('click', function () {
                _this10.hide();
              });
              _this10.addEventListener('keyup', function (event) {
                if (event.code.toUpperCase() === 'ESCAPE') _this10.hide();
              });
              return _this10;
            }
            _inherits(PickupAvailabilityDrawer, _HTMLElement5);
            return _createClass(PickupAvailabilityDrawer, [{
              key: "handleBodyClick",
              value: function handleBodyClick(evt) {
                var target = evt.target;
                if (target != this && !target.closest('pickup-availability-drawer') && target.id != 'ShowPickupAvailabilityDrawer') {
                  this.hide();
                }
              }
            }, {
              key: "hide",
              value: function hide() {
                this.removeAttribute('open');
                document.body.removeEventListener('click', this.onBodyClick);
                document.body.classList.remove('overflow-hidden');
                removeTrapFocus(this.focusElement);
              }
            }, {
              key: "show",
              value: function show(focusElement) {
                this.focusElement = focusElement;
                this.setAttribute('open', '');
                document.body.addEventListener('click', this.onBodyClick);
                document.body.classList.add('overflow-hidden');
                trapFocus(this);
              }
            }]);
          }(/*#__PURE__*/_wrapNativeSuper(HTMLElement)));
        }
        var CartCache = {
          data: null,
          lastFetched: 0,
          maxAge: 2e3,
          // 2 seconds
          getCart: function getCart() {
            var _arguments = arguments,
              _this11 = this;
            return _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
              var forceRefresh, now, res, _t;
              return _regenerator().w(function (_context) {
                while (1) switch (_context.n) {
                  case 0:
                    forceRefresh = _arguments.length > 0 && _arguments[0] !== undefined ? _arguments[0] : false;
                    now = Date.now();
                    if (!(!forceRefresh && _this11.data && now - _this11.lastFetched < _this11.maxAge)) {
                      _context.n = 1;
                      break;
                    }
                    return _context.a(2, _this11.data);
                  case 1:
                    _context.p = 1;
                    _context.n = 2;
                    return fetch("/cart.js?t=" + now, {
                      cache: "no-store",
                      headers: {
                        "Cache-Control": "no-cache",
                        Pragma: "no-cache"
                      }
                    });
                  case 2:
                    res = _context.v;
                    if (res.ok) {
                      _context.n = 3;
                      break;
                    }
                    throw new Error("Failed to fetch cart");
                  case 3:
                    _context.n = 4;
                    return res.json();
                  case 4:
                    _this11.data = _context.v;
                    _this11.lastFetched = now;
                    return _context.a(2, _this11.data);
                  case 5:
                    _context.p = 5;
                    _t = _context.v;
                    console.error("Error fetching cart:", _t);
                    throw _t;
                  case 6:
                    return _context.a(2);
                }
              }, _callee, null, [[1, 5]]);
            }))();
          },
          invalidate: function invalidate() {
            this.data = null;
            this.lastFetched = 0;
          }
        };
        var DOMUtils = {
          updateProperty: function updateProperty(element, property, newValue) {
            if (!element) return false;
            if (element[property] !== newValue) {
              element[property] = newValue;
              return true;
            }
            return false;
          },
          updateAttribute: function updateAttribute(element, attribute, newValue) {
            if (!element) return false;
            var currentValue = element.getAttribute(attribute);
            if (currentValue !== newValue) {
              element.setAttribute(attribute, newValue);
              return true;
            }
            return false;
          },
          toggleClass: function toggleClass(element, className, shouldHave) {
            if (!element) return false;
            var hasClass = element.classList.contains(className);
            if (shouldHave && !hasClass) {
              element.classList.add(className);
              return true;
            } else if (!shouldHave && hasClass) {
              element.classList.remove(className);
              return true;
            }
            return false;
          },
          updateStyle: function updateStyle(element, property, newValue) {
            if (!element) return false;
            if (element.style[property] !== newValue) {
              element.style[property] = newValue;
              return true;
            }
            return false;
          },
          createElement: function createElement(tagName) {
            var properties = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
            var parent = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
            var element = document.createElement(tagName);
            Object.entries(properties).forEach(function (_ref) {
              var _ref2 = _slicedToArray(_ref, 2),
                key = _ref2[0],
                value = _ref2[1];
              if (key === "className") {
                element.className = value;
              } else if (key === "innerHTML") {
                element.innerHTML = value;
              } else if (key === "textContent") {
                element.textContent = value;
              } else if (key === "style" && _typeof(value) === "object") {
                Object.entries(value).forEach(function (_ref3) {
                  var _ref4 = _slicedToArray(_ref3, 2),
                    prop = _ref4[0],
                    val = _ref4[1];
                  element.style[prop] = val;
                });
              } else if (key.startsWith("data-")) {
                element.setAttribute(key, value);
              } else if (key.startsWith("on") && typeof value === "function") {
                var eventName = key.substring(2).toLowerCase();
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
        function showNotification(msg) {
          var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "error";
          var note = document.createElement("div");
          note.className = "\n\t\tcart-notification ".concat(type, "\n\t\tfixed bottom-4 left-1/2 transform -translate-x-1/2\n\t\tp-4 rounded-lg shadow-lg z-[2147483640]\n\t\ttransition-opacity duration-300\n\t").replace(/\s+/g, " ");
          if (type === "error") {
            note.classList.add("bg-red-100", "border", "border-red-400", "text-red-700");
          } else {
            note.classList.add("bg-green-100", "border", "border-green-400", "text-green-700");
          }
          note.innerHTML = "\n\t\t<div class=\"flex items-center\">\n\t\t\t<div class=\"mr-3\">".concat(type === "error" ? "⚠️" : "✅", "</div>\n\t\t\t<div class=\"text-sm font-medium\">").concat(msg, "</div>\n\t\t\t<button\n\t\t\t\tclass=\"hover:text-gray-500 ml-auto text-gray-400\"\n\t\t\t\tonclick=\"this.parentElement.parentElement.remove()\"\n\t\t\t>\n\t\t\t\t\u2715\n\t\t\t</button>\n\t\t</div>\n\t");
          document.body.appendChild(note);
          setTimeout(function () {
            note.classList.add("opacity-0");
            setTimeout(function () {
              return note.remove();
            }, 300);
          }, 5e3);
        }
        function parseErrorMessage(error) {
          var _error$message, _error$message2, _error$message3, _error$message4;
          var context = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
          console.error("Error in ".concat(context, ":"), {
            message: error.message,
            response: error.response,
            stack: error.stack,
            originalError: error
          });
          if (error.response && _typeof(error.response) === "object") {
            if (error.response.description) return error.response.description;
            if (error.response.message) return error.response.message;
          }
          if ((_error$message = error.message) !== null && _error$message !== void 0 && _error$message.includes("network")) return "Network connection issue. Please check your internet connection and try again.";
          if ((_error$message2 = error.message) !== null && _error$message2 !== void 0 && _error$message2.includes("timeout")) return "Request timed out. Please try again.";
          if ((_error$message3 = error.message) !== null && _error$message3 !== void 0 && _error$message3.includes("sold out")) return "This product is currently sold out. Please try again later.";
          if ((_error$message4 = error.message) !== null && _error$message4 !== void 0 && _error$message4.includes("variant")) return "There was an issue with the selected option. Please try selecting a different option.";
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
        function getCart() {
          return _getCart.apply(this, arguments);
        }
        function _getCart() {
          _getCart = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6() {
            var forceRefresh,
              _args6 = arguments,
              _t7;
            return _regenerator().w(function (_context6) {
              while (1) switch (_context6.n) {
                case 0:
                  forceRefresh = _args6.length > 0 && _args6[0] !== undefined ? _args6[0] : false;
                  _context6.p = 1;
                  _context6.n = 2;
                  return CartCache.getCart(forceRefresh);
                case 2:
                  return _context6.a(2, _context6.v);
                case 3:
                  _context6.p = 3;
                  _t7 = _context6.v;
                  console.error("Error in getCart:", _t7);
                  throw new Error("Unable to access your cart");
                case 4:
                  return _context6.a(2);
              }
            }, _callee6, null, [[1, 3]]);
          }));
          return _getCart.apply(this, arguments);
        }
        function clearCart() {
          return _clearCart.apply(this, arguments);
        }
        function _clearCart() {
          _clearCart = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7() {
            var res, errorData, _t8;
            return _regenerator().w(function (_context7) {
              while (1) switch (_context7.n) {
                case 0:
                  _context7.p = 0;
                  _context7.n = 1;
                  return fetch("/cart/clear.js", {
                    method: "POST",
                    cache: "no-store",
                    headers: {
                      "Cache-Control": "no-cache",
                      Pragma: "no-cache"
                    }
                  });
                case 1:
                  res = _context7.v;
                  if (res.ok) {
                    _context7.n = 3;
                    break;
                  }
                  _context7.n = 2;
                  return res.json();
                case 2:
                  errorData = _context7.v;
                  throw Object.assign(new Error("Failed to clear cart"), {
                    response: errorData
                  });
                case 3:
                  CartCache.invalidate();
                  return _context7.a(2, res.json());
                case 4:
                  _context7.p = 4;
                  _t8 = _context7.v;
                  console.error("Error clearing cart:", _t8);
                  throw _t8;
                case 5:
                  return _context7.a(2);
              }
            }, _callee7, null, [[0, 4]]);
          }));
          return _clearCart.apply(this, arguments);
        }
        function extractFrequency(planName) {
          if (!planName) return {
            value: 1,
            unit: "month"
          };
          var daysMatch = planName.match(/(\d+)\s*Day/i);
          if (daysMatch) {
            return {
              value: parseInt(daysMatch[1], 10),
              unit: "day"
            };
          }
          var weeksMatch = planName.match(/(\d+)\s*Week/i);
          if (weeksMatch) {
            return {
              value: parseInt(weeksMatch[1], 10),
              unit: "week"
            };
          }
          var monthsMatch = planName.match(/(\d+)\s*Month/i);
          if (monthsMatch) {
            return {
              value: parseInt(monthsMatch[1], 10),
              unit: "month"
            };
          }
          return {
            value: 1,
            unit: "month"
          };
        }
        var BuyBoxNewInstances = /* @__PURE__ */new Map();
        var BuyBoxNew = /*#__PURE__*/function () {
          function BuyBoxNew(container, config) {
            _classCallCheck(this, BuyBoxNew);
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
          return _createClass(BuyBoxNew, [{
            key: "bindElements",
            value: function bindElements() {
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
          }, {
            key: "storeInitialProductData",
            value: function storeInitialProductData() {
              var _window$productData$p;
              if (!window.productData) window.productData = {};
              var productIdFromData = this.container.dataset.productId;
              if (!productIdFromData) {
                return;
              }
              this.state.productId = productIdFromData;
              if ((_window$productData$p = window.productData[productIdFromData]) !== null && _window$productData$p !== void 0 && _window$productData$p.initialized) {
                this.config.product = window.productData[productIdFromData];
              } else {
                if (!window.productData[productIdFromData]) {
                  window.productData[productIdFromData] = {
                    id: productIdFromData,
                    variants: [],
                    initialized: false
                  };
                }
              }
            }
          }, {
            key: "setState",
            value: function setState(updates) {
              var previousState = _objectSpread({}, this.state);
              Object.assign(this.state, updates);
              this.updateUI(updates, previousState);
            }
          }, {
            key: "updateUI",
            value: function updateUI(changes, previousState) {
              if ("isLoading" in changes) this.updateLoadingState(this.state.isLoading);
              if ("selectedBox" in changes && this.state.selectedBox !== previousState.selectedBox) {
                this.updateSelectedBoxUI(this.state.selectedBox);
              }
              if ("selectedFrequency" in changes || "sellingPlanId" in changes) {
                this.updateFrequencyUI();
              }
            }
          }, {
            key: "updateSelectedBoxUI",
            value: function updateSelectedBoxUI(boxElement) {
              if (!boxElement || !this.elements.productActions) return;
              var isSub = boxElement.dataset.purchaseType === "subscribe";
              var variantId = boxElement.dataset.variant;
              var planId = isSub ? boxElement.dataset.subscriptionSellingPlanId : null;
              if (this.elements.submitSellingPlanId) this.elements.submitSellingPlanId.value = planId || "";
              if (this.elements.submitVariantId) this.elements.submitVariantId.value = variantId || "";
              if (this.elements.sellingPlanInput) {
                this.elements.sellingPlanInput.value = planId || "";
              }
              this.setState({
                sellingPlanId: planId,
                variantId: variantId,
                purchaseType: boxElement.dataset.purchaseType,
                productId: boxElement.dataset.product
              });
              this.elements.purchaseOptionBoxes.forEach(function (box) {
                var isSelected = box === boxElement;
                box.setAttribute("aria-selected", isSelected ? "true" : "false");
                var radio = box.querySelector('input[type="radio"]');
                if (radio) DOMUtils.updateProperty(radio, "checked", isSelected);
              });
              this.updateBuyButtonTracking(boxElement);
              this.updatePriceDisplay(boxElement);
              this.handleFrequencySelectorVisibility(isSub, boxElement);
              if (this.config.isSlideVariant) {
                this.updateVariantImage(boxElement);
              }
            }
          }, {
            key: "updateFrequencyUI",
            value: function updateFrequencyUI() {
              var _this$elements$freque;
              var sellingPlanId = this.state.sellingPlanId;
              if (!sellingPlanId) return;
              var uiType = ((_this$elements$freque = this.elements.frequencyContainer) === null || _this$elements$freque === void 0 ? void 0 : _this$elements$freque.dataset.uiType) || "tabs";
              if (uiType === "tabs" && this.elements.frequencyOptions) {
                this.elements.frequencyOptions.querySelectorAll("div[data-selling-plan-id]").forEach(function (box) {
                  var boxId = box.getAttribute("data-selling-plan-id");
                  var isSelected = boxId === sellingPlanId;
                  box.setAttribute("aria-selected", isSelected ? "true" : "false");
                });
              } else if (uiType === "dropdown" && this.elements.frequencyDropdown) {
                if (this.elements.frequencyDropdown.value !== sellingPlanId) {
                  this.elements.frequencyDropdown.value = sellingPlanId;
                }
              }
              this.updateFrequencyDescription();
            }
          }, {
            key: "updateLoadingState",
            value: function updateLoadingState(isLoading) {
              var loadingButton = this.state.loadingButton;
              if (this.elements.submitButton) {
                var isSubmitLoading = isLoading && loadingButton === "submit";
                this.elements.submitButton.setAttribute("aria-busy", isSubmitLoading ? "true" : "false");
                this.elements.submitButton.disabled = isSubmitLoading;
                if (isSubmitLoading) {
                  this.elements.submitButton.innerHTML = "<div class=\"border-white/20 border-t-white animate-spin inline-block w-6 h-6 mx-auto border-2 rounded-full\"></div>";
                } else {
                  this.elements.submitButton.innerHTML = this.elements.submitButton.getAttribute("data-original-text") || "Add To Cart";
                }
              }
              if (this.elements.oneTimeButton) {
                var isOneTimeLoading = isLoading && loadingButton === "oneTime";
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
          }, {
            key: "handleFrequencySelectorVisibility",
            value: function handleFrequencySelectorVisibility(isSubscription, selectedBoxElement) {
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
          }, {
            key: "initState",
            value: function initState() {
              var _this$elements$purcha,
                _this12 = this;
              if (!this.elements.productActions || !((_this$elements$purcha = this.elements.purchaseOptionBoxes) !== null && _this$elements$purcha !== void 0 && _this$elements$purcha.length) > 0) {
                return;
              }
              var defaultIdx = parseInt(this.elements.productActions.dataset.defaultVariantIndex, 10) || 0;
              var defaultBox = null;
              if (defaultIdx > 0 && this.elements.purchaseOptionBoxes.length >= defaultIdx) {
                defaultBox = this.elements.purchaseOptionBoxes[defaultIdx - 1];
              }
              if (!defaultBox) {
                defaultBox = Array.from(this.elements.purchaseOptionBoxes).find(function (box) {
                  return box.dataset.purchaseType === "subscribe";
                }) || this.elements.purchaseOptionBoxes[0];
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
              setTimeout(function () {
                return _this12.setState({
                  isInitialLoad: false
                });
              }, 100);
            }
          }, {
            key: "attachEventListeners",
            value: function attachEventListeners() {
              var _this13 = this;
              if (!this.elements.productActions) {
                return;
              }
              this.elements.productActions.addEventListener("click", function (e) {
                var box = e.target.closest(".variant-boxes .variant-box");
                if (box && box.getAttribute("aria-selected") !== "true") {
                  e.preventDefault();
                  _this13.setState({
                    selectedBox: box
                  });
                }
              });
              this.elements.productActions.addEventListener("keydown", function (e) {
                if (e.key !== "Enter" && e.key !== " ") return;
                var box = e.target.closest(".variant-boxes .variant-box");
                if (box && box.getAttribute("aria-selected") !== "true") {
                  e.preventDefault();
                  _this13.setState({
                    selectedBox: box
                  });
                }
              });
              if (this.elements.frequencyOptions) {
                this.elements.frequencyOptions.addEventListener("click", function (e) {
                  var option = e.target.closest(".frequency-box[data-selling-plan-id]");
                  if (option) {
                    _this13.selectFrequencyOption(option);
                  }
                });
                this.elements.frequencyOptions.addEventListener("keydown", function (e) {
                  if (e.key !== "Enter" && e.key !== " ") return;
                  var option = e.target.closest(".frequency-box[data-selling-plan-id]");
                  if (option) {
                    e.preventDefault();
                    _this13.selectFrequencyOption(option);
                  }
                });
              }
              if (this.elements.frequencyDropdown) {
                this.elements.frequencyDropdown.addEventListener("change", function (e) {
                  _this13.selectFrequencyOption(e.target.options[e.target.selectedIndex]);
                  e.target.blur();
                });
              }
              if (this.elements.submitButton) {
                this.elements.submitButton.addEventListener("click", /*#__PURE__*/function () {
                  var _ref5 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(e) {
                    var items, _t2;
                    return _regenerator().w(function (_context2) {
                      while (1) switch (_context2.n) {
                        case 0:
                          e.preventDefault();
                          if (!(_this13.state.isLoading || _this13.state.isRedirectingToCheckout)) {
                            _context2.n = 1;
                            break;
                          }
                          return _context2.a(2);
                        case 1:
                          _this13.setState({
                            isLoading: true,
                            loadingButton: "submit"
                          });
                          _context2.p = 2;
                          items = _this13.prepareItemsForCart();
                          if (items) {
                            _context2.n = 3;
                            break;
                          }
                          _this13.setState({
                            isLoading: false,
                            loadingButton: null
                          });
                          return _context2.a(2);
                        case 3:
                          if (!(_this13.config.buyType === "buy_now")) {
                            _context2.n = 5;
                            break;
                          }
                          _context2.n = 4;
                          return _this13.handleBuyNowFlow(items);
                        case 4:
                          _context2.n = 7;
                          break;
                        case 5:
                          _context2.n = 6;
                          return _this13.addValidItemsToCart(items);
                        case 6:
                          _this13.setState({
                            isLoading: false,
                            loadingButton: null
                          });
                        case 7:
                          _context2.n = 9;
                          break;
                        case 8:
                          _context2.p = 8;
                          _t2 = _context2.v;
                          console.error("Submit error:", _t2);
                          showNotification(parseErrorMessage(_t2, "checkout"), "error");
                          _this13.setState({
                            isLoading: false,
                            loadingButton: null
                          });
                        case 9:
                          return _context2.a(2);
                      }
                    }, _callee2, null, [[2, 8]]);
                  }));
                  return function (_x) {
                    return _ref5.apply(this, arguments);
                  };
                }());
              }
              if (this.elements.oneTimeButton) {
                this.elements.oneTimeButton.addEventListener("click", /*#__PURE__*/function () {
                  var _ref6 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3(e) {
                    var variantId, items, _this13$elements$prod, selectedGift, giftItem, _t3;
                    return _regenerator().w(function (_context3) {
                      while (1) switch (_context3.n) {
                        case 0:
                          e.preventDefault();
                          if (!(_this13.state.isLoading || _this13.state.isRedirectingToCheckout)) {
                            _context3.n = 1;
                            break;
                          }
                          return _context3.a(2);
                        case 1:
                          _this13.setState({
                            isLoading: true,
                            loadingButton: "oneTime"
                          });
                          _context3.p = 2;
                          variantId = _this13.elements.oneTimeButton.dataset.variantId;
                          if (variantId) {
                            _context3.n = 3;
                            break;
                          }
                          throw new Error("Invalid variant ID for one-time purchase");
                        case 3:
                          items = [{
                            id: parseInt(variantId, 10),
                            quantity: 1
                          }];
                          if (_this13.config.isOneTimeGift) {
                            selectedGift = _this13.getSelectedGiftId(false);
                            if (selectedGift && selectedGift.id) {
                              giftItem = {
                                id: parseInt(selectedGift.id, 10),
                                quantity: 1,
                                properties: {
                                  _gift: "true"
                                }
                              };
                              if (selectedGift.selling_plan_id) {
                                giftItem.selling_plan = selectedGift.selling_plan_id;
                                console.log("Adding one-time gift with selling plan: ".concat(selectedGift.selling_plan_id));
                              }
                              items.push(giftItem);
                            } else if (((_this13$elements$prod = _this13.elements.productActions) === null || _this13$elements$prod === void 0 ? void 0 : _this13$elements$prod.dataset.giftsAmount) > 0) {}
                          }
                          if (!(_this13.config.buyType === "buy_now")) {
                            _context3.n = 5;
                            break;
                          }
                          _context3.n = 4;
                          return _this13.handleBuyNowFlow(items);
                        case 4:
                          _context3.n = 7;
                          break;
                        case 5:
                          _context3.n = 6;
                          return _this13.addValidItemsToCart(items);
                        case 6:
                          _this13.elements.oneTimeButton.innerHTML = "✓ Added!";
                          _this13.elements.oneTimeButton.classList.add("text-green-700", "border-green-700");
                          _this13.elements.oneTimeButton.classList.remove("text-red-600", "border-red-600");
                          setTimeout(function () {
                            _this13.setState({
                              isLoading: false,
                              loadingButton: null
                            });
                            _this13.elements.oneTimeButton.classList.remove("text-green-700", "border-green-700");
                          }, 2e3);
                        case 7:
                          _context3.n = 9;
                          break;
                        case 8:
                          _context3.p = 8;
                          _t3 = _context3.v;
                          console.error("One-time add error:", _t3);
                          showNotification(parseErrorMessage(_t3, "cart-add"), "error");
                          _this13.elements.oneTimeButton.innerHTML = "⚠ Failed";
                          _this13.elements.oneTimeButton.classList.add("text-red-600", "border-red-600");
                          _this13.elements.oneTimeButton.classList.remove("text-green-700", "border-green-700");
                          setTimeout(function () {
                            _this13.setState({
                              isLoading: false,
                              loadingButton: null
                            });
                            _this13.elements.oneTimeButton.classList.remove("text-red-600", "border-red-600");
                          }, 2e3);
                        case 9:
                          return _context3.a(2);
                      }
                    }, _callee3, null, [[2, 8]]);
                  }));
                  return function (_x2) {
                    return _ref6.apply(this, arguments);
                  };
                }());
              }
              document.addEventListener("visibilitychange", function () {
                if (document.visibilityState === "visible") {
                  setTimeout(function () {
                    if (_this13.state.selectedBox && _this13.state.purchaseType === "subscribe") {
                      _this13.handleFrequencySelectorVisibility(true, _this13.state.selectedBox);
                    }
                  }, 100);
                }
              });
              window.addEventListener("pageshow", function (event) {
                if (event.persisted) {
                  if (_this13.state.selectedBox) {
                    _this13.updateSelectedBoxUI(_this13.state.selectedBox);
                  }
                }
              });
            }
          }, {
            key: "prepareItemsForCart",
            value: function prepareItemsForCart() {
              var _this$elements$produc;
              var selectedBox = this.state.selectedBox;
              if (!selectedBox) {
                showNotification("Please select a purchase option");
                return null;
              }
              var variantId = this.state.variantId;
              var isSub = this.state.purchaseType === "subscribe";
              var sellingPlanId = isSub ? this.state.sellingPlanId : null;
              if (!variantId) {
                showNotification("Invalid product option selected");
                return null;
              }
              if (isSub && !sellingPlanId) {
                var _variantData$selling_;
                var variantData = this.findVariantInProductData(variantId);
                if ((variantData === null || variantData === void 0 || (_variantData$selling_ = variantData.selling_plan_allocations) === null || _variantData$selling_ === void 0 ? void 0 : _variantData$selling_.length) > 0) {
                  this.state.sellingPlanId = variantData.selling_plan_allocations[0].selling_plan.id;
                } else {
                  showNotification("Please select a subscription frequency");
                  return null;
                }
              }
              var items = [_objectSpread({
                id: parseInt(variantId, 10),
                quantity: 1
              }, isSub && this.state.sellingPlanId ? {
                selling_plan: this.state.sellingPlanId
              } : {})];
              var giftsAmount = parseInt(((_this$elements$produc = this.elements.productActions) === null || _this$elements$produc === void 0 ? void 0 : _this$elements$produc.dataset.giftsAmount) || "0", 10);
              if (giftsAmount > 0) {
                var selectedGift = this.getSelectedGiftId(isSub);
                if (!selectedGift || !selectedGift.id) {
                  showNotification("Please select your free gift");
                  return null;
                }
                var giftItem = {
                  id: parseInt(selectedGift.id, 10),
                  quantity: 1,
                  properties: {
                    _gift: "true"
                  }
                };
                if (selectedGift.selling_plan_id) {
                  giftItem.selling_plan = selectedGift.selling_plan_id;
                  console.log("Adding gift with selling plan: ".concat(selectedGift.selling_plan_id));
                }
                items.push(giftItem);
              }
              return items;
            }
          }, {
            key: "getSelectedGiftId",
            value: function getSelectedGiftId(isSubscription) {
              if (!this.elements.giftContainer) {
                return null;
              }
              var selectedGiftBox = this.elements.giftContainer.querySelector(".gift-box.selected");
              if (!selectedGiftBox) {
                return null;
              }
              var selectedGiftOption = selectedGiftBox.querySelector(".gift-option-border");
              if (!selectedGiftOption) {
                return null;
              }
              var giftId = isSubscription ? selectedGiftOption.dataset.giftIdSubscription : selectedGiftOption.dataset.giftId;
              var sellingPlanId = isSubscription ? selectedGiftOption.dataset.giftSellingPlanIdSubscription : selectedGiftOption.dataset.giftSellingPlanId;
              return {
                id: giftId,
                selling_plan_id: sellingPlanId ? parseInt(sellingPlanId, 10) : null
              };
            }
          }, {
            key: "handleBuyNowFlow",
            value: function () {
              var _handleBuyNowFlow = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(items) {
                var cartPopup, addRes, errorData, cartData, _t4, _t5;
                return _regenerator().w(function (_context4) {
                  while (1) switch (_context4.n) {
                    case 0:
                      _context4.p = 0;
                      this.setState({
                        isRedirectingToCheckout: true
                      });
                      cartPopup = document.getElementById("upCart");
                      if (cartPopup) cartPopup.remove();
                      _context4.n = 1;
                      return clearCart();
                    case 1:
                      _context4.n = 2;
                      return fetch("/cart/add.js", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                          items: items
                        }),
                        cache: "no-store"
                      });
                    case 2:
                      addRes = _context4.v;
                      if (addRes.ok) {
                        _context4.n = 4;
                        break;
                      }
                      _context4.n = 3;
                      return addRes.json();
                    case 3:
                      errorData = _context4.v;
                      throw Object.assign(new Error("Failed to add items for buy now"), {
                        response: errorData
                      });
                    case 4:
                      CartCache.invalidate();
                      _context4.p = 5;
                      _context4.n = 6;
                      return getCart(true);
                    case 6:
                      cartData = _context4.v;
                      console.log("=== CHECKOUT DEBUG INFO ===");
                      console.log("Cart Items:", cartData.items);
                      console.log("Item Count:", cartData.item_count);
                      console.log("Total Price:", cartData.total_price);
                      console.log("Items Detail:");
                      cartData.items.forEach(function (item, index) {
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
                      _context4.n = 8;
                      break;
                    case 7:
                      _context4.p = 7;
                      _t4 = _context4.v;
                      console.warn("Failed to log checkout debug info:", _t4);
                    case 8:
                      this.setState({
                        isRedirectingToCheckout: false,
                        isLoading: false,
                        loadingButton: null
                      });
                      setTimeout(function () {
                        window.location.href = "/checkout";
                      }, 50);
                      _context4.n = 10;
                      break;
                    case 9:
                      _context4.p = 9;
                      _t5 = _context4.v;
                      console.error("handleBuyNowFlow error:", _t5);
                      this.setState({
                        isRedirectingToCheckout: false,
                        isLoading: false,
                        loadingButton: null
                      });
                      throw _t5;
                    case 10:
                      return _context4.a(2);
                  }
                }, _callee4, this, [[5, 7], [0, 9]]);
              }));
              function handleBuyNowFlow(_x3) {
                return _handleBuyNowFlow.apply(this, arguments);
              }
              return handleBuyNowFlow;
            }()
          }, {
            key: "addValidItemsToCart",
            value: function () {
              var _addValidItemsToCart = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5(items) {
                var subItemToAdd, cart, variantIdToAdd, itemsToRemove, res, errorData, _t6;
                return _regenerator().w(function (_context5) {
                  while (1) switch (_context5.n) {
                    case 0:
                      _context5.p = 0;
                      subItemToAdd = items.find(function (i) {
                        return i.selling_plan;
                      });
                      if (!subItemToAdd) {
                        _context5.n = 3;
                        break;
                      }
                      _context5.n = 1;
                      return getCart(true);
                    case 1:
                      cart = _context5.v;
                      variantIdToAdd = subItemToAdd.id;
                      itemsToRemove = {};
                      cart.items.forEach(function (item) {
                        if (item.selling_plan_allocation && item.variant_id === variantIdToAdd) {
                          itemsToRemove[item.key] = 0;
                        }
                      });
                      if (!(Object.keys(itemsToRemove).length > 0)) {
                        _context5.n = 3;
                        break;
                      }
                      _context5.n = 2;
                      return fetch("/cart/update.js", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "Cache-Control": "no-cache"
                        },
                        cache: "no-store",
                        body: JSON.stringify({
                          updates: itemsToRemove
                        })
                      });
                    case 2:
                      CartCache.invalidate();
                    case 3:
                      _context5.n = 4;
                      return fetch("/cart/add.js", {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "Cache-Control": "no-cache"
                        },
                        cache: "no-store",
                        body: JSON.stringify({
                          items: items
                        })
                      });
                    case 4:
                      res = _context5.v;
                      if (res.ok) {
                        _context5.n = 6;
                        break;
                      }
                      _context5.n = 5;
                      return res.json();
                    case 5:
                      errorData = _context5.v;
                      throw Object.assign(new Error("Failed to add items to cart"), {
                        response: errorData
                      });
                    case 6:
                      CartCache.invalidate();
                      if (typeof window.updateCart === "function") window.updateCart();
                      showNotification("Items added to cart!", "success");
                      return _context5.a(2, res.json());
                    case 7:
                      _context5.p = 7;
                      _t6 = _context5.v;
                      console.error("Error in addValidItemsToCart:", _t6);
                      throw _t6;
                    case 8:
                      return _context5.a(2);
                  }
                }, _callee5, null, [[0, 7]]);
              }));
              function addValidItemsToCart(_x4) {
                return _addValidItemsToCart.apply(this, arguments);
              }
              return addValidItemsToCart;
            }()
          }, {
            key: "updatePriceDisplay",
            value: function updatePriceDisplay(el) {
              var _this14 = this;
              if (!this.elements.priceDisplays || this.elements.priceDisplays.length === 0 || !el) return;
              parseFloat(el.dataset.subscriptionItemPrice) || 0;
              parseFloat(el.dataset.subscriptionPrice) || 0;
              var origItemCap = parseFloat(el.dataset.originalItemCap) || 0;
              var bottles = parseInt(el.dataset.bottleQuantity, 10) || 1;
              if (origItemCap === 0) return;
              var totalOrigCap = origItemCap * bottles;
              var subscriptionDiscountPercent = parseFloat(el.dataset.subscriptionDiscount) || 0;
              var firstMonthDiscountPercent = parseFloat(el.dataset.firstMonthDiscount) || 0;
              var effectiveDiscountPercent = subscriptionDiscountPercent + firstMonthDiscountPercent;
              var effectiveMultiplier = (100 - effectiveDiscountPercent) / 100;
              var firstMonthItemPrice = origItemCap * effectiveMultiplier;
              var firstMonthTotalPrice = totalOrigCap * effectiveMultiplier;
              var regularMultiplier = (100 - subscriptionDiscountPercent) / 100;
              var regularItemPrice = origItemCap * regularMultiplier;
              var regularTotalPrice = totalOrigCap * regularMultiplier;
              var displayItemPrice = this.config.priceFormat === "per_bottle" ? firstMonthItemPrice : firstMonthTotalPrice;
              var displayOrigPrice = this.config.priceFormat === "per_bottle" ? origItemCap : totalOrigCap;
              var displayRegularPrice = this.config.priceFormat === "per_bottle" ? regularItemPrice : regularTotalPrice;
              var saveAmount = displayOrigPrice - displayItemPrice;
              var saveAmountDollars = saveAmount / 100;
              var roundedSaveAmountDollars = Math.round(saveAmountDollars);
              var savingsText = roundedSaveAmountDollars > 0 ? "SAVE ".concat(this.state.currencySymbol).concat(roundedSaveAmountDollars) : "";
              var formatMoney = function formatMoney(amount) {
                return "".concat(_this14.state.currencySymbol).concat((amount / 100).toFixed(2));
              };
              var newMainPriceText = formatMoney(displayItemPrice);
              var newComparePriceText = formatMoney(displayOrigPrice);
              var regularPriceFormatted = formatMoney(displayRegularPrice);
              var newFuturePriceText = firstMonthDiscountPercent > 0 ? "Special price for first order. Refills for ".concat(regularPriceFormatted).concat(this.config.priceFormat === "per_bottle" ? "/bottle" : "", ".") : "";
              var newTotalLineHTML = this.config.priceFormat === "per_bottle" && firstMonthTotalPrice !== firstMonthItemPrice ? "Total ".concat(formatMoney(firstMonthTotalPrice / 100), " <span class=\"total-price-cap text-gray-500 line-through\">").concat(formatMoney(totalOrigCap / 100), "</span>") : "";
              this.elements.priceDisplays.forEach(function (display) {
                var mainPriceEl = display.querySelector(".main-price .price");
                var capEl = display.querySelector(".cap");
                var discountBadgeEl = display.querySelector(".discount-badge");
                var totalLineEl = display.querySelector(".total-line");
                var futurePriceEl = display.querySelector(".future-price-notice");
                var perText = display.querySelector(".per-text");
                var hasContentChanged = mainPriceEl && mainPriceEl.textContent !== newMainPriceText || capEl && capEl.textContent !== newComparePriceText || discountBadgeEl && discountBadgeEl.textContent !== savingsText || totalLineEl && totalLineEl.innerHTML !== newTotalLineHTML || futurePriceEl && futurePriceEl.textContent !== newFuturePriceText;
                display.setAttribute("data-price-format", _this14.config.priceFormat);
                display.setAttribute("data-has-savings", saveAmount > 0 ? "true" : "false");
                if (hasContentChanged && !_this14.state.isInitialLoad) {
                  display.setAttribute("data-updating", "true");
                  setTimeout(function () {
                    if (mainPriceEl) mainPriceEl.textContent = newMainPriceText;
                    if (capEl) capEl.textContent = newComparePriceText;
                    if (discountBadgeEl) {
                      discountBadgeEl.textContent = savingsText;
                      discountBadgeEl.setAttribute("data-visible", saveAmount > 0 && _this14.config.priceFormat === "total" ? "true" : "false");
                    }
                    if (totalLineEl) totalLineEl.innerHTML = newTotalLineHTML;
                    if (futurePriceEl) futurePriceEl.textContent = newFuturePriceText;
                    if (perText) {
                      perText.style.display = _this14.config.priceFormat === "total" ? "none" : "";
                    }
                    display.setAttribute("data-updating", "false");
                  }, 220);
                } else {
                  if (mainPriceEl) mainPriceEl.textContent = newMainPriceText;
                  if (capEl) capEl.textContent = newComparePriceText;
                  if (discountBadgeEl) {
                    discountBadgeEl.textContent = savingsText;
                    discountBadgeEl.setAttribute("data-visible", saveAmount > 0 && _this14.config.priceFormat === "total" ? "true" : "false");
                  }
                  if (totalLineEl) totalLineEl.innerHTML = newTotalLineHTML;
                  if (futurePriceEl) futurePriceEl.textContent = newFuturePriceText;
                  if (perText) {
                    perText.style.display = _this14.config.priceFormat === "total" ? "none" : "";
                  }
                }
              });
            }
          }, {
            key: "performSlideUpdate",
            value: function performSlideUpdate(slider, variantId) {
              try {
                if (!slider || !variantId) return;
                var slideIndex = Array.from(slider.slides).findIndex(function (s) {
                  return s.dataset.variantId === variantId;
                });
                if (slideIndex !== -1 && slider.activeIndex !== slideIndex) {
                  slider.update();
                  requestAnimationFrame(function () {
                    slider.slideTo(slideIndex, 300);
                  });
                }
              } catch (err) {
                console.error("Swiper slide update error:", err);
              }
            }
          }, {
            key: "updateVariantImage",
            value: function updateVariantImage(el) {
              var _slider,
                _this15 = this;
              var variantId = el.dataset.variant;
              if (!variantId) return;
              var sliderInstanceId = "productSliderAllInOne".concat(this.config.SID);
              var slider = window[sliderInstanceId];
              if ((_slider = slider) !== null && _slider !== void 0 && (_slider = _slider.slides) !== null && _slider !== void 0 && _slider.length) {
                this.performSlideUpdate(slider, variantId);
              } else {
                var attempts = 0;
                var maxAttempts = 50;
                var interval = setInterval(function () {
                  var _slider2;
                  slider = window[sliderInstanceId];
                  if ((_slider2 = slider) !== null && _slider2 !== void 0 && (_slider2 = _slider2.slides) !== null && _slider2 !== void 0 && _slider2.length) {
                    clearInterval(interval);
                    _this15.performSlideUpdate(slider, variantId);
                  } else if (++attempts >= maxAttempts) {
                    clearInterval(interval);
                    console.warn("Swiper instance ".concat(sliderInstanceId, " not found after ").concat(maxAttempts, " attempts."));
                  }
                }, 100);
              }
            }
          }, {
            key: "updateBuyButtonTracking",
            value: function updateBuyButtonTracking(el) {
              if (!this.elements.submitButton || !el) return;
              var sku = el.dataset.sku;
              var purchaseType = el.dataset.purchaseType;
              var currentName = this.elements.submitButton.getAttribute("name") || "";
              if (currentName.startsWith("track:")) {
                var parts = currentName.split("|");
                var action = parts[0];
                var params = {};
                parts.slice(1).forEach(function (p) {
                  var _p$split = p.split(":"),
                    _p$split2 = _slicedToArray(_p$split, 2),
                    k = _p$split2[0],
                    v = _p$split2[1];
                  if (k) params[k] = v;
                });
                params["variant-sku"] = sku;
                params["purchase-type"] = purchaseType;
                var newName = "".concat(action, "|").concat(Object.entries(params).map(function (_ref7) {
                  var _ref8 = _slicedToArray(_ref7, 2),
                    k = _ref8[0],
                    v = _ref8[1];
                  return "".concat(k, ":").concat(v);
                }).join("|"));
                DOMUtils.updateAttribute(this.elements.submitButton, "name", newName);
              }
              DOMUtils.updateAttribute(this.elements.submitButton, "data-sku", sku);
              DOMUtils.updateAttribute(this.elements.submitButton, "data-purchase-type", purchaseType);
            }
          }, {
            key: "selectFrequencyOption",
            value: function selectFrequencyOption(optionElementOrValue) {
              if (!optionElementOrValue) return;
              var newSellingPlanId = null;
              var selectedOptionElement = null;
              if (typeof optionElementOrValue === "string") {
                newSellingPlanId = optionElementOrValue;
                if (this.elements.frequencyOptions) {
                  selectedOptionElement = this.elements.frequencyOptions.querySelector("[data-selling-plan-id=\"".concat(newSellingPlanId, "\"]"));
                } else if (this.elements.frequencyDropdown) {
                  selectedOptionElement = Array.from(this.elements.frequencyDropdown.options).find(function (opt) {
                    return opt.value === newSellingPlanId;
                  });
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
          }, {
            key: "populateFrequencySelector",
            value: function populateFrequencySelector(selectedVariantBox) {
              var _variantData$selling_2,
                _this16 = this;
              if (!selectedVariantBox || selectedVariantBox.dataset.purchaseType !== "subscribe" || !this.elements.frequencyContainer) {
                if (this.elements.frequencyContainer) this.elements.frequencyContainer.classList.add("hidden");
                return;
              }
              var variantId = selectedVariantBox.dataset.originalVariant || selectedVariantBox.dataset.variant;
              var allowedPlansAttr = selectedVariantBox.dataset.allowedSellingPlans;
              var allowedPlanIds = allowedPlansAttr ? allowedPlansAttr.split(",").map(function (id) {
                return id.trim();
              }) : null;
              var uiType = this.elements.frequencyContainer.dataset.uiType || "tabs";
              var optionsContainer = uiType === "dropdown" ? this.elements.frequencyDropdown : this.elements.frequencyOptions;
              if (!optionsContainer) {
                console.error("Frequency options container not found for UI type: ".concat(uiType));
                this.elements.frequencyContainer.classList.add("hidden");
                return;
              }
              optionsContainer.innerHTML = "";
              var variantData = this.findVariantInProductData(variantId);
              if (!(variantData !== null && variantData !== void 0 && (_variantData$selling_2 = variantData.selling_plan_allocations) !== null && _variantData$selling_2 !== void 0 && _variantData$selling_2.length)) {
                console.warn("No selling plan allocations found for variant ".concat(variantId, ". Hiding frequency selector."));
                this.handleFallbackFrequencyOptions(selectedVariantBox, optionsContainer, this.elements.frequencyContainer);
                return;
              }
              var plans = variantData.selling_plan_allocations;
              if (allowedPlanIds) {
                plans = plans.filter(function (alloc) {
                  return allowedPlanIds.includes(alloc.selling_plan.id.toString());
                });
                if (plans.length === 0) {
                  console.warn("No selling plans matched the allowed list for variant ".concat(variantId, ":"), allowedPlansAttr);
                  this.handleFallbackFrequencyOptions(selectedVariantBox, optionsContainer, this.elements.frequencyContainer);
                  return;
                }
              }
              plans.sort(function (a, b) {
                var freqA = extractFrequency(a.selling_plan.name);
                var freqB = extractFrequency(b.selling_plan.name);
                var daysA = freqA.unit === "month" ? freqA.value * 30 : freqA.unit === "week" ? freqA.value * 7 : freqA.value;
                var daysB = freqB.unit === "month" ? freqB.value * 30 : freqB.unit === "week" ? freqB.value * 7 : freqB.value;
                return daysA - daysB;
              });
              var bottleQuantity = parseInt(selectedVariantBox.dataset.bottleQuantity || "1", 10);
              var recommendedPlanId = null;
              plans.forEach(function (alloc) {
                var _extractFrequency = extractFrequency(alloc.selling_plan.name),
                  value = _extractFrequency.value,
                  unit = _extractFrequency.unit;
                if (unit === "month" && value === bottleQuantity || bottleQuantity === 1 && unit === "day" && value === 30 || unit === "week" && value === 4) {
                  recommendedPlanId = alloc.selling_plan.id.toString();
                }
              });
              if (this.state.isInitialLoad || !this.state.sellingPlanId) {
                var _plans$;
                var planIdToSelect = recommendedPlanId || this.state.sellingPlanId || selectedVariantBox.dataset.subscriptionSellingPlanId || ((_plans$ = plans[0]) === null || _plans$ === void 0 ? void 0 : _plans$.selling_plan.id.toString());
                this.state.sellingPlanId = planIdToSelect;
                if (this.elements.submitSellingPlanId) {
                  this.elements.submitSellingPlanId.value = planIdToSelect;
                }
                if (this.elements.sellingPlanInput) {
                  this.elements.sellingPlanInput.value = planIdToSelect;
                }
                selectedVariantBox.dataset.subscriptionSellingPlanId = planIdToSelect;
              } else {
                var _plans$2;
                this.state.sellingPlanId || selectedVariantBox.dataset.subscriptionSellingPlanId || recommendedPlanId || ((_plans$2 = plans[0]) === null || _plans$2 === void 0 ? void 0 : _plans$2.selling_plan.id.toString());
              }
              console.log("populateFrequencySelector: bottleQuantity=".concat(bottleQuantity, ", recommendedPlanId=").concat(recommendedPlanId, ", planIdToSelect=").concat(this.state.sellingPlanId));
              plans.forEach(function (allocation) {
                var plan = allocation.selling_plan;
                var _extractFrequency2 = extractFrequency(plan.name),
                  value = _extractFrequency2.value,
                  unit = _extractFrequency2.unit;
                var isSelected = plan.id.toString() === _this16.state.sellingPlanId;
                var isRecommended = plan.id.toString() === recommendedPlanId;
                if (uiType === "dropdown") {
                  var optionText = "Every ".concat(value, " ").concat(unit).concat(value > 1 ? "s" : "");
                  if (isRecommended) {
                    optionText += " (Recommended use)";
                  }
                  var option = DOMUtils.createElement("option", {
                    value: plan.id,
                    textContent: optionText,
                    selected: isSelected,
                    className: isRecommended ? "text-primary" : "",
                    "data-frequency-value": value,
                    "data-frequency-unit": unit
                  });
                  optionsContainer.appendChild(option);
                } else {
                  var freqBox = DOMUtils.createElement("div", {
                    className: "frequency-box rounded border-2 border-primary-lighter cursor-pointer py-2 px-3 min-w-[90px] max-w-[168px] text-center w-full transition-all duration-300 ease-in-out aria-selected:bg-primary aria-selected:text-white aria-[selected=false]:bg-white aria-[selected=false]:text-primary hover:bg-gray-100",
                    "data-selling-plan-id": plan.id,
                    "data-frequency-value": value,
                    "data-frequency-unit": unit,
                    "aria-selected": isSelected ? "true" : "false",
                    role: "tab",
                    tabindex: "0",
                    // Make focusable for keyboard navigation
                    innerHTML: "<span class=\"font-semibold text-[14px] block\">Every ".concat(value, "</span><span class=\"text-[12px] block\">").concat(unit).concat(value > 1 ? "s" : "", "</span>")
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
          }, {
            key: "handleFallbackFrequencyOptions",
            value: function handleFallbackFrequencyOptions(el, frequencyOptions, frequencyContainer) {
              var _this17 = this;
              if (!frequencyOptions || !frequencyContainer) return;
              var currentSellingPlanId = el.dataset.subscriptionSellingPlanId;
              var bottleQuantity = parseInt(el.dataset.bottleQuantity || "1", 10);
              if (el.dataset.purchaseType === "subscribe" && currentSellingPlanId) {
                frequencyOptions.innerHTML = "";
                var uiType = frequencyContainer.dataset.uiType || "tabs";
                var isDropdown = uiType === "dropdown";
                var frequencyValue = bottleQuantity;
                var frequencyUnit = "month";
                if (el.dataset.frequencyValue && el.dataset.frequencyUnit) {
                  frequencyValue = parseInt(el.dataset.frequencyValue, 10);
                  frequencyUnit = el.dataset.frequencyUnit;
                }
                var fallbackText = "Every ".concat(frequencyValue, " ").concat(frequencyUnit).concat(frequencyValue > 1 ? "s" : "");
                if (isDropdown) {
                  var option = DOMUtils.createElement("option", {
                    value: currentSellingPlanId,
                    textContent: fallbackText,
                    selected: true,
                    "data-selling-plan-id": currentSellingPlanId,
                    "data-frequency-value": frequencyValue.toString(),
                    "data-frequency-unit": frequencyUnit
                  });
                  frequencyOptions.appendChild(option);
                } else {
                  var fallbackBox = DOMUtils.createElement("div", {
                    className: "frequency-box rounded border-2 border-primary-lighter cursor-pointer py-2 px-3 min-w-[90px] max-w-[168px] text-center w-full transition-all duration-300 ease-in-out aria-selected:bg-primary aria-selected:text-white aria-[selected=false]:bg-white aria-[selected=false]:text-primary hover:bg-gray-100",
                    "data-selling-plan-id": currentSellingPlanId,
                    "data-frequency-value": frequencyValue.toString(),
                    "data-frequency-unit": frequencyUnit,
                    "aria-selected": "true",
                    // Always selected in fallback
                    role: "tab",
                    tabindex: "0",
                    // Make focusable for keyboard navigation
                    innerHTML: "<span class=\"font-semibold text-[14px] block\">Every ".concat(frequencyValue, "</span><span class=\"text-[12px] block\">").concat(frequencyUnit).concat(frequencyValue > 1 ? "s" : "", "</span>")
                  });
                  frequencyOptions.appendChild(fallbackBox);
                }
                frequencyContainer.classList.remove("hidden");
                setTimeout(function () {
                  return _this17.updateFrequencyDescription();
                }, 50);
              } else {
                frequencyContainer.classList.add("hidden");
                frequencyOptions.innerHTML = "";
              }
            }
          }, {
            key: "updateFrequencyDescription",
            value: function updateFrequencyDescription() {
              var _this$elements$freque2,
                _this18 = this;
              if (!this.elements.frequencyDescription || !this.state.selectedBox) return;
              var uiType = ((_this$elements$freque2 = this.elements.frequencyContainer) === null || _this$elements$freque2 === void 0 ? void 0 : _this$elements$freque2.dataset.uiType) || "tabs";
              if (uiType === "dropdown") {
                this.elements.frequencyDescription.innerHTML = "";
                this.elements.frequencyDescription.style.display = "none";
                return;
              }
              var selectedBox = this.state.selectedBox;
              var bottleQuantity = parseInt(selectedBox.dataset.bottleQuantity || "1", 10);
              var selectedValue, selectedUnit;
              if (this.state.sellingPlanId) {
                var _selectedOption, _selectedOption2;
                var selectedOption;
                if (uiType === "tabs" && this.elements.frequencyOptions) {
                  selectedOption = this.elements.frequencyOptions.querySelector("[data-selling-plan-id=\"".concat(this.state.sellingPlanId, "\"]"));
                }
                if ((_selectedOption = selectedOption) !== null && _selectedOption !== void 0 && _selectedOption.dataset.frequencyValue && (_selectedOption2 = selectedOption) !== null && _selectedOption2 !== void 0 && _selectedOption2.dataset.frequencyUnit) {
                  selectedValue = parseInt(selectedOption.dataset.frequencyValue, 10);
                  selectedUnit = selectedOption.dataset.frequencyUnit;
                } else {
                  var _variantData$selling_3;
                  var variantData = this.findVariantInProductData(this.state.variantId);
                  var allocation = variantData === null || variantData === void 0 || (_variantData$selling_3 = variantData.selling_plan_allocations) === null || _variantData$selling_3 === void 0 ? void 0 : _variantData$selling_3.find(function (a) {
                    return a.selling_plan.id.toString() === _this18.state.sellingPlanId;
                  });
                  if (allocation) {
                    var freq = extractFrequency(allocation.selling_plan.name);
                    selectedValue = freq.value;
                    selectedUnit = freq.unit;
                  }
                }
              }
              var description = "";
              if (selectedValue && selectedUnit && !(selectedUnit === "month" && selectedValue === bottleQuantity)) {
                description = "Recommended - ".concat(bottleQuantity, " month").concat(bottleQuantity > 1 ? "s" : "");
              }
              if (this.elements.frequencyDescription.innerHTML !== description) {
                this.elements.frequencyDescription.setAttribute("data-changing", "true");
                setTimeout(function () {
                  _this18.elements.frequencyDescription.innerHTML = description;
                  setTimeout(function () {
                    _this18.elements.frequencyDescription.setAttribute("data-changing", "false");
                  }, 20);
                }, 200);
              }
            }
          }, {
            key: "findVariantInProductData",
            value: function findVariantInProductData(variantId) {
              if (!window.productData || !variantId) return null;
              var numVariantId = parseInt(variantId, 10);
              var product = window.productData[this.state.productId];
              if (product !== null && product !== void 0 && product.variants) {
                var variant = product.variants.find(function (v) {
                  return parseInt(v.id, 10) === numVariantId;
                });
                if (variant) return variant;
                var selectedBox = this.state.selectedBox;
                if (selectedBox && selectedBox.dataset.originalVariant) {
                  var originalVariantId = parseInt(selectedBox.dataset.originalVariant, 10);
                  if (originalVariantId === numVariantId) {
                    var actualVariantId = parseInt(selectedBox.dataset.variant, 10);
                    variant = product.variants.find(function (v) {
                      return parseInt(v.id, 10) === actualVariantId;
                    });
                    if (variant) return variant;
                  } else {
                    variant = product.variants.find(function (v) {
                      return parseInt(v.id, 10) === originalVariantId;
                    });
                    if (variant) return variant;
                  }
                }
              }
              console.warn("Variant ".concat(variantId, " not found in product data for product ").concat(this.state.productId));
              return null;
            }
          }, {
            key: "moveCtaTextIfNeeded",
            value: function moveCtaTextIfNeeded() {
              if (window.innerWidth < 768 && this.elements.ctaText && this.elements.productActions) {
                if (this.elements.ctaText.parentElement !== this.elements.productActions) {
                  this.elements.productActions.insertAdjacentElement("afterbegin", this.elements.ctaText);
                }
              }
            }
            // Optional: Add a static method to retrieve instances
          }], [{
            key: "getInstance",
            value: function getInstance(sid) {
              return BuyBoxNewInstances.get(sid);
            }
            // Optional: Add a static method to retrieve all instances
          }, {
            key: "getAllInstances",
            value: function getAllInstances() {
              return Array.from(BuyBoxNewInstances.values());
            }
          }]);
        }();
        document.addEventListener("DOMContentLoaded", function () {
          var buyBoxContainers = document.querySelectorAll("[data-buy-box-new-root]");
          buyBoxContainers.forEach(function (container, index) {
            var _window$productData;
            var config = {
              SID: container.dataset.sid,
              buyType: container.dataset.buyType,
              priceFormat: container.dataset.priceFormat || "per_bottle",
              isSlideVariant: container.dataset.isSlideVariant === "true",
              isOneTimeGift: container.dataset.isOneTimeGift === "true",
              isOneTimePurchaseLink: container.dataset.isOneTimePurchaseLink === "true",
              currencySymbol: container.dataset.currencySymbol || "$",
              product: (_window$productData = window.productData) === null || _window$productData === void 0 ? void 0 : _window$productData[container.dataset.productId]
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
        if (!customElements.get('share-button')) {
          customElements.define('share-button', /*#__PURE__*/function (_DetailsDisclosure) {
            function ShareButton() {
              var _this19;
              _classCallCheck(this, ShareButton);
              _this19 = _callSuper(this, ShareButton);
              _this19.elements = {
                shareButton: _this19.querySelector('button'),
                shareSummary: _this19.querySelector('summary'),
                closeButton: _this19.querySelector('.share-button__close'),
                successMessage: _this19.querySelector('[id^="ShareMessage"]'),
                urlInput: _this19.querySelector('input')
              };
              _this19.urlToShare = _this19.elements.urlInput ? _this19.elements.urlInput.value : document.location.href;
              if (navigator.share) {
                _this19.mainDetailsToggle.setAttribute('hidden', '');
                _this19.elements.shareButton.classList.remove('hidden');
                _this19.elements.shareButton.addEventListener('click', function () {
                  navigator.share({
                    url: _this19.urlToShare,
                    title: document.title
                  });
                });
              } else {
                _this19.mainDetailsToggle.addEventListener('toggle', _this19.toggleDetails.bind(_this19));
                _this19.mainDetailsToggle.querySelector('.share-button__copy').addEventListener('click', _this19.copyToClipboard.bind(_this19));
                _this19.mainDetailsToggle.querySelector('.share-button__close').addEventListener('click', _this19.close.bind(_this19));
              }
              return _this19;
            }
            _inherits(ShareButton, _DetailsDisclosure);
            return _createClass(ShareButton, [{
              key: "toggleDetails",
              value: function toggleDetails() {
                if (!this.mainDetailsToggle.open) {
                  this.elements.successMessage.classList.add('hidden');
                  this.elements.successMessage.textContent = '';
                  this.elements.closeButton.classList.add('hidden');
                  this.elements.shareSummary.focus();
                }
              }
            }, {
              key: "copyToClipboard",
              value: function copyToClipboard() {
                var _this20 = this;
                navigator.clipboard.writeText(this.elements.urlInput.value).then(function () {
                  _this20.elements.successMessage.classList.remove('hidden');
                  _this20.elements.successMessage.textContent = window.accessibilityStrings.shareSuccess;
                  _this20.elements.closeButton.classList.remove('hidden');
                  _this20.elements.closeButton.focus();
                });
              }
            }, {
              key: "updateUrl",
              value: function updateUrl(url) {
                this.urlToShare = url;
                this.elements.urlInput.value = url;
              }
            }]);
          }(DetailsDisclosure));
        }
        var ShowMoreButton = /*#__PURE__*/function (_HTMLElement6) {
          function ShowMoreButton() {
            var _this21;
            _classCallCheck(this, ShowMoreButton);
            _this21 = _callSuper(this, ShowMoreButton);
            var button = _this21.querySelector('button');
            button.addEventListener('click', function (event) {
              _this21.expandShowMore(event);
              var nextElementToFocus = event.target.closest('.parent-display').querySelector('.show-more-item');
              if (nextElementToFocus && !nextElementToFocus.classList.contains('hidden')) {
                nextElementToFocus.querySelector('input').focus();
              }
            });
            return _this21;
          }
          _inherits(ShowMoreButton, _HTMLElement6);
          return _createClass(ShowMoreButton, [{
            key: "expandShowMore",
            value: function expandShowMore(event) {
              var parentDisplay = event.target.closest('[id^="Show-More-"]').closest('.parent-display');
              parentDisplay.querySelector('.parent-wrap');
              this.querySelectorAll('.label-text').forEach(function (element) {
                return element.classList.toggle('hidden');
              });
              parentDisplay.querySelectorAll('.show-more-item').forEach(function (item) {
                return item.classList.toggle('hidden');
              });
            }
          }]);
        }(/*#__PURE__*/_wrapNativeSuper(HTMLElement));
        customElements.define('show-more-button', ShowMoreButton);
      }
    };
  });
})();
