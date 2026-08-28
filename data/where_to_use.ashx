<%@ WebHandler Language="C#" Class="data_where_to_use" %>
using System.Web;
using ez.data;
using System.Data;
using System.Collections.Generic;
using Newtonsoft.Json;
using System.Linq;

public class data_where_to_use : IHttpHandler
{
    ez.function f = new ez.function();

    public struct DataInfo
    {
        public string name;
        public List<Dictionary<string, object>> app;
    }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json";

        configExtend c = new configExtend("where");
        string count = c.GetSetValue("display_quantity");

        where_to_use where_to_use = new where_to_use();
        string nation = "TW";
        List<DataInfo> list = new List<DataInfo>();
        int index = 0;
        foreach (string v in where_to_use.kindValue)
        {
            if (f.IsNumeric(count))
                list.Add(new DataInfo() { name = v, app = ConvertDataTabletoRows(where_to_use.RowDataTable(nation, index, true)).Take(f.Val(count)).ToList() });
            else
                list.Add(new DataInfo() { name = v, app = ConvertDataTabletoRows(where_to_use.RowDataTable(nation, index, true)) });
            index++;
        }
        context.Response.Write(JsonConvert.SerializeObject(list));
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
                if (col.ColumnName == "subject") { row.Add("name", f.ValString(dr[col])); }
                else if (col.ColumnName == "use_value") { row.Add("value", f.Val(dr[col])); row.Add("unit", "%"); }
                else
                    row.Add(col.ColumnName, dr[col]);
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
