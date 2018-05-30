const winston = require('winston');
require('winston-daily-rotate-file');
const stack = require('callsite');
const moment = require('moment');
const webConf = require('../../config/webConf').webConf;
const path = require('path');
const fs = require('fs-extra');

const loggerPath = webConf.loggerPath || path.join(__dirname, '../../log');
const logFileKeepDays = webConf.logFileKeepDays || '7';

fs.ensureDirSync(loggerPath);

var timeStamp = () => moment().format('YYYY-MM-DD HH:mm:ss.SSS');

var normalLogger = new winston.Logger({
    level: 'info',
    transports: [
        new winston.transports.Console({level: 'info'}),
        new winston.transports.DailyRotateFile({
            name: 'info-file',
            filename: path.join(loggerPath, './info.log'),
            datePattern: 'yyyyMMdd.',
            prepend: true,
            localTime: true,
            timestamp: timeStamp,
            level: 'info',
            maxFiles: logFileKeepDays + 'd',
        }),
        new winston.transports.DailyRotateFile({
            name: 'warn-file',
            filename: path.join(loggerPath, './warn.log'),
            datePattern: 'yyyyMMdd.',
            prepend: true,
            localTime: true,
            timestamp: timeStamp,
            level: 'warn',
            maxFiles: logFileKeepDays + 'd',
        }),
        new winston.transports.DailyRotateFile({
            name: 'error-file',
            filename: path.join(loggerPath, './error.log'),
            datePattern: 'yyyyMMdd.',
            prepend: true,
            localTime: true,
            timestamp: timeStamp,
            level: 'error',
            maxFiles: logFileKeepDays + 'd',
        })
    ],
    exceptionHandlers: [
        new winston.transports.Console({level: 'error'}),
        new winston.transports.DailyRotateFile({
            filename: path.join(loggerPath, './exceptions.log'),
            datePattern: 'yyyyMMdd.',
            localTime: true,
            timestamp: timeStamp,
            prepend: true,
            maxFiles: logFileKeepDays + 'd',
        })
    ]
});

var sqlLogger = new winston.Logger({
    level: 'info',
    transports: [
        new winston.transports.DailyRotateFile({
            name: 'sql-info-file',
            filename: path.join(loggerPath, './sql.log'),
            datePattern: 'yyyyMMdd.',
            prepend: true,
            localTime: true,
            timestamp: timeStamp,
            level: 'info',
            maxFiles: logFileKeepDays + 'd',
        }),
    ]
});



var logger = {
    _formatInfo: (infos) => {
        var stackList = stack() || [];
        var caller = stackList[2];
        var formatStr = '';
        if(caller.getFileName){
            var fileName = caller.getFileName();
            formatStr += fileName.substring(fileName.lastIndexOf('/') + 1) + ':';
            formatStr += caller.getLineNumber() + '|'
        }
        infos.forEach((str) =>{
            if(str instanceof Error){    //error类，打出相应的错误信息和堆栈信息
                formatStr += str.stack;
            }else if(Object.prototype.toString.call(str) === '[object Object]' || Object.prototype.toString.call(str) === '[object Array]'){   //对象或数组，则转为string输出
                formatStr += JSON.stringify(str);
            }else{
                formatStr += str;
            }
            formatStr += ' '
        })
        return formatStr;

    },
    info: (...str) => {
        normalLogger.info(logger._formatInfo(str));
    },
    warn: (...str) => {
        normalLogger.warn(logger._formatInfo(str));
    },
    error: (...str) => {
        normalLogger.error(logger._formatInfo(str));
    },
    sql: (...str) => {
        sqlLogger.info(logger._formatInfo(str));
    }
};

module.exports = logger;