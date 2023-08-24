/**
 * Copyright (c) 2017 Xiamen Yaji Software Co.Ltd. All rights reserved.
 * Created by leo on 16/3/23.
 * Modify by lizhiyi on 16/12/23
 */

"use strict";

var CELL_DELIMITERS = [",", ";", "\t", "|", "^"];
var LINE_DELIMITERS = ["\r\n", "\r", "\n"];

var getter = function (index) {
    return ("d[" + index + "]");
};

// var getterCast = function(value, index, cast) {
//
//     if (cast instanceof Array) {
//         if (cast[index] === "number") {
//             return ("Number(" + (getter(index)) + ")");
//         } else if (cast[index] === "boolean") {
//             return ((getter(index)) + " === \"true\" || " + (getter(index)) + " === \"t\" || " + (getter(index)) + " === \"1\"");
//         } else {
//             return getter(index);
//         }
//     } else {
//         if (!isNaN(Number(value))) {
//             return ("Number(" + (getter(index)) + ")");
//         } else if (value == "false" || value == "true" || value == "t" || value == "f") {
//             return ((getter(index)) + " === \"true\" || " + (getter(index)) + " === \"t\"");
//         } else {
//             return getter(index);
//         }
//     }
// };

var getterCast = function(value, index, cast, d) {

    if (cast instanceof Array) {
        if (cast[index] === "number") {
            return Number(d[index]);
        } else if (cast[index] === "boolean") {
            return d[index] === "true" ||  d[index] === "t" || d[index] === "1";
        } else {
            return d[index];
        }
    } else {
        if (!isNaN(Number(value))) {
            return Number(d[index]);
        } else if (value == "false" || value == "true" || value == "t" || value == "f") {
            return d[index] === "true" ||  d[index] === "t" || d[index] === "1";
        } else {
            return d[index];
        }
    }
};

