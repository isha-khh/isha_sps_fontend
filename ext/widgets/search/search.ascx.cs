using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using ez.data;

public partial class widgets_search : ez.web.controls.ControlBase
{
    

    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {

            ez.language language = new ez.language();
            language.ConvertObjText(Panel1, nation);
            //product.kind pro_kind = new product.kind();
            //pro_kind.InitOptions(kind, nation);

        }
    }

    protected void searchButton_Click(object sender, EventArgs e)
    {
        string queryUrl = "~/page/product/p02.aspx";
        if (!f.isStrNull(kind.SelectedValue))
        {
            queryUrl += (queryUrl.IndexOf("?") > -1 ? "&" : "?") + "kind=" + kind.SelectedValue;
        }
        if (!f.isStrNull(kw.Text.Trim()))
        {
            queryUrl += (queryUrl.IndexOf("?") > -1 ? "&" : "?") + "kw=" + Server.UrlEncode(kw.Text.Trim());
        }
        Response.Redirect(queryUrl);
    }

}