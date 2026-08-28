using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using System.Collections;
using System.Configuration;
using ez.admin;

public partial class admin_site : ez.admin.MasterBase, BasePageToMaster
{

    public string BodyCssClass
    {
        get { return Body.Attributes["class"]; }
        set { Body.Attributes["class"] = value; }
    }

    public ez.function _f = new ez.function();
    public ez.admin.user.loginInfoType loginInfo = new ez.admin.user.loginInfoType();

    public void loginStatusGet(ez.admin.user.loginInfoType _loginInfo)
    {
        loginInfo = _loginInfo;

        ez.data.info WebSet = new ez.data.info();
        WebSet.Load();
        ((MasterToUC)this.FindControl("ver")).WebSetGet(WebSet.Data);
        ((MasterToUC)this.FindControl("ver")).loginStatusGet(_loginInfo);      
        ((MasterToUC)this.FindControl("masterbutton")).WebSetGet(WebSet.Data);
        ((MasterToUC)this.FindControl("masterbutton")).loginStatusGet(_loginInfo);      
     
    }

    public void MasteBodyClass(string className)
    {
        BodyCssClass = className;
    }

    protected void Page_Load(object sender, EventArgs e)
    {
        CsrfHandler.Validate(this.Page, forgeryToken);
        if (!Page.IsPostBack)
        {
              
            if (!_f.isStrNull(loginInfo.Num))
            {

                systemMenu(Repeater1, 0, loginInfo);
                ViewState["menuRange"] = systemMenuNum();
             
            }
            else
            {
            
                bool isDM = isDesignMode();  //是否為設計師模式
                ((MasterToAdminIndex)this.Page).setDesignMode(isDM);           
               
            }


        }
    }


    #region 檢查是否使用設計師模式

    protected bool isDesignMode()
    {
        bool isDM = false;      
         if (!_f.isStrNull(ConfigurationManager.AppSettings["designIP"]))
         {
             string[] DesignIP = ConfigurationManager.AppSettings["designIP"].ToString().Split(',');
             string myIP = _f.getIP();
             foreach (string chkIP in DesignIP)
             {
                 if (chkIP == myIP)
                 {
                     isDM = true;
                     break;
                 }
             }
         }       
      
        return isDM;
    }

    #endregion
   
    
}
