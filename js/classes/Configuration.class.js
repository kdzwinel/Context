function Configuration() {
	"use strict";
	var constants = {
		iconsPath: 'icons/dortmund/',
		icons: ['home', 'search', 'world', 'heart', 'lightbulb', 'basket', 'customers', 'hire-me', 'administrative-docs', 'comment', 'config', 'finished-work', 'settings', 'star'],
		extensionName: 'Context',
		configBackupFormatVersion: 1
	};

	var defaults = {
		appsSupport: 'false',
		extensionEnableDelay: 200,//ms
		showLoadAllBtn: 'true',
		newExtensionAction: 'ask',
		firstRun: 'yes',
		highlightUngroupedExtensions: 'false'
	};

	/**
	 * Returns value of a config parameter (constant, user setting or default setting) with provided name.
	 * Returns null if no matching parameter is found.
	 * @param {string} name
	 * @returns {string|Array|number|null}
	 */
	this.get = function (name) {
		return constants[name] || localStorage[name] || defaults[name] || null;
	};
}

var CONFIG = new Configuration();