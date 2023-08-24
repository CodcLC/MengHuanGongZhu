// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html
const constants = require('constants');
const clientEvent = require('clientEvent');
const gameLogic = require('gameLogic');
const playerData = require('playerData');
const utils = require('utils');
const i18n = require('LanguageData');
const resourceUtil = require('resourceUtil');

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

        imgLittleGold: cc.SpriteFrame,
        imgLargeGold: cc.SpriteFrame,
        imgLittleDiamond: cc.SpriteFrame,
        imgLargeDiamond: cc.SpriteFrame,

        spItem: cc.Sprite,
        lbAmount: cc.Label,

        nodeShare: cc.Node,
        nodeAd: cc.Node,
        nodeImgShare: cc.Node
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start() {

    },

    showShareBtn() {
        this.nodeAd.active = false;
        this.nodeShare.active = true;

        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.LOVE_HEART_SHARE_SHOW, {});
    },

    /**
     * 设置奖励信息
     * @param {Number} source 奖励来源 
     * @param {Number} rewardType 
     * @param {Number} amount 
     * @param {Boolean} isNeedShare 
     */
    show(source, rewardType, amount, isNeedShare) {
        this.source = source;
        this.rewardType = rewardType;
        this.amount = amount;
        switch (rewardType) {
            case constants.REWARD_TYPE.GOLD:
                if (isNeedShare) {
                    this.spItem.spriteFrame = this.imgLargeGold;
                } else {
                    this.spItem.spriteFrame = this.imgLittleGold;
                }

                break;
            case constants.REWARD_TYPE.DIAMOND:
                if (isNeedShare) {
                    this.spItem.spriteFrame = this.imgLargeDiamond;
                } else {
                    this.spItem.spriteFrame = this.imgLittleDiamond;
                }
                break;
        }

        if (source === constants.REWARD_SOURCE.LOVE_HEART) {
            //检查下是否有加成buff
            // let feeBuff = gameLogic.getBuff(constants.BUFF_TYPE.FEE_ADD);
            // if (feeBuff) {
            //     let addValue = Math.floor(this.amount * Number(feeBuff.buff.addValue));
            //     addValue = addValue > 0 ? addValue : 1;
            //     this.amount += addValue;
            // }
        }

        this.lbAmount.string = '+' + utils.formatMoney(this.amount);

        this.isNeedShare = isNeedShare;
        if (isNeedShare) {
            this.nodeImgShare.active = true;
            if (source === constants.REWARD_SOURCE.LOVE_HEART) {
                gameLogic.getOpenRewardType(constants.SHARE_FUNCTION.LOVE_HEART, (err, type) => {
                    switch (type) {
                        case constants.OPEN_REWARD_TYPE.AD:
                            this.nodeAd.active = true;
                            this.nodeShare.active = false;
                            gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.LOVE_HEART_AD_SHOW, {});
                            break;
                        case constants.OPEN_REWARD_TYPE.SHARE:
                            this.showShareBtn();
                            break;
                        case constants.OPEN_REWARD_TYPE.NULL:
                            this.nodeAd.active = false;
                            this.nodeShare.active = false;
                            break;
                    }
                });
            } else {
                this.showShareBtn();
            }
        } else {
            this.nodeImgShare.active = false;
            this.nodeShare.active = true;
            this.nodeAd.active = false;
        }

        resourceUtil.updateNodeRenderers(this.node);
    },

    onBtnCloseClick() {
        cc.gameSpace.audioManager.playSound('click', false);

        cc.gameSpace.uiManager.hideSharedDialog('dialog/reward');
    },

    onBtnShareClick() {
        cc.gameSpace.audioManager.playSound('click', false);
        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.LOVE_HEART_FREE_REWARD, {}); //免费领取的统计
        this.showReward();
    },

    resetAdSwitch() {
        this.isLoadingAd = false;
    },

    onBtnAdClick() {
        cc.gameSpace.audioManager.playSound('click', false);

        let adType = 0;
        gameLogic.watchAd(constants.SHARE_FUNCTION.LOVE_HEART, constants.WATCH_AD_MAX_TIMES.LOVE_HEART, adType, (err, isOver) => {
            this.isLoadingAd = false;
            this.unschedule(this.resetAdSwitch);

            if (!err && isOver) {
                gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.LOVE_HEART_AD_SUCCESS, {});
                this.showReward();
            } else if (err) {
                this.nodeAd.active = false;
                this.nodeShare.active = true;

                this.onBtnShareClick();
            }
        });
    },

    showReward() {
        this.onBtnCloseClick(); //暂时也是直接关闭该界面

        clientEvent.dispatchEvent('showFlyReward', this.rewardType, function() {
            this.reward();
        }, this);
    },

    reward() {
        if (this.rewardType === constants.REWARD_TYPE.GOLD) {
            playerData.addGold(this.amount);
            clientEvent.dispatchEvent('updateGold');
        } else if (this.rewardType === constants.REWARD_TYPE.DIAMOND) {
            playerData.addDiamond(this.amount);
            clientEvent.dispatchEvent('updateDiamond');
        }

    },

    // update (dt) {},
});