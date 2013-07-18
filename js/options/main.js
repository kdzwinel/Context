var extensionsManager;
var contextsManager;
var configurationBackupExporter = new ConfigurationBackupExporter();
var configurationBackupImporter = new ConfigurationBackupImporter();
var storageSync = new HugeStorageSync();

//display list of all extensions
function displayExtensions() {
	//get the processed list back from ExtensionsManager
	var extensionsList = extensionsManager.getExtensionsList();

	$('#extensions, #always_enabled_extensions').empty();

	for (var index in extensionsList) {
		var extension = extensionsList[index];

		var li = createExtensionLi(extension);

		if (extensionsManager.isAlwaysEnabled(extension.id)) {
			$('#always_enabled_extensions').append(li);
		} else {
			$('#extensions').append(li);
		}
	}

	$('#extensions li, #always_enabled_extensions li').draggable({
		zIndex: 1000,
		helper: 'clone',
		opacity: 0.75,
		revert: 'invalid'
	});
}

//create list element representing an extension
function createExtensionLi(extdata) {
	var iconSrc = 'icons/plugin.png';

	if (extdata.icons) {
		var iconSize = 1024;

		for (var iconIndex in extdata.icons) {
			var icon = extdata.icons[iconIndex];

			if (icon.size < iconSize) {
				iconSrc = icon.url;
				iconSize = icon.size;
			}
		}
	}

	var img = $('<img>').attr('src', iconSrc);
	var span = $('<span/>').addClass('extensionName').text(extdata.name);
	var removeImg = $('<span />').attr('class', 'ui-icon ui-icon-circle-close');
	var removeBtn = $('<div />').addClass('removeBtn').append(removeImg);
	var status = 'status-' + ((extdata.enabled == true) ? 'enabled' : 'disabled');
	var li = $('<li>').addClass('ui-widget-content').addClass('ui-corner-all ' + status).attr('data-extid', extdata.id).attr('data-exticon', iconSrc).append(img).append(span).append(removeBtn);

	if (extdata.isApp) {
		li.addClass('app');

		//if apps support is disabled don't show them
		if (CONFIG.get('appsSupport') === 'false') {
			li.hide();
		}
	}

	return li;
}

//display available contexts
function displayContexts() {
	var contexts = contextsManager.getContextsList();

	$('#contexts').empty();

	for (var gindex in contexts) {
		var context = contexts[gindex];
		var contextObj = newContext(context.name, context.imgSrc, context.icon);

		var contextUl = contextObj.find('ul');

		for (var eindex in context.extensions) {
			var extension = context.extensions[eindex];
			var extData = extensionsManager.getExtensionData(extension.id);

			if (extData) {
				var extLi = createExtensionLi(extData);
				contextUl.append(extLi);
			}
		}

		$('#contexts').append(contextObj);
	}

	$('#contexts').sortable({
		forcePlaceholderSize: true,
		handle: '.contextGrip',
		placeholder: 'context ui-state-highlight',
		tolerance: 'pointer',
		change: function (event, ui) {
			markDirty();
		}
	});
}

//check if extension is already in given context
function isInContext(context, newExtension) {
	var extensions = context.find('li');
	var exists = false;
	var newExtId = newExtension.data('extid');

	$.each(extensions, function (i, extension) {
		if ($(extension).data('extid') == newExtId) {
			exists = true;
		}
	});

	return exists;
}

