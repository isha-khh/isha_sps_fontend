<%@ WebHandler Language="C#" Class="data_store" %>
using System.Web;
using ez.data;
using System.Data;
using System.Collections.Generic;
using Newtonsoft.Json;
using System.Linq;

public class data_store : IHttpHandler
{
    ez.function f = new ez.function();
    region region = new region();

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json";
        store store = new store();
        string nation = "TW";
        context.Response.Write(JsonConvert.SerializeObject(new
        {
            install = ConvertDataTabletoRows(store.RowDataTable(1, nation, true)),
            check = ConvertDataTabletoRows(store.RowDataTable(2, nation, true))
        }));
    }

    public List<Dictionary<string, object>> ConvertDataTabletoRows(DataTable dt)
    {
        List<Dictionary<string, object>> rows = new List<Dictionary<string, object>>();
        Dictionary<string, object> row;
        int i = 0;
        foreach (DataRow dr in dt.Rows)
        {
            row = new Dictionary<string, object>();
            foreach (DataColumn col in dt.Columns)
            {
                if (col.ColumnName == "areas") { row.Add(col.ColumnName, !f.isStrNull(dr[col]) ? region.getText(f.ValString(dr[col]).Split(new char[] { ',' }, System.StringSplitOptions.RemoveEmptyEntries).Select(n => f.Val(n)).ToArray()) : ""); }
                else if (col.ColumnName == "address") { row.Add(col.ColumnName, f.ValString(dr["postnumber"]) + region.getText(f.Val(dr["city"])) + region.getText(f.Val(dr["area"])) + f.ValString(dr[col])); }
                else { row.Add(col.ColumnName, dr[col]); }
            }
            rows.Add(row);
            i++;
        }
        return rows;
    }

    public bool IsReusable
    {
        get
        {
            return false;
        }
    }
}
