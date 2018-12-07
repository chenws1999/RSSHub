const article = require('../routes/bilibili/article')

function getCtx ({query = {}, params = {}, path = '/'}) {
	return {
		params: params,
		query: {},
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

const ctx = getCtx({
	params: {uid: 32708362}
})

async function test () {
	await article(ctx)
}


test()