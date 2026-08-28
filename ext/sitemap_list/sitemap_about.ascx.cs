using System;
using ez.data;
using System.Data;

public partial class ext_sitemap_list_sitemap_about : ez.web.controls.SitemapControl
{
    protected void Page_Load(object sender, EventArgs e)
    {
        Data();
        Literal.Text = sb.ToString();
    }

    protected void Data()
    {
        pages pages = new pages();
        DataTable dt = pages.RowDataTable();        
        if (dt.Rows.Count > 0)
        {
            foreach (DataRow row in dt.Rows)
            {
                sb.AppendLine(pack("page/about/index.aspx?kind=" + row["num"]));
            }
        }
    }

}