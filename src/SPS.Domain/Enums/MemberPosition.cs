namespace SPS.Domain.Enums;

/// <summary>
/// 會員職位
/// </summary>
public enum MemberPosition
{
    /// <summary>
    /// 經理 - 擁有所有權限
    /// </summary>
    Manager = 1,

    /// <summary>
    /// 員工 - 擁有部分權限
    /// </summary>
    Employee = 2
}