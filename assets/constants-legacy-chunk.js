;
(function () {
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
      }
    };
  });
})();
