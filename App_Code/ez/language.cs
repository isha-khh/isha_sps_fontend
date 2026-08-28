///1.20.0107@語系模組

using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Collections;
using System.Data;
using System.Data.OleDb;
using System.Configuration;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Web.UI.HtmlControls;
using System.Resources;
using System.Reflection;
using System.Globalization;
using System.IO;
using System.Xml;
using System.Text;

public interface LangToUC
{
    void LangInfoGet(ez.language.DataInfo LangInfo);
}

namespace ez
{
    public class language : ez.function
    {

        ez.sql sql = new ez.sql();

        public string log;
        public DataTable languageView;
        public DataInfo Data;
        public string dbTableName = "language";
        public string[] CommunityValue = { "Facebook|icon_f", "Ig|icon_i", "Youtobe|icon_y", "Twitter|icon_t", "Pinterest|icon_p", "Line|icon_l" };   //社群網站


        #region 資料型別

        public class DataInfo
        {
            public string Code = "";
            public string Country = "";
            public string Lang_Name = "";
            public string Url = "";
            public string other_codes = "";
            public string Com_name = "";
            public string Com_tel = "";
            public string Com_fax = "";
            public string Com_mail = "";
            public string Com_address = "";
            public string Com_gmap = "";
            public string Com_bstime = "";
            public string Com_facebook = "";         
            public string Com_more = "";
            public string Com_private = "";
            public int? range;

        }

        public class LanguageText
        {
            public List<string> name = new List<string>();
            public List<string> value = new List<string>();            
        }

        #endregion

        #region 讀取

        public DataTable RowDataTable()
        {
            DataTable dt = new DataTable();
            if (!isStrNull(HttpContext.Current.Application[SC + "WebLang"]))
            {
                try
                {
                    dt = (DataTable)HttpContext.Current.Application[SC + "WebLang"];
                }
                catch (Exception)
                {
                    HttpContext.Current.Application.Lock();
                    HttpContext.Current.Application[SC + "WebLang"] = null;
                    HttpContext.Current.Application.UnLock();
                }
            }

            if (isStrNull(HttpContext.Current.Application[SC + "WebLang"]))
            {
                ArrayList OleDbParameters = new ArrayList();
                string sqlQuery = "SELECT * FROM [" + dbTableName + "] order by range";
                dt = sql.selectTable(sqlQuery, OleDbParameters);
                HttpContext.Current.Application.Lock();
                HttpContext.Current.Application[SC + "WebLang"] = languageView;
                HttpContext.Current.Application.UnLock();
                log = sql.log;
            }

            //string sqlQuery = "select Code,Country,Lang_Name from [" + dbTableName + "] order by range";
            //DataTable dt = sql.selectTable(sqlQuery);
            return dt;
        }

        public ArrayList RowData()
        {
            ArrayList rows = new ArrayList();
            DataTable dt = RowDataTable();
            if (dt.Rows.Count > 0)
            {
                foreach (DataRow row in dt.Rows)
                {
                    Data = new DataInfo();
                    Data.Code = ValString(row["Code"]);
                    Data.Country = ValString(row["Country"]);
                    Data.Lang_Name = ValString(row["Lang_Name"]);
                    rows.Add(Data);
                }
            }

            return rows;
        }

