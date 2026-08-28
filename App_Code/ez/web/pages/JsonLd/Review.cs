using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// 評論
/// </summary>
namespace ez.data
{
    public class Review
    {
        public Review()
        {
            type = "Review";
        }

        [JsonProperty(PropertyName = "@type")]
        public string type { get; set; }                //分類
        public ReviewRating reviewRating { get; set; }  //評分
        public Author author { get; set; }              //作者
        public string description { get; set; }         //評論
    }
}
