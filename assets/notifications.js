/**
 * Modular Notification System
 * Extracted from quiz component for reusability across different components
 */

// --- Constants for better readability and maintainability ---
const CSS_CLASSES = {
	CONTAINER: "notification-container",
	NOTIFICATION: "notification",
	SUCCESS: "notification-success",
	ERROR: "notification-error",
	INFO: "notification-info",
	WARNING: "notification-warning",
	HEADER: "notification-header",
	CONTENT: "notification-content",
	CONTROLS: "notification-controls",
	ICON: "notification-icon",
	TITLE: "notification-title",
	TOGGLE: "notification-toggle",
	DETAILS: "notification-details",
	DETAILS_CONTENT: "notification-details-content",
	CLOSE: "notification-close",
	SHIMMER: "notification-shimmer",
	// State/Animation classes
	ACTIVE: "active",
	EXPANDED: "expanded",
	ANIMATE_IN: "animate-in",
	ANIMATE_OUT: "animate-out",
	SLIDE_UP: "slide-up",
	FILTER_HIDDEN: "filter-hidden",
	FILTER_VISIBLE: "filter-visible",
	PRIORITY_PREFIX: "notification-priority-",
	// Control buttons/menus
	COPY_BUTTON: "notification-copy-button",
	FILTER_BUTTON: "notification-filter-button",
	COPY_MENU: "notification-copy-options-menu",
	FILTER_MENU: "notification-filter-options-menu",
	MENU_ITEM: "notification-copy-options-menu-item",
	MENU_DIVIDER: "notification-copy-options-menu-divider"
};

const DATA_ATTRIBUTES = {
	TYPE: "type",
	PRIORITY: "priority",
	TIMESTAMP: "timestamp",
	FORMAT: "format",
	FILTER: "filter"
};

const EMOJIS = {
	SUCCESS: "✓",
	ERROR: "✗",
	WARNING: "⚠",
	INFO: "ℹ",
	FILTER_ALL: "🔍",
	FILTER_ERROR: "❌",
	FILTER_SUCCESS: "✅",
	FILTER_INFO: "ℹ️",
	COPY_SUCCESS: `
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<polyline points="20,6 9,17 4,12"></polyline>
		</svg>`,
	COPY_ERROR: `
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<line x1="18" y1="6" x2="6" y2="18"></line>
			<line x1="6" y1="6" x2="18" y2="18"></line>
		</svg>`,
	COPY_DEFAULT: `
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
			<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
			<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2 2v1"></path>
		</svg>`
};

const DEFAULT_PRIORITY_CONFIGS = {
	critical: { color: "#dc2626", shouldPulse: true },
	error: { color: "#dc2626", shouldPulse: false },
	warning: { color: "#f59e0b", shouldPulse: false },
	success: { color: "#059669", shouldPulse: false },
	info: { color: "#2563eb", shouldPulse: false }
};

export class NotificationManager {
	constructor(options = {}) {
		this.options = {
			containerSelector: `.${CSS_CLASSES.CONTAINER}`,
			position: "top-right",
			autoCollapse: true,
			maxNotifications: 50,
			defaultDuration: 5000,
			enableFiltering: true,
			enableCopy: true,
			...options
		};

		// CSS class configuration - generic names, customizable for any component
		// Merge default classes with custom ones provided in options
		this.cssClasses = {
			...CSS_CLASSES, // Include all default constants
			...(options.customClasses || {}) // Override with custom classes if provided
		};

		this.notifications = [];
		this.currentFilter = "all";
		this.autoCollapseEnabled = this.options.autoCollapse;

		// Track timeouts and event listeners for cleanup
		this.timeouts = new Set();
		this.eventListeners = new WeakMap(); // Stores [{element, event, handler}] for specific elements
		this.isDestroyed = false;

		// Track notification queue for staggered animations
		this.notificationQueue = [];
		this.isProcessingQueue = false;
		this.staggerDelay = 300; // milliseconds between notifications for display
		this.batchingDelay = 50; // milliseconds to wait for batching notifications before starting stagger

		// Timeout IDs for queue management
		this.processingQueueTimeoutId = null;
		this.staggerTimeoutId = null;

		this._init();
	}

	/**
	 * Initializes the notification manager by creating the container and control buttons.
	 * @private
	 */
	_init() {
		if (this.isDestroyed) return;

		this._createContainer();
		if (this.options.enableFiltering || this.options.enableCopy) {
			this._addControlButtons();
		}
	}

	/**
	 * Creates or finds the notification container in the DOM.
	 * Waits for DOMContentLoaded if document is not ready.
	 * @private
	 */
	_createContainer() {
		// Wait for DOM to be ready
		if (document.readyState === "loading") {
			const handler = () => {
				this._createContainer();
				document.removeEventListener("DOMContentLoaded", handler);
			};
			document.addEventListener("DOMContentLoaded", handler);
			return;
		}

		let container = document.querySelector(this.options.containerSelector);
		if (!container) {
			if (!document.body) {
				console.warn("NotificationManager: document.body not available to append container.");
				return;
			}
			container = document.createElement("div");
			container.className = this.cssClasses.CONTAINER;
			container.setAttribute("role", "status"); // For accessibility
			container.setAttribute("aria-live", "polite"); // For accessibility
			document.body.appendChild(container);
		}
		this.container = container;
	}

	/**
	 * Public method to display a new notification.
	 * @param {string} text - The content of the notification. Can include <br> or \n for details.
	 * @param {string} type - The type of notification (e.g., 'info', 'success', 'error', 'warning').
	 * @param {string|null} priority - Optional priority (e.g., 'critical').
	 * @param {number|null} duration - Optional duration in milliseconds. Overrides default.
	 * @returns {HTMLElement|null} The created notification element, or null if creation failed.
	 */
	show(text, type = "info", priority = null, duration = null) {
		if (this.isDestroyed) {
			console.warn("NotificationManager: Cannot show notification, manager is destroyed.");
			return null;
		}
		if (!text || typeof text !== "string") {
			console.error("NotificationManager: Notification text must be a non-empty string.");
			return null;
		}

		const notification = this._createNotificationElement(text, type, priority, duration);
		if (notification) {
			this._queueNotification(notification);
		}
		return notification;
	}

