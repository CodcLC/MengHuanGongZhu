// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html

var EFFECT_STATUS = cc.Enum({
    CONJURE: 0,     //施法中
    FLY: 1,         //飞行中
    ARRIVE: 2       //抵达中
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
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    ctor: function () {
        this.endListener = null;
        this.triggerListener = null;
        this.isTrigger = false;
    },

    onLoad: function() {
        this.onPlayOver = this.onPlayOver.bind(this);
    },

    playEffectWithName: function (name) {
        var ani = this.node.getComponent(cc.Animation);
        ani.once("finished", this.onClipPlayOver, this);
        ani.play(name);
    },

    onClipPlayOver: function () {
        if (this._status === EFFECT_STATUS.CONJURE) {
            this.playFly();
        } else if (this._status === EFFECT_STATUS.ARRIVE) {
            this.onPlayOver();
        }
    },

    // playEffect: function (srcNode, targetNode) {
    //     var configManager = kf.require("shared.configManager");

    //     this.srcNode = srcNode;
    //     this.targetNode = targetNode;
    //     var name = this.node.name;
    //     this.effectInfo = configManager.queryOne("effects", 'name', name);

    //     if (!this.effectInfo) {
    //         this.triggerEffect();
    //         this.onPlayOver();
    //         return;
    //     }

    //     this.playConjure();
    // },

    // playConjure: function () {
    //     this._status = EFFECT_STATUS.CONJURE;
    //     if (this.effectInfo["conjureEffect"]) {
    //         if (this.effectInfo["cIsFullScreen"]) {
    //             //施法特效是否全屏
    //             this.node.setPosition(cc.v2(0, 0));
    //         } else {
    //             this.node.setPosition(this.srcNode.position);
    //         }

    //         if (this.effectInfo["cIsFollowRotation"]) {
    //             //施法特效是否旋转
    //             this.node.rotation = this.srcNode.rotation;
    //         }

    //         this.playEffectWithName(this.effectInfo["conjureEffect"]);
    //     } else {
    //         this.playFly();
    //     }
    // },

    // playFly: function () {
    //     this._status = EFFECT_STATUS.FLY;
    //     if (this.effectInfo["flyEffect"]) {
    //         this.playEffectWithName(this.effectInfo["flyEffect"]);
    //     } else {
    //         this.playArrive();
    //     }
    // },

    // playArrive: function () {
    //     this._status = EFFECT_STATUS.ARRIVE;
    //     if (this.effectInfo["arriveEffect"]) {
    //         if (this.effectInfo["aIsFullScreen"]) {
    //             //到达特效是否全屏
    //             this.node.setPosition(cc.v2(0, 0));
    //         } else {
    //             this.node.setPosition(this.targetNode.position);
    //         }

    //         if (this.effectInfo["aIsFollowRotation"]) {
    //             //到达特效是否旋转
    //             this.node.rotation = this.targetNode.rotation;
    //         }

    //         this.playEffectWithName(this.effectInfo["arriveEffect"]);
    //     } else {
    //         if (!this.isTrigger) {
    //             this.triggerEffect();
    //         }

    //         this.onPlayOver();
    //     }
    // },

    //基础播放接口
    playAni: function (name) {
        this.ani = this.node.getComponent(cc.Animation);
        this.ani.once('finished', this.onPlayOver, this);
        this.ani.play(name);
    },

    setEndListener: function (callback) {
        this.endListener = callback;
    },

    onPlayOver: function () {
        if (this.endListener) {
            this.endListener(this.node);
        }
    },

    /**
     * 设置用户自定义数据
     * */
    setUserData: function (data) {
        this.userData = data;
    },

    /**
     * 获取用户自定义数据
     * */
    getUserData: function () {
        return this.userData;
    },

    /**
     * 特效的实际效果往往是在某一帧触发，并非播放结束后触发
     */
    triggerEffect: function () {
        if (this.triggerListener) {
            this.triggerListener(this.node);
        }

        this.isTrigger = true;
    },

    /**
     * 设置效果触发时的回调函数
     * @param {Function} callback 回调函数
     */
    setTriggerListener: function (callback) {
        this.triggerListener = callback;
    },

    update: function () {
        // if (this._status === EFFECT_STATUS.ARRIVE && this.effectInfo["aIsFollowTarget"]) {
        //     this.node.position = this.targetNode.position;

        //     if (this.effectInfo["aIsFollowRotation"]) {
        //         this.node.rotation = this.targetNode.rotation;
        //     }
        // }
    }
});
