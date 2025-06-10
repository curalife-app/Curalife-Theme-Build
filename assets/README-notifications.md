# Modular Notification System

A flexible, reusable notification system extracted from the quiz component for use across different components and applications.

## Features

- ✅ **Multiple notification types**: Success, Error, Warning, Info
- ✅ **Priority system**: Critical, Error, Warning, Success, Info with visual indicators
- ✅ **Expandable notifications**: Long messages automatically become expandable
- ✅ **Filtering**: Filter notifications by type
- ✅ **Export functionality**: Copy notifications as Text, JSON, or CSV
- ✅ **Customizable positioning**: 6 different container positions
- ✅ **Auto-collapse**: Configurable auto-removal and collapsing
- ✅ **Mobile responsive**: Optimized for mobile devices
- ✅ **Accessibility**: ARIA labels, keyboard navigation, reduced motion support
- ✅ **Performance**: Efficient DOM management and animations

## Files Structure

```
src/scripts/utils/
├── notifications.js          # Main NotificationManager class
├── notification-config.js    # Configuration constants and defaults
└── README-notifications.md   # This documentation

src/styles/css/components/
└── notifications.css         # Complete notification styles

src/scripts/examples/
└── notification-usage-example.js # Usage examples
```

## Quick Start

### 1. Include the CSS

```html
<!-- In your HTML head or import in your CSS -->
<link rel="stylesheet" href="path/to/src/styles/css/components/notifications.css" />
```

### 2. Basic Usage

```javascript
import { NotificationManager, NotificationUtils } from "./path/to/notifications.js";
import { NOTIFICATION_TYPES } from "./path/to/notification-config.js";

// Create a notification manager
const notifications = new NotificationManager();

// Show notifications
notifications.show("Success message!", NOTIFICATION_TYPES.SUCCESS);
notifications.show("Error occurred!", NOTIFICATION_TYPES.ERROR);
notifications.show("Warning message!", NOTIFICATION_TYPES.WARNING);
notifications.show("Info message!", NOTIFICATION_TYPES.INFO);

// Quick one-off notification (no persistent manager)
NotificationUtils.showQuickNotification("Quick message!", NOTIFICATION_TYPES.INFO);
```

## Configuration Options

```javascript
const notifications = new NotificationManager({
	// Container settings
	containerSelector: ".custom-notifications",
	position: "top-right", // 'top-right', 'top-left', 'bottom-right', etc.

	// Behavior settings
	autoCollapse: true,
	maxNotifications: 50,
	defaultDuration: 5000, // milliseconds (0 = never remove)

	// Feature toggles
	enableFiltering: true,
	enableCopy: true
});
```

### Available Positions

- `top-right` (default)
- `top-left`
- `bottom-right`
- `bottom-left`
- `top-center`
- `bottom-center`

## API Reference

### NotificationManager

#### Constructor

```javascript
new NotificationManager((options = {}));
```

#### Methods

##### `show(text, type, priority, duration)`

Shows a notification.

- `text` (string): The notification message
- `type` (string): 'success', 'error', 'warning', 'info'
- `priority` (string, optional): 'critical', 'error', 'warning', 'success', 'info'
- `duration` (number, optional): Duration in milliseconds (0 = permanent)

```javascript
// Basic notification
notifications.show("Message", "success");

// With custom duration
notifications.show("Temporary message", "info", null, 3000);

// Critical error (never auto-removes, pulses)
notifications.show("Critical error!", "error", "critical", 0);
```

##### `clear()`

Removes all notifications.

```javascript
notifications.clear();
```

##### `expandAll()`

Expands all expandable notifications.

```javascript
notifications.expandAll();
```

##### `collapseAll()`

Collapses all expanded notifications.

```javascript
notifications.collapseAll();
```

##### `setAutoCollapse(enabled)`

Enables/disables auto-collapse feature.

```javascript
notifications.setAutoCollapse(false);
```

##### `getNotifications()`

Returns array of all notification elements.

```javascript
const allNotifications = notifications.getNotifications();
```

##### `getNotificationsByType(type)`

Returns array of notifications of specific type.

```javascript
const errors = notifications.getNotificationsByType("error");
```

##### `destroy()`

Cleans up the notification manager.

```javascript
notifications.destroy();
```

### NotificationUtils

#### `createManager(options)`

Factory function to create a new NotificationManager.

```javascript
const manager = NotificationUtils.createManager({
	position: "bottom-right",
	maxNotifications: 10
});
```

#### `showQuickNotification(text, type, duration)`

Shows a quick notification without creating a persistent manager.

```javascript
NotificationUtils.showQuickNotification("Quick message!", "success", 3000);
```

## Advanced Usage Examples

### E-commerce Integration

```javascript
const cartNotifications = new NotificationManager({
	containerSelector: ".cart-notifications",
	maxNotifications: 5,
	defaultDuration: 3000
});

function addToCart(product) {
	cartNotifications.show(`${product.name} added to cart`, NOTIFICATION_TYPES.SUCCESS);
}

function cartError(message) {
	cartNotifications.show(
		`Cart Error: ${message}`,
		NOTIFICATION_TYPES.ERROR,
		"error",
		0 // Never auto-remove errors
	);
}
```

