function ContextsManager() {
	"use strict";
	var that = this;
	var contextsList = [];

	this.init = function () {
		if (localStorage.contexts) {
			that.setContextsList(JSON.parse(localStorage.contexts));
		}
	};

	this.getContextsListWithStatuses = function (callback) {
		chrome.management.getAll(function (extensions) {
			var contextsListsWithStatuses, activeExtensions = [];

			//make handy array of active extension ids
			activeExtensions = extensions.filter(function (extension) {
				return extension.enabled;
			}).map(function (extension) {
				return extension.id;
			});

			contextsListsWithStatuses = [];

			//check all contexts
			contextsList.forEach(function (context) {
				var countActive, status;

				countActive = context.extensions.filter(function (extension) {
					return ( activeExtensions.indexOf(extension.id) !== -1 );
				}).length;

				if (countActive === context.extensions.length) {//context is enabled (all extensions are active)
					status = "enabled";
				} else if (countActive === 0) {//context is disabled (no active extensions)
					status = "disabled";
				} else {//context is partially enabled (some active extensions)
					status = "partial";
				}

				//clone context object and add status
				contextsListsWithStatuses.push({
					name: context.name,
					imgSrc: context.imgSrc,
					icon: context.icon,
					extensions: context.extensions,
					status: status
				});
			});

			if(typeof callback === "function") {
				callback(contextsListsWithStatuses);
			}
		});
	};

	this.setContextsList = function (list) {
		contextsList = list;
	};

	this.getContextsList = function () {
		return contextsList;
	};

	//check if extension appears in given context
	this.isInContext = function (context, extension) {
		var extid, contextObj, j;

		extid = (typeof extension === "object") ? extension.id : extension;
		contextObj = (typeof context === "string") ? that.getContext(context) : context;

		for (j in contextObj.extensions) {
			if (contextObj.extensions[j].id === extid) {
				return true;
			}
		}

		return false;
	};

	//get context by name
	this.getContext = function (name) {
		var cindex, context;

		for (cindex in contextsList) {
			context = contextsList[cindex];

			if (context.name === name) {
				return context;
			}
		}

		return false;
	};

	this.addExtensionToContext = function (context, extension) {
		var extid, contextName, contextObj;

		extid = (typeof extension === "object") ? extension.id : extension;
		contextName = (typeof context === "object") ? context.name : context;

		contextObj = that.getContext(contextName);

		if (contextObj && !that.isInContext(contextObj, extid)) {
			contextObj.extensions.push({
				id: extid
			});
		}
	};

	this.removeExtensionFromContext = function (context, extension) {
		var extid, contextName, contextObj;

		extid = (typeof extension === "object") ? extension.id : extension;
		contextName = (typeof context === "object") ? context.name : context;

		contextObj = that.getContext(contextName);

		if (contextObj) {
			contextObj.extensions = contextObj.extensions.filter(function (item) {
				return (item.id !== extid);
			});
		}
	};

	this.newContext = function (name, img) {
		var contextObj = {
			'name': name,
			'imgSrc': img,
			'extensions': []
		};
		contextsList.push(contextObj);
		that.save();
	};

	this.save = function () {
		localStorage.contexts = JSON.stringify(contextsList);
	};

	this.init(); //constructor
}