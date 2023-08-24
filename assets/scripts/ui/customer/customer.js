// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html

const resourceUtil = require('resourceUtil');
const clientEvent = require('clientEvent');
const constants = require('constants');
const formula = require('formula');
const playerData = require('playerData');
const localConfig = require('localConfig');
const gameLogic = require('gameLogic');

//爱心状态
const HEART_STATUS = cc.Enum({
    START: 0,     //开始
    NORMAL: 1,         //展现
    MOVE: 2,      //移动中
    WAIT: 3         //等待中
});

const TAG_HEART = 1000;
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
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {
        
    },

    /**
     * 设置顾客信息
     * @param {Number} idx 所在位置
     * @param {String} customerId 顾客id
     * @param {Object} parent 父对象
     */
    setInfo (idx, customerId, parent) {
        this._index = idx;
        this.customerId = customerId;
        this.parent = parent;

        //现在先写死对应资源路径，后续修改成读配置表
        let res = 'role/woman01/woman01';
        let y = 12;
        if (this.customerId === 'man') {
            res = 'role/man01/man01';
            y = 0;
        }

        resourceUtil.createEffect(res, (err, node) => {
            if (err) {
                return;
            }

            node.y = y;
            node.zIndex = 0;
            this.roleNode = node;
        }, this.node);

        this.createHeart();
    },

    /**
     * 播放限制动画
     */
    playIdle () {
        if (this.roleNode) {
            this.roleNode.getComponent(cc.Animation).play('idle');
        }
    },

    /**
     * 创建爱心
     */
    createHeart () {
        if (this.heartNode) {
            return;
        }

        //加载爱心
        resourceUtil.createEffect('ui/showHeart/showHeart', (err, node) => {
            if (err) {
                return;
            }

            this.heartNode = node;
            let posWorld = this.node.convertToWorldSpaceAR(cc.v2(20, 37));
            let posNode = this.heartNode.parent.convertToNodeSpaceAR(posWorld);
            this.heartNode.setPosition(posNode);
            this.heartNode.zIndex = 10;
            this.heartNode.active = false;
            this.heartNode.on(cc.Node.EventType.TOUCH_END, this.onHeartClick, this);
            let aniHeart = this.heartNode.getComponent(cc.Animation);
            aniHeart.on('finished', this.onHeartAniPlayOver, this);
        }, this.parent.giftGroup);
    },

    /**
     * 显示爱心
     */
    showHeart () {
        if (this.heartNode) {
            gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.LOVE_HEART_SHOW, {});

            let posWorld = this.node.convertToWorldSpaceAR(cc.v2(20, 37));
            let posNode = this.heartNode.parent.convertToNodeSpaceAR(posWorld);
            this.heartNode.setPosition(posNode);

            this.heartNode.active = true;

            this.heartStauts = HEART_STATUS.START;
            let aniHeart = this.heartNode.getComponent(cc.Animation);
            aniHeart.play('showHeartStart');
        }
    },

    onHeartAniPlayOver () {
        switch (this.heartStauts) {
            case HEART_STATUS.START:
                let aniHeart = this.heartNode.getComponent(cc.Animation);
                aniHeart.play('showHeartNormal');

                //启动定时器？5秒后从上面掉落下来
                this.heartStauts = HEART_STATUS.NORMAL;
                this.unschedule(this.onHeartScheduleOver);
                this.scheduleOnce(this.onHeartScheduleOver, 5);
                break;
            case HEART_STATUS.NORMAL:
                break;
            case HEART_STATUS.MOVE:
                break;
            case HEART_STATUS.WAIT:
                break;
        }
    },

    onHeartScheduleOver () {
        //做飞行动画
        this.heartStauts = HEART_STATUS.MOVE;
        let aniHeart = this.heartNode.getComponent(cc.Animation);
        aniHeart.play('showHeartMove');

        let posWorld = this.parent.nodeHeartPos.convertToWorldSpaceAR(cc.v2(0, 0));
        let posNode = this.parent.giftGroup.convertToNodeSpaceAR(posWorld);

        let posOrigin = this.heartNode.position;
        let posTarget = cc.v2(posOrigin.x, posNode.y);
        let seqActions = cc.sequence(cc.moveTo(posTarget.sub(posOrigin).mag() / 200, posTarget), cc.callFunc(function () {
            //掉落完毕

            aniHeart.play('showHeartWait');
        }));
        seqActions.setTag(TAG_HEART);

        this.heartNode.runAction(seqActions);
    },

    /**
     * 检查当前爱心是否正在展示
     */
    isHeartShow () {
        return this.heartNode && this.heartNode.active;
    },

    onHeartClick () {
        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.LOVE_HEART_CLICK, {});

        this.heartNode.active = false;
        this.heartNode.stopActionByTag(TAG_HEART);
        this.unschedule(this.onHeartScheduleOver);

        //随机奖励
        let rewardType = constants.REWARD_TYPE.GOLD;
        let amount = 0;
        let isNeedShare = false;
    
        let random = Math.floor(Math.random() * 4);
        switch (random) {
            case 0:
                rewardType = constants.REWARD_TYPE.DIAMOND;
                amount = 5;
                break;
            case 1:
                rewardType = constants.REWARD_TYPE.GOLD;
                let sum = 0;
                let unlockLevel = playerData.getUnlockLevel();
                for (var idx = 0; idx < 4; idx++) {
                    let cakeLevel = unlockLevel - 1 - idx;
                    if (cakeLevel > 0) {
                        let cakeInfo = localConfig.queryByID('cake', cakeLevel.toString());
                        if (cakeInfo) {
                            sum += cakeInfo.sellingPrice;
                        }
                    }
                }

                if (sum === 0) {
                    //表示一个都木有，那就是等于基础蛋糕的价格
                    let cakeInfo = localConfig.queryByID('cake', constants.BASE_CAKE_ID);
                    if (cakeInfo) {
                        sum += cakeInfo.sellingPrice;
                    }
                }

                amount = sum * 10;
                break;
            case 2:
                rewardType = constants.REWARD_TYPE.DIAMOND;
                amount = 20;
                isNeedShare = true;
                break;
            case 3:
                rewardType = constants.REWARD_TYPE.GOLD;
                let goldLevel = playerData.getUnlockLevel() - 4;
                goldLevel = goldLevel < 1? 1 : goldLevel;
                goldLevel = goldLevel.toString();
                let cakeInfo = localConfig.queryByID('cake', goldLevel);
                if (cakeInfo) {
                    var buyTimes = playerData.getBuyTimesByItemId(goldLevel, false);
                    if (goldLevel !== constants.BASE_CAKE_ID) {
                        amount = formula.getCakeBuyingPrice(cakeInfo.buyingPrice, buyTimes);
                    } else {
                        amount = formula.getBaseCakeBuyingPrice(cakeInfo.buyingPrice, buyTimes);
                    }        
                    
                }
                isNeedShare = true;
                break;
        }

        //显示奖励
        cc.gameSpace.uiManager.showSharedDialog('dialog/reward', 'reward', [constants.REWARD_SOURCE.LOVE_HEART, rewardType, amount, isNeedShare]);

        //继续下一个定时器
        this.parent.scheduleNextHeart();
    },

    // update (dt) {},
});
