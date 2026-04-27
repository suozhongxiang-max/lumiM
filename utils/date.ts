/**
 * 日期时间处理工具函数
 */

/**
 * 中国时区偏移量（UTC+8）
 */
const CHINA_TIMEZONE_OFFSET = 8 * 60 * 60 * 1000; // 8小时的毫秒数

/**
 * 格式化日期时间为北京时间字符串
 *
 * @param dateString - ISO 8601 格式的日期字符串或 Date 对象
 * @returns 格式化后的北京时间字符串（例如：2024/4/3 14:30:45）
 *
 * @example
 * formatDateTime('2024-04-03T06:30:45.000Z') // 返回: '2024/4/3 14:30:45' (UTC+8)
 */
export function formatDateTime(dateInput: string | Date): string {
  try {
    // 将输入转换为 Date 对象
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

    // 验证日期是否有效
    if (isNaN(date.getTime())) {
      console.warn('[Date] 无效的日期输入:', dateInput);
      return '';
    }

    // 获取 UTC 时间戳（毫秒）
    const utcTimestamp = date.getTime();

    // 转换为北京时间（UTC+8）
    const chinaTimestamp = utcTimestamp + CHINA_TIMEZONE_OFFSET;

    // 创建一个新的 Date 对象来处理时间戳
    // 注意：这里使用 UTC 方法来避免系统时区的影响
    const chinaDate = new Date(chinaTimestamp);

    // 使用 UTC 方法获取时间值，避免系统时区转换
    const year = chinaDate.getUTCFullYear();
    const month = chinaDate.getUTCMonth() + 1; // getUTCMonth() 返回 0-11，需要 +1
    const day = chinaDate.getUTCDate();
    const hours = chinaDate.getUTCHours();
    const minutes = chinaDate.getUTCMinutes();
    const seconds = chinaDate.getUTCSeconds();

    // 格式化为 yyyy/M/d H:mm:ss 格式
    return `${year}/${month}/${day} ${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
  } catch (error) {
    console.error('[Date] 格式化日期失败:', error);
    return '';
  }
}

/**
 * 补零函数：将数字转换为两位数（例如：5 -> '05'）
 */
function padZero(num: number): string {
  return num < 10 ? `0${num}` : `${num}`;
}

/**
 * 格式化日期为短日期字符串（不包含时间）
 *
 * @param dateString - ISO 8601 格式的日期字符串或 Date 对象
 * @returns 格式化后的日期字符串（例如：2024/4/3）
 */
export function formatDate(dateInput: string | Date): string {
  try {
    // 将输入转换为 Date 对象
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

    // 验证日期是否有效
    if (isNaN(date.getTime())) {
      console.warn('[Date] 无效的日期输入:', dateInput);
      return '';
    }

    // 使用 toLocaleString 格式化为北京时间（zh-CN 时区）
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour12: false,
    });
  } catch (error) {
    console.error('[Date] 格式化日期失败:', error);
    return '';
  }
}

/**
 * 格式化时间为短时间字符串（不包含日期）
 *
 * @param dateString - ISO 8601 格式的日期字符串或 Date 对象
 * @returns 格式化后的时间字符串（例如：14:30:45）
 */
export function formatTime(dateInput: string | Date): string {
  try {
    // 将输入转换为 Date 对象
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

    // 验证日期是否有效
    if (isNaN(date.getTime())) {
      console.warn('[Date] 无效的日期输入:', dateInput);
      return '';
    }

    // 使用 toLocaleString 格式化为北京时间（zh-CN 时区）
    return date.toLocaleString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false, // 使用 24 小时制
    });
  } catch (error) {
    console.error('[Date] 格式化时间失败:', error);
    return '';
  }
}

/**
 * 获取相对时间描述（例如："刚刚"、"5分钟前"）
 *
 * @param dateString - ISO 8601 格式的日期字符串或 Date 对象
 * @returns 相对时间描述字符串
 */
export function getRelativeTime(dateInput: string | Date): string {
  try {
    // 将输入转换为 Date 对象
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

    // 验证日期是否有效
    if (isNaN(date.getTime())) {
      console.warn('[Date] 无效的日期输入:', dateInput);
      return '';
    }

    // 计算时间差（秒）
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // 判断相对时间
    if (diffInSeconds < 60) {
      return '刚刚';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}分钟前`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}小时前`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}天前`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months}个月前`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years}年前`;
    }
  } catch (error) {
    console.error('[Date] 获取相对时间失败:', error);
    return '';
  }
}
