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
const playerData = require('playerData');
const localConfig = require('localConfig');
const resourceUtil = require('resourceUtil');
const constants = require('constants');
const gameLogic = require('gameLogic');

const GIFT_STATUS = cc.Enum({
    GIFT_STATUS_START: 1,
    GIFT_STATUS_SHOW: 2,
    GIFT_STATUS_OVER: 3
});

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
        btnOpen: cc.Button,
        spCake: cc.Sprite
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {
        this.ani = this.node.getComponent(cc.Animation);
        this.ani.play('giftBoxStart');
        this.ani.on('finished', this.onAniPlayOver, this);
        this.currentStatus = GIFT_STATUS.GIFT_STATUS_START;
    },

    /**
     * 设置信息
     * @param {Number} workbenchIdx 
     */
    setInfo (workbenchIdx) {
        this.workbenchIdx = workbenchIdx;

        let cakeId = playerData.workbench[this.workbenchIdx];
        if (cakeId) {
            let itemInfo = localConfig.queryByID('cake', cakeId);

            if (itemInfo) {
                resourceUtil.setCakeIcon(itemInfo.img, this.spCake, ()=>{

                });
            }

        }
    },

    showWaiting () {
        this.ani.play('giftBoxIdle');
        this.currentStatus = GIFT_STATUS.GIFT_STATUS_SHOW;
        this.btnOpen.interactable = true;

        //启动计时器，5秒内，没有被点击则自动打开
        this.scheduleOnce(this.openBoxAuto, 5);
    },

    openBoxAuto () {
        this.openBox(true);
    },

    openBox (isAuto) {
        isAuto = !!isAuto;

        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.GIFT_CAKE_OPEN, {isAuto: isAuto});

        this.btnOpen.interactable = false;
        this.unschedule(this.openBox);
        this.ani.play('giftBoxOver');
        this.currentStatus = GIFT_STATUS.GIFT_STATUS_OVER;
    },

    onAniPlayOver () {
        switch (this.currentStatus) {
            case GIFT_STATUS.GIFT_STATUS_START:
                //进入等待点击状态
                this.showWaiting();
                break;
            case GIFT_STATUS.GIFT_STATUS_OVER:
                this.node.destroy();
                break;
            default:
                break;
        }
    },

    triggerEffect () {
        //事件触发
        //刷新界面的同时，顺带触发进行下一次的礼物掉落
        clientEvent.dispatchEvent('updateWorkbench', this.workbenchIdx);
    },

    // update (dt) {},
});
