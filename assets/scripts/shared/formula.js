/**
 * Copyright (c) 2017 Xiamen Yaji Software Co.Ltd. All rights reserved.
 * Created by lizhiyi on 2017/2/9.
 */
var constants = null;
if (typeof cc !== "undefined") {
    constants = require("constants");
} else {
    constants = require("./constants");
}

var formula = {


    /**
     * 是否击中概率
     * @param {number} probability 概率(小于1大于0的数)
     * @returns {boolean} 是否击中概率
     */
    isHit (probability) {
        //Math.random()生成[0-1) 的数 并且向下取整，因此需要小于(并且不等于) 概率才算击中
        var value = Math.floor(Math.random() * (100));
        return value < probability * 100;
    },

    /**
     * 是否击中概率
     * @param {number} percent 概率(百分比)
     * @returns {boolean} 是否击中概率
     */
    isHitWithPercent (percent) {
        return this.isHit(percent / 100.0);
    },

    /**
     * 根据基础价格以及购买次数 获得最终价格
     * @param {Number} basePrice 
     * @param {Number} buyTimes 
     */
    getCakeBuyingPrice (basePrice, buyTimes) {
        return Math.floor(basePrice * Math.pow(1.175, buyTimes));
    },

    /**
     * 根据基础价格以及购买次数 获得最终价格
     * @param {Number} basePrice 
     * @param {Number} buyTimes 
     */
    getCakeDiamondPrice (basePrice, buyTimes) {
        return Math.floor(basePrice * Math.pow(1.07, buyTimes));
    },

    /**
     * 获得基础蛋糕的购买价格
     */
    getBaseCakeBuyingPrice (basePrice, buyTimes) {
        return Math.floor(basePrice * Math.pow(1.07, buyTimes));
    },
};

module.exports = formula;