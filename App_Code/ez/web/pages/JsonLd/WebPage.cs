using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// 網頁
/// </summary>
namespace ez.data
{
    public class WebPage
    {
        public WebPage()
        {
            type = "WebPage";
        }

        [JsonProperty(PropertyName = "@type")]
        public string type { get; set; }            //分類

        [JsonProperty(PropertyName = "@id")]
        public string id { get; set; }             //網址
    }
}
