// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html

const playerData = require('playerData');
const resourceUtil = require('resourceUtil');
const utils = require('utils');
const formula = require('formula');
const clientEvent = require('clientEvent');
const gameLogic = require('gameLogic');
const constants = require('constants');
const i18n = require('LanguageData');

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

        btnBuy: cc.Button,
        // lbName: cc.Label,
        lbCost: cc.Label,
        spIcon: cc.Sprite,
        spBg: cc.Sprite,

        spUnit: cc.Sprite,

        imgGold: cc.SpriteFrame,
        imgDiamond: cc.SpriteFrame,

        nodeBtnFree: cc.Node,

        imgGray: cc.SpriteFrame,
        imgNormal: cc.SpriteFrame,

        lbLevel: cc.Label,
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},
    ctor () {
        this.isCanBuy = false;
        this.isUnlock = false;
        this.isFree = false;
    },

    start () {
        
    },

    onEnable () {
        clientEvent.on('updateBuyTimes', this.updatePrice, this);
        clientEvent.on('updateGold', this.updateBuyBtn, this);
        clientEvent.on('updateDiamond', this.updateBuyBtn, this);
        clientEvent.on('updateFreeCake', this.updateFreeCake, this);
    },

    onDisable () {
        clientEvent.off('updateBuyTimes', this.updatePrice, this);
        clientEvent.off('updateGold', this.updateBuyBtn, this);
        clientEvent.off('updateDiamond', this.updateBuyBtn, this);
        clientEvent.off('updateFreeCake', this.updateFreeCake, this);
    },

    onBtnBuyClick () {
        cc.gameSpace.audioManager.playSound('click', false);

        if (this.isCanBuy) {
            let isEnough = playerData.getGold() >= this.costMoney;
            if (!isEnough) {

                gameLogic.getOpenRewardType(constants.SHARE_FUNCTION.LACK, (err, type) => {
                    if (type !== constants.OPEN_REWARD_TYPE.NULL) {
                        cc.gameSpace.uiManager.showSharedDialog('dialog/freeGold', 'freeGold', [constants.FREE_GOLD_SOURCE.LACK]);
                    } else {
                        //给予提示
                        cc.gameSpace.showTips(i18n.t("showTips.lackGold"));
                    }
                });
                return;
            }
        }
        

        if (this.itemInfo) {
            let isSucceed = false;
            if (this.isCanBuy) {
                isSucceed = gameLogic.buyCake(this.itemInfo.ID, false);
            } else if (this.isCanUseDiamond) {
                isSucceed = gameLogic.buyCake(this.itemInfo.ID, true);
            }
            
            if (isSucceed) {
                cc.gameSpace.audioManager.playSound('buyCake', false);
            }
        }
    },

    show (parent, index, content) {
        this.parent = parent;
        this.content = content;
        this.index = index;
    
        this.setInfo(content);
    },

    /**
     * 设置商品信息
     * @param {Object} itemInfo 
     */
    setInfo (itemInfo) {
        this.itemInfo = itemInfo;
        this.itemInfo.ID = this.itemInfo.ID.toString();

        // this.lbName.string = this.itemInfo.name;
        let itemLevel = Number(this.itemInfo.ID);
        this.lbLevel.string = itemLevel;
        let unlockLevel = playerData.getUnlockLevel();
        // switch (itemLevel) {
        //     case 1:
        //         this.isCanBuy = true;
        //         break;
        //     case 2:
        //         this.isCanBuy = unlockLevel >= 4;
        //         break;
        //     case 3:
        //         this.isCanBuy = unlockLevel >= 5;
        //         break;
        //     case 4:
        //         this.isCanBuy = unlockLevel >= 7;
        //         break;
        //     default:
        //         this.isCanBuy = unlockLevel - itemLevel >= 4;
        //         break;
        // }

        this.isCanBuy = playerData.getUnlockLevel() - itemLevel >= 4 || itemLevel === 1; //第1级是可以购买的
        this.isUnlock = playerData.getUnlockLevel() >= itemLevel;
        if (this.isUnlock && !this.isCanBuy) {
            this.isCanUseDiamond = unlockLevel - itemLevel >= 2;
        } else {
            this.isCanUseDiamond = false;
        }
        
        //根据情况设置金币或者钻石图标
        if (this.isCanBuy) {
            this.spUnit.spriteFrame = this.imgGold;
        } else if (this.isCanUseDiamond) {
            this.spUnit.spriteFrame = this.imgDiamond;
        }

        if (this.isUnlock) {
            resourceUtil.setCakeIcon(this.itemInfo.img, this.spIcon, ()=>{

            });
        } else {
            resourceUtil.setCakeIcon("unknown", this.spIcon, ()=>{

            });
        }

        if (this.isCanBuy || this.isCanUseDiamond) {
            this.updatePrice(this.itemInfo.ID);
        } else {
            this.lbCost.string = '????';
            let color = cc.Color.BLACK;
            color.fromHEX("#6F8FDF");
            this.lbCost.node.color = color;
            this.btnBuy.interactable = false;
            this.spBg.spriteFrame= this.imgGray;
        }
        
        this.refreshFreeButton();
    },

    /**
     * 更新价格信息
     * @param {Number} itemId 
     */
    updatePrice (itemId) {
        if (this.itemInfo.ID === itemId) {
            if (this.isCanBuy) {
                //检查钱够不够,并且将钱进行消耗
                let buyTimes = playerData.getBuyTimesByItemId(itemId, false);
                let costMoney = 0;
                if (this.itemInfo.ID !== constants.BASE_CAKE_ID) {
                    costMoney = formula.getCakeBuyingPrice(this.itemInfo.buyingPrice, buyTimes);
                } else {
                    costMoney = formula.getBaseCakeBuyingPrice(this.itemInfo.buyingPrice, buyTimes);
                }
            
                this.lbCost.string = utils.formatMoney(costMoney);

                this.costMoney = costMoney;
                this.updateBuyBtn();
            } else if (this.isCanUseDiamond) {
                let buyTimes = playerData.getBuyTimesByItemId(itemId, true);
                let costMoney = formula.getCakeDiamondPrice(this.itemInfo.diamonds, buyTimes);
            
                this.lbCost.string = utils.formatMoney(costMoney);

                this.costMoney = costMoney;
                this.updateBuyBtn();
            }
        }
    },

    updateBuyBtn () {
        let isEnough = false;
        let color = cc.Color.BLACK;
        color.fromHEX("#FFFFFF");

        let disableColor = cc.Color.BLACK;
        disableColor.fromHEX("#FF3030");
        if (this.isCanBuy) {
            if (this.isUnlock) {
                isEnough = playerData.getGold() >= this.costMoney;

                if (!isEnough) {
                    this.spBg.spriteFrame = this.imgGray;
                    this.lbCost.node.color = disableColor;
                } else {
                    this.spBg.spriteFrame = this.imgNormal;
                    this.lbCost.node.color = color;
                }

                
                this.btnBuy.interactable = true;
            } else {
                this.btnBuy.interactable = false;
                this.spBg.spriteFrame = this.imgGray;
            }
        } else if (this.isCanUseDiamond) {
            isEnough = this.isUnlock && playerData.getDiamond() >= this.costMoney;
            if (!isEnough) {
                this.spBg.spriteFrame = this.imgGray;
                this.lbCost.node.color = disableColor;
            } else {
                this.spBg.spriteFrame = this.imgNormal;
                this.lbCost.node.color = color;
            }
            this.btnBuy.interactable = isEnough;
        }
    },

    updateFreeCake (itemId) {
        if (this.itemInfo.ID === itemId) {
            this.isFree = true;
            this.refreshFreeButton();
        }
    },

    refreshFreeButton () {
        if (this.isFree) {
            this.spBg.spriteFrame = this.imgNormal;
        }
        
        this.nodeBtnFree.active = this.isFree;
    },

    onBtnFreeClick () {
        if (!playerData.hasPosAtWorkbench()) {
            cc.gameSpace.showTips(i18n.t('showTips.noVacantSeat'));
            return false;
        }

        //免费蛋糕现在不需要分享，可直接获得
        this.reward();
        
    },

    reward () {
        let isSucceed = gameLogic.buyCakeFree(this.itemInfo.ID);
        if (isSucceed) {
            this.isFree = false;
            this.refreshFreeButton();
        }
    },

    // update (dt) {},
});
