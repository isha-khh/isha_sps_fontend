<%@ WebHandler Language="C#" Class="data_average" %>
using System.Web;
using ez.data;
using System.Collections.Generic;
using Newtonsoft.Json;
using System.IO;
using System;

public class data_average : IHttpHandler
{
    ez.function f = new ez.function();

    public struct RqDataInfo
    {
        public int city;
        public int population;
        public float value;
    }

    public struct DataInfo
    {
        public int id;
        public string name;
        public float value;
        public string valueText;
    }

    public void ProcessRequest(HttpContext context)
    {
        context.Response.ContentType = "application/json";

        var jsonString = string.Empty;
        context.Request.InputStream.Position = 0;
        using (var inputStream = new StreamReader(context.Request.InputStream))
        {
            jsonString = inputStream.ReadToEnd();
        }
        RqDataInfo rs = JsonConvert.DeserializeObject<RqDataInfo>(jsonString);

        string nation = "TW";
        float multiple = 0; //倍數
        List<DataInfo> list = new List<DataInfo>();
        if (rs.value > 0) //用電度數
        {
            list.Add(new DataInfo() { id = 1, name = "您的用電", value = rs.value, valueText = rs.value.ToString() });

            region region = new region();
            int? area = null;
            if (rs.city > 0)
                area = region.getArea(1, rs.city);
            region.use use = new region.use();
            region.use.DataInfo data = use.average(nation, rs.value, (area.HasValue ? area.Value : 0), rs.population);
            if (data.value.HasValue)
            {
                list.Add(new DataInfo() { id = 2, name = "年平均用電", value = data.value.Value, valueText = data.value.Value.ToString() });
                multiple = rs.value / data.value.Value;
            }

            if (data.population > 0)
                list.Add(new DataInfo() { id = 3, name = "家庭人口", value = (1000 * rs.population)  + 1000, valueText = region.populationText(data.population) });
        }
        context.Response.Write(JsonConvert.SerializeObject(new
        {
            multiple = Math.Round(multiple, 1),
            data = list
        }));
    }

    public bool IsReusable
    {
        get
        {
            return false;
        }
    }
}
