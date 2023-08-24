/**
 * Copyright (c) 2017 Xiamen Yaji Software Co.Ltd. All rights reserved.
 */
var utils = require('utils');
var i18n = require("LanguageData");
var constants = require("constants");
var localConfig = require("localConfig");
let configuration = require('configuration');

var GameData = cc.Class({
    properties: {

    },

    onLoad() {
        this.dataVersion = '';
        this.userId = "";
        this.nickName = "";
        this.avatar = "";
        this.support = [];
        this.isNewBee = false;
        // configuration.setUserId('tmp'); //TODO 当前还没有接入账号系统，所以uid为固定值
        // this.loadFromCache();
    },

    loadFromCache() {
        //从本地缓存中读取数据
        //读取数据版本号
        let dataVersion = configuration.getConfigData(constants.LOCAL_CACHE.DATA_VERSION);
        if (dataVersion) {
            this.dataVersion = dataVersion;
        } else {
            this.dataVersion = '';
        }

        //读取工作台数据
        let workbenchJsonStr = configuration.getConfigData(constants.LOCAL_CACHE.WORKBENCH);
        if (workbenchJsonStr !== '') {
            let workbench = [];
            try {
                workbench = JSON.parse(workbenchJsonStr);
            } catch (e) {
                workbench = [];
            }

            this.workbench = workbench;
        } else {
            this.workbench = [];
        }

        //读取玩家基础数据
        let playerStr = configuration.getConfigData(constants.LOCAL_CACHE.PLAYER);
        if (playerStr !== '') {
            let playerObj = {};
            try {
                playerObj = JSON.parse(playerStr);
            } catch (e) {
                playerObj = {};
            }

            this.playerInfo = playerObj;

            if (!this.playerInfo.createDate) {
                this.playerInfo.createDate = new Date();
            }

        } else {
            this.playerInfo = {};
            this.playerInfo.createDate = new Date();
            this.isNewBee = true; //表名这玩家新来的~~
        }

        //如果没有金币，表示新玩家？给予基础奖励？
        if (!this.playerInfo.hasOwnProperty('gold')) {
            this.playerInfo.gold = 3000; //初始金币3000
        }

        //读取蛋糕购买次数相关数据
        let buyTimesStr = configuration.getConfigData(constants.LOCAL_CACHE.BUYTIMES);
        if (buyTimesStr !== '') {
            let buyTimesObj = {};
            try {
                buyTimesObj = JSON.parse(buyTimesStr);
            } catch (e) {
                buyTimesObj = {};
            }

            this.buyTimes = {};
            //检查下旧数据是否需要进行转换
            for (var itemId in buyTimesObj) {
                if (buyTimesObj.hasOwnProperty(itemId)) {
                    let value = buyTimesObj[itemId];
                    if (typeof(value) === 'number') {
                        this.buyTimes[itemId] = { gold: value };
                    } else {
                        this.buyTimes[itemId] = value;
                    }
                }
            }

            // this.buyTimes = buyTimesObj;
        } else {
            this.buyTimes = {};
        }

        //读取每日任务相关数据
        let dailyTaskStr = configuration.getConfigData(constants.LOCAL_CACHE.DAILY_TASK);
        if (dailyTaskStr !== '') {
            this.dailyTask = {};
            try {
                this.dailyTask = JSON.parse(dailyTaskStr);
            } catch (e) {
                this.dailyTask = {};
            }
            // this.buyTimes = buyTimesObj;
        } else {
            this.dailyTask = {};
        }

        //读取混杂相关数据
        let settingsStr = configuration.getConfigData(constants.LOCAL_CACHE.SETTINGS);
        if (settingsStr !== '') {
            this.settings = {};
            try {
                this.settings = JSON.parse(settingsStr);
            } catch (e) {
                this.settings = {};
            }
            // this.buyTimes = buyTimesObj;
        } else {
            this.settings = {};
        }

        //读取本地相关临时数据，不会与服务端做同步操作
        let tmpStr = configuration.getConfigData(constants.LOCAL_CACHE.TMP_DATA);
        if (tmpStr !== '') {
            this.tmpData = {};
            try {
                this.tmpData = JSON.parse(tmpStr);
            } catch (e) {
                this.tmpData = {};
            }
        } else {
            this.tmpData = {};
        }
    },

    /**
     * 获得玩家金币
     */
    getGold() {
        if (this.playerInfo.hasOwnProperty('gold')) {
            return this.playerInfo.gold;
        }

        return 0;
    },

    /**
     * 获得玩家钻石
     */
    getDiamond() {
        if (this.playerInfo.hasOwnProperty('diamond')) {
            return this.playerInfo.diamond;
        }

        return 0;
    },

    getUnlockLevel() {
        if (this.playerInfo.hasOwnProperty('unlockLevel')) {
            return this.playerInfo.unlockLevel;
        }

        return 1;
    },

    /**
     * 获取当前每日签到信息
     * @return {Object|null} 返回信息对象，如果没有任何签到信息则返回null
     */
    getDailySignInfo() {
        let ret = null;
        if (this.playerInfo.hasOwnProperty('dailySign')) {
            let arrInfo = this.playerInfo.dailySign.split('@');
            if (arrInfo.length >= 2) {
                ret = {};
                ret.lastSignDay = arrInfo[0]; //最近一次签到日期
                ret.signTimes = Number(arrInfo[1]) || 0; //已经签到的天数（超过7天后重新循环）
            }
        }

        return ret;
    },

    /**
     * 保存签到信息
     * @param {String} dateStr 
     * @param {Number} times 
     */
    saveDailySignInfo(dateStr, times) {
        if (!this.playerInfo) {
            this.playerInfo = {};
        }

        this.playerInfo.dailySign = dateStr + '@' + times;

        configuration.setConfigDataWithoutSave(constants.LOCAL_CACHE.PLAYER, JSON.stringify(this.playerInfo));
    },

    /**
     * 获取最新结算的时间
     */
    getLastAddTime() {
        if (this.playerInfo.hasOwnProperty('lastAddTime')) {
            return this.playerInfo.lastAddTime;
        }

        return null;
    },

    //是否登录
    isLogin() {
        return this.userId && this.userId.length > 0;
    },

    /**
     * 交换蛋糕位置
     * @param {number} originIndex 
     * @param {number} targetIndex 
     */
    swapCake(originIndex, targetIndex) {
        if (!this.workbench) {
            return false;
        }

        if (originIndex >= constants.WORKBENCH_MAX_POS || targetIndex >= constants.WORKBENCH_MAX_POS) {
            return false;
        }

        if (this.workbench.length <= originIndex) {
            for (let idxOrigin = this.workbench.length; idxOrigin <= originIndex; idxOrigin++) {
                this.workbench[idxOrigin] = null;
            }
        }

        if (this.workbench.length <= targetIndex) {
            for (let idxTarget = this.workbench.length; idxTarget <= targetIndex; idxTarget++) {
                this.workbench[idxTarget] = null;
            }
        }

        var originItemId = this.workbench[originIndex];
        var targetItemId = this.workbench[targetIndex];

        this.workbench[targetIndex] = originItemId;
        this.workbench[originIndex] = targetItemId;

        //本地数据存储
        this.saveWorkbenchToLocalCache();

        return true;
    },

    /**
     * 蛋糕结合
     */
    combineCake(originIndex, targetIndex, callback) {
        if (!this.workbench) {
            callback(false);
            return false;
        }

        if (this.workbench.length <= originIndex) {
            callback(false);
            return false;
        }

        if (this.workbench.length <= targetIndex) {
            callback(false);
            return false;
        }

        let targetItemId = this.workbench[targetIndex];

        if (this.workbench[originIndex].toString() !== targetItemId.toString()) {
            callback(false);
            return false;
        }

        let itemInfo = localConfig.queryByID('cake', targetItemId);

        if (!itemInfo) {
            //未找到信息，不能判断下一步进化到那一步骤
            callback(false);
            return false;
        }

        if (!itemInfo.next || itemInfo.next === '') {
            callback(false, 'maxLevel');
            return false;
        }

        let nextInfo = localConfig.queryByID('cake', itemInfo.next);
        if (!nextInfo) {
            callback(false);
            return false;
        }

        this.workbench[targetIndex] = itemInfo.next;
        this.workbench[originIndex] = null; //将原有的置空

        let nextLevel = Number(itemInfo.next);
        let isUnlock = this.unlockCakeLevel(nextLevel);

        //本地数据存储
        this.saveWorkbenchToLocalCache();

        callback(true, isUnlock);
        return true;
    },

    unlockCakeLevel(nextLevel) {
        if (!this.playerInfo) {
            this.playerInfo = {};
        }

        if (!this.playerInfo.unlockLevel) {
            this.playerInfo.unlockLevel = 1;
        }

        if (nextLevel > this.playerInfo.unlockLevel) {
            let isOnlyMaxLevel = true;
            for (var idx = 0; idx < this.workbench.length; idx++) {
                if (nextLevel < Number(this.workbench[idx])) {
                    isOnlyMaxLevel = false;
                    break;
                }
            }

            this.playerInfo.unlockLevel = nextLevel;

            configuration.setConfigDataWithoutSave(constants.LOCAL_CACHE.PLAYER, JSON.stringify(this.playerInfo));

            return isOnlyMaxLevel;
        }

        return false;
    },

    /**
     * 判断是否唯一一个最高等级的，主要在蛋糕合并后，用于判断是否弹窗提示解锁成功的特效
     * @param {Number} targetIndex 目标index
     */
    isOnlyMaxLevel(targetIndex) {
        let targetItemId = Number(this.workbench[targetIndex]);

        let isOnlyMaxLevel = true;
        for (var idx = 0; idx < this.workbench.length; idx++) {
            if (idx !== targetIndex && targetItemId <= Number(this.workbench[idx])) {
                isOnlyMaxLevel = false;
                break;
            }
        }

        return isOnlyMaxLevel && this.getUnlockLevel() === targetItemId;
    },

    /**
     * 判断工作台是否还有多余的位置
     */
    hasPosAtWorkbench() {
        if (this.workbench.length < constants.WORKBENCH_MAX_POS) {
            //小于15个，肯定有位置了啦
            return true;
        }

        var hasEmptyPos = false;
        this.workbench.forEach((obj) => {
            if (!obj) {
                hasEmptyPos = true;

                return;
            }
        }, this);

        return hasEmptyPos;
    },

    /**
     * 增加蛋糕到工作台
     * @param {string} itemId 
     * @return {number} 添加到哪个位置
     */
    addCakeToWorkbench(itemId) {
        if (!this.hasPosAtWorkbench()) {
            return -1;
        }

        if (itemId) {
            itemId = itemId.toString(); //强制转换为字符串
        }

        for (let idx = 0; idx < this.workbench.length; idx++) {
            if (!this.workbench[idx]) {
                this.workbench[idx] = itemId;
                this.saveWorkbenchToLocalCache();
                return idx;
            }
        }

        this.workbench.push(itemId);
        this.saveWorkbenchToLocalCache();
        return this.workbench.length - 1;
    },

    /**
     * 将蛋糕加到指定位置，可能会覆盖原有信息
     * @param {Number} index 
     * @param {String} itemId 
     */
    addCakeToTargetIndex(index, itemId) {
        if (index >= constants.WORKBENCH_MAX_POS || index < 0) {
            //位置有异常
            return false;
        }

        this.workbench[index] = itemId;
        this.saveWorkbenchToLocalCache();

        return true;
    },

    addDataVersion() {
        var today = new Date().toLocaleDateString();
        var isAdd = false;
        if (this.dataVersion && typeof(this.dataVersion) === 'string') {
            var arrVersion = this.dataVersion.split("@");
            if (arrVersion.length >= 2) {
                if (arrVersion[0] === today) {
                    this.dataVersion = today + "@" + (Number(arrVersion[1]) + 1);
                    isAdd = true;
                }
            }
        }

        if (!isAdd) {
            this.dataVersion = today + "@1";
        }

        configuration.setConfigDataWithoutSave(constants.LOCAL_CACHE.DATA_VERSION, this.dataVersion);
    },

    /**
     * 将工作台数据存储到本地缓存中
     */
    saveWorkbenchToLocalCache() {
        this.addDataVersion();
        configuration.setConfigData(constants.LOCAL_CACHE.WORKBENCH, JSON.stringify(this.workbench));
    },

    /**
     * 保存玩家数据
     */
    savePlayerInfoToLocalCache() {
        this.addDataVersion();
        configuration.setConfigData(constants.LOCAL_CACHE.PLAYER, JSON.stringify(this.playerInfo));
    },

    /**
     * 保存购买次数
     */
    saveBuyTimesToLocalCache() {
        this.addDataVersion();
        configuration.setConfigData(constants.LOCAL_CACHE.BUYTIMES, JSON.stringify(this.buyTimes));
    },

    /**
     * 保存每日任务数据
     */
    saveDailyTaskToLocalCache() {
        this.addDataVersion();
        configuration.setConfigData(constants.LOCAL_CACHE.DAILY_TASK, JSON.stringify(this.dailyTask));
    },

    /**
     * 保存玩家设置相关信息
     */
    saveSettingsToLocalCache() {
        this.addDataVersion();
        configuration.setConfigData(constants.LOCAL_CACHE.SETTINGS, JSON.stringify(this.settings));
    },

    /**
     * 将临时数据保存到本地缓存中
     */
    saveTmpDataToLocalCache() {
        configuration.setConfigData(constants.LOCAL_CACHE.TMP_DATA, JSON.stringify(this.tmpData));
    },

    // /**
    //  * 判断工作台上的蛋糕是否正在出售中
    //  * @param {Number} workbenchIndex 工作台位置上的蛋糕
    //  */
    // isCakeSelling (workbenchIndex) {
    //     if (workbenchIndex >= constants.WORKBENCH_MAX_POS || workbenchIndex < 0) {
    //         //工作台位置有误
    //         return false;
    //     }

    //     return true;
    // },

    /**
     * 获取当前的赚钱速度
     * @return {Number} 赚钱速度值
     */
    getMakeMoneySpeed() {
        var sum = 0;

        this.workbench.forEach((itemId) => {
            if (!itemId || itemId === 'gift') {
                return;
            }

            let itemInfo = localConfig.queryByID('cake', itemId);

            if (!itemInfo) {
                //未找到配置信息
                return;
            }

            sum += itemInfo.sellingPrice;
        });


        return sum;
    },

    /**
     * 增加金币（主要是出售商品获得价格所调用接口）
     * @param {Number} gold 金币 
     */
    addGold(gold) {
        this.addGoldWithoutSave(gold);

        configuration.markModified();
    },

    addGoldWithoutSave(gold) {
        if (!this.playerInfo) {
            this.playerInfo = {};
        }

        if (!this.playerInfo.gold) {
            this.playerInfo.gold = 0;
        }

        this.playerInfo.gold += gold;
        this.playerInfo.lastAddTime = this.getCurrentTime();

        this.addDataVersion();
        configuration.setConfigDataWithoutSave(constants.LOCAL_CACHE.PLAYER, JSON.stringify(this.playerInfo));
    },

    /**
     * 增加砖石
     * @param {Number}} diamond 
     */
    addDiamond(diamond) {
        if (!this.playerInfo) {
            this.playerInfo = {};
        }

        if (!this.playerInfo.diamond) {
            this.playerInfo.diamond = 0;
        }

        this.playerInfo.diamond += diamond;

        this.savePlayerInfoToLocalCache();
    },

    /**
     * 增加购买次数
     * @param {string} itemId 
     * @param {boolean} isUseDiamond 是否为钻石方式
     */
    addBuyTimes(itemId, isUseDiamond) {
        if (this.buyTimes.hasOwnProperty(itemId)) {
            let objBuy = this.buyTimes[itemId];
            if (!isUseDiamond) {
                if (!objBuy.gold) {
                    objBuy.gold = 0;
                }

                objBuy.gold += 1;
            } else {
                if (!objBuy.diamond) {
                    objBuy.diamond = 0;
                }

                objBuy.diamond += 1;
            }

            this.buyTimes[itemId] = objBuy;
        } else {
            if (!isUseDiamond) {
                this.buyTimes[itemId] = { gold: 1 };
            } else {
                this.buyTimes[itemId] = { diamond: 1 };
            }
        }

        this.saveBuyTimesToLocalCache();
    },

    /**
     * 获取购买次数
     * @param {string} itemId 蛋糕id
     * @param {boolean} isUseDiamond 是否为钻石方式
     */
    getBuyTimesByItemId(itemId, isUseDiamond) {
        if (this.buyTimes.hasOwnProperty(itemId)) {
            if (!isUseDiamond) {
                return this.buyTimes[itemId].gold || 0;
            } else {
                return this.buyTimes[itemId].diamond || 0;
            }
        }

        return 0;
    },

    /**
     * 蛋糕回收
     * @param {Number} workbenchIndex 工作台所在位置
     */
    recoveryCake(workbenchIndex) {
        let itemId = this.workbench[workbenchIndex];

        if (!itemId) {
            //该工作台上的物品并不存在，可能索引有问题？？
            return -1;
        }

        let cake = localConfig.queryByID("cake", itemId);
        if (!cake) {
            //蛋糕不存在
            return -1;
        }

        this.playerInfo.gold += cake.buyingPrice;
        configuration.setConfigDataWithoutSave(constants.LOCAL_CACHE.PLAYER, JSON.stringify(this.playerInfo));

        this.workbench[workbenchIndex] = null;
        this.saveWorkbenchToLocalCache();

        cc.gameSpace.gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.RECYCLE_SUCCESS, { cakeId: itemId });

        return cake.buyingPrice;
    },

    /**
     * 检查是否需要清空每日任务完成清空列表
     */
    isNeedClearDailyTask() {
        let today = utils.getDay();
        if (!this.dailyTask || !this.dailyTask.hasOwnProperty('date')) {
            this.dailyTask = {};
            this.dailyTask.date = today;
            return true;
        }


        if (today !== this.dailyTask.date) {
            this.dailyTask = {};
            return true;
        }

        return false;
    },

    /**
     * 完成每日任务
     * @param {Number} taskType 完成类型 
     * @param {Number} finishNumber 完成数量
     */
    finishTask(taskType, finishNumber, callback) {
        if (!this.dailyTask) {
            this.dailyTask = {};
        }

        if (!this.dailyTask.tasks) {
            this.dailyTask.tasks = {};
        }

        let arrTasks = localConfig.getDailyTaskByType(taskType);
        if (!arrTasks || arrTasks.length <= 0) {
            return { result: false };
        }

        let ret = false;
        let hasTaskFinished = false;
        let arrUpdateTask = [];
        arrTasks.forEach((task) => {
            let taskId = task.taskId;

            let taskHow = this.dailyTask.tasks[taskId];

            if (!taskHow || !taskHow.finishNumber) {
                this.dailyTask.tasks[taskId] = { finishNumber: finishNumber };
                if (finishNumber >= task.number) {
                    hasTaskFinished = true;
                    cc.gameSpace.gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.DAILY_TASK_FINISHED, { taskId: taskId });
                }
                ret = true;

                arrUpdateTask.push(taskId);
            } else {
                if (taskHow.isGet || taskHow.finishNumber >= task.number) {
                    return;
                }

                taskHow.finishNumber += finishNumber;

                if (taskHow.finishNumber >= task.number) {
                    hasTaskFinished = true;

                    cc.gameSpace.gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.DAILY_TASK_FINISHED, { taskId: taskId });
                }
                ret = true;

                arrUpdateTask.push(taskId);
            }
        }, this);

        if (ret) {
            this.saveDailyTaskToLocalCache();
        }

        return { result: ret, hasTaskFinished: hasTaskFinished, arrUpdateTask: arrUpdateTask };
    },

    /**
     * 获取任务当前状况
     * @param {String} taskId 
     */
    getTaskStatusById(taskId) {
        if (!this.dailyTask || !this.dailyTask.tasks) {
            return null;
        }

        let task = this.dailyTask.tasks[taskId];
        if (!task) {
            return null;
        }

        return task;
    },

    /**
     * 检查是否有完成但还未领取的每日任务
     */
    hasFinishedAndNoGetTask() {
        this.isNeedClearDailyTask();

        if (!this.dailyTask || !this.dailyTask.tasks) {
            return false;
        }

        let ret = false;
        for (let key in this.dailyTask.tasks) {
            if (this.dailyTask.tasks.hasOwnProperty(key)) {
                let taskHow = this.dailyTask.tasks[key];
                if (taskHow.isGet) {
                    continue;
                }

                let task = localConfig.queryByID('dailyTask', key);
                if (!task) {
                    continue;
                }

                if (taskHow.finishNumber >= task.number) {
                    ret = true;
                    break;
                }
            }
        }

        return ret;
    },

    /**
     * 将蛋糕奖励标记为已领取
     * @param {String} taskId 
     */
    markTaskRewardGet(taskId) {
        if (!this.dailyTask || !this.dailyTask.tasks) {
            return false;
        }

        let taskStatus = this.dailyTask.tasks[taskId];
        if (!taskStatus) {
            return false;
        }

        taskStatus.isGet = true;

        this.saveDailyTaskToLocalCache();

        return true;
    },

    /**
     * 当数据同步完毕即，被覆盖的情况下，需要将数据写入本地缓存，以免数据丢失
     */
    saveAll() {
        configuration.setConfigDataWithoutSave(constants.LOCAL_CACHE.WORKBENCH, JSON.stringify(this.workbench));
        configuration.setConfigDataWithoutSave(constants.LOCAL_CACHE.PLAYER, JSON.stringify(this.playerInfo));
        configuration.setConfigDataWithoutSave(constants.LOCAL_CACHE.DATA_VERSION, this.dataVersion);
        configuration.setConfigDataWithoutSave(constants.LOCAL_CACHE.BUYTIMES, JSON.stringify(this.buyTimes));
        configuration.setConfigDataWithoutSave(constants.LOCAL_CACHE.DAILY_TASK, JSON.stringify(this.dailyTask));
        configuration.setConfigDataWithoutSave(constants.LOCAL_CACHE.SETTINGS, JSON.stringify(this.settings));
        configuration.setConfigDataWithoutSave(constants.LOCAL_CACHE.TMP_DATA, JSON.stringify(this.tmpData));
        configuration.save(); //强制保存
    },

    getFinishGuide() {
        if (this.playerInfo.hasOwnProperty('finishGuides')) {
            return this.playerInfo.finishGuides;
        }

        return [];
    },

    finishGuide(guideStep) {
        if (!this.playerInfo.finishGuides) {
            this.playerInfo.finishGuides = [];
        }

        if (this.playerInfo.finishGuides.indexOf(guideStep) === -1) {
            this.playerInfo.finishGuides.push(guideStep);
            this.savePlayerInfoToLocalCache();
        }
    },

    /**
     * 标记奖励为已领取
     * @param {Number} index 
     */
    getInviteReward(index) {
        if (!this.invitee || this.invitee.length <= index) {
            return false;
        }

        if (!this.settings) {
            this.settings = {};
        }

        if (!this.settings.invitee) {
            this.settings.invitee = {};
        }

        if (this.settings.invitee.hasOwnProperty(index)) {
            return false; //已经领取过
        }

        this.settings.invitee[index] = { isGet: true };

        this.saveSettingsToLocalCache();

        return true;
    },

    /**
     * 判断该邀请奖励是否领取过
     * @param {Number} index 
     */
    hasGetInviteReward(index) {
        if (!this.invitee || this.invitee.length <= index) {
            return false;
        }

        if (!this.settings || !this.settings.invitee) {
            return false;
        }

        if (!this.settings.invitee.hasOwnProperty(index)) {
            return false; //未领取过
        }

        return true;
    },

    /**
     * 获取玩家杂项值
     * @param {string} key 
     */
    getSetting(key) {
        if (!this.settings) {
            return null;
        }

        if (!this.settings.hasOwnProperty(key)) {
            return null;
        }

        return this.settings[key];
    },

    /**
     * 设置玩家杂项值
     * @param {string} key 
     * @param {*} value 
     */
    setSetting(key, value) {
        if (!this.settings) {
            this.settings = {};
        }

        this.settings[key] = value;

        this.saveSettingsToLocalCache();
    },

    getInvitee() {
        if (!this.invitee) {
            this.invitee = [];
        }

        return this.invitee;
    },

    getInviteByIndex(index) {
        if (!this.invitee || this.invitee.length <= index) {
            return null;
        }

        return this.invitee[index];
    },

    clear() {
        this.playerInfo = {};
        this.workbench = [];
        this.buyTimes = {};
        this.dailyTask = {};
        this.settings = {};
        this.tmpData = {};
        this.addDataVersion();
        this.saveAll();
    },

    /**
     * 保存加速剩余时间
     * @param {Number} time 
     */
    saveAccelerateTime(time) {
        this.setSetting(constants.SETTINGS_KEY.ACCELERATE, time);
    },

    /**
     * 保存抽奖获得的加速时间
     */
    saveLotteryAccelerateTime(time) {
        this.setSetting(constants.SETTINGS_KEY.LOTTERY_ACCELERATE, time);
    },

    /**
     * 保存自动合成的加速时间
     */
    saveCombineAutoTime(time) {
        this.setSetting(constants.SETTINGS_KEY.COMBINE_AUTO, time);
    },

    /**
     * 获取加速剩余时间
     */
    getAccelerateTime() {
        let accelerateTime = this.getSetting(constants.SETTINGS_KEY.ACCELERATE);

        if (!accelerateTime) {
            return 0;
        }

        return accelerateTime;
    },

    /**
     * 获取加速剩余时间
     */
    getLotteryAccelerateTime() {
        let accelerateTime = this.getSetting(constants.SETTINGS_KEY.LOTTERY_ACCELERATE);

        if (!accelerateTime) {
            return 0;
        }

        return accelerateTime;
    },

    /**
     * 获取自动合成剩余时间
     */
    getCombineAutoTime() {
        let combineAutoTime = this.getSetting(constants.SETTINGS_KEY.COMBINE_AUTO);
        if (!combineAutoTime) {
            return 0;
        }
        return combineAutoTime;
    },

    /**
     * 同步服务器时间
     */
    syncServerTime(serverTime) {
        this.serverTime = serverTime;
        this.localTime = Date.now();
    },

    /**
     * 获取当前时间
     */
    getCurrentTime() {
        // let diffTime = Date.now() - this.localTime;

        // return this.serverTime + diffTime;
        return Date.now();
    },

    /**
     * 检查某个功能的群分享，群是否已经分享过
     * @param {String} fun 
     * @param {String} gid 
     */
    isGroupSharedToday(fun, gid) {
        let groupShare = this.getSetting(constants.SETTINGS_KEY.GROUP_SHARE);
        if (!groupShare) {
            return false;
        }

        if (!groupShare.hasOwnProperty(fun)) {
            return false;
        }

        let dictGroup = groupShare[fun];
        if (!dictGroup.hasOwnProperty(gid)) {
            return false;
        }

        let today = utils.getDay();
        if (dictGroup[gid] !== today) {
            return false;
        }

        return true;
    },

    /**
     * 保存群今天已分享的信息
     * @param {String} fun 
     * @param {String} gid 
     */
    saveGroupSharedToday(fun, gid) {
        if (!this.settings) {
            this.settings = {};
        }

        let groupShare = {};
        if (this.settings.hasOwnProperty(constants.SETTINGS_KEY.GROUP_SHARE)) {
            groupShare = this.settings[constants.SETTINGS_KEY.GROUP_SHARE];
        }

        if (!groupShare.hasOwnProperty(fun)) {
            groupShare[fun] = {};
        }

        groupShare[fun][gid] = utils.getDay();

        this.setSetting(constants.SETTINGS_KEY.GROUP_SHARE, groupShare);
    },

    getAdMaxTimesByFun(fun) {
        let maxValue = 9999;
        switch (fun) {
            case constants.SHARE_FUNCTION.BALANCE:
                maxValue = constants.WATCH_AD_MAX_TIMES.BALANCE;
                break;
            case constants.SHARE_FUNCTION.LOVE_HEART:
                maxValue = constants.WATCH_AD_MAX_TIMES.LOVE_HEART;
                break;
            case constants.SHARE_FUNCTION.FREE_GOLD:
                maxValue = constants.WATCH_AD_MAX_TIMES.FREE_GOLD;
                break;
            case constants.SHARE_FUNCTION.ACCELERATE:
                maxValue = constants.WATCH_AD_MAX_TIMES.ACCELERATE;
                break;
            case constants.SHARE_FUNCTION.LOTTERY:
                maxValue = constants.WATCH_AD_MAX_TIMES.LOTTERY;
                break;
            case constants.SHARE_FUNCTION.CHOICE:
                maxValue = constants.WATCH_AD_MAX_TIMES.CHOICE;
                break;
            case constants.SHARE_FUNCTION.PICK_GAME:
                maxValue = constants.WATCH_AD_MAX_TIMES.PICK_GAME;
                break;
        }

        return maxValue;
    },

    /**
     * 检查某项功能是否还有观看广告的次数
     * @param {string} fun
     */
    hasAdTimes(fun) {
        let maxValue = this.getAdMaxTimesByFun(fun);

        if (maxValue <= 0) {
            return false;
        }

        let dictAdTimes = this.tmpData[constants.TMP_DATA_KEY.AD_TIMES];
        if (!dictAdTimes) {
            return true;
        }

        let time = dictAdTimes.today;
        let now = utils.getDay();
        if (!time || time !== now) {
            dictAdTimes = {};
            dictAdTimes.today = now;
            this.saveTmpDataToLocalCache();
            return true;
        }

        if (!dictAdTimes.hasOwnProperty(fun)) {
            return true;
        }

        let value = dictAdTimes[fun];

        return value < maxValue;
    },

    /**
     * 观看广告
     * @param {string} fun 
     * @param {number} times 
     */
    watchAd(fun, times) {
        if (!times) {
            times = 1;
        }

        let dictAdTimes = this.tmpData[constants.TMP_DATA_KEY.AD_TIMES];
        if (!dictAdTimes) {
            dictAdTimes = {};
        }

        let time = dictAdTimes.today;
        let now = utils.getDay();
        if (!time || time !== now) {
            dictAdTimes = {};
            dictAdTimes.today = now;
        }

        if (dictAdTimes.hasOwnProperty(fun)) {
            dictAdTimes[fun] += times;
        } else {
            dictAdTimes[fun] = times;
        }

        this.tmpData[constants.TMP_DATA_KEY.AD_TIMES] = dictAdTimes;

        this.saveTmpDataToLocalCache();
    },

    /**
     * 获得剩余抽奖次数
     * @param {Boolean} isMore 是否要获取看广告获取更多奖券的次数
     */
    getLotterySpareTimes(isMore) {
        let maxTimes = constants.LOTTERY_MAX_TIMES;
        if (isMore) {
            maxTimes = constants.LOTTERY_AD_MAX_TIMES;
        }
        let now = utils.getDay();
        let lottery = this.getSetting(constants.SETTINGS_KEY.LOTTERY);
        if (!lottery) {
            lottery = {};
        }

        if (!lottery.today || lottery.today !== now) {
            lottery = {};
            lottery.today = now;
            this.setSetting(constants.SETTINGS_KEY.LOTTERY, lottery);

            return maxTimes;
        }

        let currentTimes = lottery.times;
        if (isMore) {
            currentTimes = lottery.moreTimes;
        }

        if (!currentTimes) {
            currentTimes = 0;
        }

        let spareTimes = maxTimes - currentTimes;
        return spareTimes > 0 ? spareTimes : 0;
    },

    /**
     * 增加已抽奖次数
     * @param {Boolean} isMore 
     * @param {Number} times 
     */
    addLotteryTimes(isMore, times) {
        if (!times) {
            times = 1;
        }

        let now = utils.getDay();
        let lottery = this.getSetting(constants.SETTINGS_KEY.LOTTERY);
        if (!lottery) {
            lottery = {};
        }

        if (!lottery.today || lottery.today !== now) {
            lottery = {};
            lottery.today = now;
        }

        if (!isMore) {
            if (lottery.times) {
                lottery.times += times;
            } else {
                lottery.times = times;
            }
        } else {
            if (lottery.moreTimes) {
                lottery.moreTimes += times;
            } else {
                lottery.moreTimes = times;
            }
        }

        this.setSetting(constants.SETTINGS_KEY.LOTTERY, lottery);
    },

    /**
     * 获得好友援助列表
     */
    getSupportFriendList() {
        let ret = this.getSetting(constants.SETTINGS_KEY.SUPPORT);
        if (ret) {
            return ret;
        }

        return [];
    },

    setSupportFriendList(support) {
        this.setSetting(constants.SETTINGS_KEY.SUPPORT, support);
    },

    removeSupportFromFriendList(uid) {
        let ret = this.getSetting(constants.SETTINGS_KEY.SUPPORT);
        if (!ret) {
            return [];
        }

        let idxRet = -1;
        for (let idx = 0; idx < ret.length; idx++) {
            if (ret[idx] && ret[idx].uid === uid) {
                ret[idx] = null;
                idxRet = idx;
                break;
            }
        }

        this.setSetting(constants.SETTINGS_KEY.SUPPORT, ret);

        return idxRet;
    },

    /**
     * 好友前来援助
     * @param {Object} friendInfo 
     */
    addSupportFriend(friendInfo) {
        let supportList = this.getSupportFriendList();

        let idxRet = -1;
        friendInfo.spareTime = constants.SUPPORT_KEEP_TIME;
        for (let idx = 0; idx < supportList.length; idx++) {
            if (!supportList[idx]) {
                supportList[idx] = friendInfo;
                idxRet = idx;
                break;
            }
        }

        if (idxRet === -1) {
            idxRet = supportList.length;
            supportList.push(friendInfo);
        }

        this.setSetting(constants.SETTINGS_KEY.SUPPORT, supportList);

        return idxRet;
    },

    /**
     * 生成随机账户
     * @returns
     */
    generateRandomAccount() {
        this.userId = `${Date.now()}${0 | (Math.random() * 1000, 10)}`;
        configuration.setUserId(this.userId);
        return this.userId;
    }

});

var shareData = new GameData();
shareData.onLoad();
module.exports = shareData;