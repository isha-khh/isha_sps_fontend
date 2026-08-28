using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.UI.HtmlControls;
using System.Data;
using System.Data.OleDb;
using System.IO;
using System.Xml;
using System.Text;
using ez;

public partial class admin_language_index : ez.admin.PageBase
{

    public language language = new language();
 

    protected void Page_Load(object sender, EventArgs e)
    {
        if (!IsPostBack)
        {
            if (language.Load())
            {
                language.InitOptions(nation, nationPanel);
                if (nation.Items.Count > 0)
                {
                    if (isStrNull(nation.Items[0].Value))
                    {
                        nation.Items.Remove(nation.Items[0]);
                    }
                }
            }

            if (!isStrNull(Request["nation"]))
            {
                nation.SelectedValue = ValString(Request["nation"]);
            }

            if (!isStrNull(nation.SelectedValue))
            {
                string path = Server.MapPath("~/App_GlobalResources/" + nation.SelectedValue + ".resx");
                FileInfo FileInfo = new FileInfo(path);
                if (FileInfo.Exists) 
                {
                    DataSet ds = new DataSet();
                    ds.ReadXml(path);
                    DataTable dt = ds.Tables[2];
                    Repeater1.DataSource = dt;
                    Repeater1.DataBind();
                }
                else
                {
                    msg.Text = "語系檔(App_GlobalResources/" + nation.SelectedValue + ".resx)不存在，請重新建立或取得。";         
                    submitButton.Visible = false;
                    submitButton2.Visible = false;
                }
            }
            else
            {
                submitButton.Visible = false;
                submitButton2.Visible = false;
            }

           
        }
    }
    

    protected void nation_SelectedIndexChanged(object sender, EventArgs e)
    {
        Response.Redirect(Request.Url.AbsolutePath + "?nation=" + nation.SelectedValue);
    }


    protected void submitButton_Click(object sender, EventArgs e)
    {        
   
        StringBuilder sb = new StringBuilder();
        sb.AppendLine("<?xml version=\"1.0\" encoding=\"utf-8\"?>");
        sb.AppendLine("<root>");

        Stream stream = File.Open(Server.MapPath("~/App_GlobalResources/Header.txt"), FileMode.Open, FileAccess.Read, FileShare.Read);
        StreamReader objReader = new StreamReader(stream);                   
        while (!objReader.EndOfStream)
        {
            sb.AppendLine(objReader.ReadLine());     
        }
        objReader.Close();
        objReader.Dispose();
        stream.Close();
        stream.Dispose();

        foreach (RepeaterItem rItem in Repeater1.Items)
        {
            Literal name = (Literal)rItem.FindControl("name");
            TextBox value = (TextBox)rItem.FindControl("value");
            sb.AppendLine("<data name=\"" + name.Text + "\" xml:space=\"preserve\">");
            sb.AppendLine("<value>" + Server.HtmlEncode(value.Text.Trim()) + "</value>");
            sb.AppendLine("</data>");  
        }

        sb.AppendLine("</root>");

        string path = Server.MapPath("~/App_GlobalResources/" + nation.SelectedValue + ".resx");
        using (StreamWriter outfile = new StreamWriter(path, false))
        {
            outfile.Write(sb.ToString());
        }
        ScriptMsg("更新成功");

    }


}