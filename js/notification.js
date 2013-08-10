var contextsManager = new ContextsManager();
var extensionsManager = new ExtensionsManager();

$(document).ready(function () {
	//load translations
	$('[data-i18n]').each(function (i, item) {
		$(item).text(chrome.i18n.getMessage($(item).data('i18n')));
	});

	//gather information about extension that was just installed
	var extdata = chrome.extension.getBackgroundPage().getNewestExtension();

	if (!extdata || !extdata.name || !extdata.id) {
		window.close();
	} else {
		$('#extensionName').text(extdata.name);
		displayContexts();

		$('ul').bind("mousedown",function (e) {
			e.metaKey = true;
		}).selectable({
				filter: 'div',
				selected: function (event, ui) {
					$('#always_enabled').removeClass('ui-selected');
				}
			});

		$('#notification').bind("mousedown",function (e) {
			e.metaKey = true;
		}).selectable({
				filter: '#always_enabled',
				selected: function (event, ui) {
					$('div.ui-selected').removeClass('ui-selected');
				}
			});

		$('#new_context').bind("click", function () {
			var input = $('<input>').attr({
				type: 'text',
				class: 'text ui-widget-content ui-corner-all'
			}).keydown(function (event) {
				//wait for ENTER
				if (event.keyCode === 13) {
					event.preventDefault();
					var contextName = $(this).val(),
						contextImg = 'icons/dortmund/settings.png';

					//check if name provided isn't already in use
					if(contextsManager.contextExists(contextName) || contextName.length === 0) {
						$(this).addClass('ui-state-error');
						return false;
					}

					//create new context with default icon
					contextsManager.newContext(contextName, contextImg);
					//save configuration
					chrome.extension.getBackgroundPage().configUpdated();

					//append new context
					$('ul').append(createContextLi(contextName, contextName, contextImg)).find("div:last").addClass('ui-selected');
					//remove input field
					$(this).remove();
					//clear 'always enabled' selection
					$('#always_enabled').removeClass('ui-selected');
					//show 'new context' button
					$('#new_context').show();
				}
				$(this).removeClass('ui-state-error');
			});

			//show input and hide the button
			input.insertBefore($(this)).focus();
			$(this).hide();
		});

		$('button').button();

		$('#do_nothing').click(function () {
			window.close();
		});

		$('#save').click(function () {
			if ($('#always_enabled').is('.ui-selected')) {
				extensionsManager.init();
				extensionsManager.addExtensionToAlwaysEnabled(extdata.id);
				extensionsManager.save();

				chrome.extension.getBackgroundPage().configUpdated();
			} else {
				addToContexts(extdata.id, $('div.ui-selected'));
			}
			window.close();
		});
	}
});

function displayContexts() {
	//load and display available contexts
	var contexts = contextsManager.getContextsList();

	$.each(contexts, function (i, context) {
		$('ul').append(createContextLi(context.name, context.name, context.imgSrc));
	});
}

function createContextLi(name, title, imgSrc) {
	var img = $('<img>').attr('src', imgSrc);
	var span = $('<span>').append(title);

	var context = $('<div>').attr('class', 'list-context ui-widget-content ui-corner-all').append(img).append(span).data('contextName', name);

	return $('<li>').append(context);
}

//add extension to selected contexts
function addToContexts(extid, selectedContexts) {
	//reload contexts list - just in case
	contextsManager.init();

	if (selectedContexts.length > 0) {
		$.each($(selectedContexts), function (idx, contextElem) {
			contextsManager.addExtensionToContext($(contextElem).data('contextName'), extid);
		});

		contextsManager.save();
		chrome.extension.getBackgroundPage().configUpdated();
	}
}