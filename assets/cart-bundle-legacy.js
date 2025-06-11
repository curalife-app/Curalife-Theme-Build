;
(function () {
  function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
  function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
  function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
  function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
  function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
  function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
  function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
  function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
  function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
  function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
  function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
  function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
  function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
  function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
  function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
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
  System.register([], function (exports, module) {
    'use strict';

    return {
      execute: function execute() {
        var CartRemoveButton = /*#__PURE__*/function (_HTMLElement) {
          function CartRemoveButton() {
            var _this;
            _classCallCheck(this, CartRemoveButton);
            _this = _callSuper(this, CartRemoveButton);
            _this.addEventListener('click', function (event) {
              event.preventDefault();
              var cartItems = _this.closest('cart-items') || _this.closest('cart-drawer-items');
              cartItems.updateQuantity(_this.dataset.index, 0);
            });
            return _this;
          }
          _inherits(CartRemoveButton, _HTMLElement);
          return _createClass(CartRemoveButton);
        }(/*#__PURE__*/_wrapNativeSuper(HTMLElement));
        customElements.define('cart-remove-button', CartRemoveButton);
        var CartItems$1 = /*#__PURE__*/function (_HTMLElement2) {
          function CartItems() {
            var _this2;
            _classCallCheck(this, CartItems);
            _this2 = _callSuper(this, CartItems);
            _defineProperty(_this2, "cartUpdateUnsubscriber", undefined);
            _this2.lineItemStatusElement = document.getElementById('shopping-cart-line-item-status') || document.getElementById('CartDrawer-LineItemStatus');
            var debouncedOnChange = debounce(function (event) {
              _this2.onChange(event);
            }, ON_CHANGE_DEBOUNCE_TIMER);
            _this2.addEventListener('change', debouncedOnChange.bind(_this2));
            return _this2;
          }
          _inherits(CartItems, _HTMLElement2);
          return _createClass(CartItems, [{
            key: "connectedCallback",
            value: function connectedCallback() {
              var _this3 = this;
              this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, function (event) {
                if (event.source === 'cart-items') {
                  return;
                }
                _this3.onCartUpdate();
              });
            }
          }, {
            key: "disconnectedCallback",
            value: function disconnectedCallback() {
              if (this.cartUpdateUnsubscriber) {
                this.cartUpdateUnsubscriber();
              }
            }
          }, {
            key: "onChange",
            value: function onChange(event) {
              this.updateQuantity(event.target.dataset.index, event.target.value, document.activeElement.getAttribute('name'));
            }
          }, {
            key: "onCartUpdate",
            value: function onCartUpdate() {
              var _this4 = this;
              fetch('/cart?section_id=main-cart-items').then(function (response) {
                return response.text();
              }).then(function (responseText) {
                var html = new DOMParser().parseFromString(responseText, 'text/html');
                var sourceQty = html.querySelector('cart-items');
                _this4.innerHTML = sourceQty.innerHTML;
              }).catch(function (e) {
                console.error(e);
              });
            }
          }, {
            key: "getSectionsToRender",
            value: function getSectionsToRender() {
              return [{
                id: 'main-cart-items',
                section: document.getElementById('main-cart-items').dataset.id,
                selector: '.js-contents'
              }, {
                id: 'cart-icon-bubble',
                section: 'cart-icon-bubble',
                selector: '.shopify-section'
              }, {
                id: 'cart-live-region-text',
                section: 'cart-live-region-text',
                selector: '.shopify-section'
              }, {
                id: 'main-cart-footer',
                section: document.getElementById('main-cart-footer').dataset.id,
                selector: '.js-contents'
              }];
            }
          }, {
            key: "updateQuantity",
            value: function updateQuantity(line, quantity, name) {
              var _this5 = this;
              this.enableLoading(line);
              var body = JSON.stringify({
                line: line,
                quantity: quantity,
                sections: this.getSectionsToRender().map(function (section) {
                  return section.section;
                }),
                sections_url: window.location.pathname
              });
              fetch("".concat(routes.cart_change_url), _objectSpread(_objectSpread({}, fetchConfig()), {
                body: body
              })).then(function (response) {
                return response.text();
              }).then(function (state) {
                var parsedState = JSON.parse(state);
                var quantityElement = document.getElementById("Quantity-".concat(line)) || document.getElementById("Drawer-quantity-".concat(line));
                var items = document.querySelectorAll('.cart-item');
                if (parsedState.errors) {
                  quantityElement.value = quantityElement.getAttribute('value');
                  _this5.updateLiveRegions(line, parsedState.errors);
                  return;
                }
                _this5.classList.toggle('is-empty', parsedState.item_count === 0);
                var cartDrawerWrapper = document.querySelector('cart-drawer');
                var cartFooter = document.getElementById('main-cart-footer');
                if (cartFooter) cartFooter.classList.toggle('is-empty', parsedState.item_count === 0);
                if (cartDrawerWrapper) cartDrawerWrapper.classList.toggle('is-empty', parsedState.item_count === 0);
                _this5.getSectionsToRender().forEach(function (section) {
                  var elementToReplace = document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);
                  elementToReplace.innerHTML = _this5.getSectionInnerHTML(parsedState.sections[section.section], section.selector);
                });
                var updatedValue = parsedState.items[line - 1] ? parsedState.items[line - 1].quantity : undefined;
                var message = '';
                if (items.length === parsedState.items.length && updatedValue !== parseInt(quantityElement.value)) {
                  if (typeof updatedValue === 'undefined') {
                    message = window.cartStrings.error;
                  } else {
                    message = window.cartStrings.quantityError.replace('[quantity]', updatedValue);
                  }
                }
                _this5.updateLiveRegions(line, message);
                var lineItem = document.getElementById("CartItem-".concat(line)) || document.getElementById("CartDrawer-Item-".concat(line));
                if (lineItem && lineItem.querySelector("[name=\"".concat(name, "\"]"))) {
                  cartDrawerWrapper ? trapFocus(cartDrawerWrapper, lineItem.querySelector("[name=\"".concat(name, "\"]"))) : lineItem.querySelector("[name=\"".concat(name, "\"]")).focus();
                } else if (parsedState.item_count === 0 && cartDrawerWrapper) {
                  trapFocus(cartDrawerWrapper.querySelector('.drawer__inner-empty'), cartDrawerWrapper.querySelector('a'));
                } else if (document.querySelector('.cart-item') && cartDrawerWrapper) {
                  trapFocus(cartDrawerWrapper, document.querySelector('.cart-item__name'));
                }
                publish(PUB_SUB_EVENTS.cartUpdate, {
                  source: 'cart-items'
                });
              }).catch(function () {
                _this5.querySelectorAll('.loading-overlay').forEach(function (overlay) {
                  return overlay.classList.add('hidden');
                });
                var errors = document.getElementById('cart-errors') || document.getElementById('CartDrawer-CartErrors');
                errors.textContent = window.cartStrings.error;
              }).finally(function () {
                _this5.disableLoading(line);
              });
            }
          }, {
            key: "updateLiveRegions",
            value: function updateLiveRegions(line, message) {
              var lineItemError = document.getElementById("Line-item-error-".concat(line)) || document.getElementById("CartDrawer-LineItemError-".concat(line));
              if (lineItemError) lineItemError.querySelector('.cart-item__error-text').innerHTML = message;
              this.lineItemStatusElement.setAttribute('aria-hidden', true);
              var cartStatus = document.getElementById('cart-live-region-text') || document.getElementById('CartDrawer-LiveRegionText');
              cartStatus.setAttribute('aria-hidden', false);
              setTimeout(function () {
                cartStatus.setAttribute('aria-hidden', true);
              }, 1000);
            }
          }, {
            key: "getSectionInnerHTML",
            value: function getSectionInnerHTML(html, selector) {
              return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
            }
          }, {
            key: "enableLoading",
            value: function enableLoading(line) {
              var mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
              mainCartItems.classList.add('cart__items--disabled');
              var cartItemElements = this.querySelectorAll("#CartItem-".concat(line, " .loading-overlay"));
              var cartDrawerItemElements = this.querySelectorAll("#CartDrawer-Item-".concat(line, " .loading-overlay"));
              [].concat(_toConsumableArray(cartItemElements), _toConsumableArray(cartDrawerItemElements)).forEach(function (overlay) {
                return overlay.classList.remove('hidden');
              });
              document.activeElement.blur();
              this.lineItemStatusElement.setAttribute('aria-hidden', false);
            }
          }, {
            key: "disableLoading",
            value: function disableLoading(line) {
              var mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
              mainCartItems.classList.remove('cart__items--disabled');
              var cartItemElements = this.querySelectorAll("#CartItem-".concat(line, " .loading-overlay"));
              var cartDrawerItemElements = this.querySelectorAll("#CartDrawer-Item-".concat(line, " .loading-overlay"));
              cartItemElements.forEach(function (overlay) {
                return overlay.classList.add('hidden');
              });
              cartDrawerItemElements.forEach(function (overlay) {
                return overlay.classList.add('hidden');
              });
            }
          }]);
        }(/*#__PURE__*/_wrapNativeSuper(HTMLElement));
        customElements.define('cart-items', CartItems$1);
        if (!customElements.get('cart-note')) {
          customElements.define('cart-note', /*#__PURE__*/function (_HTMLElement3) {
            function CartNote() {
              var _this6;
              _classCallCheck(this, CartNote);
              _this6 = _callSuper(this, CartNote);
              _this6.addEventListener('change', debounce(function (event) {
                var body = JSON.stringify({
                  note: event.target.value
                });
                fetch("".concat(routes.cart_update_url), _objectSpread(_objectSpread({}, fetchConfig()), {
                  body: body
                }));
              }, ON_CHANGE_DEBOUNCE_TIMER));
              return _this6;
            }
            _inherits(CartNote, _HTMLElement3);
            return _createClass(CartNote);
          }(/*#__PURE__*/_wrapNativeSuper(HTMLElement)));
        }
        var CartDrawer = /*#__PURE__*/function (_HTMLElement4) {
          function CartDrawer() {
            var _this7;
            _classCallCheck(this, CartDrawer);
            _this7 = _callSuper(this, CartDrawer);
            _this7.addEventListener('keyup', function (evt) {
              return evt.code === 'Escape' && _this7.close();
            });
            _this7.querySelector('#CartDrawer-Overlay').addEventListener('click', _this7.close.bind(_this7));
            _this7.setHeaderCartIconAccessibility();
            return _this7;
          }
          _inherits(CartDrawer, _HTMLElement4);
          return _createClass(CartDrawer, [{
            key: "setHeaderCartIconAccessibility",
            value: function setHeaderCartIconAccessibility() {
              var _this8 = this;
              var cartLink = document.querySelector('#cart-icon-bubble');
              cartLink.setAttribute('role', 'button');
              cartLink.setAttribute('aria-haspopup', 'dialog');
              cartLink.addEventListener('click', function (event) {
                event.preventDefault();
                _this8.open(cartLink);
              });
              cartLink.addEventListener('keydown', function (event) {
                if (event.code.toUpperCase() === 'SPACE') {
                  event.preventDefault();
                  _this8.open(cartLink);
                }
              });
            }
          }, {
            key: "open",
            value: function open(triggeredBy) {
              var _this9 = this;
              if (triggeredBy) this.setActiveElement(triggeredBy);
              var cartDrawerNote = this.querySelector('[id^="Details-"] summary');
              if (cartDrawerNote && !cartDrawerNote.hasAttribute('role')) this.setSummaryAccessibility(cartDrawerNote);
              // here the animation doesn't seem to always get triggered. A timeout seem to help
              setTimeout(function () {
                _this9.classList.add('animate', 'active');
              });
              this.addEventListener('transitionend', function () {
                var containerToTrapFocusOn = _this9.classList.contains('is-empty') ? _this9.querySelector('.drawer__inner-empty') : document.getElementById('CartDrawer');
                var focusElement = _this9.querySelector('.drawer__inner') || _this9.querySelector('.drawer__close');
                trapFocus(containerToTrapFocusOn, focusElement);
              }, {
                once: true
              });
              document.body.classList.add('overflow-hidden');
            }
          }, {
            key: "close",
            value: function close() {
              this.classList.remove('active');
              removeTrapFocus(this.activeElement);
              document.body.classList.remove('overflow-hidden');
            }
          }, {
            key: "setSummaryAccessibility",
            value: function setSummaryAccessibility(cartDrawerNote) {
              cartDrawerNote.setAttribute('role', 'button');
              cartDrawerNote.setAttribute('aria-expanded', 'false');
              if (cartDrawerNote.nextElementSibling.getAttribute('id')) {
                cartDrawerNote.setAttribute('aria-controls', cartDrawerNote.nextElementSibling.id);
              }
              cartDrawerNote.addEventListener('click', function (event) {
                event.currentTarget.setAttribute('aria-expanded', !event.currentTarget.closest('details').hasAttribute('open'));
              });
              cartDrawerNote.parentElement.addEventListener('keyup', onKeyUpEscape);
            }
          }, {
            key: "renderContents",
            value: function renderContents(parsedState) {
              var _this0 = this;
              this.querySelector('.drawer__inner').classList.contains('is-empty') && this.querySelector('.drawer__inner').classList.remove('is-empty');
              this.productId = parsedState.id;
              this.getSectionsToRender().forEach(function (section) {
                var sectionElement = section.selector ? document.querySelector(section.selector) : document.getElementById(section.id);
                sectionElement.innerHTML = _this0.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
              });
              setTimeout(function () {
                _this0.querySelector('#CartDrawer-Overlay').addEventListener('click', _this0.close.bind(_this0));
                _this0.open();
              });
            }
          }, {
            key: "getSectionInnerHTML",
            value: function getSectionInnerHTML(html) {
              var selector = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '.shopify-section';
              return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
            }
          }, {
            key: "getSectionsToRender",
            value: function getSectionsToRender() {
              return [{
                id: 'cart-drawer',
                selector: '#CartDrawer'
              }, {
                id: 'cart-icon-bubble'
              }];
            }
          }, {
            key: "getSectionDOM",
            value: function getSectionDOM(html) {
              var selector = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '.shopify-section';
              return new DOMParser().parseFromString(html, 'text/html').querySelector(selector);
            }
          }, {
            key: "setActiveElement",
            value: function setActiveElement(element) {
              this.activeElement = element;
            }
          }]);
        }(/*#__PURE__*/_wrapNativeSuper(HTMLElement));
        customElements.define('cart-drawer', CartDrawer);
        var CartDrawerItems = /*#__PURE__*/function (_CartItems2) {
          function CartDrawerItems() {
            _classCallCheck(this, CartDrawerItems);
            return _callSuper(this, CartDrawerItems, arguments);
          }
          _inherits(CartDrawerItems, _CartItems2);
          return _createClass(CartDrawerItems, [{
            key: "getSectionsToRender",
            value: function getSectionsToRender() {
              return [{
                id: 'CartDrawer',
                section: 'cart-drawer',
                selector: '.drawer__inner'
              }, {
                id: 'cart-icon-bubble',
                section: 'cart-icon-bubble',
                selector: '.shopify-section'
              }];
            }
          }]);
        }(CartItems);
        customElements.define('cart-drawer-items', CartDrawerItems);
        var CartNotification = /*#__PURE__*/function (_HTMLElement5) {
          function CartNotification() {
            var _this1;
            _classCallCheck(this, CartNotification);
            _this1 = _callSuper(this, CartNotification);
            _this1.notification = document.getElementById('cart-notification');
            _this1.header = document.querySelector('sticky-header');
            _this1.onBodyClick = _this1.handleBodyClick.bind(_this1);
            _this1.notification.addEventListener('keyup', function (evt) {
              return evt.code === 'Escape' && _this1.close();
            });
            _this1.querySelectorAll('button[type="button"]').forEach(function (closeButton) {
              return closeButton.addEventListener('click', _this1.close.bind(_this1));
            });
            return _this1;
          }
          _inherits(CartNotification, _HTMLElement5);
          return _createClass(CartNotification, [{
            key: "open",
            value: function open() {
              var _this10 = this;
              this.notification.classList.add('animate', 'active');
              this.notification.addEventListener('transitionend', function () {
                _this10.notification.focus();
                trapFocus(_this10.notification);
              }, {
                once: true
              });
              document.body.addEventListener('click', this.onBodyClick);
            }
          }, {
            key: "close",
            value: function close() {
              this.notification.classList.remove('active');
              document.body.removeEventListener('click', this.onBodyClick);
              removeTrapFocus(this.activeElement);
            }
          }, {
            key: "renderContents",
            value: function renderContents(parsedState) {
              var _this11 = this;
              this.cartItemKey = parsedState.key;
              this.getSectionsToRender().forEach(function (section) {
                document.getElementById(section.id).innerHTML = _this11.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
              });
              if (this.header) this.header.reveal();
              this.open();
            }
          }, {
            key: "getSectionsToRender",
            value: function getSectionsToRender() {
              return [{
                id: 'cart-notification-product',
                selector: "[id=\"cart-notification-product-".concat(this.cartItemKey, "\"]")
              }, {
                id: 'cart-notification-button'
              }, {
                id: 'cart-icon-bubble'
              }];
            }
          }, {
            key: "getSectionInnerHTML",
            value: function getSectionInnerHTML(html) {
              var selector = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '.shopify-section';
              return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
            }
          }, {
            key: "handleBodyClick",
            value: function handleBodyClick(evt) {
              var target = evt.target;
              if (target !== this.notification && !target.closest('cart-notification')) {
                var disclosure = target.closest('details-disclosure, header-menu');
                this.activeElement = disclosure ? disclosure.querySelector('summary') : null;
                this.close();
              }
            }
          }, {
            key: "setActiveElement",
            value: function setActiveElement(element) {
              this.activeElement = element;
            }
          }]);
        }(/*#__PURE__*/_wrapNativeSuper(HTMLElement));
        customElements.define('cart-notification', CartNotification);

        /**
         * Cart Bundle - Cart functionality and related components
         *
         * This bundle includes all cart-related features like cart updates,
         * cart drawer, notifications, and cart interactions.
         */

        console.log("🛒 Cart bundle loaded - Cart functionality initialized");
      }
    };
  });
})();
