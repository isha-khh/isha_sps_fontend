using System;
using System.Text;


namespace ez.web.controls
{
    /// <summary>
    /// SubmenuControl 的摘要描述
    /// </summary>
    public class SitemapControl : System.Web.UI.UserControl
    {
        public StringBuilder sb = new StringBuilder();
        public ez.function f = new ez.function();
        public string http_path = "";
        public string ReplaceTxt = @"[^\w\.@-]";
        public int PageSize = 99999;

        protected SitemapControl()
        {
            path();//取得後臺輸入路徑
        }

        protected void path()
        {
            ez.data.info WebSet = new ez.data.info();
            WebSet.Load();
            http_path = WebSet.Data.url;
            if (http_path.Substring(http_path.Length - 1, 1).ToString() != "/") { http_path = http_path + "/"; }
        }

        public string pack(string loc)
        {
            string pack = "";
            pack = "<url><loc>" + http_path + loc + "</loc></url>";
            return pack;
        }

        public string pack_img(string loc, string img_loc, string img_caption)
        {
            string pack = "";
            pack = "<url><loc>" + http_path + loc + "</loc><image:image><image:loc>" + http_path + img_loc + "</image:loc><image:caption>" + img_caption + "</image:caption></image:image>" + "</url>";
            return pack;
        }
    }

}
