module.exports = function getCtx ({query = {}, params = {}, path = '/'}) {
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
