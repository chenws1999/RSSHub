function throttle (func, time = 500) {
	
}

function initIntercepter () {
	this.pureUpdateFunc = this.__proto__.componentDidUpdate 
	this.pureWillReceivePropsFunc = this.__proto__.componentWillReceiveProps
	this.pureWillMountFunc = this.__proto__.componentWillMount
	this.pureDidMountFunc = this.__proto__.componentDidMount
	

	let isInitLoading = false
	this.componentWillMount =  () => {
		console.log('will mount', this.props.user)
		if (this.props.user) {
			console.log('end', this.pureWillMountFunc)
			this.componentWillMount = this.pureWillMountFunc
			this.componentDidUpdate = this.pureUpdateFunc
			this.componentWillReceiveProps = this.pureWillReceivePropsFunc
			this.componentWillMount()
		} else {
			console.log('else')
			this.props.dispatch({
				type: 'center/fetchMineInfo',
			}).then(res => {
				this.setState({})
			})
			// this.componentDidMount = function () {
				// console.log('inner mount')
			this.componentWillReceiveProps = function (nextProps) {
				console.log('wuill receive', this.props.user, nextProps)
				if (!this.props.user && nextProps.user) {
					// this.componentWillMount()	
					this.componentDidUpdate = function () {
						console.log('update')
						this.componentWillMount()
					}
				}
			}
		}
	}
}

function getUrl (url) {
	if (!url) {
		return
	}
	// console.log('geturl ', url)
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