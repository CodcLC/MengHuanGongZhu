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
const localConfig = require('localConfig');
const resourceUtil = require('resourceUtil');
const constants = require('constants');
const gameLogic = require('gameLogic');
const playerData = require('playerData');

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

        // cakeEffectNode: cc.Node,
        nodeBtnOK: cc.Node,
        nodeBtnShare: cc.Node,
        nodeHaloEffect: cc.Node,

        spCake: cc.Sprite
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start() {

    },

    show(originIndex, targetIndex, itemId) {
        let _this = this;
        this.spCake.node.active = true;
        this.nodeHaloEffect.active = true;
        // this.nodeBtnOK.active = false;
        this.nodeBtnShare.active = false;
        this.originIndex = originIndex;
        this.targetIndex = targetIndex;
        this.isTrigger = false;
        this.updateWorkbench(originIndex);

        var itemInfo = localConfig.queryByID('cake', itemId);
        if (!itemInfo) {
            this.updateWorkbench(targetIndex);
            // this.nodeBtnOK.active = true;
            // this.nodeBtnShare.active = true;
            _this.showShareBtn();
            return;
        }

        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.UNLOCK_SHARE_SHOW, { cakeId: itemInfo.next });

        // var nextItemInfo = localConfig.queryByID('cake', itemInfo.next);
        // if (!nextItemInfo) {
        //     this.updateWorkbench(targetIndex);
        //     // this.nodeBtnOK.active = true;
        //     // this.nodeBtnShare.active = true;
        //     _this.showShareBtn();
        //     return;
        // }

        // resourceUtil.setCakeIcon(nextItemInfo.img, this.spCake, function(){});
        // this.cakeEffectNode.active = false;

        // let effectCmp = this.cakeEffectNode.getComponent('effect');
        // effectCmp.setTriggerListener(()=>{
        //     //最后刷新下数据
        //     cc.gameSpace.audioManager.playSound('unlockCake', false);
        //     _this.nodeHaloEffect.active = true;
        //     _this.updateWorkbench(targetIndex);
        //     // this.nodeBtnOK.active = true;
        //     _this.showShareBtn();

        // });

        // effectCmp.setEndListener(()=>{
        //     this.spCake.node.active = true;
        //     // this.cakeEffectNode.destroy();
        //     this.cakeEffectNode.active = false;
        // });

        // resourceUtil.setCakeIcon(itemInfo.img, this.cakeEffectNode.getChildByName('left').getComponent(cc.Sprite), function(){});
        // resourceUtil.setCakeIcon(itemInfo.img, this.cakeEffectNode.getChildByName('right').getComponent(cc.Sprite), function(){});
        // resourceUtil.setCakeIcon(nextItemInfo.img, this.cakeEffectNode.getChildByName('target').getComponent(cc.Sprite), function(){
        //     _this.cakeEffectNode.active = true;
        //     effectCmp.playAni('unlock');
        // });

        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.UNLOCK_SHARE_SHOW, { cakeId: itemInfo.next });

        var nextItemInfo = localConfig.queryByID('cake', itemInfo.next);
        if (!nextItemInfo) {
            this.updateWorkbench(targetIndex);
            // this.nodeBtnOK.active = true;
            // this.nodeBtnShare.active = true;
            _this.showShareBtn();
            return;
        }

        resourceUtil.setCakeIcon(nextItemInfo.img, this.spCake, function() {});
        // this.cakeEffectNode.active = false;

        cc.gameSpace.audioManager.playSound('unlockCake', false);
        this.updateWorkbench(targetIndex);
        this.showShareBtn();

        resourceUtil.updateNodeRenderers(this.node);
    },

    showShareBtn() {
        this.isTrigger = true;

        this.nodeBtnShare.active = gameLogic.isShareOpen();
    },

    updateWorkbench(index) {
        clientEvent.dispatchEvent('updateWorkbench', index);
    },

    onBtnCloseClick() {
        // if (!this.nodeBtnShare.active) {
        //     return;
        // }

        cc.gameSpace.audioManager.playSound('click', false);

        if (!this.isTrigger) {
            this.updateWorkbench(this.originIndex);
            this.updateWorkbench(this.targetIndex);
        }

        cc.gameSpace.uiManager.hideSharedDialog('dialog/unlock');

        clientEvent.dispatchEvent("combineOver");
    },

    onBtnOKClick() {
        cc.gameSpace.audioManager.playSound('click', false);

        this.onBtnCloseClick(); //暂时也是直接关闭该界面
    },

    onBtnShareClick() {
        cc.gameSpace.audioManager.playSound('click', false);

        this.showReward();
    },

    showReward() {
        this.node.active = false;

        clientEvent.dispatchEvent('showFlyReward', constants.REWARD_TYPE.DIAMOND, function() {
            this.reward();
        }, this);
    },

    reward() {
        playerData.addDiamond(10);

        clientEvent.dispatchEvent('updateDiamond');

        this.onBtnCloseClick();
    },

    // update (dt) {},
});