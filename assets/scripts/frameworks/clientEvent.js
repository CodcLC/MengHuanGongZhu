/**
 * Copyright (c) 2017 Xiamen Yaji Software Co.Ltd. All rights reserved.
 */
var eventListener = require("eventListener");
var clsListener = eventListener.getBaseClass("multi");
// var i18n = require("LanguageData");

var ClientEvent = cc.Class({
    extends: clsListener,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
    },

    // use this for initialization
    onLoad: function () {
        this._EVENT_TYPE = [
            "testEvent",
            "onAppShow",
            "hideNetLoading",
            "showNetLoading",
            "showWaiting",          //展示waiting界面
            "hideWaiting",          //隐藏waiting界面
            "showGetMoneyTips",
            "activeScene",          //设置场景是否可用

            "combineCake",          //蛋糕合并
            "unlockCake",           //蛋糕解锁
            "updateWorkbench",      //更新工作台
            // "updateMakeMoney",      //更新赚钱速度
            "updateGold",           //更新金币信息
            "updateDiamond",        //更新钻石信息
            "updateBuyTimes",        //更新购买次数
            "updateFreeCake",        //更新免费蛋糕
            "getFreeGold",          //获得免费金币
            "pickGameFinish",       //捡蛋糕小游戏完成时触发
            "updateTask",           //更新任务进度
            "updateInvitee",        //更新邀请相关信息
            "taskFinished",         //任务完成触发
            "upgradeCake",          //升级蛋糕
            "sellCake",             //蛋糕出售时触发
            "showFlyReward",        //显示奖励飞行动画
            "showItemReward",        //显示奖励飞行动画
            "receiveGold",          //收获金币
            "receiveDiamond",       //收获钻石
            "updateSpeed",          //更新生成速度
            "checkIsAccelerate",    //检查是否在加速
            "checkIsCombineAuto",    //检查是否在合成
            "choiceOver",           //抽奖结束
            "enableBuff",           //启动buff
            "disableBuff",          //关闭buff
            "updateSupport",        //援助列表有更新
            "updateLotteryTimes",   //更新转盘可抽奖次数
            "submitShareResult",     
            "languageChange",       //改变语言
            "updateGameBarVisible",          //显示导流条

            //指引相关
            "balanceOver",              //离线结算完毕后触发
            "addBaseCakeForGuide",      //增加基础蛋糕
            "combineOver",              //等待合并完成（现在凡是合并、解锁、甚至位置交换，一旦完成便会触发）
            "guideOver",                //引导结束
        ];

        this.setSupportEventList(this._EVENT_TYPE);
    },

    //TODO 应该考虑再加个事件？
    // showTipByTextKey: function (textKey) {
    //     return this.dispatchEvent("showTips", i18n.t(textKey));
    // }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});

var sharedClientEvent = new ClientEvent();
sharedClientEvent.onLoad();
module.exports = sharedClientEvent;
