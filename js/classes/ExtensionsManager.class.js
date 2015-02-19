function ExtensionsManager(onLoadCallback) {
	"use strict";
	var that = this;
	/**
	 * List of all installed extensions.
	 * @type {Array.<Object>}
	 */
	var extensionsList = [];
	/**
	 * List of IDs of 'always enabled' extensions.
	 * @type {Array.<string>}
	 */
	var alwaysEnabledExtensionsIds = [];

	this.init = function (callback) {
		chrome.management.getAll(function (list) {
			that.setExtensionsList(list);

			if (typeof callback === 'function') {
				callback();
			}
		});

		if (localStorage.alwaysEnabledExtensions) {
			that.setAlwaysEnabledExtensionsIds(JSON.parse(localStorage.alwaysEnabledExtensions));
		}
	};

	this.setExtensionsList = function (list) {
		var contextExtensionId = chrome.i18n.getMessage("@@extension_id");

		extensionsList = list.sort(function (item1, item2) { //sort by name
			if (item1.name < item2.name) {
				return -1;
			}

			return 1;
		}).filter(function (element) {
			//remove Context itself from manageable extensions
			//remove themes as support for multiple themes is very unstable
			return ( element.id !== contextExtensionId && element.type !== 'theme' );
		});
	};

	/**
	 * Returns list of all extensions.
	 * @returns {Array.<Object>}
	 */
	this.getExtensionsList = function () {
		return extensionsList;
	};

	this.setAlwaysEnabledExtensionsIds = function (list) {
		alwaysEnabledExtensionsIds = list;
	};

	/**
	 * Returns list of 'always enabled' extensions.
	 * @returns {Array.<Object>}
	 */
	this.getAlwaysEnabledExtensionsIds = function () {
		return alwaysEnabledExtensionsIds;
	};

	/**
	 * Removes single extension from 'always enabled extensions'
	 * @param {string} extid
	 */
	this.removeExtensionFromAlwaysEnabled = function (extid) {
		alwaysEnabledExtensionsIds = alwaysEnabledExtensionsIds.filter(function (item) {
			return (item !== extid);
		});
	};

	/**
	 * Adds single exetnsion to 'always enabled extensions'
	 * @param {string} extid
	 */
	this.addExtensionToAlwaysEnabled = function (extid) {
		if (!that.isAlwaysEnabled(extid)) {
			alwaysEnabledExtensionsIds.push(extid);
		}
	};

	/**
	 * Saves 'always enabled extensions' to localStorage
	 */
	this.save = function () {
		localStorage.alwaysEnabledExtensions = JSON.stringify(alwaysEnabledExtensionsIds);
	};

	/**
	 * Returns extension details based on extension ID.
	 * @param {string} extid
	 * @returns {Object|boolean}
	 */
	this.getExtensionData = function (extid) {
		var index;

		for (index in extensionsList) {
			var extension = extensionsList[index];

			if (extension.id === extid) {
				return extension;
			}
		}

		return false;
	};

	/**
	 * Returns true if extension is in 'always enabled' group.
	 * @param {string} extid
	 * @returns {boolean}
	 */
	this.isAlwaysEnabled = function (extid) {
		return (jQuery.inArray(extid, alwaysEnabledExtensionsIds) !== -1);
	};

	/**
	 * Enables all extensions.
	 */
	this.enableAllExtensions = function () {
		that.enableExtensions(that.getExtensionsList());
	};

	/**
	 * Enables list of extensions one by one. Calls optional callback when all extensions from the list are enabled.
	 * @param {Array.<Object>} list
	 * @param {function(): void=} callback
	 */
	this.enableExtensions = function (list, callback) {
		if (list.length > 0) {
			var extension = list.pop();

			that.enableExtension(extension, true, function () {
				window.setTimeout(function () {
					that.enableExtensions(list, callback);
				}, CONFIG.get('extensionEnableDelay'));
			});
		}

		if (typeof callback === "function") {
			callback();
		}
	};

	/**
	 * Enables or disables single extension. Calls optional callback when operation is finished.
	 * @param {Object} extension
	 * @param {boolean} enable
	 * @param {function(): void=} callback
	 */
	this.enableExtension = function (extension, enable, callback) {
		if (
			extension.type !== 'theme' && //do not touch themes
			(!extension.isApp || CONFIG.get('appsSupport') === 'true') && //check if extension is an app and continue only if we support apps
			((enable === true && !extension.enabled) || (enable === false && extension.enabled && extension.mayDisable)) && //enable extension if it is not already enabled, disable extension if it can be disabled and is not already disabled
			(extension.id !== chrome.i18n.getMessage("@@extension_id")) //do not enable/disable current extension (Context)
		) {
			if (typeof callback === "function") {
				chrome.management.setEnabled(extension.id, enable, callback);
			} else {
				chrome.management.setEnabled(extension.id, enable);
			}
		} else if (typeof callback === "function") {
			callback();
		}
	};

	/**
	 * Disables all extensions.
	 */
	this.disableAllExtensions = function () {
		that.disableExtensions(that.getExtensionsList());
	};

	/**
	 * Disables list of extensions one by one. Calls optional callback when all extensions from the list are disabled.
	 * @param {Array.<Object>} list
	 * @param {function(): void=} callback
	 */
	this.disableExtensions = function (list, callback) {
		var i;

		if (list.length > 0) {
			for (i in list) {
				var extension = list[i];
				that.disableExtension(extension);
			}
		}

		if (typeof callback === "function") {
			callback();
		}
	};

	/**
	 * Disable single extension (alias method).
	 * @param {Object} extension
	 */
	this.disableExtension = function (extension) {
		that.enableExtension(extension, false);
	};

	this.init(onLoadCallback);//constructor
}
