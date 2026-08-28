using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// 作者
/// </summary>
namespace ez.data
{
    public class Author
    {
        public Author()
        {
            //Person 或 Organization
            type = "Organization";
        }

        [JsonProperty(PropertyName = "@type")]
        public string type { get; set; }            //分類
        public string name { get; set; }            //作者的名稱
    }
}
