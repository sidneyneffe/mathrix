
var GROUP_NONE = 0, GROUP_VECTOR = 1, GROUP_MATRIX = 2

var clipboard = null

function pageErrorMessage() {
	return '<p><strong>Oh, snap! Something went wrong :(</strong></p>'
		+ 'Please send a screenshot to <a href="mailto:info@sjnsoft.de">'
		+ 'info@sjnsoft.de</a>.'
}

var pages = [
	['Length', 'length', GROUP_VECTOR, function (index) {
		var MIN_SIZE = 1, MAX_SIZE = 6, STD_SIZE = 2, loaded = false

		function compute() {
			var vec = getMatrixFromTable('len_vector', 1)[0]

			if (loaded) saveMatrix(pages[index].name, [vec])

			var format = formatNumber(vec.size())
			$('#len_result .exact').html(format.small)
			$('#len_result .inner').html(format.big)
		}

		// LOADING
		var saved = loadMatrix(pages[index].name, 1, STD_SIZE)
		var slider = createSlider('len_slider', saved[0].length, MIN_SIZE, MAX_SIZE, function (val) {
			$('#len_slider_val').html(val + 'x1')
		})
		fillTableWithMatrix('len_vector', saved, '', compute)
		loaded = true

		bindSliderToTable(slider, 1, null, 'len_vector', compute, '')
		slider.noUiSlider.on('update', compute)

		$('#len_pasteBtn').click(getPasteClickHandler(function () {
			if (clipboard.length == 1) {
				$('#len_slider')[0].noUiSlider.set(clipboard[0].length)
				fillTableWithMatrix('len_vector', clipboard, '', compute)
				compute()
			}
		}, MIN_SIZE, MAX_SIZE, false))

		$('#len_clearBtn').click(getTableClearFunction('len_vector', compute))

	}],
	['Dot product', 'dotproduct', GROUP_VECTOR, function (index) {
		var MIN_SIZE = 1, MAX_SIZE = 6, STD_SIZE = 2, loaded = false

		function compute() {
			var vec0 = getMatrixFromTable('dot_vector0', 1)
			var vec1 = getMatrixFromTable('dot_vector1', 1)

			if (loaded) saveMatrix(pages[index].name, M.action.combineX(vec0, vec1))

			var format = formatNumber(vec0.transpose().multiply(vec1)[0][0])
			$('#dot_result .exact').html(format.small)
			$('#dot_result .inner').html(format.big)

			var rawAngle = vec0[0].angle(vec1[0])
			var angle = formatNumber(rawAngle / Math.PI * 180).places(2)

			var text = ''
			if (!isNaN(angle)) text = '<span>&angle;(a, b)=</span>' + angle + '<span>°</span>'

			$('#dot_result .text').html(text)
			$('#dot_result .text').css('display', text == '' ? 'none' : 'block')

		}

		// LOADING
		var saved = loadMatrix(pages[index].name, 2, STD_SIZE)

		var slider = createSlider('dot_slider', saved[0].length, MIN_SIZE, MAX_SIZE, function (val) {
			$('#dot_slider_val').html(val + 'x1')
		})

		fillTableWithMatrix('dot_vector0', [saved[0]], 'a', compute)
		fillTableWithMatrix('dot_vector1', [saved[1]], 'b', compute)
		loaded = true

		bindSliderToTable(slider, 1, null, 'dot_vector0', compute, 'a')
		bindSliderToTable(slider, 1, null, 'dot_vector1', compute, 'b')
		slider.noUiSlider.on('update', compute)

		$('#dot_pasteBtn0').click(getPasteClickHandler(function () {
			if (clipboard.length == 1) {
				$('#dot_slider')[0].noUiSlider.set(clipboard[0].length)
				fillTableWithMatrix('dot_vector0', clipboard, 'a', compute)
				compute()
			}
		}, MIN_SIZE, MAX_SIZE, false))

		$('#dot_pasteBtn1').click(getPasteClickHandler(function () {
			if (clipboard.length == 1) {
				$('#dot_slider')[0].noUiSlider.set(clipboard[0].length)
				fillTableWithMatrix('dot_vector1', clipboard, 'b', compute)
				compute()
			}
		}, MIN_SIZE, MAX_SIZE, false))

		$('#dot_clearBtn').click(getTableClearFunction(['dot_vector0', 'dot_vector1'], compute))
	}],
	['Vector product', 'vectorproduct', GROUP_VECTOR, function (index) {
		var SIZE = 3, loaded = false
		function compute() {
			var vec0 = getMatrixFromTable('vp_vector0', 1)[0]
			var vec1 = getMatrixFromTable('vp_vector1', 1)[0]

			if (loaded) saveMatrix(pages[index].name, M.action.combineX(vec0, vec1))

			var result = [vec0.vectorproduct(vec1)]
			pages[index].lastresult = result

			if (M.isMatrix(result)) {
				$('#vp_copyBtn').show()
				$('#vp_result .text').html('')
			}
			else {
				$('#vp_copyBtn').hide()
				$('#vp_result .text').html('<p>Please try smaller numbers.</p>')
			}

			var table = getTableFromMatrix(result)
			$('#vp_result .output_matrix').html('<table>' + table + '</table>')
		}
		fillTable('vp_vector0', 1, 3, 'a', compute)
		fillTable('vp_vector1', 1, 3, 'b', compute)

		// LOADING
		var saved = loadMatrix(pages[index].name, 2, SIZE)
		fillTableWithMatrix('vp_vector0', [saved[0]], 'a', compute)
		fillTableWithMatrix('vp_vector1', [saved[1]], 'b', compute)
		loaded = true

		$('#vp_pasteBtn0').click(getPasteClickHandler(function () {
			if (clipboard.length == 1 && clipboard[0].length == 3) {
				fillTableWithMatrix('vp_vector0', clipboard, 'a', compute)
				compute()
			}
		}, 1, SIZE, false))

		$('#vp_pasteBtn1').click(getPasteClickHandler(function () {
			if (clipboard.length == 1 && clipboard[0].length == 3) {
				fillTableWithMatrix('vp_vector1', clipboard, 'b', compute)
				compute()
			}
		}, 1, SIZE, false))

		$('#vp_clearBtn').click(getTableClearFunction(['vp_vector0', 'vp_vector1'], compute))
		$('#vp_copyBtn').click(getCopyClickEventHandler(index))

		compute()
	}],
	['Multiplication', 'matrixmulti', GROUP_MATRIX, function (index) {
		var MIN_SIZE = 1, MAX_SIZE = 5, STD_SIZE = 2, loaded = false
		var sliders = []
		function getValues() {
			var values = sliders.map(function (s) { return s.noUiSlider.get() })
			return {inY: values[0], inX: values[1], outX: values[2]}
		}
		function update() {
			if (sliders.length == 0) return
			var v = getValues()
			$('#mm_slider_val').html('('+v.inY+'x'+v.inX +') x ('+
				v.inX+'x'+v.outX +') = '+ v.inY+'x'+v.outX)
		}
		var computeCounter = 0
		function compute() {
			// Das Setzen von einem update-listener updated den Slider...
			if (computeCounter < sliders.length) {
				computeCounter++
				return
			}

			var m0 = getMatrixFromTable('mm_matrix0', getValues().inX)
			var m1 = getMatrixFromTable('mm_matrix1', getValues().outX)

			if (loaded) {
				saveMatrix(pages[index].name + "0", m0)
				saveMatrix(pages[index].name + "1", m1)
			}

			var matrixProduct = m0.multiply(m1)

			pages[index].lastresult = matrixProduct

			var table = getTableFromMatrix(matrixProduct)
			$('#mm_result .output_matrix').html('<table>' + table + '</table>')

			var text = ''
			$('#mm_result .text').html(text)
		}

		// LOADING
		var saved0 = loadMatrix(pages[index].name + "0", STD_SIZE, STD_SIZE)
		var saved1 = loadMatrix(pages[index].name + "1", STD_SIZE, STD_SIZE)
		sliders = [
			createSlider('mm_slider0', saved0[0].length, MIN_SIZE, MAX_SIZE, update),
			createSlider('mm_slider1', saved0.length, MIN_SIZE, MAX_SIZE, update),
			createSlider('mm_slider2', saved1.length, MIN_SIZE, MAX_SIZE, update)
		]
		fillTableWithMatrix('mm_matrix0', saved0, '', compute)
		fillTableWithMatrix('mm_matrix1', saved1, '', compute)
		loaded = true

		function getValuesFunc(i) {
			return function () {
				return sliders[i].noUiSlider.get()
			}
		}
		bindSliderToTable(sliders[0], getValuesFunc(1), null, 'mm_matrix0', compute)
		bindSliderToTable(sliders[1], null, getValuesFunc(0), 'mm_matrix0', compute)
		bindSliderToTable(sliders[1], getValuesFunc(2), null, 'mm_matrix1', compute)
		bindSliderToTable(sliders[2], null, getValuesFunc(1), 'mm_matrix1', compute)


		sliders.forEach(function (slider) { return slider.noUiSlider.on('update', compute) })

		$('#mm_copyBtn').click(getCopyClickEventHandler(index))
		$('#mm_copyInputBtn0').click(getCopyInputClickEventHandler('mm_matrix0', getValuesFunc(1)))
		$('#mm_copyInputBtn1').click(getCopyInputClickEventHandler('mm_matrix1', getValuesFunc(2)))


		$('#mm_pasteBtn0').click(getPasteClickHandler(function () {
			$('#mm_slider0')[0].noUiSlider.set(clipboard[0].length)
			$('#mm_slider1')[0].noUiSlider.set(clipboard.length)
			fillTableWithMatrix('mm_matrix0', clipboard, '', compute)
			compute()
		}, MIN_SIZE, MAX_SIZE, false))
		$('#mm_pasteBtn1').click(getPasteClickHandler(function () {
			$('#mm_slider1')[0].noUiSlider.set(clipboard[0].length)
			$('#mm_slider2')[0].noUiSlider.set(clipboard.length)
			fillTableWithMatrix('mm_matrix1', clipboard, '', compute)
			compute()
		}, MIN_SIZE, MAX_SIZE, false))

		$('#mm_clearBtn0').click(getTableClearFunction('mm_matrix0', compute))
		$('#mm_clearBtn1').click(getTableClearFunction('mm_matrix1', compute))
		compute()
	}],
	['Determinant', 'determinant', GROUP_MATRIX, function (index) {
		var MIN_SIZE = 1, MAX_SIZE = 6, STD_SIZE = 2, loaded = false

		function compute() {
			var dim = Math.floor(slider.noUiSlider.get())
			var data = getMatrixFromTable('det_matrix', dim)

			if (loaded) saveMatrix(pages[index].name, data)

			var format = formatNumber(data.determinant())
			$('#det_result .exact').html(format.small)
			$('#det_result .inner').html(format.big)
		}

		// LOADING
		var saved = loadMatrix(pages[index].name, STD_SIZE, STD_SIZE)
		var slider = createSlider('det_slider', saved.length, MIN_SIZE, MAX_SIZE, function (val) {
			$('#det_slider_val').html(val + 'x' + val)
		})
		fillTableWithMatrix('det_matrix', saved, '', compute)
		loaded = true

		bindSliderToTable(slider, null, null, 'det_matrix', compute)
		slider.noUiSlider.on('update', compute)

		$('#det_clearBtn').click(getTableClearFunction('det_matrix', compute))

		$('#det_copyInputBtn').click(getCopyInputClickEventHandler('det_matrix', slider.noUiSlider.get))

		$('#det_pasteBtn').click(getPasteClickHandler(function () {
			$('#det_slider')[0].noUiSlider.set(clipboard.length)
			fillTableWithMatrix('det_matrix', clipboard, '', compute)
			compute()
		}, MIN_SIZE, MAX_SIZE, true))
	}],
	['Inverse', 'inverse', GROUP_MATRIX, function (index) {
		var MIN_SIZE = 1, MAX_SIZE = 5, STD_SIZE = 2, loaded = false

		function compute() {
			var dim = Math.floor(slider.noUiSlider.get())
			var data = getMatrixFromTable('inv_matrix', dim)

			if (loaded) saveMatrix(pages[index].name, data)

			var inverse = data.inverse()

			var text = ''

			if (!inverse) {
				$('#inv_result .output_matrix').html('')
				text = 'No possible inverse.'
				$('#inv_copyBtn').hide()
			} else if (!M.isMatrix(inverse)) {
				text = pageErrorMessage()
			} else {
				var table = getTableFromMatrix(inverse)
				$('#inv_result .output_matrix').html('<table>' + table + '</table>')
				$('#inv_copyBtn').show()
				pages[index].lastresult = inverse
			}

			$('#inv_result .text').html(text)
		}

		// LOADING
		var saved = loadMatrix(pages[index].name, STD_SIZE, STD_SIZE)
		var slider = createSlider('inv_slider', saved.length, MIN_SIZE, MAX_SIZE, function (val) {
			$('#inv_slider_val').html(val + 'x' + val)
		})
		fillTableWithMatrix('inv_matrix', saved, '', compute)
		loaded = true

		bindSliderToTable(slider, null, null, 'inv_matrix', compute)
		slider.noUiSlider.on('update', compute)

		$('#inv_pasteBtn').click(getPasteClickHandler(function () {
			$('#inv_slider')[0].noUiSlider.set(clipboard.length)
			fillTableWithMatrix('inv_matrix', clipboard, '', compute)
			compute()
		}, MIN_SIZE, MAX_SIZE, true))

		$('#inv_clearBtn').click(getTableClearFunction('inv_matrix', compute))

		$('#inv_copyBtn').click(getCopyClickEventHandler(index))
		$('#inv_copyInputBtn').click(getCopyInputClickEventHandler('inv_matrix', slider.noUiSlider.get))
	}],
	['Lin. syst. of equasions', 'solve', GROUP_MATRIX, function (index) {
		var MIN_SIZE = 1, MAX_SIZE = 5, STD_SIZE = 2, loaded = false
		function compute() {
			var dim = Math.floor(slider.noUiSlider.get())
			var data = getMatrixFromTable('sol_matrix', dim + 1)

			if (loaded) saveMatrix(pages[index].name, data)

			var vector = data.pop()
			var matrix = data // Nach dem Entfernen des letzten Elements

			var result = matrix.solve(vector)

			var text = ''

			$('#sol_result .before_text').html('')

			if (!result.hasSolution) {
				if (result.infinite) {
					$('#sol_result .before_text').html('There are &infin; solutions:')
					$('#sol_result .inner').html('')

					var matrix = result.x.transpose()
					for (var y = 0; y < matrix.length; y++) {
						var row = matrix[y]

						row[0] = row[0] == '' ? '' : formatNumber(row[0]).places(2) + ' '

						for (var x = 1; x < row.length; x++) {
							if (row[x] == 0) {
								row[x] = ''
								continue
							}
							var pm = row[x] > 0 ? (row[0] == '' ? '' : '+') : '-'
							var formatted = formatNumber(Math.abs(row[x])).places(2)
							if (Math.abs(row[x]) == 1) row[x] = ''
							else row[x] = formatted

							var space = ' '
							if (row.slice(0, x).join("") == '') space = ''

							row[x] = pm + space + row[x] + '&lambda;<sub>'+x+'</sub> '
						}

						if (row.join("") == '') row[0] = '0'

						matrix[y] = row.join("")
					}


					var table = getTableFromStringMatrix([matrix])
					$('#sol_result .output_matrix').html('<table>' + table + '</table>')

					var lambda = result.x.slice(1).map( function (_, i) {
						return '&lambda;<sub>'+ (i+1) +'</sub>'
					}).join(", ")

					text += lambda + ' &isin; &#x211D;'
					$('#sol_copyBtn').hide()
				} else {
					$('#sol_result .output_matrix').html('')
					$('#sol_result .inner').html('<div>?</div>')
					text = 'No solutions.'
					$('#sol_copyBtn').hide()
				}
			} else if (!M.isVector(result.solution)) {
				text = pageErrorMessage()
				$('#sol_result .inner').html('')
			} else {
				var table = getTableFromMatrix([result.solution])
				$('#sol_result .output_matrix').html('<table>' + table + '</table>')
				$('#sol_result .inner').html('')
				text = 'This is the only solution.'
				$('#sol_copyBtn').show()
				pages[index].lastresult = [result.solution]
			}
			$('#sol_result .text').html(text)
			return

		}

		// LOADING
		var saved = loadMatrix(pages[index].name, STD_SIZE + 1, STD_SIZE)
		var slider = createSlider('sol_slider', saved[0].length, MIN_SIZE, MAX_SIZE, function (val) {
			$('#sol_slider_val').html(val == 1 ? val + ' dimension' : val + ' dimensions')
		})
		fillTableWithMatrix('sol_matrix', saved, 'A, v', compute)
		loaded = true

		bindSliderToTable(slider, function () {
			return slider.noUiSlider.get() + 1
		}, null, 'sol_matrix', compute, 'A, v')
		slider.noUiSlider.on('update', compute)

		$('#sol_clearBtn').click(getTableClearFunction('sol_matrix', compute))
		$('#sol_copyBtn').click(getCopyClickEventHandler(index))
	}],
	['Randomizer', 'random', GROUP_MATRIX, function (index) {
		var MIN_SIZE = 1, MAX_SIZE = 5
		var sliders = []
		function update(val) {
			if (sliders.length != 2) return
			$('#rand_slider_val').html(sliders[0].noUiSlider.get()
				+ 'x' + sliders[1].noUiSlider.get())
		}

		sliders = [
			createSlider('rand_slider0', 3, MIN_SIZE, MAX_SIZE, update),
			createSlider('rand_slider1', 1, MIN_SIZE, MAX_SIZE, update)
		]

		function compute() {
			var width = Math.floor(sliders[1].noUiSlider.get())
			var height = Math.floor(sliders[0].noUiSlider.get())
			var result = M.getRandomMatrix(width, height, -15, 15)

			var table = getTableFromMatrix(result)
			$('#rand_result .output_matrix').html('<table>' + table + '</table>')
			pages[index].lastresult = result
		}
		sliders[0].noUiSlider.on('update', compute)
		sliders[1].noUiSlider.on('update', compute)

		$('#rand_clearBtn').click(getTableClearFunction('rand_matrix', compute))

		$('#rand_copyBtn').click(getCopyClickEventHandler(index))
	}],

].map( function (x) { return {title: x[0], name: x[1], group: x[2], lastresult: null,
	load: x[3] || function (index) {} } } )
