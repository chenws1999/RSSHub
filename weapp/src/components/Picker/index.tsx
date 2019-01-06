import Taro, { Component, Config } from '@tarojs/taro'
import { Text, View, PickerView, PickerViewColumn } from '@tarojs/components'
import {AtListItem} from 'taro-ui'

import './style.less'

interface dataItem {
  label: string,
  value?: string,
  children?: dataItem[]
}

interface CustomPickerProps {
  title: string
  extra: string
  value: number[]
  data: dataItem[]
  onChange: (value) => void,
}

interface CustomPickerState {
  columns: dataItem[][],
  focusValue: number[],
  extraNote: string
  showPicker: boolean
}

export default class MyPicker extends Component<CustomPickerProps, CustomPickerState> {
  static options = {
    addGlobalClass: true
  }
  constructor(props) {
    super(props)
    this.state = {
      showPicker: false,
      columns: [],
      focusValue: [],
      extraNote: '待选择'
    }
  }
  componentWillMount() {
    this.getColumns(this.props.value)
  }

  componentDidMount() {
  }
  componentWillUnmount() { }
  componentWillReceiveProps(nextProps) {
    console.log(nextProps, this.props)
    const { value: nextValue = []} = nextProps
    const { value = []} = this.props
    const isEqual = nextValue.join(',') === value.join(',')
    if (!isEqual) {
      this.getColumns(nextValue)
    }
  }
  getColumns(value: number[] = []) {
    const columns = []
    const focusValue = []
    const { data = [] } = this.props

    console.log(data, value, 'dtaaaaa')
    let rangeArr = data
    let value2 = [...value]
    const labelArr = []

    while (rangeArr && rangeArr.length) {
      const preIndex = value2.shift()
      const index = (preIndex && preIndex < rangeArr.length) ? preIndex : 0
      focusValue.push(index)
      columns.push(rangeArr)
      labelArr.push(rangeArr[index].label)
      rangeArr = rangeArr[index].children
    }
    this.setState({
      columns,
      focusValue,
      extraNote: labelArr.join('/') || '待选择'
    })
  }
  handleChange(e) {
    const value = e.detail.value
    console.log('inner', value)
    this.getColumns(value)
  }
  showPicker() {
    this.setState({
      showPicker: true
    })
  }
  closePicker(e: Event) {
    this.setState({
      showPicker: false
    })
    e.stopPropagation()
  }
  preventClick(e: Event) {
    e.stopPropagation()
  }
  handlePickerChange() {
    this.setState({
      showPicker: false
    })
    this.props.onChange(this.state.focusValue)
  }
  render() {
    const { title, extra } = this.props
    const { columns, focusValue, showPicker, extraNote } = this.state
    console.log(columns, focusValue, 'custom ', title, extra)
    return (
      <View className='pickerBox'>
          <View className="baseArea" onClick={this.showPicker.bind(this)}><Text className="title">{title}</Text><Text className="extra">{extra || extraNote}</Text></View>
        {
          showPicker && <View className="PickerViewOuterBox" onClick={this.closePicker.bind(this)}>
            <View className="main" onClick={this.preventClick.bind(this)}>
              <View className="header">
                <View onClick={this.closePicker.bind(this)}>取消</View>
                <View className="confirm" onClick={this.handlePickerChange.bind(this)}>确定</View>
              </View>
              <PickerView
                indicatorStyle='height: 30px;' style='width: 100%; height: 200px;'
                value={focusValue} onChange={this.handleChange.bind(this)}>
                {
                  columns.map((itemRange, i) => {
                    return <PickerViewColumn key={i}>
                      {
                        itemRange.map((item, i) => <View key={i} className="label">
                          {item.label}
                        </View>)
                      }
                    </PickerViewColumn>
                  })
                }
              </PickerView>
            </View>
          </View>
        }
      </View>
    )
  }
}

