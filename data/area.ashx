<%@ WebHandler Language="C#" Class="data_area" %>
using System.Web;
using ez.data;
using System.Data;
using System.Collections.Generic;
using Newtonsoft.Json;
using System.Linq;

public class data_area : IHttpHandler
{
    ez.function f = new ez.function();
    region region = new region();

    public struct DataInfo
    {
        public int id;
        public string name;
        public List<Dictionary<string, object>> cities;
    }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json";
        string nation = "TW";
        List<DataInfo> list = new List<DataInfo>();
        int index = 0;
        foreach (string area in region.area2Value)
        {
            list.Add(new DataInfo() { id = index, name = area, cities = ConvertDataTabletoRows(region.RowDataTable(0, nation, 2, index)) });
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
                if (col.ColumnName == "num") { row.Add("id", f.ValString(dr[col])); }
                else if (col.ColumnName == "kind") { row.Add("name", f.ValString(dr[col])); }
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
