using System;
using ez.data;
using System.Data;

public partial class ext_sitemap_list_sitemap_faq : ez.web.controls.SitemapControl
{
    protected void Page_Load(object sender, EventArgs e)
    {
        kind();
        Data();
        Literal.Text = sb.ToString();
    }

    protected void kind()
    {
        QA.kind QA_kind = new QA.kind();
        DataTable dt = QA_kind.RowDataTable();
        if (dt.Rows.Count > 0)
        {
            foreach (DataRow row in dt.Rows)
            {
                sb.AppendLine(pack("page/faq/index.aspx?kind=" + row["num"]));
            }
        }
    }

    protected void Data()
    {
        QA QA = new QA();
        QA.DataQuery queryInfo = new QA.DataQuery();
        queryInfo.SelectColumns = "num";
        queryInfo.PageSize = PageSize;
        QA.QuerySource = queryInfo;
        if (QA.Query())
        {
            foreach (DataRow row in QA.QueryView.Rows)
            {
                sb.AppendLine(pack("page/faq/index.aspx?num=" + row["num"]));
            }
        }
    }
}