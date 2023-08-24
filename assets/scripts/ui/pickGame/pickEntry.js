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
const gameLogic = require('gameLogic');

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

        pfPlane: cc.Prefab,
        nodeBubble: cc.Node,
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {
        this.nodePlane = cc.instantiate(this.pfPlane);
        this.nodePlane.parent = this.node;
        this.nodePlane.scaleX = -1;
        //this.nodePlane.position = cc.v2(51, -29);
    },

    reset () {
        if (this.nodePlane) {
            this.nodePlane.scaleX = -1;
        }
    },

    flip () {
        this.nodePlane.scaleX = -this.nodePlane.scaleX;
    },

    onBtnOpenClick () {
        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.NATIONAL_PLANE_CLICK, {});

        clientEvent.dispatchEvent('updateGameBarVisible', false);
        cc.gameSpace.uiManager.showSharedDialog("pickGame/pickGame", "pickGame", [function(){
            
        }, this]);

        this.node.active = false;
    }

    // update (dt) {},
});
