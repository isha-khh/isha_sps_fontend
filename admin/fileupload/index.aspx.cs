using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.IO;

public partial class admin_fileupload_index : ez.function
{
    public string defPath;

    protected void Page_Load(object sender, EventArgs e)
    {
        if (ez.admin.PageBase.chkAdmIP && (ez.admin.PageBase.chkTwIP || ez.admin.PageBase.chkAdmIP_Enable))
        {
            ez.admin.user chkuser = new ez.admin.user();
            if (chkuser.isLogin())
            {
                ez.fileSystem fileSystem = new ez.fileSystem();   //清除暫存，重新取得檔案使用量
                if (fileSystem.CheckCountLimit())
                {
                    //defPath = ResolveUrl("~/" + ckeditorDir + "images/");
                    defPath = "../../" + ckeditorDir + "images/";

                    DirectoryInfo dir = new DirectoryInfo(Server.MapPath(defPath));
                    if (!dir.Exists) { dir.Create(); }

                    HttpBrowserCapabilities hbc = Request.Browser;
                    //Response.Write(hbc.Browser);                 
                    if (hbc.Browser.IndexOf("InternetExplorer") > -1 | hbc.Browser.ToUpper().IndexOf("IE") > -1)
                    {
                        MultiView1.ActiveViewIndex = 0;
                    }
                    else
                    {
                        MultiView1.ActiveViewIndex = 1;
                    }
                }
                else
                {
                    Response.Clear();
                    Response.Write("您的磁碟容量已滿，請先刪除不必要的檔案");
                    Response.End();
                }

            }
            else
            {
                Response.Clear();
                Response.StatusCode = 404;
                Response.End();
            }
        }
        else
        {
            Response.Clear();
            Response.StatusCode = 404;
            Response.End();
        }
       
    }
}