function ContextsManager() {
	var that = this;
	var contextsList = [];
	var countTested = [];
	var countEnabled = [];

	this.init = function() {
		if (localStorage.contexts) {
			var list = JSON.parse(localStorage.contexts)

			for(j in list) {
				countEnabled[j] = 0;
				countTested[j] = 0;
				for(i in list[j].extensions) {
					chrome.management.get(list[j].extensions[i].id, 
							(function(j) {						
								return function(ext) {
									countTested[j]++;
									countEnabled[j] = countEnabled[j] + ext.enabled;
									if (countTested[j] == list[j].extensions.length) {										
										that.setContextsStatus(j);
									}
								};
							})(j)
					);
				}								
			}
			that.setContextsList(list);
		}
	}

	this.setContextsStatus = function(j) {
		if (countEnabled[j] > 0) {
			var status = 'status-' + ((countEnabled[j] == contextsList[j].extensions.length) ? "all" : "partial");
			$('ul li:eq('+j+')').addClass(status);
		}
	}
	
	this.setContextsList = function(list) {
		contextsList = list;
	}

	this.getContextsList = function() {
		return contextsList;
	}

	//check if extension appears in given context
	this.isInContext = function (context, extension) {
		var extid = (typeof extension == "object") ? extension.id : extension;
		var contextObj = (typeof context == "string") ? that.getContext(context) : context;

		for(j in contextObj.extensions) {
			if(contextObj.extensions[j].id == extid) {
				return true;
			}
		}

		return false;
	}

	//get context by name
	this.getContext = function(name) {
		for(cindex in contextsList) {
			var context = contextsList[cindex];

			if(context.name == name) {
				return context;
			}
		}
	    
		return false;
	}

	this.addExtensionToContext = function(context, extension) {
		var extid = (typeof extension == "object") ? extension.id : extension;
		var contextName = (typeof context == "object") ? context.name : context;

		var contextObj = that.getContext(contextName);

		if(contextObj && !that.isInContext(contextObj, extid)) {
			contextObj.extensions.push({
				id: extid
			});
		}
	}

	this.removeExtensionFromContext = function(context, extension) {
		var extid = (typeof extension == "object") ? extension.id : extension;
		var contextName = (typeof context == "object") ? context.name : context;

		var contextObj = that.getContext(contextName);

		if(contextObj) {
			contextObj.extensions = contextObj.extensions.filter(function(item, index, array){
				return (item.id != extid);
			});
		}
	}

	this.newContext = function(name, img) {
		var contextObj = {
			'name' : name,
			'imgSrc': img,
			'extensions': new Array()
		};
		contextsList.push(contextObj);
		that.save();
		chrome.extension.getBackgroundPage().configUpdated();
	}

	this.save = function() {
		localStorage.contexts = JSON.stringify(contextsList);
	}

	this.init(); //consturctor
}