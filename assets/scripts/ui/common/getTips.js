// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html

const poolManager = require('poolManager');
const constants = require('constants');
const utils = require('utils');

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

        spReward: cc.Sprite,
        lbValue: cc.Label,

        imgGold: cc.SpriteFrame,
        imgDiamond: cc.SpriteFrame,
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {

    },

    /**
     * 显示奖励字符串
     * @param {Number} rewardType 奖励类型
     * @param {Number} rewardValue 奖励值
     * @param {Function} cb 回调函数
     */
    showReward (rewardType, rewardValue, cb) {
        this.lbValue.string = '+' + utils.formatMoney(rewardValue);

        if (rewardType === constants.REWARD_TYPE.DIAMOND) {
            this.spReward.spriteFrame = this.imgDiamond;
            this.spReward.node.width = 33;
            this.spReward.node.height = 40;
        } else {
            this.spReward.spriteFrame = this.imgGold;
            this.spReward.node.width = 40;
            this.spReward.node.height = 40;
        }

        this.node.setScale(0);
        this.node.opacity = 255;
        
        var scaleAction = cc.scaleTo(0.5, 1).easing(cc.easeBackInOut());
        var delayAction = cc.delayTime(0.2);
        var moveByAction = cc.moveBy(0.8, cc.v2(0, 150));
        var fadeAction = cc.fadeOut(0.8);
        var spawnAction = cc.spawn(moveByAction, fadeAction);
        var seqAction = cc.sequence(scaleAction, delayAction, spawnAction, cc.callFunc(function(node) {
            poolManager.putNode(node);

            if (cb) {
                cb();
            }
        }));

        this.node.runAction(seqAction);
    },

    // update (dt) {},
});