        public bool Load(string nation = "")
        {
            bool success = true;
            log = "";

            if (!isStrNull(HttpContext.Current.Application[SC + "WebLang"]))
            {
                try
                {
                    languageView = (DataTable)HttpContext.Current.Application[SC + "WebLang"];
                }
                catch (Exception)
                {
                    HttpContext.Current.Application.Lock();
                    HttpContext.Current.Application[SC + "WebLang"] = null;
                    HttpContext.Current.Application.UnLock();
                }
            }

            if (isStrNull(HttpContext.Current.Application[SC + "WebLang"]))
            {
                ArrayList OleDbParameters = new ArrayList();
                string sqlQuery = "SELECT * FROM [" + dbTableName + "] order by range";
                languageView = sql.selectTable(sqlQuery, OleDbParameters);
                HttpContext.Current.Application.Lock();
                HttpContext.Current.Application[SC + "WebLang"] = languageView;
                HttpContext.Current.Application.UnLock();
                log = sql.log;
            }          

                        
            if (languageView.Rows.Count > 0 && !isStrNull(nation))
            {
                if (!isStrNull(nation))
                {
                    bool isMatch = false;
                    foreach (DataRow row in languageView.Rows)
                    {
                        if (ValString(row["code"])== nation)
                        {
                            Data = new DataInfo();
                            Data.Code = ValString(row["code"]);
                            Data.Country = ValString(row["country"]);
                            Data.Lang_Name = ValString(row["lang_name"]);
                            Data.Url = ValString(row["url"]);
                            Data.other_codes = ValString(row["other_codes"]);
                            Data.Com_name = ValString(row["com_name"]);
                            Data.Com_tel = ValString(row["com_tel"]);
                            Data.Com_fax = ValString(row["com_fax"]);
                            Data.Com_mail = ValString(row["com_mail"]);
                            Data.Com_address = ValString(row["com_address"]);
                            Data.Com_gmap = ValString(row["com_gmap"]);
                            Data.Com_bstime = ValString(row["com_bstime"]);
                            Data.Com_facebook = ValString(row["Com_facebook"]);
                            Data.Com_more = ValString(row["com_more"]);
                            Data.Com_private = ValString(row["com_private"]);
                            isMatch = true;
                            break;
                        }                     
                    }
                    if (!isMatch)
                    {
                        log = "No language information";
                    }
                }              
            }

            if (!isStrNull(log))
            {
                success = false;
            }
            return success;
        }


        #endregion

        #region 下拉選項

        public ArrayList Options()
        {
            log = "";
            ArrayList langOptions = new ArrayList();
            try
            {
                foreach (DataRow row in languageView.Rows)
                {
                    DataInfo option = new DataInfo();
                    option.Code = ValString(row["code"]);
                    option.Country = ValString(row["country"]);
                    option.Lang_Name = ValString(row["lang_name"]);
                    option.Url = ValString(row["url"]);
                    option.other_codes = ValString(row["other_codes"]);
                    langOptions.Add(option);
                }
            }
            catch (Exception ex)
            {
                log = ex.Message;
            }
            return langOptions;
        }

        public void InitOptions(Control obj, Control NamingContainer)
        {
            ArrayList langOptions = Options();
            foreach (DataInfo option in langOptions)
            {
                ListItem oItem = new ListItem(option.Country, option.Code);
                if (obj is DropDownList) { ((DropDownList)obj).Items.Add(oItem); }
                else if (obj is RadioButtonList) { ((RadioButtonList)obj).Items.Add(oItem); }
                else if (obj is CheckBoxList) { ((CheckBoxList)obj).Items.Add(oItem); }
            }
            if (langOptions.Count <= 1)
            {
                NamingContainer.Visible = false;
                if (langOptions.Count == 1)
                {
                    if (obj is DropDownList) { if (isStrNull(((DropDownList)obj).Items[0].Value)) { ((DropDownList)obj).Items.Remove(((DropDownList)obj).Items[0]); } }
                    else if (obj is RadioButtonList) { if (isStrNull(((RadioButtonList)obj).Items[0].Value)) { ((RadioButtonList)obj).Items.Remove(((RadioButtonList)obj).Items[0]); } }
                    else if (obj is CheckBoxList) { if (isStrNull(((CheckBoxList)obj).Items[0].Value)) { ((CheckBoxList)obj).Items.Remove(((CheckBoxList)obj).Items[0]); } }
                }

            }
        }

        public string OptionText(string Value)
        {
            string Text = "";
            ArrayList langOptions = Options();
            foreach (DataInfo option in langOptions)
            {
                if (option.Code == Value) { Text = option.Country; }
            }
            return Text;
        }

        #endregion

        #region 新增語系主資料

