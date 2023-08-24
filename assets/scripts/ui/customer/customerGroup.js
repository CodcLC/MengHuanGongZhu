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
const gameLogic = require('gameLogic');
const constants = require('constants');


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
        arrCustomerNode: [cc.Node],

        prefabCustomer: cc.Prefab,

        nodeHeartPos: cc.Node,

        giftGroup: cc.Node
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},
    ctor () {
        this.currentIdx = -1;
    },

    start () {
        this.createCustomer();

        let randTime = 180 + Math.floor(Math.random() * 120);
        // let randTime = 10 + Math.floor(Math.random() * 20);
        this.scheduleOnce(this.enableHeartTrigger, randTime);
    },

    onEnable () {
        clientEvent.on('sellCake', this.triggerSellCake, this);
    },

    onDisable () {
        clientEvent.off('sellCake', this.triggerSellCake, this);
    },

    /**
     * 创建顾客
     */
    createCustomer () {
        this.arrRoleNode = [];
        let arrCustomerId = ['woman', 'man', 'woman'];
        for (let idx = 0; idx < arrCustomerId.length; idx++) {
            let customerNode = cc.instantiate(this.prefabCustomer);
            customerNode.parent = this.arrCustomerNode[idx];
            let customer = customerNode.getComponent('customer');
            customer.setInfo(idx, arrCustomerId[idx], this);
            this.arrRoleNode.push(customerNode);
        }

        // resourceUtil.createEffect('role/woman01/woman01', (err, node) => {
        //     if (err) {
        //         return;
        //     }

        //     this.arrRoleNode.push(node);
        // }, this.arrCustomerNode[0]);

        // resourceUtil.createEffect('role/man01/man01', (err, node) => {
        //     if (err) {
        //         return;
        //     }

        //     this.arrRoleNode.push(node);
        // }, this.arrCustomerNode[1]);

        // resourceUtil.createEffect('role/woman01/woman01', (err, node) => {
        //     if (err) {
        //         return;
        //     }

        //     this.arrRoleNode.push(node);
        // }, this.arrCustomerNode[2]);

        this.startCustomerRandAction();
    },

    startCustomerRandAction () {
        let time = 3 + (Math.random() * 3);
        this.scheduleOnce(()=>{
            if (this.arrRoleNode.length <= 0) {
                this.startCustomerRandAction();
                return;
            }

            let rand = Math.floor(Math.random()*this.arrRoleNode.length);
            let node = this.arrRoleNode[rand];
            node.getComponent('customer').playIdle();
            this.startCustomerRandAction();
        }, time);
    },

    enableHeartTrigger () {
        gameLogic.getOpenRewardType(constants.SHARE_FUNCTION.LOVE_HEART, (err, type)=>{
            //只要不是null就代表可以触发
            if (type !== constants.OPEN_REWARD_TYPE.NULL) {
                this.currentIdx = Math.floor(Math.random()*this.arrRoleNode.length);
            }
        });
    },

    /**
     * 触发蛋糕售卖
     */
    triggerSellCake (customIdx) {
        if (this.currentIdx === -1) {
            return;
        }

        if (this.currentIdx !== customIdx) {
            return;
        }

        let rolNode = this.arrRoleNode[this.currentIdx];
        let customer = rolNode.getComponent('customer');
        if (!customer.isHeartShow()) {
            customer.showHeart();
        }
        
        this.currentIdx = -1;
    },

    scheduleNextHeart () {
        let randTime = 150 + Math.floor(Math.random() * 60); //2.5分钟~3.5分钟
        // let randTime = 10 + Math.floor(Math.random() * 30);
        this.scheduleOnce(this.enableHeartTrigger, randTime);
    },

    // update (dt) {},
});
