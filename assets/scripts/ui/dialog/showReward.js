// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html
const constants = require('constants');
const clientEvent = require('clientEvent');
const gameLogic = require('gameLogic');
const playerData = require('playerData');
const utils = require('utils');
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

        imgGold: cc.SpriteFrame,
        imgDiamond: cc.SpriteFrame,

        spItem: cc.Sprite,
        lbAmount: cc.Label,

        nodeBtnDouble: cc.Node,
        nodeBtnNormal: cc.Node,
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start() {

    },

    /**
     * 设置奖励信息
     * @param {String} funStr 来源于哪个功能 
     * @param {Number} rewardType 
     * @param {Number} amount 
     * @param {Boolean} hasDouble 
     */
    show(funStr, rewardType, amount, hasDouble, callback) {
        this.funStr = funStr;
        this.rewardType = rewardType;
        this.amount = amount;
        this.callback = callback;
        switch (rewardType) {
            case constants.REWARD_TYPE.GOLD:
                this.spItem.spriteFrame = this.imgGold;
                break;
            case constants.REWARD_TYPE.DIAMOND:
                this.spItem.spriteFrame = this.imgDiamond;
                break;
        }

        this.lbAmount.string = '+' + utils.formatMoney(this.amount);

        this.nodeBtnNormal.active = false;

        this.hasDouble = hasDouble;
        if (hasDouble) {
            gameLogic.getOpenRewardType(funStr, (err, type) => {
                this.getDoubleType = type;
                switch (type) {
                    case constants.OPEN_REWARD_TYPE.AD:
                        this.nodeBtnDouble.active = true;
                        break;
                    case constants.OPEN_REWARD_TYPE.SHARE:
                        this.nodeBtnDouble.active = true;
                        break;
                    case constants.OPEN_REWARD_TYPE.NULL:
                        this.nodeBtnDouble.active = false;
                        this.nodeBtnNormal.active = true;
                        break;
                }
            });

        } else {
            this.nodeBtnDouble.active = false;
        }

        resourceUtil.updateNodeRenderers(this.node);


        this.scheduleOnce(() => {
            this.nodeBtnNormal.active = true;
        }, constants.OFFSET_TIME);
    },

    onBtnCloseClick() {
        this.close();
    },

    onBtnNormalClick() {
        if (Math.random() <= constants.DISABLE_RATIO && this.getDoubleType !== constants.OPEN_REWARD_TYPE.NULL) return;
        this.showReward();
    },

    onBtnDoubleClick() {
        if (this.getDoubleType === constants.OPEN_REWARD_TYPE.SHARE) {
            this.showReward();
        } else {

            //TODO 广告类型暂时直接传funstr，后续做个映射？
            let adType = this.funStr;
            gameLogic.watchAd(this.funStr, playerData.getAdMaxTimesByFun(this.funStr), adType, (err, isOver) => {
                this.isLoadingAd = false;
                this.unschedule(this.resetAdSwitch);

                if (!err && isOver) {
                    this.amount *= 2;
                    this.showReward();
                } else if (err) {
                    this.onBtnReceiveClick();
                }
            });
        }
    },

    resetAdSwitch() {
        this.isLoadingAd = false;
    },

    showReward() {
        this.close(); //暂时也是直接关闭该界面
        this.reward();
        clientEvent.dispatchEvent('showFlyReward', this.rewardType, function() {}, this);
    },

    reward() {
        if (this.rewardType === constants.REWARD_TYPE.GOLD) {
            gameLogic.addGold(this.amount);
        } else if (this.rewardType === constants.REWARD_TYPE.DIAMOND) {
            gameLogic.addDiamond(this.amount);
        }

        if (this.callback) {
            this.callback();
        }

    },

    close() {
        cc.gameSpace.uiManager.hideSharedDialog('dialog/showReward');
    }

    // update (dt) {},
});