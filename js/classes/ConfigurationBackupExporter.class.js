function ConfigurationBackupExporter() {
	var extensionsManager;

	this.exportConfig = function (callback) {
		var contextsManager = new ContextsManager();
		extensionsManager = new ExtensionsManager(function () {
			var contexts = contextsManager.getContextsList();
			var alwaysEnabledExtensions = extensionsManager.getAlwaysEnabledExtensionsIds();
			var extensionsNamesDictionary = createExtensionsNamesDictionary(contexts, alwaysEnabledExtensions);

			var cleanConfig = {
				"version": CONFIG.get("configBackupFormatVersion"),
				"contexts": contexts,
				"alwaysEnabledExtensions": alwaysEnabledExtensions,
				"extensionsNamesDictionary": extensionsNamesDictionary,
				"advancedOptions": {
					"appsSupport": CONFIG.get("appsSupport"),
					"newExtensionAction": CONFIG.get("newExtensionAction"),
					"showLoadAllBtn": CONFIG.get("showLoadAllBtn")
				}
			};

			var encodedConfig = Base64.encode(JSON.stringify(cleanConfig));

			if (typeof callback == 'function') {
				callback(encodedConfig);
			}
		});
	};

	var createExtensionsNamesDictionary = function (contexts, alwaysEnabledExtensions) {
		var extid, cindex, eindex;
		var extensionsNamesDictionary = {};

		for (cindex in contexts) {
			var context = contexts[cindex];

			for (eindex in context.extensions) {
				extid = context.extensions[eindex].id;

				extensionsNamesDictionary[extid] = '';
			}
		}

		for (var i = 0; i < alwaysEnabledExtensions.length; i++) {
			extid = alwaysEnabledExtensions[i];

			extensionsNamesDictionary[extid] = '';
		}

		for (extid in extensionsNamesDictionary) {
			var extension = extensionsManager.getExtensionData(extid);

			if (extension) {
				extensionsNamesDictionary[extid] = extension.name;
			}
		}

		return extensionsNamesDictionary;
	}
}