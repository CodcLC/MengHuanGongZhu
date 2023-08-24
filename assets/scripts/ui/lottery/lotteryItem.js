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
const playerData = require('playerData');
const localConfig = require('localConfig');
const utils = require('utils');
const resourceUtil = require('resourceUtil');
const clientEvent = require('clientEvent');
const gameLogic = require('gameLogic');
const i18n = require('LanguageData');
const configuration = require('configuration');

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

        spSelect: cc.Sprite,
        lbValue: cc.Label,
        spItem: cc.Sprite,

        imgGold: cc.SpriteFrame,
        imgDiamond: cc.SpriteFrame,
        imgAccelerate: cc.SpriteFrame,
        imgAccelerateEn: cc.SpriteFrame,
        imgCombineAuto: cc.SpriteFrame,
        colorNormal: new cc.Color(),
        colorSelect: new cc.Color()
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {

    },

    setInfo (parent, info) {
        this.rewardType = info.type;
        this._parent = parent;
        let unlockLevel = playerData.getUnlockLevel();

        switch (info.type) {
            case constants.REWARD_TYPE.DIAMOND:
                this.rewardValue = info.amount;
                this.spItem.spriteFrame = this.imgDiamond;
                //由于尺寸不同，导致每一种都需要专门设置对应的大小
                this.spItem.node.width = 88.8;
                this.spItem.node.height = 50.4;  
                this.lbValue.string = this.rewardValue;
                break;
            case constants.REWARD_TYPE.GOLD:
                //金币为 每秒收入 * amount
                let value = playerData.getMakeMoneySpeed();

                let itemInfo = localConfig.queryByID('cake', unlockLevel.toString());
                if (itemInfo) {
                    if (value < itemInfo.sellingPrice) {
                        value = itemInfo.sellingPrice;
                    }
                }

                this.rewardValue = value * info.amount;

                this.spItem.spriteFrame = this.imgGold;
                //由于尺寸不同，导致每一种都需要专门设置对应的大小
                this.spItem.node.width = 93;
                this.spItem.node.height = 62;  

                this.lbValue.string = utils.formatMoney(this.rewardValue);
                break;
            case constants.REWARD_TYPE.CAKE:
                // 解锁蛋糕最高等级。（5%）
                let cakeId = unlockLevel - 4;
                if (info.amount === 1) {
                    //解锁蛋糕最高等级*0.6（向下取整，最小为1）。（15%）
                    cakeId = Math.floor(unlockLevel * 0.6);
                }

                cakeId = cakeId > 1 ? cakeId : 1;

                let cake = localConfig.queryByID('cake', cakeId.toString());
                if (cake) {
                    resourceUtil.setCakeIcon(cake.img, this.spItem, ()=>{

                    });

                    //由于尺寸不同，导致每一种都需要专门设置对应的大小
                    this.spItem.node.width = 100;
                    this.spItem.node.height = 100;  
                }

                this.rewardValue = cakeId;
                this.lbValue.string = 'X1';
                break;
            case constants.REWARD_TYPE.ACCELERATE:
                if (configuration.jsonData.lang === 'en') {
                    this.spItem.spriteFrame = this.imgAccelerateEn;
                }else {
                    this.spItem.spriteFrame = this.imgAccelerate;
                }
                this.rewardValue = info.amount;
                this.lbValue.string = this.rewardValue + i18n.t('lotteryItem.second');

                //由于尺寸不同，导致每一种都需要专门设置对应的大小
                this.spItem.node.width = 77;
                this.spItem.node.height = 77;  
                break;
            case constants.REWARD_TYPE.COMBINE: 
                this.spItem.spriteFrame = this.imgCombineAuto;
                this.rewardValue = info.amount;
                this.lbValue.string = this.rewardValue + i18n.t('lotteryItem.second');
                break;
        }
    },

    setSelect (isSelect) {
        this.spSelect.enabled = isSelect;
        this.lbValue.node.color = isSelect ? this.colorSelect : this.colorNormal;
    },

    showReward (callback) {
        if (this.rewardType === constants.REWARD_TYPE.DIAMOND || this.rewardType === constants.REWARD_TYPE.GOLD) {
            clientEvent.dispatchEvent('showFlyReward', this.rewardType, function(){
                this.reward();
            }, this);
        } else if (this.rewardType === constants.REWARD_TYPE.CAKE) {
            //现在缺乏表现，先直接加数据
            if (!playerData.hasPosAtWorkbench()) {
                callback('cakeFull', this.rewardValue);
                return;
            }

            // this.reward();
            //播放特效，然后奖励
            clientEvent.dispatchEvent('showItemReward',  this.spItem.spriteFrame, this.spItem.node.convertToWorldSpaceAR(cc.v2(0, 0)), ()=>{
                this.reward();
            }, this);

        } else if (this.rewardType === constants.REWARD_TYPE.ACCELERATE) {
            clientEvent.dispatchEvent('showItemReward', this.imgAccelerate, this.spItem.node.convertToWorldSpaceAR(cc.v2(0, 0)), ()=>{
                this.reward();
            }, this);
        } else {
            clientEvent.dispatchEvent('showItemReward', this.imgCombineAuto, this.spItem.node.convertToWorldSpaceAR(cc.v2(0, 0)), ()=>{
                this.reward();
            })
        }

        callback(null);
    },
    
    reward () {
        switch (this.rewardType) {
            case constants.REWARD_TYPE.DIAMOND:
                gameLogic.addDiamond(this.rewardValue);
                break;
            case constants.REWARD_TYPE.GOLD:
                gameLogic.addGold(this.rewardValue);
                break;
            case constants.REWARD_TYPE.CAKE:
                gameLogic.buyCakeFree(this.rewardValue);
                break;
            case constants.REWARD_TYPE.ACCELERATE:
                //统一汇总，后续一起提交
                playerData.saveLotteryAccelerateTime(playerData.getLotteryAccelerateTime() + this.rewardValue); //加速N秒
                break;
            case constants.REWARD_TYPE.COMBINE:
                playerData.saveCombineAutoTime(playerData.getCombineAutoTime() + this.rewardValue); 
        }

        this._parent.ndBtnClose.getComponent('buttonEx').interactable = true;
    },

    // update (dt) {},
});
