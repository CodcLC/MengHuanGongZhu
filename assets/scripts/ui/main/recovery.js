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
const resourceUtil = require('resourceUtil');
const clientEvent = require('clientEvent');
const playerData = require('playerData');
const constants = require('constants');
const i18n = require('LanguageData');
const poolManager = require('poolManager');

const SCALE_NORMAL = 1;
const SCALE_BIG = 1.1;

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

        nodeTips: cc.Node,

        aniRecovery: cc.Animation,

        prefabGetTips: cc.Prefab
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {
        this.updateWorkbench();
    },

    onEnable () {
        clientEvent.on('updateWorkbench', this.updateWorkbench, this);
    },

    onDisable () {
        clientEvent.off('updateWorkbench', this.updateWorkbench, this);
    },

    /**
     * 判断当前拖拽的坐标是否拖到回收站里头，主要为了更新回收站的动画表现
     * @param {cc.v2} pos 
     */
    updateDragPos (pos) {
        let box = this.node.getBoundingBoxToWorld();

        if (!box.contains(pos)) {
            if (this.node.scale === SCALE_BIG) {
                this.node.scale = SCALE_NORMAL;
            }

            return false;
        }

        if (this.node.scale === SCALE_NORMAL) {
            this.node.scale = SCALE_BIG;
        }
    },

    checkIsDragToRecovery (workbenchIdx, pos) {
        let box = this.node.getBoundingBoxToWorld();

        if (!box.contains(pos)) {
            return false;
        }

        //发送回收请求
        let price = gameLogic.recoveryCake(workbenchIdx);
        if (price !== -1) {
            this.aniRecovery.play();

            //播放金币特效
            // resourceUtil.createEffect('ui/money/money', (err, effectNode) => {
            //     if (!err) {
            //         effectNode.setPosition(cc.v2(0, 0));
            //     }
            // }, this.node);

            let tipsNode = poolManager.getNode(this.prefabGetTips, this.node);
            tipsNode.setPosition(cc.v2(0, 0));
            tipsNode.getComponent('getTips').showReward(constants.REWARD_TYPE.GOLD, price);

            //将回收站状态恢复
            this.node.scale = SCALE_NORMAL;

            cc.gameSpace.audioManager.playSound('sell', false);
        }

        return true;
    },

    onBtnRecoveryClick () {
        cc.gameSpace.showTips(i18n.t('showTips.dragCakeForRecycle'));

        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.RECYCLE_BTN_CLICK, {});
    },

    updateWorkbench () {
        if (this.isLoading) {
            return;
        }

        if (playerData.hasPosAtWorkbench()) {
            this.nodeTips.active = false;
            return;
        }

        //检查是否已经没法合成了？？？
        let arrCake = [];
        for (let idx = 0; idx < playerData.workbench.length; idx++) {
            arrCake.push({pos: idx, cakeId: Number(playerData.workbench[idx])});
        }

        arrCake = arrCake.sort(function(a, b) {
            return a.cakeId - b.cakeId;
        });

        let idxCanCombine = -1;
        for (let idxCake = 0; idxCake < arrCake.length - 1; idxCake++) {
            if (arrCake[idxCake].cakeId === arrCake[idxCake+1].cakeId) {
                idxCanCombine = idxCake;
                break;
            }
        }

        if (idxCanCombine === -1) {
            //表示已经不能合成了
            //这时候给出文字提示，而不是动画了
            this.nodeTips.active = true;

            // if (!this.nodeRecycle || !cc.isValid(this.nodeRecycle)) {
            //     this.isLoading = true;
            //     resourceUtil.createEffect('ui/recycle/recycle', (err, node)=>{
            //         this.isLoading = false;

            //         if (!err) {
            //             this.nodeRecycle = node;
            //             this.spRecovery.enabled = false;
            //         }
            //     }, this.node);
            // } else {
            //     this.nodeRecycle.active = true;
            //     this.spRecovery.enabled = false;
            // }
        } else {
            this.nodeTips.active = false;
        }
    },

    showRecycleAni () {

    },

    // update (dt) {},
});
