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
			tryGet: async function(key, getValueFunc, maxAge = 24 * 60 * 60) {
				v = await getValueFunc();
				return v;
			}
		},
		path: path,
		_matchedRoute: '',
	}
}
