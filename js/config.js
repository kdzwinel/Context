var config = {
	//constants
	iconsPath: 'icons/dortmund/',
	icons: ['home', 'search', 'world', 'heart', 'lightbulb', 'basket', 'customers', 'hire-me', 'administrative-docs', 'comment', 'config', 'finished-work', 'settings', 'star'],
	extensionName: 'Context',
	firstRun: 'yes',

	//defaults
	appsSupport: 'false',
	extensionEnableDelay: 200,//ms
	showLoadAllBtn: 'true',
	newExtensionAction: 'ask',
	
	get: function(name) {
		if(localStorage.hasOwnProperty(name)) {
			return localStorage[name];
		} else if(name != 'get' && this.hasOwnProperty(name)) {
			return this[name];
		}
		
		return null;
	}
};