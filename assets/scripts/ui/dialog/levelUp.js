// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html
const localConfig = require('localConfig');
const gameLogic = require('gameLogic');
const resourceUtil = require('resourceUtil');
const playerData = require('playerData');
const clientEvent = require('clientEvent');
const constants = require('constants');
const buttonEx = require('../common/buttonEx');

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

        spCakeOrigin: cc.Sprite,
        spCakeTarget: cc.Sprite,

        lbOrigin: cc.Label,
        lbTarget: cc.Label,

        levelUpEffect: cc.Node,
        exBtnUpdate: buttonEx,
        exBtnNoUpdate: buttonEx,
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start() {

    },

    show(workbenchIdx, currentLevel, targetLevel) {
        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.LEVEL_UP_SHARE_SHOW, { currentLevel: currentLevel });

        this.workbenchIdx = workbenchIdx;
        this.currentLevel = currentLevel;

        let itemInfo = localConfig.queryByID('cake', this.currentLevel);

        if (!itemInfo) {
            //未找到信息，不能判断下一步进化到那一步骤
            this.close();
            return false;
        }

        // if (!itemInfo.next || itemInfo.next === '') {
        //     this.close();
        //     return false;
        // }

        // let nextInfo = localConfig.queryByID('cake', itemInfo.next);

        let nextInfo = localConfig.queryByID('cake', targetLevel);

        if (!nextInfo) {
            this.close();
            return false;
        }

        //this.nextId = itemInfo.next;
        this.nextId = targetLevel;

        this.lbOrigin.string = itemInfo.ID;
        this.lbTarget.string = nextInfo.ID;

        resourceUtil.setCakeIcon(itemInfo.img, this.spCakeOrigin, function() {});
        resourceUtil.setCakeIcon(nextInfo.img, this.spCakeTarget, () => {
            this.levelUpEffect.active = true;
            this.levelUpEffect.getComponent(cc.Animation).play();
        });

        resourceUtil.updateNodeRenderers(this.node);

        this.exBtnNoUpdate.node.active = false;
        this.scheduleOnce(() => {
            this.exBtnNoUpdate.node.active = true;
        }, constants.OFFSET_TIME);

        gameLogic.getOpenRewardType(constants.SHARE_FUNCTION.LEVEL_UP, (err, type) => {
            this.openRewardType = type;

            if (type === constants.OPEN_REWARD_TYPE.NULL) {
                this.exBtnNoUpdate.node.active = true;
            }
        });
    },

    close() {
        cc.gameSpace.uiManager.hideSharedDialog('dialog/levelUp');
    },

    onBtnUpdateClick() {
        gameLogic.getOpenRewardType(constants.SHARE_FUNCTION.LEVEL_UP, (err, type) => {
            this.openRewardType = type;
            switch (type) {
                case constants.OPEN_REWARD_TYPE.AD:
                    this.showAd();
                    gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.BALANCE_AD_SHOW, {});
                    break;
                case constants.OPEN_REWARD_TYPE.SHARE:
                    this.showShare();
                    gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.BALANCE_SHARE_SHOW, {});
                    break;
                case constants.OPEN_REWARD_TYPE.NULL:
                    this.isCanShare = false;
                    this.reward(true);
                    break;
            }
        });
    },

    showShare() {
        this.reward(true);
    },

    showAd() {
        this.showShare(true);
    },

    resetAdSwitch() {
        this.isLoadingAd = false;
    },

    reward(isUpdate) {
        if (isUpdate) {
            playerData.addCakeToTargetIndex(this.workbenchIdx, String(this.nextId));
            clientEvent.dispatchEvent('upgradeCake', this.workbenchIdx, this.currentLevel, this.nextId);
        } else {
            playerData.addCakeToTargetIndex(this.workbenchIdx, String(this.currentLevel));
            clientEvent.dispatchEvent('upgradeCake', this.workbenchIdx, this.currentLevel, this.currentLevel);
        }

        this.close(); //暂时也是直接关闭该界面
    },

    onBtnNoUpdateClick() {
        if (Math.random() <= constants.DISABLE_RATIO && this.openRewardType !== constants.OPEN_REWARD_TYPE.NULL) return;
        this.reward(false);
    }

    // update (dt) {},
});