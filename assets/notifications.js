/**
 * Modular Notification System
 * Extracted from quiz component for reusability across different components
 */

export class NotificationManager {
	constructor(options = {}) {
		this.options = {
			containerSelector: ".quiz-background-notifications",
			position: "top-right",
			autoCollapse: true,
			maxNotifications: 50,
			defaultDuration: 5000,
			enableFiltering: true,
			enableCopy: true,
			...options
		};

		this.notifications = [];
		this.currentFilter = "all";
		this.autoCollapseEnabled = this.options.autoCollapse;

		this.init();
	}

	init() {
		this.createContainer();
		if (this.options.enableFiltering || this.options.enableCopy) {
			this.addControlButtons();
		}
	}

	createContainer() {
		let container = document.querySelector(this.options.containerSelector);
		if (!container) {
			container = document.createElement("div");
			container.className = "quiz-background-notifications";
			document.body.appendChild(container);
		}
		this.container = container;
	}

	show(text, type = "info", priority = null, duration = null) {
		const notification = this.createNotification(text, type, priority, duration);
		this.addNotification(notification);
		return notification;
	}

	createNotification(text, type = "info", priority = null, duration = null) {
		const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const actualPriority = priority || this.determinePriority(type, text);
		const notificationDuration = duration || this.options.defaultDuration;

		const notification = document.createElement("div");
		notification.className = `quiz-notification quiz-notification-${type}`;
		notification.id = id;
		notification.dataset.type = type;
		notification.dataset.priority = actualPriority;
		notification.dataset.timestamp = new Date().toISOString();

		// Apply priority styling
		this.applyPriorityStyles(notification, actualPriority, this.getPriorityConfig(actualPriority));

		// Determine if notification should be expandable
		const isExpandable = text.length > 100 || text.includes("\n") || text.includes("|");

		if (isExpandable) {
			this.createExpandableNotification(notification, text, type);
		} else {
			this.createSimpleNotification(notification, text, type);
		}

		// Auto-remove after duration
		if (notificationDuration > 0) {
			setTimeout(() => {
				this.removeNotification(notification);
			}, notificationDuration);
		}

		return notification;
	}

	createExpandableNotification(notification, text, type) {
		const [title, ...details] = text.split("\n");
		const detailsText = details.join("\n");

		notification.innerHTML = `
			<div class="quiz-notification-header">
				<div class="quiz-notification-content">
					<div class="quiz-notification-icon">${this.getTypeIcon(type)}</div>
					<div class="quiz-notification-title">${title}</div>
				</div>
				<div class="quiz-notification-toggle">
					<svg width="12" height="8" viewBox="0 0 12 8" fill="none">
						<path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</div>
			</div>
			<div class="quiz-notification-details">
				<div class="quiz-notification-details-content">${detailsText}</div>
			</div>
			<div class="quiz-notification-close">×</div>
			<div class="quiz-notification-shimmer"></div>
		`;

		this.attachExpandableListeners(notification);
	}

	createSimpleNotification(notification, text, type) {
		notification.innerHTML = `
			<div class="quiz-notification-simple">
				<div class="quiz-notification-simple-icon">${this.getTypeIcon(type)}</div>
				<div class="quiz-notification-simple-text">${text}</div>
			</div>
			<div class="quiz-notification-close">×</div>
			<div class="quiz-notification-shimmer"></div>
		`;

		this.attachSimpleListeners(notification);
	}

	attachExpandableListeners(notification) {
		const header = notification.querySelector(".quiz-notification-header");
		const toggle = notification.querySelector(".quiz-notification-toggle");
		const closeBtn = notification.querySelector(".quiz-notification-close");

		header.addEventListener("click", () => this.toggleNotification(notification));
		closeBtn.addEventListener("click", e => {
			e.stopPropagation();
			this.removeNotification(notification);
		});
	}

	attachSimpleListeners(notification) {
		const closeBtn = notification.querySelector(".quiz-notification-close");
		closeBtn.addEventListener("click", () => this.removeNotification(notification));
	}

	toggleNotification(notification) {
		const details = notification.querySelector(".quiz-notification-details");
		const toggle = notification.querySelector(".quiz-notification-toggle");

		if (details.classList.contains("expanded")) {
			this.collapseNotification(notification);
		} else {
			this.expandNotification(notification);
		}
	}