var CSV = {
    //

    /* =========================================
        * Constants ===============================
        * ========================================= */

    STANDARD_DECODE_OPTS: {
        skip: 0,
        limit: false,
        header: false,
        cast: false,
        comment: ""
    },

    STANDARD_ENCODE_OPTS: {
        delimiter: CELL_DELIMITERS[0],
        newline: LINE_DELIMITERS[0],
        skip: 0,
        limit: false,
        header: false
    },

    quoteMark: '"',
    doubleQuoteMark: '""',
    quoteRegex: /"/g,

    /* =========================================
        * Utility Functions =======================
        * ========================================= */
    assign: function () {
        var args = Array.prototype.slice.call(arguments);
        var base = args[0];
        var rest = args.slice(1);
        for (var i = 0, len = rest.length; i < len; i++) {
            for (var attr in rest[i]) {
                base[attr] = rest[i][attr];
            }
        }

        return base;
    },

    map: function (collection, fn) {
        var results = [];
        for (var i = 0, len = collection.length; i < len; i++) {
            results[i] = fn(collection[i], i);
        }

        return results;
    },

    getType: function (obj) {
        return Object.prototype.toString.call(obj).slice(8, -1);
    },

    getLimit: function (limit, len) {
        return limit === false ? len : limit;
    },

    // buildObjectConstructor: function (fields, sample, cast) {
    //     var body = ["var object = new Object()"];
    //     var setter = function(attr) {
    //         return ("object[" + (JSON.stringify(attr)) + "] = ");
    //     };
    //
    //     if (cast) {
    //         body = body.concat(this.map(fields, function (attr, idx) {
    //             return setter(attr) + getterCast(sample[idx], idx, cast);
    //         }));
    //     } else {
    //         body = body.concat(this.map(fields, function (attr, idx) {
    //             return setter(attr) + getter(idx);
    //         }));
    //     }
    //
    //     body.push("return object;");
    //     return new Function("d", body.join(";\n"));
    // },
    //
    // buildArrayConstructor: function (sample, cast) {
    //     var body = ["var row = new Array(" + sample.length + ")"];
    //     var setter = function (idx) {
    //         return ("row[" + idx + "] = ");
    //     };
    //
    //     if (cast) {
    //         body = body.concat(this.map(sample, function (val, idx) {
    //             return setter(idx) + getterCast(val, idx, cast);
    //         }));
    //     } else {
    //         body = body.concat(this.map(sample, function (_, idx) {
    //             return setter(idx) + getter(idx);
    //         }));
    //     }
    //
    //     body.push("return row;");
    //     return new Function("d", body.join(";\n"));
    // },

    buildObjectConstructor: function(fields, sample, cast) {
        return function(d) {
            var object = new Object();
            var setter = function(attr, value) {
                return object[attr] = value;
            };
            if (cast) {
                fields.forEach(function(attr, idx) {
                    setter(attr, getterCast(sample[idx], idx, cast, d));
                });
            } else {
                fields.forEach(function(attr, idx) {
                    setter(attr, getterCast(sample[idx], idx, null, d));
                });
            }
            // body.push("return object;");
            // body.join(";\n");
            return object;
        };
    },

    buildArrayConstructor: function(sample, cast) {
        return function(d) {
            var row = new Array(sample.length);
            var setter = function(idx, value) {
                return row[idx] = value;
            };
            if (cast) {
                fields.forEach(function(attr, idx) {
                    setter(attr, getterCast(sample[idx], idx, cast, d));
                });
            } else {
                fields.forEach(function(attr, idx) {
                    setter(attr, getterCast(sample[idx], idx, null, d));
                });
            }
            return row;
        };
    },

    frequency: function (coll, needle, limit) {
        if (limit === void 0) limit = false;

        var count = 0;
        var lastIndex = 0;
        var maxIndex = this.getLimit(limit, coll.length);

        while (lastIndex < maxIndex) {
            lastIndex = coll.indexOf(needle, lastIndex);
            if (lastIndex === -1) break;
            lastIndex += 1;
            count++;
        }

        return count;
    },

    mostFrequent: function (coll, needles, limit) {
        var max = 0;
        var detected;

        for (var cur = needles.length - 1; cur >= 0; cur--) {
            if (this.frequency(coll, needles[cur], limit) > max) {
                detected = needles[cur];
            }
        }

        return detected || needles[0];
    },

    unsafeParse: function (text, opts, fn) {
        var lines = text.split(opts.newline);

        if (opts.skip > 0) {
            lines.splice(opts.skip);
        }

        var fields;
        var constructor;

        function cells(lines) {
            var line = lines.shift();
            if (line.indexOf('"') >= 0) {// 含引号

                // 找到这行完整的数据, 找到对称的双引号
                var lastIndex = 0;
                var findIndex = 0;
                var count = 0;
                while (lines.length > 0) {
                    lastIndex = line.indexOf('"', findIndex);
                    if (lastIndex === -1 && count % 2 === 0) break;

                    if (lastIndex !== -1) {
                        findIndex = lastIndex + 1;
                        count++;
                    } else {
                        line = line + opts.newline + lines.shift();
                    }
                }

                var list = [];
                var item;

                var quoteCount = 0;

                var start = 0;
                var end = 0;
                var length = line.length;
                for (var key in line) {
                    if (!line.hasOwnProperty(key)) {
                        continue;
                    }

                    key = parseInt(key);
                    var value = line[key];

                    if (key === 0 && value === '"') {
                        quoteCount++;
                        start = 1;
                    }

                    if (value === '"') {
                        quoteCount++;

                        if (line[key - 1] === opts.delimiter && start === key) {
                            start++;
                        }
                    }

                    if (value === '"' && quoteCount % 2 === 0) {

                        if (line[key + 1] === opts.delimiter || key + 1 === length) {
                            end = key;
                            item = line.substring(start, end);
                            list.push(item);
                            start = end + 2;
                            end = start;
                        }

                    }

                    if (value === opts.delimiter && quoteCount % 2 === 0) {
                        end = key;
                        if (end > start) {
                            item = line.substring(start, end);
                            list.push(item);
                            start = end + 1;
                            end = start;
                        } else if (end === start) {
                            list.push("");
                            start = end + 1;
                            end = start;
                        }
                    }

                }

                end = length;

                if (end >= start) {
                    item = line.substring(start, end);
                    list.push(item);
                }

                return list;
            } else {
                return line.split(opts.delimiter);
            }
        }

        if (opts.header) {
            if (opts.header === true) {
                opts.comment = cells(lines); // 第一行是注释
                opts.cast = cells(lines); // 第二行是数据类型
                fields = cells(lines);
            } else if (this.getType(opts.header) === "Array") {
                fields = opts.header;
            }

            constructor = this.buildObjectConstructor(fields, lines[0].split(opts.delimiter), opts.cast);
        } else {
            constructor = this.buildArrayConstructor(lines[0].split(opts.delimiter), opts.cast);
        }

        while (lines.length > 0) {
            var row = cells(lines);
            if (row.length > 1) {
                fn(constructor(row), fields[0]);
            }
        }

        return true;
    },

    safeParse: function (text, opts, fn) {
        var delimiter = opts.delimiter;
        var newline = opts.newline;

        var lines = text.split(newline);
        if (opts.skip > 0) {
            lines.splice(opts.skip);
        }

        // for (var cur = 0, lim = getLimit(opts.limit, lines.length); cur < lim; cur++) {
        //   var line = lines[cur];
        //   if (frequency(line, this.quoteMark) % 2 !== 0) {
        //     line += lines.splice(cur + 1, 1)[0];
        //     cur -= 1;
        //     continue;
        //   }
        //   var cells = line.split(delimiter);
        //   for (var cell = 0, len = cells.length; cell < len; cell++) {
        //     if (frequency(cell, this.quoteMark) % 2 !== 0) {
        //       cell += cells.splice(cur + 1, 1)[0];
        //       cell -= 1;
        //       continue;
        //     }
        //   }
        //   fn(cells);
        // }

        return true;
    },

    encodeCells: function (line, delimiter, newline) {
        var row = line.slice(0);
        for (var i = 0, len = row.length; i < len; i++) {
            if (row[i].indexOf(this.quoteMark) !== -1) {
                row[i] = row[i].replace(this.quoteRegex, this.doubleQuoteMark);
            }

            if (row[i].indexOf(delimiter) !== -1 || row[i].indexOf(newline) !== -1) {
                row[i] = this.quoteMark + row[i] + this.quoteMark;
            }
        }

        return row.join(delimiter);
    },

    encodeArrays: function(coll, opts, fn) {
        var delimiter = opts.delimiter;
        var newline = opts.newline;

        if (opts.header && this.getType(opts.header) === "Array") {
            fn(this.encodeCells(opts.header, delimiter, newline));
        }

        for (var cur = 0, lim = this.getLimit(opts.limit, coll.length); cur < lim; cur++) {
            fn(this.encodeCells(coll[cur], delimiter, newline));
        }

        return true;
    },

    encodeObjects: function (coll, opts, fn) {
        var delimiter = opts.delimiter;
        var newline = opts.newline;
        var header;
        var row;

        header = [];
        row = [];
        for (var key in coll[0]) {
            header.push(key);
            row.push(coll[0][key]);
        }

        if (opts.header === true) {
            fn(this.encodeCells(header, delimiter, newline));
        } else if (this.getType(opts.header) === "Array") {
            fn(this.encodeCells(opts.header, delimiter, newline));
        }

        fn(this.encodeCells(row, delimiter));

        for (var cur = 1, lim = this.getLimit(opts.limit, coll.length); cur < lim; cur++) {
            row = [];
            for (var key$1 = 0, len = header.length; key$1 < len; key$1++) {
                row.push(coll[cur][header[key$1]]);
            }

            fn(this.encodeCells(row, delimiter, newline));
        }

        return true;
    },

    parse: function (text, opts, fn) {
        var rows;

        if (this.getType(opts) === "Function") {
            fn = opts;
            opts = {};
        } else if (this.getType(fn) !== "Function") {
            rows = [];
            fn = rows.push.bind(rows);
        } else {
            rows = [];
        }

        opts = this.assign({}, this.STANDARD_DECODE_OPTS, opts);
        this.opts = opts;

        if (!opts.delimiter || !opts.newline) {
            var limit = Math.min(48, Math.floor(text.length / 20), text.length);
            opts.delimiter = opts.delimiter || this.mostFrequent(text, CELL_DELIMITERS, limit);
            opts.newline = opts.newline || this.mostFrequent(text, LINE_DELIMITERS, limit);
        }

        //return (text.indexOf(this.quoteMark) === -1 ? unsafeParse : safeParse)(text, opts, fn) &&
        //    (rows.length > 0 ? rows : true);

        // modify by jl 由表自行控制不要含有双引号.提高解析效率
        return this.unsafeParse(text, opts, fn) &&
            (rows.length > 0 ? rows : true);
    },

    encode: function (coll, opts, fn) {
        var lines;

        if (this.getType(opts) === "Function") {
            fn = opts;
            opts = {};
        } else if (this.getType(fn) !== "Function") {
            lines = [];
            fn = lines.push.bind(lines);
        }

        opts = this.assign({}, this.STANDARD_ENCODE_OPTS, opts);

        if (opts.skip > 0) {
            coll = coll.slice(opts.skip);
        }

        return (this.getType(coll[0]) === "Array" ? this.encodeArrays : this.encodeObjects)(coll, opts, fn) &&
            (lines.length > 0 ? lines.join(opts.newline) : true);
    }
};

