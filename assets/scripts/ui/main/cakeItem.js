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
const resourceUtil = require('resourceUtil');
const playerData = require('playerData');
const gameLogic = require('gameLogic');

const ITEM_TYPE = cc.Enum({
    WORKBENCH: 1,
    COUNTER: 2
});

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
        nodeIcon: cc.Node,
        nodeBg: cc.Node,
        nodeEffect: cc.Node,

        lbCoolTime: cc.Label,
        spCoolTime: cc.Sprite,
        progress: cc.ProgressBar,

        lbLevel: cc.Label,
        nodeLevel: cc.Node,
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},
    ctor () {
        this.isDrag = false;
        this.isUsed = false;
        this.coolTime = -1;
        this.currentTime = -1;
    },

    start () {
        this.registEvent();
    },

    /**
     * 设置货柜商品信息
     * @param {Number} counterIdx 
     * @param {Number} workbenchIdx 
     * @param {Object} counter
     */
    // setCounterItemInfo (counterIdx, workbenchIdx, counter) {
    //     this.itemType = ITEM_TYPE.COUNTER;
    //     this.counterIdx = counterIdx;
    //     this.counter = counter;
    //     this.node.setScale(0.9, 0.9);
    //     if (this.workbenchIdx !== workbenchIdx) {
    //         this.coolTime = -1;
    //         this.currentTime = -1;
    //     }

    //     this.workbenchIdx = workbenchIdx;

    //     if (this.workbenchIdx === -1 || !playerData.workbench[this.workbenchIdx]) {
    //         //表示没有商品
    //         this.nodeIcon.active = false;
    //         this.progress.node.active = false;
    //     } else {
    //         //获取对应物品id
    //         this.itemId = playerData.workbench[this.workbenchIdx];

    //         this.itemInfo = localConfig.queryByID('cake', this.itemId);
    //         if (this.itemInfo) {
    //             this.nodeIcon.active = true;
    //             resourceUtil.setCakeIcon(this.itemInfo.img, this.nodeIcon.getComponent(cc.Sprite), ()=>{

    //             });

    //             if (this.coolTime === -1) {
    //                 this.coolTime = this.itemInfo.cd;
    //                 this.lbCoolTime.string = Math.ceil(this.coolTime);
    //                 this.currentTime = 0;
    //                 this.progress.node.active = true;
    //             }
    //         }
    //     }
    // },

    /**
     * 设置工作台物品信息
     * @param {Number} index 
     * @param {Number} itemId 
     */
    setWorkbenchItemInfo (index, itemId) {
        //设置信息
        this.index = index;
        this.itemId = itemId;
        this.itemType = ITEM_TYPE.WORKBENCH;

        this.isUsed = false;
        if (this.itemId && this.itemId !== 'gift') { //宝箱也是等待选择
            this.nodeIcon.active = false;
            this.itemInfo = localConfig.queryByID('cake', itemId);
            if (this.itemInfo) {
                resourceUtil.setCakeIcon(this.itemInfo.img, this.nodeIcon.getComponent(cc.Sprite), ()=>{
                    this.nodeIcon.active = true;
                });
            }

            // this.isUsed = playerData.isCakeSelling(this.index);

            this.lbLevel.string = this.itemId;
            this.nodeLevel.active = true;
        } else {
            this.nodeIcon.active = false;
            this.nodeLevel.active = false;
        }

        if (this.isUsed) {
            this.nodeIcon.opacity = 150;
        } else if (!this.isDrag) {
            this.nodeIcon.opacity = 255;
        }
    },

    /**
     * 设置正在出手的商品Id
     * @param {String} itemId 商品id 
     */
    setSellingCakeInfo (itemId) {
        this.itemInfo = localConfig.queryByID('cake', itemId);
        this.node.setScale(0.65);//在转盘上动的蛋糕，比例是0.65
        if (this.itemInfo) {
            this.nodeIcon.active = true;

            resourceUtil.setCakeIcon(this.itemInfo.img, this.nodeIcon.getComponent(cc.Sprite), ()=>{

            });
        }
    },

    /**
     * 标记为已售卖
     */
    markSelled () {
        this.nodeIcon.active = false;
    },

    getInfo () {
        return this.itemId;
    },

    setUsed (isUsed) {

    },

    registEvent () {
        // this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
    },

    dragStart () {
        if (this.isUsed || !this.itemId) { //正在使用中，不可拖拽
            return false;
        }

        this.isDrag = true;

        this.nodeIcon.opacity = 150;
        return true;
    },

    dragOver () {
        if (this.isDrag) {
            this.isDrag = false;
            this.nodeIcon.opacity = 255;
        }
    },

    onItemClicked () {
        // console.log("item end!");
        // if (this.itemType === ITEM_TYPE.WORKBENCH) {
        //     //工作台点击的话，是将已上架的物品下架
        //     if (this.isUsed && this.itemId) {
        //         gameLogic.takeOffCakeFromCounter(this.index);
        //     }
        // }
    },

    /**
     * 蛋糕生成，应该也要播放动画？？
     */
    // generateCake() {
        //TODO 生成蛋糕，让蛋糕动起来，但现在先不做表现，先直接加钱
        // gameLogic.sellingCake(this.itemId);

        //显示tips?
        // if (this.counter) {
        //     this.counter.onCakeMakeFinished(this.itemId);
        // }
    // },

    /**
     * 显示为虚拟状态，用于拖拽时表现使用
     */
    showVirtual () {
        this.nodeBg.active = false;
    },

    update (dt) {
        // if (this.coolTime > 0 && this.itemType === ITEM_TYPE.COUNTER) {
        //     this.currentTime += dt * cc.gameSpace.TIME_SCALE;
        
        //     if (this.currentTime > this.coolTime) {
        //         this.currentTime = 0;

        //         this.progress.progress = 0;

        //         this.generateCake();
        //     } else {
        //         this.progress.progress = (this.coolTime - this.currentTime) / this.coolTime;

        //         this.lbCoolTime.string = Math.ceil(this.coolTime - this.currentTime);
        //     }
        // }
    },

    showBuyingCakeAni () {
        let ani = this.node.getComponent(cc.Animation);
        ani.play('showCake');
    },

    resetCakeIcon () {
        this.nodeIcon.position = cc.v2(-2, -5);
        this.nodeIcon.opacity = 255;
        this.nodeIcon.scale = 1;

        this.nodeEffect.opacity = 0;
    },

    playSameCakeAni (isShow) {
        let ani = this.node.getComponent(cc.Animation);
        if (isShow) {
            this.resetCakeIcon();
            ani.play('combineRemind');
        } else {
            ani.stop('combineRemind');
            this.resetCakeIcon();
        }
    },

    playDiffCakeStatus (isShow) {
        if (isShow) {
            resourceUtil.setGray(this.node, true);
        } else {
            resourceUtil.setGray(this.node, false);
        }
    },

    showCake (isShow) {
        this.nodeIcon.active = isShow;
    },
});
