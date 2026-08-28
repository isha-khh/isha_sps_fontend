using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// 導覽標記
/// </summary>
namespace ez.data
{
    public class JsonLd_BreadcrumbList : JsonLd
    {
        public JsonLd_BreadcrumbList()
        {
            type = "BreadcrumbList";
        }
        public List<BreadcrumbListItem> itemListElement { get; set; }
        public override string ToString()
        {
            return "<script type=\"application/ld+json\">" + JsonConvert.SerializeObject(this, new JsonSerializerSettings() { StringEscapeHandling = StringEscapeHandling.EscapeNonAscii }) + "</script>";
        }
    }
}
