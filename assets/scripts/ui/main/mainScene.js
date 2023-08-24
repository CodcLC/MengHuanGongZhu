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
const gameLogic = require('gameLogic');
const i18n = require('LanguageData');
const clientEvent = require('clientEvent');
const utils = require('utils');
const constants = require('constants');
const formula = require('formula');
const localConfig = require('localConfig');
const resourceUtil = require('resourceUtil');
const guideLogic = require('guideLogic');
const configuration = require('configuration');

const TAG_GOLD_ACTION = 10000;
const TAG_DIAMOND_ACTION = 10001;
const TAG_PLANE_ACTION = 10002;


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
        nodeGoldIcon: cc.Node,
        nodeDiamondIcon: cc.Node,
        lbGold: cc.Label,
        lbDiamond: cc.Label,
        lbMakeMoney: cc.Label,
        lbBaseCakeCost: cc.Label,
        spCake: cc.Sprite,

        nodeWorkbench: cc.Node,
        nodeCounter: cc.Node,
        nodeRecovery: cc.Node,
        nodeGiftGroup: cc.Node,
        nodeFreeGold: cc.Node,
        nodeBtnGroup: cc.Node,
        nodeBtnBuy: cc.Node,
        nodeBtnTask: cc.Node,
        nodeTaskRedDot: cc.Node,
        nodeInviteRedDot: cc.Node,
        nodeBtnSupport: cc.Node,
        nodeCustomersGroup: cc.Node,
        ndMoreRedDot: cc.Node,
        nodeFeedback: cc.Node,

        nodeCoolTime: cc.Node,
        btnAccelerate: cc.Button,
        lbCoolTime: cc.Label,

        nodeLotteryTips: cc.Node,
        lbLotterySpareTimes: cc.Label,

        sfBlueDot: cc.SpriteFrame, //蓝色图标

        lbCombineAutoTxt: cc.Label, //自动合成时间
        spCombineAuto: cc.Sprite,
        sfCombineAutoOver: cc.SpriteFrame,
        sfCombineAutoStart: cc.SpriteFrame,

        ndBottomAd: cc.Node, //底部广告
    },

    // LIFE-CYCLE CALLBACKS:
    ctor() {
        this.isCombining = false; //是否正在合成中
    },

    onLoad() {
        let winSize = cc.winSize;
        if (winSize.width > winSize.height || (winSize.height / winSize.width) < 1.4) {
            this.node.getComponent(cc.Canvas).fitHeight = true;
        }

        let lang = configuration.jsonData.lang;
        lang === 'en' ? i18n.init('en') : i18n.init('zh');

    },

    start() {
        cc.gameSpace.audioManager.playMusic('background', true);

        this.isLoading = false;
        this.workbench = this.nodeWorkbench.getComponent('workbench');
        this.counter = this.nodeCounter.getComponent('counter');
        this.recovery = this.nodeRecovery.getComponent('recovery');
        this.giftGroup = this.nodeGiftGroup.getComponent('giftGroup');
        this.resizeForIphoneX();
        this.registEvent();

        this.workbench.setMainScene(this);
        this.giftGroup.setMainScene(this);
        this.updateMakeMoney();
        this.updatePlayerInfo();

        if (!this.settlement()) {
            clientEvent.dispatchEvent('balanceOver');
        }

        this.startFreeGoldTimer();
        this.startNationalDayTimer();

        this.checkIsAccelerate();
        this.checkIsCombineAuto(); //检查自动合成时间

        gameLogic.onLogin();

        this.checkSign();
        this.checkActivity();
    },

    registEvent() {
        clientEvent.on('updateWorkbench', this.updateMakeMoney, this);
        clientEvent.on('updateGold', this.updatePlayerGold, this);
        clientEvent.on('updateDiamond', this.updatePlayerDiamond, this);
        clientEvent.on('updateBuyTimes', this.updateBuyTimes, this);
        clientEvent.on('onAppShow', this.onAppShow, this);
        clientEvent.on('getFreeGold', this.startFreeGoldTimer, this);
        clientEvent.on('pickGameFinish', this.startNationalDayTimer, this);
        clientEvent.on('unlockCake', this.updateBuyBtnActive, this);
        clientEvent.on('guideOver', this.guideOver, this);
        clientEvent.on('balanceOver', this.balanceOver, this);
        clientEvent.on('taskFinished', this.updateTask, this);
        clientEvent.on('updateInvitee', this.updateInvitee, this);
        clientEvent.on('receiveGold', this.receiveGold, this);
        clientEvent.on('receiveDiamond', this.receiveDiamond, this);
        clientEvent.on('activeScene', this.setSceneActive, this);
        clientEvent.on('checkIsAccelerate', this.checkIsAccelerate, this);
        clientEvent.on('checkIsCombineAuto', this.checkIsCombineAuto, this);
        clientEvent.on('updateLotteryTimes', this.updateLotteryTimes, this);
        clientEvent.on('languageChange', this.languageChange, this);
        clientEvent.on('updateFreeCake', this.updateBuyBtn, this);
        clientEvent.on('updateGameBarVisible', this.updateGameBarVisible, this);
    },

    onDestroy() {
        clientEvent.off('updateWorkbench', this.updateMakeMoney, this);
        clientEvent.off('updateGold', this.updatePlayerGold, this);
        clientEvent.off('updateDiamond', this.updatePlayerDiamond, this);
        clientEvent.off('updateBuyTimes', this.updateBuyTimes, this);
        clientEvent.off('onAppShow', this.onAppShow, this);
        clientEvent.off('getFreeGold', this.startFreeGoldTimer, this);
        clientEvent.off('pickGameFinish', this.startNationalDayTimer, this);
        clientEvent.off('unlockCake', this.updateBuyBtnActive, this);
        clientEvent.off('guideOver', this.guideOver, this);
        clientEvent.off('balanceOver', this.balanceOver, this);
        clientEvent.off('taskFinished', this.updateTask, this);
        clientEvent.off('updateInvitee', this.updateInvitee, this);
        clientEvent.off('receiveGold', this.receiveGold, this);
        clientEvent.off('receiveDiamond', this.receiveDiamond, this);
        clientEvent.off('activeScene', this.setSceneActive, this);
        clientEvent.off('checkIsAccelerate', this.checkIsAccelerate, this);
        clientEvent.off('checkIsCombineAuto', this.checkIsCombineAuto, this);
        clientEvent.off('updateLotteryTimes', this.updateLotteryTimes, this);
        clientEvent.off('languageChange', this.languageChange, this);
        clientEvent.off('updateFreeCake', this.updateBuyBtn, this);
        clientEvent.off('updateGameBarVisible', this.updateGameBarVisible, this);
    },

    /**
     * 为iphoneX做适配
     */
    resizeForIphoneX() {
        if (cc.gameSpace.isIphoneX) {
            let offsetY = 100;

            // this.nodeBtnGroup.getChildByName('btnMoreGame').getComponent(cc.Widget).bottom += offsetY;
            // this.nodeBtnGroup.getChildByName('btnLottery').getComponent(cc.Widget).bottom += offsetY;
            // this.nodeBtnGroup.getChildByName('btnBuy').getComponent(cc.Widget).bottom += offsetY;
            // this.nodeBtnGroup.getChildByName('btnTask').getComponent(cc.Widget).bottom += offsetY;
            // this.nodeBtnGroup.getChildByName('btnInvite').getComponent(cc.Widget).bottom += offsetY;
            //this.nodeBtnGroup.getChildByName('recovery').getComponent(cc.Widget).bottom += offsetY;
            // this.nodeBtnGroup.getChildByName('btnRank').getComponent(cc.Widget).bottom += offsetY;
            // this.nodeBtnGroup.getChildByName('btnSupport').getComponent(cc.Widget).bottom += offsetY;
            // this.nodeBtnGroup.getChildByName('btnQuestion').getComponent(cc.Widget).bottom += offsetY;
            // this.nodeBtnGroup.getChildByName('btnSetting').getComponent(cc.Widget).bottom += offsetY;
            this.nodeBtnGroup.getComponent(cc.Widget).bottom += offsetY;

            this.node.getChildByName('workbench').getComponent(cc.Widget).bottom += offsetY;
            this.node.getChildByName('counter').getComponent(cc.Widget).bottom += offsetY;
            this.node.getChildByName('customers').getComponent(cc.Widget).bottom += offsetY;

            this.node.getChildByName('topMenu').getComponent(cc.Widget).top += offsetY / 2;
            this.node.getChildByName('bottomMenu').getComponent(cc.Widget).bottom += offsetY;
            this.node.getChildByName('centerMenu').getComponent(cc.Widget).bottom += offsetY;
            // this.nodeFreeGold.getComponent(cc.Widget).bottom += offsetY;
        }
    },

    onBtnBuyClick() {
        if (playerData.nextCakeFree) {
            let isSucceed = gameLogic.buyCakeFree(this.currentOptimalCake);
            if (isSucceed) {
                playerData.nextCakeFree = false;
                this.updateBuyTimes();

                cc.gameSpace.audioManager.playSound('buyCake', false);
            }
            return;
        }

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

        let isSucceed = gameLogic.buyCake(this.currentOptimalCake);
        if (isSucceed) {
            cc.gameSpace.audioManager.playSound('buyCake', false);
        }
    },

    scheduleRedDot() {
        let offsetTime = Date.now() - this.lastShowTime;
        if (offsetTime >= constants.RED_DOT_SHOW_INTERVAL * 60 * 1000) {
            this.ndMoreRedDot.active = true;
            this.startTick = false;
            this.unschedule(this.scheduleRedDot);
        } else {
            this.ndMoreRedDot.active = false;
        }

    },

    onBtnAddDiamondClick() {
        cc.gameSpace.audioManager.playSound('click', false);
        cc.gameSpace.showTips(i18n.t('showTips.noChargePleaseWait'));
    },

    /**
     * 加速按钮
     */
    onBtnAccelerateClick() {
        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.ACCELERATE_BTN_CLICK, {});

        cc.gameSpace.uiManager.showSharedDialog('dialog/celebration', 'celebration', [(err) => {
            if (!err) {
                this.checkIsAccelerate();
            }
        }]);
    },

    // accelerate () {
    //     //设置剩余时间
    //     playerData.saveAccelerateTime(120);

    //     this.checkIsAccelerate();
    // },

    checkIsAccelerate() {
        let spareTime = playerData.getAccelerateTime();
        if (!spareTime || spareTime <= 0) {
            this.btnAccelerate.node.active = false;
            this.nodeCoolTime.active = false;

            gameLogic.getOpenRewardType(constants.SHARE_FUNCTION.ACCELERATE, (err, type) => {
                this.btnAccelerate.node.active = type !== constants.OPEN_REWARD_TYPE.NULL;
            });

            if (cc.gameSpace.TIME_SCALE > 1) {
                //证明刚刚还处于加速状态，直接进入结束
                this.unschedule(this.scheduleAccelerate);
                this.accelerateOver();
            }
            return;
        }

        cc.gameSpace.audioManager.stop('background');
        cc.gameSpace.audioManager.playMusic('accelerate', true);

        this.accelerateStartTime = Date.now();
        this.lbCoolTime.string = utils.formatTimeForSecond(spareTime);
        this.btnAccelerate.node.active = false;
        this.nodeCoolTime.active = true;
        this.lbCoolTime.node.active = true;
        cc.gameSpace.TIME_SCALE = 2;
        clientEvent.dispatchEvent('updateSpeed');
        this.updateMakeMoney();

        if (this.dropCoin && cc.isValid(this.dropCoin)) {
            this.dropCoin.active = true;
        } else {
            resourceUtil.createEffect('ui/dropCoin/dropCoin', (err, node) => {
                this.dropCoin = node;
            }, this.node);
        }

        this.counter.showAccEffect(true);

        this.schedule(this.scheduleAccelerate, 0.2);
    },

    updatePlayerInfo() {
        this.updatePlayerGold();
        this.updatePlayerDiamond();
        this.updateBuyBtnActive();
        this.updateBuyTimes();
        this.updateBuyBtn();
        this.updateTask();
        this.updateInvitee();
        this.updateLotteryTimes();
    },

    updateBuyBtnActive() {
        //现在修改为最优方案购买，后续会两个按钮并存
        this.nodeBtnBuy.active = true;
    },

    updatePlayerGold() {
        this.lbGold.string = utils.formatMoney(playerData.getGold());

        this.updateBuyBtn();
    },

    updatePlayerDiamond() {
        this.lbDiamond.string = playerData.getDiamond();
    },

    updateBuyTimes() {
        // if (itemId !== constants.BASE_CAKE_ID) {
        //     return;
        // }

        // if (!this.nodeBtnBuy.active) {
        //     return;
        // }

        let itemId = gameLogic.getOptimalCake();

        var itemInfo = localConfig.queryByID('cake', itemId);
        if (!itemInfo) {
            return;
        }

        //检查钱够不够,并且将钱进行消耗
        let buyTimes = playerData.getBuyTimesByItemId(itemId, false);
        let costMoney = 0;
        if (itemId.toString() !== constants.BASE_CAKE_ID) {
            costMoney = formula.getCakeBuyingPrice(itemInfo.buyingPrice, buyTimes);
        } else {
            costMoney = formula.getBaseCakeBuyingPrice(itemInfo.buyingPrice, buyTimes);
        }

        this.lbBaseCakeCost.string = utils.formatMoney(costMoney);

        resourceUtil.setCakeIcon(itemInfo.img, this.spCake, () => {

        });

        this.currentOptimalCake = itemId;
        this.costMoney = costMoney;

        this.updateBuyBtn();
    },

    updateBuyBtn() {
        if (!this.nodeBtnBuy.active) {
            return;
        }

        let isEnough = playerData.getGold() >= this.costMoney;
        if (playerData.nextCakeFree) {
            isEnough = true;
            this.lbBaseCakeCost.string = i18n.t("main.free");
        }

        // this.nodeBtnBuy.getComponent(cc.Button).interactable = isEnough;

        if (isEnough) {
            this.lbBaseCakeCost.node.color = cc.Color.WHITE;
        } else {
            this.lbBaseCakeCost.node.color = cc.Color.RED;
        }

    },

    /**
     * 更新赚钱速度
     */
    updateMakeMoney() {
        let currentMakeMoneySpeed = playerData.getMakeMoneySpeed();
        currentMakeMoneySpeed *= cc.gameSpace.TIME_SCALE;
        this.lbMakeMoney.string = i18n.t('main.%{value}/s', { value: utils.formatMoney(currentMakeMoneySpeed) });
    },

    languageChange() {
        this.updateMakeMoney();
    },

    updateLotteryTimes() {
        cc.gameSpace.gameLogic.getOpenRewardType(constants.SHARE_FUNCTION.LOTTERY, (err, type) => {
            if (!err) {
                this.rewardType = type;
            }
        })

        let spareTime = playerData.getLotterySpareTimes(false);
        // let spareMoreTime = playerData.getLotterySpareTimes(true);

        //this.nodeLotteryTips.active = spareTime > 0 || spareMoreTime > 0;
        this.lbLotterySpareTimes.string = spareTime;

        let nodeBtnLottery = this.nodeLotteryTips.parent;
        let ani = nodeBtnLottery.getComponent(cc.Animation);
        if (spareTime > 0) {
            this.nodeLotteryTips.active = true;
            if (spareTime <= 0) { //用完普通领取
                // if (this.rewardType !== constants.OPEN_REWARD_TYPE.NULL) {
                //     this.lbLotterySpareTimes.string = spareMoreTime;
                //     this.nodeLotteryTips.getComponent(cc.Sprite).spriteFrame = this.sfBlueDot;
                //     ani.play();
                // } else {
                this.nodeLotteryTips.active = false;
                ani.stop();
                nodeBtnLottery.getChildByName('bg').rotation = 0;
                nodeBtnLottery.getChildByName('lottery').rotation = 0;
                // }
            } else {
                ani.play();
            }
        } else {
            this.nodeLotteryTips.active = false;
            ani.stop();
            nodeBtnLottery.getChildByName('bg').rotation = 0;
            nodeBtnLottery.getChildByName('lottery').rotation = 0;
        }
    },

    /**
     * 结算 由上次结算时间与当前时间计算出最后获得值
     */
    settlement() {
        var currentMakeMoneySpeed = playerData.getMakeMoneySpeed(); //当前赚钱速度
        var lastAddTime = playerData.getLastAddTime();

        if (!lastAddTime) {
            //不需要做结算
            return false;
        }

        var diffTime = Math.ceil((playerData.getCurrentTime() - lastAddTime) / 1000);

        if (diffTime <= 60) { //小于60秒不做结算
            return false;
        }

        if (diffTime > 14400) { //当时间超过4个小时，以4个小时为标准
            diffTime = 14400;
        }

        let addGold = diffTime * currentMakeMoneySpeed;
        if (addGold <= 0) {
            return false;
        }

        playerData.addGold(addGold);

        //弹结算窗口
        // if (this.balanceNode && cc.isValid(this.balanceNode)) {
        //     this.balanceNode.active = true;
        //     let balance = this.balanceNode.getComponent('balance');
        //     balance.setBalance(addGold);
        // } else {
        //     resourceUtil.createUI('balance/balance', (err, balanceNode) => {
        //         this.balanceNode = balanceNode;
        //         this.balanceNode.zIndex = constants.ZORDER.DIALOG;
        //         let balance = this.balanceNode.getComponent('balance');
        //         balance.setBalance(addGold);
        //     });    
        // }


        cc.gameSpace.uiManager.pushToPopupSeq('balance/balance', 'balance', [addGold]);

        clientEvent.dispatchEvent('updateGold');

        return true;
    },

    onAppShow() {
        this.settlement();
    },

    onBtnRankClick() {

        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.RANK_BTN_CLICK, {});

        // if (this.isLoading) {
        //     return;
        // }

        // if (this.rankNode && cc.isValid(this.rankNode)) {
        //     this.rankNode.destroy();
        //     this.rankNode = null;
        // }

        // this.isLoading = true;
        // resourceUtil.createUI('rank/rank', (err, node)=> {
        //     this.rankNode = node;
        //     this.rankNode.zIndex = constants.ZORDER.DIALOG;
        //     this.isLoading = false;
        // }, this.node);

        // cc.gameSpace.uiManager.showSharedDialog('rank/rank', 'rank', []);

        cc.gameSpace.showTips(i18n.t('showTips.notRank'));
    },

    onBtnLotteryClick() {

        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.LOTTERY_BTN_CLICK, {});

        cc.gameSpace.uiManager.showSharedDialog('lottery/lottery', 'lottery', []);
    },

    onBtnSettingClick() {
        // cc.gameSpace.showTips('暂未开放,敬请期待！');

        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.SETTING_CLICK, {});

        cc.gameSpace.uiManager.showSharedDialog('dialog/setting', 'setting', []);
    },

    onBtnMoreClick() {
        cc.gameSpace.audioManager.playSound('click', false);
        cc.gameSpace.showTips(i18n.t('showTips.noChargePleaseWait'));
    },

    onBtnFreeGoldClick() {
        cc.gameSpace.audioManager.playSound('click', false);
        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.FREE_GOLD_CLICK, {});
        cc.gameSpace.uiManager.showSharedDialog('dialog/freeGold', 'freeGold', [constants.FREE_GOLD_SOURCE.MAIN_SCENE]);
    },

    //自动合成
    onBtnCombineAutoClick() {
        if (!this.isCombining) {
            this.isCombining = true;
            cc.gameSpace.gameLogic.getOpenRewardType(constants.SHARE_FUNCTION.SIGN, (err, type) => {
                this.openRewardType = type;
                switch (type) {
                    case constants.OPEN_REWARD_TYPE.AD:
                        this.showAd();
                        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.SIGN_SHARE_SHOW, {});
                        break;
                    case constants.OPEN_REWARD_TYPE.SHARE:
                        this.showShare();
                        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.SIGN_SHARE_SHOW, {});
                        break;
                    case constants.OPEN_REWARD_TYPE.NULL:
                        this.startCombineAuto();
                        break;
                }
            });
        }
    },

    showShare() {
        this.startCombineAuto();
    },

    showAd() {
        let funStr = constants.SHARE_FUNCTION.COMBINE_AUTO;

        let adType = funStr;
        gameLogic.watchAd(funStr, playerData.getAdMaxTimesByFun(funStr), adType, (err, isOver) => {
            this.isLoadingAd = false;
            this.unschedule(this.resetAdSwitch);
            if (!err && isOver) {
                this.startCombineAuto();
            } else {
                this.isCombining = false;
            }
        })
    },

    resetAdSwitch() {
        this.isLoadingAd = false;
    },

    startCombineAuto() {
        //设置剩余时间
        let combineAutoTime = 90;
        let combingAutoBuff = gameLogic.getBuff(constants.BUFF_TYPE.COMBINE_AUTO_ADD);
        if (combingAutoBuff) {
            combineAutoTime += Number(combingAutoBuff.buff.addValue);
        }
        let spareTime = playerData.getCombineAutoTime();
        combineAutoTime += spareTime;
        playerData.saveCombineAutoTime(combineAutoTime);

        this.checkIsCombineAuto();
    },

    checkIsCombineAuto() {
        let spareTime = playerData.getCombineAutoTime();
        if (!spareTime || spareTime <= 0) {
            this.scheduleCombineOver();
            return;
        }

        this.workbench.startCombineAuto(constants.BUFF_TYPE.COMBINE_AUTO);

        this.isCombining = true;
        this.combineAutoStartTime = Date.now();
        this.lbCombineAutoTxt.string = utils.formatTimeForSecond(spareTime);
        this.lbCombineAutoTxt.node.active = true;
        this.spCombineAuto.spriteFrame = this.sfCombineAutoStart;
        this.schedule(this.scheduleCombineAuto, 0.2);
    },

    /**
     * 合成倒计时
     */
    scheduleCombineAuto() {
        let now = Date.now();
        if (now - this.combineAutoStartTime > 1000) {
            this.combineAutoStartTime = now;
            let spareTime = playerData.getCombineAutoTime();
            spareTime--;
            spareTime = spareTime < 0 ? 0 : spareTime;
            this.lbCombineAutoTxt.string = utils.formatTimeForSecond(spareTime);
            playerData.saveCombineAutoTime(spareTime);
            if (spareTime <= 0) {
                this.scheduleCombineOver();
            }
        }
    },

    /**
     * 关闭合成倒计时
     */
    scheduleCombineOver() {
        this.isCombining = false;
        this.workbench.closeCombineAuto();
        this.lbCombineAutoTxt.node.active = false;
        this.spCombineAuto.spriteFrame = this.sfCombineAutoOver;
        this.unschedule(this.scheduleCombineAuto);
    },

    //签到
    onBtnSignClick() {
        cc.gameSpace.uiManager.showSharedDialog('sign/sign', 'sign');
    },

    //商店
    onBtnShopClick() {
        if (this.isLoading) {
            return;
        }

        if (this.shopNode) {
            this.shopNode.active = true;
            //todo 判断是否需要将滚动条拉至最顶
            this.shopNode.getComponent('shop').initList();
            return;
        }

        this.isLoading = true;
        resourceUtil.createUI('shop/shop', (err, node) => {
            this.shopNode = node;
            this.isLoading = false;

            this.shopNode.getComponent('shop').initList();
        }, this.node);
    },

    /**
     * 启动免费金币领取计时器
     */
    startFreeGoldTimer() {
        gameLogic.getOpenRewardType(constants.SHARE_FUNCTION.FREE_GOLD, (err, type) => {
            if (type !== constants.OPEN_REWARD_TYPE.NULL) {
                let nextTime = playerData.getSetting(constants.SETTINGS_KEY.FREE_GOLD_NEXT_TIME);
                if (nextTime) {
                    let now = playerData.getCurrentTime();

                    if (now > nextTime) {
                        this.nodeFreeGold.active = true;
                        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.FREE_GOLD_SHOW, {});
                    } else {
                        let spareTime = nextTime - now;

                        this.nodeFreeGold.active = false;

                        this.scheduleOnce(this.onFreeGoldTimeup, spareTime / 1000);
                    }
                } else {
                    this.nodeFreeGold.active = true;
                    gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.FREE_GOLD_SHOW, {});
                }
            }
        });
    },

    /**
     * 免费金币时间到
     */
    onFreeGoldTimeup() {
        if (cc.gameSpace.isStop) {
            return;
        }

        this.nodeFreeGold.active = true;
    },

    /**
     * 启动国庆活动定时器
     */
    startNationalDayTimer() {
        let nextTime = playerData.getSetting(constants.SETTINGS_KEY.NATIONAL_DAY_NEXT_TIME);
        if (nextTime) {
            let now = playerData.getCurrentTime();

            if (now > nextTime) {
                this.showNationalDayPlane(true);
            } else {
                let spareTime = nextTime - now;

                this.showNationalDayPlane(false);

                this.scheduleOnce(this.onNationalTimeup, spareTime / 1000);
            }
        } else {
            //展示飞机动画
            this.showNationalDayPlane(true);
        }
    },

    /**
     * 显示国庆飞机
     * @param {boolean} isShow 
     */
    showNationalDayPlane(isShow) {
        if (!isShow) {
            if (this.plane && cc.isValid(this.plane)) {
                this.plane.active = false;
                this.plane.stopActionByTag(TAG_PLANE_ACTION);
            }
        } else {
            gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.NATIONAL_PLANE_SHOW, {});

            //显示飞机
            if (this.plane && cc.isValid(this.plane)) {
                this.plane.active = true;
                this.plane.stopActionByTag(TAG_PLANE_ACTION);
                // this.plane.setScale(1);
                this.plane.getComponent('pickEntry').reset();

                //将飞机坐标设置到最右边，缓慢飞入
                // let pos = cc.v2((cc.winSize.width + this.plane.width) / 2 + 100, 300);
                let pos = cc.v2((cc.winSize.width + this.plane.width) / 2 + 300, this.ndBottomAd.y + this.ndBottomAd.height / 2 + this.plane.height / 2 - 20);
                this.plane.position = pos;

                let posTarget = cc.v2((-cc.winSize.width - this.plane.width) / 2 - 300, pos.y);
                let move2LeftAction = cc.moveTo(posTarget.sub(pos).mag() / 80, posTarget);
                let move2RightAction = cc.moveTo(posTarget.sub(pos).mag() / 80, pos);
                let flipAction = cc.callFunc((node) => {
                    node.getComponent('pickEntry').flip();
                });

                let seqAction = cc.sequence(move2LeftAction, flipAction, move2RightAction, flipAction).repeatForever();
                seqAction.setTag(TAG_PLANE_ACTION);

                this.plane.runAction(seqAction);
            } else {
                resourceUtil.createUI('pickGame/pickEntry', (err, node) => {
                    if (!err) {
                        this.plane = node;

                        this.showNationalDayPlane(true);
                    }
                }, this.nodeGiftGroup);
            }

        }
    },

    /**
     * 国庆时间到期
     */
    onNationalTimeup() {
        if (cc.gameSpace.isStop) {
            return;
        }

        this.showNationalDayPlane(true);
    },

    /**
     * 检查每日签到
     */
    checkSign() {
        if (guideLogic.isPlayingGuide()) {
            return;
        }

        let isShowSign = false;
        // let today = utils.getDay();
        // let signInfo = playerData.getDailySignInfo();
        // if (!signInfo) {
        //     isShowSign = true;
        // } else if (signInfo.lastSignDay) {
        //     if (utils.getDeltaDays(signInfo.lastSignDay, today) >= 1) {
        //         isShowSign = true;
        //     }
        // }

        if (!gameLogic.isTodayHadSignin()) {
            // resourceUtil.createUI('sign/sign', (err, node) => {
            //     node.zIndex = constants.ZORDER.DIALOG;
            // }, this.node);

            cc.gameSpace.uiManager.pushToPopupSeq('sign/sign', 'sign');
        }
    },

    guideOver() {
        this.scheduleOnce(function() {
            this.checkSign();
            this.checkActivity();
        }, 1);
    },

    balanceOver() {
        // this.checkSign();
    },

    updateTask() {
        //刷新红点
        this.nodeTaskRedDot.active = playerData.hasFinishedAndNoGetTask();
    },

    onBtnTaskClick() {
        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.INVITE_BTN_CLICK, {});

        cc.gameSpace.uiManager.showSharedDialog('task/dailyTask', 'dailyTask');
    },

    //邀请按钮点击
    onBtnInviteClick() {

        // if (this.isLoading) {
        //     return;
        // }

        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.INVITE_BTN_CLICK, {});

        gameLogic.reqGetInviteInfo();

        cc.gameSpace.uiManager.showSharedDialog('invite/invite', 'invite');



        // if (this.inviteNode && cc.isValid(this.inviteNode)) {
        //     this.inviteNode.active = true;
        //     return;
        // }

        // this.isLoading = true;
        // resourceUtil.createUI('invite/invite', (err, node) => {
        //     this.isLoading = false;
        //     this.inviteNode = node;
        //     this.inviteNode.zIndex = constants.ZORDER.DIALOG;
        // }, this.node);
    },

    /**
     * 刷新邀请信息按钮红点
     */
    updateInvitee() {
        let invitee = playerData.getInvitee();

        let hasUnGet = false; //拥有未领取的
        for (var idx = 0; idx < invitee.length; idx++) {
            if (!playerData.hasGetInviteReward(idx)) {
                hasUnGet = true;
                break;
            }
        }

        this.nodeInviteRedDot.active = hasUnGet;
    },

    getGoldWorldPos() {
        return this.nodeGoldIcon.convertToWorldSpaceAR(cc.v2(0, 0));
    },

    getDiamondWorldPos() {
        return this.nodeDiamondIcon.convertToWorldSpaceAR(cc.v2(0, 0));
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

    scheduleAccelerate() {
        if (!this.nodeWorkbench.active && !this.nodeCounter.active) {
            return; //可能处于暂停状态先不动了
        }

        let now = Date.now();
        if (now - this.accelerateStartTime > 1000) {
            this.accelerateStartTime = now;
            let spareTime = playerData.getAccelerateTime();
            spareTime--;
            spareTime = spareTime < 0 ? 0 : spareTime;
            this.lbCoolTime.string = utils.formatTimeForSecond(spareTime);
            playerData.saveAccelerateTime(spareTime);

            if (spareTime <= 0) {
                this.accelerateOver();
            }
        }
    },

    accelerateOver() {
        cc.gameSpace.TIME_SCALE = 1;
        clientEvent.dispatchEvent('updateSpeed');
        this.updateMakeMoney();

        this.btnAccelerate.node.active = true;
        this.nodeCoolTime.active = false;
        this.lbCoolTime.node.active = false;

        if (this.dropCoin) {
            this.dropCoin.destroy();
            this.dropCoin = null;
        }

        this.counter.showAccEffect(false);

        cc.gameSpace.audioManager.stop('accelerate');
        cc.gameSpace.audioManager.playMusic('background', true);
    },

    /**
     * 设置场景激活情况，实则为将一些节点active置为false
     */
    setSceneActive(isActive) {
        this.nodeCounter.active = isActive;
        this.nodeWorkbench.active = isActive;
        this.nodeGiftGroup.active = isActive;
        this.nodeRecovery.active = isActive;
        this.nodeCustomersGroup.active = isActive;
        this.nodeBtnGroup.active = isActive;
        this.node.getChildByName('topMenu').active = isActive;
        this.node.getChildByName('bottomMenu').active = isActive;
    },

    checkActivity() {
        if (guideLogic.isPlayingGuide()) {
            return;
        }

        if (gameLogic.isNeedShowSupportReward) {
            cc.gameSpace.uiManager.pushToPopupSeq('invite/supportReward', 'supportReward', [gameLogic.sharerName]);
        }
    },

    updateGameBarVisible(isVisible) {
        if (this.nodeGameBar) {
            this.nodeGameBar.active = isVisible;
        }
    },

    onBtnQuestionClick() {
        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.ILLUSTRATE_CLICK, {});
        cc.gameSpace.uiManager.showSharedDialog('illustrate/illustrate', 'illustrate', []);
    },

    // update (dt) {},
});