//create new list object representing context
function newContext(name, imgSrc, showIcon) {
	var contextImg = $('<img/>').addClass('contextIcon').attr('src', imgSrc);
	var contextSpan = $('<span/>').addClass('contextTitle').text(name);
	var contextIcon = (showIcon || false);
	var contextGrip = $('<div/>').attr('title', chrome.i18n.getMessage("move")).addClass('contextGrip').append(contextImg).append(contextSpan);
	var contextMenu = $('<div class="contextMenu">' +
		'<a href="#" class="contextDuplicate"><span class="ui-icon ui-icon-copy" title="' + chrome.i18n.getMessage("clone") + '"></span></a>' +
		'<a href="#" class="contextEdit"><span class="ui-icon ui-icon-wrench" title="' + chrome.i18n.getMessage("edit") + '"></span></a>' +
		'<a href="#" class="contextDelete"><span class="ui-icon ui-icon-closethick" title="' + chrome.i18n.getMessage("delete") + '"></span></a>' +
		'</div>');
	var contextUl = $('<ul>').addClass('contextExtensions').data('contextName', name).data('contextImg', imgSrc).data('contextIcon', contextIcon);
	var contextLi = $('<li>').addClass('ui-widget-content').addClass('ui-corner-all').addClass('context').append(contextGrip).append(contextMenu).append(contextUl);

	contextUl.sortable({
		placeholder: 'ui-widget-content ui-corner-all ui-state-highlight',
		forcePlaceholderSize: true,
		tolerance: 'pointer',
		revert: true,
		change: function () {
			markDirty();
		}
	});

	contextUl.droppable({
		activeClass: 'active',
		hoverClass: 'active_hover',
		accept: function (element) {
			return element.is('#extensions li') && !isInContext($(this), element);
		},
		drop: function (event, ui) {
			if (ui.draggable.parent().is("#extensions")) {
				var li = ui.draggable.clone();
				$(this).append(li);
			}

			$(this).sortable("refresh");

			markDirty();
		}
	});

	return contextLi;
}

function importConfiguration(configurationString) {
	var buttons = {};
	buttons[chrome.i18n.getMessage("import")] = function () {
		configurationBackupImporter.importConfig(configurationString, function (status, missingExtensions, errors) {
			if (status) {
				importSuccessDialog({
					missingExtensions: missingExtensions,
					callback: function () {
						loadConfiguration();
						$('#import_box').val('');
					}
				});
			} else {
				window.console.error(errors);

				showErrorDialog({
					title: chrome.i18n.getMessage("import_failed"),
					content: chrome.i18n.getMessage("configuration_string_is_invalid")
				});
			}
		});

		$(this).dialog("close");
	};
	buttons[chrome.i18n.getMessage("cancel")] = function () {
		$(this).dialog("close");
	};

	$("#dialog-confirm").dialog({
		title: chrome.i18n.getMessage("override_current_settings"),
		resizable: false,
		width: 300,
		height: 200,
		modal: true,
		buttons: buttons
	}).find('span.dialog-content').text(chrome.i18n.getMessage("confirm_configuration_import"));
}

//mark config as modified
function markDirty() {
	$("#save-button").button("option", "disabled", false);
	highlightUngrouped();
}

//mark config as saved
function markClean() {
	$("#save-button").button("option", "disabled", true);

	//generates current configuration string - used for import/export
	configurationBackupExporter.exportConfig(function (exportedConfig) {
		$('#export_box').val(exportedConfig);
	});
}

//save context data and additional options in localStorage
function save() {
	var contextsData = [];

	var contexts = $('.contextExtensions');
	$.each(contexts, function (i, context) {
		var contextName = $(context).data('contextName');
		var contextImg = $(context).data('contextImg');
		var contextIcon = $(context).data('contextIcon');
		var contextObj = {
			'name': contextName,
			'imgSrc': contextImg,
			'icon': contextIcon,
			'extensions': []
		};

		var extensions = $(context).find('li:visible');

		$.each(extensions, function (i, extension) {
			var extid = $(extension).data('extid');
			var exticon = $(extension).data('exticon');
			var extObj = {
				id: extid,
				icon: exticon
			};

			contextObj.extensions.push(extObj);
		});

		contextsData.push(contextObj);
	});

	localStorage.contexts = JSON.stringify(contextsData);

	var alwaysEnabledExtensionsData = [];
	var extensions = $('#always_enabled_extensions li');

	$.each(extensions, function (i, extension) {
		var extid = $(extension).data('extid');

		alwaysEnabledExtensionsData.push(extid);
	});

	extensionsManager.setAlwaysEnabledExtensionsIds(alwaysEnabledExtensionsData);
	localStorage.alwaysEnabledExtensions = JSON.stringify(alwaysEnabledExtensionsData);

	saveAdvancedOptions();

	chrome.extension.getBackgroundPage().configUpdated();
	markClean();
}

var advancedOptions = ['appsSupport', 'newExtensionAction', 'showLoadAllBtn', 'extensionEnableDelay'];

