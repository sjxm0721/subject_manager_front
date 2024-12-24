// utils/format.ts

/**
 * 日期格式化
 * @param date - Date对象或时间戳
 * @param fmt - 格式化模板，如 'yyyy-MM-dd HH:mm:ss'
 * @returns 格式化后的字符串
 *
 * 支持的格式：
 * y: 年
 * M: 月
 * d: 日
 * H: 小时（24小时制）
 * h: 小时（12小时制）
 * m: 分钟
 * s: 秒
 * S: 毫秒
 * q: 季度
 */
export function formatDate(date: Date | number | string, fmt: string = 'yyyy-MM-dd HH:mm:ss'): string {
    if (!date) return '';

    // 如果是时间戳或字符串，转换为Date对象
    if (typeof date === 'number' || typeof date === 'string') {
        date = new Date(date);
    }

    if (!(date instanceof Date) || isNaN(date.getTime())) {
        return '';
    }

    const o: { [key: string]: number } = {
        'M+': date.getMonth() + 1, // 月份
        'd+': date.getDate(), // 日
        'H+': date.getHours(), // 小时
        'm+': date.getMinutes(), // 分
        's+': date.getSeconds(), // 秒
        'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
        'S': date.getMilliseconds() // 毫秒
    };

    // 年份特殊处理
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
    }

    // 处理其他时间部分
    for (let k in o) {
        if (new RegExp('(' + k + ')').test(fmt)) {
            fmt = fmt.replace(
                RegExp.$1,
                RegExp.$1.length === 1 ?
                    String(o[k]) :
                    ('00' + o[k]).substr(('' + o[k]).length)
            );
        }
    }

    return fmt;
}

/**
 * 相对时间格式化
 * @param date - 日期或时间戳
 * @returns 相对时间字符串
 */
export function formatRelativeTime(date: Date | number | string): string {
    if (!date) return '';

    const now = new Date().getTime();
    const target = new Date(date).getTime();
    const diff = now - target;

    // 小于1分钟
    if (diff < 60 * 1000) {
        return '刚刚';
    }

    // 小于1小时
    if (diff < 60 * 60 * 1000) {
        return Math.floor(diff / (60 * 1000)) + '分钟前';
    }

    // 小于24小时
    if (diff < 24 * 60 * 60 * 1000) {
        return Math.floor(diff / (60 * 60 * 1000)) + '小时前';
    }

    // 小于30天
    if (diff < 30 * 24 * 60 * 60 * 1000) {
        return Math.floor(diff / (24 * 60 * 60 * 1000)) + '天前';
    }

    // 小于12个月
    if (diff < 12 * 30 * 24 * 60 * 60 * 1000) {
        return Math.floor(diff / (30 * 24 * 60 * 60 * 1000)) + '个月前';
    }

    // 大于12个月
    return Math.floor(diff / (12 * 30 * 24 * 60 * 60 * 1000)) + '年前';
}

/**
 * 获取日期范围
 * @param days - 往前推的天数
 * @returns [startDate, endDate] 格式化后的开始日期和结束日期
 */
export function getDateRange(days: number): [string, string] {
    const end = new Date();
    const start = new Date();
    start.setTime(start.getTime() - 3600 * 1000 * 24 * days);

    return [
        formatDate(start, 'yyyy-MM-dd'),
        formatDate(end, 'yyyy-MM-dd')
    ];
}
