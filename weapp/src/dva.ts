import {create} from 'dva-core'
import createLoading from 'dva-loading'
import models from './models'

const app = create({
    onError: e => {
        console.log('redux error', e)
    }
})

models.forEach(model => app.model(model))
app.use(createLoading())
app.start()

const dispatch = app._store.dispatch

console.log(app)
export default app
export {
    dispatch
}