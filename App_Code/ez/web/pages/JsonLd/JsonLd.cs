using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// JsonLd
/// </summary>
namespace ez.data
{
    public class JsonLd
    {
        public JsonLd()
        {
            context = "https://schema.org";
        }

        [JsonProperty(PropertyName = "@context")]
        public string context { get; set; }        //固定http://schema.org

        [JsonProperty(PropertyName = "@type")]
        public string type { get; set; }           //分類
    }
}
