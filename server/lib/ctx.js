module.exports = function getCtx ({query = {}, params = {}, path = '/'}) {
	return {
		params: params,
		state: {},
		request: {
			query
		},
		cache: {
			get: _ => null,
			set: _ => null,
		},
		path: path
	}
}
