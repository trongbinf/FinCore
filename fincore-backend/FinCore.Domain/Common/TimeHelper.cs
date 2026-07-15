using System;

namespace FinCore.Domain.Common;

public static class TimeHelper
{
    public static DateTime GetVietnamTime()
    {
        var utcNow = DateTime.UtcNow;
        try
        {
            var tz = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
            return TimeZoneInfo.ConvertTimeFromUtc(utcNow, tz);
        }
        catch
        {
            try
            {
                var tz = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
                return TimeZoneInfo.ConvertTimeFromUtc(utcNow, tz);
            }
            catch
            {
                return utcNow.AddHours(7); // Fallback to UTC+7 manually
            }
        }
    }
}
