/* global config */

/**
 * 获取URL中的参数
 *
 * @return {Object} 包含所有参数键值对的对象
 */
function getUrlParams() {
    "use strict";
    var paramKVStrArr = location.search.substr(1).split("&");
    var params = {};

    for (var i = 0; i < paramKVStrArr.length; i++) {
        var kvArr = paramKVStrArr[i].split("=");
        params[kvArr[0]] = kvArr[1];
    }

    return params;
}

/**
 * 获取本次挑战的ID
 *
 * @return {string} 挑战ID
 */
function getTestID() {
    'use strict';
    return getUrlParams().id;
}

/**
 * 获取本次挑战的类型ID
 *
 * @return {string} 挑战类型ID
 */
function getTestType() {
    "use strict";
    return getUrlParams().type;
}

/**
 * 提取URI中的文件名
 *
 * @param {string} uri URI
 * @return {string} 文件名
 */
function getFileNameByUri(uri) {
    "use strict";
    return uri.substring(uri.lastIndexOf("/") + 1);
}

/**
 * 问题对象构造器
 *
 * @param {Object} quesData 问题数据
 * @constructor
 */
function Question(quesData) {
    "use strict";
    this.data = quesData;

    /**
     * 根据音乐的加密ID获取音乐文件的文件名
     *
     * @param {string} musicEnID 音乐的加密ID
     * @return {string} 存在则返回音乐文件的文件名，否则返回空string
     */
    this.getMusicFileNameByEnID = function (musicEnID) {
        var musicData = this.getMusicDataBy("EncodeMusicId", musicEnID);
        if (musicData !== null) {
            var uri = musicData.MusicPath;
            return getFileNameByUri(uri);
        }
        return "";
    };

    /**
     * 获取指定音乐数据。根据给定的属性名和值，寻找相匹配的音乐数据。
     *
     * @param {string} property 欲匹配的属性
     * @param {string} val 欲匹配的值
     * @param {boolean} [exactMatch=true] 是否使用精确匹配
     * @return {Object|null} 若存在则返回音乐数据，否则返回null
     */
    this.getMusicDataBy = function (property, val, exactMatch) {
        exactMatch = exactMatch === undefined ? true : exactMatch;
        var dataArr = this.data.gearsExamOptionsList;
        for (var i = 0; i < dataArr.length; i++) {
            var musicData = dataArr[i];
            if (exactMatch) { // 精确匹配
                if (musicData[property] === val) {
                    return musicData;
                }
            } else { // 模糊匹配
                if (musicData[property].indexOf(val) > -1) {
                    return musicData;
                }
            }
        }
        return null;
    };
}

/**
 * 挑战对象构造器
 *
 * @param {Question[]} questions 问题对象数组
 * @constructor
 */
function Test(questions) {
    "use strict";
    this.data = questions;

    /**
     * 根据音乐的加密ID获取音乐文件的文件名
     *
     * @param {string} musicEnID 音乐的加密ID
     * @return {string} 存在则返回音乐文件的文件名，否则返回空string
     */
    /*this.getMusicFileNameByEnID = function (musicEnID) {
     var questions = this.data;

     for (var i = 0; i < questions.length; i++) {
     var ques = questions[i];
     var fileName = ques.getMusicFileNameByEnID(musicEnID);
     if (fileName !== "") {
     return fileName;
     }
     }

     return "";
     };*/
    /**
     * 获取指定音乐数据。根据给定的属性名和值，寻找相匹配的音乐数据。
     *
     * @param {string} property 欲匹配的属性
     * @param {string} val 欲匹配的值
     * @param {boolean} [exactMatch=true] 是否使用精确匹配
     * @return {Object|null} 若存在则返回音乐数据，否则返回null
     */
    this.getMusicDataBy = function (property, val, exactMatch) {
        var questions = this.data;

        for (var i = 0; i < questions.length; i++) {
            var ques = questions[i];
            var musicData = ques.getMusicDataBy(property, val, exactMatch);
            if (musicData !== null) {
                return musicData;
            }
        }

        return null;
    };
}

