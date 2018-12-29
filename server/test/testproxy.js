const handler1 = require('../../routes/bilibili/partion-ranking.js')

const getCtx = require('../lib/ctx')
async function main () {
	const ctx = getCtx({
		params: {
			tid: 171
		}
	})
	await handler1(ctx)
	console.log(ctx.state.data)
}

// main()

