///1.15.0226@前台PageBase模組

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using ez.web.pages;
using ez.data;
using System.Web.UI;
using System.Web.UI.HtmlControls;
using System.Web.UI.WebControls;
using System.Data;
using System.Collections;
using System.IO;
using System.Data.OleDb;

namespace ez.web.pages
{

    /// <summary>
    /// PageBase 的摘要描述
    /// </summary>
    public class PageBase : ez.function
    {       
        public MasterBase MasterPage;
        public utils u;
        public framesets.ConfigInfo t = new framesets.ConfigInfo();
        public widgets.ConfigInfo d = new widgets.ConfigInfo();
        public string nation, lang;  //語系
        public PageLayout layout = new PageLayout();
        public DataTable ucAllTable;
        public info WebSet = new info();
        public language language = new language();
        // 判斷內容語系
        public string lang_nation = "nation";
        public string lang_where = "num";
        public string lang_from = "";//curr_order
        public string lang_url = "";//kind

        public PageBase()
        {
            //
            // TODO: 在這裡新增建構函式邏輯
            //
            
            this.Load += new System.EventHandler(this.Framesets_Load);
            this.Load += new System.EventHandler(this.PageBase_Load);

            this.Init += new System.EventHandler(this.WebSetInfo_Load);
            this.Init += new System.EventHandler(this.Language_Load);
            this.Init += new System.EventHandler(this.PageTitle_Load);       
  
        }

        protected void Page_PreInit(object sender, EventArgs e)
        {

            foreach (string key in HttpContext.Current.Request.Form)
            {
                if (HttpContext.Current.Request.Form[key].ToLower().IndexOf("<img") > -1 && HttpContext.Current.Request.Form[key].ToLower().IndexOf("base64") > -1)
                {
                    HttpContext.Current.Response.Clear();
                    HttpContext.Current.Response.Write("請勿使用base64編碼的圖片置於內容中");
                    HttpContext.Current.Response.End();
                }
            }

            if (SC == "ezweb")
            {
                HttpContext.Current.Response.Clear();
                HttpContext.Current.Response.Write("Web.config的SC參數請勿使用「ezweb」，請改成您案件的資料夾名稱");
                HttpContext.Current.Response.End();
            }

            string themeDemo = Request["themedemo"];
            string themeURL;
            themeURL = "~/Templates/" + themeDemo + "/default.master";
            SetDetectXSS();
            if (String.IsNullOrEmpty(themeDemo))
            {
                template template = new template();
                template.Load();
                this.MasterPageFile = template.Data.WebTemplate;
            }
            else
            {
                ////!should get master filename from config.xml
                this.MasterPageFile = themeURL;
            }
        }

        protected void Page_LoadComplete(object sender, EventArgs e)
        {
                
        }

        protected void WebSetInfo_Load(object sender, EventArgs e)
        {
            WebSet.Load();              
            try
            {
                ((WebSetToUC)Master.FindControl("nav_01")).WebSetInfoGet(WebSet.Data);
            }
            catch (Exception)
            {
            }      
        }

        protected void Framesets_Load(object sender, EventArgs e)
        {
            framesets framesets = new framesets();
            framesets.Load();
            t = framesets.Config;


            //載入單元
            string category = "*";
            sitemap sitemap = new sitemap();
            foreach (DataRow row in sitemap.XmlTable.Rows)
            {
                string urlValue = row["url"].ToString().Replace("~/", "");
                if (!isStrNull(urlValue))
                {
                    if (Request.Url.AbsolutePath.IndexOf(urlValue) > -1)
                    {
                        category = urlValue;
                        break;
                    }
                }
            }
            widgets widgets = new widgets();
            widgets.Load(category);
            d = widgets.Config;
        }

        protected void SetLanguage()
        {
            if (Request.QueryString["lang"] == null)
            {
                ez.sql sql = new ez.sql();
                string sqlQuery = "select " + lang_nation + " from [" + lang_from + "] where " + lang_where + "=?";
                ArrayList OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter(lang_where, ValString(Request[this.lang_url])));
                DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
                if (dt.Rows.Count > 0)
                {
                    Response.Redirect(BuildUrl(Request.Url.AbsoluteUri, "lang", dt.Rows[0][lang_nation].ToString()));
                }
            }
        }

        protected void Language_Load(object sender, EventArgs e)
        {
            SetLanguage();
            nation = language.getNation();
            lang = nation;
            if (language.Load(nation))
            {
                web_counter web_counter = new web_counter();
                web_counter.Check(nation);

                try
                {
                    ((LangToUC)Master.FindControl("footer_01")).LangInfoGet(language.Data);
                }
                catch (Exception)
                {
                }
                try
                {
                    ((LangToUC)Master.FindControl("nav_01")).LangInfoGet(language.Data);
                }
                catch (Exception)
                {
                }
                try
                {
                    ((LangToUC)Master.FindControl("HeadFinal1")).LangInfoGet(language.Data);
                }
                catch (Exception)
                {
                }
                try
                {
                    ((LangToUC)Master.FindControl("floating_holder")).LangInfoGet(language.Data);
                }
                catch (Exception)
                {
                }
            }
        }