	/**
	 * Creates the HTML element for a notification.
	 * @param {string} text - The content of the notification.
	 * @param {string} type - The type of notification.
	 * @param {string|null} priority - The priority of the notification.
	 * @param {number|null} duration - The duration in milliseconds.
	 * @returns {HTMLElement} The created notification DOM element.
	 * @private
	 */
	_createNotificationElement(text, type = "info", priority = null, duration = null) {
		const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const actualPriority = priority || this._determinePriority(type, text);
		const notificationDuration = duration !== null ? duration : this.options.defaultDuration;

		const notification = document.createElement("div");
		notification.className = `${this.cssClasses.NOTIFICATION} ${this.cssClasses[type] || this.cssClasses.INFO}`;
		notification.id = id;
		notification.dataset[DATA_ATTRIBUTES.TYPE] = type;
		notification.dataset[DATA_ATTRIBUTES.PRIORITY] = actualPriority;
		notification.dataset[DATA_ATTRIBUTES.TIMESTAMP] = new Date().toISOString();

		this._applyPriorityStyles(notification, actualPriority, this._getPriorityConfig(actualPriority));
		this._buildNotificationContent(notification, text, type);

		// Auto-remove after duration (only if duration > 0)
		if (notificationDuration > 0) {
			const timeoutId = setTimeout(() => {
				this.removeNotification(notification);
				this.timeouts.delete(timeoutId);
			}, notificationDuration);
			this.timeouts.add(timeoutId);
		}

		return notification;
	}

	/**
	 * Builds the internal HTML structure for a notification.
	 * @param {HTMLElement} notification - The notification DOM element to build into.
	 * @param {string} text - The raw text content.
	 * @param {string} type - The notification type.
	 * @private
	 */
	_buildNotificationContent(notification, text, type) {
		let title, detailsText;

		if (text.includes("<br>")) {
			const parts = text.split("<br>");
			title = parts[0].trim();
			detailsText = parts.slice(1).join("<br>").trim();
		} else {
			const [firstLine, ...details] = text.split("\n");
			title = firstLine.trim();
			detailsText = details.join("\n").trim();
		}

		title = this._cleanNotificationTitle(title);

		// Sanitize HTML but preserve allowed tags like <br>, <strong>, <em>
		const safeTitle = this._sanitizeHtml(title);
		const safeDetailsText = this._sanitizeHtml(detailsText);

		notification.innerHTML = `
			<div class="${this.cssClasses.HEADER}">
				<div class="${this.cssClasses.CONTENT}">
					<div class="${this.cssClasses.ICON}">${this._getTypeIcon(type)}</div>
					<div class="${this.cssClasses.TITLE}">${safeTitle}</div>
				</div>
				<div class="${this.cssClasses.CONTROLS}">
					${
						detailsText
							? `<div class="${this.cssClasses.TOGGLE}">
						<svg width="12" height="8" viewBox="0 0 12 8" fill="none">
							<path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</div>`
							: ""
					}
					<div class="${this.cssClasses.CLOSE}">×</div>
				</div>
			</div>
			${
				detailsText
					? `<div class="${this.cssClasses.DETAILS}">
				<div class="${this.cssClasses.DETAILS_CONTENT}">${safeDetailsText}</div>
			</div>`
					: ""
			}
			<div class="${this.cssClasses.SHIMMER}"></div>
		`;

		this._attachNotificationListeners(notification);
	}

	/**
	 * Attaches event listeners to a notification element.
	 * @param {HTMLElement} notification - The notification element.
	 * @private
	 */
	_attachNotificationListeners(notification) {
		const header = notification.querySelector(`.${this.cssClasses.HEADER}`);
		const closeBtn = notification.querySelector(`.${this.cssClasses.CLOSE}`);
		const toggle = notification.querySelector(`.${this.cssClasses.TOGGLE}`);

		if (!header || !closeBtn) {
			console.warn("NotificationManager: Missing header or close button for notification:", notification.id);
			return;
		}

		const listeners = [];

		const closeClickHandler = e => {
			e.stopPropagation(); // Prevent header click from expanding/collapsing
			this.removeNotification(notification);
		};
		this._addAndTrackListener(closeBtn, "click", closeClickHandler, notification);

		// Only add toggle functionality if there are details to expand
		if (toggle) {
			const headerClickHandler = () => this.toggleNotification(notification);
			this._addAndTrackListener(header, "click", headerClickHandler, notification);
		}
	}

	/**
	 * Helper to add event listeners and track them for cleanup.
	 * @param {HTMLElement} element - The DOM element to attach the listener to.
	 * @param {string} event - The event type (e.g., 'click').
	 * @param {function} handler - The event handler function.
	 * @param {HTMLElement} [parentNotification] - Optional parent notification for WeakMap key.
	 * @private
	 */
	_addAndTrackListener(element, event, handler, parentNotification = element) {
		element.addEventListener(event, handler);
		let listeners = this.eventListeners.get(parentNotification) || [];
		listeners.push({ element, event, handler });
		this.eventListeners.set(parentNotification, listeners);
	}

