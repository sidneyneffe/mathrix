var M = {
	solve: function (matrix, vector) {
		if (!M.isMatrix(matrix) || !M.isVector(vector)) return
		var width = matrix.length
		var height = matrix[0].length
		if (height != vector.length) return

		var combined = M.action.combineX(matrix, vector)

		var colSwaps = []
		for (var i = 0; i < width; i++)
			colSwaps.push(i)

		function swap(a, b) {
			var tmp = colSwaps[a]
			colSwaps[a] = colSwaps[b]
			colSwaps[b] = tmp
		}
		function roundIfAlmostZero(val) {
			if (val > -1e-10 && val < 1e-10) return 0
			return val
		}

		for (var x = 0; x < Math.min(width, height); x++) {
			var val = roundIfAlmostZero(combined[x][x])
			var swappingCompvare = true
			if (val == 0) {
				// Find col/row to swap.
				swappingCompvare = false
				swapLoop:
				for (var swapX = x; swapX < width; swapX++) {
					for (var swapY = x; swapY < height; swapY++) {
						var swapVal = roundIfAlmostZero(combined[swapX][swapY])
						combined[swapX][swapY] = swapVal
						if (swapVal != 0) {
							if (x != swapX) swap(x, swapX)
							combined = M.action.swapCol(combined, x, swapX)
							combined = M.action.swapRow(combined, x, swapY)
							swappingCompvare = true
							break swapLoop
						}
					}
				}
			}

			if (swappingCompvare) {
				val = combined[x][x] // Maybe val has changed.
				combined = M.action.multiplyRow(combined, x, 1 / val)
			} else {
				break
			}

			for (var y = 0; y < height; y++) {
				if (x == y) continue
				val = combined[x][y]
				if (val != 0) {
					combined = M.action.subtractMultipliedRow(combined, y, x, val)
				}
			}
		}

		// Making the matrix a square
		var square = combined.slice(0, -1)
		var squareVector = combined.slice(-1)[0]
		//square = M.action.removeRightEmptyCols(square)
		square = M.action.removeRightEmptyRows(square)
		var dim = square.length
		var currentHeight = square[0].length
		square = M.action.addEmptyRows(square, dim - currentHeight)

		// Maybe there is no solution at all
		if (squareVector.slice(dim).some( function (val) { return val != 0 })) {
			return { hasSolution: false, infinite: false}
		}

		squareVector = squareVector.slice(0, dim)
		while (squareVector.length < dim) squareVector.push(0)

		combined = M.action.combineX(square, squareVector)

		var nullSpaceDim = dim - combined.filter( function (col, i) {
			return i < dim && roundIfAlmostZero(col[i] - 1) == 0
		}).length

		if (nullSpaceDim > 0) {
			if (combined[dim].slice(-nullSpaceDim).some( function (cell, i) {
				return roundIfAlmostZero(cell) != 0
			})) {
				// Keine Lösung
				return { hasSolution: false, infinite: false }
			} else {
				// Unendlich Lösungen
				var xUnsorted = [combined[dim]]

				for (var i = dim - nullSpaceDim; i < dim; i++) {
					var col = combined[i].slice(0)
					col = M.action.multiplyCol([col], 0, -1)[0]
					col[i] = 1 // z.B. c = 0 + 1c
					xUnsorted.push(col)
				}

				// Nun muss x noch sortiert werden.
				var x = [], transposed = xUnsorted.transpose()
				for (var i = 0; i < transposed.length; i++) {
					x[colSwaps[i]] = transposed[i]
				}
				x = x.transpose()

				// x: height x (width-rank) Matrix
				return { hasSolution: false, infinite: true, x: x }
			}
		}

		// Ich glaube, wenn es nur eine Lösung gibt, das kein
		// colSwap benötigt wurde.
		var result = []
		for (var x = 0; x < dim; x++) {
			//var val = combined[x][x]
			var target = combined[dim][x]
			//if (val == 1) {
				result.push(target)
			//}
		}

		return { hasSolution: true, solution: result}

	},
	rank: function (matrix) {
		if (!M.isMatrix(matrix)) return
		var width = matrix.length
		var height = matrix[0].length

		for (var x = 0; x < width; x++) {
			for (var y = x; y < height; y++) {
				var val = matrix[x][y]
				if (x == y) {
					var swappingCompvare = true
					if (val == 0) {
						// Find col/row to swap.
						swappingCompvare = false
						swapLoop:
						for (var swapX = x; swapX < width; swapX++) {
							for (var swapY = y; swapY < height; swapY++) {
								if (matrix[swapX][swapY] != 0) {
									matrix = M.action.swapCol(matrix, x, swapX)
									matrix = M.action.swapRow(matrix, y, swapY)
									swappingCompvare = true
									break swapLoop
								}
							}
						}
					}

					if (swappingCompvare) {
						val = matrix[x][y] // Maybe val has changed.
						matrix = M.action.multiplyRow(matrix, y, 1 / val)
					} else {
						return y // Rank of our Matrix :)
					}
				} else if (val != 0) {
					matrix = M.action.subtractMultipliedRow(matrix, y, x, val)
				}
			}
		}

		return Math.min(width, height)
	},
	action: {
		getAsMatrix: function (raw) {
			if (M.isMatrix(raw)) return raw.slice(0)
			if (M.isVector(raw)) return [raw].slice(0)
			return
		},
		getRow: function (matrix, i) {
			if (!M.isMatrix(matrix) || i >= matrix[0].length) return []
			return matrix.transpose()[i]
		},
		swapCol: function (matrix, i, j) {
			if (!M.isMatrix(matrix)) return []
			var width = matrix.length
			if (!(i < width && j < width)) return []

			var tmp = matrix[j]
			matrix[j] = matrix[i]
			matrix[i] = tmp

			return matrix
		},
		swapRow: function (matrix, i, j) {
			return M.action.swapCol(matrix.transpose(), i, j).transpose()
		},
		addColToCol: function (matrix, to, from) {
			// to = to + from
			if (!M.isMatrix(matrix)) return []
			var width = matrix.length
			if (!(to < width && from < width)) return []

			matrix[to] = matrix[to].map( function (val, i) {
				return val + matrix[from][i]
			})

			return matrix
		},
		addRowToRow: function (matrix, to, from) {
			return M.action.addColToCol(matrix.transpose(), to, from).transpose()
		},
		multiplyCol: function (matrix, i, factor) {
			if (!M.isMatrix(matrix)) return []
			var width = matrix.length
			if (!(i < width)) return []

			matrix[i] = matrix[i].map( function (val) {
				return val * factor
			})

			return matrix
		},
		multiplyRow: function (matrix, i, factor) {
			return M.action.multiplyCol(matrix.transpose(), i, factor).transpose()
		},
		subtractMultipliedCol: function (matrix, to, from, factor) {
			var col = matrix[from]
			matrix = M.action.multiplyCol(matrix, from, -factor)
			matrix = M.action.addColToCol(matrix, to, from)
			matrix[from] = col
			return matrix
		},
		subtractMultipliedRow: function (matrix, to, from, factor) {
			return M.action.subtractMultipliedCol(matrix.transpose(),
				to, from, factor).transpose()
		},
		combineX: function (matrixLeft, matrixRight) {
			var left = M.action.getAsMatrix(matrixLeft)
			var right = M.action.getAsMatrix(matrixRight)

			if (!left || !right) return []

			right.forEach(function (col) {
				left.push(col)
			})
			return left
		},
		removeRightEmptyCols: function (matrix) {
			if (!M.isMatrix(matrix)) return []
			for (var i = matrix.length - 1; i > 1; i--) {
				if (matrix[i].every( function (val) {
					return val > -1e-10 && val < 1e-10
				}))
					matrix.splice(i, 1)
				else
					break
			}
			if (matrix.length == 0) matrix = [[0]]
			return matrix
		},
		removeRightEmptyRows: function (matrix) {
			return M.action.removeRightEmptyCols(matrix.transpose()).transpose()
		},
		addEmptyCols: function (matrix, num) {
			if (!M.isMatrix(matrix)) return
			num = parseInt(num)
			if (isNaN(num)) num = 0
			if (num <= 0) return matrix

			var zeroMatrix = M.getEmptyMatrix(num, matrix[0].length)
			return M.action.combineX(matrix, zeroMatrix)
		},
		addEmptyRows: function (matrix, num) {
			return M.action.addEmptyCols(matrix.transpose(), num).transpose()
		},
	},
	isMatrix: function (matrix) {
		if (!Array.isArray(matrix) || matrix.length == 0) return false
		if (matrix.some(function (a) { return !Array.isArray(a) })) return false
		var height = matrix[0].length
		if (height == 0) return false
		if (matrix.some(function (a) { return a.length != height })) return false
		if (matrix.some(function (a) { return a.some(function (c) {
			return isNaN(parseInt(c))
		}) })) return false
		if (matrix.some(function (a) { return a.some(function (c) {
			return Array.isArray(c)
		}) })) return false
		return true
	},
	isVector: function (vector) {
		var m = [vector]
		return M.isMatrix(m)
	},
	log: function (matrix, title) {
		if (M.isVector(matrix)) {
			matrix = [matrix]
		} else if (!M.isMatrix(matrix)) {
			console.log(title + ': invalid or empty matrix.')
			return
		}

		matrix = matrix.transpose().map( function (col) {
			return col
				.map( function (row) { return Math.round(row * 1000) / 1000 })
				.map( function (row) { return row.toString() })
		})
		var max = matrix.reduce( function (last, col) {
			return col.reduce( function (l, cell) {
				return Math.max(l, cell.length)
			}, last)
		}, 0)

		var t = title == null ? '' : title + ':'
		console.log(t + matrix
			.reduce( function (last, col) {
				return last + '\n' + col.map( function (cell) {
					return ' '.repeat(max - cell.length) + cell
				}).join(' ')
			}, ''))
	},
	dot: function (v0, v1) {
		if (!M.isVector(v0) || !M.isVector(v1)) return NaN

		var m = [v0]
		var result = m.transpose().multiply([v1])
		return M.isMatrix(result) ? result[0][0] : NaN
	},
	size: function (v) {
		return Math.sqrt(v.dot(v))
	},
	angle: function (v0, v1) {
		if (!M.isVector(v0) || !M.isVector(v1)) return NaN
		var tmp = v0.dot(v1) / v0.size() / v1.size()
		return Math.acos(Math.round(tmp * 1e8) / 1e8)
	},
	vectorproduct: function (v0, v1) {
		if (!M.isVector(v0) || !M.isVector(v1)) return NaN
		if (v0.length != 3 || v0.length != v1.length) return NaN
		return [
			v0[1]*v1[2] - v0[2]*v1[1],
			v0[2]*v1[0] - v0[0]*v1[2],
			v0[0]*v1[1] - v0[1]*v1[0],
		]
	},
	transpose: function (matrix) {
	    var transpose = matrix[0].map(function (e) { return [] })
	    matrix.forEach( function (a, i) {
	        return a.forEach( function (e, j) { return transpose[j][i] = e })
		})
	    return transpose
	},
	getEmptyMatrix: function (width, height) {
		var matrix = []
		for (var i = 0; i < width; i++) {
			var col = []
			for (var j = 0; j < height; j++)
				col.push(0)
			matrix.push(col)
		}
		return matrix
	},
	getRandomMatrix: function (width, height, min, max) {
		min = min == null ? -15 : min
		max = max == null ? 15 : max
		var matrix = []
		for (var i = 0; i < width; i++) {
			var col = []
			for (var j = 0; j < height; j++)
				col.push(min + Math.floor((max - min + 1) * Math.random()))
			matrix.push(col)
		}
		return matrix
	},
	multiply: function (m0, m1) {
		if(!M.isMatrix(m0) || !M.isMatrix(m1)) return []
		if (m0.length != m1[0].length) return []
		var resultHeight = m0[0].length
		var resultWidth = m1.length

		var result = []
		for (var x = 0; x < resultWidth; x++) {
			var col = []
			for (var y = 0; y < resultHeight; y++) {
				var c = 0
				for (var i = 0; i < m0.length; i++) {
					c += m0[i][y] * m1[x][i]
				}
				col.push(c)
			}
			result.push(col)
		}

		return result

		return [[1]]
	},
	determinant: function (matrix) {
		var dim = matrix.length
		if (dim != matrix[0].length)
			return false // Matrix nicht quadratisch
		if (dim == 1)
			return matrix[0][0] // Matrix mit nur 1 Celle
		// Matrix hat dim > 1

		// Zeile, nach der aufgelöst wird:
		const y = 0 // Wichtig: 0 => 1. Zeile!
		var result = 0
		for (var x = 0; x < dim; x++) {

			var positive = (x + y) % 2==0 ? 1 : -1 //Vorzeichen
			var factor = matrix[x][0]

			// Ich habe nun 4 Bereiche
			var areaDef = [
				[ [0, 0], [x-1, y-1] ],
				[ [0, y+1], [x-1, dim] ],
				[ [x+1, 0], [dim, y-1] ],
				[ [x+1, y+1], [dim, dim] ]
			]
			var areas = areaDef.map( function (def) {
				var x0 = def[0][0], y0 = def[0][1]
				var x1 = def[1][0], y1 = def[1][1]

				return (matrix
					.filter( function (col, xx) { return (x0 <= xx && xx <= x1) }) || [] )
					.map( function (col) {
						return col.filter( function (cell, yy) {
							return (y0 <= yy && yy <= y1)
						})
					} )
			})

			// Die 4 Bereiche werden nun zu einem verknüpft

			// Zusammenführung in x Richtung
			areas[2].forEach(function (a2) { return areas[0].push(a2) })
			areas[3].forEach(function (a3) { return areas[1].push(a3) })
			// Zusammenführung in y Richtung
			var area = areas[0].map( function (col, i) {
				areas[1][i].forEach( function (cell) { return col.push(cell) })
				return col
			})

			result += positive * factor * area.determinant()
		}

		return result
	},
	inverse: function (matrix) {
		if (!M.isMatrix(matrix) ||
			matrix.length != matrix[0].length) return

		if (matrix.determinant() != 0) {
			matrix = matrix.transpose()

			var dim = matrix.length

			// mRight fängt an als Einheitsmatrix und macht jeden
			// Schritt mit, den die Matrix macht, womit am Ende
			// mRight die Inverse der Matrix ist.
			var mRight = matrix.map( function (row, y) {
				return row.map( function (cell, x) {
					return x == y ? 1: 0
				})
			} )

			// Ich addiere zu jeder Zeile alle folgenden.
			function rowAddingAction(m, c) {
				return m[c].map( function (r, i) {
					var newVal = 0;
					for (var row = c; row < dim; row++)
						newVal += m[row][i]
					return newVal
				} )
			}

			for (var c = 0; c < dim; c++) {
				if (matrix[c][c] != 0) continue
				matrix[c] = rowAddingAction(matrix, c)
				mRight[c] = rowAddingAction(mRight, c)
			}

			function funcDevide(divisor) {
				return function (cell) { return cell / divisor }
			}
			function rowAction(m, j, i, factor) {
				return m[j].map( function (cell, k) {
					return cell - m[i][k] * factor
				})
			}

			for (var i = 0; i < dim; i++) {
				// i. Zeile durch das i. Element der Matrix
				var divisor = matrix[i][i]
				matrix[i] = matrix[i].map(funcDevide(divisor))
				mRight[i] = mRight[i].map(funcDevide(divisor))

				for (var j = 0; j < dim; j++) {
					if (j == i) continue

					var factor = matrix[j][i]
					matrix[j] = rowAction(matrix, j, i, factor)
					mRight[j] = rowAction(mRight, j, i, factor)
				}
			}

			return mRight.transpose()
		} else {
			return NaN
		}
	},
}


Array.prototype.transpose = function () {
	return M.transpose(this)
}
Array.prototype.rank = function () {
	return M.rank(this)
}
Array.prototype.dot = function (v1) {
	return M.dot(this, v1)
}
Array.prototype.size = function () {
	return M.size(this)
}
Array.prototype.angle = function (v1) {
	return M.angle(this, v1)
}
Array.prototype.vectorproduct = function (v1) {
	return M.vectorproduct(this, v1)
}
Array.prototype.multiply = function (m1) {
	return M.multiply(this, m1)
}
Array.prototype.log = function (title) {
	return M.log(this, title)
}
Array.prototype.determinant = function () {
	return M.determinant(this)
}
Array.prototype.solve = function (vector) {
	return M.solve(this, vector)
}
Array.prototype.inverse = function (vector) {
	return M.inverse(this)
}
