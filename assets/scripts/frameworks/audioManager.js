/**
 * Copyright (c) 2017 Xiamen Yaji Software Co.Ltd. All rights reserved.
 * Created by daisy on 2017/6/22.
 * 统一控制音乐音效
 */
const configuration = require('configuration');
const resourceUtil = require('resourceUtil');

let AudioManager = cc.Class({

    properties: {
        musicVolume: 1,
        soundVolume: 1,
    },

    // use this for initialization
    onLoad() {
        this.audios = {};
        this.arrSound = [];

        this.musicVolume = this.getConfiguration(true) ? 0.8 : 0;
        this.soundVolume = this.getConfiguration(false) ? 1 : 0;
    },

    /**
     * 播放音乐
     * @param {String} name 音乐名称可通过constants.AUDIO_MUSIC 获取
     * @param {Boolean} loop 是否循环播放
     */
    playMusic(name, loop) {
        this.play(name, loop, true);
    },

    /**
     * 播放音效
     * @param {String} name 音效名称可通过constants.AUDIO_SOUND 获取
     * @param {Boolean} loop 是否循环播放
     */
    playSound(name, loop) {
        if (loop) {
            this.play(name, loop, false);
        } else {
            //音效一般是多个的，不会只有一个
            resourceUtil.loadRes('games/audios/sound/' + name, cc.AudioClip, (err, clip) => {
                let tmp = {};
                tmp.clip = clip;
                tmp.loop = loop;
                tmp.isMusic = false;
                let audioId = cc.audioEngine.play(clip, false, this.soundVolume);
                tmp.audioId = audioId;
                this.arrSound.push(tmp);

                cc.audioEngine.setFinishCallback(audioId, () => {
                    _.remove(this.arrSound, (obj) => {
                        return obj.audioId === audioId;
                    });
                });
            });
        }


    },

    play(name, loop, isMusic) {
        let audio = this.audios[name];

        // 手动暂停的 flag 在调用了 playMusic/playSound 后就改变。否则会造成无法播放啦
        if (audio) {
            audio.isManualStop = false;
        }

        if (audio) {
            // console.log('play' + name);
            // console.log(audio.audioId);
            // console.log(typeof audio.audioId);
            // console.log(isNaN(audio.audioId));
            if (this.isAudioStarting(audio.audioId) && isMusic) return;

            this.playClip(name, isMusic);
        } else {
            let path = 'games/audios/';
            if (isMusic) {
                path += 'music/';
            } else {
                path += 'sound/';
            }

            // AudioClip 实际上是字符串，可以直接用字符串进行声音播放
            // loadRes 返回的 AudioClip 带有md5值，会导致资源下载两次
            // let tmp = {
            //     clip: 'res/raw-assets/resources/' + path + name,
            //     loop: loop,
            //     isMusic: isMusic
            // };

            // 修复关闭后开启未播放的问题，观察是否引起重复播放的问题
            // this.audios[name] = tmp;
            // this.playClip(name, isMusic);

            // creator 2.0 不建议在 play 接口内直接填写音频的 url 地址
            resourceUtil.loadRes(path + name, cc.AudioClip, (err, clip) => {
                let tmp = {};
                tmp.clip = clip;
                tmp.loop = loop;
                tmp.isMusic = isMusic;
                this.audios[name] = tmp;
                this.playClip(name, isMusic);
            });
        }
    },

    playClip(name, isMuisc) {
        // console.log('playClip: ' + JSON.stringify(this.audios));
        let audio = this.audios[name];
        if (typeof audio.audioId === "number") {
            let state = cc.audioEngine.getState(audio.audioId);
            if (state === cc.audioEngine.AudioState.PLAYING && audio.loop) return;
        }

        let volume = this.musicVolume;
        if (!isMuisc) {
            volume = this.soundVolume;
        }

        let audioId = cc.audioEngine.play(audio.clip, audio.loop, volume);
        audio.audioId = audioId;
    },

    stop(name) {
        if (this.audios.hasOwnProperty(name)) {
            let audioId = this.audios[name].audioId;
            if (typeof(audioId) !== "undefined")
                cc.audioEngine.stop(audioId);
            this.audios[name].isManualStop = true;
            // this.setVolume(audioId, 0, name);
        }
    },

    setMusic(flag) {
        this.musicVolume = flag;
        for (let item in this.audios) {
            if (this.audios.hasOwnProperty(item) && this.audios[item].isMusic) {
                // this.changeState(item, flag);
                let audio = this.audios[item];
                this.setVolume(audio.audioId, this.musicVolume);
            }
        }
    },

    openMusic() {
        this.setMusic(0.8);
        configuration.setGlobalData('music', 'true');
    },

    closeMusic() {
        this.setMusic(0);
        configuration.setGlobalData('music', 'false');
    },

    openSound() {
        this.setSound(1);
        configuration.setGlobalData('sound', 'true');
    },

    closeSound() {
        this.setSound(0);
        configuration.setGlobalData('sound', 'false');
    },

    setSound(flag) {
        this.soundVolume = flag;
        for (let item in this.audios) {
            if (this.audios.hasOwnProperty(item) && !this.audios[item].isMusic) {
                // this.changeState(item, flag);
                let audio = this.audios[item];
                this.setVolume(audio.audioId, this.soundVolume);
            }
        }

        for (let idx = 0; idx < this.arrSound.length; idx++) {
            let audio = this.arrSound[idx];
            this.setVolume(audio.audioId, this.soundVolume);
        }
    },

    changeState(name, flag) {
        // let audio = this.audios[name];
        // if (flag) {
        //     // 打开声音，循环播放和没有被手动暂停的音乐进行播放
        //     if (audio.loop && !audio.isManualStop) {
        //         if (typeof audio.audioId === 'number') {
        //             this.setVolume(audio.audioId, 1);
        //         } else {
        //             // 还没有加载过
        //             this.playClip(name);
        //         }
        //     }
        // } else {
        //     if (typeof audio.audioId === 'number') {
        //         this.setVolume(audio.audioId, 0, name);
        //     }
        // }

        let audio = this.audios[name];
        // console.log('changeState' + name);
        // console.log(audio.audioId);
        // console.log(typeof audio.audioId);
        // console.log(isNaN(audio.audioId));
        if (flag && audio.loop && !audio.isManualStop) {
            if (typeof audio.audioId === "number") {
                if (this.isAudioStarting(audio.audioId)) return;
            }

            this.playClip(name);
        } else if (!flag) {
            if (typeof audio.audioId === "number") {
                if (this.isAudioStarting(audio.audioId)) {
                    cc.audioEngine.stop(audio.audioId);
                }
            }
        }
    },

    getConfiguration(isMusic) {
        let state;
        if (isMusic) {
            state = configuration.getGlobalData('music');
        } else {
            state = configuration.getGlobalData('sound');
        }

        // console.log('Config for [' + (isMusic ? 'Music' : 'Sound') + '] is ' + state);

        return !state || state === 'true' ? true : false;
    },

    /**
     * 判断声音是否处于播放或初始化中（下载中）的状态
     */
    isAudioStarting(audioId) {
        let ret = false;
        if (typeof audioId === 'number') {
            let state = cc.audioEngine.getState(audioId);
            ret = state === cc.audioEngine.AudioState.PLAYING || state === cc.audioEngine.AudioState.INITIALZING;

            // 微信小游戏中cc.audioEngine.getState(audioId)一旦加载就返回2.bug
            // if (cc.sys.browserType === cc.sys.BROWSER_TYPE_WECHAT_GAME) {
            //     ret = ret || state === cc.audioEngine.AudioState.PAUSED;
            // }
            // console.log('### Audio ' + audioId + ' state is: ' + state);
        }

        return ret;
    },

    setVolume: function(id, volume) {
        let state = cc.audioEngine.getState(id);
        console.log('### audioId ' + id + ' state is: ' + state);

        cc.audioEngine.setVolume(id, volume);
    }
});

let audioManager = new AudioManager();
audioManager.onLoad();
module.exports = audioManager;