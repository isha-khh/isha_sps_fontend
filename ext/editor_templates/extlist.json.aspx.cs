using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using ez.data;


public partial class ext_editor_templates_extlist_json : System.Web.UI.Page
{
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!Page.IsPostBack)
        {
            //載入清單        
            editorTemplates editors = new editorTemplates();
            Response.ContentType = "application/json";
            Response.Write(editors.getJson(Request["kind"]));
        }
    }
}