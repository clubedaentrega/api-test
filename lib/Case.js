'use strict'

var request = require('request'),
	check = require('../check'),
	async = require('async'),
	stringify = require('../stringify'),
	normalizePath = require('path').posix.normalize,
	parse = require('url').parse,
	format = require('url').format

/**
 * @class
 */
function Case() {
	/** @member {string} */
	this.name = ''

	/** @member {boolean} */
	this.skip = false

	/** @member {?test-spec:Value} */
	this.post = null

	/** @member {string} */
	this.postUrl = ''

	/* @member {?test-spec:Value} */
	this.out = null

	/** @member {number} */
	this.statusCode = 0

	/** @member {Find[]} */
	this.finds = []
}

/**
 * Run the test case
 * @param {Object} options
 * @param {Obejct} options.db
 * @param {Function} options.it
 * @param {string} options.baseUrl
 * @param {Object} options.context
 * @param {boolean} options.strict
 * @param {string[]} options.ignoredFindKeys
 * @param {Buffer} [options.ca]
 * @param {function(Case,*)} [options.onPost]
 * @param {function(Case,*)} [options.onOut]
 * @param {function(Case,Find)} [options.onFind]
 * @param {string} testName
 */
Case.prototype.execute = function (options, testName) {
	var that = this,
		it = this.skip ? options.it.skip : options.it

	it(this.name, function (done) {
		// Prepare context
		options.context.prev = {
			post: options.context.post,
			out: options.context.out
		}
		delete options.context.post
		delete options.context.out

		var post = that.post ? that.post.run(options.context) : {}
		options.context.post = post
		if (options.onPost) {
			options.onPost(that, post)
		}

		request({
			url: normalizeUrl(options.baseUrl + (that.postUrl || testName)),
			method: 'POST',
			json: post,
			agentOptions: {
				ca: options.ca
			}
		}, function (err, res, out) {
			var expected
			if (err) {
				return done(err)
			}
			options.context.out = out
			expected = that.out ? that.out.run(options.context) : {}

			try {
				res.statusCode.should.be.equal(that.statusCode)
				check(out, expected, options.strict, true)
				if (options.onOut) {
					options.onOut(that, out)
				}
			} catch (e) {
				console.log('\n-----\n' +
					'Request details:\n' +
					'\x1b[1;32mInput:\x1b[0m\n' +
					stringify(post, true) + '\n' +
					'\x1b[1;32mOutput:\x1b[0m\n' +
					stringify(out, true, e.path) + '\n' +
					'\x1b[1;32mExpected:\x1b[0m\n' +
					stringify(expected, true, e.path) + '\n' +
					'-----\n')
				return done(e)
			}

			async.each(that.finds, function (find, done) {
				if (options.onFind) {
					options.onFind(that, find)
				}
				find.execute(options, done)
			}, done)
		})
	})
}

module.exports = Case

function normalizeUrl(url) {
	var parsed = parse(url)
	parsed.pathname = normalizePath(parsed.pathname)
	return format(parsed)
}