var ConfigManager = {
    init: function () {
        this.csvTables = {};
        this.csvTableForArr = {};
        this.tableCast = {};
        this.tableComment = {};
    },

    addTable: function (tableName, tableContent, force) {

        if (this.csvTables[tableName] && !force) {
            return;
        }

        var tableData = {};
        var tableArr = [];
        var opts = { header: true };
        CSV.parse(tableContent, opts, function (row, keyname) {
            tableData[row[keyname]] = row;
            tableArr.push(row);
        });

        this.tableCast[tableName] = CSV.opts.cast;
        this.tableComment[tableName] = CSV.opts.comment;

        this.csvTables[tableName] = tableData;
        this.csvTableForArr[tableName] = tableArr;

        //this.csvTables[tableName].initFromText(tableContent);
    },

    getTableArr: function (tableName) {
        return this.csvTableForArr[tableName];
    },

    getTable: function (tableName) {
        //var tableObj = this.csvTables[tableName];
        //
        //// 修复当增量更新时 group.json 有新增文件,而没初始化配置文件时用
        //if (!tableObj && !module.exports && cc.sys.isNative) {
        //    var txt = jsb.fileUtils.getStringFromFile("res/data/" + tableName + ".csv");
        //    configManager.addTable(tableName, txt);
        //    tableObj = this.csvTables[tableName];
        //}
        //
        //return tableObj.getDatas();

        return this.csvTables[tableName];
    },

    queryOne: function (tableName, key, value) {
        var table = this.getTable(tableName);
        if (!table) {
            return null;
        }

        if (key) {
            for (var tbItem in table) {
                if (!table.hasOwnProperty(tbItem)) {
                    continue;
                }

                if (table[tbItem][key] === value) {
                    return table[tbItem];
                }
            }
        } else {
            return table[value];
        }
    },

    queryByID: function (tableName, ID) {
        return this.queryOne(tableName, null, ID);
    },

    queryAll: function (tableName, key, value) {
        var table = this.getTable(tableName);
        if (!table || !key) {
            return null;
        }

        var ret = {};
        for (var tbItem in table) {
            if (!table.hasOwnProperty(tbItem)) {
                continue;
            }

            if (table[tbItem][key] === value) {
                ret[tbItem] = table[tbItem];
            }
        }

        return ret;
    },

    queryIn: function (tableName, key, values) {
        if (values.constructor !== Array) {
            return null;
        }

        var table = this.getTable(tableName);
        if (!table || !key) {
            return null;
        }

        var ret = {};
        var keys = Object.keys(table);
        var length = keys.length;
        for (var i = 0; i < length; i++) {
            var item = table[keys[i]];
            if (values.indexOf(item[key]) > -1) {
                ret[keys[i]] = item;
            }
        }

        return ret;
    },

    queryByCondition: function (tableName, condition) {
        if (condition.constructor !== Object) {
            return null;
        }

        var table = this.getTable(tableName);
        if (!table) {
            return null;
        }

        var ret = {};
        var tableKeys = Object.keys(table);
        var tableKeysLength = tableKeys.length;
        var keys = Object.keys(condition);
        var keysLength = keys.length;
        for (var i = 0; i < tableKeysLength; i++) {
            var item = table[tableKeys[i]];
            var fit = true;
            for (var j = 0; j < keysLength; j++) {
                var key = keys[j];
                fit = fit && (condition[key].indexOf(item[key]) > -1 && !ret[tableKeys[i]]);
            }

            if (fit) {
                ret[tableKeys[i]] = item;
            }
        }

        return ret;
    }
};

ConfigManager.init();

module.exports = ConfigManager;