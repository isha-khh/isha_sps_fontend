///1.15.0216@utils模組

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.UI.HtmlControls;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.VisualBasic;
using System.Data;
using System.Xml;
using System.IO;
using System.IO.Compression;
using System.Net;
using System.Configuration;
using System.Collections;
using System.Data.OleDb;
using ez.web.pages;
using ez.web.controls;
namespace ez
{
    /// <summary>
    /// utils 的摘要描述
    /// </summary>
    public class utils
    {
        public MasterBase mast;
        public PageBase page;
        public ControlBase ctrl;
        public HttpResponse response;
        public utils()
        {
            //
            // TODO: 在這裡新增建構函式邏輯            
        }
        public utils(ControlBase c) {
            ctrl = c;
            page = (PageBase)(c.Page);
        }
        public utils(MasterBase m, PageBase p=null)
        {
            mast = m;
            page = p;
        }
        public string WebRoot(string path="")
        {
            //return page.ResolveUrl("~/");
            //下方是抓網址
            return VirtualPathUtility.ToAbsolute("~/" + path);
            //下方是抓admin 後台資料設定的網址
            // string http_path = page.WebSet.Data.url;
            //  if (http_path.Substring(http_path.Length - 1, 1).ToString() != "/") { http_path = http_path + "/"; }
            //    return http_path + path;
        }
        //public void showWebRoot(string path = "")
        //{
        //    page.Response.Write(WebRoot(path));

        //}
        /*
         * sample of static method
         * 
        public static string _WebRoot
        {
            get
            {
                //return page.ResolveUrl("~/");
                return VirtualPathUtility.ToAbsolute("~/");
            }
        } 
        */
    }
}
