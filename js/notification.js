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
			var input = $('<input>').keydown(function (event) {
				if (event.which == 13) {
					event.preventDefault();
					var context_name = $(this).val();
					var context_img = 'icons/dortmund/settings.png';

					contextsManager.newContext(context_name, context_img);
					chrome.extension.getBackgroundPage().configUpdated();

					$('ul').append(createContextLi(context_name, context_name, context_img)).find("div:last").addClass('ui-selected');
					$(event.target).remove();
					$('#always_enabled').removeClass('ui-selected');
					$('#new_context').show();
				}
			}).attr({type: 'text', class: 'text ui-widget-content ui-corner-all'});
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