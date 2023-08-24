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
const localConfig = require('localConfig');
const audioManager = require('audioManager');
const configuration = require('configuration');
const clientEvent = require('clientEvent');
const playerData = require('playerData');
const constants = require('constants');
const gameLogic = require('gameLogic');
const guideLogic = require('guideLogic');
const uiManager = require('uiManager');
const updateValueLabel = require('updateValueLabel');

cc.gameSpace = {};
cc.gameSpace.TIME_SCALE = 1;
cc.gameSpace.isStop = false;
cc.gameSpace.SDK = 'open';
i18n.init('zh');

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

        edtAccount: cc.EditBox,
        btnStart: cc.Node,
        nodeAccount: cc.Node,
        nodeProgress: cc.Node,
        lbProgress: updateValueLabel,
        nodeFeedback: cc.Node
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        let winSize = cc.winSize;
        if (winSize.width > winSize.height || (winSize.height / winSize.width) < 1.4) {
            this.node.getComponent(cc.Canvas).fitHeight = true;
        }

        i18n.init('zh');

        // this.nodeAccount.active = true;
        // this.btnStart.active = true;
        // this.nodeProgress.active = false;
    },

    start() {
        cc.debug.setDisplayStats(false);

        cc.gameSpace.isIphoneX = (cc.game.canvas.height / cc.game.canvas.width) > 2;
        cc.gameSpace.audioManager = audioManager;
        cc.gameSpace.gameLogic = gameLogic;
        cc.gameSpace.uiManager = uiManager;
        cc.gameSpace.showTips = uiManager.showTips.bind(uiManager);
        cc.gameSpace.showLoading = uiManager.showLoading.bind(uiManager);
        cc.gameSpace.hideLoading = uiManager.hideLoading.bind(uiManager);
        cc.gameSpace.clientEvent = clientEvent;
        // cc.gameSpace.isInitFinished = false;
        cc.gameSpace.isConfigLoadFinished = false;

        localConfig.loadConfig(() => {
            cc.gameSpace.isConfigLoadFinished = true;
        });

        this.refreshUI();
    },


    refreshUI() {
        var account = configuration.getGlobalData(constants.LOCAL_CACHE.ACCOUNT);
        if (!account) {
            account = playerData.generateRandomAccount();
        }

        this.uid = account;
        this.playerName = account;

        this.userLogin();
    },

    userLogin() {
        //后续考虑wx接入时应该以wx账号为准
        playerData.userId = this.uid;
        playerData.nickName = this.playerName;
        playerData.avatar = this.headIcon;
        configuration.setGlobalData(constants.LOCAL_CACHE.ACCOUNT, this.uid);
        configuration.setUserId(this.uid);
        playerData.loadFromCache();

        clientEvent.dispatchEvent('hideWaiting');

        this.loadMainScene();
    },

    loadMainScene() {
        cc.director.preloadScene('main', function(err) {
            if (!err) {
                cc.director.loadScene('main', function() {
                    guideLogic.start();
                });
            }
        });
    },

    // update (dt) {},
});