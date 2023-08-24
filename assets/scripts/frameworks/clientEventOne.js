/**
 * Copyright (c) 2017 Xiamen Yaji Software Co.Ltd. All rights reserved.
 */
var eventListener = require("eventListener");
var clsListener = eventListener.getBaseClass("one");
var i18n = require("LanguageData");

var ClientEventOne = cc.Class({
    extends: clsListener,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
    },

    // use this for initialization
    onLoad: function () {
        this._EVENT_TYPE = [
           
        ];

        this.setSupportEventList(this._EVENT_TYPE);
    },

    showTipByTextKey: function (textKey) {
        return this.dispatchEvent("showTips", i18n.t(textKey));
    }

});

var clientEventOneToOne = new ClientEventOne();
clientEventOneToOne.onLoad();
module.exports = clientEventOneToOne;