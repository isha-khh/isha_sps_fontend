using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// 文章
/// </summary>
namespace ez.data
{
    public class JsonLd_Article : JsonLd
    {
        public JsonLd_Article()
        {
            type = "Article";
        }

        //必填
        public string headline { get; set; }            //文章的標題
        public Author author { get; set; }              //作者
        public DateTime datePublished { get; set; }     //文章首次發布的日期
        public string[] image { get; set; }             //文章的圖片網址
        public Publisher publisher { get; set; }        //文章的發佈者

        //建議
        public DateTime dateModified { get; set; }      //修改日期
        public WebPage mainEntityOfPage { get; set; }   //首頁網址
        public string description { get; set; }         //文章簡短說明

        public override string ToString()
        {
            return "<script type=\"application/ld+json\">" + JsonConvert.SerializeObject(this, new JsonSerializerSettings() { StringEscapeHandling = StringEscapeHandling.EscapeNonAscii }) + "</script>";
        }
    }
}
