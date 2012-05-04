var welcomeTab;
var welcomeScreenReady = false;

//display welcome screen and tutorial
function showWelcomeScreen() {
	welcomeTab = 0;
	$('#welcome li:gt(0)').hide();
	$('#welcome li:eq(0)').show();
	$('#welcome .previous').button('option', 'disabled', true);
	$('#welcome .next').show().button('option', 'disabled', false);
	$('#welcome .close').hide();

	if(!welcomeScreenReady) {
		initWelcomeScreen();
		welcomeScreenReady = true;
	}

	$('#welcome').dialog( "open" );
}

function initWelcomeScreen() {
	$('#welcome').show().dialog({
		title: chrome.i18n.getMessage("welcome") + '!',
		resizable: false,
		width: 510,
		modal: true
	});

	$('#welcome .next').click(function() {
		if(welcomeTab + 1 == $('#welcome li').length) {
			return;
		}

		welcomeTab++;

		if(welcomeTab + 1 == $('#welcome li').length) {
			$(this).button('option', 'disabled', true);
			$(this).hide();
			$('#welcome .close').show();
		}

		$('#welcome .previous').button('option', 'disabled', false);

		$('#welcome li').hide();
		$('#welcome li:eq(' + welcomeTab + ')').show();
	});

	$('#welcome .previous').click(function() {
		if(welcomeTab - 1 < 0) {
			return;
		}

		welcomeTab--;

		$('#welcome .next').show();
		$('#welcome .close').hide();

		if(welcomeTab - 1 < 0) {
			$(this).button('option', 'disabled', true);
		}

		$('#welcome .next').button('option', 'disabled', false);

		$('#welcome li').hide();
		$('#welcome li:eq(' + welcomeTab + ')').show();
	});

	$('#welcome .close').click(function() {
		$('#welcome').dialog( "close" );
	});
}