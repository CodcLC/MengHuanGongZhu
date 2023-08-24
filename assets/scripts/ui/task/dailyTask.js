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
const clientEvent = require('clientEvent');
const constants = require('constants');
const resourceUtil = require('resourceUtil');
const gameLogic = require('gameLogic');

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

        content: cc.Node,

        pfbTaskItem: cc.Prefab
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {

    },

    show () {
        resourceUtil.updateNodeRenderers(this.node);
        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.DAILY_TASK_SHOW, {});
    },

    onEnable () {
        this.initList();
    },

    initList () {
        let arrTask = [];
        let tbTask = localConfig.getTable('dailyTask');
        for (var taskId in tbTask) {
            let task = tbTask[taskId];
            task.taskId = taskId;

            task.taskStatus = playerData.getTaskStatusById(taskId);
            arrTask.push(task);
        }

        arrTask.sort((taskA, taskB)=>{
            let isAFinish = taskA.taskStatus && taskA.taskStatus.finishNumber >= taskA.number;
            let isAGet = taskA.taskStatus && taskA.taskStatus.isGet;
            let isBFinish = taskB.taskStatus && taskB.taskStatus.finishNumber >= taskB.number;
            let isBGet = taskB.taskStatus && taskB.taskStatus.isGet;

            if (isAFinish && isBFinish) { //A跟B都完成了，但都未领取奖励
                if (!isAGet && isBGet) {
                    return -1;
                } else if (isAGet && !isBGet) {
                    return 1;
                } else {
                    return taskA.taskId - taskB.taskId;
                }
            } else if (isAFinish && !isBFinish) {
                if (!isAGet) {
                    return -1;
                }

                return 1;
            } else if (!isAFinish && isBFinish) {
                if (!isBGet) {
                    return 1;
                }

                return -1;
            } else {
                //A跟B都未完成
                return taskA.taskId - taskB.taskId;
            }

        });

        
        for (let index = 0; index < arrTask.length; index++) {
            let task = arrTask[index];
        
            let node = null;
            if (this.content.children.length > index) {
                node = this.content.children[index];
            } else {
                node = cc.instantiate(this.pfbTaskItem);
                node.parent = this.content;
            }

            let taskItem = node.getComponent('dailyTaskItem');
            taskItem.setInfo(task);
        }
    },

    onBtnCloseClick () {
        cc.gameSpace.audioManager.playSound('click', false);
        
        // this.node.active = false;
        cc.gameSpace.uiManager.hideSharedDialog('task/dailyTask');
    },

    // update (dt) {},
});
