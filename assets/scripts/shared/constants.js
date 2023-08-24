/**
 * Copyright (c) 2017 Xiamen Yaji Software Co.Ltd. All rights reserved.
 */
module.exports = {
    GAME_NAME: 'cakeFantasy',

    //本地缓存KEY值
    LOCAL_CACHE: {
        WORKBENCH: 'workbench', //工作台数据缓存
        PLAYER: 'player', //玩家基础数据缓存，如金币砖石等信息，暂时由客户端存储，后续改由服务端管理
        BUYTIMES: 'buyTimes', //蛋糕购买次数存储
        DAILY_TASK: 'dailyTask', //每日任务
        SETTINGS: 'settings', //设置相关，所有杂项都丢里面进去
        DATA_VERSION: 'dataVersion', //数据版本
        ACCOUNT: 'account', //玩家账号
        TMP_DATA: 'tmpData', //临时数据，不会存储到云盘
    },

    //settings的本地缓存key
    SETTINGS_KEY: {
        INVITEE: 'invitee', //邀请相关
        FREE_GOLD_NEXT_TIME: 'freeGoldNextTIme', //免费金币下一次的时间
        NATIONAL_DAY_NEXT_TIME: 'nationalNextTime', //国庆活动的下一个时间
        ACCELERATE: 'accelerate', //加速剩余时间
        GROUP_SHARE: 'groupShare', //存储已分享过的群
        LOTTERY: 'lottery', //抽奖
        LOTTERY_ACCELERATE: 'lotteryAccelerate', //抽奖获得的加速时间
        SUPPORT: 'support', //好友援助列表
        COMBINE_AUTO: 'combineAuto', //自动合成
    },

    TMP_DATA_KEY: {
        AD_TIMES: 'adTimes', //已经观看广告的次数
    },

    //工作台最大空位
    WORKBENCH_MAX_POS: 16, //工作台最多位置

    //货柜最多空位
    COUNTER_MAX_POS: 8, //货柜最大摆放8个

    //最基础的蛋糕id
    BASE_CAKE_ID: "1", //最基础的蛋糕id

    INVITE_MAX: 10, //邀请循环基数

    //引导步奏
    GUIDE_STEP: {
        START: 100,
        PUSH_CAKE: 200,
        BUY_CAKE: 300
    },

    GUIDE_TYPE: { //新手引导类型
        SPACE: 0, //空，不做任何操作，用来判定触发
        GUIDE_ANI: 1, //引导动画
        TRIGGER_EVENT: 2, //触发事件
        WAIT_EVENT: 3, //等待事件触发
        GUIDE: 4 //界面性引导
    },

    //顺时针
    GUIDE_TIPS_DIRECTION: { //tips展示方向
        TOP: 0,
        RIGHT: 1,
        BOTTOM: 2,
        LEFT: 3
    },

    SHARE_TYPE: { //分享文案
        SHARE_GAME: 0, //游戏分享
        GROUP_RANK: 1, //群排行
    },

    SHARE_FUNCTION: {
        BALANCE: 'balance', //结算分享
        FREE_GOLD: 'freeGold', //免费金币
        UNLOCK: 'unlock', //解锁分享
        INVITE: 'invite', //拉新分享
        SIGN: 'sign', //签到分享
        LEVEL_UP: 'levelUp', //免费升级分享
        LACK: 'lack', //金币不足的分享
        LOVE_HEART: 'loveHeart', //爱心分享 
        ACCELERATE: 'accelerate', //加速
        LOTTERY: 'lottery', //抽奖
        CHOICE: 'choice', //三选一  
        SUPPORT: 'support', //好友援助
        TASK: 'task', //任务双倍分享
        PICK_GAME: 'pickGame', //捡蛋糕小游戏的分享的双倍奖励
        MAIN_SCENE: 'mainScene', //主场景分享
        GROUP_RANK: 'groupRank', //群排行
        RANK: 'rank', //排行
        COMBINE_AUTO: 'combineAuto', //自动合成
    },

    //观看广告的最大次数
    WATCH_AD_MAX_TIMES: {
        BALANCE: 5, //结算
        LOVE_HEART: 5, //爱心
        FREE_GOLD: 5, //免费金币
        ACCELERATE: 5, //加速
        LOTTERY: 10, //抽奖
        CHOICE: 5, //三选一  
        PICK_GAME: 5, //捡蛋糕游戏
    },

    WATCH_AD_TYPE: {
        BALANCE: 0,
        ACCELERATE: 1,
        FREE_GOLD: 2,
        LOVE_HEART: 3,
        CHOICE: 4
    },

    //奖励类型
    REWARD_TYPE: {
        DIAMOND: 1, //钻石
        GOLD: 2, //金币
        CAKE: 3, //蛋糕
        ACCELERATE: 4, //加速
        COMBINE: 5, //合成
    },

    //每日任务类型
    DAILY_TASK_TYPE: {
        COMBINE: 1, //合成蛋糕
        UNLOCK: 2, //解锁蛋糕
        SHARE: 3, //分享游戏
        SELLING: 4, //在线出售蛋糕
        CONSUME_DIAMOND: 5 //钻石消耗
    },

    ZORDER: {
        DIALOG: 100, //弹窗的Z序
        REWARD: 900, //奖励的弹窗
        WAITING: 998, //等待界面弹窗
        TIPS: 999 //提示框
    },

    FREE_GOLD_SOURCE: {
        MAIN_SCENE: 1, //来自于主场景的免费金币
        LACK: 2, //来自于金币不足
    },

    REWARD_SOURCE: {
        LOVE_HEART: 1, //来自于顾客的奖赏
    },

    LOTTERY_MAX_TIMES: 3, //抽奖最大次数
    LOTTERY_AD_MAX_TIMES: 7, //看广告获得奖券的次数

    //统计事件类型
    STAT_EVENT_TYPE: {
        SHARE_IMG: 'comeFromShareImage', //统计新加入的玩家是根据哪张图片加入的
        NEW_USER: 'newUser',
        FREE_GOLD_SHOW: 'freeGoldShow', //免费金币按钮展示
        FREE_GOLD_CLICK: 'freeGoldClick', //免费金币点击
        FREE_GOLD_SHARE_SHOW: 'freeGoldShareShow', //免费金币分享按钮展示次数
        FREE_GOLD_SHARE_SUCCESS: 'freeGoldShareSuccess', //免费金币分享获取奖励成功
        FREE_GOLD_AD_SHOW: 'freeGoldAdShow', //免费金币广告按钮展示次数
        FREE_GOLD_AD_SUCCESS: 'freeGoldAdSuccess', //免费金币广告获取奖励成功
        ACCELERATE_BTN_CLICK: 'accelerateBtnClick', //加速按钮点击
        CELEBRATION_SHOW: 'celebrationShow', //庆典界面展示
        CELEBRATION_SHARE_SHOW: 'celebrationShareSHow', //庆典界面-分享按钮展示次数
        CELEBRATION_SHARE_SUCCESS: 'celebrationShareSuccess', //庆典界面-分享加速成功
        CELEBRATION_AD_SHOW: 'celebrationAdShow', //庆典界面-广告按钮展示次数
        CELEBRATION_AD_SUCCESS: 'celebrationAdSuccess', //庆典界面-广告加速成功
        LOTTERY_BTN_CLICK: 'lotteryBtnClick', //主界面大转盘按钮点击
        LOTTERY_SHOW: 'lotteryShow', //抽奖界面展示成功
        LOTTERY: 'lottery', //抽奖一次
        MORE_TICKET_AD_CLICK: 'moreTicketAdClick', //更多抽奖券-广告按钮点击
        MORE_TICKET_AD_SUCCESS: 'moreTicketAdSuccess', //更多抽奖券-广告奖励获取成功
        MORE_TICKET_SHARE_CLICK: 'moreTicketShareClick', //更多抽奖券-分享按钮点击
        MORE_TICKET_SHARE_SUCCESS: 'moreTicketShareSuccess', //更多抽奖券-分享奖励获取成功
        SUPPORT_BTN_CLICK: 'supportBtnClick', //好友援助主界面按钮点击
        SUPPORT_SHOW: 'supportShow', //好友援助界面展示成功
        SUPPORT_INVITE_BTN_CLICK: 'supportInviteBtnClick', //好友援助邀请按钮点击
        SUPPORT_INVITE_SUCCESS: 'supportInviteSuccess', //好友援助邀请玩家成功（即有玩家进入）
        SUPPORT_JOIN_SUCCESS: 'supportJoinSuccess', //好友援助 帮助好友成功（理论上应该与上面的数据相近）
        RANK_BTN_CLICK: 'rankBtnClick', //排行榜按钮点击
        RANK_SHOW: 'rankShow', //排行榜界面展示
        GROUP_RANK_BTN_CLICK: 'groupRankBtnClick', //群排行按钮点击
        GROUP_RANK_SHOW: 'groupRankShow', //群排行界面展示
        INVITE_BTN_CLICK: 'inviteBtnClick', //主界面拉新按钮点击
        INVITE_SHOW: 'inviteShow', //拉新界面展示
        INVITE_SHARE_CLICK: 'inviteShareClick', //拉新分享按钮点击
        // INVITE_SUCCESS: 'inviteSuccess',                        //拉新成功 由被拉进来的人统计的
        INVITE_REWARD_CLICK: 'inviteRewardClick', //拉新奖励领取按钮点击
        DAILY_TASK_BTN_CLICK: 'dailyTaskBtnClick', //每日任务按钮点击
        DAILY_TASK_SHOW: 'dailyTaskShow', //每日任务界面展示
        DAILY_TASK_FINISHED: 'dailyTaskFinished', //每日任务完成时触发
        DAILY_TASK_REWARD_CLICK: 'dailyTaskRewardClick', //每日任务奖励领取按钮点击
        DAILY_TASK_SHARE_CLICK: 'dailyTaskShareClick', //每日任务分享双倍按钮点击
        DAILY_TASK_SHARE_SUCCESS: 'dailyTaskShareSuccess', //每日任务分享双倍领取成功
        RECYCLE_BTN_CLICK: 'recycleBtnClick', //主界面回收按钮点击
        RECYCLE_SUCCESS: 'recycleSuccess', //回收成功触发
        GAME_CENTER_CLICK: 'gameCenterClick', //游戏中心按钮点击
        PUBLIC_ACCOUNT_SHOW: 'publickAccountShow', //公众号界面展示次数
        GAME_CIRCLE_CLICK: 'gameCircleClick', //游戏圈按钮点击
        ILLUSTRATE_CLICK: 'illustrateClick', //图文说明按钮点击
        ILLUSTRATE_SHOW: 'illustrateShow', //图文说明界面展示
        SETTING_CLICK: 'settingClick', //设置按钮点击
        SETTING_SHOW: 'settingShow', //设置界面展示
        LOVE_HEART_SHOW: 'loveHeartShow', //爱心显示次数
        LOVE_HEART_CLICK: 'loveHeartClick', //爱心点击次数
        LOVE_HEART_FREE_REWARD: 'loveHeartFreeReward', //爱心免费领取的次数
        LOVE_HEART_SHARE_SHOW: 'loveHeartShareShow', //爱心奖励分享按钮展示次数
        LOVE_HEART_SHARE_SUCCESS: 'loveHeartShareSuccess', //爱心奖励分享领取成功
        LOVE_HEART_AD_SHOW: 'loveHeartAdShow', //爱心奖励广告按钮展示次数
        LOVE_HEART_AD_SUCCESS: 'loveHeartAdSuccess', //爱心奖励广告领取成功
        UNLOCK_SHARE_SHOW: 'unlockShareShow', //解锁新蛋糕-分享界面展示
        UNLOCK_SHARE_CLICK: 'unlockShareClick', //解锁新蛋糕-分享按钮点击
        UNLOCK_SHARE_SUCCESS: 'unlockShareSuccess', //解锁新蛋糕-分享奖励领取成功
        SIGN_SHARE_SHOW: 'signShareShow', //签到分享按钮展示
        SIGN_SHARE_SUCCESS: 'signShareSuccess', //签到分享成功
        LACK_SHARE_SHOW: 'lackShareShow', //金币不足分享按钮展示次数
        LACK_SHARE_SUCCESS: 'lackShareSuccess', //金币不足分享领取成功
        LEVEL_UP_SHARE_SHOW: 'levelUpShareShow', //免费升级蛋糕分享按钮展示
        LEVEL_UP_SHARE_SUCCESS: 'levelUpShareSuccess', //免费升级蛋糕成功
        NATIONAL_PLANE_SHOW: 'nationalPlaneShow', //国庆节飞机展示次数
        NATIONAL_PLANE_CLICK: 'nationalPlaneClick', //国庆节飞机点击次数
        PICK_GAME_SHOW: 'pickGameShow', //捡蛋糕游戏界面展示
        PICK_GAME_SHARE_SHOW: 'pickGameShareShow', //捡蛋糕小游戏分享按钮展示
        PICK_GAME_SHARE_SUCCESS: 'pickGameShareSuccess', //捡蛋糕小游戏分享成功
        PICK_GAME_AD_SHOW: 'pickGameAdShow', //捡蛋糕小游戏广告按钮展示
        PICK_GAME_AD_SUCCESS: 'pickGameAdSuccess', //捡蛋糕小游戏广告领取成功
        PICK_GAME_OVER: 'pickGameOver', //捡蛋糕小游戏结束统计，上传结果
        GIFT_CAKE_SHOW: 'giftCakeShow', //烤箱掉落
        GIFT_CAKE_OPEN: 'giftCakeOpen', //烤箱打开
        GIFT_CHOICE_SHOW: 'giftChoiceShow', //三选一掉落
        GIFT_CHOICE_OPEN: 'giftChoiceOpen', //三选一打开
        GIFT_CHOICE_SHARE_CLICK: 'giftChoiceShareClick', //三选一分享按钮点击
        GIFT_CHOICE_SHARE_SUCCESS: 'giftChoiceShareSuccess', //三选一分享领取奖励成功
        GIFT_CHOICE_AD_CLICK: 'giftChoiceAdClick', //三选一广告按钮点击
        GIFT_CHOICE_AD_SUCCESS: 'giftChoiceAdSuccess', //三选一广告领取奖励成功
        BALANCE_SHOW: 'balanceShow', //结算界面展现
        BALANCE_SHARE_SHOW: 'balanceShareShow', //结算界面分享按钮展现
        BALANCE_SHARE_SUCCESS: 'balanceShareSuccess', //结算界面分享成功
        BALANCE_AD_SHOW: 'balanceAdShow', //结算界面广告按钮展现
        BALANCE_AD_SUCCESS: 'balanceAdSuccess', //结算界面广告成功
        CROSS_BTN_CLICK: 'crossBtnClick', //交叉营销组件点击
        SHARE: 'share',
        MORE_GAME_CLICK: 'moreGameClick', //更多游戏
        GAME_BAR_CLICK: 'gameBarClick', //游戏条点击
        RECOMMEND_CLICK: 'recommendClick', //推荐点击
        CHANNEL: 'channel', //由哪个渠道推荐过来的
    },

    //好友援助效果
    // BUFF_TYPE: {
    //     FEE_ADD: 1,     //顾客小费
    //     FREE_CAKE: 2,   //免费蛋糕
    //     FREE_GOLD: 3,   //免费金币，包括金币不足
    //     ACCELERATE: 4,  //加速
    //     GIFT: 5,        //互动礼物
    //     COMBINE_AUTO: 6 //自动合成
    // },

    //好友援助效果
    BUFF_TYPE: {
        FREE_CAKE: 1, //免费蛋糕
        ACCELERATE: 2, //庆典加速
        COMBINE_AUTO_ADD: 3, //自动合成增加60秒
        COMBINE_AUTO: 4, //自动合成
    },

    SUPPORT_KEEP_TIME: 1800, //好友援助持续时间
    // SUPPORT_KEEP_TIME: 10,        //测试，先设置的比较低

    MAX_SUPPORT_FRIEND: 6, //好友援助最大数量

    SUPPORT_REWARD_DIAMOND: 10, //好友援助获得的钻石数量

    // 广告
    ADS_TYPE: { // 广告类型
        FULLSCREEN: 1, // 插屏广告
        REWARDVIDEO: 4 // 视频激励广告
    },

    //打开奖励的方法
    OPEN_REWARD_TYPE: {
        AD: 0,
        SHARE: 1,
        NULL: 2
    },

    AUDIO_SOUND: {
        CLICK: "click", //点击音效
    },

    //升级的等级
    LEVEL_UP: [1, 2, 4],

    //次按钮显示比主按钮晚2秒
    OFFSET_TIME: 2,

    DISABLE_RATIO: 0.1,

    //更多游戏红点五分钟显示一次
    RED_DOT_SHOW_INTERVAL: 5,
};