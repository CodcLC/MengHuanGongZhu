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
const playerData = require('playerData');
const gameLogic = require('gameLogic');
const resourceUtil = require('resourceUtil');
const utils = require('utils');
const poolManager = require('poolManager');
const CAKE_MOVE_SPEED = 200;
const CAKE_MOVE_INTERVAL = 500;
const TAG_CAKE_MOVE = 10000;

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

        prefabSellingCake: cc.Prefab,

        prefabGetTips: cc.Prefab,
        prefabMoneyEffect: cc.Prefab,

        // layoutNode: cc.Node,

        nodeStartPoint: cc.Node,

        nodeCakeGroup: cc.Node,

        arrPointNode: [cc.Node],

        nodeTurnable: cc.Node,

        nodeAccelerateEffect: cc.Node
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},
    ctor () {
        this.arrWaiting = [];
        this.nextTime = 0;
        this.arrMoveNode = [];
    },

    start () {
        this.registEvent();
        // this.createCounter();

        // this.init();

        this.scheduleOnce(()=>{
            this.nodeTurnable.active = false;
        }, 1);

        this.startNewTurn();
    },

    registEvent () {
        clientEvent.on('updateWorkbench', this.startNewTurn, this);
        clientEvent.on('updateSpeed', this.updateSpeed, this);
    },

    onDestroy () {
        clientEvent.off('updateWorkbench', this.startNewTurn, this);
        clientEvent.off('updateSpeed', this.updateSpeed, this);
    },

    /**
     * 设置MainScene
     * @param {cc.Class} mainScene 
     */
    setMainScene (mainScene) {
        this.mainScene = mainScene;
    },

    /**
     * 检查是否拖拽到货架上
     * @param {cc.Vec2} pos 最后拖拽到的坐标
     * @return {Number} 拖拽到的位置，-1表示没有
     */
    // checkIsDragToCounter (pos) {
    //     let box = this.node.getBoundingBoxToWorld();

    //     if (!box.contains(pos)) {
    //         return -1;
    //     }

    //     let touchNode = this.getCurrentNodeByTouchPos(pos);
    //     if (touchNode) {
    //         var cakeItem = touchNode.getComponent('cakeItem');
    //         if (cakeItem) {
    //             return cakeItem.counterIdx;
    //         }
    //     }

    //     return -1;
    // },


    // getCurrentNodeByTouchPos (pos) {
    //     var arrNode = this.layoutNode.children;
    //     return _.find(arrNode, function (itemNode, index) {
    //         var box = itemNode.getBoundingBoxToWorld();

    //         if (box.contains(pos)) {
    //             return true;
    //         }
    //     }, this);
    // },

    // updateCounter (index) {
    //     if (index !== undefined && index !== null && index < constants.COUNTER_MAX_POS && index >= 0) {
    //         var itemNode = this.layoutNode.getChildren()[index];
    //         var itemInfo = itemNode.getComponent('cakeItem');
    //         if (index < playerData.counter.length) {
    //             itemInfo.setCounterItemInfo(index, playerData.counter[index], this);
    //         } else {
    //             itemInfo.setCounterItemInfo(index, -1, this);
    //         }
    //     } else {
    //         this.init();
    //     }
    // },

    /**
     * 回合开始
     */
    startNewTurn () {
        if (this.arrMoveNode.length > 0) {
            //表示还有蛋糕
            return;
        }

        if (this.arrWaiting.length > 0) {
            //表示还有等待的蛋糕未发出
            this.startMoveCake();
            return;
        }

        if (playerData.workbench.length <= 0) {
            //目前工作台上没有任何蛋糕
            return;
        }

        //都没有，计算下，现有的蛋糕，然后按顺序，一个个发出
        playerData.workbench.forEach((itemId)=>{
            if (itemId !== null && itemId !== 'gift') {
                this.onCakeMakeFinished(itemId);
            }
        });

        //计算时间，然后触发的时候销售的时候，以该时间为单位+间隔时间
        //目前移动所需6秒一次
        this.currentTurnCostTime = 6 + Math.floor((this.arrWaiting.length * CAKE_MOVE_INTERVAL) / 1000);
    },

    startMoveCake() {
        if (this.isClearAll) {
            return;
        }
        
        var itemId = this.arrWaiting.shift();

        let cakeNode = poolManager.getNode(this.prefabSellingCake, this.nodeCakeGroup);
        let cake = cakeNode.getComponent('cakeItem');
        cake.setSellingCakeInfo(itemId);

        cakeNode.position = this.nodeStartPoint.position;
        
        let arrEvent = [7, 8, 9]; //由arrPointNode中得知，索引为7,8,9的三个点是触发事件的关键点
        let rand = Math.floor(Math.random() * 3);
        let triggerEventIndex = arrEvent[rand];
        cakeNode.triggerEventIndex = triggerEventIndex;
        cakeNode.triggerCustomer = rand;
        cakeNode.currentMoveIndex = -1;
        cakeNode.cakeItemId = itemId;

        this.moveCake(cakeNode);
        this.arrMoveNode.push(cakeNode);

    },

    moveCake (cakeNode) {
        let currentIdx = cakeNode.currentMoveIndex;
        let arrActions = [];
        let prePoint = cakeNode.position;
        for (let idx = currentIdx + 1; idx < this.arrPointNode.length; idx++) {
            let targetPos = this.arrPointNode[idx].position;
            let moveAction = cc.moveTo(targetPos.sub(prePoint).mag() / (CAKE_MOVE_SPEED*cc.gameSpace.TIME_SCALE), targetPos);
            arrActions.push(moveAction);

            arrActions.push(cc.callFunc(function(node, idx){
                node.currentMoveIndex = idx;
                if (node.triggerEventIndex === idx) {
                    this.triggerSell(node, {customer: node.triggerCustomer, itemId: node.cakeItemId});
                }
            }, this, idx));

            prePoint = targetPos;
        }

        arrActions.push(
            cc.callFunc(function (node) {
                poolManager.putNode(node);

                for (var idx = 0; idx < this.arrMoveNode.length; idx++) {
                    if (this.arrMoveNode[idx] === node) {
                        this.arrMoveNode.splice(idx, 1);

                        if (this.arrMoveNode.length === 0 && this.arrWaiting.length === 0) {
                            this.startNewTurn();
                        }
                        break;
                    }
                }
            }, this)
        );

        let seqActions = cc.sequence(arrActions);
        seqActions.setTag(TAG_CAKE_MOVE);
        cakeNode.runAction(seqActions);
    },

    /**
     * 蛋糕制作完成，将其加入派送队列
     * @param {String} itemId 
     */
    onCakeMakeFinished(itemId) {
        this.arrWaiting.push(itemId);
        var now = Date.now();
        if (now < this.nextTime) {
            //等待下一波的时间
            // setTimeout(()=>{
            //     this.startMoveCake();
            // }, this.nextTime - now);
            this.scheduleOnce(function(){
                this.startMoveCake();
            }, (this.nextTime - now)/1000);

            this.nextTime += (CAKE_MOVE_INTERVAL / cc.gameSpace.TIME_SCALE);
            return;
        }

        this.nextTime = now + (CAKE_MOVE_INTERVAL / cc.gameSpace.TIME_SCALE);

        this.startMoveCake();
    },

    triggerSell(node, info) {
        //触发售卖
        clientEvent.dispatchEvent('sellCake', info.customer);

        let cake = node.getComponent('cakeItem');
        cake.markSelled();

        var addGold = gameLogic.sellingCake(info.itemId, this.currentTurnCostTime);

        let posWorld = node.convertToWorldSpaceAR(cc.v2(0, 0));
        // clientEvent.dispatchEvent('showGetMoneyTips', posWorld, addGold);

        cc.gameSpace.audioManager.playSound('sell', false);

        this.showGetMoney(posWorld, addGold);
    },

    showGetMoney (worldPos, value, cb) {
        // resourceUtil.createEffect('ui/money/money', (err, effectNode) => {
        //     let posTips = effectNode.parent.convertToNodeSpaceAR(worldPos);
        //     effectNode.setPosition(posTips);
            
        //     this.showGetMoneyTips(worldPos, value, cb);
        // }, this.node);

        let posTips = this.node.convertToNodeSpaceAR(worldPos);
        let effectNode = poolManager.getNode(this.prefabMoneyEffect, this.node);
        effectNode.setPosition(posTips);
        let particle = effectNode.getComponent(cc.ParticleSystem);
        particle.resetSystem();
        this.scheduleOnce(function(){
            poolManager.putNode(effectNode);
        }, particle.life);

        this.showGetMoneyTips(worldPos, value, cb);
    },

    showGetMoneyTips (worldPos, value, cb) {
        let tipsNode = poolManager.getNode(this.prefabGetTips, this.node);

        let posTips = tipsNode.parent.convertToNodeSpaceAR(worldPos);
        tipsNode.setPosition(posTips);
        tipsNode.getComponent('getTips').showReward(constants.REWARD_TYPE.GOLD, value);
    },

    clearAllMoveCake () {
        this.isClearAll = true;
        for (let idx = 0; idx < this.arrMoveNode.length; idx++) {
            let node = this.arrMoveNode[idx];
            node.destroy();
        }

        this.arrMoveNode = [];
    },

    getEmptyCounterForGuide () {
        // let counter = playerData.counter;
        // let idxFind = -1;
        // for (let idx = 0; idx < counter.length; idx++) {
        //     if (counter[idx] !== null && counter[idx] !== undefined && counter[idx] !== -1) {
        //         idxFind = idx;
        //         break;
        //     }
        // }

        // if (idxFind === -1 && counter.length < constants.COUNTER_MAX_POS) {
        //     idxFind = counter.length;
        // }

        // let ret = null;
        // if (idxFind !== -1) {
        //     let node = this.layoutNode.getChildren()[idxFind];
        //     if (node) {
        //         ret = {};
        //         ret.pos = node.convertToWorldSpaceAR(cc.v2(0, 0));
        //         ret.pos = cc.find('Canvas').convertToNodeSpaceAR(ret.pos);
        //         ret.width = node.width + 30;
        //         ret.height = node.height + 30;
        //     }
        // }

        // return ret;
        return null;
    },

    //更新移动速度
    updateSpeed () {
        for (let idx = 0; idx < this.arrMoveNode.length; idx++) {
            let node = this.arrMoveNode[idx];
            node.stopActionByTag(TAG_CAKE_MOVE);

            this.moveCake(node);
        }
    },

    playAccEffectAni () {
        let ani = this.accelerateEffect.getComponent(cc.Animation);
        ani.play('start');
        ani.once('finished', ()=> {
            ani.play('loop');
        }, this);
    },

    playAccEffectOverAni () {
        let ani = this.accelerateEffect.getComponent(cc.Animation);
        ani.play('end');
        ani.once('finished', ()=> {
            this.accelerateEffect.active = false;
        }, this);
    },

    /**
     * 显示加速特效
     */
    showAccEffect (isShow) {
        if (isShow && this.accelerateEffect && this.accelerateEffect.active) {
            return;
        }

        if (!isShow && (!this.accelerateEffect || !this.accelerateEffect.active)) {
            return;
        }

        if (isShow) {
            if (!this.accelerateEffect) {
                resourceUtil.createEffect('ui/accelerate/accelerate', (err, node)=>{
                    this.accelerateEffect = node;
    
                    this.playAccEffectAni();
                }, this.nodeAccelerateEffect);
            } else {
                this.accelerateEffect.active = true;
                this.playAccEffectAni();
            }
        } else {
            this.playAccEffectOverAni();
        }
        
    },

    // update (dt) {},
});
