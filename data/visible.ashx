<%@ WebHandler Language="C#" Class="data_visible" %>
using System.Web;
using ez.data;
using System.Data;
using Newtonsoft.Json;

public class data_visible : IHttpHandler
{
    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json";
        bool prescription = false;
        bool company = false;
        bool store = false;
        configExtend c = new configExtend("visible");
        string parameters = "prescription,company,store";
        DataTable dt = c.GetSetView(parameters.Split(','));
        if (dt.Rows.Count > 0)
        {
            DataRow row = dt.Rows[0];
            prescription = (c.ValString(row["prescription"]) == "Y");
            company = (c.ValString(row["company"]) == "Y");
            store = (c.ValString(row["store"]) == "Y");
        }
        context.Response.Write(JsonConvert.SerializeObject(new { prescription = prescription, company = company, store = store }));
    }

    public bool IsReusable
    {
        get
        {
            return false;
        }
    }
}
