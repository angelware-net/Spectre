export interface XSNotification {
	/** The type of message to send. 1 defines a normal notification. */
	type?: number;
	/** Used for Media Player, changes the icon on the wrist. (deprecated) */
	index?: number;
	/** How long the notification will stay on screen (in seconds). */
	timeout?: number;
	/** Height notification will expand to if it has content other than a title. */
	height?: number;
	/** Opacity of the notification; setting to 0 will set it to 1. */
	opacity?: number;
	/** Notification sound volume. */
	volume?: number;
	/** File path to .ogg audio file. Can be "default", "error", or "warning". */
	audioPath?: string;
	/** Notification title, supports Rich Text Formatting. */
	title?: string;
	/** Notification content, supports Rich Text Formatting. */
	content?: string;
	/** Set to true if using Base64 for the icon image. */
	useBase64Icon?: boolean;
	/** Base64-encoded image, or file path to image. Can also be "default", "error", or "warning". */
	icon?: string;
	/** Your app name or identifier for debugging purposes. */
	sourceApp?: string;
}