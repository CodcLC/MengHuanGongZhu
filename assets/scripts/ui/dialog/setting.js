// Learn cc.Class:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/class.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/class.html
// Learn Attribute:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] http://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/en/scripting/life-cycle-callbacks.html

const clientEvent = require('clientEvent');
const audioManager = require('audioManager');
const constants = require('constants');
const i18n = require('LanguageData');
const configuration = require('configuration');
const resourceUtil = require('resourceUtil');
const localConfig = require('localConfig');
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

        nodeMusicOpen: cc.Node,
        nodeMusicClose: cc.Node,

        nodeSoundOpen: cc.Node,
        nodeSoundClose: cc.Node,

        lbVersion: cc.Label,
        nodeZhConfirm: cc.Node,
        nodeEnConfirm: cc.Node,
        nodeLanguage: cc.Node
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.arrLang = [];
        this.arrLang.push(this.nodeZhConfirm, this.nodeEnConfirm);
        this.langData = {};
        let lang = configuration.jsonData.lang;
        this.refresh(lang);
    },

    start() {

    },

    show() {
        gameLogic.customEventStatistics(constants.STAT_EVENT_TYPE.SETTING_SHOW, {});

        let isMusicOpen = audioManager.getConfiguration(true);
        let isSoundOpen = audioManager.getConfiguration(false);

        this.nodeMusicOpen.active = !isMusicOpen;
        this.nodeMusicClose.active = isMusicOpen;

        this.nodeSoundOpen.active = !isSoundOpen;
        this.nodeSoundClose.active = isSoundOpen;

        this.lbVersion.string = localConfig.getVersion();

        resourceUtil.updateNodeRenderers(this.node);
    },

    onBtnCloseClicked() {
        cc.gameSpace.audioManager.playSound('click', false);

        cc.gameSpace.uiManager.hideSharedDialog('dialog/setting');
    },

    onBtnMusicOpenClicked() {
        cc.gameSpace.audioManager.playSound('click', false);

        audioManager.openMusic();

        this.show();
    },

    onBtnMusicCloseClicked() {
        cc.gameSpace.audioManager.playSound('click', false);

        audioManager.closeMusic();

        this.show();
    },

    onBtnSoundOpenClicked() {
        cc.gameSpace.audioManager.playSound('click', false);

        audioManager.openSound();

        this.show();
    },

    onBtnSoundCloseClicked() {
        cc.gameSpace.audioManager.playSound('click', false);

        audioManager.closeSound();

        this.show();
    },
    onSelectZhClick() {
        let language = 'zh'
        this.setLanguage(language);
    },
    onSelectEnClick() {
        let language = 'en'
        this.setLanguage(language);
    },
    setLanguage(language) {
        i18n.init(language);
        i18n.updateSceneRenderers();
        this.langData.lang = language;
        configuration.setGlobalData(Object.keys(this.langData)[0], this.langData.lang);
        clientEvent.dispatchEvent('languageChange');
        this.refresh(language);
    },
    refresh(language) {
        this.arrLang.forEach((item, idx, arr) => {
            arr[idx].active = false;
        })
        switch (language) {
            case 'zh':
                this.nodeZhConfirm.active = true;
                break;
            case 'en':
                this.nodeEnConfirm.active = true;
                break;
        }
    }
    // update (dt) {},
});