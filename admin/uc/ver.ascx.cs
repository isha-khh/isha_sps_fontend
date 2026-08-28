using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;

public partial class admin_uc_ver : System.Web.UI.UserControl, MasterToUC
{

    public ez.function _f = new ez.function();

    public ez.admin.user.loginInfoType loginInfo = new ez.admin.user.loginInfoType();
    public ez.data.info.DataInfo webInfo = new ez.data.info.DataInfo();

    public void loginStatusGet(ez.admin.user.loginInfoType _loginInfo)
    {
        loginInfo = _loginInfo;
    }
    public void WebSetGet(ez.data.info.DataInfo _webInfo)
    {
        webInfo = _webInfo;
    }

    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {                     
            if (!_f.isStrNull(webInfo.logo))
            {
                LOGO_ALT.Visible = false;
                LOGO.Visible = true;
                ez.data.info WebSet = new ez.data.info();        
                LOGO.ImageUrl = WebSet.Dir + "/" + webInfo.logo;
                LOGO.ImageUrl = LOGO.ImageUrl.Replace("//", "/");
            }

            //ez.admin.configuration configuration = new ez.admin.configuration();
            //configuration.Load();
            //ezwebVersion.Text = configuration.Data.Version;        

        }
    }
}