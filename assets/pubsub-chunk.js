const ON_CHANGE_DEBOUNCE_TIMER = 300;
const PUB_SUB_EVENTS = {
  cartUpdate: "cart-update",
  quantityUpdate: "quantity-update",
  variantChange: "variant-change"
};
function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(this, args), wait);
  };
}
function fetchConfig(type = "json") {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/".concat(type) }
  };
}
window.debounce = debounce;
window.fetchConfig = fetchConfig;
window.ON_CHANGE_DEBOUNCE_TIMER = ON_CHANGE_DEBOUNCE_TIMER;
window.PUB_SUB_EVENTS = PUB_SUB_EVENTS;
let subscribers = {};
function subscribe(eventName, callback) {
  if (subscribers[eventName] === void 0) {
    subscribers[eventName] = [];
  }
  subscribers[eventName] = [...subscribers[eventName], callback];
  return function unsubscribe() {
    subscribers[eventName] = subscribers[eventName].filter((cb) => {
      return cb !== callback;
    });
  };
}
function publish(eventName, data) {
  if (subscribers[eventName]) {
    subscribers[eventName].forEach((callback) => {
      callback(data);
    });
  }
}
window.subscribe = subscribe;
window.publish = publish;
