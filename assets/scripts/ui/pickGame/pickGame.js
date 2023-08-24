// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html
const gameLogic = require('gameLogic');
const poolManager = require('poolManager');
const constants = require('constants');
const utils = require('utils');
const clientEvent = require('clientEvent');
const resourceUtil = require('resourceUtil');

const TAG_MOVE_ACTION = 10000;
const TAG_TIMEOUT_ACTION = 10001;

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

        nodePlayer: cc.Node,

        nodeGenerator: cc.Node,

        nodeCakeGroup: cc.Node,

        nodeInfo: cc.Node,
        nodeCountDown: cc.Node,

        pfCake: cc.Prefab,

        prefabGetTips: cc.Prefab,

        lbGold: cc.Label,
        lbDiamond: cc.Label,
        lbLeftSec: cc.Label,

        nodeGuide: cc.Node,
        nodeHand: cc.Node,
        nodeHalo: cc.Node,

        colorLeftSecNormal: new cc.Color(),
        colorLeftSecRed: new cc.Color()
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    show () {
        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.PICK_GAME_SHOW, {});

        gameLogic.pauseScene();

        if (!this.player) {
            this.player = this.nodePlayer.getComponent('player');
            this.player.setParent(this);
        }

        this.reset();

        resourceUtil.updateNodeRenderers(this.node);
    },

    start () {
        let manager = cc.director.getCollisionManager();
        manager.enabled = true;

        this.resizeForIphoneX();
    },

    /**
     * 为iphoneX做适配
     */
    resizeForIphoneX () {
        if (cc.gameSpace.isIphoneX) {
            let offsetY = 50;

            this.nodeInfo.getComponent(cc.Widget).top += offsetY;
            this.nodeCountDown.getComponent(cc.Widget).top += offsetY;
            this.nodeGenerator.getComponent(cc.Widget).top += offsetY;
        }
    },

    reset () {
        this.genDuration = 1; //数值越小，速度越快
        this.currentTime = 0;   //每隔N秒生产
        this.currentSpeedTime = 0;  //每隔N秒减少生产周期
        this.gold = 0;
        this.diamond = 0;
        this.leftSecUpdateTime = 0;
        this.leftSec = 30;
        this.isGameOver = false;
        this.isGameStart = false;

        this.player.reset();
        this.nodeGenerator.x = 0;
        this.nodeGenerator.scaleX = 1;
        this.recycleAllCake();

        this.nodeGuide.active = true;
        this.playHandAni();

        this.refreshUI();
        this.refreshLeftTime();
    },

    playHandAni () {
        this.nodeHand.getComponent(cc.Animation).play('pickGameHand');
    },

    startGame () {
        this.isGameStart = true;
        this.nodeGuide.active = false;

        this.startGeneratorMove();
    },

    recycleAllCake () {
        let arrCakes = [];
        for (let idx = 0; idx < this.nodeCakeGroup.children.length; idx++) {
            arrCakes.push(this.nodeCakeGroup.children[idx]);
        }

        for (let idx = 0; idx < arrCakes.length; idx++) {
            poolManager.putNode(arrCakes[idx]);
        }
    },

    startGeneratorMove () {
        this.nodeGenerator.stopActionByTag(TAG_MOVE_ACTION);

        let speed = 400;
        let pos = this.nodeGenerator.position;
        let posLeft = cc.v2((- cc.winSize.width - this.nodeGenerator.width - 40) / 2, pos.y); //飞到屏幕外
        let posRight = cc.v2((cc.winSize.width + this.nodeGenerator.width + 40) / 2, pos.y);
        let moveCenter2Left = cc.moveTo(posLeft.sub(pos).mag() / speed, posLeft);
        let flipAction = cc.callFunc((node)=>{
            node.scaleX = -node.scaleX;
        });
        let move2Right = cc.moveTo(posLeft.sub(posRight).mag() / speed, posRight);
        let moveRight2Center = cc.moveTo(posRight.sub(pos).mag() / speed, pos);
        let seqActions = cc.sequence(moveCenter2Left, flipAction, move2Right, flipAction, moveRight2Center).repeatForever();

        // let posRight = cc.v2((cc.winSize.width - this.nodeGenerator.width) / 2, pos.y);
        // let moveCenter2Right = cc.moveTo(posRight.sub(pos).mag() / speed, posRight);
        // let posLeft = cc.v2((- cc.winSize.width + this.nodeGenerator.width) / 2, pos.y);
        // let moveLeft = cc.moveTo(posLeft.sub(posRight).mag() / speed, posLeft);
        // let moveRight = cc.moveTo(posLeft.sub(posRight).mag() / speed, posRight);
        // let moveLeft2Center = cc.moveTo(posLeft.sub(pos).mag() / speed, pos);
        // let seqActions = cc.sequence(moveCenter2Right, moveLeft, moveRight, moveLeft, moveLeft2Center).repeatForever();
        seqActions.setTag(TAG_MOVE_ACTION);

        this.nodeGenerator.runAction(seqActions);
    },

    onBtnCloseClick () {
        cc.gameSpace.audioManager.playSound('click', false);

        gameLogic.resumeScene();
        cc.gameSpace.uiManager.hideSharedDialog('pickGame/pickGame');
    },

    onEnable () {
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    },

    onDisable () {
        this.node.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    },

    updatePlayerPos (touchEvent) {
        if (this.isGameOver) {
            return;
        }

        if (this.player) {
            this.player.moveToPos(touchEvent.getLocation());
        }
    },

    onTouchStart (touchEvent) {
        if (!this.isGameStart) {
            this.startGame();
        }

        this.updatePlayerPos(touchEvent);
    },

    onTouchMove (touchEvent) {
        this.updatePlayerPos(touchEvent);
    },

    onTouchEnd (touchEvent) {
        this.updatePlayerPos(touchEvent);
    },

    onTouchCancel (touchEvent) {
        this.updatePlayerPos(touchEvent);
    },

    /**
     * 触发蛋糕的生产
     */
    triggerGenerate () {
        if (this.isGameOver) {
            return;
        }

        let node = poolManager.getNode(this.pfCake, this.nodeCakeGroup);
        node.position = this.nodeGenerator.position;

        //随机生产的蛋糕
        let pickItem = node.getComponent('pickItem');
        pickItem.setInfo(this);
        pickItem.startMove();
    },

    update (dt) {
        if (this.isGameOver || !this.isGameStart) {
            return; //游戏结束 或者 游戏还未开始
        }

        this.leftSecUpdateTime += dt;
        if (this.leftSecUpdateTime >= 1) {
            this.leftSecUpdateTime = 0;
            this.leftSec--;

            this.leftSec = this.leftSec > 0 ? this.leftSec : 0;
            this.refreshLeftTime();

            if (this.leftSec <= 0) {
                this.gameOver();
            }
        }

        if (this.genDuration > 0.21) {
            //每5秒，减少0.2秒的生产周期
            this.currentSpeedTime += dt;
            if (this.currentSpeedTime > 4) {
                this.currentSpeedTime = 0;

                this.genDuration -= 0.2;
            }
        }
        
        this.currentTime += dt;
        if (this.currentTime >= this.genDuration) {
            let posGeneratorX = this.nodeGenerator.position.x;
            let cakeWidth = this.pfCake.data.width;
            if (posGeneratorX > (- cc.winSize.width + cakeWidth) / 2 && posGeneratorX < (cc.winSize.width - cakeWidth) / 2) {
                //表示在指定坐标内，触发生成
                this.currentTime = 0;
                this.triggerGenerate();
            } else {
                this.currentTime -= 0.1;//即0.1s后再来验证是否飞进来了
            }
        }
    },

    showGetMoneyTips (rewardType, rewardValue, posTips, cb) {
        let tipsNode = poolManager.getNode(this.prefabGetTips, this.node);
        tipsNode.setPosition(posTips);
        tipsNode.getComponent('getTips').showReward(rewardType, rewardValue, cb);
    },

    showReward (cakeId, gold, diamond) {
        let posTips = cc.v2(this.nodePlayer.position.x, this.nodePlayer.position.y += this.nodePlayer.height / 2 + 30);
        if (gold) {
            this.gold += gold;

            this.showGetMoneyTips(constants.REWARD_TYPE.GOLD, gold, posTips);
        }

        if (diamond) {
            this.diamond += diamond;

            this.scheduleOnce (function() {
                this.showGetMoneyTips(constants.REWARD_TYPE.DIAMOND, diamond, posTips);
            }, 0.3);
        }

        this.refreshUI();
    },

    refreshUI () {
        this.lbGold.string = "+" + utils.formatMoney(this.gold);
        this.lbDiamond.string = "+" + utils.formatMoney(this.diamond);
    },

    refreshLeftTime () {
        this.lbLeftSec.node.setScale(1);
        this.lbLeftSec.node.opacity = 255;
        this.lbLeftSec.string = this.leftSec;
        this.nodeHalo.active = false;

        // if (this.leftSec < 10) {
        //     this.lbLeftSec.node.color = this.colorLeftSecRed;
        // } else {
        //     this.lbLeftSec.node.color = this.colorLeftSecNormal;
        // }

        if (this.leftSec <= 5) {
            //进入结束倒计时
            let scaleAction = cc.scaleTo(0.9, 3.0).easing(cc.easeOut(2));
            let fadeAction = cc.fadeOut(0.9);
            let spawnAction = cc.spawn(scaleAction, fadeAction);
            spawnAction.setTag(TAG_TIMEOUT_ACTION);
            this.lbLeftSec.node.runAction(spawnAction);

            this.nodeHalo.active = true;
            this.nodeHalo.getComponent(cc.Animation).play('matchHalo');
        }
    },

    gameOver () {
        this.isGameOver = true;

        this.nodeGenerator.stopActionByTag(TAG_MOVE_ACTION);
        this.recycleAllCake();

        cc.gameSpace.uiManager.showSharedDialog('pickGame/pickResult', 'pickResult', [this.gold, this.diamond, this]);

        // console.log("gameOver");
        // console.log("addGold", utils.formatMoney(this.gold));
        // console.log("addDiamond", utils.formatMoney(this.diamond));

    },
});
