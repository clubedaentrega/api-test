'use strict'

/**
 * @class
 * @param {string} message
 * @param {Header|Obj} [...el] The element that caused the error (null if not applicable)
 * @extends Error
 */
function ParseError(message) {
	Error.call(this)

	/** @member {string} */
	this.message = message

	/** @member {Array<Header|Obj>} */
	this.els = [].slice.call(arguments, 1)
}

require('util').inherits(ParseError, Error)

/**
 * Populate the error message with the original code region that caused the error
 * @param {string[]} originalLines
 */
ParseError.prototype.addSourceContext = function (originalLines) {
	var start = Infinity,
		end = -Infinity,
		str = '\n\n-----',
		i, focus, checkElFocus

	if (!this.els.length) {
		return
	}
	this.els.forEach(function (el) {
		start = Math.min(start, el.source.begin)
		end = Math.max(end, el.source.end)
	})

	checkElFocus = function (el) {
		return i >= el.source.begin && i < el.source.end
	}

	for (i = Math.max(0, start - 3); i < end + 3 && i < originalLines.length; i++) {
		focus = this.els.some(checkElFocus)
		str += '\n' + (focus ? '>' : ' ') + ' ' + originalLines[i]
	}
	str += '\n-----'

	this.message += str
}

module.exports = ParseError