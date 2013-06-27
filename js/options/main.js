var extensionsManager;
var contextsManager;
var configurationBackupExporter = new ConfigurationBackupExporter();
var configurationBackupImporter = new ConfigurationBackupImporter();

//display list of all extensions
function displayExtensions() {
	//get the processed list back from ExtensionsManager
	var extensionsList = extensionsManager.getExtensionsList();

	$('#extensions, #always_enabled_extensions').empty();

	for(index in extensionsList) {
		var extension = extensionsList[index];

		li = createExtensionLi(extension);

		if(extensionsManager.isAlwaysEnabled(extension.id)) {
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

	if(extdata.icons) {
		var iconSize = 1024;

		for(iconIndex in extdata.icons) {
			var icon = extdata.icons[iconIndex];

			if(icon.size < iconSize) {
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
	var li = $('<li>').addClass('ui-widget-content').addClass('ui-corner-all ' + status).attr('data-extid', extdata.id).append(img).append(span).append(removeBtn);

	if(extdata.isApp) {
		li.addClass('app');

		//if apps support is disabled don't show them
		if(CONFIG.get('appsSupport') === 'false') {
			li.hide();
		}
	}

	return li;
}

//display available contexts
function displayContexts() {
	var contexts = contextsManager.getContextsList();

	$('#contexts').empty();

	for(gindex in contexts) {
		var context = contexts[gindex];
		var contextObj = newContext(context.name, context.imgSrc);

		var contextUl = contextObj.find('ul');

		for(eindex in context.extensions) {
			var extension = context.extensions[eindex];
			var extData = extensionsManager.getExtensionData(extension.id);

			if(extData) {
				var extLi = createExtensionLi(extData);
				contextUl.append(extLi);
			}
		}

		contextUl.sortable({
			revert: true
		});

		$('#contexts').append(contextObj);
	}

	$('#contexts').sortable({
		forcePlaceholderSize: true,
		handle: '.contextGrip',
		placeholder: 'context ui-state-highlight',
		tolerance: 'pointer',
		change: function(event, ui) {
			markDirty();
		}
	});
}

//check if extension is already in given context
function isInContext(context, newExtension) {
	var extensions = context.find('li');
	var exists = false;
	var newExtId = newExtension.data('extid');

	$.each(extensions, function(i, extension){
		if($(extension).data('extid') == newExtId) {
			exists = true;
		}
	});

	return exists;
}

//create new list object representing context
function newContext(name, imgSrc) {
	var contextImg = $('<img/>').addClass('contextIcon').attr('src', imgSrc);
	var contextSpan = $('<span/>').addClass('contextTitle').text(name);
	var contextMenu = $('<div class="contextMenu">' +
		'<div class="contextGrip"><span class="ui-icon ui-icon-arrow-4-diag" title="' + chrome.i18n.getMessage("move") + '"></span></div>' +
		'<a href="#" class="contextDuplicate"><span class="ui-icon ui-icon-copy" title="' + chrome.i18n.getMessage("clone") + '"></span></a>' +
		'<a href="#" class="contextEdit"><span class="ui-icon ui-icon-wrench" title="' + chrome.i18n.getMessage("edit") + '"></span></a>' +
		'<a href="#" class="contextDelete"><span class="ui-icon ui-icon-closethick" title="' + chrome.i18n.getMessage("delete") + '"></span></a>' +
		'</div>');
	var contextUl = $('<ul>').addClass('contextExtensions').data('contextName', name).data('contextImg', imgSrc);
	var contextLi = $('<li>').addClass('ui-widget-content').addClass('ui-corner-all').addClass('context').append(contextImg).append(contextSpan).append(contextMenu).append(contextUl);

	contextUl.sortable({
		change: function() {
			markDirty();
		}
	});

	contextUl.droppable({
		activeClass: 'active',
		hoverClass: 'active_hover',
		accept: function(element){
			if(element.is('#extensions li') && !isInContext($(this), element)) {
				return true;
			}

			return false;
		},
		drop: function(event, ui) {
			var li = ui.draggable.clone();

			$(this).append(li);
			$(this).sortable( "refresh" );

			markDirty();
		}
	});

	return contextLi;
}

//mark config as modified
function markDirty() {
	$("#save-button").button( "option", "disabled", false );
	highlightUngrouped();
}

//mark config as saved
function markClean() {
	$("#save-button").button( "option", "disabled", true );

	//generates current configuration string - used for import/export
	configurationBackupExporter.exportConfig(function(exportedConfig) {
		$('#export_box').val( exportedConfig );
	});
}

//save context data and additional options in localStorage
function save() {
	var contextsData = [];

	var contexts = $('.contextExtensions');
	$.each(contexts, function(i,context){
		var contextName = $(context).data('contextName');
		var contextImg = $(context).data('contextImg');
		var contextObj = {
			'name' : contextName,
			'imgSrc': contextImg,
			'extensions': new Array()
		};

		var extensions = $(context).find('li:visible');

		$.each(extensions, function(i, extension) {
			var extid = $(extension).data('extid');
			var extObj = {
				id: extid
			};

			contextObj.extensions.push(extObj);
		});

		contextsData.push(contextObj);
	});

	localStorage.contexts = JSON.stringify(contextsData);

	var alwaysEnabledExtensionsData = [];
	var extensions = $('#always_enabled_extensions li');

	$.each(extensions, function(i, extension) {
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
	for(i in advancedOptions) {
		var option = advancedOptions[i];

		if($('#'+option).is('[type=checkbox]')) {
			localStorage[option] = $('#'+option).is(':checked');
		} else {
			localStorage[option] = $('#'+option).val();
		}
	}
}

function displayAdvancedOptions() {
	for(i in advancedOptions) {
		var option = advancedOptions[i];

		if($('#'+option).is('[type=checkbox]')) {
			if(CONFIG.get(option) === 'true') {
				$('#'+option).attr('checked', 'checked');
			} else {
				$('#'+option).removeAttr('checked');
			}
		} else if($('#'+option).is('select')) {
			$('#'+option).find('option').removeAttr('selected');
			$('#'+option).find('option[value='+CONFIG.get(option)+']').attr('selected', 'selected');
		} else {
			$('#'+option).val(CONFIG.get(option));
		}
	}
}

//actions peformed after config page is fully loaded
function pageLoaded() {
	$('#loader').slideUp('slow', function(){
		$('#content').slideDown('slow',function(){
			//display welcome screen if extension was just installed
			if(CONFIG.get('firstRun') == 'yes') {
				showWelcomeScreen();
				localStorage.firstRun = 'no';
			}
		});
	});
}

//higlights ungrouped extensions inside 'Available extensions' box
function highlightUngrouped() {
	var enabled = $('#highlightUngrouped').is(':checked');

	//remove .ui-state-active class from all extensions in contexts, always-enabled box and available extensions box
	$('.extensions_list li.ui-state-active, .contextExtensions li.ui-state-active').removeClass('ui-state-active');

	if( enabled ) {
		$.each($('#extensions li'), function(i, extensionElem) {
			var extid = $(extensionElem).data('extid');

			if( $('.context li:visible[data-extid=' + extid + ']').length == 0 ) {
				$(extensionElem).addClass('ui-state-active');
			}
		});
	}
}

function loadConfiguration() {
	contextsManager = new ContextsManager();
	extensionsManager = new ExtensionsManager(function(){
		displayExtensions();
		displayContexts();
		displayAdvancedOptions();
		pageLoaded();
		markClean();
	});
}

function loadTranslations() {
	$('[data-i18n]').each(function(i, item){
		$(item).text(chrome.i18n.getMessage($(item).data('i18n')));
	});
}

$(document).ready(function(){
	loadConfiguration();
	loadTranslations();
	initNewContextDialog();

	$('button, input[type=submit], input[type=button]').button();

	$('.removeBtn').live('click', function(){
		$(this).closest('li').effect('slide', {mode: 'hide'}, 'normal', function(){
			$(this).remove();
			markDirty();
		});
	});

	$('#help-icon').click(function(){
		showWelcomeScreen();
	});

	$('.contextDelete').live('click', function() {
		var context = $(this).closest('.context');
		var buttons = {};
		buttons[chrome.i18n.getMessage("delete")] = function() {
					context.effect('puff',{},'slow',function(){
						$(this).remove();
					});
					markDirty();

					$( this ).dialog( "close" );
				};
		buttons[chrome.i18n.getMessage("cancel")] = function() {
					$( this ).dialog( "close" );
				};

		$( "#dialog-confirm" ).dialog({
			title: chrome.i18n.getMessage("remove_context"),
			resizable: false,
			height: 200,
			modal: true,
			buttons: buttons
		}).find('span.dialog-content').text(chrome.i18n.getMessage("context_will_be_deleted"));

		return false;
	});

	$('.contextDuplicate').live('click', function(){
		var context = $(this).closest('.context');
		var contexts = $('.contextExtensions');

		var oldImageSrc = context.find('.contextExtensions').data('contextImg');
		var oldName = context.find('.contextExtensions').data('contextName');
		var newName;

		//generate new, unique name
		for(var j=1; ; j++) {
			var isValid = true;
			var checkName = oldName + j;

			for(var i=0; i<contexts.length; i++) {
				var otherContext = contexts[i];
				if($(otherContext).data('contextName') == checkName) {
					isValid = false;
					break;
				}
			}

			if(isValid) {
				newName = checkName;
				break;
			}
		}

		var newContext = context.clone();
		newContext.find('.contextExtensions').data('contextName', newName).data('contextImg', oldImageSrc);
		newContext.find('.contextTitle').text(newName);
		$('#contexts').append(newContext);

		newContext.effect('highlight', {}, 'slow');
		markDirty();

		return false;
	});

	$('.contextEdit').live('click', function() {
		openEditContextDialog($(this).closest('.context'));
		return false;
	});

	/* Additional options */
	$('#accordion').accordion({
		autoHeight: false,
		collapsible: true,
		active: false
	});

	$('#additional-options-panel').find('input, checkbox, select, textarea').change(function(){
		markDirty();
	});

	$('#appsSupport').change(function() {
		if($(this).is(':checked')) {
			$('li.app').effect('slide', {}, 'normal', markDirty);
		} else {
			$('li.app').effect('slide', {mode: 'hide'}, 'normal', markDirty);
		}
	});

	//moving extensions between 'available' section and 'always enabled' section
	$('#extensions').droppable({
		activeClass: 'active_dense',
		hoverClass: 'active_hover',
		accept: function(element){
			if(element.is('#always_enabled_extensions li')) {
				return true;
			}

			return false;
		},
		drop: function(event, ui) {
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
		accept: function(element){
			if(element.is('#extensions li')) {
				return true;
			}

			return false;
		},
		drop: function(event, ui) {
			var li = ui.draggable.detach();
			$(this).append(li);

			//HACK - contexts stay highlighted after object is dropped - AFAIK it is because draggable is detached not cloned
			$('.contextExtensions.active').removeClass('active');

			//remove this extension from all contexts as it is redundant there now
			$('.context li[data-extid=' + li.data('extid') + ']').effect('slide', {mode: 'hide'});

			markDirty();
		}
	});

	$('#highlightUngrouped').click(function() {
		highlightUngrouped();
	});

	$('#export_box, #import_box').click(function() {
		this.select();
	});

	$('#import_button').click(function() {
		var buttons = {};
		buttons[chrome.i18n.getMessage("import")] = function() {
					configurationBackupImporter.importConfig( $('#import_box').val(), function(status, missingExtensions, errors) {
						if( status ) {
							importSuccessDialog({
								missingExtensions: missingExtensions,
								callback: function() {
									loadConfiguration();
									$('#import_box').val('');
								}
							});
						} else {
							console.error( errors );

							showErrorDialog({
								title: chrome.i18n.getMessage("import_failed"),
								content: chrome.i18n.getMessage("configuration_string_is_invalid")
							});
						}
					});

					$( this ).dialog( "close" );
				};
		buttons[chrome.i18n.getMessage("cancel")] = function() {
					$( this ).dialog( "close" );
				};

		$( "#dialog-confirm" ).dialog({
			title: chrome.i18n.getMessage("override_current_settings"),
			resizable: false,
			width: 300,
			height: 200,
			modal: true,
			buttons: buttons
		}).find('span.dialog-content').text(chrome.i18n.getMessage("confirm_configuration_import"));

		return false;
	});

	$('#new-context-button').click(function(){
		openNewContextDialog();
	});
	$('#save-button').click(function(){
		save();
	});
});