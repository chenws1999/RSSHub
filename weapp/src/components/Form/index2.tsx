import Taro, { Component, Config } from '@tarojs/taro'
import { Form, Button, View } from '@tarojs/components'

import './style.less'
import MyForm from './index'

interface MyFormProps {
    num?: number
    children: JSX.Element,
    inline: boolean,
    onGetFormId: (i: string) => void
}

interface MyFormState {
}

export default class MyForm2 extends Component<MyFormProps, MyFormState> {
    static options = {
        addGlobalClass: true
    }
    static defaultProps = {
        num: 0
    }
    constructor(props) {
        super(props)
        this.state = {
        }
    }
    componentWillMount() {
    }

    componentDidMount() {
    }
    componentWillUnmount() {
    }
    handleSubmit(e) {
        this.props.onGetFormId(e.detail.formId)
        console.log(e.detail.formId)
    }
    render() {
        console.log(this.props.num)
        return <Form onSubmit={this.handleSubmit.bind(this)} report-submit="{{true}}">
            <Button formType="submit" className='btn'>
                {
                    (this.props.num > 1) ? <MyForm num={this.props.num - 1} onGetFormId={this.props.onGetFormId}>
                        {this.props.children}
                    </MyForm> :
                        <View>
                            {this.props.children}
                        </View>
                }
            </Button>
        </Form>
    }
}

