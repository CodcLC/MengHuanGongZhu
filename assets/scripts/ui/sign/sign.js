// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html

const localConfig = require('localConfig');
const playerData = require('playerData');
const utils = require('utils');
const gameLogic = require('gameLogic');
const constants = require('constants');
const buttonEx = require('../common/buttonEx');
const i18n = require('LanguageData');

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //     // ATTRIBUTES:
        //     default: null,        // The default value will be used only when the component attaching
        //                           // to a node for the first time
        //     type: cc.SpriteFrame, // optional, default is typeof default
        //     serializable: true,   // optional, default is true
        // },
        // bar: {
        //     get () {
        //         return this._bar;
        //     },
        //     set (value) {
        //         this._bar = value;
        //     }
        // },

        arrValueLabel: [cc.Label], //价格集合
        arrGet: [cc.Node], //已获取图标集合
        arrHalo: [cc.Node], //当前签到的背景晕圈集合
        arrParticle: [cc.Node], //粒子效果集合

        btnExNormal: buttonEx,
        btnExDouble: buttonEx
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start() {
        // this.refreshUI();
    },

    show() {
        this.refreshUI();

        this.btnExNormal.node.active = false;
        this.scheduleOnce(() => {
            this.btnExNormal.node.active = true;
        }, constants.OFFSET_TIME);
    },

    refreshUI() {

        this.btnExDouble.interactable = !gameLogic.isTodayHadSignin();
        this.btnExNormal.interactable = !gameLogic.isTodayHadSignin();

        let tbSign = localConfig.getTable('dailySign');
        let idx = 0;
        for (let day in tbSign) {
            let info = tbSign[day];

            this.arrValueLabel[idx].string = info.amount;
            idx++;
        }


        let today = utils.getDay();
        let signInfo = playerData.getDailySignInfo();
        if (signInfo) {
            if (signInfo.lastSignDay >= today) {
                //今天已签到
                //this.btnExNormal.interactable = false;

                this.refreshGet(true);

                //TODO 所有光效都需要关闭
                for (let idxGet = 0; idxGet < 7; idxGet++) {
                    this.arrHalo[idxGet].active = false;
                    this.arrParticle[idxGet].active = false;
                }
            } else {
                //判断下哪天被签到了，剩余多少天
                let signTimes = signInfo.signTimes;
                if (signTimes >= 7) { //超过7天，今天来就是第1天啦
                    signTimes = 0;
                }

                this.refreshGet(false);

                //TODO 下一个签到加光效？
                this.arrHalo[signTimes].active = true;
                this.arrParticle[signTimes].active = true;
            }
        } else {
            //证明是第一天or 新手
            this.arrHalo[0].active = true;
            this.arrParticle[0].active = true;
        }

        cc.gameSpace.gameLogic.getOpenRewardType(constants.SHARE_FUNCTION.SIGN, (err, type) => {
            this.openRewardType = type;
            switch (type) {
                case constants.OPEN_REWARD_TYPE.AD:
                    this.btnExDouble.node.active = true;
                    gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.SIGN_SHARE_SHOW, {});
                    break;
                case constants.OPEN_REWARD_TYPE.SHARE:
                    this.btnExDouble.node.active = true;
                    gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.SIGN_SHARE_SHOW, {});
                    break;
                case constants.OPEN_REWARD_TYPE.NULL:
                    this.btnExDouble.node.active = false;
                    break;
            }
        });
    },

    refreshGet(isToday) {
        let signInfo = playerData.getDailySignInfo();
        if (signInfo && signInfo.signTimes) {
            let signTimes = signInfo.signTimes;
            if (!isToday && signTimes >= 7) { //超过7天，今天来就是第1天啦
                signTimes = 0;
            }

            for (let idxGet = 0; idxGet < signTimes; idxGet++) {
                this.arrGet[idxGet].active = true;
                this.arrValueLabel[idxGet].node.active = false;
                this.arrHalo[idxGet].active = false;
            }
        }
    },

    onBtnNormalReceiveClick() {
        // let reward = gameLogic.sign();
        // if (reward) {
        //this.btnExNormal.interactable = false;
        //this.refreshGet(true);

        //let _this = this;
        // resourceUtil.createUI('sign/signReward', (err, node)=>{
        //     if (err) {
        //         return;
        //     }
        //     _this.node.destroy();

        //     node.zIndex = constants.ZORDER.DIALOG;
        //     let signReward = node.getComponent('signReward');
        //     signReward.setInfo(reward);
        // });
        //     cc.gameSpace.uiManager.showSharedDialog('sign/signReward', 'signReward', [reward]);
        // }
        if (Math.random() <= constants.DISABLE_RATIO && this.openRewardType !== constants.OPEN_REWARD_TYPE.NULL) return;
        this.showSignRewardPanel(false);
    },

    onBtnDoubleReceiveClick() {
        let funStr = constants.SHARE_FUNCTION.SIGN;
        if (this.openRewardType === constants.OPEN_REWARD_TYPE.SHARE) {
            this.showSignRewardPanel(true);
        } else {
            let adType = funStr;
            gameLogic.watchAd(funStr, playerData.getAdMaxTimesByFun(funStr), adType, (err, isOver) => {
                this.isLoadingAd = false;
                this.unschedule(this.resetAdSwitch);
                if (!err && isOver) {
                    this.showSignRewardPanel(true);
                } else if (err) {
                    this.close();
                }
            })
        }
    },

    resetAdSwitch() {
        this.isLoadingAd = false;
    },

    showSignRewardPanel(isDouble) {
        let reward = gameLogic.sign();

        if (reward) {
            if (isDouble && reward.amount) {
                reward.amount *= 2;
            }
            this.refreshGet(true);
            cc.gameSpace.uiManager.showSharedDialog('sign/signReward', 'signReward', [reward]);
        }

        this.close();
    },

    onBtnCloseClick() {

        // cc.gameSpace.uiManager.popFromPopupSeq('sign/sign');

        // this.node.destroy();
        this.close();
    },

    close() {
        cc.gameSpace.uiManager.popFromPopupSeq('sign/sign');
        cc.gameSpace.uiManager.hideSharedDialog('sign/sign');
    }

    // update (dt) {},
});