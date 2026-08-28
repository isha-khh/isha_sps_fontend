using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// 評分
/// </summary>
namespace ez.data
{
    public class ReviewRating
    {
        public ReviewRating()
        {
            type = "Rating";
        }

        [JsonProperty(PropertyName = "@type")]
        public string type { get; set; }            //分類
        public int bestRating { get; set; }         //最高評分
        public int worstRating { get; set; }        //最低評分
        public int ratingValue { get; set; }        //所得評分
    }
}
