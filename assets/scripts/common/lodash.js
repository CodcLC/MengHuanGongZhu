/**
 * Copyright (c) 2017 Xiamen Yaji Software Co.Ltd. All rights reserved.
 * Created by daisy on 2018/3/26.
 */

(function () {
    function find(collection, predicate) {
        var result;
        if (!Array.isArray(collection)) {
            collection = toArray(collection);
        }

        result = collection.filter(predicate);
        if (result.length) {
            return result[0];
        }

        return undefined;
    }

    function forEach(collection, iteratee) {
        if (!Array.isArray(collection)) {
            var array = toArrayKey(collection);
            array.forEach(function (value, index, arr) {
                var key1 = value['key'];
                var value1 = value['value'];
                iteratee(value1, key1, collection);
            });
        } else {
            collection.forEach(iteratee);
        }
    }

    function cloneDeep(sObj) {
        if (sObj === null || typeof sObj !== "object") {
            return sObj;
        }

        var s = {};
        if (sObj.constructor === Array) {
            s = [];
        }

        for (var i in sObj) {
            if (sObj.hasOwnProperty(i)) {
                s[i] = cloneDeep(sObj[i]);
            }
        }

        return s;
    }

    function map(collection, iteratee) {
        if (!Array.isArray(collection)) {
            collection = toArray(collection);
        }

        var arr = [];
        collection.forEach(function (value, index, array) {
            arr.push(iteratee(value, index, array));
        });

        return arr;
    }

    function random(min, max) {
        var r = Math.random();
        var rr = r * (max - min + 1) + min;
        return Math.floor(rr);
    }

    function toArrayKey(srcObj) {
        var resultArr = [];

        // to array
        for (var key in srcObj) {
            if (!srcObj.hasOwnProperty(key)) {
                continue;
            }

            resultArr.push({ key: key, value: srcObj[key] });
        }

        return resultArr;
    }

    function toArray(srcObj) {
        var resultArr = [];

        // to array
        for (var key in srcObj) {
            if (!srcObj.hasOwnProperty(key)) {
                continue;
            }

            resultArr.push(srcObj[key]);
        }

        return resultArr;
    }

    function filter(collection, iteratees) {
        if (!Array.isArray(collection)) {
            collection = toArray(collection);
        }

        return collection.filter(iteratees);
    }

    function isEqual(x, y) {
        var in1 = x instanceof Object;
        var in2 = y instanceof Object;
        if (!in1 || !in2) {
            return x === y;
        }

        if (Object.keys(x).length !== Object.keys(y).length) {
            return false;
        }

        for (var p in x) {
            var a = x[p] instanceof Object;
            var b = y[p] instanceof Object;
            if (a && b) {
                return isEqual(x[p], y[p]);
            } else if (x[p] !== y[p]) {
                return false;
            }
        }

        return true;
    }

    function pullAllWith(array, value, comparator) {
        value.forEach(function (item) {
            var res = array.filter(function (n) {
                return comparator(n, item);
            });

            res.forEach(function (item) {
                var index = array.indexOf(item);
                if (array.indexOf(item) !== -1) {
                    array.splice(index, 1);
                }
            });
        });

        return array;
    }

    function now() {
        return Date.now();
    }

    function pullAll(array, value) {
        value.forEach(function (item) {
            var index = array.indexOf(item);
            if (array.indexOf(item) !== -1) {
                array.splice(index, 1);
            }
        });

        return array;
    }

    function forEachRight(collection, iteratee) {
        if (!Array.isArray(collection)) {
            collection = toArray(collection);
        }

        for (var i = collection.length - 1; i >= 0; i--) {
            var ret = iteratee(collection[i]);
            if (!ret) break;
        }
    }

    function startsWith(str, target, position) {
        str = str.substr(position);
        return str.startsWith(target);
    }

    function endsWith(str, target, position) {
        str = str.substr(position);
        return str.endsWith(target);
    }

    function remove(array, predicate) {
        var result = [];
        var indexes = [];
        array.forEach(function (item, index) {
            if (predicate(item)) {
                result.push(item);
                indexes.push(index);
            }
        });

        basePullAt(array, indexes);
        return result;
    }

    function basePullAt(array, indexes) {
        var length = array ? indexes.length : 0;
        var lastIndex = length - 1;
        var previous;

        while (length--) {
            var index = indexes[length];
            if (length === lastIndex || index !== previous) {
                previous = index;
                Array.prototype.splice.call(array, index, 1);
            }
        }

        return array;
    }

    function findIndex(array, predicate, fromIndex) {
        array =  array.slice(fromIndex);
        var i;
        if (typeof predicate === "function") {
            for (i = 0; i < array.length; i++) {
                if (predicate(array[i])) {
                    return i;
                }
            }
        } else if (Array.isArray(predicate)) {
            for (i = 0; i < array.length; i++) {
                var key = predicate[0];
                var vaule = true;
                if (predicate.length > 1) {
                    vaule = predicate[1];
                }

                if (array[i][key] === vaule) {
                    return i;
                }
            }
        } else {
            for (i = 0; i < array.length; i++) {
                if (array[i] === predicate) {
                    return i;
                }
            }
        }

        return -1;
    }

    function concat() {
        var length = arguments.length;
        if (!length) {
            return [];
        }

        var array = arguments[0];
        var index = 1;
        while (index < length) {
            array = array.concat(arguments[index]);
            index++;
        }

        return array;
    }

    function isNumber(value) {
        return typeof value === 'number';
    }

    function indexOf(array, value, fromIndex) {
        array =  array.slice(fromIndex);
        return array.indexOf(value);
    }

    function join(array, separator) {
        if (array === null) return '';

        var result = '';
        array.forEach(function (item) {
            result += item + separator;
        });

        return result.substr(0, result.length - 1);
    }

    function split(string, separator, limit) {
        return string.split(separator, limit);
    }

    function max(array) {
        if (array && array.length) {
            var result;
            for (var i = 0; i < array.length; i++) {
                if (i === 0) {
                    result = array[0];
                } else if (result < array[i]) {
                    result = array[i];
                }
            }

            return result;
        }

        return undefined;

    }

    function drop(array, n) {
        var length = array === null ? 0 : array.length;
        if (!length) {
            return [];
        }

        return array.slice(n);
    }

    function flattenDeep(arr) {
        return arr.reduce(function (prev, cur) {
            return prev.concat(Array.isArray(cur) ? flattenDeep(cur) : cur);
        }, [ ]);
    }

    function uniq(array) {
        var result = [];
        array.forEach(function (item) {
            if (result.indexOf(item) === -1) {
                result.push(item);
            }
        });

        return result;
    }

    function isNaN(value) {
        // An `NaN` primitive is the only value that is not equal to itself.
        // Perform the `toStringTag` check first to avoid errors with some
        // ActiveX objects in IE.
        return isNumber(value) && value !== +value;
    }

    function chunk(array, size) {
        var length = array === null ? 0 : array.length;
        if (!length || size < 1) {
            return [];
        }

        var result = [];
        while (array.length > size) {
            result.push(array.slice(0, size));
            array = array.slice(size);
        }

        result.push(array);
        return result;
    }

    function toFinite(value) {
        var INFINITY = 1 / 0;
        var MAX_INTEGER = 1.7976931348623157e+308;
        if (!value) {
            return value === 0 ? value : 0;
        }
        value = Number(value);
        if (value === INFINITY || value === -INFINITY) {
            var sign = (value < 0 ? -1 : 1);
            return sign * MAX_INTEGER;
        }
        return value === value ? value : 0;
    }

    function baseRange(start, end, step, fromRight) {
        var nativeMax = Math.max;
        var nativeCeil = Math.ceil;
        var index = -1,
            length = nativeMax(nativeCeil((end - start) / (step || 1)), 0),
            result = Array(length);

        while (length--) {
            result[fromRight ? length : ++index] = start;
            start += step;
        }
        return result;
    }

    function isObject(value) {
        var type = typeof value;
        return value !== null && (type === 'object' || type === 'function');
    }

    var MAX_SAFE_INTEGER = 9007199254740991;

    function isLength(value) {
        return typeof value === 'number' &&
            value > -1 && value % 1 === 0 && value <= MAX_SAFE_INTEGER;
    }

    function isArrayLike(value) {
        return value !== null && isLength(value.length) /*&& !isFunction(value)*/;
    }

    function eq(value, other) {
        return value === other || (value !== value && other !== other);
    }

    function isIndex(value, length) {
        var type = typeof value;
        length = length === null ? MAX_SAFE_INTEGER : length;
        var reIsUint = /^(?:0|[1-9]\d*)$/;
        return !!length &&
            (type === 'number' ||
            (type !== 'symbol' && reIsUint.test(value))) &&
            (value > -1 && value % 1 === 0 && value < length);
    }

    function isIterateeCall(value, index, object) {
        if (!isObject(object)) {
            return false;
        }
        var type = typeof index;
        if (type === 'number' ?
                (isArrayLike(object) && isIndex(index, object.length))
                : (type === 'string' && index in object)
        ) {
            return eq(object[index], value);
        }
        return false;
    }

    function createRange(fromRight) {
        return function(start, end, step) {
            if (step && typeof step !== 'number' && isIterateeCall(start, end, step)) {
                end = step = undefined;
            }
            // Ensure the sign of `-0` is preserved.
            start = toFinite(start);
            if (end === undefined) {
                end = start;
                start = 0;
            } else {
                end = toFinite(end);
            }
            step = step === undefined ? (start < end ? 1 : -1) : toFinite(step);
            return baseRange(start, end, step, fromRight);
        };
    }

    function maxBy(array, predicate) {
        if (array && array.length) {
            var result;
            var objResult;
            for (var i = 0; i < array.length; i++) {
                if (i === 0) {
                    result = predicate(array[0]);
                    objResult = array[0];
                } else if (result < array[i]) {
                    result = (array[i]);
                    objResult = array[i];
                }
            }

            return objResult;
        }

        return undefined;

    }

    function minBy(array, predicate) {
        if (array && array.length) {
            var result;
            var objResult;
            for (var i = 0; i < array.length; i++) {
                if (i === 0) {
                    result = predicate(array[0]);
                    objResult = array[0];
                } else if (result > array[i]) {
                    result = predicate(array[i]);
                    objResult = array[i];
                }
            }

            return objResult;
        }

        return undefined;

    }


    var range = createRange();

    var lodash = {};

    lodash.find = find;
    lodash.filter = filter;
    lodash.forEach = forEach;
    lodash.each = forEach;
    lodash.cloneDeep = cloneDeep;
    lodash.map = map;
    lodash.random = random;
    lodash.toArray = toArray;
    lodash.pullAllWith = pullAllWith;
    lodash.isEqual = isEqual;
    lodash.now = now;//ok
    lodash.pullAll = pullAll;
    lodash.forEachRight = forEachRight;
    lodash.startsWith = startsWith;
    lodash.endsWith = endsWith;
    lodash.remove = remove;
    lodash.findIndex = findIndex;
    lodash.concat = concat;
    lodash.isNumber = isNumber;
    lodash.indexOf = indexOf;
    lodash.join = join;
    lodash.split = split;
    lodash.max = max;
    lodash.drop = drop;
    lodash.flattenDeep = flattenDeep;
    lodash.uniq = uniq;
    lodash.isNaN = isNaN;
    lodash.chunk = chunk;
    lodash.maxBy = maxBy;
    lodash.minBy = minBy;
    lodash.range = range;

    window._ = lodash;

})();