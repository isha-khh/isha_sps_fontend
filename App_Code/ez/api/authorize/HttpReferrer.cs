using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Http.Controllers;

/// <summary>
/// HttpReferrer https://zh.wikipedia.org/wiki/HTTP%E5%8F%83%E7%85%A7%E4%BD%8D%E5%9D%80
/// HTTP參照位址（referer，或HTTP referer）是HTTP表頭的一個欄位，用來表示從哪兒連結到目前的網頁，採用的格式是URL。換句話說，藉著HTTP參照位址，目前的網頁可以檢查訪客從哪裡而來，這也常被用來對付偽造的跨網站請求。
/// </summary>
public class HttpReferrerAttribute : System.Web.Http.AuthorizeAttribute
{
    public string Url { get; set; }

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
        if (actionContext.Request.Headers.Referrer == null) return false;

        try
        {
            string host = HttpContext.Current.Request.Url.AbsoluteUri.Replace(HttpContext.Current.Request.Url.PathAndQuery, "/");
            string referrer = actionContext.Request.Headers.Referrer.AbsoluteUri.Replace(actionContext.Request.Headers.Referrer.AbsolutePath, "/");

            if (string.IsNullOrEmpty(this.Url))
            {
                return host == referrer;
            }
            else
            {
                return actionContext.Request.Headers.Referrer.AbsoluteUri.IndexOf(host + Url) > -1;
            }
        }
        catch
        {

        }

        return false;
    }
}