	expandNotification(notification) {
		const details = notification.querySelector(".quiz-notification-details");
		const toggle = notification.querySelector(".quiz-notification-toggle");

		if (details) {
			details.classList.add("expanded");
			details.style.maxHeight = details.scrollHeight + "px";
		}
		if (toggle) {
			toggle.classList.add("expanded");
		}

		if (this.autoCollapseEnabled) {
			setTimeout(() => {
				this.collapseNotification(notification);
			}, 8000);
		}
	}

	collapseNotification(notification) {
		const details = notification.querySelector(".quiz-notification-details");
		const toggle = notification.querySelector(".quiz-notification-toggle");

		if (details) {
			details.classList.remove("expanded");
			details.style.maxHeight = "0";
		}
		if (toggle) {
			toggle.classList.remove("expanded");
		}
	}

	addNotification(notification) {
		this.notifications.push(notification);
		this.container.appendChild(notification);

		// Trigger animation
		requestAnimationFrame(() => {
			notification.classList.add("animate-in");
		});

		// Manage notification count
		if (this.notifications.length > this.options.maxNotifications) {
			const oldestNotification = this.notifications.shift();
			this.removeNotification(oldestNotification, false);
		}

		// Apply current filter
		this.applyNotificationFilter(this.currentFilter);
	}

	removeNotification(notification, updateArray = true) {
		if (!notification || !notification.parentNode) return;

		notification.classList.add("animate-out");

		setTimeout(() => {
			if (notification.parentNode) {
				notification.parentNode.removeChild(notification);
			}
			if (updateArray) {
				const index = this.notifications.indexOf(notification);
				if (index > -1) {
					this.notifications.splice(index, 1);
				}
			}
		}, 300);
	}

	addControlButtons() {
		this.removeExistingButtons();

		if (this.options.enableCopy) {
			this.addCopyButton();
		}
		if (this.options.enableFiltering) {
			this.addFilterButton();
		}
	}

	removeExistingButtons() {
		const existingButtons = document.querySelectorAll(".quiz-notification-copy-button, .quiz-notification-filter-button");
		existingButtons.forEach(btn => btn.remove());
	}

	addCopyButton() {
		const copyButton = document.createElement("div");
		copyButton.className = "quiz-notification-copy-button";
		copyButton.innerHTML = `
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
				<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
			</svg>
		`;
		copyButton.title = "Copy notifications";

		copyButton.addEventListener("click", () => this.showCopyOptionsMenu(copyButton));
		document.body.appendChild(copyButton);
	}

	addFilterButton() {
		const filterButton = document.createElement("div");
		filterButton.className = "quiz-notification-filter-button";
		filterButton.innerHTML = "🔍";
		filterButton.title = "Filter notifications";

		filterButton.addEventListener("click", () => this.showFilterOptionsMenu(filterButton));
		document.body.appendChild(filterButton);
	}

	showCopyOptionsMenu(copyButton) {
		this.removeExistingMenus();

		const menu = document.createElement("div");
		menu.className = "quiz-copy-options-menu";
		menu.innerHTML = `
			<div class="quiz-copy-options-menu-item" data-format="text" data-filter="all">All as Text</div>
			<div class="quiz-copy-options-menu-item" data-format="json" data-filter="all">All as JSON</div>
			<div class="quiz-copy-options-menu-item" data-format="csv" data-filter="all">All as CSV</div>
			<div class="quiz-copy-options-menu-divider"></div>
			<div class="quiz-copy-options-menu-item" data-format="text" data-filter="error">Errors Only</div>
			<div class="quiz-copy-options-menu-item" data-format="text" data-filter="success">Success Only</div>
			<div class="quiz-copy-options-menu-item" data-format="text" data-filter="info">Info Only</div>
		`;

		document.body.appendChild(menu);

		menu.addEventListener("click", e => {
			const item = e.target.closest(".quiz-copy-options-menu-item");
			if (item) {
				const format = item.dataset.format;
				const filter = item.dataset.filter;
				this.exportNotifications(format, filter, copyButton);
				menu.remove();
			}
		});

		// Close menu when clicking outside
		setTimeout(() => {
			document.addEventListener("click", function closeMenu(e) {
				if (!menu.contains(e.target) && !copyButton.contains(e.target)) {
					menu.remove();
					document.removeEventListener("click", closeMenu);
				}
			});
		}, 100);
	}

