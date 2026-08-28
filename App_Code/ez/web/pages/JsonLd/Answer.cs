using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// 回答
/// </summary>
namespace ez.data 
{
    public class Answer
    {
        public Answer()
        {
            type = "Answer";
        }

        //必填
        [JsonProperty(PropertyName = "@type")]
        public string type { get; set; }            //分類
        public string text { get; set; }            //回答

        //建議
        public DateTime dateCreated { get; set; }   //將回答新增至網頁的日期
        public Author author { get; set; }          //作者
        public string url { get; set; }             //網址
        public int? upvoteCount { get; set; }       //總票數(支持票 - 反對票,例: 5票支持，2 票反對 = 3)
    }
}
