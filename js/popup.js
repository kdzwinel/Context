function createContextLi(name, title, imgSrc) {
	var img = $('<img>').attr('src', imgSrc);
	var span = $('<span>').append(title);
	var all = ((name == 'all') ? 'all' : 'single') + '-context';

	var activate = $("<div class='list-button activate ui-widget-content ui-corner-all'><span class='ui-icon ui-icon-plusthick'></span></div>");
	var deactivate = $("<div class='list-button deactivate ui-widget-content ui-corner-all'><span class='ui-icon ui-icon-minusthick'></span></div>");

	var context = $('<div>').attr('class', 'list-context ui-widget-content ui-corner-all ' + all).append(img).append(span);

	return $('<li>').attr('class', 'clearfix').append(context).append(activate).append(deactivate).data('contextName', name);
}

var contextsManager = new ContextsManager();
var blocked = false;
var allBtn;

$(document).ready(function(){
	//load and display avaiable contexts
	var contexts = contextsManager.getContextsList();

	$.each(contexts, function(i, context) {
		$('ul').append(createContextLi(context.name, context.name, context.imgSrc));
	});

	//create a context activating all extensions
	if(CONFIG.get('showLoadAllBtn') === 'true') {
		allBtn = createContextLi('all', chrome.i18n.getMessage("all_extensions"), 'icons/plugin.png');
		$('ul').append(allBtn);
	}

	$('ul li div.list-context, ul li div.list-button').click(function(){
		//make sure that user won't change the context while other context is loading
		if(blocked) {
			return;
		}
		blocked = true;

		$('ul li div.list-context, ul li div.list-button').not($(this)).addClass('ui-state-disabled');
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
});