        /// <summary>
        /// [yiming:2014/10/15]
        /// PageBase_Load : 
        /// 執行"Page_Load"事件, 為了避免與常用的Page_Load混淆, 造成override/new的問題, 
        /// 故改用"PageBase_Load"名稱
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        protected void PageBase_Load(object sender, EventArgs e)
        {
            MasterPage = (MasterBase)Master;
            u = new utils(this.MasterPage, this);
            PageLayout pl = new PageLayout();
                              
            pl.useAreaSet(sideType());
            setMasterAttr("side1","class", pl.getRwdClasses(PageLayout.CustomAreas.side1));
            setMasterAttr("side2", "class", pl.getRwdClasses(PageLayout.CustomAreas.side2));
            setMasterAttr("content", "class", pl.getRwdClasses(PageLayout.CustomAreas.content));

            //Page_defaults()一定要是最後一行
            Page_Defaults();
        }
        
        /// <summary>
        /// [yiming:2014/10/15]
        /// Page_Defaults : 
        /// 給設計師用的頁面載入事件
        /// </summary>
        public virtual void Page_Defaults()
        {
            /// 給設計師用的頁面載入事件
        }
        public void setMasterAttr(string controlID, string attribute , string value){
            // 設定Master控制項屬性
            ((HtmlGenericControl)(this.Master.FindControl(controlID))).Attributes[attribute] = value;
        }
        public void setAttr(string controlID, string attribute, string value)
        {
            // 設定頁面控制項屬性
            ((HtmlGenericControl)(this.FindControl(controlID))).Attributes[attribute] = value;
        }

        #region MyRegion

        protected void PageTitle_Load(object sender, EventArgs e)
        {
            seo seo = new seo("default_" + nation);
            if (seo.Load(0))
            {
                this.Title = seo.Data.title;
                try
                {
                    ((SEOToUCMeta)Master.FindControl("eZHeadMeta1")).SEOInfoGet(seo.Data);
                }
                catch (Exception)
                {
                }
            }         

        }
        #endregion


        #region UC

        protected string sideType()
        {
            //判斷頁面是否有掛載UC
            widgets widgets = new widgets();            
            ArrayList sideLeft = new ArrayList();
            ArrayList sideRight = new ArrayList(); 
       
                if (d.side1_bottom_widgets.Count>0)
                {
                    foreach (string dOption in d.side1_bottom_widgets)
                    {
                        sideLeft.Add(dOption);             
                    }        
                }
                if (d.side2_bottom_widgets.Count>0)
                {
                    foreach (string dOption in d.side2_bottom_widgets)
                    {
                        sideRight.Add(dOption); 
                    }                              
                }
           
            d.side1_bottom_widgets = sideLeft; d.side2_bottom_widgets = sideRight; //寫回物件名稱，讓頁面載入需要的uc
            string _sideType = "none";
            try
            {
                int LeftCount = sideLeft.Count+(Master.FindControl("side1_holder")
                    .Controls.OfType<UserControl>()).Count<UserControl>();
                int RightCount = sideRight.Count+(Master.FindControl("side2_holder")
                    .Controls.OfType<UserControl>()).Count<UserControl>();
            
                if (LeftCount > 0 && RightCount > 0) { _sideType = "both"; }
                else if (LeftCount > 0) { _sideType = "left"; }
                else if (RightCount > 0) { _sideType = "right"; }
            }
            catch(Exception ex)
            {

            }

            EmbedUC();

            return _sideType;
        }

        public void EmbedUC()  //動態載入uc
        {
            PlaceHolder mpContentPlaceHolder;

            if (d.side1_bottom_widgets.Count > 0)
            {
                mpContentPlaceHolder = (PlaceHolder)Master.FindControl("side1_bottom_widgets");
                foreach (string dOption in d.side1_bottom_widgets)
                {
                    FileInfo FileInfo = new FileInfo(Server.MapPath("~/" + dOption));
                    if (FileInfo.Exists)
                    {
                        string newID = dOption + "_side1_bottom_widgets";
                        Control ctlNew = this.Page.LoadControl("~/" + dOption);
                        ctlNew.ID = newID;
                        mpContentPlaceHolder.Controls.Add(ctlNew);
                    }
                }
            }

            if (d.side2_bottom_widgets.Count > 0)
            {
                mpContentPlaceHolder = (PlaceHolder)Master.FindControl("side2_bottom_widgets");
                foreach (string dOption in d.side2_bottom_widgets)
                {
                    FileInfo FileInfo = new FileInfo(Server.MapPath("~/" + dOption));
                    if (FileInfo.Exists)
                    {
                        string newID = dOption + "_side2_bottom_widgets";
                        Control ctlNew = this.Page.LoadControl("~/" + dOption);
                        ctlNew.ID = newID;
                        mpContentPlaceHolder.Controls.Add(ctlNew);
                    }
                }
            }
            

        }
        
        #endregion


    }
}