/**
 * 异步获取本次挑战的全部题目数据，5秒超时
 *
 * @param {string} testID 欲获取的挑战的ID
 * @return {jQuery.Deferred} 当获取成功时，状态改为done，并向回调函数传入挑战数据对象。获取失败时，状态改为fail。
 */
function getTestData(testID) {
    'use strict';
    var dfd = $.Deferred();

    $.ajax({
        url: "/ajax/ears.ashx",
        type: "POST",
        dataType: "json",
        timeout: 5000,
        data: {
            "testItemId": testID,
            "action": "checkexamoptionsright"
        }
    }).done(function (response) {
        var questions = [];
        for (var i = 0; i < response.length; i++) {
            questions.push(new Question(response[i]));
        }
        dfd.resolve(new Test(questions));
    }).fail(function () {
        dfd.reject();
    });

    return dfd;
}

/**
 * 获取当前题号（从0起）
 *
 * @return {number} 当前题号
 */
function getQuesNum() {
    "use strict";
    return parseInt($("#divList").children("a[class='on']").html()) - 1;
}

/**
 * 获取当前正在播放的音乐的加密ID
 *
 * @return {string} 音乐的加密ID
 */
function getCurMusicEnID() {
    "use strict";
    return $("#divMainTitle").attr("data-musicid");
}

/**
 * 根据音乐的加密ID获取音乐文件的文件名
 *
 * @param {string} musicEnID 音乐的加密ID
 * @return {string} 存在则返回音乐文件的文件名，否则返回空string
 */
function getMusicFileNameByEnID(musicEnID) {
    "use strict";
    var allMusic = $("#divAudio").children("audio");

    for (var i = 0; i < allMusic.length; i++) {
        var music = allMusic.eq(i);
        if (music.attr("id") === musicEnID) {
            var uri = music.children("source").attr("src");
            return getFileNameByUri(uri);
        }
    }

    return "";
}

/**
 * 根据音乐文件的文件名获取音乐的加密ID
 *
 * @param {string} musicFileName 音乐文件的文件名
 * @return {string} 存在则返回音乐的加密ID，否则返回空string
 */
function getMusicEnIDByFileName(musicFileName) {
    "use strict";
    var allMusic = $("#divAudio").children("audio");

    for (var i = 0; i < allMusic.length; i++) {
        var music = allMusic.eq(i);
        if (music.children("source").attr("src").indexOf(musicFileName) > -1) {
            return music.attr("id");
        }
    }

    return "";
}

/**
 * 根据音乐的加密ID获取对应选项的序号（仅适用于1类挑战）
 *
 * @param {string} musicEnID 音乐的加密ID
 * @return {number} 若存在则返回选项序号（从0起），否则返回-1
 */
function getAnsNumByMusicEnID(musicEnID) {
    "use strict";
    var optionsBox = $("#divMainInfo").children("ul[data-type='1']");
    var options = optionsBox.children("li");

    // 遍历全部选项，寻找匹配的选项
    for (var i = 0; i < options.length; i++) {
        var option = options.eq(i);
        if (option.attr("data-tag") === musicEnID) {
            return i;
        }
    }

    return -1;
}

/**
 * 异步验证某个答案是否正确，5秒超时
 *
 * @param {string} testID 挑战的ID
 * @param {string} testType 挑战的类型ID
 * @param {string} quesID 问题的ID
 * @param {string} timeStamp 有效的时间戳（如从挑战数据中获取的时间戳）
 * @param {Object} musicData 音乐数据（从挑战数据中获取的音乐数据）
 * @param {string} [isIncrease] 是否增强
 * @param {string} [affectVal] 受影响的值
 * @param {string} [isFinish] 是否结束
 * @return {jQuery.Deferred} 当获取成功时，状态改为done，并向回调函数传入答案正误（boolean）。获取失败时，状态改为fail。
 */
