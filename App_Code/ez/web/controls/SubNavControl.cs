///1.15.0216@前台ControlBase模組

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using ez.web.pages;
using System.Configuration;
using System.Net;
using System.IO;
using System.Web.UI;
using System;
using System.Text;

namespace ez.web.controls
{
    /// <summary>
    /// SubmenuControl 的摘要描述
    /// </summary>
    public class SubNavControl : ez.web.controls.ControlBase
    {
        

        private String _sub_menu_para = "";                   //子選單參數
        private String _sub_menu_title = "";                  //子選單標題
        private String _sub_menu_titleurl = "";               //子選單標題連結
        private Boolean _sub_menu_title_visable = false;      //顯示/不顯示 子選單標題
        private String _liClassName = "";                     //下拉選單的LI className
        private String _ulClassName = "";                     //下拉選單的UL className
        private int _Tiers = 2;                               //選單階層數 =2        

        public String sub_menu_para { get { return _sub_menu_para; } set { _sub_menu_para = value; } }
        public String sub_menu_title { get { return _sub_menu_title; } set { _sub_menu_title = value; } }
        public String sub_menu_titleurl { get { return _sub_menu_titleurl; } set { _sub_menu_titleurl = value; } }
        public Boolean sub_menu_title_visable { get { return _sub_menu_title_visable; } set { _sub_menu_title_visable = value; } }
        public String liClassName { get { return _liClassName; } set { _liClassName = value; } }
        public String ulClassName { get { return _ulClassName; } set { _ulClassName = value; } }
        public int Tiers { get { return _Tiers; } set { _Tiers = value; } }
      

        public void transHtml(string aspxPagePath, string htmlPagePath)
        {
            System.Web.UI.Page page = new Page();
            StringWriter writer = new StringWriter();
            //把目標網頁執行後的結果丟到 writer 內
            page.Server.Execute(aspxPagePath, writer);
            FileStream fs;
            fs = File.Create(page.Server.MapPath("") + "\\" + htmlPagePath);
            byte[] bt = System.Text.Encoding.Default.GetBytes(writer.ToString());
            fs.Write(bt, 0, bt.Length);
            fs.Close();
        }

        public class JsonParameter
        {
            public int kindno { get; set; }
            public string liclass { get; set; }
            public Boolean hasTiltle { get; set; }
            public int Tiers { get; set; }
        }

    }

}
