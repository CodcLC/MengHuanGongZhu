/**
 * Copyright (c) 2018 Xiamen Yaji Software Co.Ltd. All rights reserved.
 * Created by daisy on 2018/8/20.
 */
const audioManager = require('audioManager');
const constants = require('constants');
cc.Class({
    extends: cc.Button,

    properties: {
        isPreventSecondClick: false,
        preventTime: 2,
        _N$transition: {
            override: true,
            default: 3  //cc.Tansition.SCALE
        },
        zoomScale: {
            override: true,
            default: 0.85
        },
        isPlaySound: true
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start () {
        let button = this.node.getComponent(cc.Button);
        this.node.on('click', function (event) {
            if (this.isPreventSecondClick) {
                button.interactable = false;
                this.scheduleOnce(function () {
                    if (button.node) button.interactable = true;
                }, this.preventTime);
            }

            if (this.isPlaySound) audioManager.playSound(constants.AUDIO_SOUND.CLICK, false);
        }, this);
    },

    // update (dt) {},
});
