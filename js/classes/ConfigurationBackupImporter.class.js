function ConfigurationBackupImporter() {
	"use strict";
	/**
	 * Array of errors that occurred during last import.
	 * @type {Array.<string>}
	 */
	var errors = [];
	/**
	 * List of extensions mentioned in imported configuration but not installed.
	 * @type {Array.<Object>}
	 */
	var missingExtensions = [];
	/**
	 * @type {ExtensionsManager}
	 */
	var extensionsManager;

	/**
	 * Tries to import given encoded configuration. If no critical errors are found boolean 'true' is returned via callback as a first parameter and
	 * imported configuration replaces current Context configuration.
	 * Second parameter returned to the callback will contain list of extensions mentioned in imported config but currently not installed.
	 * Third parameter returned to the callback will contain list of errors encountered during import.
	 * @param {string} encodedConfig base64 encoded JSON
	 * @param {function(boolean, Array.<Object>, Array.<string>): void=} callback
	 */
	this.importConfig = function (encodedConfig, callback) {
		extensionsManager = new ExtensionsManager(function () {
			var jsonString = Base64.decode(jQuery.trim(encodedConfig));
			var json;

			errors = [];
			missingExtensions = [];

			try {
				json = JSON.parse(jsonString);
			} catch (e) {
				errors.push('JSON parser error: ' + e.type);
			}

			if (typeof json === "object") {
				validateStructure(json);

				//we proceed only if there were no errors in the root structure
				if (errors.length === 0) {
					validateVersion(json.version);
					validateContexts(json.contexts, json.extensionsNamesDictionary);
					validateAlwaysEnabledExtensions(json.alwaysEnabledExtensions, json.extensionsNamesDictionary);
					validateAdvancedOptions(json.advancedOptions);
				}
			} else {
				errors.push('Corrupted configuration string.');
			}

			if (errors.length === 0) {
				updateConfiguration(json);
			}

			if (typeof callback === 'function') {
				var status = (errors.length === 0);
				callback(status, missingExtensions, errors);
			}
		});
	};

	this.getMissingExtensions = function () {
		return missingExtensions;
	};

	this.getErrors = function () {
		return errors;
	};

	var validateStructure = function (config) {
		if (!config.hasOwnProperty("version") || !config.hasOwnProperty("contexts") || !config.hasOwnProperty("alwaysEnabledExtensions") || !config.hasOwnProperty("extensionsNamesDictionary") || !config.hasOwnProperty("advancedOptions")) {
			errors.push('Configuration object is missing one or more root property.');
		}
	};

	var validateVersion = function (version) {
		if (version !== 1) {
			errors.push('Unknown configuration file format version.');
		}
	};

	var validateContexts = function (contexts, dictionary) {
		if (!jQuery.isArray(contexts)) {
			errors.push('List of contexts is not an object.');
		} else {
			for (var index in contexts) {
				var context = contexts[index];

				validateContext(context, dictionary);
			}
		}
	};

	var validateContext = function (context, dictionary) {
		if (!context.hasOwnProperty("extensions") || !context.hasOwnProperty("imgSrc") || !context.hasOwnProperty("name")) {
			errors.push('Context object is missing one or more properties.');
		} else {
			if (!jQuery.isArray(context.extensions)) {
				errors.push('List of extensions in context is not an array.');
			} else {
				//store only valid extensions
				context.extensions = context.extensions.filter(function (extension, idx, array) {
					return validateExtension(extension.id, dictionary);
				});
			}
		}
	};

	var validateExtension = function (extid, dictionary) {
		//check if extension is currently installed
		var index;
		var extension = extensionsManager.getExtensionData(extid);

		if (!extension) {
			//check if extension is not already on a list of missing extensions
			for (index in missingExtensions) {
				if (missingExtensions[index].id === extid) {
					return false;
				}
			}

			missingExtensions.push({
				id: extid,
				name: dictionary.hasOwnProperty(extid) ? dictionary[extid] : '-unknown-'
			});

			return false;
		}

		return true;
	};

	var validateAlwaysEnabledExtensions = function (extensions, dictionary) {
		if (!jQuery.isArray(extensions)) {
			errors.push('Always enabled extensions is not an array.');
		} else {
			var validExtensions = extensions.filter(function (extension, idx, array) {
				return validateExtension(extension, dictionary);
			});

			extensions.length = 0;
			for (var i = 0; i < validExtensions.length; i++) {
				extensions.push(validExtensions[i]);
			}
		}
	};

	var validateAdvancedOptions = function (config) {
		if (config.hasOwnProperty("appsSupport") && (jQuery.inArray(config.appsSupport, ["true", "false"]) === -1)) {
			errors.push('Invalid "appsSupport" value.');
		}
		if (config.hasOwnProperty("newExtensionAction") && (jQuery.inArray(config.newExtensionAction, ["ask", "add_to_all", "add_to_always_enabled", "do_nothing"]) === -1)) {
			errors.push('Invalid "newExtensionAction" value.' + config.newExtensionAction);
		}
		if (config.hasOwnProperty("showLoadAllBtn") && (jQuery.inArray(config.showLoadAllBtn, ["true", "false"]) === -1)) {
			errors.push('Invalid "showLoadAllBtn" value.' + config.showLoadAllBtn);
		}
	};

	var updateConfiguration = function (config) {
		if (config.advancedOptions.hasOwnProperty("appsSupport")) {
			localStorage.appsSupport = config.advancedOptions.appsSupport;
		}
		if (config.advancedOptions.hasOwnProperty("newExtensionAction")) {
			localStorage.newExtensionAction = config.advancedOptions.newExtensionAction;
		}
		if (config.advancedOptions.hasOwnProperty("showLoadAllBtn")) {
			localStorage.showLoadAllBtn = config.advancedOptions.showLoadAllBtn;
		}

		//import contexts
		localStorage.contexts = JSON.stringify(config.contexts);

		//import alwaysEnabledExtensions
		localStorage.alwaysEnabledExtensions = JSON.stringify(config.alwaysEnabledExtensions);

		//reload bg page settings
		chrome.extension.getBackgroundPage().configUpdated();
	};
}