	showFilterOptionsMenu(filterButton) {
		this.removeExistingMenus();

		const menu = document.createElement("div");
		menu.className = "quiz-filter-options-menu";
		menu.innerHTML = `
			<div class="quiz-filter-options-menu-item ${this.currentFilter === "all" ? "active" : ""}" data-filter="all">All Types</div>
			<div class="quiz-filter-options-menu-item ${this.currentFilter === "error" ? "active" : ""}" data-filter="error">Errors</div>
			<div class="quiz-filter-options-menu-item ${this.currentFilter === "success" ? "active" : ""}" data-filter="success">Success</div>
			<div class="quiz-filter-options-menu-item ${this.currentFilter === "info" ? "active" : ""}" data-filter="info">Info</div>
		`;

		document.body.appendChild(menu);

		menu.addEventListener("click", e => {
			const item = e.target.closest(".quiz-filter-options-menu-item");
			if (item) {
				const filter = item.dataset.filter;
				this.currentFilter = filter;
				this.applyNotificationFilter(filter);
				this.updateFilterButtonAppearance(filterButton, this.getFilterEmoji(filter));
				menu.remove();
			}
		});

		// Close menu when clicking outside
		setTimeout(() => {
			document.addEventListener("click", function closeMenu(e) {
				if (!menu.contains(e.target) && !filterButton.contains(e.target)) {
					menu.remove();
					document.removeEventListener("click", closeMenu);
				}
			});
		}, 100);
	}

	removeExistingMenus() {
		const existingMenus = document.querySelectorAll(".quiz-copy-options-menu, .quiz-filter-options-menu");
		existingMenus.forEach(menu => menu.remove());
	}

	applyNotificationFilter(filter) {
		this.notifications.forEach(notification => {
			const type = notification.dataset.type;
			const shouldShow = filter === "all" || type === filter;

			notification.classList.toggle("filter-hidden", !shouldShow);
			notification.classList.toggle("filter-visible", shouldShow);
		});
	}

	updateFilterButtonAppearance(filterButton, emoji) {
		filterButton.innerHTML = emoji;
	}

	getFilterEmoji(filter) {
		const emojis = {
			all: "🔍",
			error: "❌",
			success: "✅",
			info: "ℹ️"
		};
		return emojis[filter] || "🔍";
	}

	exportNotifications(format, filter, copyButton) {
		const filteredNotifications = this.getFilteredNotifications(filter);

		let exportedData;
		switch (format) {
			case "json":
				exportedData = this.formatAsJSON(filteredNotifications, filter);
				break;
			case "csv":
				exportedData = this.formatAsCSV(filteredNotifications, filter);
				break;
			default:
				exportedData = this.formatAsText(filteredNotifications, filter);
		}

		this.copyToClipboard(exportedData, copyButton, { format, filter });
	}

	getFilteredNotifications(filter) {
		return this.notifications.filter(notification => {
			const type = notification.dataset.type;
			return filter === "all" || type === filter;
		});
	}

	formatAsText(notifications, filter) {
		const header = `=== NOTIFICATIONS EXPORT (${filter.toUpperCase()}) ===\n` + `Exported: ${new Date().toLocaleString()}\n` + `Total: ${notifications.length} notifications\n\n`;

		const content = notifications
			.map((notification, index) => {
				const type = notification.dataset.type.toUpperCase();
				const timestamp = new Date(notification.dataset.timestamp).toLocaleString();
				const text = this.extractNotificationText(notification);

				return `[${index + 1}] ${type} - ${timestamp}\n${text}\n`;
			})
			.join("\n");

		return header + content;
	}

	formatAsJSON(notifications, filter) {
		const data = {
			export_info: {
				filter: filter,
				exported_at: new Date().toISOString(),
				total_count: notifications.length
			},
			notifications: notifications.map((notification, index) => ({
				index: index + 1,
				type: notification.dataset.type,
				priority: notification.dataset.priority,
				timestamp: notification.dataset.timestamp,
				text: this.extractNotificationText(notification)
			}))
		};

		return JSON.stringify(data, null, 2);
	}