        public bool Add()
        {
            bool success = true;
            log = "";


            string sqlQuery = "SELECT code FROM [" + dbTableName + "]  where [code]=?";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("code", ValString(Data.Code)));
            DataTable dt = sql.selectTable(sqlQuery, OleDbParameters);
            if (dt.Rows.Count > 0)
            {
                success = false;
                log = "代碼已使用過，請勿重複";
            }
            else
            {
                if (!Data.range.HasValue) { Data.range = NewRange(); }
                string column = "code,country,lang_name,url,other_codes,range";
                sqlQuery = "insert into [" + dbTableName + "] (" + column + ") values (" + sql.mark(column) + ")";
                OleDbParameters = new ArrayList();
                OleDbParameters.Add(new OleDbParameter("code", ValString(Data.Code)));
                OleDbParameters.Add(new OleDbParameter("country", ValString(Data.Country)));
                OleDbParameters.Add(new OleDbParameter("lang_name", ValString(Data.Lang_Name)));
                OleDbParameters.Add(new OleDbParameter("url", ValString(Data.Url)));
                OleDbParameters.Add(new OleDbParameter("other_codes", ValString(Data.other_codes)));
                OleDbParameters.Add(new OleDbParameter("range", Data.range.Value));
                success = sql.execute(sqlQuery, OleDbParameters);
                log = sql.log;                                
            }
            HttpContext.Current.Application.Lock();
            HttpContext.Current.Application[SC + "WebLang"] = null;
            HttpContext.Current.Application.UnLock();
            return success;
        }

        public int NewRange()
        {
            int range = 1;
            string sqlQuery = "select top 1 range from [" + dbTableName + "] order by range desc";
            DataTable dt = sql.selectTable(sqlQuery);
            if (dt.Rows.Count > 0) { range = Val(dt.Rows[0]["range"]) + 1; }
            return range;
        }

        #endregion

        #region 修改語系主資料

        public bool Edit()
        {
            bool success = true;
            log = "";

            string column = "country,lang_name,url,other_codes";
            string sqlQuery = "update [" + dbTableName + "] set " + sql.mark2(column) + " where code=?";
            ArrayList OleDbParameters = new ArrayList();          
            OleDbParameters.Add(new OleDbParameter("country", ValString(Data.Country)));
            OleDbParameters.Add(new OleDbParameter("lang_name", ValString(Data.Lang_Name)));
            OleDbParameters.Add(new OleDbParameter("url", ValString(Data.Url)));
            OleDbParameters.Add(new OleDbParameter("other_codes", ValString(Data.other_codes)));
            OleDbParameters.Add(new OleDbParameter("code", ValString(Data.Code)));
            success = sql.execute(sqlQuery, OleDbParameters);
            log = sql.log;
                  
            return success;
        }

        #endregion

        #region 新增語系文字

