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
const utils = require('utils');
const clientEvent = require('clientEvent');
const gameLogic = require('gameLogic');
const playerData = require('playerData');
const constants = require('constants');
const i18n = require('LanguageData');
const resourceUtil = require('resourceUtil');

const TAG_GOLD_ACTION = 10000;
const TAG_DIAMOND_ACTION = 10001;

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

        arrRewardNode: [cc.Node],

        pfRewardItem: cc.Prefab,

        nodeTurnable: cc.Node, //转盘用来旋转的

        aniLightGroup: cc.Animation, //高亮效果

        lbNormalTickets: cc.Label, //普通抽奖

        lbMoreTickets: cc.Label, //更多抽奖

        lbGold: cc.Label,
        lbDiamond: cc.Label,
        nodeGoldIcon: cc.Node,
        nodeDiamondIcon: cc.Node,

        imgTicket: cc.SpriteFrame, //奖券图标

        ndBtnNormal: cc.Node, //普通抽奖按钮
        ndBtnMoreTickets: cc.Node, //更多奖券按钮
        ndNormalTicketsDesc: cc.Node, //普通奖券次数说明
        ndMoreTicketsDesc: cc.Node, //更多奖券次数说明
        ndBtnClose: cc.Node, //关闭按钮
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},
    ctor() {
        this.dictReward = {};
        this.arrRewardData = [];
        this.waitingCakeId = null;
    },

    start() {
        if (cc.gameSpace.isIphoneX) {
            let offsetY = 100;

            this.node.getChildByName('topMenu').getComponent(cc.Widget).top += offsetY / 2;
        }
    },

    onEnable() {
        clientEvent.on('updateGold', this.updatePlayerGold, this);
        clientEvent.on('updateDiamond', this.updatePlayerGold, this);
        clientEvent.on('receiveGold', this.receiveGold, this);
        clientEvent.on('receiveDiamond', this.receiveDiamond, this);
    },

    onDisable() {
        clientEvent.off('updateGold', this.updatePlayerGold, this);
        clientEvent.off('updateDiamond', this.updatePlayerGold, this);
        clientEvent.off('receiveGold', this.receiveGold, this);
        clientEvent.off('receiveDiamond', this.receiveDiamond, this);
    },

    show() {
        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.LOTTERY_SHOW, {});

        gameLogic.pauseScene();
        //初始化节点
        this.initReward();
        //初始化领取次数
        this.initInfo();

        this.checkButton();

        resourceUtil.updateNodeRenderers(this.node);
    },

    initReward() {
        if (this.arrRewardData.length <= 0) {
            let dictLotteryData = localConfig.getTable('lottery');
            this.arrRewardData = utils.objectToArray(dictLotteryData);
        }

        this.arrProbability = [];
        let start = 0;
        for (let idx = 0; idx < this.arrRewardNode.length; idx++) {
            let parentNode = this.arrRewardNode[idx];
            let rewardItem = this.dictReward[idx];
            if (!this.dictReward.hasOwnProperty(idx)) {
                rewardItem = cc.instantiate(this.pfRewardItem);
                rewardItem.parent = parentNode;
                this.dictReward[idx] = rewardItem;
            }

            if (this.arrRewardData.length > idx) {
                let info = this.arrRewardData[idx];

                let script = rewardItem.getComponent('lotteryItem');
                script.setInfo(this, info);

                let min = start;
                let max = start + info.probability;
                this.arrProbability.push({ min: min, max: max, idx: idx });

                start = max;
            }
        }
    },

    initInfo() {
        this.spareTimes = playerData.getLotterySpareTimes(false);
        this.lbNormalTickets.string = 'x' + this.spareTimes;

        this.moreSpareTimes = playerData.getLotterySpareTimes(true);
        this.lbMoreTickets.string = this.moreSpareTimes;

        this.updatePlayerGold();
    },

    updatePlayerGold() {
        this.lbGold.string = utils.formatMoney(playerData.getGold());
        this.lbDiamond.string = playerData.getDiamond();
    },

    checkButton() {
        this.spareTimes = playerData.getLotterySpareTimes(false);
        this.moreSpareTimes = playerData.getLotterySpareTimes(true);

        this.ndMoreTicketsDesc.active = false;

        if (this.spareTimes > 0) {
            this.ndBtnNormal.active = true;
            this.ndBtnMoreTickets.active = false;
            this.ndBtnNormal.getComponent('buttonEx').interactable = true;
        } else {

            this.ndBtnNormal.getComponent('buttonEx').interactable = false;
            // this.ndNormalTicketsDesc.active = false;
            // gameLogic.getOpenRewardType(constants.SHARE_FUNCTION.LOTTERY, (err, type) => {
            //     this.openRewardType = type;
            //     if (type !== constants.OPEN_REWARD_TYPE.NULL) {
            //         this.ndBtnNormal.active = false;
            //         this.ndBtnMoreTickets.active = true;
            //         this.ndBtnMoreTickets.getComponent('buttonEx').interactable = true;
            //     } else {
            //         this.ndBtnNormal.active = true;
            //         this.ndBtnMoreTickets.active = false;
            //         this.ndBtnNormal.getComponent('buttonEx').interactable = false;
            //         resourceUtil.setGray(this.ndBtnNormal, true);
            //         this.ndMoreTicketsDesc.active = false;
            //     }
            // });

            // if (this.moreSpareTimes <= 0) {
            //     this.ndMoreTicketsDesc.active = false;
            //     this.ndBtnMoreTickets.getComponent('buttonEx').interactable = false;
            //     resourceUtil.setGray(this.ndBtnMoreTickets, true);
            // }
        }

    },

    onBtnNormalClick() {
        //开始抽奖
        this.showSelectUI(this.ndBtnNormal, this.lbNormalTickets, false);
    },

    /**
     * 显示抽奖状态
     * @param {object} node 
     * @param {object} label 
     * @param {boolean} isMore 
     */
    showSelectUI(node, label, isMore) {
        this.isBtnStartShow = true;
        //按钮置为不可用
        node.getComponent('buttonEx').interactable = false;
        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.LOTTERY, {});

        //初始化选中效果
        for (let idx in this.dictReward) {
            let itemNode = this.dictReward[idx];
            itemNode.getComponent('lotteryItem').setSelect(false);
        }

        //增加抽奖次数
        playerData.addLotteryTimes(isMore);
        //刷新主界面红点
        clientEvent.dispatchEvent('updateLotteryTimes');
        //刷新剩余次数
        //this.lbNormalTickets.string = 'x' + playerData.getLotterySpareTimes(false);

        if (isMore) {
            label.string = playerData.getLotterySpareTimes(isMore);
        } else {
            label.string = 'x' + playerData.getLotterySpareTimes(isMore);
        }

        //随机抽奖结果
        this.randValue = this.getRandValue();

        this.aniLightGroup.play();

        //开始旋转
        this.startRun();
    },

    startRun() {
        this.ndBtnClose.getComponent('buttonEx').interactable = false;

        //先开始第一轮，根据当前度数，将其旋转至360度
        let targetRotation = 360;
        this.nodeTurnable.rotation = this.nodeTurnable.rotation % 360;
        let offset = 360 - this.nodeTurnable.rotation;
        // arrActions.push(cc.rotateTo(offset/360, targetRotation));

        let randTimes = 3 + Math.floor(Math.random() * 4);
        let rotationAction = cc.rotateTo(offset / 360 + randTimes * 0.5, targetRotation + randTimes * 360 + 360 - this.randValue * 36).easing(cc.easeCircleActionOut());
        let seqAction = cc.sequence(rotationAction, cc.callFunc(function() {
            this.showReward();
        }, this));

        this.nodeTurnable.runAction(seqAction);

        //随机看要转几圈
        // let speed = 1;

        // for (let idx = 0; idx < randTimes.length; idx++) {
        //     targetRotation += 360;
        //     if (idx < Math.floor(randTimes.length / 2)) {
        //         //先快速转起来
        //         speed -= 0.2;
        //     } else {
        //         //在慢慢放缓
        //         speed += 0.2;
        //     }

        //     arrActions.push(cc.rotateTo(speed, targetRotation0));
        // }
    },

    showReward() {
        this.aniLightGroup.stop();

        let itemNode = this.dictReward[this.randValue];
        let lotteryItem = itemNode.getComponent('lotteryItem');
        lotteryItem.setSelect(true);
        lotteryItem.showReward((err, dataObj) => {
            if (err === 'cakeFull') {
                //没有多余的位置放蛋糕了
                cc.gameSpace.showTips(i18n.t('showTips.noVacantSeat'));

                //显示领取按钮，等待领取
                //this.nodeBtnGet.active = true;

                //并且将蛋糕数据存储下来
                this.waitingCakeId = dataObj;
            }
        });
        this.checkButton();
    },

    getRandValue() {
        let idxRand = -1;
        let rand = Math.floor(Math.random() * 100);
        for (let idx = 0; idx < this.arrProbability.length; idx++) {
            let probability = this.arrProbability[idx];

            if (rand >= probability.min && rand < probability.max) {
                idxRand = probability.idx;
                break;
            }
        }

        if (idxRand !== -1) {
            return idxRand;
        }

        return this.getRandValue();
    },

    // onBtnGetRewardClick () {
    //     cc.gameSpace.audioManager.playSound('click', false);

    //     // this.showReward();

    //     // if (!playerData.hasPosAtWorkbench()) {
    //     //     cc.gameSpace.showTips('没有空余的位置啦!');
    //     //     return;
    //     // }

    //     // //奖励蛋糕
    //     // let ret = gameLogic.buyCakeFree(this.waitingCakeId);

    //     let itemNode = this.dictReward[this.randValue];
    //     let lotteryItem = itemNode.getComponent('lotteryItem');
    //     lotteryItem.setSelect(true);
    //     lotteryItem.showReward((err, dataObj)=>{
    //         if (err === 'cakeFull') {
    //             //没有多余的位置放蛋糕了
    //             cc.gameSpace.showTips(i18n.t('showTips.noVacantSeat'));
    //         } else {
    //             this.nodeBtnGet.active = false;
    //         }
    //     });
    // },

    onBtnMoreClick() {
        //cc.gameSpace.audioManager.playSound('click', false);
        if (this.openRewardType === constants.OPEN_REWARD_TYPE.SHARE) {
            this.showShare();
        } else {
            this.showAd();
        }
    },

    /**
     * 显示广告
     */
    showAd() {
        if (this.isLoadingAd) {
            cc.gameSpace.showTips(i18n.t('showTips.waitLForoadingAds'));
            return;
        }

        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.MORE_TICKET_AD_CLICK, {});

        this.isLoadingAd = true;
        this.scheduleOnce(this.resetAdSwitch, 5);

        let adType = 0;
        gameLogic.watchAd(constants.SHARE_FUNCTION.LOTTERY, constants.WATCH_AD_MAX_TIMES.LOTTERY, adType, (err, isOver) => {
            this.isLoadingAd = false;
            this.unschedule(this.resetAdSwitch);

            if (!err && isOver) {
                gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.MORE_TICKET_AD_SUCCESS, {});
                this.showTicketReward();
                this.showSelectUI(this.ndBtnMoreTickets, this.lbMoreTickets, true);
            } else if (err) {
                if (gameLogic.isShareOpen()) {
                    this.showShare();
                }
            }
        });
    },

    resetAdSwitch() {
        this.isLoadingAd = false;
    },

    /**
     * 显示分享
     */
    showShare() {
        // cc.gameSpace.audioManager.playSound('click', false);

        this.showSelectUI(this.ndBtnMoreTickets, this.lbMoreTickets, true);
    },

    // showTicketReward () {
    //     playerData.addLotteryTimes(true);
    //     playerData.addLotteryTimes(false, -1); //给抽奖增加次数
    //     clientEvent.dispatchEvent('updateLotteryTimes');

    //     clientEvent.dispatchEvent('showItemReward',  this.imgTicket, cc.v2(cc.winSize.width / 2, cc.winSize.height / 2), ()=>{
    //         this.initInfo();
    //     }, this);

    //     this.checkButton();
    // },

    onBtnCloseClick() {
        cc.gameSpace.audioManager.playSound('click', false);
        // this.settlement();
        // clientEvent.dispatchEvent('activeScene', true);
        gameLogic.resumeScene();
        clientEvent.dispatchEvent('checkIsAccelerate');
        clientEvent.dispatchEvent('checkIsCombineAuto');
        cc.gameSpace.uiManager.hideSharedDialog('lottery/lottery');
    },

    receiveGold() {
        this.nodeGoldIcon.setScale(1);
        this.nodeGoldIcon.stopActionByTag(TAG_GOLD_ACTION);

        let scaleAction = cc.scaleTo(0.2, 1.3);
        let scaleBackAction = cc.scaleTo(0.2, 1);
        let seqAction = cc.sequence(scaleAction, scaleBackAction);
        seqAction.setTag(TAG_GOLD_ACTION);

        this.nodeGoldIcon.runAction(seqAction);
    },

    receiveDiamond() {
        this.nodeDiamondIcon.setScale(1);
        this.nodeDiamondIcon.stopActionByTag(TAG_DIAMOND_ACTION);

        let scaleAction = cc.scaleTo(0.2, 1.3);
        let scaleBackAction = cc.scaleTo(0.2, 1);
        let seqAction = cc.sequence(scaleAction, scaleBackAction);
        seqAction.setTag(TAG_DIAMOND_ACTION);

        this.nodeDiamondIcon.runAction(seqAction);
    },

    onBtnAddDiamondClick() {
        cc.gameSpace.audioManager.playSound('click', false);
        cc.gameSpace.showTips(i18n.t('showTips.noChargePleaseWait'));
    },

    // settlement () {
    //     let endTime = playerData.getCurrentTime();
    //     let offsetTime = Math.floor((endTime - this.startTime) / 1000);
    //     let doubleTime = playerData.getAccelerateTime();

    //     //双倍时间调整，旧的先扣除掉，新的统一加上
    //     let doubleSpareTime = doubleTime - offsetTime;
    //     doubleSpareTime = doubleSpareTime > 0 ? doubleSpareTime : 0;
    //     let costTime = doubleTime - doubleSpareTime;
    //     doubleSpareTime += playerData.getLotteryAccelerateTime();
    //     playerData.saveAccelerateTime(doubleSpareTime);
    //     playerData.saveLotteryAccelerateTime(0);

    //     //将暂停所消耗的金币加上
    //     var currentMakeMoneySpeed = playerData.getMakeMoneySpeed();  //当前赚钱速度

    //     let addGold = offsetTime * currentMakeMoneySpeed;
    //     if (addGold <= 0) {
    //         return false;
    //     }

    //     if (costTime > 0) {
    //         addGold += costTime * currentMakeMoneySpeed;
    //     }

    //     playerData.addGold(addGold);

    //     clientEvent.dispatchEvent('updateGold');

    //     return true;
    // },
    // update (dt) {},
});