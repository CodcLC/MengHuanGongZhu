// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html
const i18n = require('LanguageData');
const guideLogic = require('guideLogic');
const constants = require('constants');

var TAG_HAND_ANI = 10000;
const TAG_DRAG_ANI = 10001;

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

        maskNode: {
            default: null,
            type: cc.Node
        },

        handNode: {
            default: null,
            type: cc.Node
        },

        tipsNode: {
            default: null,
            type: cc.Node
        },

        backgroundNode: {
            default: null,
            type: cc.Node
        },

        // shadowsNode: {
        //     default: null,
        //     type: cc.Node
        // },

        frameNode: {
            default: null,
            type: cc.Node
        },

        lbTips: {
            type: cc.Label,
            default: null
        },

        imgForceFrame: {
            type: cc.SpriteFrame,
            default: null
        },

        imgUnForceFrame: {
            type: cc.SpriteFrame,
            default: null
        },

        frameStartNode: {
            default: null,
            type: cc.Node
        },

        frameEndNode: {
            default: null,
            type: cc.Node
        },
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad: function() {
        this.isForce = true;
        this.isTouch = false;
        this.enableIntercept(true);
    },

    start() {
        this.node.on(cc.Node.EventType.TOUCH_START, this.onBgTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onBgTouchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onBgTouchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onBgTouchCancel, this);

        this.tipsNode.on("size-changed", this.onTipsNodeSizeChanged, this);

        if (this.node._touchListener) {
            this.node._touchListener.swallowTouches = false; //将事件吞吐
        }
    },

    onTipsNodeSizeChanged() {
        if (this.subGuide && this.subGuide.isIntroduction && this.subGuide.isShowHandOnTips) {
            this.showHand();
        }

        this.updatePosInWin(this.tipsNode.position);
    },

    checkIsTouchNode(touchEvent, content) {
        if (!content) {
            return false;
        }

        let pos = touchEvent.getLocation();

        let posContent = this.node.convertToWorldSpaceAR(content.pos);
        let box = cc.rect(posContent.x - content.width / 2, posContent.y - content.height / 2,
            content.width, content.height);

        if (box.contains(pos)) {
            return true;
        }

        return false;
    },

    onBgTouchStart(event) {
        this.isTouchStart = false;
        this.isDragStart = false;
        if (this.checkIsTouchNode(event, this.targetContent)) {
            this.isTouchStart = true;
            return;
        } else if (this.frameStartNode.active) {
            //支持拖动
            var posStart = event.getLocation();
            var box = this.frameStartNode.getBoundingBoxToWorld();
            if (box.contains(posStart)) {
                this.isDragStart = true;
                return;
            }
        }

        if (this.isForce) {
            event.stopPropagation();
        }
    },

    onBgTouchMove(event) {
        if (this.isTouchStart && (this.subGuide.combineGuide || this.checkIsTouchNode(event, this.targetContent))) {
            return;
        } else if (this.isDragStart) {
            return;
        } else if (this.isForce) {
            event.stopPropagation();
        }
    },

    onBgTouchCancel(event) {
        if (this.isTouchStart || this.isDragStart) {

        } else if (this.isForce) {
            event.stopPropagation();
        }
    },

    onBgTouchEnd(event) {
        if (this.isTouchStart) {
            if (this.checkIsTouchNode(event, this.targetContent)) {
                //触发结束
                if (!this.subGuide.combineGuide) {
                    this.guideFinish();
                }
            }
        } else if (this.isDragStart) {
            if (!this.subGuide.pushCakeGuide) {
                this.afterDrag(event);
            }
        } else if (this.isForce) {
            if (this.isHideBlack && this.isSkipByAnyWhere) {
                this.guideFinish();
            }

            event.stopPropagation();
        }
    },

    afterDrag: function(event) {
        this.isDragStart = false;
        var pos = event.getLocation();
        var box = this.frameEndNode.getBoundingBoxToWorld();
        if (box.contains(pos)) {
            this.guideFinish();
        } else {
            //拖动失败
            if (this.subGuide.onFailedFun) {
                var onFailedFun = this.subGuide.onFailedFun.failedFun;
                onFailedFun.apply(this.subGuide.onFailedFun.failedOwner,
                    this.subGuide.onFailedFun.failedParam);
            }

            this.frameStartNode.active = true;
            this.tipsNode.active = true;

            var multiMask = this.maskNode.getComponent("multiMask");
            multiMask.setRects([this.startRect, this.endRect]);
        }
    },

    /**
     * 是否启动拦截
     * @param {boolean} enable
     */
    enableIntercept(enable) {
        if (!enable) {
            this.frameNode.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
            this.frameNode.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
            this.frameNode.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
        } else {
            this.frameNode.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
            this.frameNode.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
            this.frameNode.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);

            if (this.frameNode._touchListener) {
                this.frameNode._touchListener.swallowTouches = false; //关闭事件拦截
            }
        }
    },

    onTouchStart(event) {
        console.log("shadows touchStart");

        if (this.isTouch) {
            return;
        }

        //获取目前所要点击的节点，派发点击事件
        if (this.targetNode) {
            this.simTouchByEvent(this.targetNode, cc.Node.EventType.TOUCH_START, event);
        }
    },

    onTouchEnd(event) {
        console.log("shadows touchEnd");

        if (this.isTouch) {
            return;
        }

        this.isTouch = true;

        //获取目前所要点击的节点，派发点击事件
        if (this.targetNode) {
            this.simTouchByEvent(this.targetNode, cc.Node.EventType.TOUCH_END, event);
            this.guideFinish();
        }
        // else if (this.targetContent && !this.subGuide.isShowHandOnTips) {
        //     this.enableIntercept(false);
        //     var posWorld = this.node.convertToWorldSpaceAR(this.targetContent.pos);
        //     this.simTouch(posWorld.x, posWorld.y);
        //     this.enableIntercept(true);
        // }
    },

    onTouchCancel(event) {
        console.log("shadows touchCancel");

        //获取目前所要点击的节点，派发点击事件
        if (this.targetNode) {
            this.simTouchByEvent(this.targetNode, cc.Node.EventType.TOUCH_CANCEL, event);
        }
    },

    guideFinish() {
        if (this.refreshPosTimer) {
            clearInterval(this.refreshPosTimer);
        }

        guideLogic.finishGuide();
    },

    setGuideInfo(subGuide) {
        this.isTouch = false;
        this.oldPos = null;
        this.subGuide = subGuide;

        this.targetNode = null;
        this.targetContent = null;

        if (subGuide.getNodeFun) {
            var getNodeFun = subGuide.getNodeFun.nodeFun;
            this.targetNode = getNodeFun.apply(subGuide.getNodeFun.nodeOwner, subGuide.getNodeFun.nodeParam);
        } else if (subGuide.getPosFun) {
            var getPosFun = subGuide.getPosFun.posFun;
            this.targetContent = getPosFun.apply(subGuide.getPosFun.posOwner,
                subGuide.getPosFun.posParam);
        }

        if (!this.targetNode && !this.targetContent && !subGuide.isShowTextOnly) {
            guideLogic.pauseGuide();
            return;
        }

        this.isForce = true;
        if (subGuide.hasOwnProperty("isForce")) {
            this.isForce = subGuide.isForce;
        }

        this.isHideBlack = false;
        if (subGuide.hasOwnProperty("isHideBlack")) {
            this.isHideBlack = subGuide["isHideBlack"];
        }

        this.isSkipByAnyWhere = false;
        if (subGuide.hasOwnProperty("isSkipByAnyWhere")) {
            this.isSkipByAnyWhere = subGuide["isSkipByAnyWhere"];
        }

        if (this.targetNode || this.targetContent) {
            this.updatePosByTargetNode();
        }

        if (subGuide.isShowDrag) {
            this.showDragGuide(subGuide);
        } else {
            this.frameStartNode.active = false;
            this.frameEndNode.active = false;
        }
    },

    showDragGuide: function(subGuide) {
        //拖动的动画提示，外加两个框，并且隐藏蒙版
        //1.隐藏蒙版
        // this.setMaskRegion(cc.v2(0, 0), 0, 0);
        if (!subGuide.dragInfo) {
            return;
        }

        //2.显示两个框
        var startContent = null;
        if (subGuide.dragInfo.start) {
            var getStartFun = subGuide.dragInfo.start.posFun;
            startContent = getStartFun.apply(subGuide.dragInfo.start.posOwner,
                subGuide.dragInfo.start.posParam);
        } else {
            return;
        }

        var endContent = null;
        if (subGuide.dragInfo.end) {
            var getEndFun = subGuide.dragInfo.end.posFun;
            endContent = getEndFun.apply(subGuide.dragInfo.end.posOwner,
                subGuide.dragInfo.end.posParam);
        } else {
            return;
        }

        this.frameStartNode.active = true;
        this.frameStartNode.position = startContent.pos;

        var frameNode = this.frameStartNode.getChildByName("frame");
        frameNode.width = startContent.width + 5;
        frameNode.height = startContent.height + 5;

        var startPos = this.frameStartNode.position;
        this.startRect = new cc.rect(startPos.x - frameNode.width / 2,
            startPos.y - frameNode.height / 2, frameNode.width, frameNode.height);

        this.frameEndNode.active = true;
        this.frameEndNode.position = endContent.pos;

        frameNode = this.frameEndNode.getChildByName("frame");
        frameNode.width = endContent.width + 5;
        frameNode.height = endContent.height + 5;

        var endPos = this.frameEndNode.position;
        this.endRect = new cc.rect(endPos.x - frameNode.width / 2,
            endPos.y - frameNode.height / 2, frameNode.width, frameNode.height);
        // shadowsNode = this.frameEndNode.getChildByName("shadows");

        //3.显示手移动动画
        this.handNode.stopActionByTag(TAG_DRAG_ANI);
        this.handNode.stopActionByTag(TAG_HAND_ANI);

        this.handNode.active = true;
        this.handNode.position = startContent.pos;
        this.handNode.scale = 1.2;
        var scaleToAction = cc.scaleTo(0.2, 1);
        var scaleBackAction = cc.scaleTo(0.2, 1.2);
        var moveToAction = cc.moveTo(1, endContent.pos);
        var fadeAction = cc.fadeOut(0.2);
        var seqAction = cc.sequence(cc.delayTime(0.2), scaleToAction, cc.delayTime(0.2),
            moveToAction, scaleBackAction, cc.delayTime(0.2), fadeAction, cc.callFunc(function(self, posStart) {
                self.position = posStart;
                self.opacity = 255;
            }, this.handNode, startContent.pos)).repeatForever();

        seqAction.setTag(TAG_DRAG_ANI);
        this.handNode.runAction(seqAction);

        this.isSelectStart = false;

        //5. 显示蒙版-根据
        // this.shadowsNode.active = false;
        this.frameNode.active = false;
        var multiMask = this.maskNode.getComponent("multiMask");
        multiMask.setRects([this.startRect, this.endRect]);
    },

    updatePosByTargetNode() {
        var maskPos = null;
        var width = 0;
        var height = 0;
        if (this.targetNode) {
            var worldPos = this.targetNode.convertToWorldSpaceAR(cc.v2(0, 0));
            if (worldPos.equals(this.oldPos)) {
                return;
            }

            this.oldPos = cc.v2(worldPos);

            var offsetAnchorPosX = 0.5 - this.targetNode.anchorX;
            var offsetAnchorPosY = 0.5 - this.targetNode.anchorY;
            worldPos.x += offsetAnchorPosX * this.targetNode.width;
            worldPos.y += offsetAnchorPosY * this.targetNode.height;
            maskPos = this.node.convertToNodeSpaceAR(worldPos);

            width = this.targetNode.width + 4;
            if (this.subGuide.offsetWidth) {
                width += Number(this.subGuide.offsetWidth);
            }

            height = this.targetNode.height + 4;
            if (this.subGuide.offsetHeight) {
                height += Number(this.subGuide.offsetHeight);
            }

            if (this.subGuide.offsetX) {
                maskPos.x += Number(this.subGuide.offsetX);
            }
            if (this.subGuide.offsetY) {
                maskPos.y += Number(this.subGuide.offsetY);
            }
        } else if (this.targetContent) {
            if (this.targetContent.pos && this.targetContent.pos.equals(this.oldPos)) {
                return;
            }

            this.oldPos = this.targetContent.pos;

            maskPos = this.targetContent.pos;
            width = this.targetContent.width;
            height = this.targetContent.height;
        }

        //maskPos = cc.v2(maskPos.x, maskPos.y);

        this.setMaskRegion(maskPos, width, height);

        this.showTips();

        this.showHand();

        // this.showVirtualChess(maskPos, this.isShowVirtualChess);

        this.setForce(this.isForce);

        //以下为当要隐藏黑色背景并且还需要接收全局点击时使用
        if (this.isHideBlack) {
            this.setForce(false);
            // this.node.getComponent(cc.Button).enabled = true;
        }
    },

    /**
     * 设置是否强制新手引导（如果强制，表示不能点击其他区域）
     * @param {boolean} isForce
     */
    setForce(isForce) {
        this.maskNode.active = isForce;
        // this.node.getComponent(cc.Button).enabled = isForce;

        var img = this.imgForceFrame;
        if (!isForce) {
            img = this.imgUnForceFrame;
        }

        this.frameNode.getComponent(cc.Sprite).spriteFrame = img;
    },

    setMaskRegion(pos, width, height) {
        if (width !== 0 && height !== 0) {
            this.maskNode.active = true;
            // this.shadowsNode.active = true;
            this.frameNode.active = true;
        } else {
            this.maskNode.active = false;
            // this.shadowsNode.active = false;
            this.frameNode.active = false;
        }

        var multiMask = this.maskNode.getComponent("multiMask");
        var rect = new cc.rect(pos.x - width / 2, pos.y - height / 2, width, height);
        multiMask.setRects([rect]);
        // this.maskNode.setPosition(pos);
        // this.maskNode.width = width;
        // this.maskNode.height = height;
        // this.shadowsNode.setPosition(pos);
        // this.shadowsNode.width = width - 4;
        // this.shadowsNode.height = height - 4;
        this.frameNode.setPosition(pos);
        this.frameNode.width = width;
        this.frameNode.height = height;
        this.backgroundNode.width = cc.winSize.width;
        this.backgroundNode.height = cc.winSize.height;
        // this.backgroundNode.setPosition(cc.v2(-pos.x, -pos.y));
    },

    showCombineHand: function() {
        this.handNode.active = true;
        this.handNode.opacity = 255;

        if (!this.targetContent) {
            this.handNode.active = false;
            return;
        }

        var posStart = this.targetContent.pos;
        posStart.x -= 70;
        var posEnd = cc.v2(posStart.x + 130, posStart.y);

        this.handNode.position = posStart;
        this.handNode.scale = 1.2;
        var scaleToAction = cc.scaleTo(0.2, 1);
        var scaleBackAction = cc.scaleTo(0.2, 1.2);
        var moveToAction = cc.moveTo(1, posEnd);
        var fadeAction = cc.fadeOut(0.2);
        var seqAction = cc.sequence(cc.delayTime(0.2), scaleToAction, cc.delayTime(0.2),
            moveToAction, scaleBackAction, cc.delayTime(0.2), fadeAction, cc.callFunc(function(self, posStart) {
                self.position = posStart;
                self.opacity = 255;
            }, this.handNode, posStart)).repeatForever();

        seqAction.setTag(TAG_DRAG_ANI);
        this.handNode.runAction(seqAction);
    },

    showHand: function() {
        this.handNode.stopActionByTag(TAG_DRAG_ANI);
        this.handNode.stopActionByTag(TAG_HAND_ANI);

        if (this.subGuide.combineGuide) {
            //特殊引导，特殊展示
            this.showCombineHand();
            return;
        }

        if (this.subGuide.isIntroduction &&
            !this.subGuide.isShowHandOnTips && !this.subGuide.isShowHandOnFrame) {
            this.handNode.active = false;
            return;
        }

        this.handNode.active = true;
        this.handNode.opacity = 255;
        var pos = null;

        if (this.subGuide.isShowHandOnTips) {
            pos = cc.v2(this.tipsNode.position);
            pos.x += this.tipsNode.width / 2 - 20;
            pos.y -= this.tipsNode.height / 2 - 20;
        } else if (this.frameNode) {
            pos = this.frameNode.getPosition();
        }

        var winSize = cc.winSize;
        var size = this.handNode.getContentSize();
        if (pos.x > winSize.width / 2 - size.width) pos.x = winSize.width / 2 - size.width;
        if (pos.y < -(winSize.height / 2 - size.height)) pos.y = -(winSize.height / 2 - size.height);
        this.handNode.setPosition(pos);
        var moveByAction = cc.moveBy(0.5, 20, -20);
        var reverseAction = cc.moveBy(0.5, -20, 20);
        var moveAction = cc.repeatForever(cc.sequence(moveByAction, reverseAction));
        moveAction.setTag(TAG_HAND_ANI);
        this.handNode.runAction(moveAction);
    },

    showTips: function() {
        if (this.subGuide.tipsText) {
            this.tipsNode.active = true;

            var desc = i18n.t('guide.' + this.subGuide.tipsText.text);
            var textNode = this.tipsNode.getChildByName("text");
            var label = textNode.getComponent(cc.Label);
            label.string = desc;

            var maxLen = 30;
            // var lanIndex = configuration.getGlobalData("language");
            // if (constants.LANGUAGE[lanIndex] === "zh") {
            //     maxLen = 20;
            // }

            var size = textNode.getContentSize();
            if (desc.length > maxLen) {
                textNode.getComponent(cc.Label).overflow = cc.Label.Overflow.RESIZE_HEIGHT;
                textNode.width = 540;
            } else {
                label.overflow = cc.Label.Overflow.NONE;
            }

            textNode.getComponent(cc.Label).string = i18n.t(desc);

            var direction = this.subGuide.tipsText.direction;
            if (!direction) {
                direction = constants.GUIDE_TIPS_DIRECTION.TOP;
            }

            var offsetX = 0;
            var offsetY = 0;
            switch (direction) {
                case constants.GUIDE_TIPS_DIRECTION.TOP:
                    offsetY = this.frameNode.height / 2 + textNode.height / 2 + 40;
                    break;
                case constants.GUIDE_TIPS_DIRECTION.RIGHT:
                    offsetX = this.frameNode.width / 2 + textNode.width / 2 + 40;
                    break;
                case constants.GUIDE_TIPS_DIRECTION.BOTTOM:
                    offsetY = -this.frameNode.height / 2 - textNode.height / 2 - 40;
                    break;
                case constants.GUIDE_TIPS_DIRECTION.LEFT:
                    offsetX = -this.frameNode.width / 2 - textNode.width / 2 - 40;
                    break;
            }

            var posFrame = this.frameNode.getPosition();
            var pos = cc.v2(posFrame.x + offsetX, posFrame.y + offsetY);
            pos.x += this.subGuide.tipsText.offsetX || 0;
            pos.y += this.subGuide.tipsText.offsetY || 0;
            this.tipsNode.width += this.subGuide.tipsText.offsetWidth || 0;
            this.tipsNode.height += this.subGuide.tipsText.offsetHeight || 0;

            this.updatePosInWin(pos);
        } else {
            this.tipsNode.active = false;
        }
    },

    updatePosInWin(pos) {
        //检查是否超出，如果超出自动调整坐标
        var winSize = cc.find('Canvas').getContentSize();
        var width = this.tipsNode.width;
        var height = this.tipsNode.height;
        if (pos.x - width / 2 < -winSize.width / 2) {
            pos.x = -winSize.width / 2 + width / 2;
        } else if (pos.x + width / 2 > winSize.width / 2) {
            pos.x = winSize.width / 2 - width / 2;
        }

        if (pos.y - height / 2 < -winSize.height / 2) {
            pos.y = -winSize.height / 2 - height / 2;
        } else if (pos.y + height / 2 > winSize.height / 2) {
            pos.y = winSize.height / 2 - height / 2;
        }

        this.tipsNode.setPosition(pos);
    },

    onForceBtnClick() {
        if (this.subGuide.isIntroduction) {
            this.guideFinish();
        }
    },

    simTouchByEvent(node, type, oldEvent) {
        if (typeof(oldEvent.getTouches) !== "function") {
            console.error("oldEvent.getTouches is not a function!type(" + typeof(oldEvent.getTouches) + ")");
        }

        if (cc.sys.isNative && type === cc.Node.EventType.TOUCH_END) {
            var randId = this.touchId++;
            var frameSize = cc.winSize;
            var posLocation = oldEvent.getLocation();
            var x = posLocation.x;
            var yPos = posLocation.y;
            if (cc.sys.isNative) {
                yPos = frameSize.height - yPos;
            }

            var touch = new cc.Touch();
            touch.setTouchInfo(randId, x, yPos);

            var touchArr = [touch];

            var tmpEvent = new cc.Event.EventTouch(touchArr, false);
            tmpEvent.type = type;
            tmpEvent.touch = touch;
            tmpEvent.simulate = true;
            node.dispatchEvent(tmpEvent);
            return;
        }

        var endEvent = new cc.Event.EventTouch(oldEvent.getTouches(), oldEvent.bubbles);
        endEvent.type = type;
        endEvent.touch = oldEvent.touch;
        endEvent.simulate = true;
        node.dispatchEvent(endEvent);
    },

    /**
     * 暂时屏蔽
     * 模拟点击
     * @param {number} x
     * @param {number} y
     */

    simTouch: function(x, y) {
        var randId = this.touchId++;
        var frameSize = cc.winSize;
        var yPos = y;
        if (cc.sys.isNative) {
            yPos = frameSize.height - yPos;
        }

        var touch = new cc.Touch();
        touch.setTouchInfo(randId, x, yPos);

        var touchArr = [touch];
        var touchEvent = new cc.Event.EventTouch(touchArr);

        // if (cc.sys.isNative) {
        //     touchEvent.setEventCode(cc.EventTouch.EventCode.BEGAN);
        // } else {
        //     touchEvent._setEventCode(cc.Event.EventTouch.BEGAN);
        // }
        touchEvent._setEventCode(cc.Event.EventTouch.BEGAN);

        touchEvent.simulate = true;

        var touchEnd = new cc.Event.EventTouch(touchArr);

        // if (cc.sys.isNative) {
        //     touchEnd.setEventCode(cc.EventTouch.EventCode.ENDED);
        // } else {
        //     touchEnd._setEventCode(cc.Event.EventTouch.ENDED);
        // }
        touchEnd._setEventCode(cc.Event.EventTouch.ENDED);

        touchEnd.simulate = true;

        cc.eventManager._dispatchTouchEvent(touchEvent);
        cc.eventManager._dispatchTouchEvent(touchEnd);
    },

    // update (dt) {},
});