        public bool AddText(LanguageText item)
        {
            bool success = true;
            log = "";

            if (item.name.Count == item.value.Count)
            {
                if (item.name.Count > 0)
                {
                    string path = "~/App_GlobalResources/";
                    DirectoryInfo dInfo = new DirectoryInfo(Server.MapPath(path));
                    FileInfo[] FileInfos = dInfo.GetFiles();
                    foreach (FileInfo FileInfo in FileInfos)
                    {
                        string[] fn = FileInfo.Name.ToLower().Split('.');
                        if (fn[fn.Length - 1] == "resx")
                        {
                            DataSet ds = new DataSet();
                            ds.ReadXml(FileInfo.FullName);
                            DataTable dt = ds.Tables[2];

                            int diffCount = 0;

                            //這裡跑要加入的語系文字(迴圈也要放這)===start
                            for (int i = 0; i < item.name.Count; i++)
                            {
                                bool isOk = true;
                                foreach (DataRow row in dt.Rows)
                                {
                                    if (ValString(row["name"]).ToLower() == item.name[i].ToLower())
                                    {
                                        isOk = false;
                                        break;
                                    }
                                }
                                if (isOk)
                                {
                                    DataRow tr = dt.NewRow();
                                    tr["name"] = item.name[i];
                                    tr["value"] = item.value[i];
                                    dt.Rows.Add(tr);
                                    diffCount++;
                                }
                            }                         
                            //這裡跑要加入的語系文字(迴圈也要放這)===end


                            //重建語系檔
                            if (diffCount > 0)
                            {
                                StringBuilder sb = new StringBuilder();
                                sb.AppendLine("<?xml version=\"1.0\" encoding=\"utf-8\"?>");
                                sb.AppendLine("<root>");

                                Stream stream = File.Open(Server.MapPath("~/App_GlobalResources/Header.txt"), FileMode.Open, FileAccess.Read, FileShare.Read);
                                StreamReader objReader = new StreamReader(stream);
                                while (!objReader.EndOfStream)
                                {
                                    sb.AppendLine(objReader.ReadLine());
                                }
                                objReader.Close();
                                objReader.Dispose();
                                stream.Close();
                                stream.Dispose();

                                foreach (DataRow row in dt.Rows)
                                {
                                    sb.AppendLine("<data name=\"" + ValString(row["name"]) + "\" xml:space=\"preserve\">");
                                    sb.AppendLine("<value>" + Server.HtmlEncode(ValString(row["value"])) + "</value>");
                                    sb.AppendLine("</data>");
                                }

                                sb.AppendLine("</root>");

                                using (StreamWriter outfile = new StreamWriter(FileInfo.FullName, false))
                                {
                                    outfile.Write(sb.ToString());
                                }
                            }

                        }
                    }
                }
                else
                {
                    log = "無資料";
                }
            }
            else
            {
                log = "參數數量不一致";
            }

            return success;
        }

       

        #endregion

        #region 排序

        public bool SaveSort(string[] codes)
        {
            bool success = true;
            log = "";

            string sqlQuery = "select top 1 range from [" + dbTableName + "] where code in ('" + string.Join("','", codes) + "') order by range";
            DataTable dt = sql.selectTable(sqlQuery);
            if (dt.Rows.Count > 0)
            {
                int range = Val(dt.Rows[0]["range"]);
                foreach (string code in codes)
                {
                    sqlQuery = "update [" + dbTableName + "] set range=? where code=?";
                    ArrayList OleDbParameters = new ArrayList();
                    OleDbParameters.Add(new OleDbParameter("range", range));
                    OleDbParameters.Add(new OleDbParameter("code", code));
                    success = sql.execute(sqlQuery, OleDbParameters);
                    if (!success)
                    {
                        log = sql.log;
                        break;
                    }
                    range++;
                }
            }
            HttpContext.Current.Application.Lock();
            HttpContext.Current.Application[SC + "WebLang"] = null;
            HttpContext.Current.Application.UnLock();
            return success;
        }

        #endregion

        #region 刪除

        public bool Del(string code)
        {
            bool success = true;
            log = "";
            if (!isStrNull(code))
            {
                string[] codes = { code };
                success = Del(codes);
            }
            else
            {
                success = false;
                log = "尚未指定要刪除的資料";
            }
            HttpContext.Current.Application.Lock();
            HttpContext.Current.Application[SC + "WebLang"] = null;
            HttpContext.Current.Application.UnLock();
            return success;
        }

        public bool Del(string[] codes)
        {
            bool success = true;
            log = "";
            if (codes.Length > 0)
            {
                string sqlQuery = "delete from [" + dbTableName + "] where code in ('" + string.Join("','", codes) + "')";
                success = sql.execute(sqlQuery);
                log = sql.log;
            }
            else
            {
                success = false;
                log = "尚未指定要刪除的資料";
            }
            HttpContext.Current.Application.Lock();
            HttpContext.Current.Application[SC + "WebLang"] = null;
            HttpContext.Current.Application.UnLock();
            return success;
        }

        #endregion

        #region 範本複製

        public bool TemplateCopy(string SourceCode, string TargetCode)
        {
            bool success = false;
            log = "";
            string path = Server.MapPath("~/App_GlobalResources/" + SourceCode + ".resx");
            FileInfo FileInfo = new FileInfo(path);
            if (FileInfo.Exists) 
            {
                string target = Server.MapPath("~/App_GlobalResources/" + TargetCode + ".resx");
                try
                {
                    FileInfo.CopyTo(target, true);
                    success = true;
                }
                catch (Exception ex)
                {
                    log = ex.Message;
                }
            }
            else
            {
                log = "範本不存在";
            }

            return success;
        }

