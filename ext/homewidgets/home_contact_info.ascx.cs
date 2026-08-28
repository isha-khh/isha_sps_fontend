using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using ez.data;

public partial class home_contact_info : ez.web.controls.ControlBase
{
    /*BlockTitle 參數, 設定區塊標題 (預設值 "聯絡資訊") */
    private string _BlockTitle = "聯絡資訊";
    public string BlockTitle { get { return _BlockTitle; } set { _BlockTitle = value; } }

    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            initContactInfo();   //聯絡資訊
        }
    }

    #region 聯絡資訊

    protected void initContactInfo()
    {
        com_name.Text = (!p.isStrNull(p.language.Data.Com_name)) ? p.language.Data.Com_name : "";
        com_tel.Text = p.language.Data.Com_tel;
        com_bstime.Text = p.language.Data.Com_bstime;
        com_address.Text = p.language.Data.Com_address;
        com_fax.Text = p.language.Data.Com_fax;
        com_mail.Text = p.language.Data.Com_mail;

        com_more.Text = p.language.Data.Com_more;
        com_more_box.Visible = (!p.isStrNull(p.language.Data.Com_more)) ? true : false;
    }

    #endregion
}