function saveAdvancedOptions() {
	for (var i in advancedOptions) {
		var option = advancedOptions[i];

		if ($('#' + option).is('[type=checkbox]')) {
			localStorage[option] = $('#' + option).is(':checked');
		} else {
			localStorage[option] = $('#' + option).val();
		}
	}
}

function displayAdvancedOptions() {
	for (var i in advancedOptions) {
		var option = advancedOptions[i];
		var $option = $('#' + option);

		if ($option.is('[type=checkbox]')) {
			if (CONFIG.get(option) === 'true') {
				$option.attr('checked', 'checked');
			} else {
				$option.removeAttr('checked');
			}
		} else if ($option.is('select')) {
			$option.find('option').removeAttr('selected');
			$option.find('option[value=' + CONFIG.get(option) + ']').attr('selected', 'selected');
		} else {
			$option.val(CONFIG.get(option));
		}
	}
}

//actions performed after config page is fully loaded
function pageLoaded() {
	$('#loader').slideUp('slow', function () {
		$('#content').slideDown('slow', function () {
			//display welcome screen if extension was just installed
			if (CONFIG.get('firstRun') == 'yes') {
				showWelcomeScreen();
				localStorage.firstRun = 'no';
			}
		});
	});
}

//highlights not grouped extensions inside 'Available extensions' box
function highlightUngrouped() {
	var enabled = $('#highlightUngrouped').is(':checked');

	//remove .ui-state-active class from all extensions in contexts, always-enabled box and available extensions box
	$('.extensions_list li.ui-state-active, .contextExtensions li.ui-state-active').removeClass('ui-state-active');

	if (enabled) {
		$.each($('#extensions li'), function (i, extensionElem) {
			var extid = $(extensionElem).data('extid');

			if ($('.context li[data-extid=' + extid + ']').length === 0) {
				$(extensionElem).addClass('ui-state-active');
			}
		});
	}
}

function loadConfiguration() {
	contextsManager = new ContextsManager();
	extensionsManager = new ExtensionsManager(function () {
		displayExtensions();
		displayContexts();
		displayAdvancedOptions();
		pageLoaded();
		if(localStorage.highlightUngroupedExtensions === 'true') {
			highlightUngrouped();
		}
		markClean();
	});
}

function loadTranslations() {
	$('[data-i18n]').each(function (i, item) {
		$(item).text(chrome.i18n.getMessage($(item).data('i18n')));
	});
}