        #endregion

        #region 儲存頁面資料

        public bool SavePageInfo()
        {
            bool success = true;
            log = "";
            string sqlQuery = "update [" + dbTableName + "] set com_name=?,com_tel=?,com_address=?,com_gmap=?,com_bstime=?,Com_facebook=?,com_fax=?,com_mail=?,com_more=?,com_private=? where [code]=?";
            ArrayList OleDbParameters = new ArrayList();
            OleDbParameters.Add(new OleDbParameter("com_name", Data.Com_name.Trim()));
            OleDbParameters.Add(new OleDbParameter("com_tel", Data.Com_tel.Trim()));
            OleDbParameters.Add(new OleDbParameter("com_address", Data.Com_address.Trim()));
            OleDbParameters.Add(new OleDbParameter("com_gmap", Data.Com_gmap.Trim()));
            OleDbParameters.Add(new OleDbParameter("com_bstime", Data.Com_bstime.Trim()));
            OleDbParameters.Add(new OleDbParameter("com_facebook", Data.Com_facebook.Trim()));
            OleDbParameters.Add(new OleDbParameter("com_fax", Data.Com_fax.Trim()));
            OleDbParameters.Add(new OleDbParameter("com_mail", Data.Com_mail.Trim()));
            OleDbParameters.Add(new OleDbParameter("com_more", Data.Com_more.Trim()));
            OleDbParameters.Add(new OleDbParameter("com_private", Data.Com_private.Trim()));
            OleDbParameters.Add(new OleDbParameter("code", Data.Code.Trim()));
            if (!sql.execute(sqlQuery, OleDbParameters))
            {
                log = sql.log;
                success = false;
            }
            HttpContext.Current.Application.Lock();
            HttpContext.Current.Application[SC + "WebLang"] = null;
            HttpContext.Current.Application.UnLock();
            return success;
        }
        
        #endregion
        
        #region 轉換控制項的語系文字

