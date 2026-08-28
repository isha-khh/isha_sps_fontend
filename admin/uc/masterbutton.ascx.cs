using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;

public partial class admin_uc_masterbutton : System.Web.UI.UserControl, MasterToUC
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

            ez.admin.configuration configuration = new ez.admin.configuration();
            configuration.Load();

            if (Request.Url.AbsolutePath.ToLower().IndexOf("admin/index.aspx") == -1)
            {
                u_id.Text = loginInfo.ID;
                u_id2.Text = u_id.Text;

                string wrpLoginUrl = configuration.Data.WrpWeb;
                if (!_f.isStrNull(webInfo.wrpUser) && !_f.isStrNull(webInfo.wrpPassword))
                {
                    wrpLoginUrl += (wrpLoginUrl.IndexOf("?") > -1 ? "&" : "?") + "identity=" + webInfo.wrpUser + "|" + _f.MD5(webInfo.wrpPassword);
                }

                WrpWeb1.NavigateUrl = wrpLoginUrl;
                WrpWeb2.NavigateUrl = wrpLoginUrl;
                         

                try
                {

                    if (Session[_f.SC + "_wrpUpdateCount"] == null)
                    {
                        Session[_f.SC + "_wrpUpdateCount"] = "0";
                        if (!_f.isStrNull(webInfo.wrpUser) && !_f.isStrNull(webInfo.wrpPassword))
                        {
                            string verUrl = webInfo.url + "/App_Xml/ver.ashx";
                            verUrl = verUrl.Replace("//App_Xml", "/App_Xml");
                            string apiUrl = configuration.Data.WrpApiUrl + configuration.Data.WrpApiUpdate;
                            string xmlData = _f.ReadPostFormContent(apiUrl, "ver=" + verUrl + "&u_id=" + webInfo.wrpUser + "&u_password=" + _f.MD5(webInfo.wrpPassword));
                            DataTable dt = _f.XmDataTable(xmlData, "more");
                            if (dt.Rows.Count > 0)
                            {
                                Session[_f.SC + "_wrpUpdateCount"] = dt.Rows[0]["Count"];
                            }
                        }
                    }


                    if (_f.Val(Session[_f.SC + "_wrpUpdateCount"]) > 0)
                    {
                        wrpImportant.Text = "您有目前有" + Session[_f.SC + "_wrpUpdateCount"].ToString() + "個更新";
                        wrpImportant.ForeColor = System.Drawing.Color.Red;
                        wrpImportant.Visible = true;
                        wrpImportant.NavigateUrl = "~/admin/item/update.aspx";
                    }


                }
                catch (Exception ex)
                {
                    Session[_f.SC + "_wrpUpdateCount"] = "0";
                    //Response.Write(ex.Message);            
                }
            }


            //登入後的首頁要載入WRP訊息
            //if (Request.Url.AbsolutePath.ToLower().IndexOf("admin/index2.aspx") > -1)
            //{
            //    ((MasterToAdminIndex2)this.Page).setWrpInfo(configuration.Data.WrpApiUrl, configuration.Data.WrpApiClient);
            //}

        }
    }
}