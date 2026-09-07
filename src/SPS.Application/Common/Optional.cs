using System.Text.Json.Serialization;

namespace SPS.Application.Common;

/// <summary>
/// 用於區分「未提供欄位」和「提供 null 值」的包裝類
/// </summary>
/// <typeparam name="T">欄位類型</typeparam>
public struct Optional<T>
{
    /// <summary>
    /// 是否已設置該欄位（即請求中是否包含此欄位）
    /// </summary>
    [JsonIgnore]
    public bool IsSet { get; private set; }

    private T? _value;

    /// <summary>
    /// 欄位的值
    /// </summary>
    public T? Value
    {
        get => _value;
        set
        {
            _value = value;
            IsSet = true;
        }
    }

    /// <summary>
    /// 創建一個已設置的 Optional
    /// </summary>
    public Optional(T? value)
    {
        _value = value;
        IsSet = true;
    }

    /// <summary>
    /// 創建一個未設置的 Optional
    /// </summary>
    public static Optional<T> Unset() => new() { IsSet = false };

    /// <summary>
    /// 隱式轉換：從 T 到 Optional<T/>
    /// </summary>
    public static implicit operator Optional<T>(T? value) => new(value);

    /// <summary>
    /// 顯式轉換：從 Optional<T/> 到 T
    /// </summary>
    public static explicit operator T?(Optional<T> optional) => optional.Value;

    public override string ToString() => IsSet ? $"Set: {Value}" : "Unset";
}
