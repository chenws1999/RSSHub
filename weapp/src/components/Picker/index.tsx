import Taro, { Component, Config } from '@tarojs/taro'
import { View, PickerView, PickerViewColumn } from '@tarojs/components'
import {AtFloatLayout } from 'taro-ui'

import './style.less'

interface dataItem {
  label: string,
  value?: string,
  children?: dataItem[]
}

interface CustomPickerProps {
  value: number[]
  data: dataItem[]
  onChange: (value) => void,
  children: JSX.Element | string
}

interface CustomPickerState {
  columns: dataItem[][],
  focusValue: number[],
  showPicker: boolean
}

export default class MyPicker extends Component<CustomPickerProps, CustomPickerState> {
  static options = {
    addGlobalClass: true
  }
  constructor (props) {
    super(props)
    this.state = {
      showPicker: false,
      columns: [],
      focusValue: []
    }
  }
  componentWillMount() {
    this.getColumns(this.props.value)
   }

  componentDidMount() {
  }
  componentWillUnmount() { }
  componentWillReceiveProps(nextProps) {
    const { value: nextValue } = nextProps
    const { value } = this.props
    const isEqual = nextValue.join(',') === value.join(',')
    if (!isEqual) {
      this.getColumns(nextValue)
    }
  }
  getColumns(value: number[] = []) {
    const columns = []
    const focusValue = []
    const { data = []} = this.props

    let rangeArr = data
    let value2 = [...value]
    while (rangeArr && rangeArr.length) {
      const index = value2.shift() || 0
      focusValue.push(index)
      columns.push(rangeArr)
      rangeArr = rangeArr[index].children
    }
    this.setState({
      columns,
      focusValue
    })
  }
  handleChange (e) {
    const value = e.detail.value
    console.log('inner', value)
    this.getColumns(value)
  }
  showPicker () { 
    this.setState({
      showPicker: true
    })
  }
  closePicker () {
    this.setState({
      showPicker: false
    })
  }
  render() {
    const {children} = this.props
    const { columns, focusValue, showPicker } = this.state
    console.log(columns, focusValue, 'custom ')
    return (
      <View className='index'>
        <View onClick={this.showPicker.bind(this)}>
          {children}
        </View>
        <AtFloatLayout isOpened={showPicker} onClose={this.closePicker.bind(this)}>
          <PickerView 
            indicatorStyle='height: 50px;' style='width: 100%; height: 200px;'
            value={focusValue} onChange={this.handleChange.bind(this)}>
            {
              columns.map((itemRange, i) => {
                return <PickerViewColumn key={i}>
                  {
                    itemRange.map((item, i) => <View key={i}>
                      {item.label}
                    </View>)
                  }
                </PickerViewColumn>
              })
            }
          </PickerView>
        </AtFloatLayout>
      </View>
    )
  }
}

