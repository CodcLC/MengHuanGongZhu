// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html

const utils = require('utils');
const clientEvent = require('clientEvent');
const playerData = require('playerData');
const constants = require('constants');
const gameLogic = require('gameLogic');
const i18n = require('LanguageData');
const buttonEx = require('../common/buttonEx');

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

        lbGold: cc.Label,
        //lbDouble: cc.Label,
        btnExDouble: buttonEx,
        btnExNormal: buttonEx,
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start() {

    },

    show(addGold) {
        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.BALANCE_SHOW, {});

        cc.gameSpace.audioManager.playSound('sell', false);

        this.addGold = addGold;
        let strValue = '+' + utils.formatMoney(addGold);
        this.lbGold.string = strValue;
        // this.lbDouble.string = strValue;

        this.btnExNormal.node.active = false;
        this.scheduleOnce(() => {
            this.btnExNormal.node.active = true;
        }, constants.OFFSET_TIME);

        gameLogic.getOpenRewardType(constants.SHARE_FUNCTION.BALANCE, (err, type) => {
            this.openRewardType = type;
            switch (type) {
                case constants.OPEN_REWARD_TYPE.AD:
                    this.btnExDouble.node.active = true;
                    gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.BALANCE_AD_SHOW, {});
                    break;
                case constants.OPEN_REWARD_TYPE.SHARE:
                    this.btnExDouble.node.active = true;
                    gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.BALANCE_SHARE_SHOW, {});
                    break;
                case constants.OPEN_REWARD_TYPE.NULL:
                    this.isCanShare = false;
                    this.btnExDouble.node.active = false;
                    this.btnExNormal.node.active = true;
                    break;
            }
        });
    },

    close() {
        cc.gameSpace.uiManager.hideSharedDialog('balance/balance');

        clientEvent.dispatchEvent('balanceOver');

        cc.gameSpace.uiManager.popFromPopupSeq('balance/balance');
    },

    onBtnOKClick() {
        this.close(); //暂时也是直接关闭该界面
    },

    onBtnDoubleReceiveClick() {
        if (this.openRewardType === constants.OPEN_REWARD_TYPE.SHARE) {
            this.showReward();
        } else { //广告分享，目前广告未接入，先做分享
            cc.gameSpace.audioManager.playSound('click', false);
            if (this.isLoadingAd) {
                cc.gameSpace.showTips(i18n.t('showTips.waitLForoadingAds'));
                return;
            }

            this.isLoadingAd = true;
            this.scheduleOnce(this.resetAdSwitch, 5);

            let adType = 0;
            gameLogic.watchAd(constants.SHARE_FUNCTION.BALANCE, constants.WATCH_AD_MAX_TIMES.BALANCE, adType, (err, isOver) => {
                this.isLoadingAd = false;
                this.unschedule(this.resetAdSwitch);

                if (!err && isOver) {
                    gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.BALANCE_AD_SUCCESS, {});
                    this.showReward();
                } else if (err) {
                    //判定广告不可用时才可使用分享
                    if (dynamicData.isShareOpen()) {
                        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.BALANCE_SHARE_SHOW, {});

                        this.nodeBtnAd.active = false;
                        this.nodeBtnShare.active = true;
                        //this.onBtnShareClick();
                    }
                }
            });
        }
    },

    onBtnNormalReceiveClick() {
        // if (Math.random() >= 0.9 && this.openRewardType !== constants.OPEN_REWARD_TYPE.NULL) return;
        this.showReward();
    },

    resetAdSwitch() {
        this.isLoadingAd = false;
    },

    showReward() {
        this.close(); //暂时也是直接关闭该界面

        clientEvent.dispatchEvent('showFlyReward', constants.REWARD_TYPE.GOLD, function() {
            this.reward();
        }, this);
    },

    reward() {
        playerData.addGold(this.addGold);

        clientEvent.dispatchEvent('updateGold');

        cc.gameSpace.audioManager.playSound('sell', false);
    },
    // update (dt) {},
});