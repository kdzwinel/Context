function ExtensionsManager(onLoadCallback) {
	var that = this;
	var extensionsList = [];
	var alwaysEnabledExtensionsIds = [];

	this.init = function(callback) {
		chrome.management.getAll(function(list) {
			that.setExtensionsList(list);
			
			if(typeof callback == 'function') {
				callback();
			}
		});

		if(localStorage.alwaysEnabledExtensions) {
			that.setAlwaysEnabledExtensionsIds( JSON.parse(localStorage.alwaysEnabledExtensions) );
		}
	}

	this.setExtensionsList = function(list) {
		var contextExtensionId = chrome.i18n.getMessage("@@extension_id");

		extensionsList = list.sort(function(item1, item2) { //sort by name
			if(item1.name < item2.name) {
				return -1;
			}

			return 1;
		}).filter(function(element, index, array) { //remove Context itself from managable extensions
			return ( element.id != contextExtensionId );
		});
	}

	this.getExtensionsList = function() {
		return extensionsList;
	}

	this.setAlwaysEnabledExtensionsIds = function(list) {
		alwaysEnabledExtensionsIds = list;
	}

	this.getAlwaysEnabledExtensionsIds = function() {
		return alwaysEnabledExtensionsIds;
	}

	this.removeExtensionFromAlwaysEnabled = function(extid) {
		alwaysEnabledExtensionsIds = alwaysEnabledExtensionsIds.filter(function(item, index, array) {
			return (item != extid);
		});
	}

	this.addExtensionToAlwaysEnabled = function(extid) {
		if( !that.isAlwaysEnabled(extid) ) {
			alwaysEnabledExtensionsIds.push(extid);
		}
	}

	this.save = function() {
		localStorage.alwaysEnabledExtensions = JSON.stringify(alwaysEnabledExtensionsIds);
	}

	//get extension details
	this.getExtensionData = function (extid) {
		for(index in extensionsList) {
			var extension = extensionsList[index];

			if(extension.id == extid) {
				return extension;
			}
		}

		return false;
	}

	//check if extension is marked as always enabled
	this.isAlwaysEnabled = function (extid) {
		return (jQuery.inArray(extid, alwaysEnabledExtensionsIds) != -1);
	}

	this.enableAllExtensions = function() {
		that.enableExtensions( that.getExtensionsList() );
	}

	//enable list of extensions
	this.enableExtensions = function(list, callback) {
		if(list.length > 0) {
			var extension = list.pop();

			that.enableExtension(extension, true, function() {
				window.setTimeout(function(){
					that.enableExtensions(list, callback);
				}, CONFIG.get('extensionEnableDelay'));
			});
		}

		if(typeof callback == "function") {
			callback();
		}
	}

	//enable (or disable) single extension
	this.enableExtension = function(extension, enable, callback) {
		if(
			(!extension.isApp || CONFIG.get('appsSupport') === 'true') && //check if extension is an app and continue only if we support apps
			((enable == true && !extension.enabled) || (enable == false && extension.enabled && extension.mayDisable)) && //enable extension if it is not already enabled, disable extension if it can be disabled and is not already disabled
			(extension.id != chrome.i18n.getMessage("@@extension_id")) //do not enable/disable current extension (Context)
		) {
			if(typeof callback == "function") {
				chrome.management.setEnabled(extension.id, enable, callback);
			} else {
				chrome.management.setEnabled(extension.id, enable);
			}
		} else if(typeof callback == "function") {
			callback();
		}
	}

	this.disableAllExtensions = function() {
		that.disableExtensions( that.getExtensionsList() );
	}

	//disable list of extensions
	this.disableExtensions = function(list, callback) {
		if(list.length > 0) {
			for(i in list) {
				var extension = list[i];
				that.disableExtension(extension);
			}
		}

		if(typeof callback == "function") {
			callback();
		}
	}

	//alias method - disable single extension
	this.disableExtension = function(extension) {
		that.enableExtension(extension, false);
	}

	this.init(onLoadCallback);//constructor
}