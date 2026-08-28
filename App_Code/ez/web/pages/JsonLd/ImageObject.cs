using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

/// <summary>
/// 圖片
/// </summary>
namespace ez.data
{
    public class ImageObject
    {
        public ImageObject()
        {
            type = "ImageObject";
        }

        [JsonProperty(PropertyName = "@type")]
        public string type { get; set; }            //分類
        public string url { get; set; }             //圖片的網址
    }
}
