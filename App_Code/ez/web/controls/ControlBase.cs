///1.15.0216@前台ControlBase模組

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using ez.web.pages;

namespace ez.web.controls
{
    /// <summary>
    /// ControlBase 的摘要描述
    /// </summary>
    public class ControlBase : System.Web.UI.UserControl
    {
        public utils u;
        public string nation, lang;  //語系
        public ez.function f = new ez.function(); //// p可以取代f, 之後可以刪掉f
        public PageBase p;

        public ControlBase()
        {
            //
            // TODO: 在這裡新增建構函式邏輯
            //
            this.Load += new System.EventHandler(this.Language_Load);
            this.Load += new System.EventHandler(this.Control_Load);          
        }

        protected void Language_Load(object sender, EventArgs e)
        {
            ez.language language = new ez.language();
            nation = language.getNation();
            lang = nation;
            p = (PageBase)(this.Page); 
        }

        protected void Control_Load(object sender, EventArgs e)
        {
            // Control Loaded
            u = new utils(this);
        }


        //輸出語系文字
        //public void _e(string myString)  
        //{
        //    f._e(myString);
        //}

        //取得語系文字
        public string _t(string myString)
        {
            return f._t(myString);
        }
       

    }

}
