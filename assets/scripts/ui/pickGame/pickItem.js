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
const localConfig = require('localConfig');
const resourceUtil = require('resourceUtil');
const poolManager = require('poolManager');

const TAG_MOVE_ACTION = 10000;

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

        spCake: cc.Sprite,
        lbLevel: cc.Label
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {

    },

    setInfo (parent) {
        this.node.stopActionByTag(TAG_MOVE_ACTION);

        //触发信息设置
        //蛋糕随机及信息设置
        let unlockLevel = playerData.getUnlockLevel();
        //划分出三个等级,30%高，30%中 30%低
        let arrMax = [];
        let arrMiddle = [];
        let arrMin = [];

        let need = Math.floor(unlockLevel * 0.3); //30%所需数量
        need = need <= 1 ? 1:need;

        for (let idx = 0; idx < need; idx++) {
            arrMax.push(unlockLevel - idx);
        }

        let minEnd = 1;
        for (let idx = 0; idx < need; idx++) {
            minEnd = unlockLevel - need - idx;
            minEnd = minEnd < 1 ? 1: minEnd;
            arrMiddle.push(minEnd);
        }
        
        for (let idx = 1; idx < minEnd; idx++) {
            arrMin.push(idx);
        }

        if (arrMin.length <= 0) {
            arrMin.push(minEnd); //至少有一个
        }

        let randValue = Math.floor(Math.random()*100);
        let arrRandom = null;
        this.speed = 300 + Math.floor(Math.random() * 7) * 100;
        if (randValue > 85) { //15%概率抽取最高等级列表
            arrRandom = arrMax;
            // this.speed = this.speed * 3;
        } else if (randValue > 60) { //25%概率抽取中间
            arrRandom = arrMiddle;
            // this.speed = this.speed * 2;
        } else {
            arrRandom = arrMin;
        }
        
        let rand = Math.floor(Math.random() * arrRandom.length);
        this.cakeId = arrRandom[rand];

        let cake = localConfig.queryByID('cake', this.cakeId);
        if (cake) {
            resourceUtil.setCakeIcon(cake.img, this.spCake, ()=>{

            });

            this.rewardGold = Math.floor(cake.buyingPrice / 10);
            this.rewardGold = this.rewardGold < 1 ? 1 : this.rewardGold;
            this.rewardDiamond = cake.pickDiamond;

            this.lbLevel.string = this.cakeId;
        }
    },  

    startMove () {
        let targetPos = cc.v2(this.node.position.x, -cc.winSize.height/2 - this.node.height);
        
        let moveAction = cc.moveTo(targetPos.sub(this.node.position).mag() / this.speed, targetPos);

        let seqAction = cc.sequence(moveAction, cc.callFunc(function(node){
            this.recycle();
        }, this));

        seqAction.setTag(TAG_MOVE_ACTION);

        this.node.runAction(seqAction);
    },

    recycle () {
        this.node.stopActionByTag(TAG_MOVE_ACTION);
        poolManager.putNode(this.node);
    },

    // update (dt) {},
});
