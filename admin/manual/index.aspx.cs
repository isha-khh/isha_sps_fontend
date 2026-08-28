using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Data;
using System.Data.OleDb;
using ez.data;

public partial class admin_manual_index : ez.admin.PageBase
{
       
    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {

            if (!isStrNull(Request["part_no"]) && !isStrNull(Request["chapter"]))
            {
                //manual manual = new manual();
                //word.Text = manual.GetContent(Request["part_no"], Val(Request["chapter"]));
            }
          

        }
       
    }
    

  
}