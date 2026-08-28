using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// 導覽標記陣列
/// </summary>
namespace ez.data
{
    public class BreadcrumbListItem
    {
        public BreadcrumbListItem()
        {
            type = "ListItem";
        }
        [JsonProperty(PropertyName = "@type")]
        public string type { get; set; }            //分類
        public string name { get; set; }            //導覽標記標題
        public Item item { get; set; }              //指定網頁的網址
        public int position { get; set; }           //導覽標記在導覽標記記錄中的位置,1,2,3.....
    }
}

