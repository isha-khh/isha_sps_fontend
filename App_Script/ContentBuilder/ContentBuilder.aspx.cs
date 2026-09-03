using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
public partial class App_Script_ContentBuilder_ContentBuilder : ez.admin.user//: System.Web.UI.Page //: ez.admin.PageBase
{
    public string web_root;
    protected void Page_Load(object sender, EventArgs e)
    {
        if (isLogin())
        {
            ez.data.info WebSet = new ez.data.info();
            WebSet.Load();
            web_root = WebSet.Data.url + (WebSet.Data.url.Substring(WebSet.Data.url.Length - 1, 1) != "/" ? "/" : "");

        }
        else
        {
            HttpContext.Current.Response.Redirect("~/admin/index.aspx");
        }
        base.OnPreInit(e);
    }
}