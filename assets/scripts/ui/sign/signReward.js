// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html

const clientEvent = require('clientEvent');
const constants = require('constants');
const utils = require('utils');
const gameLogic = require('gameLogic');
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

        lbGold: cc.Label,
        lbDouble: cc.Label,
        lbDay: cc.Label,
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start() {

    },

    show(signInfo) {
        this.setInfo(signInfo);
    },

    setInfo(signInfo) {
        //todo 后续需要支持金币奖励
        this.signInfo = signInfo;
        let strValue = '+' + utils.formatMoney(signInfo.amount);
        this.lbGold.string = strValue;
        // this.lbDouble.string = utils.formatMoney(signInfo.amount);

        //this.lbDay.string = i18n.t('string.signContinue') + signInfo.ID + i18n.t('string.keepOn');
        this.lbDay.string = i18n.t('signReward.你已经连续签到%{value}天，继续保持', { value: signInfo.ID });

        // gameLogic.getOpenRewardType(constants.SHARE_FUNCTION.SIGN, (err, type) => {
        //     if (type !== constants.OPEN_REWARD_TYPE.NULL) {
        //         this.nodeBtnShare.active = true;
        //         gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.SIGN_SHARE_SHOW, {});
        //     } else {
        //         this.nodeBtnShare.active = false;
        //     }
        // });
    },

    onBtnCloseClick() {
        // this.node.destroy();

        // cc.gameSpace.uiManager.popFromPopupSeq('sign/sign');
        this.close();
    },

    onBtnReceiveClick() {
        this.showReward();
    },

    showReward() {
        this.close();

        clientEvent.dispatchEvent('showFlyReward', constants.REWARD_TYPE.DIAMOND, function() {
            this.reward();
        }, this);
    },

    reward() {
        gameLogic.addDiamond(this.signInfo.amount);

        // cc.gameSpace.audioManager.playSound('sell', false);

    },

    close() {
        cc.gameSpace.uiManager.hideSharedDialog('sign/signReward');
    }

    // update (dt) {},
});