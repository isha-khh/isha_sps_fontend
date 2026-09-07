namespace SPS.Domain.Enums;

public enum Status : short
{
    Inactive = 0,
    Active = 1,
    Suspended = 2,
    Locked = 3,
    PendingApproval = 4,
    Approved = 5,
    Rejected = 6
}
