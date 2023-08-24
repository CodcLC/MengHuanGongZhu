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

        speed: 10
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {

    },

    setParent (pickGame) {
        this.pickGame = pickGame;
    },

    reset () {
        this.node.x = 0;
        this.targetPos = cc.v2(this.node.position);
    },

    moveToPos (pos) {
        this.targetPos = cc.v2(pos.x - cc.winSize.width / 2, this.node.position.y);

        if (this.targetPos.x >= this.node.position.x) {
            this.node.scaleX = 1;
        } else {
            this.node.scaleX = -1;
        }
    },

    moveUpdate () {
         //移动相关
         if (this.targetPos) {
            var pos = this.node.position;
            var posTarget = this.targetPos;
            //超出屏幕右边界
            if (pos.x > (cc.winSize.width - this.node.width) / 2 && posTarget.x > (cc.winSize.width - this.node.width) / 2) {
                this.node.x = ((cc.winSize.width - this.node.width) / 2 + 1);
                return;
            }

            //超出屏幕左边界
            if (pos.x < (-cc.winSize.width + this.node.width) / 2 && posTarget.x < (-cc.winSize.width + this.node.width) / 2) {
                this.node.x = ((-cc.winSize.width + this.node.width) / 2 - 1);
                return;
            }

            //超出上边界
            if (pos.y > (cc.winSize.height - this.node.height) / 2 && posTarget.y > (cc.winSize.height - this.node.height) / 2) {
                this.node.y = (cc.winSize.height - this.node.height) / 2 + 1;
                return;
            }

            if (Math.abs(posTarget.x - pos.x) < this.speed && Math.abs(posTarget.y - pos.y) < this.speed) {
                this.node.position = this.targetPos;
                return;
            }

            // var distance = this.targetPos.sub(pos).mag();
            // if (distance < this.speed) {
            //     this.node.position = this.targetPos;
            //     return;
            // }

            pos.x += this.speed * Math.cos(Math.atan2(this.targetPos.y - pos.y,this.targetPos.x - pos.x));

            this.node.position = pos;
        }
    },

    update (dt) {
        this.moveUpdate();
    },

    pickUp (node) {
        let pickItem = node.getComponent('pickItem');
       
        pickItem.recycle();

        //根据对应的cakeId获得对应奖励？
        this.pickGame.showReward(pickItem.cakeId, pickItem.rewardGold, pickItem.rewardDiamond);
    },

    onCollisionEnter (other, self) {
        if (other.node && other.node.group === 'pickItem') {
            this.pickUp(other.node);
        }
    }
});
