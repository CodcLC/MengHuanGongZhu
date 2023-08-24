// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html

const MAX_REWARD_COUNT = 10;
const clientEvent = require('clientEvent');

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

        prefabReward: cc.Prefab,

        imgGold: cc.SpriteFrame,
        imgDiamond: cc.SpriteFrame,

        nodeRewardParent: cc.Node
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},
    ctor () {
        this.finishIdx = 0;
    },

    start () {
        this.createReward();
    },

    getTargetPos () {
        let canvas = cc.find('Canvas');
        let mainScene = canvas.getComponent('mainScene');
        if (!mainScene) {
            this.node.destroy();

            if (this._callback) {
                this._callback.apply(this._target);
            }

            return;
        }

        let worldPos = null;
        if (this.isGoldOrDiamond) {
            worldPos = mainScene.getGoldWorldPos();
        } else {
            worldPos = mainScene.getDiamondWorldPos();
        }

        return this.node.convertToNodeSpaceAR(worldPos);
    },

    createReward () {
        let imgReward = this.imgGold;
        if (!this.isGoldOrDiamond) {
            imgReward = this.imgDiamond;
        }

        let targetPos = this.getTargetPos();
        for (var idx = 0; idx < MAX_REWARD_COUNT; idx++) {
            let rewardNode = cc.instantiate(this.prefabReward);
            rewardNode.parent = this.nodeRewardParent;

            rewardNode.getComponent(cc.Sprite).spriteFrame = imgReward;
            rewardNode.rotation =  Math.floor(Math.random()*360);

            //每个去配个动作
            // let randDegree = Math.floor(Math.random()*360);
            let delayTime = Math.floor(Math.random()*10) / 10;
            let randTargetPos = cc.v2(Math.floor(Math.random()*300) - 150, Math.floor(Math.random()*300) - 150);
            let costTime = randTargetPos.sub(cc.v2(0, 0)).mag() / 400;
            let moveAction = cc.moveTo(costTime, randTargetPos).easing(cc.easeBackOut());
            let randRotation = 120 + Math.floor(Math.random()*60);
            randRotation = Math.floor(Math.random()*2) === 1? randRotation: -randRotation;
            let rotationAction = cc.rotateBy(costTime, randRotation);
            let scaleAction = cc.scaleTo(costTime * 2/3, 1.4);
            let scaleBackAction = cc.scaleTo(costTime / 3, 1);
            let spawnAction = cc.spawn(moveAction, rotationAction, cc.sequence(scaleAction, scaleBackAction));


            let move2TargetTime = randTargetPos.sub(targetPos).mag() / 1500;

            let seqActions = cc.sequence(spawnAction, cc.callFunc(this.playLoopAction, this), cc.delayTime(delayTime), 
                cc.moveTo(move2TargetTime, targetPos), cc.callFunc(this.onFlyOver, this));

            rewardNode.runAction(seqActions);
        }
    },

    setInfo (isGoldOrDiamond) {
        this.isGoldOrDiamond = isGoldOrDiamond;
    },

    playLoopAction (node) {
        node.getComponent(cc.Animation).play();
    },

    onFlyOver (node) {
        if (this.isGoldOrDiamond) {
            clientEvent.dispatchEvent('receiveGold');
        } else {
            clientEvent.dispatchEvent('receiveDiamond');
        }

        cc.gameSpace.audioManager.playSound('sell', false);
        node.active = false;
        this.finishIdx++;
        if (this.finishIdx === MAX_REWARD_COUNT) {
            if (this._callback) {
                this._callback.apply(this._target);
            }

            this.node.destroy();
        }
    },

    /**
     * 设置播放回调
     * @param {Function} callback 
     * @param {Object} target 
     */
    setEndListener (callback, target) {
        this._callback = callback;
        this._target = target;
    },

    // update (dt) {},
});
