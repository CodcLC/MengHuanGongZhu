// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html

const playerData = require('playerData');
const gameLogic = require('gameLogic');
const constants = require('constants');
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

        pfEffect: cc.Prefab,

        nodeBtnShare: cc.Node,
        nodeBtnAd: cc.Node
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start() {

    },

    show(successCb) {
        this.successCb = successCb;

        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.CELEBRATION_SHOW, {});

        // this.checkButton();

        if (!this.effectNode) {
            this.effectNode = cc.instantiate(this.pfEffect);
            this.effectNode.parent = this.node;
            this.effectNode.position = cc.v2(0, 0);
        }

        let ani = this.effectNode.getComponent(cc.Animation);
        ani.play('celebrationStart');
        ani.once('finished', () => {
            ani.play('celebrationIdle');
        }, this);

        resourceUtil.updateNodeRenderers(this.node);
    },

    resetAdSwitch() {
        this.isLoadingAd = false;
    },

    onBtnAdClick() {
        cc.gameSpace.audioManager.playSound('click', false);

        this.accelerate();
    },

    onBtnShareClick() {
        this.accelerate();
    },

    accelerate() {
        //设置剩余时间
        let accelerateTime = 120;
        let accelerateBuff = gameLogic.getBuff(constants.BUFF_TYPE.ACCELERATE);
        if (accelerateBuff) {
            accelerateTime += Number(accelerateBuff.buff.addValue);
        }


        playerData.saveAccelerateTime(accelerateTime);
        if (this.successCb) {
            this.successCb();
        }

        this.onBtnCloseClick();
    },

    onBtnCloseClick() {
        cc.gameSpace.uiManager.hideSharedDialog('dialog/celebration');
    },

    // update (dt) {},
});