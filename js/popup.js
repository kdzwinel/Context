function createListOfContexts() {
	contextsManager.getContextsListWithStatuses(function(contexts){
		$('#contextsScreen ul').empty();

		contexts.forEach(function(context) {
			$('#contextsScreen ul').append(createContextLi(context.name, context.name, getContextIcon(context), context.status));
		});

		//create a context activating all extensions
		if(CONFIG.get('showLoadAllBtn') === 'true') {
			allBtn = createContextLi('all', chrome.i18n.getMessage("all_extensions"), 'icons/plugin.png');
			$('#contextsScreen ul').append(allBtn);
		}
	});
}

function createListOfExtensions(extid) {
	var context, extensions;

	if(extid) {
		context = contextsManager.getContext(extid);
		extensions = context.extensions;
	} else {
		extensions = extensionsManager.getExtensionsList();
	}

	$('#extensionsScreen ul > li:gt(0)').remove();
	for(var idx in extensions) {
		var extId = extensions[idx].id;
		var extension = extensionsManager.getExtensionData(extId);
		var li = createExtensionLi(extension);

		$('#extensionsScreen ul').append(li);
	}
}

function createContextLi(name, title, imgSrc, status) {
	var img = $('<img>').attr('src', imgSrc);
	var span = $('<span>').append(title);
	var all = ((name == 'all') ? 'all' : 'single') + '-context';

	var activate = $("<div class='list-button activate ui-widget-content ui-corner-all'><span class='ui-icon ui-icon-plusthick'></span></div>");
	var deactivate = $("<div class='list-button deactivate ui-widget-content ui-corner-all'><span class='ui-icon ui-icon-minusthick'></span></div>");
	var showExtensions = $("<div class='list-button show-extensions ui-widget-content ui-corner-all'><span class='ui-icon ui-icon-triangle-1-e'></span></div>");

	var context = $('<div>').attr('class', 'list-context ui-widget-content ui-corner-all ' + all).append(img).append(span);

	var li = $('<li>')
		.addClass('clearfix')
		.append(context)
		.append(activate)
		.append(deactivate)
		.append(showExtensions)
		.data('contextName', name);

	if(status === 'enabled') {
		li.addClass('status-all');
	} else if(status === 'partial') {
		li.addClass('status-partial');
	}

	return li;
}

function createExtensionLi(extension) {
	var imgSrc = (extension.icons && extension.icons.length) ? (extension.icons[0].url) : ('icons/plugin.png');
	var img = $('<img>').attr('src', imgSrc);
	var span = $('<span>').addClass('extension-name').append(extension.name);

	var extensionDiv = $('<div>')
		.attr('class', 'list-item ui-widget-content ui-corner-all')
		.append(img)
		.append(span)
		.addClass(extension.enabled ? 'status-enabled' : 'status-disabled');

	var li = $('<li>')
		.addClass('clearfix')
		.append(extensionDiv)
		.data('extensionID', extension.id);

	return li;
}

function getContextIcon(context) {
	if (context.icon === 'show_extension' && context.extensions[0] && context.extensions[0].icon) {
		return context.extensions[0].icon;
	}

	return context.imgSrc;
}

var contextsManager = new ContextsManager();
var extensionsManager = new ExtensionsManager();
var currentContextName = null;
var blocked = false;
var allBtn;

$(document).ready(function(){
	//load translations
	$('[data-i18n]').each(function (i, item) {
		$(item).text(chrome.i18n.getMessage($(item).data('i18n')));
	});

	createListOfContexts();

	$('#contextsScreen').on('click', 'div.list-context, div.activate, div.deactivate', function(){
		//make sure that user won't change the context while other context is loading
		if(blocked) {
			return false;
		}
		blocked = true;

		$('div.list-context, div.list-button').not($(this)).addClass('ui-state-disabled');
		$(this).addClass('ui-state-active');

		var li = $(this).closest('li');
		var buttonClicked = 'switch';

		if($(this).is('.activate')) {
			buttonClicked = 'activate';
		} else if($(this).is('.deactivate')) {
			buttonClicked = 'deactivate';
		}

		if(allBtn && li[0] == allBtn[0]) {//all extensions button clicked
			if(buttonClicked != 'deactivate') {
				chrome.extension.getBackgroundPage().enableAllExtensions();
			} else {
				chrome.extension.getBackgroundPage().disableAllExtensions();
			}
		} else {
			if(buttonClicked == 'switch') {
				chrome.extension.getBackgroundPage().changeContext(li.data('contextName'));
			} else if(buttonClicked == 'activate') {
				chrome.extension.getBackgroundPage().activateContext(li.data('contextName'));
			} else if(buttonClicked == 'deactivate') {
				chrome.extension.getBackgroundPage().deactivateContext(li.data('contextName'));
			}
		}

		//small timeout before closing the popup
		setTimeout(function(){
			window.close();
		}, 500);

		return false;
	});

	$('#contextsScreen').on('click', 'div.show-extensions', function() {
		$('.screenContainer').addClass('showExtensions');
		var li = $(this).closest('li');

		if(li[0] === allBtn[0]) { // 'all extensions' button clicked
			currentContextName = null;
			createListOfExtensions();
		} else {
			currentContextName = li.data('contextName');
			createListOfExtensions(currentContextName);
		}
	});

	$('.back-to-contexts').on('click', function() {
		$('.screenContainer').removeClass('showExtensions');
	});

	$('#extensionsScreen').on('click', 'li', function(){
		var li = $(this);
		var extension = extensionsManager.getExtensionData( li.data('extensionID') );

		if(!extension) {
			return;
		}

		extensionsManager.enableExtension(extension, !extension.enabled, function() {
			createListOfContexts();
			//reload extensions manager before updating list of extensions
			extensionsManager = new ExtensionsManager(function () {
				createListOfExtensions(currentContextName);
			});
		});
	});
});