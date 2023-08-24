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
const utils = require('utils');
const localConfig = require('localConfig');
const clientEvent = require('clientEvent');
const gridView = require('gridView');

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

        nodeContent: cc.Node,
        prefabShopItem: cc.Prefab,

        shopGridView: {
            type: gridView,
            default: null
        }

        // lbGold: cc.Label
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {
        this.registEvent();
    },

    registEvent () {
        // clientEvent.on('updateGold', this.updatePlayerGold, this);
    },

    onEnable () {
        clientEvent.on('unlockCake', this.unlockCake, this);

        this.shopGridView.node.on('show', this.initGridView, this);
    },

    onDisable () {
        clientEvent.off('unlockCake', this.unlockCake, this);

        this.shopGridView.node.off('show', this.initGridView, this);
    }, 

    initGridView (event) {
        var index = event.index;
        var node = event.node;
        var content = event.content;
        node.getComponent('shopItem').show(this, index, content);
    },

    onDestroy () {
        // clientEvent.off('updateGold', this.updatePlayerGold, this);
    },

    onBtnCloseClick () {
        cc.gameSpace.audioManager.playSound('click', false);
        this.node.active = false;
    },

    initList () {
        // this.updatePlayerGold();

        //创建列表
        // let tbCake = localConfig.getTable('cake');
        // let idx = 0;
        // let arrShopItem = this.nodeContent.children;
        // for (let key in tbCake) {
        //     if (tbCake.hasOwnProperty(key)) {
        //         let node = null;
        //         if (idx < arrShopItem.length) {
        //             node = arrShopItem[idx];
        //         } else {
        //             node = cc.instantiate(this.prefabShopItem);
        //             this.nodeContent.addChild(node);
        //         }

        //         node.getComponent('shopItem').setInfo(tbCake[key]);
        //         idx ++;
        //     }
        // }

        let tbCake = localConfig.getTable('cake');
        let contents = [];
        for (let key in tbCake) {
            if (tbCake.hasOwnProperty(key)) {
                contents.push(tbCake[key]);
            }
        }

        this.shopGridView.init(contents);
    },

    unlockCake () {
        this.initList();
    },

    // updatePlayerGold () {
    //     this.lbGold.string = utils.formatMoney(playerData.getGold());
    // },

    // update (dt) {},
});
