/**
 * Copyright (c) 2018 Xiamen Yaji Software Co.Ltd. All rights reserved.
 * Created by daisy on 2018/1/19.
 */
var i18n = require('LanguageData');
var clientEvent = require('clientEvent');

cc.Class({
    extends: cc.Component,

    properties: {
        isPlayEnableAnimation: {
            default: false,
            tooltip: 'Whether to play enable animation'
        },
        enableAnimationName: {
            default: "",
            tooltip: 'The name of enable animation'
        },
        isPlayDisableAnimation: {
            default: false,
            tooltip: 'Whether to play disable animation'
        },
        disableAnimationName: {
            default: "",
            tooltip: 'The name of disable animation'
        },
        disableAnimationReverse: {
            default: false,
            tooltip: 'Whether to reverse disable animation'
        },
        disableAnimationSpeed: {
            default: 0,
            tooltip: 'The speed of disable animation'
        }
    },

    // use this for initialization
    onLoad: function () {
        this.animation = this.node.getComponent(cc.Animation);
        if (!this.animation) {
            //cc.error('The node has`t animation component');
            return;
        }

        this.clips = this.animation.getClips();

        var clip = this.isAnimationExist(this.disableAnimationName);
        if (clip) {
            this.disableAnimationWrapMode = clip.wrapMode;
            this.disableAnimationDefaultSpeed = clip.speed;
        }
    },

    onEnable: function () {
        if (!this.animation) return;
        if (this.isPlayEnableAnimation && this.isAnimationExist(this.enableAnimationName)) {
            var animationState =  this.animation.play(this.enableAnimationName);
            if (this.enableAnimationName === this.disableAnimationName) {
                animationState.wrapMode = this.disableAnimationWrapMode;
                animationState.speed = this.disableAnimationDefaultSpeed;
            }

            this.enableAnimationState = animationState;
        }
    },

    close: function (callback) {
        this.closeCallback = callback;
        if (!this.animation) {
            this.closeFinish();
            return;
        }
        var clip = this.isAnimationExist(this.disableAnimationName);
        if (this.isPlayDisableAnimation && clip) {
            this.animation.once('finished', this.closeFinish, this);
            var animationState =  this.animation.play(this.disableAnimationName);
            if (this.disableAnimationReverse) {
                animationState.wrapMode = cc.WrapMode.Reverse;
            }

            if (this.disableAnimationSpeed !== 0) {
                animationState.speed = this.disableAnimationSpeed;
            }

            this.disableAnimationState = animationState;
        } else {
            this.closeFinish();
        }
    },

    closeFinish: function () {
        // if (isDestroy) {
        //     this.node.destroy();
        // } else {
        //     this.node.active = false;
        // }
        if (this.closeCallback) {
            this.closeCallback();
        } else {
            this.node.active = false;
        }
        
    },

    isAnimationExist: function (animationName) {
        return _.find(this.clips, function (clip) {
            return clip.name === animationName;
        });
    },

    clickFinish: function (param) {
        clientEvent.dispatchEvent('finishClickAnimation', param);
    }
});
