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
const clientEvent = require('clientEvent');
const constants = require('constants');
const resourceUtil = require('resourceUtil');
const localConfig = require('localConfig');
const guideLogic = require('guideLogic');

const TAG_VIRTUAL_MOVE = 10001;  //虚拟道具
const SPEED_VIRUTAL_MOVE = 2000;

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

        prefabCake: cc.Prefab,

        layoutNode: cc.Node
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    ctor () {
        this.isCombining = false; //是否正在自动合成中
    },

    start () {
        this.registEvent();

        this.createWorkbench();
        this.init();

        // this.checkIsCombineAuto();
    },

    /**
     * 设置MainScene
     * @param {cc.Class} mainScene 
     */
    setMainScene (mainScene) {
        this.mainScene = mainScene;
    },

    createWorkbench () {
        var arrChildren = this.layoutNode.getChildren();
        if (arrChildren.length > 0) {
            //已经创建过，不需要再创建
            return;
        }

        for (var idx = 0; idx < constants.WORKBENCH_MAX_POS; idx++) {
            var node = cc.instantiate(this.prefabCake);
            this.layoutNode.addChild(node);
        }
    },

    /**
     * 工作台初始化
     */
    init () {
        // if (!playerData.workbench) {
        //     playerData.workbench = ["1", "1", "2", null, null, "3"]; //TODO 测试数据，后续需要置为空
        // }

        var arrChildren = this.layoutNode.getChildren();
        arrChildren.forEach(function (itemNode, index) {
            var itemInfo = itemNode.getComponent('cakeItem');
            if (index < playerData.workbench.length) {
                itemInfo.setWorkbenchItemInfo(index, playerData.workbench[index]);
            } else {
                itemInfo.setWorkbenchItemInfo(index, null);
            }
        }, this);

        this.maxLevel = localConfig.getCakeMaxLevel();
    },

    registEvent () {
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);

        clientEvent.on('updateWorkbench', this.updateWorkbench, this);
        clientEvent.on('combineCake', this.playCombinCakeAni, this);
        clientEvent.on('unlockCake', this.showUnlockCake, this);
        clientEvent.on('upgradeCake', this.showUpgradeCake, this);
        clientEvent.on('enableBuff', this.updateBuff, this);
        clientEvent.on('disableBuff', this.updateBuff, this);
    },

    onDestroy () {
        clientEvent.off('updateWorkbench', this.updateWorkbench, this);
        clientEvent.off('combineCake', this.playCombinCakeAni, this);
        clientEvent.off('unlockCake', this.showUnlockCake, this);
        clientEvent.off('upgradeCake', this.showUpgradeCake, this);
        clientEvent.off('enableBuff', this.updateBuff, this);
        clientEvent.off('disableBuff', this.updateBuff, this);
    },

    /**
     * 拖拽时原物体半透明，然后拖拽的其实是一个虚拟的半透明物体
     */
    showVirtualItem (info, pos) {
        if (!this.virtualNode) {
            this.virtualNode = cc.instantiate(this.prefabCake);
            this.virtualNode.parent = this.node.parent;
        } else {
            this.virtualNode.active = true;
        }

        this.virtualNode.stopActionByTag(TAG_VIRTUAL_MOVE);
        let cakeItem = this.virtualNode.getComponent('cakeItem');
        cakeItem.setWorkbenchItemInfo(-1, info);
        cakeItem.showVirtual();
        this.updateVirutalItemPos(pos);
    },

    updateVirutalItemPos (pos) {
        if (this.virtualNode && this.virtualNode.active) {
            //需要坐标转换
            var posNodeSpace = this.node.parent.convertToNodeSpaceAR(pos);

            this.virtualNode.position = posNodeSpace.add(this.offsetPos);

            this.mainScene.recovery.updateDragPos(pos);
        }
    },

    hideVirtualItem (isGoBack) {
        if (this.virtualNode && this.virtualNode.active) {
            if (isGoBack) {
                // this.currentNode.converttow
                let posWorld = this.currentNode.convertToWorldSpaceAR(cc.v2);
                let posCurrentNode = this.node.parent.convertToNodeSpaceAR(posWorld);
                let duration = posCurrentNode.sub(this.virtualNode.position).mag() / SPEED_VIRUTAL_MOVE;
                let moveAction = cc.moveTo(duration, posCurrentNode);
                let seqActions = cc.sequence(moveAction, cc.callFunc(function() {
                    this.virtualNode.active = false;
                }, this));

                this.virtualNode.runAction(seqActions);
            } else {
                this.virtualNode.active = false;
            }
        }
    },

    showSameCake (cakeItem) {
        let index = cakeItem.index;
        let itemId = cakeItem.itemId;
        let arrNode = this.layoutNode.children;

        for (var idx = 0; idx < arrNode.length; idx++) {
            if (idx === index) {
                continue;
            }

            let cake = arrNode[idx].getComponent('cakeItem');
            if (!cake.isUsed && cake.itemId === itemId) {
                cake.playSameCakeAni(true);
            } 
            // else {
            //     cake.playDiffCakeStatus(true);
            // }
        }
    },

    hideSameCake () {
        let arrNode = this.layoutNode.children;

        for (var idx = 0; idx < arrNode.length; idx++) {
            let cake = arrNode[idx].getComponent('cakeItem');
            if (!cake.isUsed) {
                cake.playSameCakeAni(false);
                // cake.playDiffCakeStatus(false);
            }
        }
    },

    onTouchStart (touchEvent) {
        this.currentNode = this.getCurrentNodeByTouchPos(touchEvent.getLocation());

        if (this.currentNode) {
            cc.gameSpace.audioManager.playSound('touchCake', false);
            var cakeItem = this.currentNode.getComponent('cakeItem');
            this.isCanDrag = cakeItem.dragStart();

            if (this.isCanDrag) {
                let currentWorldPos = this.currentNode.convertToWorldSpaceAR(cc.v2(0,0));
                this.offsetPos = currentWorldPos.sub(touchEvent.getLocation());
                this.showVirtualItem(cakeItem.getInfo(), touchEvent.getLocation());

                this.showSameCake(cakeItem);
            }
        }
    },

    onTouchMove (touchEvent) {
        if (!this.isCanDrag) {
            return;
        }

        this.updateVirutalItemPos(touchEvent.getLocation());
    },

    onTouchEnd (touchEvent) {
        if (!this.currentNode) {
            return;
        }

        this.hideSameCake();

        let cakeItem = this.currentNode.getComponent('cakeItem');
        cakeItem.dragOver();

        var touchEndNode = this.getCurrentNodeByTouchPos(touchEvent.getLocation());

        if (this.currentNode === touchEndNode) {
            //属于点击自己
            this.hideVirtualItem(true);
            cakeItem.onItemClicked();
            this.currentNode = null;
            return;
        }

        if (!this.isCanDrag) {
            return;
        }

        if (guideLogic.isPlayingPushCakeGuide()) {
            this.hideVirtualItem(true);
            this.currentNode = null;
            return;
        }

        if (!touchEndNode) {
            if (guideLogic.isPlayingCombineGuide()) {
                this.hideVirtualItem(true);
                this.currentNode = null;
                return;
            }

            //TODO 判断是否拖拽到生产台上，没有则是拖拽到无效位置
            let isDragToRecovery = this.mainScene.recovery.checkIsDragToRecovery(cakeItem.index, touchEvent.getLocation());
            if (!isDragToRecovery) {
                this.hideVirtualItem(true);
            } else {
                this.hideVirtualItem(false);
            }

            
        } else {
            //判断是交换位置还是与之合成
            this.combinOrSwap(this.currentNode, touchEndNode);
        }

        this.currentNode = null;
        this.isCanDrag = false;
    },
    
    onTouchCancel (touchEvent) {
        if (!this.currentNode) {
            return;
        }

        let cakeItem = this.currentNode.getComponent('cakeItem');

        if (!cakeItem.itemId) {
            return;
        }

        this.hideSameCake();
        
        cakeItem.dragOver();
        if (cakeItem.isUsed) {
            this.currentNode = null;
            return;
        }

        if (guideLogic.isPlayingCombineGuide()) {
            this.hideVirtualItem(true);
            this.currentNode = null;
            return;
        }

        //判断是否拖拽到货架上，没有则是拖拽到无效位置
        // let dragToCounterIdx = this.mainScene.counter.checkIsDragToCounter(touchEvent.getLocation());
        // if (dragToCounterIdx >= 0) {
        //     //物品上架
        //     gameLogic.pushCakeToCounter(cakeItem.index, dragToCounterIdx);
        //     this.hideVirtualItem(false);

        //     if (guideLogic.isPlayingPushCakeGuide()) {
        //         guideLogic.finishGuide();
        //     }
        // } else {

        if (guideLogic.isPlayingPushCakeGuide()) {
            this.hideVirtualItem(true);
            this.currentNode = null;
            return;
        }

        //检查下是否拖拽到回收站了
        let isDragToRecovery = this.mainScene.recovery.checkIsDragToRecovery(cakeItem.index, touchEvent.getLocation());

        if (!isDragToRecovery) {
            //拖到了无效位置
            this.hideVirtualItem(true);
        } else {
            //发起回收的请求,此处已由recovery接收走
            this.hideVirtualItem(false);
        }

        // }
        
        this.currentNode = null;
    },

    getCurrentNodeByTouchPos (pos) {
        var arrNode = this.layoutNode.children;
        return _.find(arrNode, function (itemNode, index) {
            var box = itemNode.getBoundingBoxToWorld();

            if (box.contains(pos)) {
                return true;
            }
        }, this);
    },

    /**
     * 判断是交换还是结合
     */
    combinOrSwap (originNode, targetNode) {
        let originScript = originNode.getComponent('cakeItem');
        let targetScript = targetNode.getComponent('cakeItem');
        if (originScript.isUsed || targetScript.isUsed) {
            this.hideVirtualItem(true);
            return;
        }

        //引导特殊处理
        if (guideLogic.isPlayingCombineGuide()) {
            if ((originScript.index !== 0 && originScript.index !== 1) || (targetScript.index !== 0 && targetScript.index !== 1)) {
                this.hideVirtualItem(true);
                return;
            } else {
                guideLogic.finishGuide();
            }
        }

        this.hideVirtualItem(false);
        gameLogic.combinOrSwap(originScript.index, targetScript.index);
    },

    updateWorkbench (index, isBuyingCake) {
        if (index !== undefined && index !== null && index < constants.WORKBENCH_MAX_POS) {
            let itemNode = this.layoutNode.getChildren()[index];
            let itemInfo = itemNode.getComponent('cakeItem');
            if (index < playerData.workbench.length) {
                itemInfo.setWorkbenchItemInfo(index, playerData.workbench[index]);
            } else {
                itemInfo.setWorkbenchItemInfo(index, null);
            }

            if (isBuyingCake) {
                itemInfo.showBuyingCakeAni();
            }
        } else {
            this.init();
        }
    },

    getItemWorldPosByIdx (idx) {
        let itemNode = this.layoutNode.getChildren()[idx];
        if (itemNode) {
            return itemNode.convertToWorldSpaceAR(cc.v2(0, 0));
        }

        return null;
    },

    showUnlockCake (originIndex, targetIndex, itemId) {
        cc.gameSpace.uiManager.showSharedDialog('dialog/unlock', 'unlock', [originIndex, targetIndex, itemId]);

        // resourceUtil.createUI('dialog/unlock', (err, unlockNode) => {
        //     let unlock = unlockNode.getComponent('unlock');
        //     unlock.setUnlockInfo(originIndex, targetIndex, itemId);
        //     unlockNode.zIndex = constants.ZORDER.DIALOG;
        // });
    },

    showUpgradeCake (workbenchIdx, itemId, targetLevel) {
        var itemInfo = localConfig.queryByID('cake', itemId);
        if (!itemInfo) {
            clientEvent.dispatchEvent('updateWorkbench', workbenchIdx);
            return;
        }

        //var nextItemInfo = localConfig.queryByID('cake', itemInfo.next);

        let nextItemInfo = localConfig.queryByID('cake', targetLevel);
        
        if (!nextItemInfo) {
            clientEvent.dispatchEvent('updateWorkbench', workbenchIdx);
            return;
        }

        let targetNode = this.layoutNode.getChildren()[workbenchIdx];
        let targetPos = targetNode.convertToWorldSpaceAR(cc.v2(0, 0));
        let targetScript = targetNode.getComponent('cakeItem');
        targetPos = this.node.convertToNodeSpaceAR(targetPos);
        targetPos.x -= 2;
        targetPos.y -= 5;
        let _this = this;
        resourceUtil.loadRes('games/effects/ui/cakeLevelUp/upgrade', cc.Prefab, function(err, prefab) {
            if (err) {
                clientEvent.dispatchEvent('updateWorkbench', workbenchIdx);
                return;
            }

            var effect = cc.instantiate(prefab);
            effect.parent = _this.node;
            effect.position = targetPos;
            effect.active = false;

            let effectCmp = effect.getComponent('effect');
            effectCmp.setTriggerListener(()=>{
                //最后刷新下数据
                cc.gameSpace.audioManager.playSound('combineCake', false);
                clientEvent.dispatchEvent('updateWorkbench', workbenchIdx);
            });

            effectCmp.setEndListener(()=>{
                effect.destroy();
            });

            // resourceUtil.setCakeIcon(itemInfo.img, effect.getChildByName('left').getComponent(cc.Sprite), function(){});
            // resourceUtil.setCakeIcon(itemInfo.img, effect.getChildByName('right').getComponent(cc.Sprite), function(){});
            resourceUtil.setCakeIcon(nextItemInfo.img, effect.getChildByName('cake02').getComponent(cc.Sprite), function(){
                effect.active = true;
                targetScript.showCake(false);
                effectCmp.playAni('upgrade');
            });

        });
    },

    /**
     * 播放组合动画
     * @param {Number} originIndex 材料位置的index 
     * @param {Number} targetIndex 目标位置的index
     * @param {String} itemId 物品id
     */
    playCombinCakeAni (originIndex, targetIndex, itemId) {
        let _this = this;
        let originNode = this.layoutNode.getChildren()[originIndex];
        let targetNode = this.layoutNode.getChildren()[targetIndex];
        let originScript = originNode.getComponent('cakeItem');
        let targetScript = targetNode.getComponent('cakeItem');
        originScript.isUsed = true; //要结合，先将两个蛋糕置为不可拖拽
        targetScript.isUsed = true;

        clientEvent.dispatchEvent('updateWorkbench', originIndex);

        var itemInfo = localConfig.queryByID('cake', itemId);
        if (!itemInfo) {
            clientEvent.dispatchEvent('updateWorkbench', targetIndex);
            return;
        }

        var nextItemInfo = localConfig.queryByID('cake', itemInfo.next);
        if (!nextItemInfo) {
            clientEvent.dispatchEvent('updateWorkbench', targetIndex);
            return;
        }

        let targetPos = targetNode.convertToWorldSpaceAR(cc.v2(0, 0));
        targetPos = this.node.convertToNodeSpaceAR(targetPos);
        targetPos.x -= 2;
        targetPos.y -= 5;
        resourceUtil.loadRes('games/effects/ui/combine/combine', cc.Prefab, function(err, prefab) {
            if (err) {
                clientEvent.dispatchEvent('updateWorkbench', targetIndex);
                return;
            }

            var effect = cc.instantiate(prefab);
            effect.parent = _this.node;
            effect.position = targetPos;
            effect.active = false;

            let effectCmp = effect.getComponent('effect');
            effectCmp.setTriggerListener(()=>{
                //最后刷新下数据
                cc.gameSpace.audioManager.playSound('combineCake', false);
                // _this.updateWorkbench(originIndex);
                // _this.updateWorkbench(targetIndex);
                clientEvent.dispatchEvent('updateWorkbench', targetIndex);

                clientEvent.dispatchEvent("combineOver");
            });

            effectCmp.setEndListener(()=>{
                effect.destroy();
            });

            // resourceUtil.setCakeIcon(itemInfo.img, effect.getChildByName('left').getComponent(cc.Sprite), function(){});
            // resourceUtil.setCakeIcon(itemInfo.img, effect.getChildByName('right').getComponent(cc.Sprite), function(){});
            resourceUtil.setCakeIcon(nextItemInfo.img, effect.getChildByName('target').getComponent(cc.Sprite), function(){
                effect.active = true;
                effectCmp.playAni('combine');
            });

        });
    },

    takeoffAllCake () {
        // let arrNode = this.layoutNode.children;
        // arrNode.forEach((node, idx)=>{
        //     let cake = node.getComponent('cakeItem');
        //     if (cake.itemId && cake.isUsed) {
        //         gameLogic.takeOffCakeFromCounter(idx);
        //     }
        // });
    },

    /**
     * 获取引导指定的拖拽区域
     */
    getDragContentForGuide () {
        let node = this.layoutNode.getChildren()[0];
        let pos = node.convertToWorldSpaceAR(cc.v2(0, 0));
        pos = cc.find('Canvas').convertToNodeSpaceAR(pos);
        let width = 300;
        let height = 200;
        pos.x += node.width / 2 ;
        
        return {pos: pos, width: width, height: height};
    },

    getCakeNodeForGuide (idx) {
        let children = this.layoutNode.getChildren();
        if (children.length > idx) {
            return children[idx];
        }

        return null;
    },

    getUnusedCakeNodeForGuide () {
        let idxUnused = -1;
        for (let idx = 0; idx < playerData.workbench.length; idx++) {
            if (playerData.workbench[idx]) {
                idxUnused = idx;
                break;
            }
        }

        if (idxUnused === -1) {
            return null;
        }

        return this.getCakeNodeForGuide(idxUnused);
    },

    getUnusedCakeContentForGuide () {
        let node = this.getUnusedCakeNodeForGuide();

        let ret = null;
        if (node) {
            ret = {};
            ret.pos = node.convertToWorldSpaceAR(cc.v2(0, 0));
            ret.pos = cc.find('Canvas').convertToNodeSpaceAR(ret.pos);
            ret.width = node.width + 20;
            ret.height = node.height + 20;
        }

        return ret;
    },

    getUsedCakeNodeForGuide () {
        let idxUsed = -1;
        for (let idx = 0; idx < playerData.workbench.length; idx++) {
            if (playerData.workbench[idx]) {
                idxUsed = idx;
                break;
            }
        }

        if (idxUsed === -1) {
            return null;
        }

        return this.getCakeNodeForGuide(idxUsed);
    },

    updateBuff (buffType) {
        // if (buffType === constants.BUFF_TYPE.COMBINE_AUTO) {
        //     this.checkIsCombineAuto();
        // }
    },

    /**
     * 检查是否自动合并蛋糕
     */
    // checkIsCombineAuto () {
    //     let combineAutoBuff = gameLogic.getBuff(constants.BUFF_TYPE.COMBINE_AUTO);
    //     if (combineAutoBuff) {
    //         //有自动合成buff,开启自动合成功能
    //         if (!this.isCombining) { //如果正在自动合成中则不需要管了
    //             this.isCombining = true;
    //             this.schedule(this.combineAuto, Number(combineAutoBuff.buff.addValue));
    //         }
    //     } else {
    //         //关闭自动合成
    //         this.unschedule(this.combineAuto);
    //         this.isCombining = false;
    //     }
    // },

    /**
     * 开始自动合成蛋糕
     */
    startCombineAuto (buffType) {
        if (buffType === constants.BUFF_TYPE.COMBINE_AUTO) {
            let buffInfo = localConfig.getBuffByType(constants.BUFF_TYPE.COMBINE_AUTO);
            let delay = buffInfo.addValue;
            if (!this.isCombining) {
                this.isCombining = true;
                this.schedule(this.combineAuto, Number(delay));
            }
        }
    },

    /**
     * 关闭合成蛋糕
     */
    closeCombineAuto () {
        this.unschedule(this.combineAuto);
        this.isCombining = false;
    },

    combineAuto () {
        let arrSort = [];
        
        for (let idx = 0; idx < playerData.workbench.length; idx++) {
            let cakeNode = this.getCakeNodeForGuide(idx);
            let cakeItem = cakeNode.getComponent('cakeItem');
            let isUsed = cakeItem.isUsed;
            if (isUsed) {
                continue;
            }

            let cakeId = playerData.workbench[idx];
            if (cakeId === 'gift') {
                continue; //礼盒要屏蔽掉
            }

            if (cakeId) {
                arrSort.push({cakeId: cakeId, index: idx});
            }
        }

        if (arrSort.length <= 1) {
            return;  //只有一块蛋糕就不需要操作
        }

        //按照蛋糕id进行排序
        arrSort.sort(function(a, b){
            return Number(a.cakeId) - Number(b.cakeId);
        });

        
        let originIndex = -1;
        let targetIndex = -1;
        for (let idx = 0; idx < arrSort.length - 1; idx++) {
            if (arrSort[idx].cakeId === arrSort[idx+1].cakeId && arrSort[idx].cakeId.toString() !== this.maxLevel.toString()) { //排除最高等级，避免最高等级影响后续合成
                //找到等级最低的蛋糕了
                targetIndex = arrSort[idx].index;
                originIndex = arrSort[idx+1].index;
                break;
            }
        }

        if (originIndex !== -1 && targetIndex !== -1) {
            if (this.currentNode) {
                let cakeItem = this.currentNode.getComponent('cakeItem');
                if (cakeItem.index === originIndex || cakeItem.index === targetIndex) {
                    cakeItem.dragOver();
                    this.hideSameCake();
                    this.currentNode = null;
                    this.hideVirtualItem(false);
                }
            }
            
            gameLogic.combinOrSwap(originIndex, targetIndex);
        }
    },

    // update (dt) {},
});
