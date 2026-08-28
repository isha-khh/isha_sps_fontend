<%@ WebHandler Language="C#" Class="data_web_word" %>
using System.Web;
using ez.data;
using System.Data;
using System.Collections.Generic;
using Newtonsoft.Json;
using System.Linq;

public class data_web_word : IHttpHandler
{
    ez.function f = new ez.function();

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json";
        string nation = "TW";
        string category = context.Request.QueryString["category"];
        webword webword = new webword(category, nation);
        webword.Load();
        webword.Data.word = f.br(webword.Data.word);
        context.Response.Write(JsonConvert.SerializeObject((webword.Data.status ? webword.Data : new webword.DataInfo())));
    }

    public bool IsReusable
    {
        get
        {
            return false;
        }
    }
}
