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
const utils = require('utils');
const playerData = require('playerData');
const localConfig = require('localConfig');
const gameLogic = require('gameLogic');
const formula = require('formula');
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

        lbGold: cc.Label,

        nodeLackTips: cc.Node,

        nodeBtnAd: cc.Node,
        nodeBtnShare: cc.Node
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start() {

    },

    /**
     * 设置免费金币来源
     * @param {Number} type 
     */
    show(source) {
        this._source = source;
        this.showInfo();

        if (this._source === constants.FREE_GOLD_SOURCE.LACK) {
            gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.LACK_SHARE_SHOW, {});
        }

        this.checkButton();

        resourceUtil.updateNodeRenderers(this.node);
    },

    showShareBtn() {
        this.nodeBtnAd.active = false;
        this.nodeBtnShare.active = true;

        if (this._source === constants.FREE_GOLD_SOURCE.MAIN_SCENE) {
            gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.FREE_GOLD_SHARE_SHOW, {});
        }
    },

    checkButton() {
        if (this._source === constants.FREE_GOLD_SOURCE.MAIN_SCENE) {
            gameLogic.getOpenRewardType(constants.SHARE_FUNCTION.FREE_GOLD, (err, type) => {
                switch (type) {
                    case constants.OPEN_REWARD_TYPE.AD:
                        this.nodeBtnAd.active = true;
                        this.nodeBtnShare.active = false;
                        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.FREE_GOLD_AD_SHOW, {});
                        break;
                    case constants.OPEN_REWARD_TYPE.SHARE:
                        this.showShareBtn();
                        break;
                    case constants.OPEN_REWARD_TYPE.NULL:
                        this.isCanShare = false;
                        this.nodeBtnAd.active = false;
                        this.nodeBtnShare.active = false;
                        break;
                }
            });
        } else {
            this.showShareBtn();
        }
    },

    showInfo() {
        //在线每5分钟分享可直接获得金币（每秒产出的30倍）
        //免费金币修改为 已解锁金币购买的最高4个蛋糕每秒产出和 的N倍
        let sum = 0;
        let unlockLevel = playerData.getUnlockLevel();
        for (var idx = 0; idx < 4; idx++) {
            let cakeLevel = unlockLevel - 1 - idx;
            if (cakeLevel > 0) {
                let cakeInfo = localConfig.queryByID('cake', cakeLevel.toString());
                if (cakeInfo) {
                    sum += cakeInfo.sellingPrice;
                }
            }
        }

        if (sum === 0) {
            //表示一个都木有，那就是等于基础蛋糕的价格
            let cakeInfo = localConfig.queryByID('cake', constants.BASE_CAKE_ID);
            if (cakeInfo) {
                sum += cakeInfo.sellingPrice;
            }
        }

        this.nodeLackTips.active = false;
        this.money = sum * 20;
        if (this._source === constants.FREE_GOLD_SOURCE.LACK) {
            this.money = sum * (20 + unlockLevel); //金币不足修改为  最高4个蛋糕每秒产出和*(20+解锁蛋糕等级)

            this.nodeLackTips.active = true;
        } else {
            //目前只有金币不足或者免费金币两种情况
            let goldLevel = unlockLevel - 4;
            goldLevel = goldLevel < 1 ? 1 : goldLevel;
            goldLevel = goldLevel.toString();
            let cakeInfo = localConfig.queryByID('cake', goldLevel);
            if (cakeInfo) {
                var buyTimes = playerData.getBuyTimesByItemId(goldLevel, false);
                buyTimes = buyTimes > 16 ? 16 : buyTimes;
                if (goldLevel !== constants.BASE_CAKE_ID) {
                    this.money = formula.getCakeBuyingPrice(cakeInfo.buyingPrice, buyTimes);
                } else {
                    this.money = formula.getBaseCakeBuyingPrice(cakeInfo.buyingPrice, buyTimes);
                }
            }

            this.money *= 2; //最高蛋糕价格的2倍
        }


        // let itemInfo = localConfig.queryByID('cake', unlockLevel.toString());
        // if (itemInfo) {
        //     if (this.money < itemInfo.sellingPrice) {
        //         this.money = itemInfo.sellingPrice;
        //     }
        // }

        // let freeGoldBuff = gameLogic.getBuff(constants.BUFF_TYPE.FREE_GOLD);
        // if (freeGoldBuff) {
        //     this.money += this.money * Number(freeGoldBuff.buff.addValue);
        // }

        let strValue = '+' + utils.formatMoney(this.money);
        this.lbGold.string = strValue;
    },

    onBtnCloseClick() {
        cc.gameSpace.audioManager.playSound('click', false);

        cc.gameSpace.uiManager.hideSharedDialog('dialog/freeGold');
    },

    onBtnShareClick() {
        cc.gameSpace.audioManager.playSound('click', false);

        this.showReward();
    },

    resetAdSwitch() {
        this.isLoadingAd = false;
    },

    onBtnAdClick() {
        cc.gameSpace.audioManager.playSound('click', false);

        this.showReward();
    },

    showReward() {
        this.onBtnCloseClick(); //暂时也是直接关闭该界面

        if (this._source === constants.FREE_GOLD_SOURCE.MAIN_SCENE) {
            let randTime = 150 + Math.ceil(Math.random() * 60); //2.5分钟~3.5分钟
            let nextTime = playerData.getCurrentTime() + randTime * 1000;
            playerData.setSetting(constants.SETTINGS_KEY.FREE_GOLD_NEXT_TIME, nextTime);

            clientEvent.dispatchEvent('getFreeGold');
        }

        clientEvent.dispatchEvent('showFlyReward', constants.REWARD_TYPE.GOLD, function() {
            this.reward();
        }, this);
    },

    reward() {
        playerData.addGold(this.money);

        clientEvent.dispatchEvent('updateGold');

        // cc.gameSpace.audioManager.playSound('sell', false);
    },

    // update (dt) {},
});