	/**
	 * Cleans the notification title by removing common emojis and "TEST MODE" text.
	 * @param {string} title - The raw title string.
	 * @returns {string} The cleaned title string.
	 * @private
	 */
	_cleanNotificationTitle(title) {
		if (typeof title !== "string") return "";
		// More comprehensive regex for various emojis and "TEST MODE"
		return title
			.replace(
				/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2B50}\u{2122}\u{2B06}\u{2B07}\u{2B05}\u{27A1}\u{274C}\u{2716}\u{2714}\u{2795}\u{2797}\u{27B0}\u{3030}\u{303D}\u{3297}\u{3299}\u{FE0F}]/gu,
				""
			)
			.replace(/TEST MODE\s*[-:]?\s*/gi, "")
			.trim();
	}

	/**
	 * Sanitizes HTML content, allowing only specific safe tags.
	 * @param {string} text - The HTML string to sanitize.
	 * @returns {string} The sanitized HTML string.
	 * @private
	 */
	_sanitizeHtml(text) {
		if (!text || typeof text !== "string") return "";

		// Create a temporary div to escape HTML entities
		const div = document.createElement("div");
		div.textContent = text;
		let escaped = div.innerHTML;

		// Allow specific safe HTML tags for formatting
		// Use regex with capturing groups to re-insert allowed tags
		escaped = escaped
			.replace(/<br>/gi, "<br>")
			.replace(/<br\/>/gi, "<br>")
			.replace(/<br \/>/gi, "<br>")
			.replace(/<strong>(.*?)<\/strong>/gi, "<strong>$1</strong>")
			.replace(/<em>(.*?)<\/em>/gi, "<em>$1</em>");

		return escaped;
	}

	/**
	 * Legacy method, redirects to _sanitizeHtml for consistency.
	 * @param {string} text - The text to escape.
	 * @returns {string} The escaped text.
	 */
	escapeHtml(text) {
		return this._sanitizeHtml(text);
	}

	/**
	 * Toggles the expanded state of a notification.
	 * @param {HTMLElement} notification - The notification element.
	 */
	toggleNotification(notification) {
		if (this.isDestroyed) return;

		const details = notification.querySelector(`.${this.cssClasses.DETAILS}`);
		if (!details) return;

		if (details.classList.contains(this.cssClasses.EXPANDED)) {
			this.collapseNotification(notification);
		} else {
			this.expandNotification(notification);
		}
	}

	/**
	 * Expands a notification to show its details.
	 * @param {HTMLElement} notification - The notification element.
	 */
	expandNotification(notification) {
		if (this.isDestroyed) return;

		const details = notification.querySelector(`.${this.cssClasses.DETAILS}`);
		const toggle = notification.querySelector(`.${this.cssClasses.TOGGLE}`);

		if (details) {
			details.classList.add(this.cssClasses.EXPANDED);
			// Use requestAnimationFrame to ensure the DOM has updated before calculating height
			requestAnimationFrame(() => {
				if (this.isDestroyed) return;
				const contentHeight = details.scrollHeight;
				details.style.maxHeight = contentHeight + "px"; // Let CSS handle padding/margin
			});
		}
		if (toggle) {
			toggle.classList.add(this.cssClasses.EXPANDED);
		}
	}

	/**
	 * Collapses a notification to hide its details.
	 * @param {HTMLElement} notification - The notification element.
	 */
	collapseNotification(notification) {
		if (this.isDestroyed) return;

		const details = notification.querySelector(`.${this.cssClasses.DETAILS}`);
		const toggle = notification.querySelector(`.${this.cssClasses.TOGGLE}`);

		if (details) {
			// Set maxHeight to scrollHeight before transitioning to 0 for smooth collapse
			details.style.maxHeight = details.scrollHeight + "px";
			requestAnimationFrame(() => {
				if (this.isDestroyed) return;
				details.classList.remove(this.cssClasses.EXPANDED);
				details.style.maxHeight = "0";
			});
		}
		if (toggle) {
			toggle.classList.remove(this.cssClasses.EXPANDED);
		}
	}

	/**
	 * Adds a notification to the processing queue.
	 * @param {HTMLElement} notification - The notification element to add.
	 * @private
	 */
	_queueNotification(notification) {
		if (this.isDestroyed) return;

		this.notificationQueue.push(notification);

		// If no processing is currently scheduled, start batching
		if (!this.processingQueueTimeoutId) {
			this.processingQueueTimeoutId = setTimeout(() => {
				this._processNotificationQueue();
				this.processingQueueTimeoutId = null; // Clear the timeout ID once it fires
			}, this.batchingDelay);
			this.timeouts.add(this.processingQueueTimeoutId);
		}
	}

	/**
	 * Starts the staggered processing of notifications from the queue.
	 * @private
	 */
	_processNotificationQueue() {
		if (this.isDestroyed) return;

		// If already processing (staggering), return
		if (this.isProcessingQueue) {
			return;
		}

		this.isProcessingQueue = true;
		this._processNextInQueue();
	}

	/**
	 * Processes the next notification in the queue with stagger effect.
	 * @private
	 */
	_processNextInQueue() {
		if (this.isDestroyed) {
			this.isProcessingQueue = false;
			return;
		}

		if (this.notificationQueue.length === 0) {
			this.isProcessingQueue = false;
			this.staggerTimeoutId = null; // Clear stagger timeout ID
			return;
		}

		const notification = this.notificationQueue.shift();
		this._addNotificationImmediate(notification);

		this.staggerTimeoutId = setTimeout(() => {
			this._processNextInQueue();
		}, this.staggerDelay);
		this.timeouts.add(this.staggerTimeoutId);
	}

	/**
	 * Adds a notification to the DOM immediately with animation.
	 * @param {HTMLElement} notification - The notification element.
	 * @private
	 */
	_addNotificationImmediate(notification) {
		if (this.isDestroyed || !this.container) return;

		this.notifications.push(notification);
		this.container.appendChild(notification);

		// Force initial state and trigger reflow for CSS animation
		notification.style.opacity = "0";
		notification.style.transform = "translateX(120%) scale(0.85)";
		notification.offsetHeight; // Trigger reflow

		requestAnimationFrame(() => {
			if (this.isDestroyed) return;

			// Add a micro-delay for better visual effect and allow CSS to take over
			const timeoutId = setTimeout(() => {
				if (!this.isDestroyed && notification.parentNode) {
					notification.style.opacity = ""; // Let CSS manage opacity
					notification.style.transform = ""; // Let CSS manage transform
					notification.classList.add(this.cssClasses.ANIMATE_IN);

					// Add a subtle bounce effect to surrounding notifications
					this._addInteractiveEffects(notification);
				}
				this.timeouts.delete(timeoutId);
			}, 50); // Small delay to ensure reflow applied
			this.timeouts.add(timeoutId);
		});

		// Manage notification count
		if (this.notifications.length > this.options.maxNotifications) {
			const oldestNotification = this.notifications.shift(); // Remove from internal array
			this.removeNotification(oldestNotification, false); // Remove from DOM, but don't re-splice array
		}

		// Apply current filter
		this._applyNotificationFilter(this.currentFilter);
	}

	/**
	 * Adds subtle interactive effects to existing notifications when a new one appears.
	 * @param {HTMLElement} newNotification - The newly added notification.
	 * @private
	 */
	_addInteractiveEffects(newNotification) {
		if (this.isDestroyed) return;

		const existingNotifications = this.notifications.filter(n => n !== newNotification && n.parentNode);
		existingNotifications.forEach((notification, index) => {
			if (this.isDestroyed) return;

			const delay = index * 30; // Stagger the ripple effect
			const timeoutId = setTimeout(() => {
				if (!this.isDestroyed && notification.parentNode) {
					// Apply temporary transform and transition
					notification.style.transform = "translateX(-2px) scale(1.01)";
					notification.style.transition = "transform 0.2s ease-out";

					const resetTimeoutId = setTimeout(() => {
						if (!this.isDestroyed && notification.parentNode) {
							notification.style.transform = ""; // Reset transform
							notification.style.transition = ""; // Reset transition
						}
						this.timeouts.delete(resetTimeoutId);
					}, 200);
					this.timeouts.add(resetTimeoutId);
				}
				this.timeouts.delete(timeoutId);
			}, delay);
			this.timeouts.add(timeoutId);
		});
	}

	/**
	 * Removes a notification from the DOM and internal array.
	 * @param {HTMLElement} notification - The notification element to remove.
	 * @param {boolean} [updateArray=true] - Whether to remove from the `this.notifications` array.
	 */
	removeNotification(notification, updateArray = true) {
		if (!notification || !notification.parentNode || this.isDestroyed) return;

		// Clean up event listeners associated with this specific notification element
		this._cleanupEventListeners(notification);

		// Remove any existing animation classes before adding exit animation
		notification.classList.remove(this.cssClasses.ANIMATE_IN);
		notification.classList.remove(this.cssClasses.SLIDE_UP); // Ensure clean state

		notification.offsetHeight; // Force reflow to ensure removal of animate-in is applied

		// Add exit animation
		notification.classList.add(this.cssClasses.ANIMATE_OUT);

		// Add slide-up effect to remaining notifications after a short delay
		const effectTimeoutId = setTimeout(() => {
			this._addRemovalEffects(notification);
			this.timeouts.delete(effectTimeoutId);
		}, 150); // Start slide-up while the notification is still animating out
		this.timeouts.add(effectTimeoutId);

		const timeoutId = setTimeout(() => {
			if (notification.parentNode && !this.isDestroyed) {
				notification.parentNode.removeChild(notification);
			}
			if (updateArray && !this.isDestroyed) {
				const index = this.notifications.indexOf(notification);
				if (index > -1) {
					this.notifications.splice(index, 1);
				}
			}
			this.timeouts.delete(timeoutId);
		}, 600); // Match CSS animation duration + buffer
		this.timeouts.add(timeoutId);
	}

	/**
	 * Cleans up event listeners tracked for a specific element (or its children).
	 * @param {HTMLElement} keyElement - The key used in the WeakMap (usually the notification element itself).
	 * @private
	 */
	_cleanupEventListeners(keyElement) {
		const listeners = this.eventListeners.get(keyElement);
		if (listeners) {
			listeners.forEach(({ element, event, handler }) => {
				if (element && element.removeEventListener) {
					element.removeEventListener(event, handler);
				}
			});
			this.eventListeners.delete(keyElement);
		}
	}

	/**
	 * Adds an elegant slide-up effect to remaining notifications when one is removed.
	 * @param {HTMLElement} removingNotification - The notification being removed.
	 * @private
	 */
	_addRemovalEffects(removingNotification) {
		if (this.isDestroyed) return;

		const remainingNotifications = this.notifications.filter(n => n !== removingNotification && n.parentNode);
		remainingNotifications.forEach((notification, index) => {
			if (this.isDestroyed) return;

			const delay = index * 50; // Stagger the slide-up effect
			const timeoutId = setTimeout(() => {
				if (!this.isDestroyed && notification.parentNode) {
					// Remove any existing animation classes
					notification.classList.remove(this.cssClasses.SLIDE_UP);
					notification.offsetHeight; // Force reflow

					// Add slide-up animation
					notification.classList.add(this.cssClasses.SLIDE_UP);

					// Clean up animation class after animation completes
					const cleanupTimeoutId = setTimeout(() => {
						if (!this.isDestroyed && notification.parentNode) {
							notification.classList.remove(this.cssClasses.SLIDE_UP);
						}
						this.timeouts.delete(cleanupTimeoutId);
					}, 500); // Match CSS animation duration
					this.timeouts.add(cleanupTimeoutId);
				}
				this.timeouts.delete(timeoutId);
			}, delay);
			this.timeouts.add(timeoutId);
		});
	}

	/**
	 * Adds copy and filter control buttons to the DOM.
	 * @private
	 */
	_addControlButtons() {
		if (this.isDestroyed) return;

		this._removeExistingButtons(); // Ensure no duplicates

		if (this.options.enableCopy) {
			this._addCopyButton();
		}
		if (this.options.enableFiltering) {
			this._addFilterButton();
		}
	}

	/**
	 * Removes existing control buttons and their associated event listeners.
	 * @private
	 */
	_removeExistingButtons() {
		const existingButtons = document.querySelectorAll(`.${this.cssClasses.COPY_BUTTON}, .${this.cssClasses.FILTER_BUTTON}`);
		existingButtons.forEach(btn => {
			this._cleanupEventListeners(btn); // Clean up any stored event listeners for the button itself
			btn.remove();
		});
	}

	/**
	 * Adds the copy button to the DOM.
	 * @private
	 */
	_addCopyButton() {
		if (!document.body) return;

		const copyButton = document.createElement("div");
		copyButton.className = this.cssClasses.COPY_BUTTON;
		copyButton.innerHTML = EMOJIS.COPY_DEFAULT;
		copyButton.title = "Copy notifications";

		const clickHandler = () => this._showCopyOptionsMenu(copyButton);
		this._addAndTrackListener(copyButton, "click", clickHandler, copyButton); // Track button's own listener

		document.body.appendChild(copyButton);
	}

	/**
	 * Adds the filter button to the DOM.
	 * @private
	 */
	_addFilterButton() {
		if (!document.body) return;

		const filterButton = document.createElement("div");
		filterButton.className = this.cssClasses.FILTER_BUTTON;
		filterButton.innerHTML = EMOJIS.FILTER_ALL;
		filterButton.title = "Filter notifications";

		const clickHandler = () => this._showFilterOptionsMenu(filterButton);
		this._addAndTrackListener(filterButton, "click", clickHandler, filterButton); // Track button's own listener

		document.body.appendChild(filterButton);
	}

	/**
	 * Displays the copy options menu.
	 * @param {HTMLElement} copyButton - The copy button element.
	 * @private
	 */
	_showCopyOptionsMenu(copyButton) {
		if (this.isDestroyed) return;
		this._removeExistingMenus();

		const menu = document.createElement("div");
		menu.className = this.cssClasses.COPY_MENU;
		menu.innerHTML = `
			<div class="${this.cssClasses.MENU_ITEM}" data-${DATA_ATTRIBUTES.FORMAT}="text" data-${DATA_ATTRIBUTES.FILTER}="all">All as Text</div>
			<div class="${this.cssClasses.MENU_ITEM}" data-${DATA_ATTRIBUTES.FORMAT}="json" data-${DATA_ATTRIBUTES.FILTER}="all">All as JSON</div>
			<div class="${this.cssClasses.MENU_ITEM}" data-${DATA_ATTRIBUTES.FORMAT}="csv" data-${DATA_ATTRIBUTES.FILTER}="all">All as CSV</div>
			<div class="${this.cssClasses.MENU_DIVIDER}"></div>
			<div class="${this.cssClasses.MENU_ITEM}" data-${DATA_ATTRIBUTES.FORMAT}="text" data-${DATA_ATTRIBUTES.FILTER}="error">Errors Only</div>
			<div class="${this.cssClasses.MENU_ITEM}" data-${DATA_ATTRIBUTES.FORMAT}="text" data-${DATA_ATTRIBUTES.FILTER}="success">Success Only</div>
			<div class="${this.cssClasses.MENU_ITEM}" data-${DATA_ATTRIBUTES.FORMAT}="text" data-${DATA_ATTRIBUTES.FILTER}="info">Info Only</div>
		`;

		if (!document.body) return;
		document.body.appendChild(menu);

		const menuClickHandler = e => {
			const item = e.target.closest(`.${this.cssClasses.MENU_ITEM}`);
			if (item) {
				const format = item.dataset[DATA_ATTRIBUTES.FORMAT];
				const filter = item.dataset[DATA_ATTRIBUTES.FILTER];
				this._exportNotifications(format, filter, copyButton);
				menu.remove();
			}
		};
		// Attach listener to menu, use menu as key for cleanup
		this._addAndTrackListener(menu, "click", menuClickHandler, menu);

		// Close menu when clicking outside
		const closeMenuHandler = e => {
			if (!menu.contains(e.target) && !copyButton.contains(e.target)) {
				menu.remove();
				this._cleanupEventListeners(document); // Remove this specific listener from document
			}
		};
		// Add with a timeout to prevent immediate close if click initiated from button
		const timeoutId = setTimeout(() => {
			this._addAndTrackListener(document, "click", closeMenuHandler, document); // Track document-level listener
			this.timeouts.delete(timeoutId);
		}, 100);
		this.timeouts.add(timeoutId);
	}

	/**
	 * Displays the filter options menu.
	 * @param {HTMLElement} filterButton - The filter button element.
	 * @private
	 */
	_showFilterOptionsMenu(filterButton) {
		if (this.isDestroyed) return;
		this._removeExistingMenus();

		const menu = document.createElement("div");
		menu.className = this.cssClasses.FILTER_MENU;
		menu.innerHTML = `
			<div class="${this.cssClasses.MENU_ITEM} ${this.currentFilter === "all" ? this.cssClasses.ACTIVE : ""}" data-${DATA_ATTRIBUTES.FILTER}="all">All Types</div>
			<div class="${this.cssClasses.MENU_ITEM} ${this.currentFilter === "error" ? this.cssClasses.ACTIVE : ""}" data-${DATA_ATTRIBUTES.FILTER}="error">Errors</div>
			<div class="${this.cssClasses.MENU_ITEM} ${this.currentFilter === "success" ? this.cssClasses.ACTIVE : ""}" data-${DATA_ATTRIBUTES.FILTER}="success">Success</div>
			<div class="${this.cssClasses.MENU_ITEM} ${this.currentFilter === "info" ? this.cssClasses.ACTIVE : ""}" data-${DATA_ATTRIBUTES.FILTER}="info">Info</div>
		`;

		if (!document.body) return;
		document.body.appendChild(menu);

		const menuClickHandler = e => {
			const item = e.target.closest(`.${this.cssClasses.MENU_ITEM}`);
			if (item) {
				const filter = item.dataset[DATA_ATTRIBUTES.FILTER];
				this.currentFilter = filter;
				this._applyNotificationFilter(filter);
				this._updateFilterButtonAppearance(filterButton, this._getFilterEmoji(filter));
				menu.remove();
			}
		};
		this._addAndTrackListener(menu, "click", menuClickHandler, menu);

		// Close menu when clicking outside
		const closeMenuHandler = e => {
			if (!menu.contains(e.target) && !filterButton.contains(e.target)) {
				menu.remove();
				this._cleanupEventListeners(document);
			}
		};
		const timeoutId = setTimeout(() => {
			this._addAndTrackListener(document, "click", closeMenuHandler, document);
			this.timeouts.delete(timeoutId);
		}, 100);
		this.timeouts.add(timeoutId);
	}

	/**
	 * Removes any currently active copy or filter menus.
	 * @private
	 */
	_removeExistingMenus() {
		const existingMenus = document.querySelectorAll(`.${this.cssClasses.COPY_MENU}, .${this.cssClasses.FILTER_MENU}`);
		existingMenus.forEach(menu => {
			this._cleanupEventListeners(menu); // Clean up menu's own listeners
			menu.remove();
		});
	}

	/**
	 * Applies the specified filter to visible notifications.
	 * @param {string} filter - The type to filter by ('all', 'error', 'success', 'info').
	 * @private
	 */
	_applyNotificationFilter(filter) {
		if (this.isDestroyed) return;

		this.notifications.forEach(notification => {
			const type = notification.dataset[DATA_ATTRIBUTES.TYPE];
			const shouldShow = filter === "all" || type === filter;

			notification.classList.toggle(this.cssClasses.FILTER_HIDDEN, !shouldShow);
			notification.classList.toggle(this.cssClasses.FILTER_VISIBLE, shouldShow);
		});
	}

	/**
	 * Updates the visual appearance of the filter button.
	 * @param {HTMLElement} filterButton - The filter button element.
	 * @param {string} emoji - The emoji to display on the button.
	 * @private
	 */
	_updateFilterButtonAppearance(filterButton, emoji) {
		if (filterButton && emoji) {
			filterButton.innerHTML = emoji;
		}
	}

	/**
	 * Returns the emoji corresponding to a filter type.
	 * @param {string} filter - The filter type.
	 * @returns {string} The emoji character.
	 * @private
	 */
	_getFilterEmoji(filter) {
		switch (filter) {
			case "all":
				return EMOJIS.FILTER_ALL;
			case "error":
				return EMOJIS.FILTER_ERROR;
			case "success":
				return EMOJIS.FILTER_SUCCESS;
			case "info":
				return EMOJIS.FILTER_INFO;
			default:
				return EMOJIS.FILTER_ALL;
		}
	}

	/**
	 * Exports notifications based on format and filter, then copies to clipboard.
	 * @param {string} format - The desired output format ('text', 'json', 'csv').
	 * @param {string} filter - The type filter ('all', 'error', 'success', 'info').
	 * @param {HTMLElement} copyButton - The copy button element for feedback.
	 * @private
	 */
	_exportNotifications(format, filter, copyButton) {
		if (this.isDestroyed) return;

		const filteredNotifications = this._getFilteredNotifications(filter);

		let exportedData;
		switch (format) {
			case "json":
				exportedData = this._formatAsJSON(filteredNotifications, filter);
				break;
			case "csv":
				exportedData = this._formatAsCSV(filteredNotifications, filter);
				break;
			default: // 'text' or any unknown
				exportedData = this._formatAsText(filteredNotifications, filter);
		}

		this._copyToClipboard(exportedData, copyButton, { format, filter });
	}

	/**
	 * Filters the internal list of notifications.
	 * @param {string} filter - The type to filter by.
	 * @returns {HTMLElement[]} An array of filtered notification elements.
	 * @private
	 */
	_getFilteredNotifications(filter) {
		return this.notifications.filter(notification => {
			if (!notification.dataset) return false;
			const type = notification.dataset[DATA_ATTRIBUTES.TYPE];
			return filter === "all" || type === filter;
		});
	}

	/**
	 * Formats notifications as plain text.
	 * @param {HTMLElement[]} notifications - Array of notification elements.
	 * @param {string} filter - The filter used for context.
	 * @returns {string} Formatted text.
	 * @private
	 */
	_formatAsText(notifications, filter) {
		const header = `=== NOTIFICATIONS EXPORT (${filter.toUpperCase()}) ===\n` + `Exported: ${new Date().toLocaleString()}\n` + `Total: ${notifications.length} notifications\n\n`;

		const content = notifications
			.map((notification, index) => {
				const type = (notification.dataset[DATA_ATTRIBUTES.TYPE] || "unknown").toUpperCase();
				const timestamp = notification.dataset[DATA_ATTRIBUTES.TIMESTAMP] ? new Date(notification.dataset[DATA_ATTRIBUTES.TIMESTAMP]).toLocaleString() : "Unknown";
				const text = this._extractNotificationText(notification);

				return `[${index + 1}] ${type} - ${timestamp}\n${text}\n`;
			})
			.join("\n");

		return header + content;
	}

	/**
	 * Formats notifications as JSON string.
	 * @param {HTMLElement[]} notifications - Array of notification elements.
	 * @param {string} filter - The filter used for context.
	 * @returns {string} Formatted JSON string.
	 * @private
	 */
	_formatAsJSON(notifications, filter) {
		const data = {
			export_info: {
				filter: filter,
				exported_at: new Date().toISOString(),
				total_count: notifications.length
			},
			notifications: notifications.map((notification, index) => ({
				index: index + 1,
				type: notification.dataset[DATA_ATTRIBUTES.TYPE] || "unknown",
				priority: notification.dataset[DATA_ATTRIBUTES.PRIORITY] || "unknown",
				timestamp: notification.dataset[DATA_ATTRIBUTES.TIMESTAMP] || new Date().toISOString(),
				text: this._extractNotificationText(notification)
			}))
		};
		return JSON.stringify(data, null, 2);
	}

	/**
	 * Formats notifications as CSV string.
	 * @param {HTMLElement[]} notifications - Array of notification elements.
	 * @param {string} filter - The filter used for context.
	 * @returns {string} Formatted CSV string.
	 * @private
	 */
	_formatAsCSV(notifications, filter) {
		const header = "Index,Type,Priority,Timestamp,Text\n";
		const rows = notifications
			.map((notification, index) => {
				const type = notification.dataset[DATA_ATTRIBUTES.TYPE] || "unknown";
				const priority = notification.dataset[DATA_ATTRIBUTES.PRIORITY] || "";
				const timestamp = notification.dataset[DATA_ATTRIBUTES.TIMESTAMP] || new Date().toISOString();
				// Sanitize text for CSV: replace double quotes with two double quotes, enclose in double quotes
				const text = `"${this._extractNotificationText(notification).replace(/"/g, '""')}"`;

				return `${index + 1},"${type}","${priority}","${timestamp}",${text}`;
			})
			.join("\n");
		return header + rows;
	}

	/**
	 * Extracts the full text content from a notification element.
	 * @param {HTMLElement} notification - The notification element.
	 * @returns {string} The combined title and details text.
	 * @private
	 */
	_extractNotificationText(notification) {
		if (!notification) return "";

		const titleElement = notification.querySelector(`.${this.cssClasses.TITLE}`);
		const detailsElement = notification.querySelector(`.${this.cssClasses.DETAILS_CONTENT}`);

		let text = titleElement ? titleElement.textContent.trim() : "";
		if (detailsElement && detailsElement.textContent.trim()) {
			text += "\n" + detailsElement.textContent.trim();
		}
		return text;
	}

	/**
	 * Copies text to the clipboard, preferring the modern Clipboard API.
	 * Provides visual feedback on the button.
	 * @param {string} text - The text to copy.
	 * @param {HTMLElement} button - The button element for feedback.
	 * @param {object} formatInfo - Information about the format (for feedback).
	 * @private
	 */
	async _copyToClipboard(text, button, formatInfo) {
		if (this.isDestroyed) return;

		try {
			if (navigator.clipboard && window.isSecureContext) {
				await navigator.clipboard.writeText(text);
				this._showCopyFeedback(button, true, formatInfo);
			} else {
				// Fallback for older browsers or non-secure contexts
				this._fallbackCopyToClipboard(text, button, formatInfo);
			}
		} catch (error) {
			console.error("NotificationManager: Failed to copy to clipboard:", error);
			this._fallbackCopyToClipboard(text, button, formatInfo);
		}
	}

	/**
	 * Fallback method for copying text to clipboard using a temporary textarea.
	 * @param {string} text - The text to copy.
	 * @param {HTMLElement} button - The button element for feedback.
	 * @param {object} formatInfo - Information about the format (for feedback).
	 * @private
	 */
	_fallbackCopyToClipboard(text, button, formatInfo) {
		if (this.isDestroyed || !document.body) return;

		const textArea = document.createElement("textarea");
		textArea.value = text;
		// Position off-screen
		textArea.style.position = "fixed";
		textArea.style.left = "-999999px";
		textArea.style.top = "-999999px";
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();

		try {
			const successful = document.execCommand("copy");
			this._showCopyFeedback(button, successful, formatInfo);
		} catch (error) {
			console.error("NotificationManager: Fallback copy failed:", error);
			this._showCopyFeedback(button, false, formatInfo);
		} finally {
			if (document.body.contains(textArea)) {
				document.body.removeChild(textArea);
			}
		}
	}

	/**
	 * Shows visual feedback on the copy button after a copy attempt.
	 * @param {HTMLElement} button - The button element.
	 * @param {boolean} success - True if copy was successful, false otherwise.
	 * @param {object} formatInfo - Contextual info about the copy operation.
	 * @private
	 */
	_showCopyFeedback(button, success, formatInfo = {}) {
		if (this.isDestroyed || !button) return;

		const originalClass = button.className;
		const originalContent = EMOJIS.COPY_DEFAULT; // Always revert to default copy icon

		button.classList.add(success ? "success" : "error");
		button.innerHTML = success ? EMOJIS.COPY_SUCCESS : EMOJIS.COPY_ERROR;

		const timeoutId = setTimeout(() => {
			if (!this.isDestroyed && button) {
				button.className = originalClass; // Restore original classes
				button.innerHTML = originalContent; // Restore original icon
			}
			this.timeouts.delete(timeoutId);
		}, 2000);
		this.timeouts.add(timeoutId);
	}

	/**
	 * Determines the priority of a notification based on its type and text content.
	 * @param {string} type - The notification type.
	 * @param {string} text - The notification text content.
	 * @returns {string} The determined priority ('critical', 'error', 'warning', 'success', 'info').
	 * @private
	 */
	_determinePriority(type, text) {
		if (!text || typeof text !== "string") return "info";

		const lowerText = text.toLowerCase();

		if (type === "error") {
			if (lowerText.includes("critical") || lowerText.includes("fatal") || lowerText.includes("failure")) {
				return "critical";
			}
			return "error";
		}
		if (type === "warning" || lowerText.includes("warning") || lowerText.includes("warn")) {
			return "warning";
		}
		if (type === "success") {
			return "success";
		}
		return "info";
	}

	/**
	 * Returns configuration for a given priority level.
	 * @param {string} priority - The priority level.
	 * @returns {object} Configuration object with color and pulse status.
	 * @private
	 */
	_getPriorityConfig(priority) {
		return DEFAULT_PRIORITY_CONFIGS[priority] || DEFAULT_PRIORITY_CONFIGS.info;
	}

	/**
	 * Applies CSS styles and classes based on notification priority.
	 * @param {HTMLElement} notification - The notification element.
	 * @param {string} priority - The determined priority.
	 * @param {object} priorityConfig - The configuration for this priority.
	 * @private
	 */
	_applyPriorityStyles(notification, priority, priorityConfig) {
		if (!notification || this.isDestroyed) return;

		notification.classList.add(`${this.cssClasses.PRIORITY_PREFIX}${priority}`);

		if (priorityConfig.shouldPulse) {
			notification.style.animation = "pulse-critical 2s infinite";
		} else {
			// Ensure animation is removed if priority changes from critical
			notification.style.animation = "";
		}
	}

	/**
	 * Returns the appropriate icon for a notification type.
	 * @param {string} type - The notification type.
	 * @returns {string} The icon character.
	 * @private
	 */
	_getTypeIcon(type) {
		switch (type) {
			case "success":
				return EMOJIS.SUCCESS;
			case "error":
				return EMOJIS.ERROR;
			case "warning":
				return EMOJIS.WARNING;
			case "info":
				return EMOJIS.INFO;
			default:
				return EMOJIS.INFO;
		}
	}

	// --- Public API methods ---

	/**
	 * Clears all currently displayed notifications.
	 */
	clear() {
		if (this.isDestroyed) return;

		// Create a copy to iterate while modifying the original array
		const notificationsToRemove = [...this.notifications];
		notificationsToRemove.forEach(notification => this.removeNotification(notification, false)); // Don't update array per removal
		this.notifications = []; // Clear array once all removals are initiated
	}

	/**
	 * Expands all notifications that have details.
	 */
	expandAll() {
		if (this.isDestroyed) return;

		this.notifications.forEach(notification => {
			if (notification.querySelector(`.${this.cssClasses.DETAILS}`)) {
				this.expandNotification(notification);
			}
		});
	}

	/**
	 * Collapses all notifications that have details.
	 */
	collapseAll() {
		if (this.isDestroyed) return;

		this.notifications.forEach(notification => {
			if (notification.querySelector(`.${this.cssClasses.DETAILS}`)) {
				this.collapseNotification(notification);
			}
		});
	}

	/**
	 * Sets whether auto-collapse is enabled.
	 * @param {boolean} enabled - True to enable, false to disable.
	 */
	setAutoCollapse(enabled) {
		this.autoCollapseEnabled = !!enabled;
	}

	/**
	 * Returns a copy of the currently displayed notifications.
	 * @returns {HTMLElement[]} An array of notification elements.
	 */
	getNotifications() {
		return this.isDestroyed ? [] : [...this.notifications];
	}

	/**
	 * Returns a copy of notifications filtered by type.
	 * @param {string} type - The type to filter by.
	 * @returns {HTMLElement[]} An array of filtered notification elements.
	 */
	getNotificationsByType(type) {
		return this.isDestroyed ? [] : this.notifications.filter(n => n.dataset && n.dataset[DATA_ATTRIBUTES.TYPE] === type);
	}

	/**
	 * Destroys the notification manager instance, cleaning up all DOM elements,
	 * event listeners, and timers to prevent memory leaks.
	 */
	destroy() {
		if (this.isDestroyed) return;

		this.isDestroyed = true;

		// Clear all pending timeouts
		this.timeouts.forEach(timeoutId => clearTimeout(timeoutId));
		this.timeouts.clear();

		// Clear specific queue timeouts
		if (this.processingQueueTimeoutId) {
			clearTimeout(this.processingQueueTimeoutId);
			this.processingQueueTimeoutId = null;
		}
		if (this.staggerTimeoutId) {
			clearTimeout(this.staggerTimeoutId);
			this.staggerTimeoutId = null;
		}

		// Clean up all tracked event listeners
		this.eventListeners.forEach(listeners => {
			listeners.forEach(({ element: el, event, handler }) => {
				if (el && el.removeEventListener) {
					el.removeEventListener(event, handler);
				}
			});
		});
		this.eventListeners = new WeakMap();

		// Remove all notifications from DOM
		this.clear(); // This will also remove individual notification listeners

		// Remove control buttons and menus
		this._removeExistingButtons();
		this._removeExistingMenus();

		// Remove the main container
		if (this.container && this.container.parentNode) {
			this.container.parentNode.removeChild(this.container);
		}

		// Clear references to prevent memory cycles
		this.container = null;
		this.notifications = [];
		this.notificationQueue = [];
		this.isProcessingQueue = false;
	}
}

