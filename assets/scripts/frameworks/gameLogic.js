/**
 * Copyright (c) 2017 Xiamen Yaji Software Co.Ltd. All rights reserved.
 */

const playerData = require('playerData');
const clientEvent = require('clientEvent');
const localConfig = require('localConfig');
const resourceUtil = require('resourceUtil');
const formula = require('formula');
const utils = require('utils');
const constants = require('constants');
const guideLogic = require('guideLogic');
const i18n = require('LanguageData');

const SHOW_STR_INTERVAL_TIME = 800;
const MAX_RANDOM = 16; //随机数

var GameLogic = cc.Class({

    properties: {
        isConnect: false
    },

    // use this for initialization
    onLoad() {
        this.dictSharedPanel = {};
        this.dictLoading = {};
        //this.buyCakeTimesForLevelUp = 10;//蛋糕购买次数
        this.arrPopupDialog = [];
        this.channel = '';

        // this.shareAction = 'support';
        // this.sharer = 'lzy14';
        // this.sharerName = 'lzy14';

        this.regNetEvent();
        this.regLogicEvent();
    },

    /**
     * 用于检查事件是否已经有监听
     *
     * @param {String} event
     * @return {Boolean}
     */
    hasListeners(event) {
        return network.hasListeners(event);
    },

    /**
     * 移除事件监听
     */
    removeListener(event) {
        return network.removeListener(event);
    },

    on(router, cb) {
        network.on(router, cb);
    },

    regNetEvent() {
        var _this = this;
    },

    regLogicEvent() {
        var _this = this;
        this.showTipsTime = 0;
        clientEvent.on("showTips", function(content, cb) {
            //做个时间推移，防止挤在一块
            var now = Date.now();
            if (now - _this.showTipsTime < SHOW_STR_INTERVAL_TIME) {
                var spareTime = SHOW_STR_INTERVAL_TIME - (now - _this.showTipsTime);
                setTimeout(function(tipsLabel, callback) {
                    _this.showTipsAni(tipsLabel, callback);
                }.bind(this, content, cb), spareTime);

                _this.showTipsTime = now + spareTime;
            } else {
                _this.showTipsAni(content, cb);
                _this.showTipsTime = now;
            }
        });

        clientEvent.on("showGetMoneyTips", function(pos, value, cb) {
            _this.showGetMoneyTips(pos, value, cb);
        });

        clientEvent.on('showWaiting', this.showWaiting, this);
        clientEvent.on('hideWaiting', this.hideWaiting, this);

        clientEvent.on('addBaseCakeForGuide', () => {
            //给玩家增加基础蛋糕
            var addIdx = playerData.addCakeToWorkbench(constants.BASE_CAKE_ID);
            if (addIdx !== -1) {
                clientEvent.dispatchEvent('updateWorkbench', addIdx, true);
            }
        });

        clientEvent.on('showFlyReward', this.showFlyReward, this);
        clientEvent.on('showItemReward', this.showItemReward, this);

    },

    onAppShow(res) {
        this.shareImg = null;
        this.sharer = null;
        this.sharerName = null;
        this.shareAction = null;

        if (res.scene === 1037 && res.query) {
            //由其他小程序进入的
            let paramStr = 'game_id';
            if (res.query.hasOwnProperty(paramStr)) {
                let gameId = res.query[paramStr];
                this.channel = gameId;

                if (gameId) {
                    this.customEventStatistics(constants.STAT_EVENT_TYPE.CHANNEL, { channel: gameId });
                }
            }
        } else if (res.scene === 1044) {
            this.channel = 'share';
        } else if (res.scene) {
            this.channel = res.scene + '';
        }

        if (res.query) {
            if (res.query.source) {
                this.sharer = res.query.source;
            }

            if (res.query.shareImg) {
                this.shareImg = res.query.shareImg;
            }

            if (res.query.action) {
                this.shareAction = res.query.action;
                switch (res.query.action) {
                    case "showGroupRank":
                        //显示群排行
                        this.showGroupRank(res.shareTicket);
                        break;
                    case "invite":
                        this.sharer = res.query.source;
                        break;
                    case "support":
                        this.sharerName = res.query.nickName;

                        if (playerData.isLogin()) {}
                        break;
                    default:
                        break;
                }
            }
        }
    },

    /**
     * 当进入主场景的时候会触发
     */
    onLogin() {
        this.checkIsNewBee();
    },

    checkIsNewBee() {
        if (playerData.isNewBee) {
            //表示新玩家，判断是否为邀请进来的

        }
    },

    showWaiting(tips, cb) {
        if (this.waitingNode && cc.isValid(this.waitingNode)) {
            this.waitingNode.parent = cc.find("Canvas");
            let waiting = this.waitingNode.getComponent('waiting');
            waiting.show(tips);

            if (cb) {
                cb();
            }
        } else {
            resourceUtil.createUI('common/waiting', (err, waitingNode) => {
                if (err) {
                    return;
                }

                this.waitingNode = waitingNode;
                waitingNode.zIndex = constants.ZORDER.WAITING;
                let waiting = waitingNode.getComponent('waiting');
                waiting.show(tips);

                if (cb) {
                    cb();
                }
            });
        }
    },

    hideWaiting() {
        if (this.waitingNode && cc.isValid(this.waitingNode)) {
            this.waitingNode.parent = null; //从父节点移除
        }
    },

    showTipsAni(content, cb) {
        //todo 临时添加方案，后期需要将这些代码移到具体界面
        resourceUtil.createUI('common/tips', function(err, tipsNode) {
            if (err) {
                return;
            }

            tipsNode.zIndex = constants.ZORDER.TIPS;
            tipsNode.setPosition(cc.v2(0, 100));

            var txtLabel = tipsNode.getChildByName("txtValue").getComponent(cc.RichText);
            txtLabel.maxWidth = 0;
            txtLabel.string = content;

            //修改底图大小
            var width = txtLabel._linesWidth;
            if (width.length && width[0] < 500) {
                txtLabel.maxWidth = width[0];
            } else {
                txtLabel.maxWidth = 500;
                txtLabel.node.setContentSize(500, txtLabel.node.getContentSize().height);
            }

            var size = txtLabel.node.getContentSize();
            if (!cc.isValid(size)) { //size不存在，自我销毁
                tipsNode.destroy();
                return;
            }
            tipsNode.setContentSize(size.width + 136 < 240 ? 240 : size.width + 136, size.height + 30);
            var delayAction = cc.delayTime(0.8);
            var moveByAction = cc.moveBy(0.8, cc.v2(0, 150));
            var fadeAction = cc.fadeOut(0.8);
            var seqAction;
            if (cb) {
                seqAction = cc.sequence(delayAction, moveByAction, delayAction, fadeAction,
                    cc.callFunc(cb), cc.removeSelf(true));
            } else {
                seqAction = cc.sequence(delayAction, moveByAction, delayAction, fadeAction, cc.removeSelf(true));
            }

            tipsNode.runAction(seqAction);
        });
    },

    /**
     * 在指定位置显示获取金币的效果
     * @param {cc.Vex2} worldPos 
     * @param {Number} value 
     * @param {Function} cb 
     */
    showGetMoneyTips(worldPos, value, cb) {
        resourceUtil.createUI('common/getTips', function(err, tipsNode) {
            if (err) {
                return;
            }

            let posTips = tipsNode.parent.convertToNodeSpaceAR(worldPos);
            tipsNode.setPosition(posTips);
            tipsNode.getChildByName("txtValue").getComponent(cc.Label).string = '+' + utils.formatMoney(value);
            tipsNode.setScale(0);

            var scaleAction = cc.scaleTo(0.5, 1).easing(cc.easeBackInOut());
            var delayAction = cc.delayTime(0.2);
            var moveByAction = cc.moveBy(0.8, cc.v2(0, 150));
            var fadeAction = cc.fadeOut(0.8);
            var spawnAction = cc.spawn(moveByAction, fadeAction);
            var seqAction;
            if (cb) {
                seqAction = cc.sequence(scaleAction, delayAction, spawnAction,
                    cc.callFunc(cb), cc.removeSelf(true));
            } else {
                seqAction = cc.sequence(scaleAction, delayAction, spawnAction, cc.removeSelf(true));
            }

            tipsNode.runAction(seqAction);
        });
    },

    /**
     * 蛋糕位置交换或者结合
     * @param {number} originIndex 原始index
     * @param {number} targetIndex 目标index
     */
    combinOrSwap(originIndex, targetIndex) {
        var originItem = playerData.workbench[originIndex];
        if (!originItem) {
            return false;
        }

        if (originItem && playerData.workbench[targetIndex] && originItem.toString() === playerData.workbench[targetIndex].toString()) {
            //结合
            playerData.combineCake(originIndex, targetIndex, (isSucceed, isUnlock) => {
                if (isSucceed) {
                    if (!isUnlock) {
                        //发起蛋糕合并事件
                        clientEvent.dispatchEvent("combineCake", originIndex, targetIndex, originItem);
                        this.finishTask(constants.DAILY_TASK_TYPE.COMBINE, 1);
                    } else {
                        //发起蛋糕解锁事件
                        clientEvent.dispatchEvent("unlockCake", originIndex, targetIndex, originItem);
                        this.finishTask(constants.DAILY_TASK_TYPE.UNLOCK, 1);
                    }
                } else {
                    if (isUnlock === 'maxLevel') {
                        //已经达到最高等级
                        cc.gameSpace.showTips(i18n.t('showTips.cakeHighestLevel'));
                    }
                }
            });
        } else {
            //位置交换
            if (playerData.swapCake(originIndex, targetIndex)) {
                //发起数据更新
                clientEvent.dispatchEvent('updateWorkbench', originIndex);
                clientEvent.dispatchEvent('updateWorkbench', targetIndex);
            }
        }
    },

    /**
     * 购买蛋糕
     * @param {string}} itemId 
     */
    buyCake(itemId, isUseDiamond) {
        if (!playerData.hasPosAtWorkbench()) {
            cc.gameSpace.showTips(i18n.t('showTips.noVacantSeat'));
            return false;
        }

        var itemInfo = localConfig.queryByID('cake', itemId);
        if (!itemInfo) {
            cc.gameSpace.showTips(i18n.t('showTips.cakeWasWrong'));
            return false;
        }

        //检查钱够不够,并且将钱进行消耗
        var buyTimes = playerData.getBuyTimesByItemId(itemId, isUseDiamond);
        let costMoney = 0;
        if (!isUseDiamond) {
            if (itemId.toString() !== constants.BASE_CAKE_ID) {
                costMoney = formula.getCakeBuyingPrice(itemInfo.buyingPrice, buyTimes);
            } else {
                costMoney = formula.getBaseCakeBuyingPrice(itemInfo.buyingPrice, buyTimes);
            }

            if (playerData.getGold() < costMoney) {
                cc.gameSpace.showTips(i18n.t('showTips.lackGold'));
                return false;
            }

            //此处扣除金币,增加购买次数,并且增加金币总消耗
            if (!playerData.playerInfo.cost) {
                playerData.playerInfo.cost = costMoney.toString();
            } else {
                playerData.playerInfo.cost = (Number(playerData.playerInfo.cost) + costMoney).toString();
            }
            // wxAdapter.setUserCloudStorage('cost', playerData.playerInfo.cost, () => {});
            this.addGold(-costMoney);
        } else {
            costMoney = formula.getCakeDiamondPrice(itemInfo.diamonds, buyTimes);

            if (playerData.getDiamond() < costMoney) {
                cc.gameSpace.showTips(i18n.t('showTips.lackDiamonds'));
                return false;
            }

            this.finishTask(constants.DAILY_TASK_TYPE.CONSUME_DIAMOND, costMoney);

            playerData.addDiamond(-costMoney);
            clientEvent.dispatchEvent('updateDiamond');
        }

        playerData.addBuyTimes(itemId, isUseDiamond);
        clientEvent.dispatchEvent('updateBuyTimes', itemId);

        //this.buyCakeTimesForLevelUp++;

        //
        var addIdx = playerData.addCakeToWorkbench(itemId);
        if (addIdx !== -1) {
            clientEvent.dispatchEvent('updateWorkbench', addIdx, true);
        }

        //非引导状态下，检查是否支持分享
        if (!guideLogic.isPlayingGuide()) {
            this.getOpenRewardType(constants.SHARE_FUNCTION.LEVEL_UP, (err, type) => {
                if (type !== constants.OPEN_REWARD_TYPE.NULL) {
                    //之前
                    //if (this.buyCakeTimesForLevelUp > 10 && formula.isHitWithPercent(10)) {
                    //当前
                    if (formula.isHitWithPercent(10)) {
                        //if (1) {
                        let random = Math.floor(Math.random() * MAX_RANDOM);

                        let updateLevelNum = 0; //升级的等级数
                        if (random <= 9) {
                            updateLevelNum = constants.LEVEL_UP[0];
                        } else if (random > 9 && random <= 14) {
                            updateLevelNum = constants.LEVEL_UP[1];
                        } else {
                            updateLevelNum = constants.LEVEL_UP[2];
                        }

                        let targetLevel = Number(itemId) + Number(updateLevelNum);

                        let unlockCakeLevel = playerData.getUnlockLevel();
                        if (targetLevel < unlockCakeLevel) {
                            this.showCakeLevelUpUI(addIdx, itemId, targetLevel);
                        }

                        if (random <= 7) {
                            // 触发免费蛋糕的购买，前提是必须要拥有该buff
                            let freeBuff = this.getBuff(constants.BUFF_TYPE.FREE_CAKE);
                            if (freeBuff) {
                                playerData.nextCakeFree = true;
                                clientEvent.dispatchEvent('updateFreeCake', itemId);
                            }
                        }
                    }
                }
            });
        }


        return true;
    },

    /**
     * 免费购买蛋糕
     * @param {String} itemId 
     */
    buyCakeFree(itemId) {
        if (!playerData.hasPosAtWorkbench()) {
            cc.gameSpace.showTips(i18n.t('showTips.noVacantSeat'));
            return false;
        }

        var addIdx = playerData.addCakeToWorkbench(itemId);
        if (addIdx !== -1) {
            clientEvent.dispatchEvent('updateWorkbench', addIdx, true);
        }

        return true;

    },

    /**
     * 显示免费升级界面
     * @param {Number} workbenchIdx 
     * @param {number} cakeId 
     * @param {number} targetLevel 目标蛋糕等级
     */
    showCakeLevelUpUI(workbenchIdx, cakeId, targetLevel) {
        cc.gameSpace.uiManager.showSharedDialog('dialog/levelUp', 'levelUp', [workbenchIdx, cakeId, targetLevel]);

        // resourceUtil.createUI('dialog/levelUp', (err, node) => {
        //     if (err) {
        //         return;
        //     }

        //     node.zIndex = constants.ZORDER.DIALOG;

        //     let levelUp = node.getComponent('levelUp');
        //     levelUp.setInfo(workbenchIdx, cakeId);
        // });
    },

    /**
     * 将商品进行上架
     * @param {Number} workbenchIdx 工作台位置
     * @param {Number} counterIdx 货架位置
     * 
     */
    pushCakeToCounter(workbenchIdx, counterIdx) {
        let oldWorkbenchIdx = playerData.counter[counterIdx];
        if (playerData.pushCakeToCounter(workbenchIdx, counterIdx)) {
            //上架成功
            //更新数值
            // clientEvent.dispatchEvent('updateMakeMoney');

            //通知已有旧的更新
            if (oldWorkbenchIdx !== undefined && oldWorkbenchIdx !== null && oldWorkbenchIdx >= 0) {
                //已有旧的，需要保存下，等会通知更新
                clientEvent.dispatchEvent('updateWorkbench', oldWorkbenchIdx);
            }

            //通知新的刷新
            clientEvent.dispatchEvent('updateWorkbench', workbenchIdx);

            //通知刷新货架
            clientEvent.dispatchEvent('updateCounter', counterIdx);

            //播放上架声音
            cc.gameSpace.audioManager.playSound('counter', false);
        }
    },

    /**
     * 将蛋糕进行回收
     * @param {Number} workbenchIdx 
     */
    recoveryCake(workbenchIdx) {
        let price = playerData.recoveryCake(workbenchIdx);
        if (price !== -1) {
            //通知刷新工作台
            clientEvent.dispatchEvent('updateWorkbench', workbenchIdx);

            //刷新金币数量
            clientEvent.dispatchEvent('updateGold');
        }

        return price;
    },

    /**
     * 将商品从货架上移除下来
     * @param {Number}} workbenchIdx 工作台上索引
     */
    takeOffCakeFromCounter(workbenchIdx) {
        if (!playerData.workbench[workbenchIdx]) {
            //该工作台上的物品并不存在，可能索引有问题？？
            console.error('takeOffCakeFromCounter failed! item was not existed!');
            return;
        }

        let counterIdx = playerData.takeOffCakeFromCounterByWorkbenchIdx(workbenchIdx);
        if (counterIdx !== -1) {
            //刷新下数值
            // clientEvent.dispatchEvent('updateMakeMoney');

            //通知新的刷新
            clientEvent.dispatchEvent('updateWorkbench', workbenchIdx);

            //通知刷新货架
            clientEvent.dispatchEvent('updateCounter', counterIdx);
        } else {
            //下架失败？并没有该商品？？刷新下界面？
            clientEvent.dispatchEvent('updateWorkbench', workbenchIdx);
        }
    },

    /**
     * 将蛋糕出售
     * @param {string} cakeId 蛋糕id
     * @param {Number} costTime 每个回合消耗多久
     */
    sellingCake(cakeId, costTime) {
        let addGold = 0;
        let cakeInfo = localConfig.queryByID('cake', cakeId);
        if (cakeInfo) {
            addGold = cakeInfo.sellingPrice * costTime;

            //数据同步
            let now = Date.now();
            if (!this.lastSyncTime || now - this.lastSyncTime >= 10000) { //每10秒同步一次？
                playerData.addGold(addGold);
                this.lastSyncTime = now;
            } else {
                playerData.addGoldWithoutSave(addGold);
            }


            this.finishTask(constants.DAILY_TASK_TYPE.SELLING, 1);

            //通知金币刷新
            clientEvent.dispatchEvent('updateGold');
        }

        return addGold;
    },

    /**
     * 签到
     */
    sign() {
        let now = utils.getDay();
        let lastSignInfo = playerData.getDailySignInfo();
        let signTimes = 1; //默认为第一次签到
        if (lastSignInfo) {
            // if (now <= lastSignInfo.lastSignDay) {
            //     return null;
            // }
            if (utils.getDeltaDays(lastSignInfo.lastSignDay, now) <= 0) { //已经签到
                return null;
            }

            signTimes = lastSignInfo.signTimes + 1;

            if (signTimes > 7) { //已经超过7天
                signTimes = 1;
            }
        }

        let signInfo = localConfig.queryByID('dailySign', signTimes);
        if (!signInfo) {
            return null;
        }

        playerData.saveDailySignInfo(now, signTimes);

        switch (signInfo.type) {
            case constants.REWARD_TYPE.DIAMOND:
                this.addDiamond(signInfo.amount);
                cc.gameSpace.audioManager.playSound('sell', false);
                break;
            case constants.REWARD_TYPE.GOLD:
                this.addGold(signInfo.amount);
                cc.gameSpace.audioManager.playSound('sell', false);
                break;
        }

        return signInfo;
    },

    /**
     *  判断今天是否已经领取
     */
    isTodayHadSignin() {
        let now = utils.getDay();
        let lastSignInfo = playerData.getDailySignInfo();
        if (lastSignInfo) {
            if (utils.getDeltaDays(lastSignInfo.lastSignDay, now) <= 0) { //已经签到
                return true;
            }
        }

        return false;
    },

    /**
     * 完成每日任务
     * @param {Number} taskType 完成类型 
     * @param {Number} finishNumber 完成数量
     */
    finishTask(taskType, finishNumber) {
        //检查是否需要清空任务完成情况列表
        playerData.isNeedClearDailyTask();

        let ret = playerData.finishTask(taskType, finishNumber);

        if (ret.result) {
            if (ret.arrUpdateTask && ret.arrUpdateTask.length > 0) {
                clientEvent.dispatchEvent('updateTask', ret.arrUpdateTask);
            }


            if (ret.hasTaskFinished) {
                clientEvent.dispatchEvent('taskFinished');
            }
        }
    },

    /**
     * 领取任务奖励
     * @param {String} taskId 
     */
    getTaskReward(taskId) {
        let taskStatus = playerData.getTaskStatusById(taskId);

        if (!taskStatus || taskStatus.isGet) {
            return false;
        }

        let taskTemplate = localConfig.queryByID('dailyTask', taskId);
        if (!taskTemplate) {
            cc.gameSpace.showTips(i18n.t('showTips.taskNotExist'));
            return false;
        }

        if (taskStatus.finishNumber < taskTemplate.number) {
            cc.gameSpace.showTips(i18n.t('showTips.taskNotCompleted'));
            return false;
        }

        playerData.markTaskRewardGet(taskId);

        // let rewardValue = taskTemplate.rewardValue;
        // if (isDoubleReward) {
        //     rewardValue *= 2;
        // }

        // switch (taskTemplate.rewardType) {
        //     case constants.REWARD_TYPE.DIAMOND:
        //         clientEvent.dispatchEvent('showFlyReward', constants.REWARD_TYPE.DIAMOND, function(){
        //             playerData.addDiamond(rewardValue);
        //             clientEvent.dispatchEvent('updateDiamond');
        //         }, this);
        //         break;
        //     case constants.REWARD_TYPE.GOLD:
        //         clientEvent.dispatchEvent('showFlyReward', constants.REWARD_TYPE.GOLD, function(){
        //             playerData.addGold(rewardValue);
        //             clientEvent.dispatchEvent('updateGold');
        //         }, this);
        //         break;
        // }

        return true;
    },

    /**
     * 发起分享
     * @param {Number} type 转发类型，普通 or 群排行？
     * @param {Number} fun 来源于哪个功能的分享
     * @param {Object} objQuery 查询字符串
     * @param {Function} callback 回调函数 
     */
    share(type, fun, objQuery, callback) {
        callback && callback();
    },


    /**
     * 观看广告
     * @param {string} fun 
     * @param {number} maxTimes 
     * @param {function} callback 
     */
    watchAd(fun, maxTimes, adType, callback) {
        if(typeof wx != "undefined")
        {
            console.log("wx调用播放广告")
        }
        callback && callback(null, true);
    },

    navigateToOtherGame(appid)
    {
        if(typeof wx != "undefined")
        {
            console.log("wx转到其它小游戏")
            
        }
    },

    showFlyReward(rewardType, callback, target) {
        resourceUtil.createUI('dialog/flyReward', function(err, node) {
            if (err) {
                if (callback) {
                    callback.apply(target);
                }
                return;
            }

            node.zIndex = constants.ZORDER.REWARD;
            let rewardScript = node.getComponent('flyReward');
            rewardScript.setInfo(rewardType === constants.REWARD_TYPE.GOLD);
            rewardScript.setEndListener(callback, target);
        });
    },

    showItemReward(spriteFrame, worldPos, callback, target) {
        resourceUtil.createEffect('ui/showReward/showReward', function(err, node) {
            if (err) {
                if (callback) {
                    callback.apply(target, [err, node]);
                }
                return;
            }

            let nodePos = node.parent.convertToNodeSpaceAR(worldPos);
            node.position = nodePos;
            node.zIndex = constants.ZORDER.REWARD;
            node.getChildByName('texture').getComponent(cc.Sprite).spriteFrame = spriteFrame;
            let ani = node.getComponent(cc.Animation);
            ani.on('finished', function() {
                node.destroy();

                if (callback) {
                    callback.apply(target);
                }
            }, this);

            ani.play('showReward');
        });
    },

    /**
     * 场景暂停控制
     */
    pauseScene() {
        clientEvent.dispatchEvent('activeScene', false);

        this.pauseStartTime = playerData.getCurrentTime();
    },

    /**
     * 场景恢复控制
     */
    resumeScene() {
        let endTime = playerData.getCurrentTime();
        let offsetTime = Math.floor((endTime - this.pauseStartTime) / 1000);
        let doubleTime = playerData.getAccelerateTime();

        //双倍时间调整，旧的先扣除掉，新的统一加上
        let doubleSpareTime = doubleTime - offsetTime;
        doubleSpareTime = doubleSpareTime > 0 ? doubleSpareTime : 0;
        let costTime = doubleTime - doubleSpareTime;
        doubleSpareTime += playerData.getLotteryAccelerateTime();
        playerData.saveAccelerateTime(doubleSpareTime);
        playerData.saveLotteryAccelerateTime(0);

        //将暂停所消耗的金币加上
        var currentMakeMoneySpeed = playerData.getMakeMoneySpeed(); //当前赚钱速度

        let addGold = offsetTime * currentMakeMoneySpeed;
        if (addGold > 0) {
            if (costTime > 0) {
                addGold += costTime * currentMakeMoneySpeed;
            }

            playerData.addGold(addGold);

            clientEvent.dispatchEvent('updateGold');
        }

        clientEvent.dispatchEvent('activeScene', true);

        return true;
    },

    /**
     * 检查是否有某种buff
     * @param {number} type 
     */
    getBuff(type) {
        let buffInfo = localConfig.getBuffByType(type);
        if (!buffInfo) {
            return null;
        }

        return null;
    },

    //获得最优蛋糕，用于主界面自动筛选最便宜的蛋糕让用户购买
    getOptimalCake() {
        let unlockLevel = playerData.getUnlockLevel();
        let startLevel = unlockLevel - 4;
        let endLevel = startLevel - 15;
        endLevel = endLevel <= 0 ? 1 : endLevel;

        if (startLevel <= 0) {
            startLevel = 1; //返回最低级蛋糕
        }

        //开始遍历，求取最佳值
        let minCost = -1;
        let minLevel = -1;
        while (startLevel >= endLevel) {
            var itemInfo = localConfig.queryByID('cake', startLevel);
            let buyTimes = playerData.getBuyTimesByItemId(startLevel, false);
            let costMoney = 0;
            if (startLevel.toString() !== constants.BASE_CAKE_ID) {
                costMoney = formula.getCakeBuyingPrice(itemInfo.buyingPrice, buyTimes);
            } else {
                costMoney = formula.getBaseCakeBuyingPrice(itemInfo.buyingPrice, buyTimes);
            }

            if (minCost === -1 || minCost > costMoney * Math.pow(2, minLevel - startLevel)) {
                minCost = costMoney;
                minLevel = startLevel;
            }

            startLevel--;
        }

        return minLevel;
    },

    /**
     * 根据功能获得对应的打开奖励类型 广告 分享 或者没有？
     * @param {String} funStr
     * @param {Function} callback
     */
    getOpenRewardType(funStr, callback) {
        callback(null, constants.OPEN_REWARD_TYPE.AD);
    },

    /**
     * 发起分享
     * @param {String} funStr 来源于哪个功能的分享
     * @param {Object} objQuery 查询字符串
     * @param {Function} callback 回调函数 
     * @param {Boolean} isShowConfirmAfterFailed 如果失败，是否跳出弹窗让其重试 微信专用
     */
    share(funStr, objQuery, callback, isShowConfirmAfterFailed) {
        // let shareInfo = dynamicData.getRandShareInfo();

        // let shareImgFileName = shareInfo.imgurl.substr(shareInfo.imgurl.lastIndexOf('/') + 1);
        // objQuery.source = playerData.userId;
        // objQuery.shareImg = shareImgFileName;
        // let query = '';
        // for (let key in objQuery) {
        //     if (query !== '') {
        //         query += '&';
        //     }
        //     if (objQuery.hasOwnProperty(key)) {
        //         query += key + '=' + objQuery[key];
        //     }
        // }


        // if (cc.gameSpace.SDK === 'wx') {
        //     //微信回调有对应的回调机制
        //     if (typeof(isShowConfirmAfterFailed) === 'undefined' && callback) {
        //         isShowConfirmAfterFailed = true;
        //     }

        //     let _this = this;
        //     wxAdapter.share(funStr, shareInfo.desc, shareInfo.imgurl, query, function() {
        //         _this.finishTask(constants.DAILY_TASK_TYPE.SHARE, 1);
        //         let arrArgs = [];
        //         for (let idx = 0; idx < arguments.length; idx++) {
        //             arrArgs.push(arguments[idx]);
        //         }

        //         //没有则正常回调
        //         callback.apply(null, arrArgs);
        //     }, isShowConfirmAfterFailed);
        // } else {
        if (callback) {
            callback();
        }
        // }
    },

    //分享功能是否开启
    isShareOpen() {
        return false;
    },

    addGold(num) {
        playerData.addGold(num);
        clientEvent.dispatchEvent('updateGold');
    },

    addDiamond(num) {
        playerData.addDiamond(num);
        clientEvent.dispatchEvent('updateDiamond');
    },

    /**
     * 自定义事件统计
     */
    customEventStatistics(eventType, objParams) {
        eventType = eventType.toString();

        cc.log(`##### eventType:${eventType} , objParams:`, objParams);
        if (!objParams) {
            objParams = {};
        }

        objParams.uid = playerData.userId;
        objParams.isNewBee = playerData.isNewBee;

        if (window.cocosAnalytics) {
            cocosAnalytics.CACustomEvent.onStarted(eventType, objParams);
        }
    },

    requestWithPost(url, data, callback) {
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if (xhr.status >= 200 && xhr.status < 400) {
                    let dataObj = xhr.responseText;
                    try {
                        dataObj = JSON.parse(xhr.responseText);
                    } catch (exception) {
                        console.error(xhr.responseText);
                    }
                    callback(null, dataObj);
                } else {
                    callback('failed', xhr.status);
                }
            }
        };

        xhr.open("POST", url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        // xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
        xhr.send(JSON.stringify(data));
    },
});

var shareLogic = new GameLogic();
shareLogic.onLoad();
module.exports = shareLogic;