        public void ConvertObjText(Control Container, string lang)
        {
            if (Container.HasControls())
            {
                foreach (Control obj in Container.Controls)
                {

                    if (obj is HtmlInputText)
                    {
                        HtmlInputText objCon = (HtmlInputText)obj;
                        if (!isStrNull(objCon.Attributes["placeholder"])) { objCon.Attributes["placeholder"] = _t(objCon.Attributes["placeholder"], lang); }
                    }
                    else if (obj is TextBox)
                    {
                        TextBox objCon = (TextBox)obj;
                        if (!isStrNull(objCon.Attributes["placeholder"])) { objCon.Attributes["placeholder"] = _t(objCon.Attributes["placeholder"], lang); }
                    }
                    else if (obj is Label)
                    {
                        Label objCon = (Label)obj;
                        if (!isStrNull(objCon.Text)) { objCon.Text = _t(objCon.Text, lang); }
                    }
                    else if (obj is Literal)
                    {
                        Literal objCon = (Literal)obj;
                        if (!isStrNull(objCon.Text)) { objCon.Text = _t(objCon.Text, lang); }
                    }
                    else if (obj is LinkButton)
                    {
                        LinkButton objCon = (LinkButton)obj;
                        if (!isStrNull(objCon.Text)) { objCon.Text = _t(objCon.Text, lang); }
                    }
                    else if (obj is Button)
                    {
                        Button objCon = (Button)obj;
                        if (!isStrNull(objCon.Text)) { objCon.Text = _t(objCon.Text, lang); }
                    }
                    else if (obj is HyperLink)
                    {
                        HyperLink objCon = (HyperLink)obj;
                        if (!isStrNull(objCon.Text)) { objCon.Text = _t(objCon.Text, lang); }
                    }
                    else if (obj is RadioButton)
                    {
                        RadioButton objCon = (RadioButton)obj;
                        if (!isStrNull(objCon.Text)) { objCon.Text = _t(objCon.Text, lang); }
                    }
                    else if (obj is CheckBox)
                    {
                        CheckBox objCon = (CheckBox)obj;
                        if (!isStrNull(objCon.Text)) { objCon.Text = _t(objCon.Text, lang); }
                    }
                    else if (obj is DropDownList)
                    {
                        DropDownList objCon = (DropDownList)obj;
                        for (int i = 0; i < objCon.Items.Count; i++)
                        {
                            if (!isStrNull(objCon.Items[i].Text)) { objCon.Items[i].Text = _t(objCon.Items[i].Text, lang); }
                        }
                    }
                    else if (obj is RadioButtonList)
                    {
                        RadioButtonList objCon = (RadioButtonList)obj;
                        for (int i = 0; i < objCon.Items.Count; i++)
                        {
                            if (!isStrNull(objCon.Items[i].Text)) { objCon.Items[i].Text = _t(objCon.Items[i].Text, lang); }
                        }
                    }
                    else if (obj is CheckBoxList)
                    {
                        CheckBoxList objCon = (CheckBoxList)obj;
                        for (int i = 0; i < objCon.Items.Count; i++)
                        {
                            if (!isStrNull(objCon.Items[i].Text)) { objCon.Items[i].Text = _t(objCon.Items[i].Text, lang); }
                        }
                    }

                    //這裡要再獨立判斷，不然會無效果…
                    if (obj is RequiredFieldValidator)
                    {
                        RequiredFieldValidator rfv = (RequiredFieldValidator)obj;
                        if (!isStrNull(rfv.ErrorMessage)) { rfv.ErrorMessage = _t(rfv.ErrorMessage, lang); }
                    }
                    else if (obj is CompareValidator)
                    {
                        CompareValidator rfv = (CompareValidator)obj;
                        if (!isStrNull(rfv.ErrorMessage)) { rfv.ErrorMessage = _t(rfv.ErrorMessage, lang); }
                    }
                    else if (obj is RegularExpressionValidator)
                    {
                        RegularExpressionValidator rfv = (RegularExpressionValidator)obj;
                        if (!isStrNull(rfv.ErrorMessage)) { rfv.ErrorMessage = _t(rfv.ErrorMessage, lang); }
                    }

                    if (obj.HasControls())
                    {
                        ConvertObjText(obj, lang);
                    }

                }
            }
        }

        #endregion

        #region 取得前台所在語系

        public string getNation()
        {
            string HOST = HttpContext.Current.Request.Url.Host;
            string lang = "";
                       
            try
            {
                if (!isStrNull(HttpContext.Current.Request.Cookies[SC + "_clientWebLang"]))
                {
                    if (HttpContext.Current.Request.Cookies[SC + "_clientWebLang"]["Host"].ToString() == HOST)
                    {
                        lang = HttpContext.Current.Request.Cookies[SC + "_clientWebLang"]["Language"].ToString();
                    }
                }
                else
                {
                    //寫自動判斷語系(例如從瀏覽器語系判斷)      
                    string lanInfo = HttpContext.Current.Request.ServerVariables["HTTP_ACCEPT_LANGUAGE"].Split(',')[0];
                                      
                    Load();
                    ArrayList langOptions = Options();
            
                    foreach (DataInfo option in langOptions)
                    {
                        if (!isStrNull(option.other_codes))
                        {
                            string codes = "," + option.other_codes.ToLower() + ",";
                            if (codes.IndexOf("," + lanInfo.ToLower() + ",") > -1)
                            {
                                SaveLangCookie(option.Code, HOST);
                                if (!isStrNull(option.Url))
                                {
                                    HttpContext.Current.Response.Redirect(option.Url);
                                }
                                else
                                {
                                    //HttpContext.Current.Response.Redirect("~/index.aspx?lang=" + option.Code);
                                    HttpContext.Current.Response.Redirect(BuildUrl(HttpContext.Current.Request.Url.AbsoluteUri, "lang", option.Code));
                                }
                                break;
                            }
                        }
                    }

                }

                bool urlMath = false;
                if (lang == "")
                {
                    Load();
                    ArrayList langOptions = Options();               
                 
                    int h = 0;
                    foreach (DataInfo option in langOptions)
                    {
                        if (!isStrNull(option.Url))
                        {
                            string url = option.Url.ToLower().Trim();
                            url = url.Replace("http://", "");
                            url = url.Replace("https://", "");
                            if (Right(url, 1) == "/") { url = Left(url, url.Length - 1); }
                            if (url == HOST)
                            {
                                h++;
                                lang = option.Code;
                            }
                        }
                    }

                    if (h == 1) { urlMath = true; }
                    else 
                    {
                        DataInfo option = (DataInfo)langOptions[0];
                        lang = option.Code;
                    }
                }

                if (!urlMath)
                {
                    if (!isStrNull(HttpContext.Current.Request.QueryString["lan"]))
                    {
                        lang = HttpContext.Current.Request.QueryString["lan"];
                    }
                    else if (!isStrNull(HttpContext.Current.Request.QueryString["lang"]))
                    {
                        lang = HttpContext.Current.Request.QueryString["lang"];
                    }
                    else if (!isStrNull(HttpContext.Current.Request.QueryString["nation"]))
                    {
                        lang = HttpContext.Current.Request.QueryString["nation"];
                    }
                }
             
            }
            catch (Exception)
            {
                Load();
                ArrayList langOptions = Options();                    
                foreach (DataInfo option in langOptions)
                {
                    lang = option.Code;
                    break;
                }
            }

            SaveLangCookie(lang, HOST);      
            return lang;
        }