function isCorrect(testID, testType, quesID, timeStamp, musicData, isIncrease, affectVal, isFinish) {
    "use strict";
    var dfd = $.Deferred();
    var musicID = musicData.ExamineSubIdStr;
    var encodeMusicId = musicData.EncodeMusicId;

    $.ajax({
        url: "/ajax/ears.ashx",
        type: "POST",
        timeout: 5000,
        data: {
            "type": testType,
            "timespan": timeStamp,
            "testItemId": testID,
            "musicId": musicID,
            "isIncrease": isIncrease === undefined ? "" : isIncrease,
            "isFinish": isFinish === undefined ? "" : isFinish,
            "examineId": quesID,
            "encodeMusicId": encodeMusicId,
            "affectValue": affectVal === undefined ? "" : affectVal,
            "action": "checkexamoptionsright"
        }
    }).done(function (response) {
        dfd.resolve(response === "1");
    }).fail(function () {
        dfd.reject();
    });

    return dfd;
}

/**
 * 根据不同类型的挑战，获取该题目的正确答案
 *
 * @param {string} testID 挑战ID
 * @param {string} testType 挑战类型ID
 * @param {Test} test 挑战对象
 * @param {number} quesNum 问题序号
 * @return {jQuery.Deferred} 当获取成功时，状态改为done，并向回调函数传入正确答案序号（一道问题中只有n个答案，则传入n个参数）。获取失败时，状态改为fail。
 */
function getAnswer(testID, testType, test, quesNum) {
    "use strict";
    var dfd = $.Deferred();
    var ques = test.data[quesNum];
    var quesID = ques.data.examineId;
    var timeStamp = ques.data.timestamp.toString();
    var musicDataArr = ques.data.gearsExamOptionsList;

    /**
     * 获取三选一类型题目的答案
     *
     * @return {jQuery.Deferred} done时传入正确答案序号
     */
    var answerJKL = function () {
        var _dfd = $.Deferred();

        for (var i = 0; i < musicDataArr.length; i++) {
            var musicData = musicDataArr[i];
            (function (_musicData) { // jshint ignore:line
                isCorrect(testID, testType, quesID, timeStamp, _musicData).done(function (flag) {
                    if (flag) { // 找到了正确选项
                        var musicFileName = getFileNameByUri(_musicData.MusicPath);
                        var answerNum = getAnsNumByMusicEnID(getMusicEnIDByFileName(musicFileName));
                        _dfd.resolve(answerNum);
                    }
                }).fail(function () {
                    _dfd.reject();
                });
            })(musicData);
        }

        return _dfd;
    };

    /**
     * 获取强弱类型题目的答案
     *
     * @param {number} optDivPos 选项Div所在位置，0表示在上方，1表示在下方
     * @return {jQuery.Deferred} done时传入正确答案序号
     */
    var answerStrongerOrWeaker = function (optDivPos) {
        var _dfd = $.Deferred();
        var curMusicFileName = getMusicFileNameByEnID(getCurMusicEnID());
        var musicData = test.getMusicDataBy("MusicPath", curMusicFileName, false);
        quesID = musicData.ExamineId;
        var optTags = getOptTags(optDivPos);

        for (var i = 0; i < optTags.length; i++) {
            (function (optNum) { // jshint ignore: line
                var isIncrease = optTags[optNum];
                isCorrect(testID, testType, quesID, timeStamp, musicData, isIncrease).done(function (flag) {
                    if (flag) { // 找到了正确选项
                        _dfd.resolve(optNum);
                    }
                }).fail(function () {
                    _dfd.reject();
                });
            })(i);
        }

        return _dfd;
    };

    /**
     * 获取影响频带范围类型题目的答案
     *
     * @return {jQuery.Deferred} done时传入正确答案序号
     */
    var answerAffectVal = function () {
        var _dfd = $.Deferred();
        var curMusicFileName = getMusicFileNameByEnID(getCurMusicEnID());
        var musicData = test.getMusicDataBy("MusicPath", curMusicFileName, false);
        quesID = musicData.ExamineId;
        var freqTags = getOptTags(1);

        for (var i = 0; i < freqTags.length; i++) {
            (function (optNum) { // jshint ignore:line
                var affectVal = freqTags[optNum];
                isCorrect(testID, testType, quesID, timeStamp, musicData, "", affectVal).done(function (flag) {
                    if (flag) { // 找到了正确选项
                        _dfd.resolve(optNum);
                    }
                }).fail(function () {
                    _dfd.reject();
                });
            })(i);
        }

        return _dfd;
    };

    switch (testType) {
        case "1": // 听三个音频，选出其中一个正确答案
            answerJKL().done(function (answerNum) {
                dfd.resolve(answerNum);
            }).fail(function () {
                dfd.reject();
            });
            break;

        case "2": // 听参考音和比较音，判断比较音是否更响亮
        case "5": // 判断响度变化
            answerStrongerOrWeaker(1).done(function (answerNum) {
                dfd.resolve(answerNum);
            }).fail(function () {
                dfd.reject();
            });
            break;

        case "3": // 听两个音频，判断第二个音频是否更强烈，并选出影响的频带范围
        case "4": // 听一个音频，判断片段是否更强烈，并选出影响的频带范围
            $.when(answerStrongerOrWeaker(0), answerAffectVal()).done(function (answerNum1, answerNum2) {
                dfd.resolve(answerNum1, answerNum2);
            }).fail(function () {
                dfd.reject();
            });
            break;
    }

    return dfd;
}

