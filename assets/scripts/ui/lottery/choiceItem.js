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
const resourceUtil = require('resourceUtil');
const localConfig = require('localConfig');
const clientEvent = require('clientEvent');
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

        nodeReward: cc.Node,

        nodeHalo: cc.Node,
        nodeHaloStar: cc.Node,

        spItem: cc.Sprite,
        lbValue: cc.Label,

        imgGold: cc.SpriteFrame,
        imgDiamond: cc.SpriteFrame
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {
        
    },

    show (index, rewardType, idxEmptyPos, parent) {
        this.index = index;
        this.rewardType = rewardType;
        this.parent = parent;
        this.idxEmptyPos = idxEmptyPos;
        this.isOpen = false;
        this.initInfo();

        if (!this.effectNode) {
            resourceUtil.createEffect('ui/cakeBox/cakeBox', (err, giftNode) => {
                //将礼物丢到 pos位置
                this.effectNode = giftNode;
                giftNode.position = cc.v2(0, 0);
                let cakeBox = giftNode.getComponent('cakeBox');
                cakeBox.setOpenBoxListener(()=>{
                    this.open();
                });

                cakeBox.setTriggerListener(()=>{
                    this.onAniPlayOver();
                });

                cakeBox.playStart();
            }, this.node);
        } else {
            let cakeBox = this.effectNode.getComponent('cakeBox');
            this.nodeReward.active = false;

            cakeBox.playStart();
        }
    },

    initInfo () {
        this.spItem.node.setScale(1);
        let unlockLevel = playerData.getUnlockLevel();
        switch (this.rewardType) {
            case constants.REWARD_TYPE.DIAMOND:
                this.rewardValue = 10;
                this.spItem.spriteFrame = this.imgDiamond;
                this.lbValue.string = '+ ' + this.rewardValue;
                break;
            case constants.REWARD_TYPE.GOLD:
                let sum = 0;
                
                for (var idx = 0; idx < 4; idx++) {
                    let cakeLevel = unlockLevel - 1 - idx;
                    if (cakeLevel > 0) {
                        let cakeInfo = localConfig.queryByID('cake', cakeLevel.toString());
                        if (cakeInfo) {
                            sum += cakeInfo.sellingPrice;
                        }
                    }
                }

                this.spItem.spriteFrame = this.imgGold;
                this.rewardValue = sum;
                this.lbValue.string = '+ ' + utils.formatMoney(this.rewardValue);
                break;
            case constants.REWARD_TYPE.CAKE:
                this.spItem.node.setScale(1.5);
                let cakeId = Math.floor(unlockLevel * 0.7);
                cakeId = cakeId > 1 ? cakeId : 1;
                this.rewardValue = cakeId;

                let cake = localConfig.queryByID('cake', cakeId.toString());
                if (cake) {
                    resourceUtil.setCakeIcon(cake.img, this.spItem, ()=>{

                    });
                }

                this.lbValue.string = '';
                break;
        }

        // this.nodeHalo.active = false;
        // this.nodeHaloStar.active = false;
    },

    onAniPlayOver () {
        this.nodeReward.active = true;
    },

    open () {
        //播放打开动画
        this.isOpen = true;
        let cakeBox = this.effectNode.getComponent('cakeBox');
        cakeBox.btnOpen.interactable = false;
        cakeBox.playOver(()=>{
            this.select(true);
            this.parent.showMenu(true);
        });

        this.parent.onBoxOpen(this.index);
    },

    showReward (objReward) {
        if (objReward.rewardType === constants.REWARD_TYPE.DIAMOND || objReward.rewardType === constants.REWARD_TYPE.GOLD) {
            clientEvent.dispatchEvent('choiceOver', objReward.idxEmptyPos);

            clientEvent.dispatchEvent('showFlyReward', objReward.rewardType, function(){
                this.reward(objReward.idxEmptyPos, objReward.rewardType, objReward.rewardValue);
            }, this);
        } else if (objReward.rewardType === constants.REWARD_TYPE.CAKE) {
            //播放特效，然后奖励
            //获取对应的坐标
            let worldPos = null;
            let currentCanvas = cc.director.getScene().getChildByName('Canvas');
            if (currentCanvas) {
                let mainScene = currentCanvas.getComponent('mainScene');
                if (mainScene) {
                    let node = mainScene.workbench.getCakeNodeForGuide(objReward.idxEmptyPos);
                    if (node) {
                        worldPos = node.convertToWorldSpaceAR(cc.v2(0, 0));
                    }
                }
            }

            clientEvent.dispatchEvent('choiceOver', objReward.idxEmptyPos);

            let _this = this;
            resourceUtil.createEffect('ui/combine/combine', function(err, effect) {
                if (err) {
                    _this.reward(objReward.idxEmptyPos, objReward.rewardType, objReward.rewardValue);
                    return;
                }

                let targetPos = effect.parent.convertToNodeSpaceAR(worldPos);
                targetPos.x -= 2;
                targetPos.y -= 5;

                effect.position = targetPos;
                effect.getChildByName('target').getComponent(cc.Sprite).spriteFrame = _this.spItem.spriteFrame;

                let effectCmp = effect.getComponent('effect');
                effectCmp.setTriggerListener(()=>{
                    _this.reward(objReward.idxEmptyPos, objReward.rewardType, objReward.rewardValue);
                });

                effectCmp.setEndListener(()=>{
                    effect.destroy();
                });

                effectCmp.playAni('combine');

            });

            // clientEvent.dispatchEvent('showItemReward',  this.spItem.spriteFrame, worldPos, ()=>{
            //     this.reward(objReward.idxEmptyPos, objReward.rewardType, objReward.rewardValue);
            // }, this);

        }
    },

    reward (idxEmptyPos, rewardType, rewardValue) {
        switch (rewardType) {
            case constants.REWARD_TYPE.DIAMOND:
                playerData.addDiamond(rewardValue);
                clientEvent.dispatchEvent('updateDiamond');
                if (playerData.workbench[idxEmptyPos] === 'gift') {
                    playerData.addCakeToTargetIndex(idxEmptyPos, null);
                }
                break;
            case constants.REWARD_TYPE.GOLD:
                playerData.addGold(rewardValue);
                clientEvent.dispatchEvent('updateGold');
                if (playerData.workbench[idxEmptyPos] === 'gift') {
                    playerData.addCakeToTargetIndex(idxEmptyPos, null);
                }
                break;
            case constants.REWARD_TYPE.CAKE:
                playerData.addCakeToTargetIndex(idxEmptyPos, rewardValue.toString());
                break;
        }

        clientEvent.dispatchEvent('updateWorkbench', idxEmptyPos);
        // clientEvent.dispatchEvent('choiceOver', idxEmptyPos);
    },

    setStatus (isCanChoice) {
        if (this.isOpen) {
            return;
        }

        let cakeBox = this.effectNode.getComponent('cakeBox');
        cakeBox.btnOpen.interactable = isCanChoice;
        if (!isCanChoice) {
            cakeBox.playAni('cakeBoxStop');
        } else {
            cakeBox.playAni('cakeBoxShow');
        }
    },

    select (isSelect) {
        this.nodeHalo.active = isSelect;
        this.nodeHaloStar.active = isSelect;

    },

    // update (dt) {},
});