### Form Validation

```javascript
const formNotifications = new NotificationManager({
	position: NOTIFICATION_POSITIONS.TOP_CENTER,
	maxNotifications: 3,
	enableFiltering: false,
	enableCopy: false
});

function validateForm(data) {
	const errors = [];
	if (!data.email) errors.push("Email required");
	if (!data.password) errors.push("Password required");

	if (errors.length > 0) {
		formNotifications.show(`Validation Errors:\n${errors.join("\n")}`, NOTIFICATION_TYPES.ERROR);
		return false;
	}

	formNotifications.show("Form submitted!", NOTIFICATION_TYPES.SUCCESS);
	return true;
}
```

### API Status Monitoring

```javascript
const apiMonitor = new NotificationManager({
	containerSelector: ".api-notifications",
	position: NOTIFICATION_POSITIONS.BOTTOM_LEFT,
	defaultDuration: 0, // Keep all notifications
	enableFiltering: true,
	enableCopy: true
});

function logApiCall(endpoint, status, responseTime) {
	let type = NOTIFICATION_TYPES.INFO;

	if (status >= 200 && status < 300) type = NOTIFICATION_TYPES.SUCCESS;
	else if (status >= 400 && status < 500) type = NOTIFICATION_TYPES.WARNING;
	else if (status >= 500) type = NOTIFICATION_TYPES.ERROR;

	apiMonitor.show(`API: ${endpoint}\nStatus: ${status}\nTime: ${responseTime}ms`, type);
}
```

### Multi-Manager Application

```javascript
class AppNotifications {
	constructor() {
		this.global = new NotificationManager({
			containerSelector: ".global-notifications",
			position: "top-right"
		});

		this.debug = new NotificationManager({
			containerSelector: ".debug-notifications",
			position: "bottom-right",
			enableFiltering: true,
			enableCopy: true
		});
	}

	showGlobal(message, type) {
		this.global.show(message, type);
	}

	showDebug(message) {
		if (process.env.NODE_ENV === "development") {
			this.debug.show(`[DEBUG] ${message}`, NOTIFICATION_TYPES.INFO);
		}
	}
}
```

## Styling Customization

The notification system uses CSS custom properties for easy theming:

```css
:root {
	--notification-transition-fast: 0.2s ease;
	--notification-border-radius: 8px;
	--notification-shadow-lg: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* Customize notification colors */
.quiz-notification-success {
	background: linear-gradient(135deg, #your-color 0%, #your-color-dark 100%);
}

/* Custom positioning */
.my-custom-notifications {
	position: fixed;
	top: 10px;
	left: 10px;
	right: 10px;
	max-width: none;
}
```

## Integration with Existing Components

### Replacing Quiz Component Notifications

```javascript
import { NotificationManager } from "./notifications.js";

// In your quiz component
const notifications = new NotificationManager({
	containerSelector: ".quiz-background-notifications"
});

// Replace existing method
this._showBackgroundProcessNotification = (text, type, priority) => {
	return notifications.show(text, type, priority);
};
```

### Event-Driven Notifications

```javascript
const notifications = new NotificationManager();

// Listen for custom events
document.addEventListener("user:login", event => {
	notifications.show(`Welcome back, ${event.detail.username}!`, NOTIFICATION_TYPES.SUCCESS);
});

document.addEventListener("error:api", event => {
	notifications.show(`API Error: ${event.detail.message}`, NOTIFICATION_TYPES.ERROR, "error");
});
```

## Browser Support

- Modern browsers (Chrome 60+, Firefox 55+, Safari 12+, Edge 79+)
- Mobile browsers (iOS Safari 12+, Chrome Mobile 60+)
- Graceful degradation for older browsers

## Performance Considerations

- DOM elements are efficiently managed (old notifications are removed)
- Animations use CSS transitions and transforms for smooth performance
- Event listeners are properly cleaned up
- Memory leaks are prevented through proper cleanup methods

## Accessibility Features

- ARIA labels for screen readers
- Keyboard navigation support
- Focus management
- Respects `prefers-reduced-motion` setting
- High contrast support

## Best Practices

1. **Use appropriate types**: Match notification type to message severity
2. **Limit quantity**: Don't overwhelm users with too many notifications
3. **Consider duration**: Errors should persist longer than success messages
4. **Group related notifications**: Use separate managers for different features
5. **Clean up**: Always call `destroy()` when components unmount
6. **Test accessibility**: Verify with screen readers and keyboard navigation

## Troubleshooting

### Notifications not appearing

- Check that CSS is included
- Verify container element exists
- Check console for JavaScript errors

### Styling issues

- Ensure CSS specificity is correct
- Check for conflicting styles
- Verify CSS custom properties are supported

### Performance issues

- Reduce `maxNotifications` limit
- Increase `defaultDuration` to auto-remove notifications
- Use `clear()` method periodically

## License

This notification system is part of the Curalife Theme Development project and follows the same licensing terms.
