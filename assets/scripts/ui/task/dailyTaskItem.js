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
const gameLogic = require('gameLogic');
const constants = require('constants');
const clientEvent = require('clientEvent');
const i18n = require('LanguageData');

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

        spReward: cc.Sprite,
        lbReward: cc.Label,

        imgGold: cc.SpriteFrame,
        imgDiamond: cc.SpriteFrame,

        progress: cc.ProgressBar,
        lbProgress: cc.Label,

        nodeBtnGet: cc.Node,

        lbDesc: cc.Label,

        nodeGetted: cc.Node,

        imgBlueBg: cc.SpriteFrame,
        imgYellowBg: cc.SpriteFrame,
        spBg: cc.Sprite
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start() {

    },
    onEnable() {
        clientEvent.on('updateTask', this.updateTask, this);
    },

    onDisable() {
        clientEvent.off('updateTask', this.updateTask, this);
    },

    setInfo(taskTemplate) {
        this._taskTemplate = taskTemplate;

        this.refreshUI();
    },

    refreshUI() {
        if (this._taskTemplate.rewardType === constants.REWARD_TYPE.DIAMOND) {
            this.spReward.spriteFrame = this.imgDiamond;
        } else {
            this.spReward.spriteFrame = this.imgGold;
        }

        this.lbReward.string = this._taskTemplate.rewardValue;

        this.lbDesc.string = i18n.t('taskData.' + this._taskTemplate.desc);

        let current = 0;
        let taskStatus = playerData.getTaskStatusById(this._taskTemplate.taskId);
        if (taskStatus) {
            current = taskStatus.finishNumber;
            current = current > this._taskTemplate.number ? this._taskTemplate.number : current;
            this.progress.progress = current / this._taskTemplate.number;
            this.lbProgress.string = current + '/' + this._taskTemplate.number;
        } else {
            this.progress.progress = 0;
            this.lbProgress.string = '0/' + this._taskTemplate.number;
        }

        this.spBg.spriteFrame = this.imgYellowBg;
        if (taskStatus && taskStatus.isGet) {
            this.nodeBtnGet.active = false;

            // this.lbTaskStatus.node.active = true;
            // this.lbTaskStatus.string = '已领取';
            this.nodeGetted.active = true;
            this.spBg.spriteFrame = this.imgBlueBg;
        } else if (current < this._taskTemplate.number) {
            //未完成
            this.nodeBtnGet.active = true;


            this.nodeBtnGet.getComponent(cc.Button).interactable = false;
            // this.lbTaskStatus.node.active = true;
            // this.lbTaskStatus.string = '未完成';
            this.nodeGetted.active = false;
        } else {
            this.nodeBtnGet.active = true;
            this.nodeBtnGet.getComponent(cc.Button).interactable = true;
            // this.lbTaskStatus.node.active = false;
            this.nodeGetted.active = false;
        }
    },

    onBtnGetClick() {
        // gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.DAILY_TASK_REWARD_CLICK, {taskId: this._taskTemplate.taskId});
        // this.reward(false);

        if (gameLogic.getTaskReward(this._taskTemplate.taskId)) {
            cc.gameSpace.uiManager.showSharedDialog('dialog/showReward', 'showReward', [constants.SHARE_FUNCTION.TASK, this._taskTemplate.rewardType, this._taskTemplate.rewardValue, true, () => {

            }]);

            this.refreshUI();
            clientEvent.dispatchEvent('taskFinished');
        }
    },

    /**
     * 是否发放奖励
     * @param {Boolean} isDouble 是否双倍 
     */
    reward(isDouble) {
        //领取奖励
        if (gameLogic.getTaskReward(this._taskTemplate.taskId, isDouble)) {
            this.refreshUI();
            clientEvent.dispatchEvent('taskFinished');
        }
    },

    updateTask(arrTask) {
        let isFind = false;
        for (var idx = 0; idx < arrTask.length; idx++) {
            if (arrTask[idx] === this._taskTemplate.taskId) {
                isFind = true;
                break;
            }
        }

        if (isFind) {
            this.refreshUI();
        }
    },

    // update (dt) {},
});