

function load() {
	$('#menu_checkbox')[0].checked = true
	document.addEventListener('backbutton', function (event) {
		if ($('#menu_checkbox')[0].checked) {
			if (navigator.app && navigator.app.exitApp)
				navigator.app.exitApp()
		} else
			$('#menu_checkbox').click()
	}, false);

	function getFilter(group) {
		return function (x) {
			return x.group == group
		}
	}

	var vec = pages.filter(getFilter(GROUP_VECTOR))
	var mat = pages.filter(getFilter(GROUP_MATRIX))

	function getTD(group, i) {
		var g = group == GROUP_VECTOR ? vec : mat
		var id = 'menuCell' + (['','V','M'])[group] + i
		return '<td>' + (g[i] == null ? '' :
			'<button class="menuCell" id="' + id + '">' + g[i].title + '</button>' ) +'</td>'
	}

	var menu = ''
	for (var i = 0; i < Math.max(vec.length, mat.length); i++) {
		menu += '<tr>' + getTD(GROUP_VECTOR, i) + getTD(GROUP_MATRIX, i) + '</tr>'
	}

	$('#menu table:first').html(
		$('#menu table:first').html() + menu
	)

	$('.menuCell').click(function () {
		$('#menu_checkbox')[0].disabled = false

		var id = $(this).attr('id')
		if (/^menuCell[V|M][0-9]+$/.test(id)) {
			var group = id.substr(8, 1) == 'V' ? vec : mat
			var i = id.substr(9)
			var name = group[i].name
			$('#main > div.active').removeClass('active')
			$('#main_' + name).addClass('active')
			$('#menu_checkbox')[0].checked = false
			$('#current').html(group[i].title)

			$('#helpBtn').removeClass('active')
			$('#helpBtn div').html('&#xE88F;')
			$('#main > div.active .help').removeClass('active')

			$('#menu_checkbox').change()
		}
	})

	$('#menu_checkbox').change(function () {
		var menu = $('#menu_checkbox')[0].checked

		$('header label').css('left', menu ? '-20%' : '0%')

		$('#menu').css('display', menu ? 'block' : 'none')
	})

	clipboard = loadMatrix('clipboard') // Returned [], falls Clipboard empty.
	if (!M.isMatrix(clipboard))
		$('button[id$=pasteBtn]').each(function () {
			$(this)
				.addClass('clipboardDisabled')
				.attr('disabled', 'disabled')
		})
	$('button[id$=copyBtn], button[id$=copyInputBtn]').click( function () {
		$('button[id$=pasteBtn].clipboardDisabled').removeAttr('disabled')
	})

	pages.forEach(function (page, i) {
		page.load(i)
	})
	$('#menu').show().fadeIn()

	//$('#menuCellM2').click()
}
