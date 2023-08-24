// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html

const gameLogic = require('gameLogic');
const clientEvent = require('clientEvent');
const playerData = require('playerData');
const constants = require('constants');
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

        nodeGold: cc.Node,
        nodeDiamond: cc.Node,

        lbGold: cc.Label,
        lbDiamond: cc.Label,

        nodeBtnDouble: cc.Node,
        nodeBtnNormal: cc.Node
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start() {

    },

    show(gold, diamond, parent) {
        this.checkButton();

        this.rewardGold = gold;
        this.rewardDiamond = diamond;
        this.lbGold.string = '+' + utils.formatMoney(this.rewardGold);
        this.lbDiamond.string = '+' + utils.formatMoney(this.rewardDiamond);

        this.nodeDiamond.active = this.rewardDiamond > 0;

        this.pickGame = parent;

        resourceUtil.updateNodeRenderers(this.node);

        this.nodeBtnNormal.active = false;
        this.scheduleOnce(() => {
            this.nodeBtnNormal.active = true;
        }, constants.OFFSET_TIME);
    },

    checkButton() {
        gameLogic.getOpenRewardType(constants.SHARE_FUNCTION.PICK_GAME, (err, type) => {
            this.rewardType = type;
            switch (type) {
                case constants.OPEN_REWARD_TYPE.AD:
                    this.nodeBtnDouble.active = true;
                    gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.PICK_GAME_AD_SHOW, {});
                    break;
                case constants.OPEN_REWARD_TYPE.SHARE:
                    this.nodeBtnDouble.active = true;
                    gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.PICK_GAME_SHARE_SHOW, {});
                    break;
                case constants.OPEN_REWARD_TYPE.NULL:
                    this.isCanShare = false;
                    this.nodeBtnDouble.active = false;
                    break;
            }
        });
    },

    onBtnNormalClick() {
        if (Math.random() <= constants.DISABLE_RATIO && this.rewardType !== constants.OPEN_REWARD_TYPE.NULL) return;
        this.showReward(false);
    },

    onBtnDoubleClick() {
        this.rewardType === constants.OPEN_REWARD_TYPE.SHARE ? this.showShare() : this.showAd();
    },

    showShare() {
        this.showReward(true);
    },

    resetAdSwitch() {
        this.isLoadingAd = false;
    },

    showAd() {
        cc.gameSpace.audioManager.playSound('click', false);

        this.showReward(true);
    },

    showReward(isDouble) {
        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.PICK_GAME_OVER, { gold: this.rewardGold, diamond: this.rewardDiamond });

        if (isDouble) {
            this.rewardGold *= 2;
            this.rewardDiamond *= 2;
        }

        if (this.rewardGold > 0) {
            clientEvent.dispatchEvent('showFlyReward', constants.REWARD_TYPE.GOLD, function() {
                playerData.addGold(this.rewardGold);
                clientEvent.dispatchEvent('updateGold');
            }, this);
        }

        if (this.rewardDiamond > 0) {
            setTimeout(() => {
                clientEvent.dispatchEvent('showFlyReward', constants.REWARD_TYPE.DIAMOND, function() {
                    playerData.addDiamond(this.rewardDiamond);
                    clientEvent.dispatchEvent('updateDiamond');
                }, this);
            }, 1000);
        }


        //将界面关掉
        cc.gameSpace.uiManager.hideSharedDialog('pickGame/pickResult');
        this.pickGame.onBtnCloseClick();

        clientEvent.dispatchEvent('updateGameBarVisible', true);

        //触发下一次的出现
        let randTime = 120 + Math.ceil(Math.random() * 60); //2分钟~3分钟
        let nextTime = playerData.getCurrentTime() + randTime * 1000;
        playerData.setSetting(constants.SETTINGS_KEY.NATIONAL_DAY_NEXT_TIME, nextTime);

        clientEvent.dispatchEvent('pickGameFinish');
    },

    // update (dt) {},
});