using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http.Controllers;

/// <summary>
/// MemberIsLogin 檢查前台會員是否登入
/// </summary>
public class MemberIsLoginAttribute : System.Web.Http.AuthorizeAttribute
{
    public override void OnAuthorization(HttpActionContext actionContext)
    {
        base.OnAuthorization(actionContext);
    }

    protected override void HandleUnauthorizedRequest(HttpActionContext actionContext)
    {
        base.HandleUnauthorizedRequest(actionContext);
    }

    protected override bool IsAuthorized(HttpActionContext actionContext)
    {
        return false;
    }
}