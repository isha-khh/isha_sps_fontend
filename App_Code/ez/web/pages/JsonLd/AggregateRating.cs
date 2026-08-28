using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// 總評分
/// </summary>
namespace ez.data
{
    public class AggregateRating
    {
        public AggregateRating()
        {
            type = "AggregateRating";
        }
        [JsonProperty(PropertyName = "@type")]
        public string type { get; set; }            //分類

        public int reviewCount { get; set; }        //評論數
        public int ratingValue { get; set; }        //評分
    }
}
