using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// 品牌
/// </summary>
namespace ez.data
{
    public class Brand
    {
        public Brand()
        {
            type = "Brand";
        }
        [JsonProperty(PropertyName = "@type")]
        public string type { get; set; }            //分類
        public string name { get; set; }            //品牌名稱
    }
}
