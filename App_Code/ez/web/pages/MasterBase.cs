///1.15.0316@前台MasterBase模組

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.IO;
using System.Web.UI;
using System.Web.UI.WebControls;

namespace ez.web.pages
{
    /// <summary>
    /// MasterBase 的摘要描述
    /// </summary>
    public class MasterBase : System.Web.UI.MasterPage
    {
        public utils u;
        public string nation, lang;  //語系
        public ez.function f = new ez.function();

        public string HeadFirstContent = "";    //定義頁面上head開頭的東西，例如ie相容性的meta

        private string _bodyclass;
        public string BodyClass { get { return _bodyclass; } set { _bodyclass = value; } }

        /* pageWidth參數 */
        private int _pageWidth = 0;
        public int pageWidth { get { return _pageWidth; } set { _pageWidth = value; } }

        /* ezKeyword參數 */
        private int _ezKeyword = 0;
        public int ezKeyword { get { return _ezKeyword; } set { _ezKeyword = value; } }

        public MasterBase()
        {
            //
            // TODO: 在這裡新增建構函式邏輯
            //
            this.Load += new System.EventHandler(this.Language_Load);
            this.Load += new System.EventHandler(this.Floating_Load);
            this.Load += new System.EventHandler(this.content_bottom_widgets_Load);
            u = new utils(this);          
        }

        protected void Language_Load(object sender, EventArgs e)
        {
            ez.language language = new ez.language();
            nation = language.getNation();
            lang = nation;
        }

        protected void Floating_Load(object sender, EventArgs e)
        {                  
            FileInfo fInfo1 = new FileInfo(Server.MapPath("~/App_Code/ez/data/member.cs"));
            FileInfo fInfo2 = new FileInfo(Server.MapPath("~/App_Code/ez/data/order.cs"));
            if (fInfo1.Exists && fInfo2.Exists)
            {               
                try
                {
                    string newID = "_floating";
                    string dOption = "page/_uc/floating.ascx";
                    FileInfo FileInfo = new FileInfo(Server.MapPath("~/" + dOption));
                    if (FileInfo.Exists)
                    {
                        Control ctlNew = this.Page.Master.LoadControl("~/" + dOption);
                        ctlNew.ID = newID;
                        ((PlaceHolder)this.Page.Master.FindControl("floating_holder")).Controls.Add(ctlNew);
                    }
           
                }
                catch (Exception ex)
                {
                }               
            }        
        }

        protected void content_bottom_widgets_Load(object sender, EventArgs e)
        {
            FileInfo fInfo1 = new FileInfo(Server.MapPath("~/App_Code/ez/data/news.cs"));
            FileInfo fInfo2 = new FileInfo(Server.MapPath("~/App_Code/ez/data/product.cs"));

            if (fInfo1.Exists && fInfo2.Exists && Request.Url.AbsoluteUri.IndexOf("/page/") < 0 )
            {
                try
                {
                    ez.data.template template = new ez.data.template();
                    template.Load();
                    string newID = "eZHomeContent";
                    string themeDemo = Request["themedemo"];      
                    string dOption = template.Data.HomeContent;
                    if (!f.isStrNull(themeDemo))
                        dOption = "~/Templates/" + themeDemo + "/uc/eZHomeContent.ascx";                    
                    FileInfo FileInfo = new FileInfo(Server.MapPath(dOption));
                    if (FileInfo.Exists)
                    {
                        PlaceHolder holder = (PlaceHolder)this.FindControl("content_bottom_widgets");
                        Control ctlNew = this.Page.Master.LoadControl(dOption);
                        ctlNew.ID = newID;
                        holder.Controls.Add(ctlNew);
                    }
                }
                catch (Exception ex)
                {
                	//HttpContext.Current.Response.Write(ex.Message);
                }
            }

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