// Static utility methods
export const NotificationUtils = {
	/**
	 * Creates a new NotificationManager instance.
	 * @param {object} options - Options for the manager.
	 * @returns {NotificationManager} A new NotificationManager instance.
	 */
	createManager(options) {
		return new NotificationManager(options);
	},

	/**
	 * Shows a quick, temporary notification using a dedicated temporary manager.
	 * This manager will be destroyed after the notification's duration plus a buffer.
	 * @param {string} text - The content of the notification.
	 * @param {string} type - The type of notification.
	 * @param {number} duration - The duration in milliseconds.
	 * @returns {HTMLElement|null} The created notification element, or null if creation failed.
	 */
	showQuickNotification(text, type = "info", duration = 3000) {
		if (!text || typeof text !== "string") {
			console.error("NotificationUtils: Quick notification text must be a string.");
			return null;
		}

		// Create a temporary manager specific for quick notifications
		const tempManager = new NotificationManager({
			containerSelector: ".quick-notification-container", // Use a separate container if desired, or let it fall back
			position: "bottom-center", // Example: position quick notifications differently
			autoCollapse: true,
			maxNotifications: 1, // Usually only one quick notification at a time
			defaultDuration: duration,
			enableFiltering: false,
			enableCopy: false,
			customClasses: {
				container: "quick-notification-container" // Custom class for quick notifs container
			}
		});

		const notification = tempManager.show(text, type, null, duration);

		// Schedule the temporary manager's destruction after the notification is expected to be gone
		if (notification && duration > 0) {
			const destroyTimeout = setTimeout(() => {
				if (tempManager.container && !tempManager.notifications.length) {
					// Only destroy if the container exists and no other notifications are left
					tempManager.destroy();
				}
			}, duration + 500); // Add a small buffer after notification removal
			// Add this timeout to the tempManager's own timeouts for proper cleanup
			tempManager.timeouts.add(destroyTimeout);
		} else if (notification && duration === 0) {
			// If duration is 0, notification is manually closed. Temp manager might linger.
			// Could add a mechanism to destroy it upon manual removal of the last notification.
		}

		return notification;
	}
};

export default NotificationManager;
