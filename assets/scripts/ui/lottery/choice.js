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
        pfChoiceItem: cc.Prefab,

        arrItem: [cc.Node],

        nodeMenu: cc.Node,

        nodeTips: cc.Node,

        ndBtnReceive: cc.Node,
        ndBtnAnotherOne: cc.Node, //按钮再选一个
        ndBtnNormal: cc.Node,
        lbTips: cc.Label
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},
    ctor() {
        this.arrChoiceNode = [];
    },

    start() {

    },

    onEnable() {
        // clientEvent.on('choiceOver', this.choiceOver, this);
    },

    onDisable() {
        // clientEvent.off('choiceOver', this.choiceOver, this);
    },

    show(idxEmptyPos) {
        this.currentSelect = -1;
        this.arrSelect = [];
        this.idxEmptyPos = idxEmptyPos;
        this.lbTips.string = i18n.t('choice.chooseOneGiftFormThree');
        this.showMenu(false);
        this.initReward();

        resourceUtil.updateNodeRenderers(this.node);

        this.ndBtnReceive.active = false;

        this.ndBtnNormal.active = false;
        this.scheduleOnce(() => {
            this.ndBtnNormal.active = true;
        }, constants.OFFSET_TIME);

        gameLogic.getOpenRewardType(constants.SHARE_FUNCTION.CHOICE, (err, type) => {
            this.rewardType = type;

            if (type === constants.OPEN_REWARD_TYPE.NULL) {
                this.ndBtnNormal.active = true;
            }
        });
    },

    initReward() {
        let arrRewardType = [constants.REWARD_TYPE.DIAMOND, constants.REWARD_TYPE.GOLD, constants.REWARD_TYPE.CAKE];
        for (let idx = 0; idx < this.arrItem.length; idx++) {
            let posNode = this.arrItem[idx];
            let randValue = Math.floor(Math.random() * arrRewardType.length);
            let rewardType = arrRewardType[randValue];
            arrRewardType.splice(randValue, 1);

            let choiceNode = this.arrChoiceNode[idx];
            if (this.arrChoiceNode.length <= idx) {
                choiceNode = cc.instantiate(this.pfChoiceItem);
                choiceNode.parent = posNode;
                this.arrChoiceNode.push(choiceNode);
            }

            choiceNode.getComponent('choiceItem').show(idx, rewardType, this.idxEmptyPos, this);
        }
    },

    retry() {
        this.lbTips.string = i18n.t('choice.nowChooseOne');
        // let node = this.arrChoiceNode[this.arrSelect[0]];
        // node.getComponent('choiceItem').select(false);

        for (let idx = 0; idx < this.arrChoiceNode.length; idx++) {
            let choiceNode = this.arrChoiceNode[idx];
            choiceNode.getComponent('choiceItem').setStatus(true);
        }

        this.showMenu(false);
    },

    resetAdSwitch() {
        this.isLoadingAd = false;
    },

    onBtnAnotherOneClick() {
        if (this.rewardType === constants.OPEN_REWARD_TYPE.SHARE) {
            this.showShare();
        } else {
            this.showAd();
        }
    },

    showAd() {
        this.showShare();
    },

    showShare() {
        this.retry();
    },

    onBtnNormalClick() {
        if (Math.random() <= constants.DISABLE_RATIO && this.getDoubleType !== constants.OPEN_REWARD_TYPE.NULL) return;

        // if (this.currentSelect !== -1) {
        //     let node = this.arrChoiceNode[this.currentSelect];
        //     node.getComponent('choiceItem').showReward();

        //     this.showMenu(false);
        // }
        this.receive();

        this.showMenu(false);

        this.choiceOver();

        // this.ndBtnReceive.getComponent(cc.Button)._toScale = cc.v2(1, 1);
        // this.ndBtnReceive.setScale(1);
    },

    receive() {
        let showReward = function(node, objReward) {
            node.getComponent('choiceItem').showReward(objReward);
        };

        for (let idx = 0; idx < this.arrSelect.length; idx++) {
            let currentSelect = this.arrSelect[idx];

            let node = this.arrChoiceNode[currentSelect];
            let choiceItem = node.getComponent('choiceItem');
            //将奖励信息进行存储，避免多个蛋糕引起的问题
            let objReward = { idxEmptyPos: this.idxEmptyPos, rewardType: choiceItem.rewardType, rewardValue: choiceItem.rewardValue };

            setTimeout(showReward.bind(null, node, objReward), idx * 1000);
        }

        this.showMenu(false);

        this.choiceOver();
    },

    onBtnReceiveClick() {
        this.receive();
    },

    choiceOver() {
        cc.gameSpace.uiManager.hideSharedDialog('lottery/choice');
    },

    onBoxOpen(index) {
        // this.currentSelect = index;
        this.arrSelect.push(index);

        for (let idx = 0; idx < this.arrChoiceNode.length; idx++) {
            let choiceNode = this.arrChoiceNode[idx];
            choiceNode.getComponent('choiceItem').setStatus(false);
        }
    },

    showMenu(isShow) {
        this.nodeMenu.active = isShow;

        if (isShow) {
            let sum = 0;
            for (let idx = 0; idx < this.arrChoiceNode.length; idx++) {
                let choiceNode = this.arrChoiceNode[idx];
                if (!choiceNode.getComponent('choiceItem').isOpen) {
                    sum++;
                }
            }
            //如果还有1个以上可以打开
            let isActive = sum > 1;
            if (isActive) {
                gameLogic.getOpenRewardType(constants.SHARE_FUNCTION.CHOICE, (err, type) => {
                    this.rewardType = type;
                    switch (type) {
                        case constants.OPEN_REWARD_TYPE.AD:
                            this.ndBtnAnotherOne.active = true;
                            break;
                        case constants.OPEN_REWARD_TYPE.SHARE:
                            this.ndBtnAnotherOne.active = true;
                            break;
                        case constants.OPEN_REWARD_TYPE.NULL:
                            this.isCanShare = false;
                            this.ndBtnAnotherOne.active = false;
                            break;
                    }
                });
            } else {
                this.ndBtnAnotherOne.active = false;
                this.ndBtnNormal.active = false;
                this.ndBtnReceive.active = true;
            }
        }
    },

    // update (dt) {},
});