/**
 * 获取所有选项
 *
 * @param {number} boxNum 0表示从上方div获取，1表示从下方div获取
 * @return {jQuery} 返回含有所有选项li标签的jQuery对象数组
 */
function getOpts(boxNum) {
    "use strict";
    var optBoxes = $(boxNum === 0 ? "#divMainTitle" : "#divMainInfo").children("ul[data-type]");
    for (var i = 0; i < optBoxes.length; i++) {
        if (optBoxes.eq(i).css("display") !== "none") {
            return optBoxes.eq(i).children("li");
        }
    }
}

/**
 * 从所有选项中获取某个选项
 *
 * @param {number} boxNum 0表示上方选项div，1表示下方选项div
 * @param {number} optNum 选项的序号
 * @return {jQuery} 选项的li标签的jQuery对象
 */
function getOpt(boxNum, optNum) {
    "use strict";
    return getOpts(boxNum).eq(optNum);
}

/**
 * 获取所有选项的标识tag（用于传至后台验证正误）
 *
 * @param {number} boxNum 0表示上方选项div，1表示下方选项div
 * @return {Array} 有序的标识tag数组
 */
function getOptTags(boxNum) {
    "use strict";
    var options = getOpts(boxNum);
    var tags = [];
    for (var i = 0; i < options.length; i++) {
        tags.push(options.eq(i).attr("data-tag"));
    }
    return tags;
}

/**
 * 自动点击当前题目的正确答案
 */
function autoClickAnswer() {
    "use strict";
    var testID = getTestID();
    var testType = getTestType();
    var quesNum = getQuesNum();

    getTestData(testID).done(function (test) {
        getAnswer(testID, testType, test, quesNum).done(function (answerNum1, answerNum2) {
            switch (testType) {
                case "1":
                case "2":
                case "5":
                    getOpt(1, answerNum1).children("a").click();
                    break;
                case "3":
                case "4":
                    $(".play-box").addClass("on");
                    var nextQuesBtn = $("a.bg-next");
                    nextQuesBtn.click();
                    getOpt(0, answerNum1).children("a").click();
                    getOpt(1, answerNum2).children("a").click();
                    nextQuesBtn.click();
                    break;
            }
        }).fail(function () {
            alert("网络连接失败，请稍候再试");
        });
    }).fail(function () {
        alert("网络连接失败，请稍候再试");
    });
}

/**
 * 获取本次挑战的题目数量
 *
 * @return {number} 题目数量
 */
function getQuesCount() {
    "use strict";
    return $("#divList").children().length;
}

/**
 * 自动完成本次挑战
 */
function autoCompleteTest(interval) {
    "use strict";
    autoClickAnswer();
    var curQuesBtn = $("#divList").children("a").eq(getQuesNum());
    var timer = setInterval(function () {
        if (curQuesBtn.hasClass("finish")) {
            clearInterval(timer);
            autoCompleteTest(interval);
        }
    }, interval);
}

autoCompleteTest(50);