using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// 發佈者
/// </summary>
namespace ez.data
{
    public class Publisher
    {
        public Publisher()
        {
            type = "Organization";
        }

        [JsonProperty(PropertyName = "@type")]
        public string type { get; set; }            //分類
        public string name { get; set; }            //發佈者的名稱
        public ImageObject logo { get; set; }       //發佈者的logo
    }
}
