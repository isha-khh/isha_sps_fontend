using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// 訊息
/// </summary>
namespace ez.data
{
    public class JsonLd_NewsArticle : JsonLd_Article
    {
        public JsonLd_NewsArticle()
        {
            type = "NewsArticle";
        }

        public override string ToString()
        {
            return "<script type=\"application/ld+json\">" + JsonConvert.SerializeObject(this, new JsonSerializerSettings() { StringEscapeHandling = StringEscapeHandling.EscapeNonAscii }) + "</script>";
        }
    }
}
