function isFunction(func) {
	var getType = {};
	return func && getType.toString.call(func) === '[object Function]';
}

function createSlider(id, start, min, max, updateCallback) {
	var slider = document.getElementById(id)
	noUiSlider.create(slider, {
		start: start,
		connect: [true, false],
		step: 1,
		range: {
			'min': min,
			'max': max
		},
		format: {
			to: function (x) { return Math.floor(x) },
			from: function (x) { return Math.floor(x) }
		}
	})
	slider.noUiSlider.on('update', function () {
		if (updateCallback != undefined) updateCallback(slider.noUiSlider.get())
	})
	return slider
}
function fillTableWithMatrix(table_id, matrix, head, cellChangeCallback) {
	if (!M.isMatrix(matrix)) return

	var width = matrix.length, height = matrix[0].length

	var html = ''
	if (head || null != null) {
		html += '<tr><th colspan="' + width + '">' + head + '</th></tr>'
	}
	for (var i = 0; i < height; i++) {
		html += '<tr>'
		for (var j = 0; j < width; j++)  {
			var val = Math.round(matrix[j][i] * Math.pow(10, 10)) / Math.pow(10, 10)
			if (val == 0) val = ''
			html += '<td><input type="number" placeholder="0" value="'
				+ val
				+ '" min="-100000" max="100000" /></td>'
		}
		html += '</tr>'
	}
	$('#' + table_id).html(html)
	if (cellChangeCallback != undefined) {
		$('#' + table_id + ' input').keyup(function () {
			cellChangeCallback()
		}).change(function () {
			if ($(this).val() == 0) $(this).val('')
			cellChangeCallback()
		})
	}}
function fillTable(table_id, width, height, head, cellChangeCallback, random) {
	var matrix = []
	if (random == true) matrix = M.getRandomMatrix(width, height, -15, 15)
	else matrix = M.getEmptyMatrix(width, height)

	fillTableWithMatrix(table_id, matrix, head, cellChangeCallback)
}
function saveMatrix(key, data) {
	if (!M.isMatrix(data)) return
	var str = JSON.stringify(data)
	localStorage.setItem('mathrix_' + key, str)
}
function loadMatrix(key, stdWidth, stdHeight) {
	var str = localStorage.getItem('mathrix_' + key)
	var data = JSON.parse(str)
	if (M.isMatrix(data)) return data
	return M.getEmptyMatrix(stdWidth, stdHeight)
}
function bindSliderToTable(slider, width, height, table_id, cellChangeCallback, head) {
	slider.noUiSlider.on('update', function () {
		var val = slider.noUiSlider.get()

		var ww = width == null ? val : width
		var hh = height == null ? val : height
		if (isFunction(width)) ww = width()
		if (isFunction(height)) hh = height()

		// Die Tabelle ist so groß wie zuvor -> er muss nicht updaten
		if (ww * hh == $('#' + table_id + ' input').length) return

		fillTable(table_id, ww, hh, head, cellChangeCallback)

	})
}
function getTableClearFunction(table_id_stringOrArray, callback) {
	function clearTable(table_id) {
		$('#' + table_id +' input').each(function () {
			$(this).val('')
		})
	}
	return function () {
		if (Array.isArray(table_id_stringOrArray))
			table_id_stringOrArray.forEach(clearTable)
		else
			clearTable(table_id_stringOrArray)
		if (callback != undefined) callback()
	}
}
function getMatrixFromTable(table_id, width) {
	var raw = []
	$('#' + table_id +' input').each(function () {
		raw.push(parseFloat(this.value) || 0)
	})

	var raw2 = []
	for (var i = 0; i < (raw.length / width); i++) {
		raw2.push(raw.slice(0).splice(i * width, width))
	}

	if (M.isMatrix(raw2))
		return raw2.transpose()
	else
		return []
}
function getCopyClickEventHandler(pageIndex) {
	return function () {
		clipboard = pages[pageIndex].lastresult
		saveMatrix("clipboard", clipboard)
	}
}
function getCopyInputClickEventHandler(tableId, getWidthFunc) {
	return function () {
		clipboard = getMatrixFromTable(tableId, getWidthFunc())
		saveMatrix("clipboard", clipboard)
	}
}
function getPasteClickHandler(callback, minSize, maxSize, mustBeSquare) {
	return function () {
		console.log("hey")

		if (!M.isMatrix(clipboard)) return


		if (mustBeSquare && clipboard.length != clipboard[0].length)
			return alert("Not possible. Please try to paste a square matrix.")

		if (clipboard.length >= minSize
			&& clipboard.length <= maxSize
			&& clipboard[0].length >= minSize
			&& clipboard[0].length <= maxSize) {
				if (callback) callback()
		} else
			alert("Invalid matrix dimensions. Tr")
	}
}
function calcLog10(n) {
	return Math.log(n) / Math.log(10)
}
function formatNumber(exact) {
	exact = Math.round(Math.pow(10, 9) * exact) / Math.pow(10, 9)
	var log10 = Math.floor(calcLog10(Math.abs(exact)))
	var dec = exact / Math.pow(10, log10)

	dec = Math.round(100 * dec) / 100

	var result = {big: '', small: '', exact: exact,
		places: function (n) {
			return Math.round(Math.pow(10, n) * exact) / Math.pow(10, n)
		}
	}
	if (isNaN(exact)) {
		result.big = '?'
	} else if (!isFinite(log10) && exact != 0) {
		result.big = '&infin;'
	} else if (log10 > 6) {
		result.big = dec + ' * <nobr>10<small class="hidden">^</small><sup>' + log10 + '</sup></nobr>'
	} else
		result.big = Math.floor(100 * exact) / 100

	if (result.big != exact) {
		result.small = '<span>(</span><div>' + exact + '</div><span>)</span>'
	}

	result.big = '<div>' + result.big + '</div>'
	return result
}
function getTableFromMatrix(matrix) {
	if (!M.isMatrix(matrix)) return ''
	return matrix
		.transpose()
		.map( function (x) { return '<tr>' + x
			.map( function (x) { return formatNumber(x).places(4) })
			.map( function (x) { return '<td>' + x + '</td>' })
			.join('') + '</tr>'
		}).join('')
}

function getTableFromStringMatrix(matrix) {
	return matrix
		.transpose()
		.map( function (x) { return '<tr>' + x
			.map( function (x) { return '<td>' + x + '</td>' })
			.join('') + '</tr>'
		}).join('')
}
