/**
 * Copyright (c) 2017 Xiamen Yaji Software Co.Ltd. All rights reserved.
 * Created by lizhiyi on 2018/6/21.
 */
var ResourceUtil = cc.Class({

    // use this for initialization
    onLoad () {

    },

    loadRes (url, type, cb) {
        cc.loader.loadRes(url, type, function (err, res) {
            if (err) {
                cc.error(err.message || err);
                cb(err, res);
                return;
            }

            cb(err, res);
        });
    },

    getUIPrefabRes (prefabPath, cb) {
        this.loadRes("prefabs/ui/" + prefabPath, cc.Prefab, cb);
    },

    createUI (path, cb, parent) {
        this.getUIPrefabRes(path, function (err, prefab) {
            if (err) return;
            var node = cc.instantiate(prefab);
            node.setPosition(cc.v2(0, 0));
            if (!parent) {
                parent = cc.find("Canvas");
            }

            parent.addChild(node);
            cb(null, node);
        });
    },

    createEffect (path, cb, parent) {
        this.loadRes("games/effects/" + path, cc.Prefab, function(err, prefab) {
            if (err) {
                cb('err', null);
                return;
            }

            var node = cc.instantiate(prefab);
            if (!parent) {
                parent = cc.find("Canvas");
            }

            parent.addChild(node);
            cb(null, node);
        });
    },

    /**
     * 设置更多游戏的游戏图标
     */
    setGameIcon (game, sprite, cb) {
        if (game.startsWith('http')) {
            this.setAvatar(game, sprite, cb);
        } else {
            this.setSpriteFrame('games/textures/icons/games/' + game, sprite, cb);
        }
    },

    // loadEffect: function (effectName, cb) {
    //     this.loadRes("effects/" + effectName + "/" + effectName, cc.Prefab, cb);
    // },

    // setHeadIcon: function (url, sprite) {
    //     cc.loader.load({ url: url, type: 'png' }, function (err, tex) {
    //         if (err) {
    //             console.error("set head icon failed! err:", err);
    //             return;
    //         }

    //         var spriteFrame = new cc.SpriteFrame(tex, cc.Rect(0, 0, tex.width, tex.height));

    //         if (cc.isValid(sprite)) {
    //             sprite.spriteFrame = spriteFrame;
    //         }
    //     });
    // },

    getJsonData (fileName, cb) {
        cc.loader.loadRes("datas/" + fileName, function (err, content) {
            if (err) {
                cc.error(err.message || err);
                return;
            }

            if (content.json) {
                cb(err, content.json);
            } else {
                cb('failed!!!');
            }
        });
    },

    getData (fileName, cb) {
        cc.loader.loadRes("datas/" + fileName, function (err, content) {
            if (err) {
                cc.error(err.message || err);
                return;
            }

            var text = content.text;
            if (!text) {
                cc.loader.load(content.nativeUrl, function(err, content) {
                    text = content;
                    cb(err, text);
                });
                return;
            }

            cb(err, text);
        });
    },

    setSpriteFrame (path, sprite, cb) {
        this.loadRes(path, cc.SpriteFrame, function (err, spriteFrame) {
            if (err) {
                console.error('set sprite frame failed! err:', path, err);
                cb(err);
                return;
            }

            if (sprite && cc.isValid(sprite)) {
                sprite.spriteFrame = spriteFrame;
                cb(null);
            }
        });
    },

    /**
     * 获取蛋糕图片
     * @param {string} cake 
     * @param {function} cb 
     */
    getCakeIcon (cake, cb) {
        this.loadRes('games/textures/icons/cakes/' + cake, cc.SpriteFrame, function (err, spriteFrame) {
            if (err) {
                console.error('get cake icon failed! err:', path, err);
                cb(err);
                return;
            }

            cb(null, spriteFrame);
        });
    },

    /**
     * 设置蛋糕图片
     * @param {string} cake 蛋糕图片名称
     * @param {cc.Sprite} sprite  
     * @param {function} cb 回调函数
     */
    setCakeIcon (cake, sprite, cb) {
        this.setSpriteFrame('games/textures/icons/cakes/' + cake, sprite, cb);
    },

    //格式化玩家名称，若是出现超出自动补全...
    formatName (name) {
        var result = '';
        if (name.length) {
            if (name.length > 6) {
                for (var i = 0; i < 6; i++) {
                    // var str = name[i] + name[i + 1];
                    // if (emojione.regUnicode.exec(str) !== null) {
                    //     result += str;
                    //     i++;
                    // } else {
                    //     result += name[i];
                    // }
                    result += name[i];

                }

                result += '...';
            } else {
                result = name;
            }
        }

        return result;
    },

    /**
     * 根据英雄的文件名获取头像
     */
    setAvatar (avatarUrl, sprite, cb) {
        if (!avatarUrl || !avatarUrl.startsWith('http')) {
            return;
        }

        var suffix = "png";

        cc.loader.load({ url : avatarUrl, type : suffix }, function (err, tex) {
            if (err) {
                console.error('set avatar failed! err:', avatarUrl, err);
                cb(err);
                return;
            }

            var spriteFrame = new cc.SpriteFrame(tex, cc.Rect(0, 0, tex.width, tex.height));

            if (sprite && cc.isValid(sprite)) {
                sprite.spriteFrame = spriteFrame;
                cb(null);
            }
        });
    },

    convertMovieClip2Animation (jsonInfo, pngTexture, callback) {
        let objRes = jsonInfo.res;
        let dictSpriteFrame = {};
        for (var resKey in objRes) {
            let res = objRes[resKey];
            let spriteFrame = new cc.SpriteFrame(pngTexture, cc.rect(res.x, res.y, res.w, res.h));
            
            dictSpriteFrame[resKey] = spriteFrame;
        }

        let objMc = jsonInfo.mc;
        let arrClip = [];
        for (var aniName in objMc) {
            let objAni = {};
            let ani = objMc[aniName];
            objAni.sample = ani.frameRate;
            objAni.frames = [];

            for (var idx = 0; idx < ani.frames.length; idx++) {
                let objFrame = ani.frames[idx];
                for (var idxFrames = 0; idxFrames < objFrame.duration; idxFrames++) {
                    objAni.frames.push(dictSpriteFrame[objFrame.res]);
                }
            }

            var clip = cc.AnimationClip.createWithSpriteFrames(objAni.frames, objAni.sample);
            clip.name = aniName;
            arrClip.push(clip);
        }

        callback(null, arrClip);
    },

    loadMoveClip (jsonFile, pngFile, callback) {
        let jsonInfo = null;
        let pngTexture = null;

        cc.loader.load({url: jsonFile, type: 'json'}, (err, info) => {
            //读取json文件
            if (err) {
                return;
            }

            jsonInfo = info;
            
            if (jsonInfo !== null && pngTexture !== null) {
                this.convertMovieClip2Animation(jsonInfo, pngTexture, callback);
            }
        });

        cc.loader.load({url: pngFile, type: 'png'}, (err, tex) => {
            //读取png文件
            if (err) {
                return;
            }

            pngTexture = tex;
            
            if (jsonInfo !== null && pngTexture !== null) {
                this.convertMovieClip2Animation(jsonInfo, pngTexture, callback);
            }
        });
    },

    updateNodeRenderers (node) { // very costly iterations
        let rootNodes = node.children;
        // walk all nodes with localize label and update
        let allLocalizedLabels = [];
        for (let i = 0; i < rootNodes.length; ++i) {
            let labels = rootNodes[i].getComponentsInChildren('LocalizedLabel');
            Array.prototype.push.apply(allLocalizedLabels, labels);
        }
        for (let i = 0; i < allLocalizedLabels.length; ++i) {
            let label = allLocalizedLabels[i];
            //if (this.label) {
                label.updateLabel();
           // }
        }
        // walk all nodes with localize sprite and update
        let allLocalizedSprites = [];
        for (let i = 0; i < rootNodes.length; ++i) {
            let sprites = rootNodes[i].getComponentsInChildren('LocalizedSprite');
            Array.prototype.push.apply(allLocalizedSprites, sprites);
        }
        for (let i = 0; i < allLocalizedSprites.length; ++i) {
            let sprite = allLocalizedSprites[i];
            sprite.updateSprite(window.i18n.curLang);
        }
    },

    /**
     * 格式化钱数，超过10000 转换位 10K   10000K 转换为 10M
     */
    formatMoney (money) {
        let arrUnit = ['', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y', 'B', 'N', 'D'];

        let strValue = '';
        for (let idx = 0; idx < arrUnit.length; idx++) {
            if (money >= 10000) {
                money /= 1000;
            } else {
                strValue = Math.floor(money) + arrUnit[idx];
                break;
            }
        }

        if (strValue === '') {
            strValue = Math.floor(money) + 'U'; //超过最大值就加个U
        }

        return strValue;
    },

    /**
     * sprite置灰或者复原
     *
     * @param {object} node
     * @param {boolean} flag
     */
    setGray (node, flag) {
        var sprites = node.getComponentsInChildren(cc.Sprite);
        for (var i = 0; i < sprites.length; ++i) {
            var sprite = sprites[i];
            if (flag) {
                sprite.setState(cc.Sprite.State.GRAY);
            } else {
                sprite.setState(cc.Sprite.State.NORMAL);
            }

        }
    },
});

var resourceUtil = new ResourceUtil();
resourceUtil.onLoad();
module.exports = resourceUtil;
