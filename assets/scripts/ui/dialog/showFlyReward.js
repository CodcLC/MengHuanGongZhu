// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html

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

        arrFlyNode: [cc.Node],

        isGoldOrDiamond: {
            default: true,
            tooltip: '是否为金币，不是则为钻石'
        }
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},
    ctor () {
        this.currentTrigger = 0;
    },

    start () {
        this.finishIdx = 0;

        let ani = this.node.getComponent(cc.Animation);
        ani.once('finished', ()=>{
            this.startMove();
        }, this);
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

    startMove () {
        // let targetPos = this.getTargetPos();
        // let speed = 1500;

        // for (let idx = 0; idx < this.arrFlyNode.length; idx++) {
        //     let node = this.arrFlyNode[idx];
        //     let srcPos = node.position;

        //     let distance = srcPos.sub(targetPos).mag();
        //     let costTime = distance/speed;

        //     let seqAction = cc.sequence(cc.moveTo(costTime, targetPos), cc.callFunc(function (node) {
        //         node.active = false;
        //         this.finishIdx++;
        //         if (this.finishIdx === this.arrFlyNode.length) {
        //             if (this._callback) {
        //                 this._callback.apply(this._target);
        //             }

        //             this.node.destroy();
        //         }

        //     }, this));

        //     node.runAction(seqAction);
        // }

        let targetPos = this.getTargetPos();
        for (; this.currentTrigger < this.arrFlyNode.length;) {
            this.startMoveByTrigger(targetPos);
        }
    },

    startMoveByTrigger (targetPos) {
        let node = this.arrFlyNode[this.currentTrigger];
        if (node) {
            // let targetPos = this.getTargetPos();
            let speed = 1500;

            let srcPos = node.position;

            let distance = srcPos.sub(targetPos).mag();
            let costTime = distance/speed;

            let seqAction = cc.sequence(cc.moveTo(costTime, targetPos), cc.callFunc(function (node) {
                node.active = false;
                this.finishIdx++;
                if (this.finishIdx === this.arrFlyNode.length) {
                    if (this._callback) {
                        this._callback.apply(this._target);
                    }

                    this.node.destroy();
                }

            }, this));

            node.runAction(seqAction);
        }

        this.currentTrigger++;
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

    trigger () {
        let targetPos = this.getTargetPos();
        this.startMoveByTrigger(targetPos);
    },

    // update (dt) {},
});
