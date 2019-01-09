function throttle (func, time = 500) {
	
}

function initIntercepter () {
	this.pureUpdateFunc = this.__proto__.componentDidUpdate 
	this.pureWillReceivePropsFunc = this.__proto__.componentWillReceiveProps
	this.pureDidMountFunc = this.__proto__.componentDidMount
	this.componentDidMount =  () => {
		if (this.props.user) {
			this.componentDidMount = this.pureDidMountFunc
			this.componentDidUpdate = this.pureUpdateFunc
			this.componentWillReceiveProps = this.pureWillReceivePropsFunc
			this.componentDidMount()
		} else {
			this.props.dispatch({
				type: 'center/fetchMineInfo',
			})
			this.componentWillReceiveProps = function (nextProps) {
				if (!this.props.user && nextProps.user) {
					// this.componentDidMount()
					this.componentDidUpdate = function () {
						this.componentDidMount()
					}
				}
			}
		}
	}
}

function getUrl (url) {
	if (process.env.NODE_ENV === 'development') {
		return 'http://localhost:4000/api/source/img?src=' + encodeURIComponent(url)
	} else {
		return 'https://weapp.balala.co/api/source/img?src=' + encodeURIComponent(url)
	}
}

export default {
	throttle,
	initIntercepter,
	getUrl
}