        protected void SaveLangCookie(string LANG, string HOST)
        {
            HttpContext.Current.Response.Cookies[SC + "_clientWebLang"]["Language"] = LANG;
            HttpContext.Current.Response.Cookies[SC + "_clientWebLang"]["Host"] = HOST;
            HttpContext.Current.Response.Cookies[SC + "_clientWebLang"].HttpOnly = true;
            //HttpContext.Current.Response.Cookies[SC + "_clientWebLang"].Expires = Now().AddDays(1);
        }

        #endregion

        #region 取得GlobalResources

        public ResourceManager RM()
        {
            return RM(getNation());
        }

        public ResourceManager RM(string lang)
        {
            if (isStrNull(HttpContext.Current.Application[SC + lang + "RM"]))
            {
                HttpContext.Current.Application.Lock();
                HttpContext.Current.Application[SC + lang + "RM"] = new ResxResourceManager(lang, Server.MapPath("~/App_GlobalResources"));
                HttpContext.Current.Application.UnLock();
            }
               

            try
            {
                return (ResxResourceManager)HttpContext.Current.Application[SC + lang + "RM"];
            }
            catch (Exception ex)
            {
                HttpContext.Current.Application.Lock();
                HttpContext.Current.Application[SC + lang + "RM"] = null;
                HttpContext.Current.Application.UnLock();
                return new ResxResourceManager(lang, Server.MapPath("~/App_GlobalResources"));
            }
        }

        public class ResxResourceManager : System.Resources.ResourceManager
        {
            public ResxResourceManager(string baseName, string resourceDir)
            {
                Type[] paramTypes = new Type[] { typeof(string), typeof(string), typeof(Type) };
                object[] paramValues = new object[] { baseName, resourceDir, typeof(ResXResourceSet) };

                Type baseType = GetType().BaseType;

                ConstructorInfo ci = baseType.GetConstructor(
                    BindingFlags.Instance | BindingFlags.NonPublic,
                    null, paramTypes, null);

                ci.Invoke(this, paramValues);
            }

            protected override string GetResourceFileName(CultureInfo culture)
            {
                string resourceFileName = base.GetResourceFileName(culture);
                return resourceFileName.Replace(".resources", ".resx");
            }
        }

        #endregion

        #region 社群粉絲團多筆使用
        public class IntroCommunity
        {
            public string Name { get; set; }         //社群名稱
            public string url { get; set; }             //網址
            public string icon { get; set; }          //icon css

        }

        #endregion
    }
}
