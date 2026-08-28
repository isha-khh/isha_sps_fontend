using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// 優惠
/// </summary>
namespace ez.data
{
    public class Offers
    {
        public Offers()
        {
            type = "AggregateOffer";
        }

        //必填
        [JsonProperty(PropertyName = "@type")]
        public string type { get; set; }                //分類
        public float lowPrice { get; set; }             //優惠的最低價格
        public string priceCurrency { get; set; }       //使用的貨幣  https://en.wikipedia.org/wiki/ISO_4217

        //建議
        public float highPrice { get; set; }            //優惠的最高價格
        public int offerCount { get; set; }             //產品的優惠數量
    }
}
