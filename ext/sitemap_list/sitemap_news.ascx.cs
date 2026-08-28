using System;
using ez.data;
using System.Data;

public partial class ext_sitemap_list_sitemap_news : ez.web.controls.SitemapControl
{
    protected void Page_Load(object sender, EventArgs e)
    {
        kind();
        Data();
        Literal.Text = sb.ToString();
    }

    protected void kind()
    {
        news.kind news_kind = new news.kind();
        DataTable dt = news_kind.RowDataTable();
        if (dt.Rows.Count > 0)
        {
            foreach (DataRow row in dt.Rows)
            {
                sb.AppendLine(pack("page/news/index.aspx?kind=" + row["num"]));
            }
        }
    }

    protected void Data()
    {
        news news = new news();
        news.DataQuery queryInfo = new news.DataQuery();
        queryInfo.SelectColumns = "num";
        queryInfo.PageSize = PageSize;
        news.QuerySource = queryInfo;
        if (news.Query())
        {
            foreach (DataRow row in news.QueryView.Rows)
            {
                sb.AppendLine(pack("page/news/show.aspx?num=" + row["num"]));
            }
        }
    }
}