import Taro, { Component, Config } from '@tarojs/taro'
import { Form, Button, View } from '@tarojs/components'

import './style.less'
import MyForm2 from './index2'

interface MyFormProps {
    num?: number
    children: JSX.Element,
    onGetFormId: (i: string) => void
}

interface MyFormState {
}

export default class MyForm extends Component<MyFormProps, MyFormState> {
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
        return  <Form onSubmit={this.handleSubmit.bind(this)} report-submit="{{true}}">
            <Button formType="submit" className='btn'>
                {
                    (this.props.num > 1) ? <MyForm2 num={this.props.num - 1} onGetFormId={this.props.onGetFormId}>
                        {this.props.children}
                    </MyForm2> :
                        <View>
                            {this.props.children}
                        </View>
                }
            </Button>
        </Form>
    }
}