$(document).ready(function () {
	loadConfiguration();
	loadTranslations();
	initNewContextDialog();

	//remove social icons if user is offline
	if(!navigator.onLine) {
		$('#social-buttons').empty();
	}

	$('button, input[type=submit], input[type=button]').button();

	$('.removeBtn').live('click', function () {
		$(this).closest('li').effect('slide', {mode: 'hide'}, 'normal', function () {
			$(this).remove();
			markDirty();
		});
	});

	$('#help-icon').click(function () {
		showWelcomeScreen();
	});

	$('.contextDelete').live('click', function () {
		var context = $(this).closest('.context');
		var buttons = {};
		buttons[chrome.i18n.getMessage("delete")] = function () {
			context.effect('puff', {}, 'slow', function () {
				$(this).remove();
				markDirty();
			});

			$(this).dialog("close");
		};
		buttons[chrome.i18n.getMessage("cancel")] = function () {
			$(this).dialog("close");
		};

		$("#dialog-confirm").dialog({
			title: chrome.i18n.getMessage("remove_context"),
			resizable: false,
			height: 200,
			modal: true,
			buttons: buttons
		}).find('span.dialog-content').text(chrome.i18n.getMessage("context_will_be_deleted"));

		return false;
	});

	$('.contextDuplicate').live('click', function () {
		var original = $(this).closest('.context');
		var contextsContainer = $('.contextExtensions');

		var oldImageSrc = original.find('.contextExtensions').data('contextImg');
		var oldName = original.find('.contextExtensions').data('contextName');
		var oldIcon = original.find('.contextExtensions').data('contextIcon');
		var newName;

		//generate new, unique name
		for (var j = 1; ; j++) {
			var isValid = true;
			var checkName = oldName + j;

			for (var i = 0; i < contextsContainer.length; i++) {
				var otherContext = contextsContainer[i];
				if ($(otherContext).data('contextName') == checkName) {
					isValid = false;
					break;
				}
			}

			if (isValid) {
				newName = checkName;
				break;
			}
		}

		var clone = newContext(newName, oldImageSrc, oldIcon);//create new context with same icon but new name
		clone.find('.contextExtensions').append(original.find('.contextExtensions li').clone());//copy extensions from original context to clone
		$('#contexts').append(clone);

		clone.effect('highlight', {}, 'slow');
		markDirty();

		return false;
	});

	$('.contextEdit').live('click', function () {
		openEditContextDialog($(this).closest('.context'));
		return false;
	});

	/* Additional options */
	$('#accordion').accordion({
		autoHeight: false,
		collapsible: true,
		active: false
	});

	$('#additional-options-panel').find('input, select, textarea').change(function () {
		markDirty();
	});

	//HTML notifications are being dropped from Chrome :(
	if(!webkitNotifications.createHTMLNotification) {
		$('#newExtensionAction option[value=ask]').attr('disabled', 'disabled');
	}

	$('#appsSupport').change(function () {
		if ($(this).is(':checked')) {
			$('li.app').effect('slide', {}, 'normal', markDirty);
		} else {
			$('li.app').effect('slide', {mode: 'hide'}, 'normal', markDirty);
		}
	});

	//moving extensions between 'available' section and 'always enabled' section
	$('#extensions').droppable({
		activeClass: 'active_dense',
		hoverClass: 'active_hover',
		accept: function (element) {
			return element.is('#always_enabled_extensions li');
		},
		drop: function (event, ui) {
			var li = ui.draggable.detach();
			$(this).append(li);

			//if extension was moved back from 'always enabled' box to 'available' box there may be some copies of this extension hidden in the contexts, show them
			$('.context li[data-extid=' + li.data('extid') + ']').effect('slide');

			markDirty();
		}
	});

	$('#always_enabled_extensions').droppable({
		activeClass: 'active_dense',
		hoverClass: 'active_hover',
		accept: function (element) {
			return element.is('#extensions li');
		},
		drop: function (event, ui) {
			var li = ui.draggable.detach();
			$(this).append(li);

			//HACK - contexts stay highlighted after object is dropped - AFAIK it is because draggable is detached not cloned
			$('.contextExtensions.active').removeClass('active');

			//remove this extension from all contexts as it is redundant there now
			$('.context li[data-extid=' + li.data('extid') + ']').effect('slide', {mode: 'hide'});

			markDirty();
		}
	});

	$('#highlightUngrouped').click(function () {
		highlightUngrouped();
		localStorage.highlightUngroupedExtensions = $(this).is(':checked') ? 'true' : 'false';
	});
	if(localStorage.highlightUngroupedExtensions === 'true') {
		$('#highlightUngrouped').attr('checked', 'checked');
	}

	$('#export_box, #import_box').click(function () {
		this.select();
	});

	$('#import_button').click(function () {
		importConfiguration($('#import_box').val());
		return false;
	});

	$('#chrome_sync_export_button').click(function(){
		var configurationString = $('#export_box').val();
		var $exportButton = $(this);
		var buttons = {};
		buttons[chrome.i18n.getMessage("save")] = function () {
			storageSync.set('configuration', configurationString, function() {
				var originalText = $exportButton.find('span').text();
				$exportButton.find('span').text(chrome.i18n.getMessage("saved"));
				$exportButton.effect('highlight', {}, 'slow');
				setTimeout(function() {
					$exportButton.find('span').text(originalText);
				}, 2500);
			});

			$(this).dialog("close");
		};
		buttons[chrome.i18n.getMessage("cancel")] = function () {
			$(this).dialog("close");
		};

		$("#dialog-confirm").dialog({
			title: chrome.i18n.getMessage("override_server_settings"),
			resizable: false,
			width: 300,
			height: 200,
			modal: true,
			buttons: buttons
		}).find('span.dialog-content').text(chrome.i18n.getMessage("confirm_chrome_sync_configuration_export"));
		return false;
	});

	$('#chrome_sync_import_button').click(function(){
		storageSync.get('configuration', function(value){
			importConfiguration(value);
		});
		return false;
	});

	$('#new-context-button').click(function () {
		openNewContextDialog();
	});
	$('#save-button').click(function () {
		save();
	});
});