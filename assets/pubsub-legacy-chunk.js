;
(function () {
  function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
  function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
  function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
  function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
  function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
  function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
  System.register([], function (exports, module) {
    'use strict';

    return {
      execute: function execute() {
        var ON_CHANGE_DEBOUNCE_TIMER = 300;
        var PUB_SUB_EVENTS = {
          cartUpdate: "cart-update",
          quantityUpdate: "quantity-update",
          variantChange: "variant-change"
        };
        function debounce(fn, wait) {
          var _this = this;
          var t;
          return function () {
            for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
              args[_key] = arguments[_key];
            }
            clearTimeout(t);
            t = setTimeout(function () {
              return fn.apply(_this, args);
            }, wait);
          };
        }
        function fetchConfig() {
          var type = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : "json";
          return {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/".concat(type)
            }
          };
        }
        window.debounce = debounce;
        window.fetchConfig = fetchConfig;
        window.ON_CHANGE_DEBOUNCE_TIMER = ON_CHANGE_DEBOUNCE_TIMER;
        window.PUB_SUB_EVENTS = PUB_SUB_EVENTS;
        var subscribers = {};
        function subscribe(eventName, callback) {
          if (subscribers[eventName] === void 0) {
            subscribers[eventName] = [];
          }
          subscribers[eventName] = [].concat(_toConsumableArray(subscribers[eventName]), [callback]);
          return function unsubscribe() {
            subscribers[eventName] = subscribers[eventName].filter(function (cb) {
              return cb !== callback;
            });
          };
        }
        function publish(eventName, data) {
          if (subscribers[eventName]) {
            subscribers[eventName].forEach(function (callback) {
              callback(data);
            });
          }
        }
        window.subscribe = subscribe;
        window.publish = publish;
      }
    };
  });
})();
