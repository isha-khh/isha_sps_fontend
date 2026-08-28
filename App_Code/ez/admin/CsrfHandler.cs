using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

/// <summary>
/// CsrfHandler 的摘要描述
/// </summary>
namespace ez.admin 
{
    public class CsrfHandler
    {
        public static void Validate(Page page, HiddenField forgeryToken)
        {
            //略過登入頁
            if (HttpContext.Current.Request.Url.AbsoluteUri.IndexOf("/admin/index.aspx") < 0)
            {
                function f = new function();
                if (!page.IsPostBack)
                {
                    Guid antiforgeryToken = Guid.NewGuid();
                    page.Session[f.SC + "_AntiforgeryToken"] = antiforgeryToken;
                    forgeryToken.Value = antiforgeryToken.ToString();
                }
                //else
                //{
                //    Guid stored = (Guid)page.Session[f.SC + "_AntiforgeryToken"];
                //    Guid sent = new Guid(forgeryToken.Value);
                //    if (sent != stored)
                //    {
                //        page.Session.Abandon();
                //        throw new HttpException(404, "偵測跨站請求偽造");
                //    }
                //}
            }
        }
    }
}