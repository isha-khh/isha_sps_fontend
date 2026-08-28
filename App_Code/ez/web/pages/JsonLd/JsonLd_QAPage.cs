using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// 問與答
/// </summary>
namespace ez.data 
{
    public class JsonLd_QAPage : JsonLd
    {
        public JsonLd_QAPage()
        {
            type = "QAPage";
        }

        //必填
        public Question mainEntity { get; set; }    //網頁的 Question 必須以巢狀形式列於 QAPage 項目的 mainEntity 屬性底下

        public override string ToString()
        {
            return "<script type=\"application/ld+json\">" + JsonConvert.SerializeObject(this, new JsonSerializerSettings() { StringEscapeHandling = StringEscapeHandling.EscapeNonAscii }) + "</script>";
        }
    }
}
