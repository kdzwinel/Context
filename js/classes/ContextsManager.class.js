function ContextsManager() {
	var that = this;
	var contextsList = [];

	this.init = function() {
		if(localStorage.contexts) {
			that.setContextsList( JSON.parse(localStorage.contexts) );
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

	this.save = function() {
		localStorage.contexts = JSON.stringify(contextsList);
	}

	this.init(); //consturctor
}