	formatAsCSV(notifications, filter) {
		const header = "Index,Type,Priority,Timestamp,Text\n";
		const rows = notifications
			.map((notification, index) => {
				const type = notification.dataset.type;
				const priority = notification.dataset.priority || "";
				const timestamp = notification.dataset.timestamp;
				const text = this.extractNotificationText(notification).replace(/"/g, '""');

				return `${index + 1},"${type}","${priority}","${timestamp}","${text}"`;
			})
			.join("\n");

		return header + rows;
	}

	extractNotificationText(notification) {
		const titleElement = notification.querySelector(".quiz-notification-title, .quiz-notification-simple-text");
		const detailsElement = notification.querySelector(".quiz-notification-details-content");

		let text = titleElement ? titleElement.textContent.trim() : "";
		if (detailsElement && detailsElement.textContent.trim()) {
			text += "\n" + detailsElement.textContent.trim();
		}

		return text;
	}

	async copyToClipboard(text, button, formatInfo) {
		try {
			if (navigator.clipboard && window.isSecureContext) {
				await navigator.clipboard.writeText(text);
				this.showCopyFeedback(button, true, formatInfo);
			} else {
				this.fallbackCopyToClipboard(text, button, formatInfo);
			}
		} catch (error) {
			this.fallbackCopyToClipboard(text, button, formatInfo);
		}
	}

	fallbackCopyToClipboard(text, button, formatInfo) {
		const textArea = document.createElement("textarea");
		textArea.value = text;
		textArea.style.position = "fixed";
		textArea.style.left = "-999999px";
		textArea.style.top = "-999999px";
		document.body.appendChild(textArea);
		textArea.focus();
		textArea.select();

		try {
			const successful = document.execCommand("copy");
			this.showCopyFeedback(button, successful, formatInfo);
		} catch (error) {
			this.showCopyFeedback(button, false, formatInfo);
		} finally {
			document.body.removeChild(textArea);
		}
	}

	showCopyFeedback(button, success, formatInfo = {}) {
		const originalClass = button.className;
		const originalContent = button.innerHTML;

		if (success) {
			button.classList.add("success");
			button.innerHTML = `
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<polyline points="20,6 9,17 4,12"></polyline>
				</svg>
			`;
		} else {
			button.classList.add("error");
			button.innerHTML = `
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<line x1="18" y1="6" x2="6" y2="18"></line>
					<line x1="6" y1="6" x2="18" y2="18"></line>
				</svg>
			`;
		}

		setTimeout(() => {
			button.className = originalClass;
			button.innerHTML = originalContent;
		}, 2000);
	}

	determinePriority(type, text) {
		const lowerText = text.toLowerCase();

		if (type === "error") {
			if (lowerText.includes("critical") || lowerText.includes("fatal")) {
				return "critical";
			}
			return "error";
		}

		if (type === "success") {
			return "success";
		}

		if (lowerText.includes("warning") || lowerText.includes("warn")) {
			return "warning";
		}

		return "info";
	}

	getPriorityConfig(priority) {
		const configs = {
			critical: { color: "#dc2626", shouldPulse: true },
			error: { color: "#dc2626", shouldPulse: false },
			warning: { color: "#f59e0b", shouldPulse: false },
			success: { color: "#059669", shouldPulse: false },
			info: { color: "#2563eb", shouldPulse: false }
		};
		return configs[priority] || configs.info;
	}

	applyPriorityStyles(notification, priority, priorityConfig) {
		notification.classList.add(`quiz-notification-priority-${priority}`);

		if (priorityConfig.shouldPulse) {
			notification.style.animation = "pulse-critical 2s infinite";
		}
	}

	getTypeIcon(type) {
		const icons = {
			success: "✓",
			error: "✗",
			warning: "⚠",
			info: "ℹ"
		};
		return icons[type] || "ℹ";
	}

	// Public API methods
	clear() {
		this.notifications.forEach(notification => this.removeNotification(notification, false));
		this.notifications = [];
	}

	expandAll() {
		this.notifications.forEach(notification => {
			if (notification.querySelector(".quiz-notification-details")) {
				this.expandNotification(notification);
			}
		});
	}

	collapseAll() {
		this.notifications.forEach(notification => {
			if (notification.querySelector(".quiz-notification-details")) {
				this.collapseNotification(notification);
			}
		});
	}

	setAutoCollapse(enabled) {
		this.autoCollapseEnabled = enabled;
	}

	getNotifications() {
		return this.notifications;
	}

	getNotificationsByType(type) {
		return this.notifications.filter(n => n.dataset.type === type);
	}

	destroy() {
		this.clear();
		this.removeExistingButtons();
		this.removeExistingMenus();
		if (this.container && this.container.parentNode) {
			this.container.parentNode.removeChild(this.container);
		}
	}
}

// Static utility methods
export const NotificationUtils = {
	createManager(options) {
		return new NotificationManager(options);
	},

	showQuickNotification(text, type = "info", duration = 3000) {
		const tempManager = new NotificationManager({
			enableFiltering: false,
			enableCopy: false,
			autoCollapse: false
		});
		return tempManager.show(text, type, null, duration);
	}
};

export default NotificationManager;
