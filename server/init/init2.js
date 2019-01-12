const mongoose = require('mongoose')

const User = require('../models/User')
const FeedOrigin = require('../models/FeedOrigin')
const Feed = require('../models/Feed')
const UserFeed = require('../models/UserFeed')
const Snapshot = require('../models/Snapshot')
const FeedItem = require('../models/FeedItem')

const settings = require('../config/settings.js')
const Enums = require('../lib/enums')

if (settings.mongouser) {
	mongoose.connect(settings.mongouri, {user: settings.mongouser, pass: settings.mongopass, useNewUrlParser: true})
} else {
	mongoose.connect(settings.mongouri, {useMongoClient:true, useNewUrlParser: true})
}
const bzPartionRange = [
	{
		"label": "动画",
		"children": [
			{
				"label": "MAD·AMV",
				"value": "24"
			},
			{
				"label": "MMD·3D",
				"value": "25"
			},
			{
				"label": "短片·手书·配音",
				"value": "47"
			},
			{
				"label": "综合",
				"value": "27"
			}
		]
	},
	{
		"label": "番剧",
		"children": [
			{
				"label": "连载动画",
				"value": "33"
			},
			{
				"label": "完结动画",
				"value": "32"
			},
			{
				"label": "资讯",
				"value": "51"
			},
			{
				"label": "官方延伸",
				"value": "152"
			}
		]
	},
	{
		"label": "国创",
		"children": [
			{
				"label": "国产动画",
				"value": "153"
			},
			{
				"label": "国产原创相关",
				"value": "168"
			},
			{
				"label": "布袋戏",
				"value": "169"
			},
			{
				"label": "资讯",
				"value": "170"
			}
		]
	},
	{
		"label": "音乐",
		"children": [
			{
				"label": "原创音乐",
				"value": "28"
			},
			{
				"label": "翻唱",
				"value": "31"
			},
			{
				"label": "VOCALOID·UTAU",
				"value": "30"
			},
			{
				"label": "演奏",
				"value": "59"
			},
			{
				"label": "三次元音乐",
				"value": "29"
			},
			{
				"label": "OP/ED/OST",
				"value": "54"
			},
			{
				"label": "音乐选集",
				"value": "130"
			}
		]
	},
	{
		"label": "舞蹈",
		"children": [
			{
				"label": "宅舞",
				"value": "20"
			},
			{
				"label": "三次元舞蹈",
				"value": "154"
			},
			{
				"label": "舞蹈教程",
				"value": "156"
			}
		]
	},
	{
		"label": "游戏",
		"children": [
			{
				"label": "单机游戏",
				"value": "17"
			},
			{
				"label": "电子竞技",
				"value": "171"
			},
			{
				"label": "手机游戏",
				"value": "172"
			},
			{
				"label": "网络游戏",
				"value": "65"
			},
			{
				"label": "桌游棋牌",
				"value": "173"
			},
			{
				"label": "GMV",
				"value": "121"
			},
			{
				"label": "音游",
				"value": "136"
			},
			{
				"label": "Mugen",
				"value": "19"
			}
		]
	},
	{
		"label": "科技",
		"children": [
			{
				"label": "趣味科普人文",
				"value": "124"
			},
			{
				"label": "野生技术协会",
				"value": "122"
			},
			{
				"label": "演讲·公开课",
				"value": "39"
			},
			{
				"label": "星海",
				"value": "96"
			},
			{
				"label": "数码",
				"value": "95"
			},
			{
				"label": "机械",
				"value": "98"
			},
			{
				"label": "汽车",
				"value": "176"
			}
		]
	},
	{
		"label": "生活",
		"children": [
			{
				"label": "搞笑",
				"value": "138"
			},
			{
				"label": "日常",
				"value": "21"
			},
			{
				"label": "美食圈",
				"value": "76"
			},
			{
				"label": "动物圈",
				"value": "75"
			},
			{
				"label": "手工",
				"value": "161"
			},
			{
				"label": "绘画",
				"value": "162"
			},
			{
				"label": "ASMR",
				"value": "175"
			},
			{
				"label": "运动",
				"value": "163"
			},
			{
				"label": "其他",
				"value": "174"
			}
		]
	},
	{
		"label": "鬼畜",
		"children": [
			{
				"label": "鬼畜调教",
				"value": "22"
			},
			{
				"label": "音 MAD",
				"value": "26"
			},
			{
				"label": "人力 VOCALOID",
				"value": "126"
			},
			{
				"label": "教程演示",
				"value": "127"
			}
		]
	},
	{
		"label": "时尚",
		"children": [
			{
				"label": "美妆",
				"value": "157"
			},
			{
				"label": "服饰",
				"value": "158"
			},
			{
				"label": "健身",
				"value": "164"
			},
			{
				"label": "资讯",
				"value": "159"
			}
		]
	},
	{
		"label": "广告",
		"children": [
			{
				"label": "广告",
				"value": "166"
			}
		]
	},
	{
		"label": "娱乐",
		"children": [
			{
				"label": "综艺",
				"value": "71"
			},
			{
				"label": "明星",
				"value": "137"
			},
			{
				"label": "Korea 相关",
				"value": "131"
			}
		]
	},
	{
		"label": "影视",
		"children": [
			{
				"label": "影视杂谈",
				"value": "182"
			},
			{
				"label": "影视剪辑",
				"value": "183"
			},
			{
				"label": "短片",
				"value": "85"
			},
			{
				"label": "预告·资讯",
				"value": "184"
			},
			{
				"label": "特摄",
				"value": "86"
			}
		]
	},
	{
		"label": "纪录片",
		"children": [
			{
				"label": "全部",
				"value": "177"
			},
			{
				"label": "人文·历史",
				"value": "37"
			},
			{
				"label": "科学·探索·自然",
				"value": "178"
			},
			{
				"label": "军事",
				"value": "179"
			},
			{
				"label": "社会·美食·旅行",
				"value": "180"
			}
		]
	},
	{
		"label": "电影",
		"children": [
			{
				"label": "全部",
				"value": "23"
			},
			{
				"label": "华语电影",
				"value": "147"
			},
			{
				"label": "欧美电影",
				"value": "145"
			},
			{
				"label": "日本电影",
				"value": "146"
			},
			{
				"label": "其他国家",
				"value": "83"
			}
		]
	},
	{
		"label": "电视剧",
		"children": [
			{
				"label": "全部",
				"value": "11"
			},
			{
				"label": "国产剧",
				"value": "185"
			},
			{
				"label": "海外剧",
				"value": "187"
			}
		]
	},
	{
		"label": "见 #哔哩哔哩直播",
		"children": [
			{
				"label": "全站",
				"value": "0"
			},
			{
				"label": "动画",
				"value": "1"
			},
			{
				"label": "国创相关",
				"value": "168"
			},
			{
				"label": "音乐",
				"value": "3"
			},
			{
				"label": "舞蹈",
				"value": "129"
			},
			{
				"label": "游戏",
				"value": "4"
			},
			{
				"label": "科技",
				"value": "36"
			},
			{
				"label": "生活",
				"value": "160"
			},
			{
				"label": "鬼畜",
				"value": "119"
			},
			{
				"label": "时尚",
				"value": "155"
			},
			{
				"label": "娱乐",
				"value": "5"
			},
			{
				"label": "影视",
				"value": "181"
			}
		]
	}
]
const config = {
	bilibili: {
		name: 'b站',
		children: {
			partion: {
				name: '分区视频',
				type: Enums.FeedOriginTypes.increase,
				desc: '分区视频',
				routePath: 'bilibili/partion',
				updateInterval: 60 * 30,
				icon: 'https://static.hdslb.com/images/favicon.ico',
				params: [{
					name: '分区',
					key: 'tid',
					paramType: Enums.FeedOriginParamTypes.select,
					range: bzPartionRange
				}]
			},
			dynamic: {
				name: 'up主动态',
				type: Enums.FeedOriginTypes.increase,
				desc: '跟踪喜欢up主的最新动态哦!',
				routePath: 'bilibili/dynamic',
				updateInterval: 60 * 60 * 24,
				icon: 'https://static.hdslb.com/images/favicon.ico',
				pathToParamsRegExp: 'space.bilibili.com/:uid',
				params: [{
					name: 'up主id',
					key: 'uid',
					paramType: Enums.FeedOriginParamTypes.input,
				}]
			}
		},
	},
	// weibo: {
	// 	name: '微博',
	// 	children: {
	// 		hotlist: {
	// 			name: '微博热搜榜',
	// 			type: Enums.FeedOriginTypes.diff,
	// 			desc: '微博热点追踪',
	// 			routePath: 'weibo/search/hot',
	// 			updateInterval: 60 * 30
	// 		},
	// 	},
	// },
	tieba: {
		name: '贴吧',
		children: {
			forum: {
				name: '帖子列表',
				type: Enums.FeedOriginTypes.increase,
				desc: '贴吧帖子列表',
				routePath: 'tieba/forum',
				updateInterval: 60 * 30,
				icon: 'https://tieba.baidu.com/favicon.ico',
				params: [{
					name: '吧名',
					key: 'kw',
					paramType: Enums.FeedOriginParamTypes.input,
				}]
			},
		},
	},
	// weixin: {
	// 	name: '微信',
	// 	children: {
	// 		wechatapp: {
	// 			name: '公众号',
	// 			type: Enums.FeedOriginTypes.increase,
	// 			desc: '公众号更新提醒',
	// 			routePath: 'tencent/wechat/wasi',
	// 			updateInterval: 60 * 60 * 4,
	// 			params: [{
	// 				name: '公众号id',
	// 				key: 'id',
	// 				paramType: Enums.FeedOriginParamTypes.input,
	// 			}]
	// 		},
	// 	},
	// },
	jianshu: {
		name: '简书',
		children: {
			user: {
				name: '作者动态',
				type: Enums.FeedOriginTypes.increase,
				desc: '跟踪喜欢的作者更新哦!',
				routePath: 'jianshu/user',
				updateInterval: 60 * 60 * 4,
				icon: 'https://www.jianshu.com/favicon.ico',
				pathToParamsRegExp: 'www.jianshu.com/u/:id',
				params: [{
					name: '作者id',
					key: 'id',
					paramType: Enums.FeedOriginParamTypes.input,
				}]
			},
		},
	},
	// zhihu: {
	// 	name: '知乎',
	// 	children: {
	// 		hotlist: {
	// 			name: '知乎热榜',
	// 			type: Enums.FeedOriginTypes.diff,
	// 			desc: '知乎er们在关注什么!!',
	// 			routePath: 'zhihu/hotlist',
	// 			updateInterval: 60 * 60 * 4,
	// 		},
	// 	},
	// },
	// douban: {
	// 	name: '豆瓣',
	// 	children: {
	// 		latermovie: {
	// 			name: '即将上映的电影',
	// 			type: Enums.FeedOriginTypes.increase,
	// 			desc: '选一选片儿吧',
	// 			routePath: 'douban/later',
	// 			updateInterval: 60 * 60 * 24,
	// 			icon: 'https://www.douban.com/favicon.ico'
	// 		},
	// 	},
	// },
	// a9vg: {
	// 	name: 'a9vg News 游戏新闻',
	// 	children: {
	// 		latermovie: {
	// 			name: 'a9vg最新新闻',
	// 			type: Enums.FeedOriginTypes.increase,
	// 			desc: '游戏新闻...',
	// 			routePath: 'a9vg/a9vg',
	// 			updateInterval: 60 * 60 * 24,
	// 		},
	// 	},
	// },
	// netease: {
	// 	name: '网易',
	// 	children: {
	// 		latermovie: {
	// 			name: '网易云音乐歌单',
	// 			type: Enums.FeedOriginTypes.increase,
	// 			desc: '歌单更新啦',
	// 			routePath: 'douban/later',
	// 			updateInterval: 60 * 60 * 24,
	// 		},
	// 	},
	// },
	// douyu: {
	// 	name: '斗鱼',
	// 	children: {
	// 		latermovie: {
	// 			name: '开播通知',
	// 			type: Enums.FeedOriginTypes.diff,
	// 			desc: 'xx主播在线直播...',
	// 			routePath: 'douyu/room',
	// 			updateInterval: 60 * 30,
	// 		},
	// 	},
	// },
}



async function main() {
	const baseOrigins = Object.keys(config)
	for (let originCode of baseOrigins) {
		let origin1 = await FeedOrigin.findOne({ code: originCode })
		const value1 = config[originCode]
		if (!origin1) {
			origin1 = new FeedOrigin({
				code: originCode,
				name: value1.name,
				priority: Enums.FeedOriginPriorityTypes.main,
			})
			await origin1.save()
		}

		const childCodes = Object.keys(value1.children || {})
		for (let childCode of childCodes) {
			// console.log(childCode, 'child')
			let origin2 = await FeedOrigin.findOne({ code: `${originCode}:${childCode}` })
			const value2 = value1.children[childCode]
			if (!origin2) {
				origin2 = new FeedOrigin({
					parent: origin1,
					code:  `${originCode}:${childCode}`,
					priority: Enums.FeedOriginPriorityTypes.second,
					...value2
				})
			} else {
				Object.assign(origin2, value2)
			}
			// console.log(origin2)
			await origin2.save()
		}
	}
}


main()