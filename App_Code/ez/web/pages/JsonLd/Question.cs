using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// 問題
/// </summary>
namespace ez.data 
{
    public class Question
    {
        public Question()
        {
            type = "Question";
        }

        //必填
        [JsonProperty(PropertyName = "@type")]
        public string type { get; set; }            //分類
        public string name { get; set; }            //簡述問題

        //建議(必填acceptedAnswer 或 suggestedAnswer ,answerCount在JsonLd_QAPage 為必填)
        public int answerCount { get; set; }        //問題的答案總數
        public string text { get; set; }            //問題的全文
        public DateTime dateCreated { get; set; }   //將問題新增至網頁的日期
        public Author author { get; set; }          //作者
        public Answer[] acceptedAnswer { get; set; }    //問題的最佳答案
        public Answer[] suggestedAnswer { get; set; }   //可能的答案
        public int? upvoteCount { get; set; }       //總票數(支持票 - 反對票,例: 5票支持，2 票反對 = 3)
    }
}
