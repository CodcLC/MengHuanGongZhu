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

const GIFT_STATUS = cc.Enum({
    GIFT_STATUS_START: 1,
    GIFT_STATUS_SHOW: 2,
    GIFT_STATUS_STOP: 3,
    GIFT_STATUS_OVER: 4
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
        btnOpen: cc.Button
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {
        this.ani = this.node.getComponent(cc.Animation);
        this.ani.on('finished', this.onAniPlayOver, this);   
    },

    playStart () {
        this.currentStatus = GIFT_STATUS.GIFT_STATUS_START;
        this.playAni('cakeBoxStart');
    },

    playStop () {
        this.currentStatus = GIFT_STATUS.GIFT_STATUS_STOP;
        this.playAni('cakeBoxStop');
    },

    playOver (callback) {
        this.currentStatus = GIFT_STATUS.GIFT_STATUS_OVER;
        this.overListener = callback;
        this.playAni('cakeBoxOver');
    },

    playAni (ani) {
        if (!this.ani) {
            this.ani = this.node.getComponent(cc.Animation);
        }
        this.ani.play(ani);
    },

    /**
     * 设置信息
     * @param {Number} workbenchIdx 
     */
    setInfo (workbenchIdx) {
        this.workbenchIdx = workbenchIdx;

        // let cakeId = playerData.workbench[this.workbenchIdx];
        // if (cakeId) {
        //     let itemInfo = localConfig.queryByID('cake', cakeId);

        //     if (itemInfo) {
        //         resourceUtil.setCakeIcon(itemInfo.img, this.spCake, ()=>{

        //         });
        //     }

        // }
    },

    setOpenBoxListener (callback) {
        this.callback = callback;
    },

    setTriggerListener (callback) {
        this.triggerListener = callback;
    },

    showWaiting () {
        this.ani.play('cakeBoxShow');
        this.currentStatus = GIFT_STATUS.GIFT_STATUS_SHOW;
        this.btnOpen.interactable = true;

        //启动计时器，5秒内，没有被点击则自动打开
        // this.scheduleOnce(this.openBox, 5);
    },

    openBox () {
        // this.btnOpen.interactable = false;
        // this.unschedule(this.openBox);
        // this.ani.play('giftBoxOver');
        // this.currentStatus = GIFT_STATUS.GIFT_STATUS_OVER;

        if (this.callback) {
            this.callback();
        }
    },

    onAniPlayOver () {
        switch (this.currentStatus) {
            case GIFT_STATUS.GIFT_STATUS_START:
                //进入等待点击状态
                this.showWaiting();
                break;
            case GIFT_STATUS.GIFT_STATUS_OVER:
                if (this.overListener) {
                    this.overListener();
                }
                break;
            default:
                break;
        }
    },

    triggerEffect () {
        //事件触发
        if (this.triggerListener) {
            this.triggerListener();
        }
        
    },

    // update (dt) {},
});
