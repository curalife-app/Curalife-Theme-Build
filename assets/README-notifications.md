# Modular Notification System Styles

This file contains all the CSS styles for the modular notification system, extracted from `quiz.css` for reusability across different components.

## Features

- **Fixed Container**: Notifications appear in a fixed position with smooth scrolling
- **Multiple Types**: Success, error, info, and warning notification styles
- **Expandable Content**: Notifications can expand to show detailed information
- **Priority System**: Different priority levels with unique hover effects
- **Control Buttons**: Copy and filter functionality buttons
- **Mobile Responsive**: Optimized for mobile devices
- **Smooth Animations**: CSS animations for entry/exit and interactions

## CSS Classes

### Container

- `.quiz-background-notifications` - Main fixed container for notifications

### Notification Base

- `.quiz-notification` - Base notification styling
- `.quiz-notification-success` - Green success styling
- `.quiz-notification-error` - Red error styling
- `.quiz-notification-info` - Blue info styling
- `.quiz-notification-warning` - Orange warning styling

### Animation States

- `.animate-in` - Entry animation
- `.animate-out` - Exit animation
- `.filter-hidden` / `.filter-visible` - Filter visibility states

### Expandable Notifications

- `.quiz-notification-header` - Clickable header area
- `.quiz-notification-content` - Main content container
- `.quiz-notification-toggle` - Expand/collapse button
- `.quiz-notification-details` - Expandable details section
- `.quiz-notification-details-content` - Details text content

### Simple Notifications

- `.quiz-notification-simple` - Simple notification layout
- `.quiz-notification-simple-text` - Simple notification text

### Icons and Controls

- `.quiz-notification-icon` - Main notification icon
- `.quiz-notification-simple-icon` - Simple notification icon
- `.quiz-notification-close` - Close button
- `.quiz-notification-title` - Notification title text

### Control Buttons

- `.quiz-notification-copy-button` - Copy functionality button
- `.quiz-notification-filter-button` - Filter functionality button

### Context Menus

- `.quiz-copy-options-menu` - Copy options dropdown
- `.quiz-filter-options-menu` - Filter options dropdown
- `.quiz-copy-options-menu-item` - Copy menu items
- `.quiz-filter-options-menu-item` - Filter menu items

### Priority Classes

- `.quiz-notification-priority-critical` - Critical priority styling
- `.quiz-notification-priority-error` - Error priority styling
- `.quiz-notification-priority-warning` - Warning priority styling
- `.quiz-notification-priority-success` - Success priority styling
- `.quiz-notification-priority-info` - Info priority styling

## Usage

These styles are automatically included when you import the main Tailwind CSS file since it imports this component file.

To use with the JavaScript NotificationManager:

```javascript
import { NotificationManager } from "./path/to/notifications.js";

const notificationManager = new NotificationManager({
	// All the CSS classes are already configured as defaults
	// but you can override them if needed for custom styling
});
```

## Mobile Responsiveness

The styles include comprehensive mobile responsive adjustments:

- Smaller notification container and buttons
- Adjusted padding and margins for mobile screens
- Touch-friendly button sizes
- Optimized layout for narrow screens

## Customization

To customize the notification styles:

1. **Colors**: Modify the gradient backgrounds for different notification types
2. **Animations**: Adjust the keyframe animations for different effects
3. **Sizing**: Update dimensions for different notification sizes
4. **Positioning**: Change the fixed positioning for different placements

## Integration

This CSS file is designed to work with:

- The NotificationManager JavaScript class
- Any component that uses the quiz notification class naming convention
- Both expandable and simple notification types
- All notification features (copy, filter, priority system)
