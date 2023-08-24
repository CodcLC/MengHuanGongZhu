const playerData = require('playerData');
const constants = require('constants');
const resourceUtil = require('resourceUtil');
const clientEvent = require('clientEvent');

const ZORDER_GUIDE = 999;

let GuideLogic = cc.Class({
    init() {
        this.isStart = false;

        this.clear();
    },

    start() {
        this.clearGuide();

        this.isStart = true;
        this.loadGuideStep();
        this.loadFinishGuide();
        this.enterGuide();
    },

    clear() {
        this.currentWaitEvent = '';
        this.isGuiding = false;
        this.isPlaying = false;
        this.currentSubGuide = null;
        this.finishGuideObj = {};
    },

    loadFinishGuide() {
        var arrGuides = playerData.getFinishGuide();
        if (arrGuides.length > 0) {

            arrGuides.forEach(function(guideId) {
                this.finishGuideObj[guideId] = true;
            }, this);
        }

        for (var idx = 0; idx < this.aryGuideSteps.length; idx++) {
            var guideId = this.aryGuideSteps[idx].id;
            var guideStep = this.aryGuideSteps[idx];
            guideStep.isFinish = this.finishGuideObj.hasOwnProperty(guideId) && this.finishGuideObj[guideId];
        }
    },

    enterGuide() {
        if (!this.isStart) {
            return;
        }

        if (!this.isGuiding) {
            this.findNewGuide();
        } else {
            this.checkGuide();
        }

        if (this.currentSubGuide !== null) {
            return true;
        }

        return false;
    },

    //步奏改变或者数据重置时需要先清理当前引导状况
    clearGuide() {
        if (this.currentSubGuide && this.currentSubGuide.type === constants.GUIDE_TYPE.WAIT_EVENT && this.callBackFunc) {
            clientEvent.off(this.currentSubGuide.param[0], this.callBackFunc);
        }
    },

    checkGuide() {
        if (this.isGuiding) { //正在进行新手引导
            if (this.isConditionFinish(this.currentSubGuide)) {
                if (!this.isPlaying) {
                    this.continueGuide();
                }
            } else if (this.isPlaying) { //如果面板改变了，并且当前正处于新手引导状态的话，先暂停
                this.pauseGuide();
            }

            return true;
        }

        return false;
    },

    findNewGuide: function() {
        for (var idx = 0; idx < this.aryGuideSteps.length; idx++) {
            var guideStep = this.aryGuideSteps[idx];
            if (!guideStep.isFinish) {
                // 避免进入没有满足条件的引导
                if (!this.isConditionFinish(guideStep.guideLs[0])) {
                    return false;
                }

                this.playTargetGuide(idx);
                return true;
            }
        }

        return false;
    },

    isNeedSkip() {
        if (this.currentGuide && this.currentGuide.hasOwnProperty("skipGuide")) {
            var fun = this.currentGuide.skipGuide.fun;
            return fun.apply(this.currentGuide.skipGuide.owner, this.currentGuide.skipGuide.param);
        }

        return false;
    },

    isNeedPass() {
        if (this.currentSubGuide && this.currentSubGuide.hasOwnProperty("passCondition")) {
            var fun = this.currentSubGuide.passCondition;
            return fun.apply(this.currentSubGuide.passConditionOwner, this.currentSubGuide.passConditionParam);
        }

        return false;
    },

    isConditionFinish(subGuide) {
        if (subGuide.hasOwnProperty("condition")) {
            return subGuide.condition.apply(subGuide.conditionOwner,
                subGuide.conditionParam);
        }

        return true;
    },

    getCurrentCanvas: function() {
        return cc.find("Canvas");
    },

    playTargetGuide(idx) {
        this.currentStepIndex = 0;
        this.currentGuide = this.aryGuideSteps[idx];

        console.log('### start guide: ', this.currentGuide.id);

        this.currentSubGuide = this.currentGuide.guideLs[this.currentStepIndex];
        if (this.isNeedSkip()) {
            this.finishGuide(true);
            return;
        }


        this.doPlay(this.currentGuide.guideLs[this.currentStepIndex]);
    },

    doPlay(subGuide) {
        this.currentSubGuide = subGuide;
        this.isGuiding = true;

        if (this.isNeedPass()) {
            this.finishGuide();
            return true;
        }

        if (!this.isConditionFinish(this.currentSubGuide)) {
            this.isPlaying = false;
            return;
        }

        if (subGuide.hasOwnProperty("beforeFun")) {
            var fun = subGuide.beforeFun;
            fun.apply(subGuide.beforeOwner, subGuide.beforeParam);
        }

        this.isPlaying = false;
        switch (subGuide.type) {
            case constants.GUIDE_TYPE.TRIGGER_EVENT:
                this.isPlaying = true;
                clientEvent.dispatchEvent(subGuide.param[0], subGuide.param[1]);

                //暂时为直接完成，后续考虑由事件回调回来
                this.finishGuide();
                break;
            case constants.GUIDE_TYPE.SPACE:
                this.finishGuide();
                break;
            case constants.GUIDE_TYPE.GUIDE:
                this.isPlaying = true;
                this.showGuidePanel(subGuide);
                break;
            case constants.GUIDE_TYPE.WAIT_EVENT:
                this.isPlaying = true;
                if (this.callBackFunc) {
                    //如果已有
                    clientEvent.off(this.currentWaitEvent, this.callBackFunc);
                    this.callBackFunc = null;
                    this.currentWaitEvent = '';
                }

                this.callBackFunc = function() {
                    clientEvent.off(subGuide.param[0], this.callBackFunc);

                    if (!this.currentSubGuide || this.currentSubGuide.type !== constants.GUIDE_TYPE.WAIT_EVENT ||
                        this.currentSubGuide.param[0] !== subGuide.param[0]) {
                        //如果不是自己当前正在等待的事件，则直接退出，不要继续处理
                        return;
                    }

                    this.callBackFunc = null;
                    this.currentWaitEvent = '';
                    this.finishGuide();
                }.bind(this);

                this.currentWaitEvent = subGuide.param[0];
                clientEvent.on(subGuide.param[0], this.callBackFunc);
                break;
            case constants.GUIDE_TYPE.GUIDE_ANI:
                clientEvent.dispatchEvent("showPanel", "guidePanel", subGuide.param[0]);
                this.finishGuide();
                break;
        }
    },

    showGuidePanel: function(subGuide) {
        if (this.isLoadGuideRes) {
            return false;
        }

        // console.log("guidePanel is valid:", cc.isValid(this.guidePanel));

        if (this.guidePanel === null || !cc.isValid(this.guidePanel)) {
            var _this = this;
            this.isLoadGuideRes = true;
            resourceUtil.createUI("guide/guide", function(err, guidePanel) {
                _this.guidePanel = guidePanel;
                _this.guidePanel.zIndex = ZORDER_GUIDE;
                _this.guidePanel.setPosition(0, 0);
                var guideScript = _this.guidePanel.getComponent("guide");
                guideScript.setGuideInfo(subGuide);

                _this.isLoadGuideRes = false;
            });
        } else {
            if (!this.guidePanel.parent) {
                this.getCurrentCanvas().addChild(this.guidePanel, ZORDER_GUIDE);
            }

            this.guidePanel.active = true;
            var guideScript = this.guidePanel.getComponent("guide");
            guideScript.setGuideInfo(subGuide);
        }
    },

    isPlayFirstFightGuide() {
        return this.isPlaying && this.currentGuide.id === constants.GUIDE_STEP.START;
    },

    isPlaySecondFightTechGuide() {
        return this.isPlaying && this.currentSubGuide.fightId && this.currentSubGuide.fightId === 1;
    },

    getCurrentSubGuide() {
        return this.currentSubGuide;
    },

    pauseGuide() {
        this.isPlaying = false;

        if (this.currentSubGuide.type === constants.GUIDE_TYPE.GUIDE) {
            this.hideGuidePanel();
        }

        if (this.currentSubGuide.isSkipAfterPause) {
            this.finishGuide();
        }
    },

    continueGuide() {
        this.isPlaying = true;

        this.doPlay(this.currentSubGuide);
    },

    isPlayingGuide() {
        return this.isPlaying;
    },

    /**
     * 是否正在进行蛋糕合并引导
     */
    isPlayingCombineGuide() {
        return this.isPlaying && this.currentSubGuide && this.currentSubGuide.combineGuide;
    },

    /**
     * 是否正在进行蛋糕上架引导
     */
    isPlayingPushCakeGuide() {
        return this.isPlaying && this.currentSubGuide && this.currentSubGuide.pushCakeGuide;
    },

    /**
     * 是否正在播放教程动画
     */
    isPlayGuideAni() {
        return this.isPlaying && (this.currentSubGuide.type === constants.GUIDE_TYPE.GUIDE_ANI ||
            (this.currentSubGuide.type === constants.GUIDE_TYPE.WAIT_EVENT &&
                this.currentSubGuide.param[0] === "onGuideAniPlayOver"));
    },

    hideGuidePanel: function() {
        if (this.guidePanel) {
            this.guidePanel.removeFromParent(false);
            this.guidePanel.active = false;
            this.isHideGuidePanel = true;
        }
    },

    /**
     * 完成引导，如事件点击完成
     * */
    finishGuide(isSkipBigGuide) {
        if (this.currentSubGuide) {
            switch (this.currentSubGuide.type) {
                case constants.GUIDE_TYPE.GUIDE:
                    this.hideGuidePanel();
                    break;
            }

            if (this.currentSubGuide.hasOwnProperty("afterFun")) {
                var fun = this.currentSubGuide.afterFun;
                fun.apply(this.currentSubGuide.afterOwner, this.currentSubGuide.afterParam);
            }

            if (this.currentSubGuide.hasOwnProperty("guideOver") ||
                this.currentStepIndex >= this.currentGuide.guideLs.length - 1 || isSkipBigGuide) {
                // 表示大步奏搞定了，，需要更新下数据
                if (!this.currentGuide.isFinish) {
                    this.currentGuide.isFinish = true;
                    var guideId = this.currentGuide.id;
                    this.finishGuideObj[guideId] = true;

                    playerData.finishGuide(guideId);
                }
            }

            if (this.currentStepIndex >= this.currentGuide.guideLs.length - 1 || isSkipBigGuide) {

                this.isGuiding = false;
                this.isPlaying = false;
                this.currentGuide = null;
                this.currentStepIndex = null;
                this.currentSubGuide = null;
                this.findNewGuide();
            } else {
                this.currentStepIndex++; //继续下一步操作
                this.currentSubGuide = this.currentGuide.guideLs[this.currentStepIndex];

                this.doPlay(this.currentSubGuide);
            }
        }
    },

    hasCakePushToCounter() {
        for (var idx = 0; idx < playerData.counter.length; idx++) {
            if (playerData.counter[idx] !== null && playerData.counter[idx] !== undefined && playerData.counter[idx] !== -1) {
                return true;
            }
        }
        return false;
    },

    execFun(funStr, param) {
        let mainScene = this.getCurrentCanvas().getComponent("mainScene");
        switch (funStr) {
            case 'getBuyButton':
                return cc.find('bottomMenu/btnBuy', this.getCurrentCanvas());
            case 'getCombineContent':
                return mainScene.workbench.getDragContentForGuide();
            case 'hasCake':
                return !!playerData.workbench[param];
            case 'hasBaseCake':
                return playerData.workbench[param] === constants.BASE_CAKE_ID;
            case 'isNeedPassCombineGuide':
                return playerData.workbench[0] !== constants.BASE_CAKE_ID || playerData.workbench[1] !== constants.BASE_CAKE_ID;
            case 'getUnusedCakeNodeForGuide':
                return mainScene.workbench.getUnusedCakeNodeForGuide();
            case 'getUnusedCakeContentForGuide':
                return mainScene.workbench.getUnusedCakeContentForGuide();
            case 'getEmptyCounterForGuide':
                return mainScene.counter.getEmptyCounterForGuide();
            case 'hasCakePushToCounter':
                return this.hasCakePushToCounter();
            case 'hasNotCakePushToCounter':
                return !this.hasCakePushToCounter();
            case 'getUsedCakeNode':
                return mainScene.workbench.getUsedCakeNodeForGuide();
            case 'isInMainScene':
                return mainScene !== null;

        }
    },

    loadGuideStep() {
        var idx = 0;
        this.aryGuideSteps = [{
                "id": idx = constants.GUIDE_STEP.START,
                "guideVersion": 2,
                "title": "开始引导",
                "guideLs": [{
                    "title": "等待进入主场景",
                    "type": constants.GUIDE_TYPE.WAIT_EVENT,
                    "param": ["balanceOver"]
                }, ]
            },
            {
                "id": idx = constants.GUIDE_STEP.PUSH_CAKE,
                "title": "开始引导",
                "guideLs": [{
                        "title": "给玩家初始加一块蛋糕",
                        "titleEn": "Add a piece of cake to the player",
                        "type": constants.GUIDE_TYPE.TRIGGER_EVENT,
                        "param": ["addBaseCakeForGuide"],
                        "passCondition": this.execFun,
                        "passConditionOwner": this,
                        "passConditionParam": ['hasCake', 0]
                    },
                    {
                        "title": "给玩家初始加一块蛋糕",
                        "titleEn": "Add a piece of cake to the player",
                        "type": constants.GUIDE_TYPE.TRIGGER_EVENT,
                        "param": ["addBaseCakeForGuide"],
                        "passCondition": this.execFun,
                        "passConditionOwner": this,
                        "passConditionParam": ['hasCake', 1]
                    },

                    {
                        "title": "点击拖动合成高级蛋糕",
                        "type": constants.GUIDE_TYPE.GUIDE,
                        "offsetWidth": 0,
                        "offsetHeight": 0,
                        "getPosFun": {
                            "posFun": this.execFun,
                            "posOwner": this,
                            "posParam": ["getCombineContent"]
                        },
                        "tipsText": {
                            "direction": constants.GUIDE_TIPS_DIRECTION.BOTTOM,
                            "text": "拖动即可合成",
                            "offsetX": 0,
                            "offsetY": 0
                        },
                        "combineGuide": 1, //用来标识为特殊引导步奏，合并引导
                        "passCondition": this.execFun,
                        "passConditionOwner": this,
                        "passConditionParam": ['isNeedPassCombineGuide']
                    },

                    {
                        "title": "等待合并操作完成",
                        "type": constants.GUIDE_TYPE.WAIT_EVENT,
                        "param": ["combineOver"],
                        "passCondition": this.execFun,
                        "passConditionOwner": this,
                        "passConditionParam": ['isNeedPassCombineGuide']
                    },
                    {
                        "title": "第一次引导购买蛋糕",
                        "type": constants.GUIDE_TYPE.GUIDE,
                        "offsetWidth": 40,
                        "offsetHeight": 40,
                        "getNodeFun": {
                            "nodeFun": this.execFun,
                            "nodeOwner": this,
                            "nodeParam": ["getBuyButton", 0]
                        },
                        "tipsText": {
                            "direction": constants.GUIDE_TIPS_DIRECTION.TOP,
                            "text": "点击制作一个新蛋糕",
                            "offsetX": 0,
                            "offsetY": -20
                        },
                        "passCondition": this.execFun,
                        "passConditionOwner": this,
                        "passConditionParam": ['hasCake', 2],
                        "guideOver": true,
                    },
                    {
                        "title": "显示手指引导",
                        "type": constants.GUIDE_TYPE.TRIGGER_EVENT,
                        "param": ["showHand"]
                    }
                ]
            },

            // {
            //     "id": idx = constants.GUIDE_STEP.TASK,
            //     "title": "任务引导",
            //     "skipGuide": {
            //         "fun": this.execFun,
            //         "owner": this,
            //         "param": ["isNeedSkipTaskGuide"]
            //     },
            //     "guideLs": [
            //         {
            //             "title": "等待解锁等级",
            //             "type": constants.GUIDE_TYPE.WAIT_EVENT,
            //             "param": ["unlockLevel"]
            //         },
            //         {
            //             "title": "点击任务按钮",
            //             "type": constants.GUIDE_TYPE.GUIDE,
            //             "offsetWidth": 60,
            //             "offsetHeight": 40,
            //             "offsetX": -5,
            //             "offsetY": 5,
            //             "beforeFun": this.execFun,
            //             "beforeOwner": this,
            //             "beforeParam": ["closeShop"],
            //             "guideOver": true,
            //             "getNodeFun": {
            //                 "nodeFun": this.execFun,
            //                 "nodeOwner": this,
            //                 "nodeParam": ["getTaskButton"]
            //             },
            //             "tipsText": {
            //                 "direction": constants.GUIDE_TIPS_DIRECTION.TOP,
            //                 "text": "这里有一份奖励",
            //                 "offsetX": 0,
            //                 "offsetY": 0
            //             }
            //         },

            //         {
            //             "title": "任务领取结束",
            //             "type": constants.GUIDE_TYPE.WAIT_EVENT,
            //             "param": ["taskFinished"]
            //         }
            //     ]
            // },

            // {
            //     "id": idx = constants.GUIDE_STEP.ACCELERATE,
            //     "title": "加速引导",
            //     "skipGuide": {
            //         "fun": this.execFun,
            //         "owner": this,
            //         "param": ["isNeedSkipAccelerateGuide"]
            //     },
            //     "guideLs": [
            //         {
            //             "title": "等待解锁等级",
            //             "type": constants.GUIDE_TYPE.WAIT_EVENT,
            //             "param": ["unlockLevel"]
            //         },

            //         {
            //             "title": "点击加速按钮",
            //             "type": constants.GUIDE_TYPE.GUIDE,
            //             "offsetWidth": 40,
            //             "offsetHeight": 40,
            //             "guideOver": true,
            //             "getNodeFun": {
            //                 "nodeFun": this.execFun,
            //                 "nodeOwner": this,
            //                 "nodeParam": ["getAccelerateButton"]
            //             },
            //             "tipsText": {
            //                 "direction": constants.GUIDE_TIPS_DIRECTION.TOP,
            //                 "text": "让我们开个派对吧",
            //                 "offsetX": 0,
            //                 "offsetY": 0
            //             }
            //         },

            //         {
            //             "title": "等待派对界面出现",
            //             "type": constants.GUIDE_TYPE.WAIT_EVENT,
            //             "param": ["accelerateUIShow"]
            //         },

            //         {
            //             "title": "点击庆典按钮",
            //             "type": constants.GUIDE_TYPE.GUIDE,
            //             "offsetWidth": 40,
            //             "offsetHeight": 40,
            //             "getNodeFun": {
            //                 "nodeFun": this.execFun,
            //                 "nodeOwner": this,
            //                 "nodeParam": ["getAccelerateStartButton"]
            //             },
            //             "tipsText": {
            //                 "direction": constants.GUIDE_TIPS_DIRECTION.TOP,
            //                 "text": "立即加入它",
            //                 "offsetX": 0,
            //                 "offsetY": 0
            //             }
            //         },

            //         {
            //             "title": "等待派对界面消失",
            //             "type": constants.GUIDE_TYPE.WAIT_EVENT,
            //             "param": ["accelerateUIHide"]
            //         },
            //     ]
            // },

            // {
            //     "id": idx = constants.GUIDE_STEP.AUTO_COMBINE,
            //     "title": "自动合成",
            //     "guideLs": [
            //         {
            //             "title": "点击自动合成",
            //             "type": constants.GUIDE_TYPE.GUIDE,
            //             "offsetWidth": 40,
            //             "offsetHeight": 40,
            //             "getNodeFun": {
            //                 "nodeFun": this.execFun,
            //                 "nodeOwner": this,
            //                 "nodeParam": ["getAutoCombineButton"]
            //             },
            //             "tipsText": {
            //                 "direction": constants.GUIDE_TIPS_DIRECTION.TOP,
            //                 "text": "开启自动合成可以缩减操作哦！省时又省力~",
            //                 "offsetX": 0,
            //                 "offsetY": -20
            //             }
            //         },

            //         // {
            //         //     "title": "等待自动合成开始",
            //         //     "type": constants.GUIDE_TYPE.WAIT_EVENT,
            //         //     "param": ["autoCombineStart"]
            //         // }
            //     ]
            // },

            // {
            //     "id": idx = constants.GUIDE_STEP.BUY_CAKE,
            //     "title": "蛋糕购买",
            //     "guideLs": [
            //         {
            //             "title": "购买蛋糕一次",
            //             "type": constants.GUIDE_TYPE.GUIDE,
            //             "offsetWidth": 40,
            //             "offsetHeight": 40,
            //             "getNodeFun": {
            //                 "nodeFun": this.execFun,
            //                 "nodeOwner": this,
            //                 "nodeParam": ["getBuyButton", 0]
            //             },
            //             "isHideBlack": true,
            //             "isSkipByAnyWhere": false,
            //             "tipsText": {
            //                 "direction": constants.GUIDE_TIPS_DIRECTION.TOP,
            //                 "text": "再次购买蛋糕4次",
            //                 "offsetX": 0,
            //                 "offsetY": -20
            //             },
            //         },

            //         {
            //             "title": "购买蛋糕两次",
            //             "type": constants.GUIDE_TYPE.GUIDE,
            //             "offsetWidth": 40,
            //             "offsetHeight": 40,
            //             "getNodeFun": {
            //                 "nodeFun": this.execFun,
            //                 "nodeOwner": this,
            //                 "nodeParam": ["getBuyButton", 0]
            //             },
            //             "isHideBlack": true,
            //             "isSkipByAnyWhere": false,
            //             "tipsText": {
            //                 "direction": constants.GUIDE_TIPS_DIRECTION.TOP,
            //                 "text": "再次购买蛋糕3次",
            //                 "offsetX": 0,
            //                 "offsetY": -20
            //             },
            //             "passCondition": this.execFun,
            //             "passConditionOwner": this,
            //             "passConditionParam": ['hasCake', 2]
            //         },

            //         {
            //             "title": "购买蛋糕三次",
            //             "type": constants.GUIDE_TYPE.GUIDE,
            //             "offsetWidth": 40,
            //             "offsetHeight": 40,
            //             "getNodeFun": {
            //                 "nodeFun": this.execFun,
            //                 "nodeOwner": this,
            //                 "nodeParam": ["getBuyButton", 0]
            //             },
            //             "isHideBlack": true,
            //             "isSkipByAnyWhere": false,
            //             "tipsText": {
            //                 "direction": constants.GUIDE_TIPS_DIRECTION.TOP,
            //                 "text": "再次购买蛋糕2次",
            //                 "offsetX": 0,
            //                 "offsetY": -20
            //             },
            //             "passCondition": this.execFun,
            //             "passConditionOwner": this,
            //             "passConditionParam": ['hasCake', 3]
            //         },

            //         {
            //             "title": "购买蛋糕四次",
            //             "type": constants.GUIDE_TYPE.GUIDE,
            //             "offsetWidth": 40,
            //             "offsetHeight": 40,
            //             "getNodeFun": {
            //                 "nodeFun": this.execFun,
            //                 "nodeOwner": this,
            //                 "nodeParam": ["getBuyButton", 0]
            //             },
            //             "isHideBlack": true,
            //             "isSkipByAnyWhere": false,
            //             "tipsText": {
            //                 "direction": constants.GUIDE_TIPS_DIRECTION.TOP,
            //                 "text": "再次购买蛋糕1次",
            //                 "offsetX": 0,
            //                 "offsetY": -20
            //             },
            //             "passCondition": this.execFun,
            //             "passConditionOwner": this,
            //             "passConditionParam": ['hasCake', 4]
            //         }
            //     ]
            // },

            {
                "id": idx = constants.GUIDE_STEP.LAST_GUIDE,
                "title": "最后的引导",
                "guideLs": [
                    // {
                    //     "title": "最后的介绍",
                    //     "type": constants.GUIDE_TYPE.GUIDE,
                    //     "offsetWidth": 40,
                    //     "offsetHeight": 40,
                    //     "getNodeFun": {
                    //         "nodeFun": this.execFun,
                    //         "nodeOwner": this,
                    //         "nodeParam": ["getBuyButton"]
                    //     },
                    //     "isHideBlack": true,
                    //     "isSkipByAnyWhere": true,
                    //     "guideOver": true,
                    //     "tipsText": {
                    //         "direction": constants.GUIDE_TIPS_DIRECTION.TOP,
                    //         "text": "快开始你的甜点师之旅吧~",
                    //         "offsetX": 0,
                    //         "offsetY": 0
                    //     }
                    // },
                    {
                        "title": "引导完毕",
                        "type": constants.GUIDE_TYPE.TRIGGER_EVENT,
                        "param": ["guideOver"]
                    }
                ]
            }
        ];
    }
    // update (dt) {},
});

var logic = new GuideLogic();
logic.init();
module.exports = logic;