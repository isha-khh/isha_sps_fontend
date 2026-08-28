using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// 導覽標記陣列的項目
/// </summary>
namespace ez.data
{
    public class Item
    {
        public Item()
        {
            type = "Thing";
        }
        [JsonProperty(PropertyName = "@type")]
        public string type { get; set; }        //分類
        [JsonProperty(PropertyName = "@id")]
        public string id { get; set; }          //導覽標記標題
    }
}
