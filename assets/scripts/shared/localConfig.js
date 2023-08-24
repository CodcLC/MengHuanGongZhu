/**
 * Copyright (c) 2017 Xiamen Yaji Software Co.Ltd. All rights reserved.
 */
var ConfigManager = null;
var constants = null;
var utils = null;
var formula = null;
var resourceUtil = null;
var i18n = null;
var configuration = null;

if (typeof (cc) !== "undefined") {
    ConfigManager = require("configManager");
    constants = require("constants");
    utils = require("utils");
    formula = require("formula");
    resourceUtil = require("resourceUtil");
    i18n = require('LanguageData');
    configuration = require('configuration');
} else {
    ConfigManager = require("./configManager");
    constants = require("./constants");
    utils = require("./utils");
    formula = require("./formula");

    //var _ = require("lodash"); //shared代码不能使用第三方模块
}

var LocalConfig = {
    _callback: null,

    loadConfig: function (cb) {
        this._callback = cb;
        this.loadCSV();
    },

    loadCSV: function () {
        this._skills = {};

        this.currentLoad = 0;
        var _this = this;

        if (typeof (cc) !== "undefined") {
            //新增数据表 请往该数组中添加....
            var arrTables = ['cake', 'dailySign', 'dailyTask', 'invite', 'lottery', 'buff', 'moreGame'];
            this.cntLoad = arrTables.length + 1; //+1主要是后续还有技能配置的加载，特殊处理

            //客户端加载
            arrTables.forEach(function (tableName, index, array) {
                resourceUtil.getData(tableName, function (err, content) {
                    ConfigManager.addTable(tableName, content);
                    _this.tryToCallbackOnFinished();
                });
            });

            //载入技能配置信息
            // resourceUtil.getData("skills", function (err, content) {
            //     _this._skills = JSON.parse(content);
            //     _this.tryToCallbackOnFinished();
            // });

            resourceUtil.getJsonData("servers", function(err, content) {
                _this.servers = content;
                _this.tryToCallbackOnFinished();
            });

        } else {
            //服务端加载
            var fs = require("fs");
            var path = require("path");

            ConfigManager.init();

            var root = __dirname + "/../datas";

            root = path.normalize(root);

            var tablePathArr = [];
            var tableNameArr = [];
            var files = fs.readdirSync(root);
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                if (file.indexOf(".csv") === -1 || file.indexOf(".csv.meta") !== -1) {
                    continue;
                }

                var fileName = file.split(".")[0];

                var pathname = root + "/" + file;
                var stat = fs.lstatSync(pathname);
                if (!stat.isDirectory()) {
                    tableNameArr.push(fileName);
                    tablePathArr.push(pathname);
                }
            }

            var loadTimeRecord = {};
            var loadTable = function (tableName, filePath) {
                var curTime = new Date().getTime();
                if (loadTimeRecord[filePath]) {
                    if (curTime - loadTimeRecord[filePath] < 1000) {
                        return;
                    }
                }

                loadTimeRecord[filePath] = curTime;

                var content = fs.readFileSync(filePath);
                if (content.length <= 0) {
                    return;
                }

                ConfigManager.addTable(tableName, content.toString(), true);
            };

            var watchTable = function (tableName, filePath) {
                fs.watch(filePath, function (event, name) {
                    if (event !== "change") {
                        return;
                    }

                    // 文件如果被修改后,不要立即读取，会读取不到
                    setTimeout(function () {
                        loadTable(tableName, filePath);
                    }, 100);
                });
            };

            for (var index = 0; index < tableNameArr.length; index++) {
                loadTable(tableNameArr[index], tablePathArr[index]);
                watchTable(tableNameArr[index], tablePathArr[index]);
            }

            //加载技能信息
            this._skills = [];
            this._env = [];
            this._dirtyWords = [];
            var arrJson = ["skills.zy8", "env.zy8", "dirtyWords.zy8"];
            var updateJsonObj = function (index, info) {
                switch (index) {
                    case 0:
                        this._skills = info;
                        break;
                    case 1:
                        this._env = info;
                        break;
                    case 2:
                        this._dirtyWords = info;
                        break;
                }
            }.bind(this);

            var watchJson = function (event, filename) {
                if (event !== "change") {
                    return;
                }

                var index = -1;
                for (var idxFile = 0; idxFile < arrJson.length; idxFile++) {
                    if (filename === arrJson[idxFile]) {
                        index = idxFile;
                        break;
                    }
                }

                if (index !== -1) {
                    // 文件如果被修改后,不要立即读取，会读取不到
                    var filePath = root + "/" + filename;
                    setTimeout(function () {
                        var info = fs.readFileSync(filePath);
                        info = JSON.parse(info);

                        updateJsonObj(index, info);

                        console.info("reload config: " + filePath);
                    }.bind(this, filePath), 100);
                }
            };

            for (var idxJson = 0; idxJson < arrJson.length; idxJson++) {
                var filePath = root + "/" + arrJson[idxJson];

                if (!fs.existsSync(filePath)) {
                    continue;
                }

                var info = fs.readFileSync(filePath);
                info = JSON.parse(info);
                updateJsonObj(idxJson, info);

                fs.watch(filePath, watchJson);
            }

            // var skillFilePath = root + "/skills.json";
            // var envFilePath = root + "/env.json";
            // this._skills = require(skillFilePath);
            // this._env = require(envFilePath);
            // fs.watch(skillFilePath, function (event, name) {
            //     if (event !== "change") {
            //         return;
            //     }
            //
            //     var _this = this;
            //
            //     // 文件如果被修改后,不要立即读取，会读取不到
            //     setTimeout(function () {
            //         delete require.cache[skillFilePath];
            //
            //         _this._skills = require(skillFilePath);
            //
            //         console.info("reload config: " + skillFilePath);
            //     }, 100);
            // });

            if (this._callback) {
                this._callback();
            }
        }
    },

    queryOne: function (tableName, key, value) {
        return ConfigManager.queryOne(tableName, key, value);
    },

    queryByID: function (tableName, ID) {
        return ConfigManager.queryByID(tableName, ID);
    },

    getTable: function (tableName) {
        return ConfigManager.getTable(tableName);
    },

    // 选出指定表里面所有有 key=>value 键值对的数据
    queryAll: function (tableName, key, value) {
        return ConfigManager.queryAll(tableName, key, value);
    },

    // 选出指定表里所有 key 的值在 values 数组中的数据，返回 Object，key 为 ID
    queryIn: function (tableName, key, values) {
        return ConfigManager.queryIn(tableName, key, values);
    },

    // 选出符合条件的数据。condition key 为表格的key，value 为值的数组。返回的object，key 为数据在表格的ID，value为具体数据
    queryByCondition: function (tableName, condition) {
        return ConfigManager.queryByCondition(tableName, condition);
    },

    tryToCallbackOnFinished: function () {
        if (this._callback) {
            this.currentLoad++;
            if (this.currentLoad >= this.cntLoad) {
                this._callback();
            }
        }
    },

    getEnvModule: function (moduleName) {
        return this._env[moduleName];
    },

    getEnv: function (moduleName, subName) {
        var module = this.getEnvModule(moduleName);
        if (!module) {
            return null;
        }

        return module[subName].value;
    },

    getServerList: function () {
        return this.servers;
    },

    getCurrentServer: function() {
        if (this.servers === null) {
            this.getServerList();
        }
        return this.servers[0];
    },

    getVersion () {
        let server = this.getCurrentServer();
        let version = server ? server.version : 'unknown';
        return version;
    },

    /**
     * 根据任务类型获得每日任务列表
     */
    getDailyTaskByType (taskType) {
        let tbTasks = this.getTable('dailyTask');
        let arrRet = [];

        for (let key in tbTasks) {
            if (tbTasks.hasOwnProperty(key)) {
                let item = tbTasks[key];
                item.taskId = key;
                if (item.type === taskType) {
                    arrRet.push(item);
                }
            }
        }

        return arrRet;
    },

    /**
     * 根据buff类型获得对应信息
     */
    getBuffByType (type) {
        let tbBuff = this.getTable('buff');
        
        for (let key in tbBuff) {
            if (tbBuff.hasOwnProperty(key)) {
                let item = tbBuff[key];
                item.buffId = key;
                if (item.type === type) {
                    return item;
                }
            }
        }

        return null;

    },

    getCakeMaxLevel () {
        let tbCake = this.getTable('cake');
        let maxValue = 0;
        for (let key in tbCake) {
            let level = Number(key);
            if (level>maxValue) {
                maxValue = level;
            }
        }
        return maxValue;
    }
};

var localConfig = Object.create(LocalConfig);
if (typeof (cc) === "undefined") {
    localConfig.loadConfig();
}

module.exports = localConfig;
