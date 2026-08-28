<%@ WebHandler Language="C#" Class="data_prescription" %>
using System.Web;
using ez.data;
using System.Data;
using System.Collections.Generic;
using Newtonsoft.Json;

public class data_prescription : IHttpHandler
{
    ez.function f = new ez.function();
    prescription prescription = new prescription();
    prescription.company company = new prescription.company();

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json";
        string nation = "TW";
        context.Response.Write(JsonConvert.SerializeObject(ConvertDataTabletoRows(prescription.RowDataTable(nation, true))));
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
                if (col.ColumnName == "pro_name") { row.Add("name", f.ValString(dr[col])); }
                else if (col.ColumnName == "pic")
                {
                    string[] pic = f.ValString(dr[col]).Split(',');
                    row.Add(col.ColumnName, pic.Length > 0 ? (!f.isStrNull(pic[0]) ? prescription.Dir.Replace("~/", "") + pic[0] : "") : "");
                }
                else if (col.ColumnName == "reg_time") { row.Add(col.ColumnName, f.ValDate(dr[col]).ToString(f.DateFormat)); }
                else { row.Add(col.ColumnName, dr[col]); }
            }
            row.Add("company", ConvertDataTabletoRows2(company.RowDataTable(f.Val(dr["num"]))));
            rows.Add(row);
            i++;
        }
        return rows;
    }

    public List<Dictionary<string, object>> ConvertDataTabletoRows2(DataTable dt)
    {
        List<Dictionary<string, object>> rows = new List<Dictionary<string, object>>();
        Dictionary<string, object> row;
        int i = 0;
        foreach (DataRow dr in dt.Rows)
        {
            row = new Dictionary<string, object>();
            foreach (DataColumn col in dt.Columns)
            {
                if (col.ColumnName == "kind") { row.Add("name", f.ValString(dr[col])); }
                else if (col.ColumnName == "reg_time") { row.Add(col.ColumnName, f.ValDate(dr[col]).ToString(f.DateFormat)); }
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
