using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// 商品
/// </summary>
namespace ez.data
{
    public class JsonLd_Product : JsonLd
    {
        public JsonLd_Product()
        {
            type = "Product";
        }

        //必填
        public string name { get; set; }            //產品名稱
        public string[] image { get; set; }         //產品的圖片網址

        //建議(必填review、aggregateRating 或 offers 其中之一)
        public Offers offers { get; set; }          //優惠
        public string description { get; set; }     //產品說明
        public Brand brand { get; set; }            //品牌
        public Review[] review { get; set; }        //評論、評分(兩筆以上需要必填aggregateRating)
        public AggregateRating aggregateRating { get; set; }    //總評分

        public override string ToString()
        {
            return "<script type=\"application/ld+json\">" + JsonConvert.SerializeObject(this, new JsonSerializerSettings() { StringEscapeHandling = StringEscapeHandling.EscapeNonAscii }) + "</script>";
        }
    }
}
